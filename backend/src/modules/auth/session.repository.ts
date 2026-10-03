import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { environment } from '../../config/environment';
import { DatabaseService } from '../../database/database.service';
import type { PublicUser } from '../users/user.types';

@Injectable()
export class SessionRepository {
  constructor(private readonly db: DatabaseService) {}
  private hash(token: string) { return createHash('sha256').update(token).digest('hex'); }

  async create(userId: string, client?: PoolClient) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + environment().sessionDays * 86400000);
    const connection = client ?? this.db.pool;
    await connection.query('DELETE FROM auth_sessions WHERE expires_at <= now()');
    await connection.query('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)',
      [this.hash(token), userId, expiresAt]);
    return { token, expiresAt };
  }
  async findUser(token: unknown): Promise<PublicUser | undefined> {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return undefined;
    const result = await this.db.pool.query<PublicUser>(
      'SELECT u.id, u.email, u.name, u.phone, u.city, u.created_at AS "createdAt", u.role, u.status, u.email_verified AS "emailVerified" FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = $2',
      [this.hash(token), "Active"],
    );
    return result.rows[0];
  }
  async revoke(token: unknown) {
    if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
      await this.db.pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [this.hash(token)]);
    }
  }
}
