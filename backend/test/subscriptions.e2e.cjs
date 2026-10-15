require('reflect-metadata');require('dotenv').config({quiet:true});
const {test}=require('node:test');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const fs=require('node:fs');const {Pool}=require('pg');
const {environment}=require('../dist/config/environment');const {SubscriptionsService}=require('../dist/modules/subscriptions/subscriptions.service');
const {MarketplaceService}=require('../dist/modules/marketplace/marketplace.service');

test('verified subscription lifecycle, idempotency, expiry, seller choices and concurrent listing limits',async t=>{
 const schema='plans_test_'+randomUUID().replaceAll('-','');const admin=new Pool(environment().database);let db,created=false;
 try{
  await admin.query(`CREATE SCHEMA "${schema}"`);created=true;db=new Pool({...environment().database,options:'-c search_path='+schema});
  for(const f of fs.readdirSync('src/database/migrations').filter(f=>f.endsWith('.sql')).sort())await db.query(fs.readFileSync('src/database/migrations/'+f,'utf8'));
  const service=new SubscriptionsService({pool:db});const marketplace=new MarketplaceService({pool:db});
  const seller=randomUUID(),other=randomUUID();
  for(const id of [seller,other]){
   await db.query("INSERT INTO users(id,name,email,password_hash,phone,city,role) VALUES($1,'Test Seller',$2,'test','0771234567','Colombo','Seller')",[id,id+'@example.com']);
   await db.query("INSERT INTO stores(user_id,slug,name,city,description,type,phone,whatsapp) VALUES($1,$2,'Test Shop','Colombo','Vehicle spare parts shop','Business','0771234567','94771234567')",[id,'shop-'+id]);
  }
  const confirmed=(id,status='successful',extra={})=>service.recordVerifiedPayment(id,{provider:'test-only',paymentId:id,amountMinor:200000,currency:'LKR',status,...extra});
  const expiry=async()=>new Date((await db.query('SELECT shop_expires_at FROM stores WHERE user_id=$1',[seller])).rows[0].shop_expires_at).getTime();
  const listing=async(status='Published',owner=seller)=>{const id=randomUUID();await db.query('INSERT INTO listings(id,owner_id,slug,data,status) VALUES($1,$2,$3,$4,$5)',[id,owner,'part-'+id,{title:'Spare part',price:1000},status]);return id;};
  await t.test('free plan and missing gateway never charge or activate',async()=>{
   assert.equal((await service.status(seller)).plan,'Free');await assert.rejects(service.checkout(seller),/merchant gateway configuration/);
   assert.equal((await db.query('SELECT count(*)::int AS count FROM payment_orders')).rows[0].count,0);
  });
  await t.test('product review prices on the server, rejects unavailable and own listings, and cannot collect payment without configuration',async()=>{
   const id=await listing('Published',other);
   const quote=await service.productPreview(seller,id);assert.equal(quote.amountMinor,100000);assert.equal(quote.checkoutAvailable,false);
   await assert.rejects(service.productPreview(other,id),/own listing/);
   await assert.rejects(service.productCheckout(seller,id),/settlement configuration/);
   await db.query("UPDATE listings SET status='Sold' WHERE id=$1",[id]);await assert.rejects(service.productPreview(seller,id),/no longer available/);
   assert.equal((await db.query('SELECT count(*)::int AS count FROM payment_orders')).rows[0].count,0);
  });
  await t.test('legacy accounts without a paid expiry retain their oldest five and preserve excess data',async()=>{
   const legacy=randomUUID();
   await db.query("INSERT INTO users(id,name,email,password_hash,phone,city,role) VALUES($1,'Legacy Seller',$2,'test','0771234567','Colombo','Seller')",[legacy,legacy+'@example.com']);
   await db.query("INSERT INTO stores(user_id,slug,name,city,description,type,shop_expires_at) VALUES($1,$2,'Legacy Shop','Colombo','Preserved spare parts','Business',now()+interval '1 day')",[legacy,'shop-'+legacy]);
   const legacyIds=[];for(let i=0;i<6;i++){const id=await listing('Published',legacy);legacyIds.push(id);await db.query("UPDATE listings SET created_at=now()-interval '1 day'+($2*interval '1 minute') WHERE id=$1",[id,i]);}
   await db.query('UPDATE stores SET shop_expires_at=NULL,expiry_applied_at=NULL WHERE user_id=$1',[legacy]);
   const status=await service.status(legacy);assert.equal(status.plan,'Free');assert.equal(status.usage,5);assert.equal(status.expired,false);
   assert.deepEqual(status.listings.filter(l=>l.status==='Published').map(l=>l.id).sort(),legacyIds.slice(0,5).sort());assert.equal(status.listings.length,6);
  });
  const order=await service.createShopOrder(seller);
  await t.test('pending and failed payments do not activate; amount and currency checked',async()=>{
   assert.equal(order.amountMinor,200000);assert.equal(order.durationDays,30);
   await confirmed(order.id,'pending');assert.equal((await service.status(seller)).orders[0].status,'pending');assert.equal((await service.status(seller)).plan,'Free');
   await assert.rejects(confirmed(order.id,'successful',{amountMinor:1}),/does not match/);
   await assert.rejects(confirmed(order.id,'successful',{currency:'USD'}),/does not match/);
   await confirmed(order.id,'failed');assert.equal((await service.status(seller)).plan,'Free');assert.equal((await service.status(seller)).orders[0].status,'failed');
  });
  await t.test('verified success grants exactly 30 days and duplicate callbacks are safe',async()=>{
   const before=Date.now();await Promise.all([confirmed(order.id),confirmed(order.id)]);
   const end=await expiry();assert.ok(Math.abs(end-before-30*86400000)<3000);
   await confirmed(order.id,'failed');await confirmed(order.id,'pending');assert.equal(await expiry(),end);
   assert.equal((await service.status(seller)).plan,'Shop');assert.equal((await service.status(seller)).orders[0].status,'successful');
  });
  await t.test('early renewal extends existing expiry; transaction IDs cannot be reused',async()=>{
   const old=await expiry(),renew=await service.createShopOrder(seller);await confirmed(renew.id);
   assert.equal(await expiry(),old+30*86400000);
   const duplicate=await service.createShopOrder(seller);
   await assert.rejects(confirmed(duplicate.id,'successful',{paymentId:renew.id}),e=>e.code==='23505');assert.equal(await expiry(),old+30*86400000);
  });
  const ids=[];
  await t.test('Shop permits 100, Free permits 5, and simultaneous publications cannot exceed limits',async()=>{
   for(let i=0;i<99;i++)ids.push(await listing());
   const drafts=[await listing('Pending'),await listing('Pending')];
   const results=await Promise.allSettled(drafts.map(id=>db.query("UPDATE listings SET status='Published' WHERE id=$1",[id])));
   assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
   assert.equal(results.filter(r=>r.status==='rejected')[0].reason.code,'P0001');
   ids.push(drafts[results[0].status==='fulfilled'?0:1]);
   await assert.rejects(listing(),/limit reached/);
   for(let i=0;i<5;i++)await listing('Published',other);await assert.rejects(listing('Published',other),/limit reached/);
  });
  const chosen=ids.slice(-5);
  await t.test('expiry preserves data, honours chosen five and hides the public shop',async()=>{
   await service.chooseFreeListings(seller,{ids:chosen});
   await db.query("UPDATE stores SET shop_expires_at=now()-interval '1 minute' WHERE user_id=$1",[seller]);
   const status=await service.status(seller);assert.equal(status.plan,'Free');assert.equal(status.expired,true);assert.equal(status.usage,5);
   const active=(await db.query("SELECT id FROM listings WHERE owner_id=$1 AND status='Published'",[seller])).rows.map(r=>r.id).sort();assert.deepEqual(active,chosen.slice().sort());
   assert.equal((await db.query("SELECT count(*)::int AS count FROM listings WHERE owner_id=$1 AND status='Paused' AND paused_by_plan",[seller])).rows[0].count,95);
   const state=await marketplace.state();assert.equal(state.sellers.find(s=>s.slug==='shop-'+seller).shop_active,false);assert.equal(state.parts.filter(p=>p.seller==='shop-'+seller).length,5);
   await service.status(seller);assert.equal((await service.status(seller)).usage,5);
  });
  await t.test('seller can swap preserved listings but cannot select another seller or unmoderated listings',async()=>{
   await service.chooseFreeListings(seller,{ids:ids.slice(0,5)});assert.equal((await service.status(seller)).usage,5);
   await assert.rejects(service.chooseFreeListings(seller,{ids:ids.slice(0,6)}),/up to 5/);
   const foreign=(await db.query('SELECT id FROM listings WHERE owner_id=$1 LIMIT 1',[other])).rows[0].id;
   await assert.rejects(service.chooseFreeListings(seller,{ids:[foreign]}),/Choose your published/);
   await assert.rejects(service.chooseFreeListings(seller,{ids:[await listing('Draft')]}),/Choose your published/);
  });
  await t.test('renewal after expiry starts from confirmation and leaves paused listings intact',async()=>{
   const renew=await service.createShopOrder(seller),before=Date.now();await confirmed(renew.id);
   assert.ok(Math.abs(await expiry()-before-30*86400000)<3000);assert.equal((await service.status(seller)).plan,'Shop');
   assert.equal((await service.status(seller)).usage,5);
   await listing();assert.equal((await service.status(seller)).usage,6);
   await db.query("UPDATE stores SET shop_expires_at=now()-interval '1 second' WHERE user_id=$1",[seller]);await service.status(seller);assert.equal((await service.status(seller)).usage,5);
  });
 }finally{if(db)await db.end();if(created)await admin.query(`DROP SCHEMA "${schema}" CASCADE`);await admin.end();}
});
