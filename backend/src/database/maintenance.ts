import {Pool} from 'pg';
import {environment} from '../config/environment';
async function main(){const pool=new Pool(environment().database);try{
 await pool.query('SELECT expire_shop_plans()');
 await pool.query('DELETE FROM rate_limits WHERE expires_at<now() AND (blocked_until IS NULL OR blocked_until<now())');
 await pool.query('DELETE FROM auth_sessions WHERE expires_at<now()');
 await pool.query('DELETE FROM account_tokens WHERE expires_at<now()');
 await pool.query("DELETE FROM mail_outbox WHERE (sent_at IS NOT NULL AND sent_at<now()-interval '30 days') OR (sent_at IS NULL AND created_at<now()-interval '7 days')");
 await pool.query("DELETE FROM media m WHERE m.created_at<now()-interval '7 days' AND NOT EXISTS(SELECT 1 FROM listings l WHERE l.data->'images' ? ('/api/media/'||m.id::text)) AND NOT EXISTS(SELECT 1 FROM stores s WHERE s.logo=('/api/media/'||m.id::text))");
 const failed=await pool.query('SELECT count(*) FROM mail_outbox WHERE sent_at IS NULL AND attempts>=8');console.log('Maintenance complete; failed email jobs:',failed.rows[0].count);
}finally{await pool.end();}}
main().catch(()=>{console.error('Maintenance failed');process.exitCode=1;});
