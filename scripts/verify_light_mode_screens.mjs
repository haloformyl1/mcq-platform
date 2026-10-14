import puppeteer from 'puppeteer-core';
import { SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/usr/bin/google-chrome';
const ARTIFACT_DIR = '/home/arghyadeep/.gemini/antigravity-ide/brain/c35567e2-d34b-43f7-8a29-ad2b4260806a/light_mode_verification';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const secretKey = process.env.JWT_SECRET || 'supersecret_jwt_key_replace_me_in_prod';
const key = new TextEncoder().encode(secretKey);

async function captureScreens() {
  const student = {
    id: "student_verified_qa_123",
    email: "arghyadeeproy25@gmail.com",
    name: "Arghyadeep Roy",
    phone: "9876543210",
    gender: "Male",
    dob: "2006-05-15",
    board: "CBSE",
    academicLevel: "12",
    avatarUrl: "/avatars/atom.jpg",
    subscriptionStatus: "BASIC", // Non-Ultra so we test the PIE Ultra promo banner!
    createdAt: "2024-01-15T10:00:00.000Z"
  };

  const sessionToken = await new SignJWT({
    id: student.id,
    email: student.email,
    role: 'student'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10y')
    .sign(key);

  console.log('Session token created. Launching Chrome...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // Enable request interception to mock student APIs
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/student/dashboard')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          student,
          availableTests: [
            {
              id: 'test_chem_1',
              title: 'Class 12 - Chemical Kinetics & Electrochemistry',
              discipline: 'PHYSICAL',
              status: 'LIVE',
              category: 'LIVE',
              totalQuestions: 30,
              durationMinutes: 45,
              marksPerQuestion: 4,
              negativeMarking: true,
              negativeMarks: 1
            }
          ],
          allAttempts: []
        })
      });
    } else if (url.includes('/api/student/study-materials')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: "mat_1",
            title: "SOLID STATE CHEMISTRY (Interactive 3D models)",
            description: "Explore, visualize, and calculate 3D crystal structures, voids, packing efficiency, and point defects in a premium interactive laboratory.",
            type: "LINK",
            url: "https://example.com/3d/solid-state",
            isPremium: false,
            discipline: "PHYSICAL",
            category: "3D animations"
          },
          {
            id: "mat_2",
            title: "CHEMICAL BONDING (Bonding visualised)",
            description: "From atomic trends to orbital shapes—see, manipulate and test every core idea behind chemical bonding.",
            type: "LINK",
            url: "https://example.com/3d/bonding",
            isPremium: true,
            discipline: "INORGANIC",
            category: "3D animations"
          },
          {
            id: "mat_3",
            title: "ORGANIC STEREOCHEMISTRY & MOLECULAR GEOMETRY",
            description: "Interactive 3D conformations, chirality, Newman projections, and reaction intermediates visualized in real-time.",
            type: "LINK",
            url: "https://example.com/3d/organic",
            isPremium: false,
            discipline: "ORGANIC",
            category: "3D animations"
          }
        ])
      });
    } else {
      req.continue();
    }
  });

  // Set Auth Cookie
  await page.setCookie({
    name: 'session',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true
  });

  // Set theme to light in localStorage before loading
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('piechem_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  // 1. Dashboard Light Mode
  console.log('Capturing /dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '1_dashboard_light.png'), fullPage: false });

  // 1b. Scroll to footer on Dashboard
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '1b_dashboard_footer_light.png'), fullPage: false });

  // 2. 3D Animations Catalog
  console.log('Capturing /3d-animations...');
  await page.goto('http://localhost:3000/3d-animations', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '2_3d_animations_light.png'), fullPage: false });

  // 3. Account Overview (with PIE Ultra Exclusive promo card)
  console.log('Capturing /dashboard/account...');
  await page.goto('http://localhost:3000/dashboard/account', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '3_account_overview_light.png'), fullPage: false });

  // 3b. Account Edit Profile Tab
  console.log('Capturing /dashboard/account (Profiles tab)...');
  await page.evaluate(() => {
    const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Edit Student Profile'));
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '3b_account_profile_light.png'), fullPage: false });

  // 3c. Account Security Tab
  console.log('Capturing /dashboard/account (Security tab)...');
  await page.evaluate(() => {
    const secBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.trim() === 'Password' || b.textContent.includes('Change Password')));
    if (secBtn) secBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '3c_account_security_light.png'), fullPage: false });

  // 4. AI Workspace
  console.log('Capturing /dashboard/ai...');
  await page.goto('http://localhost:3000/dashboard/ai', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '4_ai_workspace_light.png'), fullPage: false });

  // 4b. Curriculum / Study Material Light Mode
  console.log('Capturing /study-material/cbse...');
  await page.goto('http://localhost:3000/study-material/cbse', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '4b_curriculum_cbse_light.png'), fullPage: false });

  // 5. Verify Dark Mode still works identically!
  console.log('Verifying dark mode is untouched on /dashboard...');
  await page.evaluate(() => {
    localStorage.setItem('piechem_theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '5_dashboard_dark_preserved.png'), fullPage: false });

  console.log('Screenshots captured successfully in:', ARTIFACT_DIR);
  await browser.close();
}

captureScreens().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
