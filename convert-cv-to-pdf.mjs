// convert-cv-to-pdf.mjs — Convert MD CV files to PDF using Playwright
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const cvFiles = [
  // Add one entry per tailored CV when generating packages, e.g.:
  // { md: 'output/cv-<role>.md', pdf: 'output/cv-<name>-<role>.pdf', title: '<Name> — <Role Title>' },
];

function mdToHtml(md, title) {
  // Simple MD to HTML conversion
  const lines = md.split('\n');
  let html = `<html><head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
  h1 { font-size: 22px; color: #1a1a1a; margin-bottom: 4px; border-bottom: 2px solid #2c7be5; padding-bottom: 8px; }
  h2 { font-size: 14px; color: #2c7be5; margin-top: 16px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  h3 { font-size: 12px; color: #1a1a1a; margin-top: 12px; margin-bottom: 2px; font-weight: 600; }
  p { margin-bottom: 6px; }
  ul { margin-left: 16px; margin-bottom: 8px; }
  li { margin-bottom: 2px; }
  .contact { font-size: 11px; color: #666; margin-bottom: 16px; }
  .section { margin-bottom: 16px; }
  .bold { font-weight: 600; }
  hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
</style></head><body>`;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      html += `<h1>${line.slice(2)}</h1>`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${line.slice(3)}</h2>`;
    } else if (line.startsWith('### ')) {
      html += `<h3>${line.slice(4)}</h3>`;
    } else if (line.startsWith('- ')) {
      html += `<li>${line.slice(2)}</li>`;
    } else if (line.startsWith('**')) {
      html += `<p class="bold">${line.replace(/\*\*/g, '')}</p>`;
    } else if (line === '---') {
      html += `<hr>`;
    } else if (line.trim()) {
      html += `<p>${line}</p>`;
    }
  }

  html += '</body></html>';
  return html;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const file of cvFiles) {
    console.log(`📄 Converting ${file.md} → ${file.pdf}`);
    const md = readFileSync(join(file.md), 'utf-8');
    const html = mdToHtml(md, file.title);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: join(file.pdf),
      format: 'A4',
      margin: { top: '0.6in', right: '0.6in', bottom: '0.6in', left: '0.6in' },
      printBackground: true,
    });

    await page.close();
    console.log(`   ✅ Saved ${file.pdf}`);
  }

  await browser.close();
  console.log('\n✅ All CVs converted to PDF!');
}

main().catch(console.error);
