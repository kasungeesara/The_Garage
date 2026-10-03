import type {ThrottlerStorage} from '@nestjs/throttler';
import {DatabaseService} from './database.service';
export class PostgresRateLimitStorage implements ThrottlerStorage {
 constructor(private readonly db:DatabaseService){}
 async increment(key:string,ttl:number,limit:number,blockDuration:number){
  const c=await this.db.pool.connect();
  try{
   await c.query('BEGIN');
   await c.query(`INSERT INTO rate_limits(key,hits,expires_at) VALUES($1,0,now()+$2*interval '1 millisecond') ON CONFLICT DO NOTHING`,[key,ttl]);
   const row=(await c.query('SELECT *,now() AS current_time FROM rate_limits WHERE key=$1 FOR UPDATE',[key])).rows[0];
   const now=new Date(row.current_time).getTime();let hits=row.hits,expiry=new Date(row.expires_at).getTime(),blocked=row.blocked_until?new Date(row.blocked_until).getTime():0;
   if(blocked<=now){if(expiry<=now||blocked){hits=0;expiry=now+ttl;blocked=0;}hits++;if(hits>limit)blocked=now+blockDuration;}
   await c.query('UPDATE rate_limits SET hits=$2,expires_at=$3,blocked_until=$4 WHERE key=$1',[key,hits,new Date(expiry),blocked?new Date(blocked):null]);
   await c.query('COMMIT');return {totalHits:hits,timeToExpire:Math.max(0,Math.ceil((expiry-now)/1000)),isBlocked:blocked>now,timeToBlockExpire:Math.max(0,Math.ceil((blocked-now)/1000))};
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
}
