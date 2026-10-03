import { Pool } from 'pg';
import { environment } from '../config/environment';
import { promoteAdmin } from './admin-access';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run admin:promote -- user@example.com');
  const pool = new Pool(environment().database);
  try {
    const result = await promoteAdmin(pool, email);
    console.log(result === 'already-admin'
      ? 'This account is already the administrator. No changes were made.'
      : 'Administrator role assigned. Sign in again.');
  } finally {
    await pool.end();
  }
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unable to promote account');
  process.exitCode = 1;
});
