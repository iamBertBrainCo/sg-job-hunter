// scrape-jobs.mjs — Scrape L&D/OD jobs from JobStreet and MyCareersFuture
// Usage: node scrape-jobs.mjs [--portal jobstreet|mycareersfuture|all] [--max 20]

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const portal = args.find(a => a.startsWith('--portal'))?.split('=')[1] || 'all';
const max = parseInt(args.find(a => a.startsWith('--max'))?.split('=')[1] || '20');

const TARGET_KEYWORDS = [
  'Learning and Development', 'Learning & Development', 'Learning Development',
  'Organizational Development', 'Organisation Development', 'Organisational Development',
  'Talent Development', 'People Development', 'Workforce Development',
  'Training Manager', 'Training Consultant', 'Master Trainer',
  'Learning Designer', 'Learning Experience Designer', 'Instructional Designer',
  'Curriculum Designer', 'Curriculum Developer',
  'Creative Technologist', 'Content Strategy', 'Creative Producer',
  'Programme Facilitator', 'Innovation Facilitator',
  'People Development Manager', 'Capability Development',
  'HR Business Partner', 'Lecturer', 'Industry Trainer'
];

const EXCLUDE_KEYWORDS = [
  'Intern', 'Junior', 'Entry Level', 'Trainee',
  'Sales', 'Revenue', 'Business Development',
  'Security', 'Physical Security', 'Cybersecurity',
  'Software Engineer', 'DevOps', 'Backend', 'Frontend',
  'Data Engineer', 'Machine Learning',
  'Customer Service', 'Call Center',
  'Supply Chain', 'Logistics', 'Warehouse',
  'Financial Analyst', 'Accountant'
];

const PORTALS = {
  jobstreet: {
    url: 'https://sg.jobstreet.com/learning-and-development-manager-jobs',
    name: 'JobStreet Singapore',
    selectors: {
      // JobStreet uses dynamic classes, we'll extract via text content
      jobContainer: 'a[href*="/job/"]',
    }
  },
  mycareersfuture: {
    url: 'https://www.mycareersfuture.gov.sg/search/learning-development-jobs',
    name: 'MyCareersFuture',
    selectors: {
      jobContainer: 'a[href*="/job/"]',
    }
  }
};

function matchesTarget(title) {
  const lower = title.toLowerCase();
  return TARGET_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

function shouldExclude(title) {
  const lower = title.toLowerCase();
  return EXCLUDE_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

async function scrapePortal(name, url) {
  console.log(`\n📡 Scraping ${name}...`);
  console.log(`   URL: ${url}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Scroll to trigger lazy loading
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 500);
      });
    });

    // Wait for lazy-loaded content
    await page.waitForTimeout(3000);

    // Extract job listings
    const jobs = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/job/"], a[href*="jobs/view/"]');

      links.forEach(link => {
        const href = link.href;
        const text = link.textContent.trim();

        // Look for job title patterns
        const titleMatch = text.match(/^(.{10,150})\s*[-–—]\s*(.+)$/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          const company = titleMatch[2].trim();
          results.push({ title, company, url: href });
        } else {
          // Try to extract title and company from surrounding elements
          const parent = link.closest('div, li, article');
          if (parent) {
            const titleEl = parent.querySelector('h2, h3, [class*="title"], [class*="position"]');
            const companyEl = parent.querySelector('[class*="company"], [class*="employer"]');
            if (titleEl) {
              results.push({
                title: titleEl.textContent.trim(),
                company: companyEl ? companyEl.textContent.trim() : 'Unknown',
                url: href
              });
            }
          }
        }
      });

      return results;
    });

    // Filter jobs
    const filtered = jobs
      .filter(j => matchesTarget(j.title))
      .filter(j => !shouldExclude(j.title))
      .slice(0, max);

    console.log(`   Found ${jobs.length} raw listings, ${filtered.length} after filtering`);

    return filtered;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔍 L&D/OD Job Scraper');
  console.log(`   Target: ${max} jobs max per portal`);

  const allJobs = [];

  if (portal === 'jobstreet' || portal === 'all') {
    const jobs = await scrapePortal(PORTALS.jobstreet.name, PORTALS.jobstreet.url);
    allJobs.push(...jobs.map(j => ({ ...j, source: 'JobStreet' })));
  }

  if (portal === 'mycareersfuture' || portal === 'all') {
    const jobs = await scrapePortal(PORTALS.mycareersfuture.name, PORTALS.mycareersfuture.url);
    allJobs.push(...jobs.map(j => ({ ...j, source: 'MyCareersFuture' })));
  }

  // Deduplicate by URL
  const unique = [];
  const seen = new Set();
  for (const job of allJobs) {
    const key = job.url.split('?')[0];
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(job);
    }
  }

  console.log(`\n✅ Total unique jobs: ${unique.length}`);

  if (unique.length > 0) {
    // Save to JSON
    const jsonPath = join('data', 'scraped-jobs.json');
    writeFileSync(jsonPath, JSON.stringify(unique, null, 2));
    console.log(`\n💾 Saved to ${jsonPath}`);

    // Print summary
    console.log('\n📋 Job Listings:');
    unique.forEach((job, i) => {
      console.log(`   ${i + 1}. ${job.title}`);
      console.log(`      ${job.company} | ${job.source}`);
      console.log(`      ${job.url}`);
    });

    // Update pipeline.md
    console.log('\n📝 Adding to pipeline...');
    const pipelinePath = join('data', 'pipeline.md');
    const pipelineContent = `# Pipeline — Pending URLs

## Pending

${unique.map(j => `- [ ] ${j.url} | ${j.company} | ${j.title} | source: ${j.source}`).join('\n')}

## Processed
`;
    writeFileSync(pipelinePath, pipelineContent);
    console.log(`   Updated ${pipelinePath}`);
    console.log('\n🚀 Run /sg-job-hunter pipeline to evaluate these jobs!');
  } else {
    console.log('\n⚠️  No matching jobs found. Try increasing --max or checking the portal URLs.');
  }
}

main().catch(console.error);
