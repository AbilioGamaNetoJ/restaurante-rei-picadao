import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const inputLogo = resolve(projectRoot, 'public/images/logo-rei-picadão.png');
const outputDir = resolve(projectRoot, 'public/icons');

mkdirSync(outputDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generate() {
  // Regular icons (cropped to circle content)
  for (const size of sizes) {
    await sharp(inputLogo)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(resolve(outputDir, `icon-${size}x${size}.png`));
    console.log(`✅ icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  await sharp(inputLogo)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(resolve(outputDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png');

  // Maskable icon (512x512 with 20% padding for safe zone)
  const maskableSize = 512;
  const iconSize = Math.round(maskableSize * 0.8); // 80% of total = icon area
  const padding = Math.round((maskableSize - iconSize) / 2);

  const resizedIcon = await sharp(inputLogo)
    .resize(iconSize, iconSize, { fit: 'cover' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 220, g: 38, b: 38, alpha: 1 } // #dc2626
    }
  })
    .composite([{ input: resizedIcon, left: padding, top: padding }])
    .png()
    .toFile(resolve(outputDir, 'icon-maskable-512x512.png'));
  console.log('✅ icon-maskable-512x512.png');

  // Favicon 32x32
  await sharp(inputLogo)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(resolve(outputDir, 'favicon-32x32.png'));
  console.log('✅ favicon-32x32.png');

  // Favicon 16x16
  await sharp(inputLogo)
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toFile(resolve(outputDir, 'favicon-16x16.png'));
  console.log('✅ favicon-16x16.png');

  console.log('\n🎉 All icons generated in public/icons/');
}

generate().catch(console.error);
