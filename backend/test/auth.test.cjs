require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { SignupDto } = require('../dist/modules/auth/dto/signup.dto');
const { LoginDto } = require('../dist/modules/auth/dto/login.dto');
const { OriginGuard } = require('../dist/common/guards/origin.guard');
const { passwordDigest } = require('../dist/modules/auth/auth.service');
const { hash, compare } = require('bcryptjs');
const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const valid = { email: ' TEST@example.com ', password: 'a-secure-password', name: 'Test User', phone: '0771234567', city: 'Colombo' };
const validate = (body, metatype = SignupDto) => pipe.transform(body, { type: 'body', metatype });

test('normalizes email and rejects invalid signup fields and injected properties', async () => {
  assert.equal((await validate(valid)).email, 'test@example.com');
  for (const fields of [{ password: 'short' }, { email: 'invalid' }, { name: ' ' }, { phone: 'abcdefghi' }, { city: '' }, { role: 'admin' }, { email: 12 }, { password: null }]) {
    await assert.rejects(validate({ ...valid, ...fields }));
  }
  await assert.rejects(validate({ email: 'test@example.com' }, LoginDto));
});
test('password digest preserves differences beyond bcrypt byte limit', async () => {
  const first = '🔥'.repeat(30) + 'a';
  const second = '🔥'.repeat(30) + 'b';
  const stored = await hash(passwordDigest(first), 4);
  assert.equal(await compare(passwordDigest(first), stored), true);
  assert.equal(await compare(passwordDigest(second), stored), false);
});
test('write requests reject missing CSRF header and foreign origins', () => {
  process.env.DB_PASSWORD ||= 'test-only';
  process.env.FRONTEND_ORIGIN = 'http://localhost:3000';
  const guard = new OriginGuard();
  const context = (headers) => ({ switchToHttp: () => ({ getRequest: () => ({ method: 'POST', get: key => headers[key] }) }) });
  assert.throws(() => guard.canActivate(context({})));
  assert.throws(() => guard.canActivate(context({ 'x-garage-client': 'web', origin: 'https://evil.example' })));
  assert.equal(guard.canActivate(context({ 'x-garage-client': 'web', origin: 'http://localhost:3000' })), true);
});
