import { spawn } from 'node:child_process';
import { connect } from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url));
const backendDir=fileURLToPath(new URL('../backend/',import.meta.url));
const requireBackend=createRequire(new URL('../backend/package.json',import.meta.url));
const {parse}=requireBackend('dotenv');
const localEnv=existsSync(backendDir+'.env')?parse(readFileSync(backendDir+'.env')):{};
const settings={...localEnv,...process.env};
const children=new Set();let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
function start(args,cwd,env){const child=spawn(process.execPath,args,{cwd,env,stdio:'inherit'});children.add(child);child.on('error',e=>{console.error(e.message);stop(1);});child.on('exit',code=>{children.delete(child);if(!stopping&&code)stop(code);});return child;}
function done(child){return new Promise((resolve,reject)=>{child.once('exit',code=>code===0?resolve():reject(new Error(`Process exited (${code})`)));child.once('error',reject);});}
async function portInUse(host, port) {
 return new Promise((resolve, reject) => {
  const socket = connect({host, port: Number(port)});
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve(false) : reject(error));
  socket.setTimeout(2000, () => { socket.destroy(); reject(new Error(`Port ${port} did not respond.`)); });
 });
}
async function healthy(url) {
 try {
  const response = await fetch(url + '/api/health', {signal: AbortSignal.timeout(5000)});
  return response.ok && (await response.json()).status === 'ok';
 } catch { return false; }
}
async function main(){
 if(settings.NODE_ENV==='production')throw new Error('npm run dev is for local development; use the documented production services.');
 const backendPort=Number(settings.PORT||4000);const origin=new URL(settings.FRONTEND_ORIGIN||'http://localhost:3000');const frontendPort=origin.port||'3000';
 const backendUrl=`http://127.0.0.1:${backendPort}`;
 const frontendExists = await portInUse(origin.hostname, frontendPort);
 const env={...settings,NODE_ENV:'development',PORT:String(backendPort),FRONTEND_ORIGIN:origin.origin};
 if(!settings.SMTP_HOST)console.warn('SMTP is not configured: password reset emails remain queued. Add your provider settings to backend/.env.');
 console.log('Checking local database migrations…');
 await done(start(['node_modules/ts-node/dist/bin.js','src/database/migrate.ts'],backendDir,env));
 const existing = await healthy(backendUrl);
 if (!existing && await portInUse('127.0.0.1', backendPort)) throw new Error(`Port ${backendPort} is occupied but the backend is not healthy. Check the process using that port.`);
 if(!existing)start(['node_modules/ts-node-dev/lib/bin.js','--respawn','--transpile-only','src/main.ts'],backendDir,env);
 for(let i=0;i<40;i++){try{const r=await fetch(backendUrl+'/api/health',{signal:AbortSignal.timeout(1000)});if(r.ok)break;}catch{}if(i===39)throw new Error('Backend did not become ready. Check the backend error above.');await new Promise(resolve=>setTimeout(resolve,500));}
 if (stopping) return;
 if (frontendExists || await portInUse(origin.hostname, frontendPort)) {
  // An existing frontend may need a moment to reconnect to a just-started API.
  let ready = false;
  for (let i = 0; i < 5; i++) {
   if (await healthy(origin.origin)) { ready = true; break; }
   await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`Port ${frontendPort} is occupied, but ${origin.origin}/api/health is not healthy. Check that server's BACKEND_URL; no duplicate frontend was started.`);
  console.log(`Frontend already running at ${origin.origin}. No duplicate server was started.`);
  console.log(`App ready: ${origin.origin} (API: ${backendUrl})`);
  return;
 }
 console.log(`API ready at ${backendUrl}. Starting frontend at ${origin.origin}`);
 start(['node_modules/next/dist/bin/next','dev','--webpack','--port',frontendPort],root,{...process.env,NODE_ENV:'development',BACKEND_URL:backendUrl});
}
main().catch(e=>{console.error(e.message);stop(1);});
