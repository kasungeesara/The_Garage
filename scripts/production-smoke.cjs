/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner loads isolated backend dependencies. */
/* Isolated PostgreSQL + real Nest API + production Next.js + browser journeys. */
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');const {randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..');require(root+'/backend/node_modules/dotenv').config({path:root+'/backend/.env',quiet:true});
const {Pool}=require(root+'/backend/node_modules/pg');const {environment}=require(root+'/backend/dist/config/environment');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function main(){
 const schema='browser_test_'+randomUUID().replaceAll('-','');const pool=new Pool(environment().database);let db,browser,backend,frontend,created=false;
 try{
  await pool.query(`CREATE SCHEMA "${schema}"`);created=true;db=new Pool({...environment().database,options:'-c search_path='+schema});
  for(const f of fs.readdirSync(root+'/backend/src/database/migrations').filter(f=>f.endsWith('.sql')).sort())await db.query(fs.readFileSync(root+'/backend/src/database/migrations/'+f,'utf8'));
  const origin='http://localhost:3127';const env={...process.env,NODE_ENV:'development',PORT:'4127',PGOPTIONS:'-c search_path='+schema,FRONTEND_ORIGIN:origin,SMTP_HOST:''};
  backend=spawn(process.execPath,['dist/main.js'],{cwd:root+'/backend',env,stdio:'ignore'});
  frontend=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3127'],{cwd:root,env:{...process.env,BACKEND_URL:'http://127.0.0.1:4127',NEXT_DIST_DIR:'.next-smoke'},stdio:'ignore'});
  for(let i=0;i<60;i++){try{const r=await fetch(origin+'/api/health');if(r.ok)break;}catch{}if(i===59)throw new Error('Servers did not start; run npm run test:browser:build first');await new Promise(r=>setTimeout(r,500));}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const sellerContext=await browser.newContext();const seller=await sellerContext.newPage();const errors=[];seller.on('pageerror',e=>errors.push(e.message));
  await seller.goto(origin+'/auth/register');await seller.getByLabel('Full name').fill('Browser Seller');await seller.getByLabel('Email address').fill('browser-seller@example.com');await seller.getByLabel('Password',{exact:true}).fill('browser-password-123');await seller.getByLabel('Phone',{exact:true}).fill('0771234567');await seller.getByRole('checkbox').check();await seller.getByRole('button',{name:'Create account',exact:true}).click();await seller.waitForURL('**/dashboard');
  console.log('PASS: browser registration');
  const account=(await db.query("SELECT * FROM users WHERE email='browser-seller@example.com'")).rows[0];assert(account);
  assert.equal(account.email_verified,false);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM mail_outbox WHERE recipient=$1',[account.email])).rows[0].count,0);
  await seller.goto(origin+'/sell');await seller.getByLabel('Store / display name').fill('Browser Parts Store');await seller.getByLabel('About your store').fill('Quality vehicle parts with clear fitment advice.');await seller.getByLabel('Business registration / identity reference').fill('BUSINESS-123');await seller.getByRole('checkbox').check();await seller.getByRole('button',{name:'Create seller profile'}).click();await seller.waitForURL('**/seller');
  await seller.reload();await seller.getByRole('heading',{name:'Let’s keep things moving.'}).waitFor();assert.equal((await db.query('SELECT role FROM users WHERE id=$1',[account.id])).rows[0].role,'Seller');
  await seller.goto(origin+'/seller/listings/new');await seller.getByLabel('Listing title').fill('Browser brake pads');await seller.getByLabel('Description',{exact:true}).fill('New brake pads compatible with Toyota Prius.');await seller.getByLabel('Price (LKR)').fill('18500');await seller.getByRole('button',{name:'Continue →'}).click();
  await seller.getByLabel('Vehicle model',{exact:true}).fill('Prius');await seller.getByRole('button',{name:'Continue →'}).click();
  const sharp=require(root+'/backend/node_modules/sharp');const photo=await sharp({create:{width:40,height:40,channels:3,background:'#eab308'}}).png().toBuffer();await seller.locator('input[type=file]').setInputFiles({name:'part.png',mimeType:'image/png',buffer:photo});await seller.getByRole('button',{name:'Continue →'}).click();await seller.getByRole('checkbox').check();await seller.getByRole('button',{name:'Submit for approval'}).click();await seller.waitForURL('**/seller/listings');
  console.log('PASS: immediate seller onboarding and photo upload');
  const listing=(await db.query('SELECT * FROM listings WHERE owner_id=$1',[account.id])).rows[0];assert.equal(listing.status,'Pending');
  const adminContext=await browser.newContext();const admin=await adminContext.newPage();
  const signup=await adminContext.request.post(origin+'/api/auth/signup',{headers:{'X-Garage-Client':'web'},data:{name:'Browser Admin',email:'browser-admin@example.com',password:'browser-password-123',phone:'0771234567',city:'Colombo'}});assert.equal(signup.status(),201);await db.query("UPDATE users SET role='Admin',email_verified=true WHERE email='browser-admin@example.com'");
  await admin.goto(origin+'/admin/listings');await admin.getByRole('button',{name:'Review',exact:true}).click();await admin.getByRole('button',{name:'Approve listing'}).click();await admin.getByText('Moderation decision saved').waitFor();
  const buyerContext=await browser.newContext();const buyer=await buyerContext.newPage();await buyerContext.request.post(origin+'/api/auth/signup',{headers:{'X-Garage-Client':'web'},data:{name:'Browser Buyer',email:'browser-buyer@example.com',password:'browser-password-123',phone:'0771234567',city:'Colombo'}});
  await buyer.goto(origin+'/parts/'+listing.slug);await buyer.getByRole('button',{name:'Send enquiry'}).click();await buyer.waitForURL('**/dashboard/enquiries/*');await buyer.getByRole('heading',{name:'Browser brake pads'}).waitFor();
  console.log('PASS: listing moderation and buyer enquiry');
  const eid=(await db.query('SELECT id FROM enquiries WHERE listing_id=$1',[listing.id])).rows[0].id;
  await seller.goto(origin+'/seller/enquiries/'+eid);await seller.getByRole('textbox',{name:'Reply message'}).fill('Yes, available. Please confirm your part number.');await seller.getByRole('button',{name:'Send reply'}).click();await seller.getByRole('status').filter({hasText:'Reply sent'}).waitFor();
  await buyer.reload();await buyer.getByText('Yes, available. Please confirm your part number.',{exact:false}).waitFor();
  await buyer.goto(origin+'/admin');await buyer.getByRole('heading',{name:'Administrator access required'}).waitFor();
  await seller.goto(origin+'/dashboard/profile');await seller.getByRole('button',{name:'Sign out',exact:true}).last().click();await seller.waitForURL('**/auth/login');assert.equal((await sellerContext.request.get(origin+'/api/auth/me')).status(),401);
  await seller.getByLabel('Email address').fill('browser-seller@example.com');await seller.getByLabel('Password',{exact:true}).fill('wrong-password');await seller.getByRole('button',{name:'Sign in',exact:true}).click();await seller.getByRole('alert').filter({hasText:'Invalid email or password'}).waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: browser signup, immediate seller onboarding, photo upload, moderation, enquiries, role protection and logout.');
 }finally{if(browser)await browser.close();frontend?.kill();backend?.kill();await new Promise(r=>setTimeout(r,500));if(db)await db.end();if(created)await pool.query(`DROP SCHEMA "${schema}" CASCADE`);await pool.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
