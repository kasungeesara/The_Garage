import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';
import { UsersRepository } from '../users/users.repository';
import { publicUser } from '../users/user.types';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SessionRepository } from './session.repository';

// A fixed-length digest avoids bcrypt's 72-byte truncation for Unicode passwords.
export function passwordDigest(password: string) {
  return createHash('sha256').update(password, 'utf8').digest('base64');
}

@Injectable()
export class AuthService {
  private readonly dummyHash = hash(passwordDigest(randomBytes(32).toString('hex')), 12);
  constructor(
    private readonly db: DatabaseService,
    private readonly users: UsersRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async signup(data: SignupDto) {
    if (data.password.trim().length < 8) throw new BadRequestException('Password must contain at least 8 non-padding characters');
    const passwordHash = await hash(passwordDigest(data.password), 12);
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');
      const user = await this.users.create(client, data, passwordHash);
      const session = await this.sessions.create(user.id, client);
      await client.query('COMMIT');
      return { user: publicUser(user), session };
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string }).code === '23505') throw new ConflictException('An account with this email already exists');
      throw error;
    } finally { client.release(); }
  }

  async login(data: LoginDto) {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');
      const user = (await client.query<import('../users/user.types').UserRecord>(
        'SELECT id,email,name,phone,city,created_at AS "createdAt",password_hash AS "passwordHash",role,status,email_verified AS "emailVerified" FROM users WHERE email=$1 FOR UPDATE', [data.email],
      )).rows[0];
      const valid = await compare(passwordDigest(data.password), user?.passwordHash ?? await this.dummyHash);
      if (!user || !valid || user.status === 'Suspended') throw new UnauthorizedException('Invalid email or password');
      const session = await this.sessions.create(user.id, client);
      await client.query('COMMIT');
      return { user: publicUser(user), session };
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
}
