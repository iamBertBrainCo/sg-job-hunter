// scrape-more-jobs.mjs — Scrape additional L&D/OD jobs from multiple portals
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

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
  'HR Business Partner', 'Lecturer', 'Industry Trainer',
  'Talent Development Manager', 'Organisational Learning'
];

const EXCLUDE_KEYWORDS = [
  'Intern', 'Junior', 'Entry Level', 'Trainee',
  'Sales', 'Revenue', 'Business Development',
  'Security', 'Physical Security', 'Cybersecurity',
  'Software Engineer', 'DevOps', 'Backend', 'Frontend',
  'Data Engineer', 'Machine Learning',
  'Customer Service', 'Call Center',
  'Supply Chain', 'Logistics', 'Warehouse',
  'Financial Analyst', 'Accountant',
  'Associate Executive', 'Assistant', 'Executive' // Too junior
];

const PORTALS = [
  { name: 'JobStreet SG - Talent Development', url: 'https://sg.jobstreet.com/talent-development-jobs' },
  { name: 'JobStreet SG - Training Manager', url: 'https://sg.jobstreet.com/training-manager-jobs' },
  { name: 'JobStreet SG - People Development', url: 'https://sg.jobstreet.com/people-development-jobs' },
  { name: 'JobStreet SG - Learning Designer', url: 'https://sg.jobstreet.com/learning-designer-jobs' },
  { name: 'JobStreet SG - Capability Development', url: 'https://sg.jobstreet.com/capability-development-jobs' },
  { name: 'MyCareersFuture - Talent Development', url: 'https://www.mycareersfuture.gov.sg/search/talent-development-jobs' },
  { name: 'MyCareersFuture - Training Manager', url: 'https://www.mycareersfuture.gov.sg/search/training-manager-jobs' },
  { name: 'MyCareersFuture - People Development', url: 'https://www.mycareersfuture.gov.sg/search/people-development-jobs' },
];

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

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
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

    await page.waitForTimeout(3000);

    const jobs = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/job/"], a[href*="jobs/view/"]');

      links.forEach(link => {
        const href = link.href;
        const text = link.textContent.trim();

        const titleMatch = text.match(/^(.{10,200})\s*[-–—]\s*(.+)$/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          const company = titleMatch[2].trim();
          results.push({ title, company, url: href });
        } else {
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

    const filtered = jobs
      .filter(j => matchesTarget(j.title))
      .filter(j => !shouldExclude(j.title))
      .slice(0, 10);

    console.log(`   Found ${jobs.length} raw, ${filtered.length} after filtering`);
    return filtered;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔍 Scraping additional L&D/OD jobs...\n');

  const allJobs = [];
  const existingUrls = new Set();

  // Load existing scraped jobs to avoid duplicates
  try {
    const existing = JSON.parse(readFileSync(join('data', 'scraped-jobs.json'), 'utf-8'));
    existing.forEach(j => existingUrls.add(j.url.split('?')[0]));
    console.log(`   Already have ${existingUrls.size} jobs, avoiding duplicates\n`);
  } catch (e) {
    // No existing file
  }

  for (const portal of PORTALS) {
    const jobs = await scrapePortal(portal.name, portal.url);
    allJobs.push(...jobs.map(j => ({ ...j, source: portal.name })));
  }

  // Deduplicate
  const unique = [];
  for (const job of allJobs) {
    const key = job.url.split('?')[0];
    if (!existingUrls.has(key)) {
      existingUrls.add(key);
      unique.push(job);
    }
  }

  console.log(`\n✅ Found ${unique.length} NEW unique jobs`);

  if (unique.length > 0) {
    // Append to existing scraped jobs
    let existing = [];
    try {
      existing = JSON.parse(readFileSync(join('data', 'scraped-jobs.json'), 'utf-8'));
    } catch (e) {
      // No existing file
    }

    const all = [...existing, ...unique];
    writeFileSync(join('data', 'scraped-jobs.json'), JSON.stringify(all, null, 2));
    console.log(`💾 Updated data/scraped-jobs.json (${all.length} total jobs)`);

    // Print new jobs
    console.log('\n📋 New Job Listings:');
    unique.forEach((job, i) => {
      console.log(`   ${i + 1}. ${job.title}`);
      console.log(`      ${job.company} | ${job.source}`);
      console.log(`      ${job.url}`);
    });

    // Update pipeline
    const pipelineContent = `# Pipeline — Pending URLs

## Pending

${all.filter(j => !j.evaluated).map(j => `- [ ] ${j.url} | ${j.company} | ${j.title} | source: ${j.source}`).join('\n')}

## Processed
`;
    writeFileSync(join('data', 'pipeline.md'), pipelineContent);
    console.log(`\n📝 Updated data/pipeline.md`);
    console.log('\n🚀 Run /career-ops pipeline to evaluate these jobs!');
  } else {
    console.log('\n⚠️  No new jobs found.');
  }
}

main().catch(console.error);
