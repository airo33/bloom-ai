// Convert legal/*.md → legal/html/*.html with a clean, mobile-friendly
// template ready to drop on GitHub Pages.
//
// Usage: `node scripts/build-legal-html.mjs`
//
// We deliberately ship a tiny vanilla-CSS template instead of pulling in a
// markdown library or a static-site generator — the legal pages should
// load fast, have zero dependencies, and survive any infra change. The
// regex-based renderer handles only the markdown features actually used
// in these two files (h1/h2/h3, paragraphs, bold, lists, tables, the
// stylized "**Last updated**" header lines).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'legal');
const OUT = path.join(SRC, 'html');

const PAGES = [
  { md: 'privacy-policy.md', html: 'privacy.html', title: 'Privacy Policy · Mend AI' },
  { md: 'terms-of-service.md', html: 'terms.html', title: 'Terms of Service · Mend AI' },
];

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  // Bold first (we don't render italics — not used in the source).
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (/^### /.test(line)) {
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (/^# /.test(line)) {
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
      i++;
      continue;
    }

    // Tables (pipe-style with separator row of dashes)
    if (line.includes('|') && lines[i + 1] && /^[-|: ]+$/.test(lines[i + 1])) {
      const headerCells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i]
          .split('|')
          .map((c) => c.trim())
          .filter((c, idx, arr) => !(idx === 0 || idx === arr.length - 1) || c);
        rows.push(cells);
        i++;
      }
      out.push('<table>');
      out.push(
        `<thead><tr>${headerCells.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`,
      );
      out.push('<tbody>');
      for (const r of rows) {
        out.push(`<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`);
      }
      out.push('</tbody></table>');
      continue;
    }

    // Bullet lists
    if (/^[-*] /.test(line)) {
      out.push('<ul>');
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        out.push(`<li>${inline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }

    // Blank line — paragraph break
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — accumulate consecutive non-blank, non-heading lines
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3} /.test(lines[i]) &&
      !/^[-*] /.test(lines[i]) &&
      !(lines[i].includes('|') && lines[i + 1] && /^[-|: ]+$/.test(lines[i + 1]))
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  return out.join('\n');
}

const CSS = `
  :root {
    --bg: #ffffff;
    --fg: #1a1a1a;
    --muted: #6b6b6b;
    --accent: #4a7c1a;
    --border: #ececec;
    --card: #fafafa;
    --max: 720px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d0d0d;
      --fg: #f4f4f4;
      --muted: #999;
      --accent: #c8eb6b;
      --border: #232323;
      --card: #161616;
    }
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro", Inter, Segoe UI, Roboto, system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: var(--max); margin: 0 auto; padding: 32px 22px 80px; }
  header.brand {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 32px;
    padding-bottom: 18px; border-bottom: 1px solid var(--border);
  }
  .logo {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 14px; color: #0a0a0a;
    letter-spacing: 0.5px;
  }
  .brand-name { font-weight: 800; font-size: 18px; letter-spacing: -0.3px; }
  .brand-sub  { font-size: 12px; color: var(--muted); margin-top: 1px; }
  h1 { font-size: 30px; line-height: 1.2; letter-spacing: -0.6px; margin: 8px 0 18px; }
  h2 { font-size: 20px; letter-spacing: -0.3px; margin: 32px 0 10px; }
  h3 { font-size: 17px; letter-spacing: -0.2px; margin: 22px 0 6px; }
  p  { margin: 8px 0; }
  ul { padding-left: 20px; margin: 8px 0 14px; }
  li { margin: 4px 0; }
  strong { font-weight: 700; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  table {
    width: 100%; border-collapse: collapse; margin: 14px 0 20px;
    background: var(--card); border-radius: 12px; overflow: hidden;
    border: 1px solid var(--border);
  }
  th, td {
    text-align: left; padding: 10px 12px;
    border-bottom: 1px solid var(--border); font-size: 14px;
  }
  th { background: rgba(0,0,0,0.03); font-weight: 700; }
  @media (prefers-color-scheme: dark) {
    th { background: rgba(255,255,255,0.04); }
  }
  tr:last-child td { border-bottom: 0; }
  footer.foot {
    margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--border);
    font-size: 13px; color: var(--muted); display: flex; gap: 16px; flex-wrap: wrap;
  }
`.trim();

function pageHtml(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <meta name="robots" content="index,follow" />
  <style>${CSS}</style>
</head>
<body>
  <main class="wrap">
    <header class="brand">
      <div class="logo">M</div>
      <div>
        <div class="brand-name">Mend AI</div>
        <div class="brand-sub">AI-guided recovery</div>
      </div>
    </header>
    ${body}
    <footer class="foot">
      <a href="./index.html">Home</a>
      <a href="./privacy.html">Privacy</a>
      <a href="./terms.html">Terms</a>
      <a href="mailto:i.arturcompany@gmail.com">Contact</a>
    </footer>
  </main>
</body>
</html>
`;
}

const INDEX_BODY = `
  <h1>Mend AI — legal</h1>
  <p>Mend AI is an AI-guided recovery companion. The documents below describe how the app uses your data and the terms under which you may use it.</p>
  <ul>
    <li><a href="./privacy.html">Privacy Policy</a></li>
    <li><a href="./terms.html">Terms of Service</a></li>
  </ul>
  <p>Questions? Reach us at <a href="mailto:i.arturcompany@gmail.com">i.arturcompany@gmail.com</a>.</p>
`;

function build() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  for (const p of PAGES) {
    const md = fs.readFileSync(path.join(SRC, p.md), 'utf8');
    const body = renderMarkdown(md);
    const html = pageHtml(p.title, body);
    fs.writeFileSync(path.join(OUT, p.html), html);
    console.log(`✓ wrote legal/html/${p.html}`);
  }

  fs.writeFileSync(path.join(OUT, 'index.html'), pageHtml('Mend AI · Legal', INDEX_BODY));
  console.log('✓ wrote legal/html/index.html');
}

build();
