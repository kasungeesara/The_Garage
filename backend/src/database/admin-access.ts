import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';

export async function promoteAdmin(pool: Pool, email: string): Promise<'promoted' | 'already-admin'> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize operator commands; the unique index also protects direct SQL writes.
    await client.query('SELECT pg_advisory_xact_lock(734902)');
    const target = (await client.query(
      "SELECT id, role FROM users WHERE email=$1 AND status='Active' FOR UPDATE",
      [email.trim().toLowerCase()],
    )).rows[0];
    if (!target) throw new Error('An active account is required');
    if (target.role === 'Admin') {
      await client.query('COMMIT');
      return 'already-admin';
    }
    const existing = await client.query("SELECT 1 FROM users WHERE role='Admin'");
    if (existing.rowCount) throw new Error('An administrator already exists. Only one admin account is allowed.');
    await client.query("UPDATE users SET role='Admin' WHERE id=$1", [target.id]);
    await client.query('INSERT INTO audit_logs(id,actor_id,action) VALUES($1,$2,$3)',
      [randomUUID(), target.id, 'Operator promoted account to Admin']);
    await client.query('DELETE FROM auth_sessions WHERE user_id=$1', [target.id]);
    await client.query('COMMIT');
    return 'promoted';
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { constraint?: string }).constraint === 'users_single_admin_idx') {
      throw new Error('An administrator already exists. Only one admin account is allowed.');
    }
    throw error;
  } finally {
    client.release();
  }
}
