require('reflect-metadata');
require('dotenv').config({ quiet: true });
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { NestFactory } = require('@nestjs/core');
const { Pool } = require('pg');
const { environment } = require('../dist/config/environment');
const { setup } = require('../dist/setup');

test('PostgreSQL authentication lifecycle', async () => {
  // An isolated schema is created and removed; application users are never touched.
  const schema = 'auth_test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool(environment().database);
  let app;
  let isolated;
  const previousOptions = process.env.PGOPTIONS;
  try {
    await admin.query('CREATE SCHEMA "' + schema + '"');
    process.env.PGOPTIONS = '-c search_path=' + schema;
    isolated = new Pool({ ...environment().database, options: process.env.PGOPTIONS });
    for (const file of require('node:fs').readdirSync('src/database/migrations').filter(f=>f.endsWith('.sql')).sort()) await isolated.query(readFileSync('src/database/migrations/'+file,'utf8')); 
    const { AppModule } = require('../dist/app.module');
    app = await NestFactory.create(AppModule, { logger: false });
    setup(app);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const call = async (path, body, cookie, extraHeaders = {}) => {
      const response = await fetch(base + '/api/auth/' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Garage-Client': 'web', Origin: environment().origin, ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, cookie: response.headers.get('set-cookie'), cache: response.headers.get('cache-control'), data: response.status === 204 ? null : await response.json() };
    };
    const data = { email: 'Test@example.com', password: 'correct-password-123', name: 'Test User', phone: '0771234567', city: 'Colombo' };
    assert.equal((await call('me')).status, 401);
    assert.equal((await call('signup', { ...data, role: 'admin' })).status, 400);
    assert.equal((await call('login', { email: data.email, password: data.password }, undefined, { Origin: 'https://evil.example' })).status, 403);
    const signup = await call('signup', data);
    assert.equal(signup.status, 201);
    assert.equal(signup.data.user.email, 'test@example.com');
    assert.equal(signup.data.user.passwordHash, undefined);
    assert.match(signup.cookie, /HttpOnly/i);
    assert.match(signup.cookie, /SameSite=Lax/i);
    assert.equal(signup.cache, 'no-store');
    const cookie = signup.cookie.split(';')[0];
    const stored = await isolated.query('SELECT password_hash FROM users');
    assert.notEqual(stored.rows[0].password_hash, data.password);
    const sessions = await isolated.query('SELECT token_hash FROM auth_sessions');
    assert.notEqual(sessions.rows[0].token_hash, cookie.split('=')[1]);
    assert.equal((await call('signup', data)).status, 409);
    assert.equal((await call('me', undefined, cookie)).status, 200);
    assert.equal((await call('login', { email: data.email, password: 'wrong-password' })).status, 401);
    assert.equal((await call('login', { email: 'missing@example.com', password: data.password })).status, 401);
    const login = await call('login', { email: ' TEST@example.com ', password: data.password }, cookie);
    assert.equal(login.status, 200);
    const currentCookie = login.cookie.split(';')[0];
    assert.notEqual(currentCookie, cookie);
    assert.equal((await call('me', undefined, cookie)).status, 401);
    assert.equal((await call('logout', {}, currentCookie)).status, 204);
    assert.equal((await call('me', undefined, currentCookie)).status, 401);
    const again = await call('login', { email: data.email, password: data.password });
    await isolated.query("UPDATE auth_sessions SET expires_at = now() - interval '1 second'");
    assert.equal((await call('me', undefined, again.cookie.split(';')[0])).status, 401);
    assert.equal((await call('me', undefined, 'garage_session=invalid')).status, 401);
    let last;
    for (let i = 0; i < 11; i++) last = await call('login', { email: data.email, password: 'wrong-password' });
    assert.equal(last.status, 429);
  } finally {
    if (app) await app.close();
    if (isolated) await isolated.end();
    if (previousOptions === undefined) delete process.env.PGOPTIONS;
    else process.env.PGOPTIONS = previousOptions;
    await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await admin.end();
  }
});
