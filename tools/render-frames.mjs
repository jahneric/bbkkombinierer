import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2], SETUPS = JSON.parse(process.argv[3]);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${process.env.TEMP}/bbk-prof2`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t; for (let i = 0; i < 50; i++) { try { t = await (await fetch('http://127.0.0.1:9334/json')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const logs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { pend.get(m.id)?.(m); } else if (m.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); else if (m.method === 'Runtime.consoleAPICalled' && m.params.type !== 'log') logs.push(m.params.args.map(a => a.value || a.description).join(' ')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result;
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: new URL('../stilproben.html?motest#motion', import.meta.url).href });
for (let i = 0; i < 60; i++) { const r = await ev('!!window.__mo'); if (r.result && r.result.value) break; await sleep(500); }
for (const [name, js] of SETUPS) {
  { const rr = await ev(js); if (rr.exceptionDetails) logs.push("SETUP ERR " + JSON.stringify(rr.exceptionDetails).slice(0, 400)); }
  await sleep(+process.env.W || 4000);
  const r = await ev(`document.getElementById('mo-cv').toDataURL('image/png')`);
  if (r.result?.value) writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.value.split(',')[1], 'base64')); else logs.push('toDataURL failed ' + JSON.stringify(r).slice(0, 300));
}
console.log(logs.join('\n') || 'no errors'); ws.close(); chrome.kill();
