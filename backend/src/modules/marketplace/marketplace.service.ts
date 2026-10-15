import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import type { PublicUser } from '../users/user.types';
import { bool, choice, email, object, slug, text, uuid } from './validation';

@Injectable()
export class MarketplaceService {
 constructor(private readonly db: DatabaseService) {}
 async state(user?: PublicUser) {
  await this.db.pool.query('SELECT expire_shop_plans()');
  const id = user?.id ?? null, admin = user?.role === 'Admin';
  const client = await this.db.pool.connect();
  try {
   await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
   const q = async (sql: string, args: unknown[] = []) => (await client.query(sql, args)).rows;
   const parts = await q(`SELECT l.data || jsonb_build_object('id',l.id,'slug',l.slug,'seller',s.slug,'status',l.status,'featured',l.featured,'views',(SELECT count(*)::int FROM listing_views v WHERE v.listing_id=l.id)) AS data FROM listings l JOIN stores s ON s.user_id=l.owner_id JOIN users u ON u.id=l.owner_id WHERE l.deleted_at IS NULL AND ($2 OR l.owner_id=$1 OR (l.status IN ('Published','Sold') AND u.status='Active')) ORDER BY l.created_at DESC`,[id,admin]);
   const stores = await q(`SELECT s.slug,s.name,s.city,s.description,s.type,s.phone,s.whatsapp,s.logo,(s.shop_expires_at>now()) AS shop_active,s.verification='Approved' AS verified,extract(year FROM s.created_at)::text AS since,coalesce((SELECT round(avg(r.rating),1)::text FROM reviews r WHERE r.seller_id=s.user_id),'—') AS rating FROM stores s JOIN users u ON u.id=s.user_id WHERE u.status='Active'`);
   const own = id ? (await q('SELECT slug,name,city,description,type,reference,phone,whatsapp,logo FROM stores WHERE user_id=$1',[id]))[0] : null;
   const enquiries = id ? await q(`SELECT e.id,e.listing_id AS "partId",e.buyer_id AS "buyerId",e.seller_id AS "sellerId",l.data->>'title' AS subject,e.status,coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'text',m.text,'from',CASE WHEN m.author_id=e.seller_id THEN 'Seller' ELSE 'You' END,'time',m.created_at) ORDER BY m.created_at,m.id) FROM messages m WHERE m.enquiry_id=e.id),'[]') AS messages FROM enquiries e JOIN listings l ON l.id=e.listing_id WHERE e.buyer_id=$1 OR e.seller_id=$1 ORDER BY e.created_at DESC`,[id]) : [];
   const reviews = await q(`SELECT r.id,s.slug AS seller,r.author_id AS "authorId",u.name,r.rating,r.text,r.reply FROM reviews r JOIN stores s ON s.user_id=r.seller_id JOIN users u ON u.id=r.author_id JOIN users seller ON seller.id=s.user_id WHERE seller.status='Active' ORDER BY r.created_at DESC`);
   const result = {
    user: user ?? null, parts:parts.map(r=>r.data), sellers:stores.map(s=>({...s,initials:s.name.split(' ').map((n:string)=>n[0]).slice(0,2).join('')})),
    store:own ?? {slug:'',name:'',city:'Colombo',description:'',type:'Business',reference:''},
    articles:(await q(`SELECT data || jsonb_build_object('id',id,'slug',slug,'status',status,'date',to_char(created_at,'DD Mon YYYY')) AS data FROM articles WHERE status='Published' OR $1 ORDER BY created_at DESC`,[admin])).map(r=>r.data),
    favourites:id?(await q('SELECT listing_id FROM favourites WHERE user_id=$1',[id])).map(r=>r.listing_id):[],
    recent:id?(await q('SELECT listing_id FROM recent_views WHERE user_id=$1 ORDER BY viewed_at DESC LIMIT 20',[id])).map(r=>r.listing_id):[],
    enquiries,reviews,
    notifications:id?await q('SELECT id,text,read FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[id]):[],
    reports:id?await q(`SELECT r.id,r.listing_id AS "partId",l.data->>'title' AS subject,r.reason,r.status FROM reports r JOIN listings l ON l.id=r.listing_id WHERE $2 OR r.reporter_id=$1 ORDER BY r.created_at DESC`,[id,admin]):[],
    users:admin?await q('SELECT id,name,email,role,status FROM users ORDER BY created_at DESC'):[],
    verifications:id?await q(`SELECT user_id AS id,name,city,reference,verification AS status,review_note AS note FROM stores WHERE $2 OR user_id=$1`,[id,admin]):[],
    audit:admin?await q('SELECT id,action,created_at AS time FROM audit_logs ORDER BY created_at DESC LIMIT 500'):[],
    contacts:admin?await q('SELECT id,name,email,topic,message,status,created_at AS time FROM contacts ORDER BY created_at DESC'):[],
    references:Object.fromEntries((await q('SELECT kind,items FROM reference_data')).map(r=>[r.kind,r.items])),
    preferences:id?(await q('SELECT preferences FROM users WHERE id=$1',[id]))[0].preferences:{email:false,enquiries:true},
    verifiedEmail:user?.emailVerified ?? false,
    analytics:id?await q(`SELECT v.day::text AS day,count(*)::int AS views FROM listing_views v JOIN listings l ON l.id=v.listing_id WHERE v.day>=CURRENT_DATE-29 AND ($2 OR l.owner_id=$1) GROUP BY v.day ORDER BY v.day`,[id,admin]):[],
   };
   await client.query('COMMIT'); return result;
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
 }
 private admin(user: PublicUser) { if(user.role!=='Admin') throw new ForbiddenException('Administrator access required'); }
 private async listing(c:PoolClient,id:unknown,user?:PublicUser,own=false) {
  const row=(await c.query('SELECT * FROM listings WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[uuid(id)])).rows[0];
  if(!row) throw new NotFoundException('Listing not found');
  if(own && row.owner_id!==user?.id) throw new ForbiddenException('This listing belongs to another seller');
  if(!own && user?.role!=='Admin' && row.owner_id!==user?.id && !['Published','Sold'].includes(row.status)) throw new NotFoundException('Listing not found');
  return row;
 }
 private async notify(c:PoolClient,userId:string,message:string) {
  await c.query(`INSERT INTO notifications(id,user_id,text) SELECT $1,id,$3 FROM users WHERE id=$2 AND (preferences->>'enquiries')::boolean`,[randomUUID(),userId,message]);
  await c.query(`INSERT INTO mail_outbox(id,recipient,subject,body) SELECT $1,email,'AutoPart Hub notification',$3 FROM users WHERE id=$2 AND (preferences->>'email')::boolean`,[randomUUID(),userId,message]);
 }
 async command(user:PublicUser|undefined,input:unknown) {
  if(!user) throw new UnauthorizedException('Please sign in');
  const b=object(input), action=text(b.action,'action',1,60), d=object(b.data ?? {});
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   // Serialise commands by actor; ownership and workflow checks run within this transaction.
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user.id]);
   const actor=(await c.query('SELECT role,status,email_verified FROM users WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
   if(!actor || actor.status!=='Active') throw new UnauthorizedException('Please sign in');
   user={...user,role:actor.role,emailVerified:actor.email_verified};
   // Lock seller before any listing row, consistently with subscription updates.
   const owner=action.startsWith('admin.listing') ? (await c.query('SELECT owner_id FROM listings WHERE id=$1',[uuid(d.id)])).rows[0]?.owner_id : user.id;
   if(owner) await c.query('SELECT user_id FROM stores WHERE user_id=$1 FOR UPDATE',[owner]);
   switch(action) {
    case 'profile.save': {
     await c.query('UPDATE users SET name=$2,phone=$3,city=$4 WHERE id=$1',[user.id,text(d.name,'name',2),text(d.phone,'phone',7,25),text(d.city,'city',2)]);
     if(d.email && email(d.email)!==user.email) throw new BadRequestException('Email changes require a new verified account address; contact support');
     break;
    }
    case 'preferences.save': await c.query('UPDATE users SET preferences=$2 WHERE id=$1',[user.id,{email:bool(d.email),enquiries:bool(d.enquiries)}]); break;
    case 'store.save': {
     const name=text(d.name,'store name',2),city=text(d.city,'city',2),description=text(d.description,'description',20,3000),type=choice(d.type,['Business','Individual']);
     const own=(await c.query('SELECT * FROM stores WHERE user_id=$1',[user.id])).rows[0];
     const reference=text(d.reference ?? own?.reference,'business / identity reference',3,200);
     await c.query(`INSERT INTO stores(user_id,slug,name,city,description,type,reference) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id) DO UPDATE SET name=$3,city=$4,description=$5,type=$6,reference=$7,verification=CASE WHEN stores.name<>$3 OR stores.reference<>$7 OR stores.type<>$6 THEN 'Pending' ELSE stores.verification END`,[user.id,own?.slug ?? `store-${randomUUID()}`,name,city,description,type,reference]);
     const phone=text(d.phone ?? own?.phone ?? user.phone ?? '', 'phone', 0,25),whatsapp=text(d.whatsapp ?? own?.whatsapp ?? phone,'WhatsApp',0,25).replace(/[^+0-9]/g,'').replace(/^0/,'94'),logo=text(d.logo ?? own?.logo ?? '', 'logo',0,100);
     for(const number of [phone,whatsapp]) if(number && !/^\+?[0-9 ()-]{7,25}$/.test(number))throw new BadRequestException('Enter a valid phone or WhatsApp number');
     if(whatsapp && !/^\+?[1-9][0-9]{7,14}$/.test(whatsapp))throw new BadRequestException('Use an international WhatsApp number, e.g. 94771234567');
     if(logo) {
      const match=logo.match(/^\/api\/media\/([a-f0-9-]{36})$/);
      if(!match||!(await c.query('SELECT 1 FROM media WHERE id=$1 AND owner_id=$2',[uuid(match[1]),user.id])).rowCount)throw new BadRequestException('Upload your own shop logo');
     }
     await c.query('UPDATE stores SET phone=$2,whatsapp=$3,logo=$4 WHERE user_id=$1',[user.id,phone,whatsapp,logo]);
     await c.query("UPDATE users SET role='Seller' WHERE id=$1 AND role='Customer'",[user.id]); break;
    }
    case 'verification.request': {
     const r=await c.query("UPDATE stores SET verification='Pending',review_note='' WHERE user_id=$1 RETURNING user_id",[user.id]); if(!r.rowCount) throw new BadRequestException('Create your seller profile first'); break;
    }
    case 'listing.save': {
     const store=(await c.query('SELECT * FROM stores WHERE user_id=$1',[user.id])).rows[0];
     if(!store) throw new ForbiddenException('A seller profile is required');
     const id=uuid(d.id), existing=(await c.query('SELECT * FROM listings WHERE id=$1 FOR UPDATE',[id])).rows[0];
     if(existing && (existing.owner_id!==user.id || existing.deleted_at)) throw new ForbiddenException('Listing is not editable');
     const status=choice(d.status,['Draft','Pending']);
     const data:Record<string,unknown>={title:text(d.title,'title',3,160)};
     for(const key of ['category','brand','model','year','fuel','transmission','condition','city','description']) data[key]=text(d[key]??'',key,status==='Draft'?0:1,key==='description'?6000:100);
     const price=Number(d.price); if(!Number.isFinite(price)||price<0||price>1e10||(status==='Pending'&&price<=0)) throw new BadRequestException('Invalid price'); data.price=price;
     if(status==='Pending') {
      if(!/^\d{4}[–-]\d{4}$/.test(String(data.year))||Number(String(data.year).slice(0,4))>Number(String(data.year).slice(-4))) throw new BadRequestException('Invalid year range');
      for(const [key,kind] of [['category','Categories'],['brand','Brands'],['city','Locations']]) {
       const ref=(await c.query('SELECT items FROM reference_data WHERE kind=$1',[kind])).rows[0];
       if(!ref.items.includes(data[key])) throw new BadRequestException(`Choose an available ${key}`);
      }
     }
     if(!Array.isArray(d.images)||d.images.length>10||(status==='Pending'&&!d.images.length)) throw new BadRequestException('Add 1–10 listing photos');
     for(const image of d.images) {
      const match=typeof image==='string'&&image.match(/^\/api\/media\/([a-f0-9-]{36})$/);
      if(!match || !(await c.query('SELECT 1 FROM media WHERE id=$1 AND owner_id=$2',[uuid(match[1]),user.id])).rowCount) throw new BadRequestException('Upload your listing photos first');
     }
     data.images=d.images;
     await c.query(`INSERT INTO listings(id,owner_id,slug,data,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET data=$4,status=$5,featured=false,updated_at=now()`,[id,user.id,existing?.slug ?? `${slug(d.slug)}-${id.slice(0,8)}`,data,status]); break;
    }
    case 'listing.status': {
     const row=await this.listing(c,d.id,user,true),status=choice(d.status,['Paused','Published','Sold','Archived','Pending']);
     const allowed:Record<string,string[]>={Published:['Paused','Sold','Archived','Pending'],Paused:['Pending','Archived','Sold'],Sold:['Archived'],Draft:['Archived'],Pending:['Archived'],Rejected:['Archived'],Archived:['Pending']};
     // Resuming or renewing always re-enters moderation.
     const target=status==='Published'?'Pending':status;
     if(!allowed[row.status]?.includes(target)) throw new BadRequestException('Invalid listing status transition');
     await c.query('UPDATE listings SET status=$2,featured=false,updated_at=now() WHERE id=$1',[row.id,target]);break;
    }
    case 'listing.delete': { const row=await this.listing(c,d.id,user,true); await c.query('UPDATE listings SET deleted_at=now(),featured=false WHERE id=$1',[row.id]);await c.query('DELETE FROM favourites WHERE listing_id=$1',[row.id]);await c.query('DELETE FROM recent_views WHERE listing_id=$1',[row.id]);break; }
    case 'favourite.set': {
     const row=await this.listing(c,d.id,user);
     if(bool(d.saved)) await c.query('INSERT INTO favourites VALUES($1,$2) ON CONFLICT DO NOTHING',[user.id,row.id]);
     else await c.query('DELETE FROM favourites WHERE user_id=$1 AND listing_id=$2',[user.id,row.id]); break;
    }
    case 'recent.add': {
     const row=await this.listing(c,d.id,user);
     await c.query('INSERT INTO recent_views VALUES($1,$2,now()) ON CONFLICT(user_id,listing_id) DO UPDATE SET viewed_at=now()',[user.id,row.id]); break;
    }
    case 'recent.clear': await c.query('DELETE FROM recent_views WHERE user_id=$1',[user.id]);break;
    case 'enquiry.create': {
     const row=await this.listing(c,d.partId,user); if(row.status!=='Published'||row.owner_id===user.id) throw new BadRequestException('Choose an available listing from another seller');
     const id=uuid(d.id);
     await c.query('INSERT INTO enquiries(id,listing_id,buyer_id,seller_id) VALUES($1,$2,$3,$4)',[id,row.id,user.id,row.owner_id]);
     await c.query('INSERT INTO messages(id,enquiry_id,author_id,text) VALUES($1,$2,$3,$4)',[randomUUID(),id,user.id,text(d.text,'message',10,5000)]);
     await this.notify(c,row.owner_id,`New enquiry: ${row.data.title}`); break;
    }
    case 'enquiry.reply': case 'enquiry.status': {
     const row=(await c.query('SELECT * FROM enquiries WHERE id=$1 FOR UPDATE',[uuid(d.id)])).rows[0];
     if(!row || ![row.buyer_id,row.seller_id].includes(user.id)) throw new NotFoundException('Conversation not found');
     const isSeller=row.seller_id===user.id;
     if(action==='enquiry.status') await c.query('UPDATE enquiries SET status=$2 WHERE id=$1',[row.id,choice(d.status,['New','Read','Replied','Closed'])]);
     else {
      if(row.status==='Closed') throw new BadRequestException('Reopen the conversation before replying');
      await c.query('INSERT INTO messages(id,enquiry_id,author_id,text) VALUES($1,$2,$3,$4)',[randomUUID(),row.id,user.id,text(d.text,'message',1,5000)]);
      await c.query('UPDATE enquiries SET status=$2 WHERE id=$1',[row.id,isSeller?'Replied':'New']);
      await this.notify(c,isSeller?row.buyer_id:row.seller_id,'You have a new enquiry reply.');
     } break;
    }
    case 'review.create': {
     const seller=(await c.query("SELECT user_id FROM stores WHERE slug=$1 AND verification='Approved'",[slug(d.seller)])).rows[0];
     if(!seller||seller.user_id===user.id||!(await c.query("SELECT 1 FROM enquiries e WHERE buyer_id=$1 AND seller_id=$2 AND EXISTS(SELECT 1 FROM messages m WHERE m.enquiry_id=e.id AND m.author_id=e.seller_id)",[user.id,seller.user_id])).rowCount) throw new ForbiddenException('Review a verified seller after they reply to your enquiry');
     const rating=Number(d.rating); if(!Number.isInteger(rating)||rating<1||rating>5) throw new BadRequestException('Invalid rating');
     await c.query('INSERT INTO reviews(id,seller_id,author_id,rating,text) VALUES($1,$2,$3,$4,$5)',[uuid(d.id),seller.user_id,user.id,rating,text(d.text,'review',15,3000)]);break;
    }
    case 'review.reply': {
     const r=await c.query('UPDATE reviews SET reply=$3 WHERE id=$1 AND seller_id=$2 RETURNING id',[uuid(d.id),user.id,text(d.reply,'reply',5,3000)]);if(!r.rowCount) throw new NotFoundException('Review not found');break;
    }
    case 'notification.read': {
     if(d.id==='all') await c.query('UPDATE notifications SET read=true WHERE user_id=$1',[user.id]);
     else await c.query('UPDATE notifications SET read=$3 WHERE id=$1 AND user_id=$2',[uuid(d.id),user.id,bool(d.read)]);break;
    }
    case 'report.create': {
     const row=await this.listing(c,d.partId,user);
     await c.query('INSERT INTO reports(id,reporter_id,listing_id,reason) VALUES($1,$2,$3,$4)',[uuid(d.id),user.id,row.id,text(d.reason,'reason',5,2000)]);break;
    }
    case 'admin.listing': {
     this.admin(user);const row=await this.listing(c,d.id,user),status=choice(d.status,['Published','Rejected']);
     if(!['Pending','Published'].includes(row.status)) throw new BadRequestException('Listing is not awaiting moderation');
     const note=text(d.note??'', 'moderation note',status==='Rejected'?5:0,2000);
     await c.query('UPDATE listings SET status=$2,moderation_note=$3,featured=false,updated_at=now() WHERE id=$1',[row.id,status,note]);
     await this.notify(c,row.owner_id,`${status}: ${row.data.title}${note?' — '+note:''}`);break;
    }
    case 'admin.feature': this.admin(user); await c.query("UPDATE listings SET featured=$2 WHERE id=$1 AND status='Published' AND deleted_at IS NULL",[uuid(d.id),bool(d.featured)]);break;
    case 'admin.user': {
     this.admin(user);const id=uuid(d.id); if(id===user.id) throw new BadRequestException('You cannot suspend yourself');
     const status=choice(d.status,['Active','Suspended']);
     const r=await c.query("UPDATE users SET status=$2 WHERE id=$1 AND role<>'Admin' RETURNING id",[id,status]);if(!r.rowCount) throw new BadRequestException('Administrator accounts must be managed by an operator');
     if(status==='Suspended') await c.query('DELETE FROM auth_sessions WHERE user_id=$1',[id]);break;
    }
    case 'admin.verification': {
     this.admin(user); const id=uuid(d.id),status=choice(d.status,['Approved','Rejected']),note=text(d.note,'review note',5,2000);
     const r=await c.query('UPDATE stores SET verification=$2,review_note=$3 WHERE user_id=$1 RETURNING user_id',[id,status,note]);if(!r.rowCount) throw new NotFoundException('Seller not found');
     await this.notify(c,id,`Seller verification ${status.toLowerCase()}: ${note}`);break;
    }
    case 'admin.report': this.admin(user);await c.query('UPDATE reports SET status=$2,note=$3 WHERE id=$1',[uuid(d.id),choice(d.status,['Resolved','Dismissed']),text(d.note,'resolution note',5,2000)]);break;
    case 'admin.article.save': {
     this.admin(user);const id=uuid(d.id),data={title:text(d.title,'title',3,200),category:text(d.category,'category',2),excerpt:text(d.excerpt,'excerpt',10,500),body:text(d.body,'body',20,50000),featured:bool(d.featured)};
     await c.query('INSERT INTO articles(id,slug,data,status) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET slug=$2,data=$3,status=$4',[id,slug(d.slug),data,choice(d.status,['Draft','Published'])]);break;
    }
    case 'admin.article.delete': this.admin(user);await c.query('DELETE FROM articles WHERE id=$1',[uuid(d.id)]);break;
    case 'admin.references': {
     this.admin(user);const kind=choice(d.kind,['Categories','Brands','Models','Locations']);
     if(!Array.isArray(d.items)||d.items.length<1||d.items.length>500) throw new BadRequestException('Provide 1–500 reference values');
     const items=[...new Set(d.items.map(v=>text(v,'reference value',1)))];
     await c.query('UPDATE reference_data SET items=$2 WHERE kind=$1',[kind,JSON.stringify(items)]);break;
    }
    case 'admin.contact': this.admin(user);await c.query('UPDATE contacts SET status=$2 WHERE id=$1',[uuid(d.id),choice(d.status,['Open','Resolved'])]);break;
    default: throw new BadRequestException('Unknown action');
   }
   if(action.startsWith('admin.')) await c.query('INSERT INTO audit_logs(id,actor_id,action) VALUES($1,$2,$3)',[randomUUID(),user.id,`${action}: ${d.id??d.kind??''}${d.status?' → '+d.status:''}${d.note?' — '+text(d.note,'note',0,2000):''}`]);
   await c.query('COMMIT');return {ok:true};
  } catch(error) {
   await c.query('ROLLBACK');
   if((error as {code?:string}).code==='P0001') throw new BadRequestException((error as Error).message);
   if((error as {code?:string}).code==='23505') throw new ConflictException('This record already exists');
   if((error as {code?:string}).code==='23503') throw new BadRequestException('Referenced record does not exist');
   throw error;
  } finally { c.release(); }
 }
}
