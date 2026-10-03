import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import { environment } from '../config/environment';

async function migrate() {
  const pool = new Pool(environment().database);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(734901)');
    await client.query('CREATE TABLE IF NOT EXISTS garage_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    const directory = join(__dirname, 'migrations');
    for (const name of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
      const applied = await client.query('SELECT 1 FROM garage_migrations WHERE name = $1', [name]);
      if (applied.rowCount) continue;
      await client.query(await readFile(join(directory, name), 'utf8'));
      await client.query('INSERT INTO garage_migrations (name) VALUES ($1)', [name]);
      console.log(`Applied ${name}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
migrate().catch(() => {
  console.error('Migration failed. Check PostgreSQL connectivity, credentials and schema conflicts.');
  process.exitCode = 1;
});
