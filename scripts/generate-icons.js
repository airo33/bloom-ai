// Generate every Android + iOS icon variant + splash from one SVG source.
// Run with: `node scripts/generate-icons.js`
//
// Output PNGs land in /assets and are referenced from app.json. Each PNG
// is 1024×1024 — Expo/EAS scales them to platform-specific sizes at build
// time.

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const LIME = '#B5E550';
const DARK_INK = '#0A0A0A';

// Sprout glyph — stem path is a stroked line, the two leaves are
// filled shapes. Renders consistently from 24 px to 1024 px.
const STEM = 'M16 24 V13';
const LEAF_LEFT  = 'M16 14 C 13.5 11 9.5 11 8 14 C 10 16 14 16 16 14 Z';
const LEAF_RIGHT = 'M16 11 C 18.5 8 22.5 8 24 11 C 22 13 18 13 16 11 Z';

/**
 * Build an SVG string. `viewBox` is always 0 0 32 32 so the R glyph
 * geometry stays consistent across every output; the rendered PNG size
 * is the actual image dimension we want.
 */
function svg({
  size = 1024,
  background = LIME,
  inkColor = DARK_INK,
  // Inset of the R glyph from the canvas edge as a percentage of canvas
  // size — Android adaptive icons need a 33% safe-zone padding.
  inkInset = 0,
  // When true, no rounded square — R alone on transparent.
  glyphOnly = false,
  // When true, omit the R glyph entirely (solid-fill backgrounds).
  noGlyph = false,
  // Optional rounded-square radius (0..16 — viewBox is 32×32)
  cornerRadius = 9,
}) {
  const cell = 32;
  // The R glyph occupies 10..24 horizontally (≈ 14u wide) of the 32u
  // viewBox — to inset we scale + translate it.
  const scale = 1 - inkInset * 2;
  const translate = (cell - cell * scale) / 2;

  const bgRect = glyphOnly
    ? ''
    : `<rect x="0" y="0" width="${cell}" height="${cell}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${background}"/>`;

  const glyph = noGlyph
    ? ''
    : `<g transform="translate(${translate} ${translate}) scale(${scale})">
        <path d="${STEM}" stroke="${inkColor}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="${LEAF_LEFT}" fill="${inkColor}"/>
        <path d="${LEAF_RIGHT}" fill="${inkColor}"/>
      </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cell} ${cell}" width="${size}" height="${size}">
    ${bgRect}
    ${glyph}
  </svg>`;
}

function render(svgString, size) {
  const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

function writePng(outPath, buf) {
  fs.writeFileSync(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  wrote ${path.relative(process.cwd(), outPath)} (${kb} KB)`);
}

function main() {
  const out = path.resolve(__dirname, '..', 'assets');
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

  console.log('Generating icons + splash from R logo...\n');

  // 1. icon.png — used by iOS and Android legacy launcher.
  //    Lime rounded-square background, dark R glyph.
  writePng(
    path.join(out, 'icon.png'),
    render(svg({ size: 1024 }), 1024),
  );

  // 2. android-icon-foreground.png — adaptive icon foreground.
  //    Transparent background, R glyph centered in the Android safe zone
  //    (innermost 66% of the canvas), so when the launcher applies a
  //    circular / squircle mask the R isn't clipped.
  writePng(
    path.join(out, 'android-icon-foreground.png'),
    render(svg({ size: 1024, glyphOnly: true, inkInset: 0.18 }), 1024),
  );

  // 3. android-icon-background.png — solid lime fill (matches the
  //    backgroundColor set in app.json so the two stay in sync).
  writePng(
    path.join(out, 'android-icon-background.png'),
    render(
      svg({ size: 1024, background: LIME, cornerRadius: 0, noGlyph: true }),
      1024,
    ),
  );

  // 4. android-icon-monochrome.png — Android 13+ themed icons. Same
  //    silhouette as foreground but drawn in white on transparent; the
  //    launcher recolors it according to the user's wallpaper theme.
  writePng(
    path.join(out, 'android-icon-monochrome.png'),
    render(
      svg({
        size: 1024,
        glyphOnly: true,
        inkInset: 0.18,
        inkColor: '#FFFFFF',
      }),
      1024,
    ),
  );

  // 5. splash-icon.png — the brand mark shown on the splash screen by
  //    expo-splash-screen plugin. Transparent canvas; the plugin
  //    background-fills with `backgroundColor` from app.json.
  writePng(
    path.join(out, 'splash-icon.png'),
    render(
      svg({ size: 1024, glyphOnly: false, cornerRadius: 16 }),
      1024,
    ),
  );

  console.log('\nDone. All PNGs are 1024×1024; Expo scales them per platform.');
}

main();
