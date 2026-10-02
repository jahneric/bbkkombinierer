// runs tools/tee/clean.html in headless chrome on the CC0 source photo and writes app/tee-front.webp (+ a png preview)
// source: "Wikimania2023 Attendee T-Shirt Mockup" by Adien Gunarta & Naila Rahmah, Wikimedia Commons, CC0
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url)), SIZE = +(process.argv[2] || 1500);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9336', '--allow-file-access-from-files', `--user-data-dir=${process.env.TEMP}/bbk-tee`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t; for (let i = 0; i < 50; i++) { try { t = await (await fetch('http://127.0.0.1:9336/json')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) pend.get(m.id)?.(m); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Page.navigate', { url: pathToFileURL(join(root, 'tools/tee/clean.html')).href }); await sleep(800);
const src = pathToFileURL(join(root, 'tools/tee/source-wikimania2023-mockup-cc0.png')).href;
const r = await send('Runtime.evaluate', { expression: `clean(${JSON.stringify(src)}, ${SIZE})`, awaitPromise: true, returnByValue: true });
if (r.result.exceptionDetails) { console.error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); process.exit(1); }
const v = r.result.result.value, b64 = s => Buffer.from(s.split(',')[1], 'base64');
writeFileSync(join(root, 'app/tee-front.webp'), b64(v.webp)); writeFileSync(join(root, 'tools/tee/preview.png'), b64(v.png)); writeFileSync(join(root, 'tools/tee/mask.png'), b64(v.mask));
console.log('app/tee-front.webp', b64(v.webp).length, 'bytes'); ws.close(); chrome.kill();
