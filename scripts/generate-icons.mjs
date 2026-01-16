import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const sourceImage = process.argv[2] || join(projectRoot, 'public', 'icons', 'source-icon.png');
const outputDir = join(projectRoot, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  console.log(`Generating PWA icons from: ${sourceImage}`);
  console.log(`Output directory: ${outputDir}`);

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated: icon-${size}x${size}.png`);
  }

  // Generate maskable icon (with padding for safe zone)
  const maskableSize = 512;
  const maskableOutputPath = join(outputDir, `maskable-icon-${maskableSize}x${maskableSize}.png`);
  
  // For maskable icons, the safe zone is 80% of the total size
  // So we resize the icon to 80% and center it with padding
  const safeZoneSize = Math.floor(maskableSize * 0.8);
  const padding = Math.floor((maskableSize - safeZoneSize) / 2);
  
  await sharp(sourceImage)
    .resize(safeZoneSize, safeZoneSize, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(maskableOutputPath);
  
  console.log(`✓ Generated: maskable-icon-${maskableSize}x${maskableSize}.png`);

  // Generate Apple Touch Icon
  const appleTouchIconPath = join(outputDir, 'apple-touch-icon.png');
  await sharp(sourceImage)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(appleTouchIconPath);
  
  console.log(`✓ Generated: apple-touch-icon.png`);

  // Generate favicon
  const faviconPath = join(outputDir, 'favicon.ico');
  await sharp(sourceImage)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(join(outputDir, 'favicon-32x32.png'));
  
  console.log(`✓ Generated: favicon-32x32.png`);

  await sharp(sourceImage)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toFile(join(outputDir, 'favicon-16x16.png'));
  
  console.log(`✓ Generated: favicon-16x16.png`);

  console.log('\n✅ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
