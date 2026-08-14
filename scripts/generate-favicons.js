const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const svgPath = path.join(__dirname, '../src/app/icon.svg');
  const appDir = path.join(__dirname, '../src/app');
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG file not found at:', svgPath);
    return;
  }

  console.log('Generating favicons from SVG...');

  // Generate 32x32 favicon.ico / icon.png
  const png32 = await sharp(svgPath).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), png32);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), png32);
  fs.writeFileSync(path.join(appDir, 'icon.png'), png32);

  // Generate 64x64 icon-64.png
  const png64 = await sharp(svgPath).resize(64, 64).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-64.png'), png64);

  // Generate 180x180 apple-icon.png
  const png180 = await sharp(svgPath).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180);

  console.log('Successfully generated all favicons!');
}

generateFavicons().catch(console.error);
