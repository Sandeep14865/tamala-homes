// Renders each 3D view's poster in headless Chrome and saves it through the dev server.
// Needs `npm run dev` running. Run: node scripts/posters.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:5173';
const JOBS = [
  { page: '/', section: '#map', shots: [['map', 'map']] },
  { page: '/projects/arundelpet', section: '#availability', shots: [['tower', 'tower-arundelpet']] },
  { page: '/projects/arundelpet', section: '#plans', shots: [['plan', 'plan']] },
  { page: '/projects/amaravati-road', section: '#availability', shots: [['tower', 'tower-amaravati-road']] },
  { page: '/projects/gorantla', section: '#availability', shots: [['tower', 'tower-gorantla']] },
];

const profile = mkdtempSync(join(tmpdir(), 'tamala-posters-'));
const chrome = spawn(CHROME, ['--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--no-first-run',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', '--force-device-scale-factor=2', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((ok, no) => {
  let buf = '';
  chrome.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) ok(m[0]); });
  setTimeout(() => no(new Error('Chrome did not start')), 15000);
});
const port = new URL(wsUrl).port;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const waiting = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'evaluate failed');
  return r.result.result.value;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
try {
  for (const job of JOBS) {
    await send('Page.navigate', { url: BASE + job.page });
    await sleep(2500);
    await evaluate(`window.scrollTo(0, document.querySelector('${job.section}').offsetTop)`);
    await sleep(3500);
    for (const [kind, name] of job.shots) {
      const res = await evaluate(`(async () => {
        const v = (window.__views || []).find(x => x.frame.dataset.viz === '${kind}');
        if (!v) return 'no view';
        const r = await fetch('/__poster?name=${name}', { method: 'POST', body: v.snap() });
        return r.text();
      })()`);
      console.log(`${name}: ${res}`);
    }
  }
} finally {
  ws.close(); chrome.kill('SIGKILL'); rmSync(profile, { recursive: true, force: true });
}
