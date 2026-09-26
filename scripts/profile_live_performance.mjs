import puppeteer from 'puppeteer-core';
import { SignJWT } from 'jose';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const secretKey = process.env.JWT_SECRET || 'supersecret_jwt_key_replace_me_in_prod';
const key = new TextEncoder().encode(secretKey);

async function profile() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');

  const token = await new SignJWT({
    id: '322561af-dbce-4ef2-9b74-101b8f534b49',
    email: 'soumodipdas2010@gmail.com',
    role: 'student'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10y')
    .sign(key);

  await page.setCookie(
    { name: 'session', value: token, domain: 'localhost', path: '/' },
    { name: 'piechem_device_id', value: 'dev_qa_verified_device_1', domain: 'localhost', path: '/' }
  );

  const testPages = [
    { url: 'http://localhost:3000/', name: 'Landing Page' },
    { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
    { url: 'http://localhost:3000/3d-animations', name: '3D Animations' }
  ];

  console.log('=== EMPIRICAL PERFORMANCE & VIEWPORT PROFILING (390px) ===\n');

  for (const t of testPages) {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    const startTime = Date.now();
    await page.goto(t.url, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // Collect CDP metrics
    const { metrics } = await client.send('Performance.getMetrics');
    const metricMap = {};
    metrics.forEach(m => { metricMap[m.name] = m.value; });

    // Measure touch target sizes on 390px mobile
    const touchAudit = await page.evaluate(() => {
      const interactives = Array.from(document.querySelectorAll('button, a, select, input'));
      let under40Count = 0;
      let total = interactives.length;
      interactives.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32)) {
          under40Count++;
        }
      });
      return { total, under40Count, overflow: document.documentElement.scrollWidth > window.innerWidth };
    });

    console.log(`[${t.name}]`);
    console.log(`  DOM Content Loaded: ${loadTime}ms`);
    console.log(`  JS Heap Used: ${Math.round((metricMap.JSHeapUsedSize || 0) / (1024 * 1024))} MB`);
    console.log(`  Layout Count: ${metricMap.LayoutCount || 0}`);
    console.log(`  Recalc Style Count: ${metricMap.RecalcStyleCount || 0}`);
    console.log(`  Touch Targets: ${touchAudit.total} total (${touchAudit.under40Count} under 32px)`);
    console.log(`  Horizontal Overflow: ${touchAudit.overflow ? 'FAIL' : 'NONE (0px)'}\n`);
  }

  await browser.close();
}

profile().catch(e => {
  console.error(e);
  process.exit(1);
});
