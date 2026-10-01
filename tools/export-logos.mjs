import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));   // repo root
const OUT = process.argv[2] || join(ROOT, 'logos');
const ONLY = process.argv[3] || 'all'; // 'test' | 'all'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const prof = join(process.env.TEMP, 'bbk-chrome-prof');

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(200); } }
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };

await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 2, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: pathToFileURL(join(ROOT, 'stilproben.html')).href + '#logos' });
await sleep(2500);
await ev('document.fonts.ready.then(() => 1)');

// isolate one tile full-viewport; everything else hidden
await ev(`(() => {
  const st = document.createElement('style'); st.textContent = \`.switch{display:none!important}
  .solo{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;aspect-ratio:auto!important;border:0!important;z-index:60!important;transition:none!important}
  body *{visibility:hidden} .solo,.solo *{visibility:visible!important} body:not(.nogr) .grain{visibility:visible}
  body.nogr .grain{display:none}\`; document.head.append(st);
  window.solo = el => { document.querySelectorAll('.solo').forEach(x => x.classList.remove('solo')); el.classList.add('solo'); };
  window.mode = (grain, white) => {
    document.body.classList.remove('grain-1', 'grain-2'); if (grain) document.body.classList.add('grain-1');
    document.body.classList.toggle('paper-on', grain); document.body.classList.toggle('nogr', !grain);
    document.body.classList.remove('lockup-on');
    document.getElementById('r-logos').classList.toggle('inv', white);
  };
  return 1; })()`);

const shot = async file => { await sleep(350); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(r.result.data, 'base64')); console.log(file); };
const VARIANTS = [[true, false, '', 'auf-schwarz'], [true, true, '', 'auf-weiss'], [false, false, '_ohne-koernung', 'auf-schwarz'], [false, true, '_ohne-koernung', 'auf-weiss']];

// runde 5
const R5 = { gesicht: 'gesicht-kopfhoerer', rasterkopf: 'raster-kopf', spirale: 'spiralkabel', koepfe: 'koepfe', scankopf: 'scan-kopf', profile: 'drei-profile', dialog: 'dialog', wurmloch: 'wurmloch', globuskopf: 'globus-kopf', orbit: 'orbit', klammer: 'klammer', halbton: 'halbton' };
const FONTS = await ev(`[...document.querySelectorAll('#fontbar [data-font]')].filter(b => b.dataset.font).map(b => [b.dataset.font, b.textContent, b.style.fontFamily, b.style.fontWeight, b.style.fontStyle])`);
const FV = { doto: '"ROND" 100', handjet: '"ELSH" 12, "ELGR" 2' };

if (ONLY === 'k4') {
  for (const [grain, white, sub, suf] of VARIANTS) {
    await ev(`mode(${grain}, ${white})`);
    const d4 = join(OUT, sub, 'runde-4-musik'); mkdirSync(d4, { recursive: true });
    for (const [k, n] of [['kopfwellebbk', 'kopf-welle-bbk'], ['kopfwellesiegel', 'kopf-welle-siegel']]) {
      await ev(`solo(document.querySelector('[data-k4="${k}"] .tile'))`); await shot(join(d4, `bbk-${n}_${suf}.png`)); }
  }
  ws.close(); chrome.kill(); process.exit(0);
}
for (const [grain, white, sub, suf] of VARIANTS) {
  await ev(`mode(${grain}, ${white})`);
  const d5 = join(OUT, sub, 'runde-5-kombi'); mkdirSync(d5, { recursive: true });
  for (const [k, n] of Object.entries(R5)) {
    if (ONLY === 'test' && k !== 'dialog') continue;
    await ev(`solo(document.querySelector('[data-k5="${k}"] .tile'))`);
    await shot(join(d5, `bbk-${n}_${suf}.png`));
  }
  const de = join(OUT, sub, 'runde-1-echo-schriften'); mkdirSync(de, { recursive: true });
  for (const [k, name, fam, w, s] of FONTS) {
    if (ONLY === 'test' && k !== 'monoton') continue;
    await ev(`(async () => { const fig = document.querySelector('#logos figure[data-k="echo"]');
      fig.classList.remove('a-morf', 'a-year', 'a-elsh', 'a-scan');
      fig.style.setProperty('--lf', ${JSON.stringify(fam.split(',')[0])}); fig.style.setProperty('--lw', '${w}'); fig.style.setProperty('--ls', '${s || 'normal'}'); fig.style.setProperty('--lv', ${JSON.stringify(FV[k] || 'normal')});
      await document.fonts.load('${s || 'normal'} ${w} 100px ' + ${JSON.stringify(fam.split(',')[0])}).catch(() => {});
      solo(fig.querySelector('.tile')); return 1; })()`);
    const slug = name.replace(/\s*\(alt\)/, '').trim().replace(/\s+/g, '-');
    await shot(join(de, `bbk-echo-${slug}_${suf}.png`));
  }
}
ws.close(); chrome.kill();
