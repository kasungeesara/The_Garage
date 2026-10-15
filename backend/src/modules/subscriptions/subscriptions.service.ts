import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../database/database.service';
import { object, uuid } from '../marketplace/validation';

export const SHOP_AMOUNT_MINOR = 200000;
export const SHOP_DAYS = 30;

@Injectable()
export class SubscriptionsService {
 constructor(private readonly db:DatabaseService) {}
 async productPreview(userId:string,listingId:string) {
  await this.db.pool.query('SELECT expire_shop_plans()');
  const row=(await this.db.pool.query("SELECT l.id,l.owner_id,l.slug,l.data,s.name AS seller FROM listings l JOIN stores s ON s.user_id=l.owner_id JOIN users u ON u.id=l.owner_id WHERE l.id=$1 AND l.status='Published' AND l.deleted_at IS NULL AND u.status='Active'",[uuid(listingId)])).rows[0];
  if(!row)throw new NotFoundException('This part is no longer available');
  if(row.owner_id===userId)throw new BadRequestException('You cannot purchase your own listing');
  const price=Number(row.data.price);
  if(!Number.isFinite(price)||price<=0)throw new BadRequestException('This listing has no valid purchase price');
  return {id:row.id,slug:row.slug,title:row.data.title,seller:row.seller,image:row.data.images?.[0]??null,amountMinor:Math.round(price*100),currency:'LKR',checkoutAvailable:false};
 }
 async productCheckout(userId:string,listingId:string) {
  await this.productPreview(userId,listingId);
  throw new ServiceUnavailableException('Product payments are awaiting merchant gateway and seller settlement configuration. No charge has been made.');
 }
 async status(userId:string) {
  await this.db.pool.query('SELECT expire_shop_plans()');
  const store=(await this.db.pool.query('SELECT shop_expires_at FROM stores WHERE user_id=$1',[userId])).rows[0];
  if(!store) throw new ForbiddenException('Create your seller profile first');
  const expiry=store.shop_expires_at ? new Date(store.shop_expires_at) : null;
  const paid=!!expiry && expiry.getTime()>Date.now();
  const usage=(await this.db.pool.query("SELECT count(*)::int AS count FROM listings WHERE owner_id=$1 AND status='Published' AND deleted_at IS NULL",[userId])).rows[0].count;
  const orders=(await this.db.pool.query("SELECT id,status,amount_minor,currency,confirmed_at,created_at FROM payment_orders WHERE user_id=$1 AND purpose='shop' ORDER BY created_at DESC LIMIT 10",[userId])).rows;
  const listings=(await this.db.pool.query("SELECT id,data->>'title' AS title,status,keep_on_free,paused_by_plan FROM listings WHERE owner_id=$1 AND deleted_at IS NULL AND status IN ('Published','Paused') ORDER BY keep_on_free DESC,created_at,id",[userId])).rows;
  return {plan:paid?'Shop':'Free',limit:paid?100:5,usage,expiresAt:expiry?.toISOString()??null,remainingDays:paid?Math.ceil((expiry!.getTime()-Date.now())/86400000):0,expired:!!expiry&&!paid,checkoutAvailable:false,orders,listings};
 }
 async checkout(userId:string) {
  // A provider adapter must create hosted checkout and verify callbacks before this is enabled.
  await this.status(userId);
  throw new ServiceUnavailableException('Online payments are awaiting merchant gateway configuration. No charge has been made.');
 }
 async chooseFreeListings(userId:string,input:unknown) {
  const ids=object(input).ids;
  if(!Array.isArray(ids)||ids.length>5) throw new BadRequestException('Choose up to 5 listings');
  const selected=[...new Set(ids.map(uuid))];
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   const store=(await c.query('SELECT shop_expires_at FROM stores WHERE user_id=$1 FOR UPDATE',[userId])).rows[0];
   if(!store) throw new ForbiddenException('Create your seller profile first');
   const rows=await c.query("SELECT id FROM listings WHERE owner_id=$1 AND id=ANY($2::uuid[]) AND deleted_at IS NULL AND (status='Published' OR (status='Paused' AND paused_by_plan)) FOR UPDATE",[userId,selected]);
   if(rows.rowCount!==selected.length) throw new BadRequestException('Choose your published listings or listings paused by plan expiry');
   await c.query('UPDATE listings SET keep_on_free=(id=ANY($2::uuid[])) WHERE owner_id=$1',[userId,selected]);
   if(!store.shop_expires_at||new Date(store.shop_expires_at).getTime()<=Date.now()) {
    await c.query("UPDATE listings SET status='Paused',paused_by_plan=true,featured=false WHERE owner_id=$1 AND status='Published' AND NOT(id=ANY($2::uuid[]))",[userId,selected]);
    await c.query("UPDATE listings SET status='Published',paused_by_plan=false WHERE owner_id=$1 AND id=ANY($2::uuid[]) AND status='Paused' AND paused_by_plan",[userId,selected]);
   }
   await c.query('COMMIT');return {ok:true};
  } catch(e){await c.query('ROLLBACK');throw e;} finally{c.release();}
 }
 // Internal-only seam for a future gateway adapter. Never exposed as a browser API.
 async createShopOrder(userId:string) {
  const id=randomUUID();
  const r=await this.db.pool.query("INSERT INTO payment_orders(id,user_id,purpose,amount_minor,duration_days) SELECT $1,user_id,'shop',$3,$4 FROM stores JOIN users ON users.id=stores.user_id WHERE user_id=$2 AND users.status='Active' RETURNING id",[id,userId,SHOP_AMOUNT_MINOR,SHOP_DAYS]);
  if(!r.rowCount)throw new ForbiddenException('An active seller profile is required');
  return {id,amountMinor:SHOP_AMOUNT_MINOR,currency:'LKR',durationDays:SHOP_DAYS};
 }
 // Call only after the chosen gateway verifies signature, merchant, currency and amount.
 async recordVerifiedPayment(orderId:string,result:{provider:string;paymentId:string;amountMinor:number;currency:string;status:'successful'|'failed'|'pending'}) {
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   const owner=(await c.query('SELECT user_id FROM payment_orders WHERE id=$1',[uuid(orderId)])).rows[0];
   if(!owner)throw new NotFoundException('Payment order not found');
   await c.query('SELECT user_id FROM stores WHERE user_id=$1 FOR UPDATE',[owner.user_id]);
   const order=(await c.query('SELECT * FROM payment_orders WHERE id=$1 FOR UPDATE',[orderId])).rows[0];
   if(order.purpose!=='shop'||Number(order.amount_minor)!==result.amountMinor||order.currency!==result.currency||!result.paymentId||!result.provider)throw new BadRequestException('Payment does not match the order');
   if(order.status==='successful'){await c.query('COMMIT');return {ok:true};}
   if(result.status==='pending'){await c.query('COMMIT');return {ok:true};}
   await c.query('UPDATE payment_orders SET status=$2,provider=$3,provider_payment_id=$4,confirmed_at=CASE WHEN $2=\'successful\' THEN now() ELSE NULL END WHERE id=$1',[orderId,result.status,result.provider,result.paymentId]);
   if(result.status==='successful') {
    // PostgreSQL uses the confirmation time; late or repeated callbacks cannot backdate or double-extend.
    await c.query("UPDATE stores SET shop_expires_at=greatest(coalesce(shop_expires_at,now()),now())+interval '720 hours',expiry_applied_at=NULL WHERE user_id=$1",[order.user_id]);
   }
   await c.query('COMMIT');return {ok:true};
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
}
