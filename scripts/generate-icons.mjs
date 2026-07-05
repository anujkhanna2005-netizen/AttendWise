/**
 * generate-icons.mjs
 * Converts public/favicon.svg into PNG icons at multiple sizes required for:
 * - PWA web manifest (48, 72, 96, 144, 192, 512)
 * - iOS apple-touch-icon (180)
 * - Maskable/adaptive icon (512 with padding)
 *
 * Uses the `sharp` library (installed temporarily). Run with:
 *   node scripts/generate-icons.mjs
 */
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SVG_PATH = join(PUBLIC, 'favicon.svg');

// Dynamically import sharp (installed by the calling script)
const sharp = (await import('sharp')).default;

const svgBuffer = readFileSync(SVG_PATH);

const sizes = [48, 72, 96, 144, 192, 512];

async function generateIcon(size, suffix = '') {
  const outPath = join(PUBLIC, `icon-${size}${suffix}.png`);
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath}`);
  return outPath;
}

async function generateMaskable(size) {
  // Maskable icons need ~10% safe zone padding on all sides
  const padding = Math.round(size * 0.1);
  const innerSize = size - padding * 2;
  const outPath = join(PUBLIC, `icon-${size}-maskable.png`);
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 21, g: 18, b: 27, alpha: 255 }, // --color-surface (#15121b)
    }
  })
    .composite([{ input: innerBuffer, top: padding, left: padding }])
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (maskable)`);
}

async function generateAppleTouchIcon() {
  const outPath = join(PUBLIC, 'apple-touch-icon.png');
  // Apple touch icon: 180×180, opaque background, no transparency
  const innerSize = 144;
  const padding = (180 - innerSize) / 2;
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 21, g: 18, b: 27, alpha: 255 } }
  })
    .composite([{ input: innerBuffer, top: Math.round(padding), left: Math.round(padding) }])
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (apple-touch-icon)`);
}

console.log('Generating PWA icons from favicon.svg...\n');
for (const size of sizes) {
  await generateIcon(size);
}
await generateMaskable(512);
await generateAppleTouchIcon();
console.log('\nAll icons generated successfully.');
