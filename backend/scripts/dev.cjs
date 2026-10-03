const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const port = Number(process.env.PORT || 4000);
function occupied() {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve(false) : reject(error));
    socket.setTimeout(2000, () => { socket.destroy(); reject(new Error('Port check timed out')); });
  });
}
async function main() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  if (await occupied()) {
    let healthy = false;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(3000) });
      healthy = response.ok && (await response.json()).status === 'ok';
    } catch {}
    if (!healthy) throw new Error(`Port ${port} is occupied, but its backend health check failed. Stop the process using that port before restarting.`);
    console.log(`Backend is already running at http://127.0.0.1:${port}. No duplicate server was started.`);
    return;
  }
  const child = spawn(process.execPath, [require.resolve('ts-node-dev/lib/bin.js'), '--respawn', '--transpile-only', 'src/main.ts'], {
    cwd: path.join(__dirname, '..'), stdio: 'inherit', env: process.env,
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code || 0; });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
