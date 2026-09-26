import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\arghy\\.gemini\\antigravity-ide\\brain\\4faa126f-ddd4-4bdf-8a5e-e27877ab67ef\\screenshots';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 568 },
  { name: 'phone-360', width: 360, height: 640 },
  { name: 'phone-375', width: 375, height: 667 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-393', width: 393, height: 873 },
  { name: 'phone-412', width: 412, height: 915 },
  { name: 'phone-430', width: 430, height: 932 },
  { name: 'landscape-568', width: 568, height: 320 },
  { name: 'landscape-667', width: 667, height: 375 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'tablet-600', width: 600, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'tablet-834', width: 834, height: 1112 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 720 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'laptop-1440', width: 1440, height: 900 },
  { name: 'desktop-1600', width: 1600, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-2560', width: 2560, height: 1440 },
  { name: 'ultrawide-3440', width: 3440, height: 1440 }
];

const ROUTES = [
  '/',
  '/login',
  '/onboarding',
  '/dashboard',
  '/study-material',
  '/3d-animations',
  '/dashboard/ai',
  '/dashboard/account',
  '/admin'
];

// Viewports that will save visual screenshots
const SCREENSHOT_VIEWPORTS = new Set([
  'phone-320',
  'phone-375',
  'landscape-667',
  'tablet-768',
  'laptop-1440',
  'desktop-1920',
  'ultrawide-3440'
]);

async function runAudit() {
  console.log('Launching Headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const results = [];

  for (const route of ROUTES) {
    console.log(`\n========================================`);
    console.log(`TESTING ROUTE: ${route}`);
    console.log(`========================================`);

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      
      const consoleErrors = [];
      const onConsole = msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      };
      page.on('console', onConsole);

      const targetUrl = `http://localhost:3000${route}`;
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 600));

        // Evaluate layout metrics and horizontal overflow
        const layoutInfo = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const innerWidth = window.innerWidth;
          const hasOverflow = scrollWidth > innerWidth + 1;

          // Find overflowing elements if any
          const overflowingElements = [];
          if (hasOverflow) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 1.5 && rect.width > 0 && rect.height > 0) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? (typeof el.className === 'string' ? el.className.slice(0, 80) : '') : '';
                const id = el.id ? `#${el.id}` : '';
                overflowingElements.push({
                  selector: `${tag}${id}.${cls.split(' ').join('.')}`,
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                  innerWidth
                });
                if (overflowingElements.length >= 5) break;
              }
            }
          }

          return {
            scrollWidth,
            innerWidth,
            hasOverflow,
            overflowingElements,
            title: document.title
          };
        });

        // Screenshot for key viewports
        if (SCREENSHOT_VIEWPORTS.has(vp.name)) {
          const safeRouteName = route === '/' ? 'landing' : route.replace(/\//g, '_');
          const shotPath = path.join(ARTIFACT_DIR, `${safeRouteName}_${vp.name}.png`);
          await page.screenshot({ path: shotPath, fullPage: false });
        }

        const status = layoutInfo.hasOverflow ? 'FAIL (OVERFLOW)' : 'PASS';
        if (layoutInfo.hasOverflow || consoleErrors.length > 0) {
          console.log(`[${vp.name}] ${status} - Route: ${route}, ScrollWidth: ${layoutInfo.scrollWidth}, InnerWidth: ${layoutInfo.innerWidth}`);
          if (layoutInfo.overflowingElements.length > 0) {
            console.log('  Overflowing elements:', JSON.stringify(layoutInfo.overflowingElements));
          }
          if (consoleErrors.length > 0) {
            console.log('  Console errors:', consoleErrors.slice(0, 3));
          }
        } else {
          process.stdout.write(`.`);
        }

        results.push({
          route,
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          hasOverflow: layoutInfo.hasOverflow,
          scrollWidth: layoutInfo.scrollWidth,
          innerWidth: layoutInfo.innerWidth,
          overflowingElements: layoutInfo.overflowingElements,
          consoleErrors
        });

      } catch (err) {
        console.error(`[${vp.name}] ERROR on ${route}:`, err.message);
        results.push({
          route,
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          error: err.message
        });
      } finally {
        page.off('console', onConsole);
      }
    }
  }

  await browser.close();

  const reportPath = path.join(ARTIFACT_DIR, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\nAudit completed! Report saved to ${reportPath}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
