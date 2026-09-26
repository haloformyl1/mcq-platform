import puppeteer from 'puppeteer-core';
import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\arghy\\.gemini\\antigravity-ide\\brain\\4faa126f-ddd4-4bdf-8a5e-e27877ab67ef\\header_verification';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const secretKey = process.env.JWT_SECRET || 'supersecret_jwt_key_replace_me_in_prod';
const key = new TextEncoder().encode(secretKey);

async function setupSession() {
  const student = await prisma.student.findFirst({
    where: { email: 'soumodipdas2010@gmail.com' }
  });
  if (!student) throw new Error('Student not found');

  const deviceId = 'dev_qa_verified_device_1';
  
  // Register or update active session
  await prisma.studentSession.upsert({
    where: {
      studentId_deviceId: {
        studentId: student.id,
        deviceId: deviceId
      }
    },
    update: {
      isRevoked: false,
      lastActive: new Date()
    },
    create: {
      id: `sess_${Date.now()}`,
      studentId: student.id,
      deviceId: deviceId,
      deviceType: 'mobile',
      deviceName: 'Chrome Mobile QA',
      browser: 'Chrome',
      os: 'Android',
      lastActive: new Date(),
      isRevoked: false
    }
  });

  const sessionToken = await new SignJWT({
    id: student.id,
    email: student.email,
    role: 'student'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10y')
    .sign(key);

  return { student, sessionToken, deviceId };
}

async function verify() {
  const { student, sessionToken, deviceId } = await setupSession();
  console.log(`Verified active student session for ${student.name} (${student.board} ${student.academicLevel})`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error')) {
      console.log('PAGE LOG:', text);
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.setCookie(
    { name: 'session', value: sessionToken, domain: 'localhost', path: '/' },
    { name: 'piechem_device_id', value: deviceId, domain: 'localhost', path: '/' }
  );

  console.log('Navigating to http://localhost:3000/dashboard (initial load)...');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Waiting for header to render in DOM...');
  await page.waitForSelector('header', { timeout: 60000 });
  console.log('Header successfully rendered!');

  // Dismiss celebration modal if open
  await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      const closeBtn = modal.querySelector('button[aria-label*="Close"]') || modal.querySelector('button');
      if (closeBtn) closeBtn.click();
      else modal.remove();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const viewports = [
    { name: 'phone-320', width: 320, height: 568 },
    { name: 'phone-360', width: 360, height: 640 },
    { name: 'phone-375', width: 375, height: 667 },
    { name: 'phone-390', width: 390, height: 844 },
    { name: 'phone-430', width: 430, height: 932 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 400));

    // Ensure celebration modal stays removed if re-rendered
    await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        modal.remove();
      }
    });

    const check = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return { error: 'No header' };

      const accountBtn = header.querySelector('a[href="/dashboard/account"]');
      const accountRect = accountBtn ? accountBtn.getBoundingClientRect() : null;

      const notifBtn = header.querySelector('button[aria-label="Notifications"]') || header.querySelector('button[title*="Notification"]');
      const notifRect = notifBtn ? notifBtn.getBoundingClientRect() : null;

      const curriculumText = header.innerText.includes('WBCHSE');

      const isClipped = accountRect ? (accountRect.right > window.innerWidth || accountRect.left < 0) : true;

      return {
        innerWidth: window.innerWidth,
        curriculumVisible: curriculumText,
        accountVisible: accountRect !== null && !isClipped,
        accountRect: accountRect ? {
          left: Math.round(accountRect.left),
          right: Math.round(accountRect.right),
          width: Math.round(accountRect.width)
        } : null,
        notifVisible: notifRect !== null && notifRect.right <= window.innerWidth
      };
    });

    console.log(`[${vp.name}] Account Visible: ${check.accountVisible}, Curriculum: ${check.curriculumVisible}, Notif: ${check.notifVisible}`);
    if (check.accountRect) {
      console.log(`  Account Rect: right=${check.accountRect.right}, innerWidth=${check.innerWidth}`);
    }

    const shotPath = path.join(ARTIFACT_DIR, `dashboard_${vp.name}.png`);
    await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: vp.width, height: 160 } });
  }

  // Test opening the mobile curriculum bottom sheet on phone-375
  console.log('Testing mobile curriculum bottom sheet on phone-375...');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 400));

  // Find and click the "Switch" button
  const switchBtn = await page.$('button::-p-text(Switch)') || await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Switch'));
  });

  if (switchBtn) {
    console.log('Found Switch button, clicking...');
    await switchBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const modalShot = path.join(ARTIFACT_DIR, `curriculum_modal_open.png`);
    await page.screenshot({ path: modalShot });
    console.log(`Curriculum modal screenshot saved to ${modalShot}`);
  } else {
    console.log('Switch button not found');
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('Verification completed successfully!');
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
