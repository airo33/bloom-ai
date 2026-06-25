// Generate every Android + iOS icon variant + splash from one SVG source.
// Run with: `node scripts/generate-icons.js`
//
// Output PNGs land in /assets and are referenced from app.json. Each PNG
// is 1024×1024 — Expo/EAS scales them to platform-specific sizes at build
// time.
//
// Current brand mark (Bloom AI v1.5+): a 4-point AI spark in electric
// lime on a near-black canvas, with a small dot of the background colour
// showing through the centre — same visual language as Claude / Gemini's
// AI marks, but with a subtle bloom-petal curve on each point.

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const DARK_BG = '#0F0F12';     // canvas / icon background
const LIME_SPARK = '#C8EB6B';  // the spark itself

// 4-point spark with curved petal-shaped points, sized to the 32-unit
// viewBox. Each control point matches the curves used in the icon-picker
// preview — see /icon previews. The inner dot is a tiny circle of the
// background colour, sitting on top of the spark to suggest a "knot"
// at the centre (Claude/Gemini-style).
const SPARK_PATH =
  'M 16 6 Q 17 13 25 16 Q 17 19 16 26 Q 15 19 7 16 Q 15 13 16 6 Z';
const CENTER_DOT_R = 1.3;

/**
 * Build an SVG string. `viewBox` is always 0 0 32 32 so the spark
 * geometry stays consistent across every output; the rendered PNG size
 * is the actual image dimension we want.
 */
function svg({
  size = 1024,
  background = DARK_BG,
  inkColor = LIME_SPARK,
  // Inset of the spark from the canvas edge as a percentage of canvas
  // size — Android adaptive icons need a 33% safe-zone padding.
  inkInset = 0,
  // When true, no rounded square — spark alone on transparent.
  glyphOnly = false,
  // When true, omit the spark entirely (solid-fill backgrounds).
  noGlyph = false,
  // Optional rounded-square radius (0..16 — viewBox is 32×32)
  cornerRadius = 9,
}) {
  const cell = 32;
  const scale = 1 - inkInset * 2;
  const translate = (cell - cell * scale) / 2;

  const bgRect = glyphOnly
    ? ''
    : `<rect x="0" y="0" width="${cell}" height="${cell}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${background}"/>`;

  // Centre dot's fill needs to be the canvas background when we have
  // one, but for monochrome / themed icons we want the dot to be
  // transparent (cut a real hole). Use a `<mask>` so themed icons cut
  // through, and a coloured dot for normal renders.
  const usesTransparentDot = glyphOnly;
  const dotFill = usesTransparentDot ? 'black' : background;
  const maskAttr = usesTransparentDot ? ' mask="url(#sparkMask)"' : '';

  const glyph = noGlyph
    ? ''
    : `${
        usesTransparentDot
          ? `<defs>
        <mask id="sparkMask">
          <rect width="${cell}" height="${cell}" fill="white"/>
          <circle cx="16" cy="16" r="${CENTER_DOT_R}" fill="black"/>
        </mask>
      </defs>`
          : ''
      }
      <g transform="translate(${translate} ${translate}) scale(${scale})">
        <path d="${SPARK_PATH}" fill="${inkColor}"${maskAttr}/>
        ${
          usesTransparentDot
            ? ''
            : `<circle cx="16" cy="16" r="${CENTER_DOT_R}" fill="${dotFill}"/>`
        }
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

  console.log('Generating icons + splash from Bloom AI spark logo...\n');

  // 1. icon.png — used by iOS and Android legacy launcher.
  writePng(
    path.join(out, 'icon.png'),
    render(svg({ size: 1024 }), 1024),
  );

  // 2. android-icon-foreground.png — adaptive icon foreground.
  //    Transparent background, spark centered in the Android safe zone.
  writePng(
    path.join(out, 'android-icon-foreground.png'),
    render(svg({ size: 1024, glyphOnly: true, inkInset: 0.18 }), 1024),
  );

  // 3. android-icon-background.png — solid dark fill (matches
  //    backgroundColor set in app.json so the two stay in sync).
  writePng(
    path.join(out, 'android-icon-background.png'),
    render(
      svg({ size: 1024, background: DARK_BG, cornerRadius: 0, noGlyph: true }),
      1024,
    ),
  );

  // 4. android-icon-monochrome.png — Android 13+ themed icons. Spark
  //    silhouette in white on transparent; the launcher recolours it
  //    per the user's wallpaper.
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

  // 5. splash-icon.png — brand mark on the splash screen. Full
  //    rounded-square render so the splash plugin can frame it on its
  //    backgroundColor (set to DARK_BG in app.json).
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
