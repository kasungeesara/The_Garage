import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { environment } from '../config/environment';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool(environment().database);
  constructor() {
    this.pool.on('error', () => Logger.error('Unexpected idle PostgreSQL connection error', 'Database'));
  }
  async onModuleInit() { await this.pool.query('SELECT 1'); }
  async onModuleDestroy() { await this.pool.end(); }
}
