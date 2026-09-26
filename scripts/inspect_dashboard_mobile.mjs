import puppeteer from 'puppeteer-core';
import { SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\arghy\\.gemini\\antigravity-ide\\brain\\4faa126f-ddd4-4bdf-8a5e-e27877ab67ef\\header_debug';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Secret key used by auth.ts
const secretKey = process.env.JWT_SECRET || 'supersecret_jwt_key_replace_me_in_prod';
const key = new TextEncoder().encode(secretKey);

async function createToken(studentId) {
  return await new SignJWT({ id: studentId, email: 'soumodipdas2010@gmail.com', role: 'student' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10y')
    .sign(key);
}

async function inspectMobileHeader() {
  const token = await createToken('322561af-dbce-4ef2-9b74-101b8f534b49');
  console.log('Generated session token');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set auth cookie
  await page.setCookie({
    name: 'session',
    value: token,
    domain: 'localhost',
    path: '/'
  });

  const viewports = [
    { name: 'phone-320', width: 320, height: 568 },
    { name: 'phone-375', width: 375, height: 667 },
    { name: 'phone-390', width: 390, height: 844 },
    { name: 'phone-430', width: 430, height: 932 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));

    // Capture header dimensions & inspect clipping
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return { error: 'No header element' };

      const rect = header.getBoundingClientRect();
      const elements = Array.from(header.querySelectorAll('*')).map(el => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          classes: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
          text: (el.textContent || '').trim().slice(0, 30),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          isClipped: r.right > window.innerWidth || r.left < 0
        };
      }).filter(e => e.isClipped && e.width > 0);

      const accountBtn = header.querySelector('a[href="/dashboard/account"]');
      const accountRect = accountBtn ? accountBtn.getBoundingClientRect() : null;

      const curriculumSelect = header.querySelector('select');
      const curriculumRect = curriculumSelect ? curriculumSelect.getBoundingClientRect() : null;

      return {
        headerWidth: Math.round(rect.width),
        windowWidth: window.innerWidth,
        accountVisible: accountRect ? (accountRect.right <= window.innerWidth && accountRect.width > 0) : false,
        accountRect: accountRect ? {
          left: Math.round(accountRect.left),
          right: Math.round(accountRect.right),
          width: Math.round(accountRect.width)
        } : null,
        curriculumRect: curriculumRect ? {
          left: Math.round(curriculumRect.left),
          right: Math.round(curriculumRect.right)
        } : null,
        clippedElements: elements
      };
    });

    console.log(`\n=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log('Account button visible:', headerInfo.accountVisible);
    console.log('Account button rect:', headerInfo.accountRect);
    if (headerInfo.clippedElements && headerInfo.clippedElements.length > 0) {
      console.log('Clipped elements count:', headerInfo.clippedElements.length);
      console.log('Sample clipped:', headerInfo.clippedElements.slice(0, 3));
    }

    const shotPath = path.join(ARTIFACT_DIR, `header_${vp.name}.png`);
    await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: vp.width, height: 180 } });
    console.log(`Screenshot saved: ${shotPath}`);
  }

  await browser.close();
}

inspectMobileHeader().catch(e => console.error(e));
