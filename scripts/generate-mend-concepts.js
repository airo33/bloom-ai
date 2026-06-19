// Generate 4 logo concepts for "Mend" — outputs PNGs to /mend-concepts/
// so the user can open them and pick a direction. Run:
//   node scripts/generate-mend-concepts.js

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const LIME = '#B5E550';
const DARK_INK = '#0A0A0A';
const SIZE = 512;

function tile({ children, bg = LIME }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${SIZE}" height="${SIZE}">
    <rect x="0" y="0" width="32" height="32" rx="9" ry="9" fill="${bg}"/>
    ${children}
  </svg>`;
}

// CONCEPT A — STITCH
// A horizontal line (the "tear") with X-marks crossing it. Reads as
// a suture stitch healing a wound. Most explicit "mending" visual.
const conceptA_Stitch = tile({
  children: `
    <line x1="6" y1="16" x2="26" y2="16" stroke="${DARK_INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 12 L11 20 M11 12 L9 20" stroke="${DARK_INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M15 12 L17 20 M17 12 L15 20" stroke="${DARK_INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M21 12 L23 20 M23 12 L21 20" stroke="${DARK_INK}" stroke-width="2" stroke-linecap="round"/>
  `,
});

// CONCEPT B — SPROUT
// Vertical stem with two leaves emerging upward. Growth, regeneration.
// Warm, organic, friendly.
const conceptB_Sprout = tile({
  children: `
    <path d="M16 24 V13" stroke="${DARK_INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M16 14 C 13.5 11 9.5 11 8 14 C 10 16 14 16 16 14 Z" fill="${DARK_INK}"/>
    <path d="M16 11 C 18.5 8 22.5 8 24 11 C 22 13 18 13 16 11 Z" fill="${DARK_INK}"/>
  `,
});

// CONCEPT C — TWO ARCS JOINING
// Two semicircles meeting in the middle, suggesting two halves being
// rejoined. Geometric, abstract, balanced.
const conceptC_Arcs = tile({
  children: `
    <path d="M16 8 A 6 6 0 0 0 16 20" stroke="${DARK_INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M16 12 A 6 6 0 0 1 16 24" stroke="${DARK_INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  `,
});

// CONCEPT D — M WORDMARK
// Bold geometric M letterform. Brand-centric like the original R was.
// Strong, recognizable, ownable.
const conceptD_M = tile({
  children: `
    <path d="M7 23 L7 9 L16 18 L25 9 L25 23"
          stroke="${DARK_INK}" stroke-width="2.8" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  `,
});

// BONUS — HEART-PULSE
// Heart silhouette with a heartbeat line inside. Care + life.
const conceptE_Heart = tile({
  children: `
    <path d="M16 23 C 8 18 6 13 9 10 C 12 7 14 9 16 12 C 18 9 20 7 23 10 C 26 13 24 18 16 23 Z"
          fill="${DARK_INK}"/>
    <path d="M11 15 L13 15 L14 12 L16 18 L18 13 L19 15 L21 15"
          stroke="${LIME}" stroke-width="1.4" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  `,
});

const concepts = [
  { name: 'A-stitch', svg: conceptA_Stitch, desc: 'Suture stitch — most literal "mending" icon' },
  { name: 'B-sprout', svg: conceptB_Sprout, desc: 'Sprout with leaves — growth, regeneration' },
  { name: 'C-arcs',  svg: conceptC_Arcs,   desc: 'Two arcs joining — abstract reunion' },
  { name: 'D-wordmark-M', svg: conceptD_M, desc: 'Bold M letterform — brand-centric' },
  { name: 'E-heart-pulse', svg: conceptE_Heart, desc: 'Heart + heartbeat — care + life' },
];

const outDir = path.resolve(__dirname, '..', 'mend-concepts');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Generating Mend logo concepts...\n');
for (const c of concepts) {
  const resvg = new Resvg(c.svg, { fitTo: { mode: 'width', value: SIZE } });
  const png = resvg.render().asPng();
  const out = path.join(outDir, `mend-${c.name}.png`);
  fs.writeFileSync(out, png);
  console.log(`  ✓ ${path.relative(process.cwd(), out)} — ${c.desc}`);
}

// Also generate a side-by-side comparison sheet (1 image, 5 tiles)
function comparison() {
  const w = SIZE * 5 + 80; // 5 tiles + gaps
  const h = SIZE + 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#FAFAFA"/>
    ${concepts.map((c, i) => {
      const x = 16 + i * (SIZE + 16);
      return `
        <g transform="translate(${x} 16)">
          <svg viewBox="0 0 32 32" width="${SIZE}" height="${SIZE}">
            <rect x="0" y="0" width="32" height="32" rx="9" ry="9" fill="${LIME}"/>
            ${c.svg.match(/<rect[^>]*>([\s\S]*)<\/svg>/)[1]}
          </svg>
          <text x="${SIZE / 2}" y="${SIZE + 40}" font-family="sans-serif" font-size="22" font-weight="700" fill="#0A0A0A" text-anchor="middle">
            ${c.name.replace(/^[A-Z]-/, '')}
          </text>
          <text x="${SIZE / 2}" y="${SIZE + 70}" font-family="sans-serif" font-size="14" fill="#71717A" text-anchor="middle">
            Option ${c.name[0]}
          </text>
        </g>
      `;
    }).join('')}
  </svg>`;
}

const compSvg = comparison();
const compResvg = new Resvg(compSvg);
fs.writeFileSync(path.join(outDir, 'all-concepts.png'), compResvg.render().asPng());
console.log(`\n  ✓ ${path.relative(process.cwd(), path.join(outDir, 'all-concepts.png'))} — all 5 side-by-side`);

console.log('\nOpen the PNGs in File Explorer — they\'re at 512×512 so they look exactly like the real icon would on a phone screen.');
