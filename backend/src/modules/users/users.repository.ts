import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import type { UserRecord } from './user.types';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}
  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const result = await this.db.pool.query<UserRecord>(
      'SELECT id, email, name, phone, city, created_at AS "createdAt", role, status, email_verified AS "emailVerified", password_hash AS "passwordHash" FROM users WHERE email = $1', [email],
    );
    return result.rows[0];
  }
  async create(client: PoolClient, data: { email: string; name: string; phone: string; city: string }, passwordHash: string) {
    const result = await client.query<UserRecord>(
      'INSERT INTO users (id, email, password_hash, name, phone, city) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, name, phone, city, created_at AS "createdAt", role, status, email_verified AS "emailVerified", password_hash AS "passwordHash"',
      [randomUUID(), data.email, passwordHash, data.name, data.phone, data.city],
    );
    return result.rows[0];
  }
}
