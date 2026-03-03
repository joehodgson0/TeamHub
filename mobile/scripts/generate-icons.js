// mobile/scripts/generate-icons.js
// Run: cd mobile && npm install canvas && node scripts/generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const BLUE = '#2563EB';
const WHITE = '#FFFFFF';

function generateIcon(size, textSizeFactor = 0.13) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, size, size);

  // "TeamHub" text — inset within the circular safe zone (~66% of icon)
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = Math.round(size * textSizeFactor);
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;

  // Measure and shrink if needed to stay within safe zone (inner 66%)
  const safeWidth = size * 0.66;
  let measured = ctx.measureText('TeamHub');
  let actualFontSize = fontSize;
  while (measured.width > safeWidth && actualFontSize > 10) {
    actualFontSize -= 1;
    ctx.font = `bold ${actualFontSize}px Arial, Helvetica, sans-serif`;
    measured = ctx.measureText('TeamHub');
  }

  ctx.fillText('TeamHub', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

function generateAdaptiveForeground(size) {
  // Android adaptive icons have a 108dp canvas with 72dp visible (inner 66.67%)
  // The foreground should place content within the inner 66% safe zone
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background (the adaptive icon bg layer handles color)
  ctx.clearRect(0, 0, size, size);

  // Blue circle in center for the icon content area
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.33; // 66% diameter / 2

  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Text within the circle
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(size * 0.085);
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;

  // Ensure text fits within circle
  const maxTextWidth = radius * 1.6;
  let measured = ctx.measureText('TeamHub');
  let actualFontSize = fontSize;
  while (measured.width > maxTextWidth && actualFontSize > 10) {
    actualFontSize -= 1;
    ctx.font = `bold ${actualFontSize}px Arial, Helvetica, sans-serif`;
    measured = ctx.measureText('TeamHub');
  }

  ctx.fillText('TeamHub', centerX, centerY);

  return canvas.toBuffer('image/png');
}

function generateSplashIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Blue rounded rect
  const margin = size * 0.1;
  const rectSize = size - margin * 2;
  const cornerRadius = rectSize * 0.2;

  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(margin + cornerRadius, margin);
  ctx.lineTo(margin + rectSize - cornerRadius, margin);
  ctx.quadraticCurveTo(margin + rectSize, margin, margin + rectSize, margin + cornerRadius);
  ctx.lineTo(margin + rectSize, margin + rectSize - cornerRadius);
  ctx.quadraticCurveTo(margin + rectSize, margin + rectSize, margin + rectSize - cornerRadius, margin + rectSize);
  ctx.lineTo(margin + cornerRadius, margin + rectSize);
  ctx.quadraticCurveTo(margin, margin + rectSize, margin, margin + rectSize - cornerRadius);
  ctx.lineTo(margin, margin + cornerRadius);
  ctx.quadraticCurveTo(margin, margin, margin + cornerRadius, margin);
  ctx.closePath();
  ctx.fill();

  // Text - well inset
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(size * 0.11);
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText('TeamHub', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const outputDir = path.join(__dirname, '..');

// Main app icon (1024x1024)
const iconFiles = [
  // Expo / root icons
  { path: 'assets/images/icon.png', size: 1024, type: 'icon' },
  { path: 'assets/images/splash-icon.png', size: 512, type: 'splash' },
  { path: 'assets/images/favicon.png', size: 64, type: 'icon' },
  { path: 'generated-icon.png', size: 1024, type: 'icon' },

  // Android adaptive foreground
  { path: 'assets/images/adaptive-icon.png', size: 1024, type: 'adaptive' },

  // Android mipmap icons
  { path: 'assets/images/android/ic_launcher-web.png', size: 512, type: 'icon' },
  { path: 'assets/images/android/playstore-icon.png', size: 512, type: 'icon' },
  { path: 'assets/images/android/mipmap-ldpi/ic_launcher.png', size: 36, type: 'icon' },
  { path: 'assets/images/android/mipmap-ldpi/ic_launcher_round.png', size: 36, type: 'icon' },
  { path: 'assets/images/android/mipmap-ldpi/ic_launcher_foreground.png', size: 54, type: 'adaptive' },
  { path: 'assets/images/android/mipmap-mdpi/ic_launcher.png', size: 48, type: 'icon' },
  { path: 'assets/images/android/mipmap-mdpi/ic_launcher_round.png', size: 48, type: 'icon' },
  { path: 'assets/images/android/mipmap-mdpi/ic_launcher_foreground.png', size: 72, type: 'adaptive' },
  { path: 'assets/images/android/mipmap-hdpi/ic_launcher.png', size: 72, type: 'icon' },
  { path: 'assets/images/android/mipmap-hdpi/ic_launcher_round.png', size: 72, type: 'icon' },
  { path: 'assets/images/android/mipmap-hdpi/ic_launcher_foreground.png', size: 108, type: 'adaptive' },
  { path: 'assets/images/android/mipmap-xhdpi/ic_launcher.png', size: 96, type: 'icon' },
  { path: 'assets/images/android/mipmap-xhdpi/ic_launcher_round.png', size: 96, type: 'icon' },
  { path: 'assets/images/android/mipmap-xhdpi/ic_launcher_foreground.png', size: 144, type: 'adaptive' },
  { path: 'assets/images/android/mipmap-xxhdpi/ic_launcher.png', size: 144, type: 'icon' },
  { path: 'assets/images/android/mipmap-xxhdpi/ic_launcher_round.png', size: 144, type: 'icon' },
  { path: 'assets/images/android/mipmap-xxhdpi/ic_launcher_foreground.png', size: 216, type: 'adaptive' },
  { path: 'assets/images/android/mipmap-xxxhdpi/ic_launcher.png', size: 192, type: 'icon' },
  { path: 'assets/images/android/mipmap-xxxhdpi/ic_launcher_round.png', size: 192, type: 'icon' },
  { path: 'assets/images/android/mipmap-xxxhdpi/ic_launcher_foreground.png', size: 288, type: 'adaptive' },

  // iOS app icon
  { path: 'ios/TeamHub/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png', size: 1024, type: 'icon' },
];

console.log('Generating TeamHub icons with text inset for circular safe zone...\n');

for (const file of iconFiles) {
  const fullPath = path.join(outputDir, file.path);

  // Skip if the directory doesn't exist (don't create new mipmap dirs)
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    console.log(`  SKIP (dir missing): ${file.path}`);
    continue;
  }

  let buffer;
  switch (file.type) {
    case 'icon':
      buffer = generateIcon(file.size);
      break;
    case 'adaptive':
      buffer = generateAdaptiveForeground(file.size);
      break;
    case 'splash':
      buffer = generateSplashIcon(file.size);
      break;
  }

  fs.writeFileSync(fullPath, buffer);
  console.log(`  OK: ${file.path} (${file.size}x${file.size})`);
}

console.log('\nDone! All icons regenerated with text safely inset.');
