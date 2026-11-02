// fetch-jds.mjs — Fetch job descriptions from URLs using Playwright
// Usage: node fetch-jds.mjs <url1> <url2> ...

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const urls = process.argv.slice(2);

async function fetchJD(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Extract JD content
    const jd = await page.evaluate(() => {
      // Try multiple selectors for JD content
      const selectors = [
        '[class*="job-description"]',
        '[class*="job_description"]',
        '[class*="description"]',
        '[data-testid="job-description"]',
        '.job-details',
        '.job-description',
        'main',
        'article'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.length > 200) {
          return el.textContent.trim();
        }
      }

      // Fallback: get all text from main content
      const main = document.querySelector('main');
      return main ? main.textContent.trim() : 'No JD found';
    });

    return { url, jd, length: jd.length };
  } catch (error) {
    return { url, jd: `Error: ${error.message}`, length: 0 };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`📡 Fetching JDs for ${urls.length} jobs...\n`);

  const results = [];
  for (const url of urls) {
    console.log(`Fetching: ${url}`);
    const result = await fetchJD(url);
    results.push(result);
    console.log(`   → ${result.length} chars\n`);
  }

  // Save to file
  const output = results.map(r => `# ${r.url}\n\n${r.jd}`).join('\n\n' + '='.repeat(80) + '\n\n');
  writeFileSync(join('data', 'fetched-jds.txt'), output);
  console.log('💾 Saved to data/fetched-jds.txt');
}

main().catch(console.error);
