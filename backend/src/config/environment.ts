import 'dotenv/config';

function integer(name: string, fallback: number, max: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Invalid ${name}`);
  return value;
}

export function environment() {
  const origin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
    throw new Error('FRONTEND_ORIGIN must be an origin without a trailing slash');
  }
  const production = process.env.NODE_ENV === 'production';
  if (production && url.protocol !== 'https:') throw new Error('Production requires HTTPS');
  if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD is required; configure backend/.env');
  if (production && (!process.env.SMTP_HOST || !process.env.MAIL_FROM || !process.env.VIEW_HASH_SECRET || process.env.VIEW_HASH_SECRET.length < 32)) throw new Error('Production requires SMTP_HOST, MAIL_FROM and a 32-character VIEW_HASH_SECRET');
  return {
    production, origin,
    port: integer('PORT', 4000, 65535),
    sessionDays: integer('SESSION_DAYS', 7, 30),
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: integer('DB_PORT', 5432, 65535),
      database: process.env.DB_NAME ?? 'garagedb',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD,
      max: 10, connectionTimeoutMillis: 5000, statement_timeout: 15000,
      ...(process.env.DB_SSL === "true" ? {ssl:{rejectUnauthorized:true,...(process.env.DB_SSL_CA?{ca:process.env.DB_SSL_CA.replace(/\\n/g,"\n")}: {})}} : {}),
    },
  };
}
