import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';
import { passwordDigest } from './auth.service';
import { environment } from '../../config/environment';
import { email, object, text } from '../marketplace/validation';
// nodemailer is loaded at runtime; transport credentials never enter the frontend bundle.
const nodemailer = require('nodemailer') as {createTransport(options:object):{sendMail(options:object):Promise<unknown>}};
@Injectable()
export class AccountService implements OnModuleInit, OnModuleDestroy {
 private timer?:NodeJS.Timeout; private running=false;
 constructor(private readonly db:DatabaseService) {}
 onModuleInit() { this.timer=setInterval(()=>void this.deliver(),10000);this.timer.unref(); }
 onModuleDestroy() { if(this.timer) clearInterval(this.timer); }
 async request(body:unknown,purpose:'reset') {
  const d=object(body),address=email(d.email);
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   const user=(await c.query("SELECT * FROM users WHERE email=$1 AND status='Active' FOR UPDATE",[address])).rows[0];
   if(user) {
    const recent=await c.query('SELECT 1 FROM account_tokens WHERE user_id=$1 AND purpose=$2 AND expires_at>now()+interval \'14 minutes\'',[user.id,purpose]);
    if(!recent.rowCount) {
     const token=randomBytes(32).toString('hex');
     await c.query('DELETE FROM account_tokens WHERE user_id=$1 AND purpose=$2',[user.id,purpose]);
     await c.query("INSERT INTO account_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,$3,now()+interval '15 minutes')",[createHash('sha256').update(token).digest('hex'),user.id,purpose]);
     const url=`${environment().origin}/auth/reset-password#token=${token}`;
     await c.query('INSERT INTO mail_outbox(id,recipient,subject,body) VALUES($1,$2,$3,$4)',[randomUUID(),address,'Reset your AutoPart Hub password',`Open this link within 15 minutes:\n${url}\n\nIf you did not request this, ignore this email.`]);
    }
   }
   await c.query('COMMIT');return {message:'If the account is eligible, an email will arrive shortly.'};
  } catch(e) {await c.query('ROLLBACK');throw e;}finally {c.release();}
 }
 async changeEmail(userId:string,body:unknown) {
  const d=object(body),address=email(d.email);text(d.password,'password',1,128);
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   const user=(await c.query("SELECT * FROM users WHERE id=$1 AND status='Active' FOR UPDATE",[userId])).rows[0];
   if(!user || !await compare(passwordDigest(String(d.password)),user.password_hash))throw new BadRequestException('Current password is incorrect');
   if(user.email===address)throw new BadRequestException('Choose a different email address');
   if((await c.query('SELECT 1 FROM users WHERE email=$1',[address])).rowCount)throw new BadRequestException('This email address cannot be used');
   await c.query('UPDATE users SET email=$2,email_verified=false WHERE id=$1',[userId,address]);
   await c.query('DELETE FROM auth_sessions WHERE user_id=$1',[userId]);
   await c.query('DELETE FROM account_tokens WHERE user_id=$1',[userId]);
   await c.query('COMMIT');return {ok:true};
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 async consume(body:unknown,purpose:'reset') {
  const d=object(body),token=text(d.token,'token',64,64);
  let digest:string|undefined;
  if(purpose==='reset') {text(d.password,'password',8,128); if(typeof d.password!=='string'||d.password.length>128)throw new BadRequestException('Invalid password'); digest=await hash(passwordDigest(d.password),12);}
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   const t=(await c.query('DELETE FROM account_tokens WHERE token_hash=$1 AND purpose=$2 AND expires_at>now() RETURNING user_id,target_email',[createHash('sha256').update(token).digest('hex'),purpose])).rows[0];
   if(!t) throw new BadRequestException('This link is invalid or has expired. Request a new email.');
    await c.query('UPDATE users SET password_hash=$2 WHERE id=$1',[t.user_id,digest]);
    await c.query('DELETE FROM auth_sessions WHERE user_id=$1',[t.user_id]);
    await c.query('DELETE FROM account_tokens WHERE user_id=$1',[t.user_id]);
   await c.query('COMMIT');return {ok:true};
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 async deliver() {
  if(this.running||!process.env.SMTP_HOST) return;this.running=true;
  let c;
  try {
   c=await this.db.pool.connect();
   await c.query('BEGIN');
   const row=(await c.query('SELECT * FROM mail_outbox WHERE sent_at IS NULL AND attempts<8 AND available_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1')).rows[0];
   if(row) {
    try {
     const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT??587),secure:process.env.SMTP_SECURE==='true',requireTLS:environment().production,connectionTimeout:10000,socketTimeout:15000,...(process.env.SMTP_USER?{auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}}:{})});
     await transport.sendMail({disableFileAccess:true,disableUrlAccess:true,from:process.env.MAIL_FROM,to:row.recipient,subject:row.subject,text:row.body});
     await c.query("UPDATE mail_outbox SET sent_at=now(),body='' WHERE id=$1",[row.id]);
    }catch {await c.query("UPDATE mail_outbox SET attempts=attempts+1,available_at=now()+interval '5 minutes' WHERE id=$1",[row.id]);Logger.warn('Email delivery failed; queued for retry','Mail');}
   }
   await c.query('COMMIT');
  } catch {if(c)await c.query('ROLLBACK').catch(()=>{});Logger.error('Outbox processing failed','Mail');} finally{c?.release();this.running=false;}
 }
}
