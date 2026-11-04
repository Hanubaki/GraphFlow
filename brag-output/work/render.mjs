import { chromium } from 'file:///C:/Users/berke/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FFMPEG = 'C:\\Users\\berke\\AppData\\Local\\ms-playwright\\ffmpeg-1013\\ffmpeg-win64.exe';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_URL = 'file:///C:/Users/berke/Documents/antigravity/bold-hypatia/brag-output/work/composition.html';
const OUT_WEBM = path.resolve('brag-output/work/raw.webm');
const OUT_POSTER = path.resolve('brag-output/brag.jpg');

const FPS = 12;
const DURATION = 20;
const TOTAL_FRAMES = FPS * DURATION;

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(HTML_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { window.__manualClock = true; });

  // Capture settled poster frame at t = 4.5s (Scene 2: Live ERP/API Digital Twin)
  await page.evaluate(() => window.setVideoTime(4.5));
  const posterBuf = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(OUT_POSTER, posterBuf);

  const ff = spawn(FFMPEG, [
    '-y',
    '-f', 'image2pipe',
    '-c:v', 'mjpeg',
    '-framerate', String(FPS),
    '-i', 'pipe:0',
    '-b:v', '2M',
    OUT_WEBM
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i === 0 ? 4.5 : (i / FPS);
    await page.evaluate((time) => window.setVideoTime(time), t);
    const buf = i === 0 ? posterBuf : await page.screenshot({ type: 'jpeg', quality: 86 });
    ff.stdin.write(buf);
  }

  ff.stdin.end();
  await new Promise((res) => ff.on('close', res));
  await browser.close();
  console.log('DONE:', OUT_WEBM, fs.statSync(OUT_WEBM).size);
}

main().catch(err => { console.error(err); process.exit(1); });
