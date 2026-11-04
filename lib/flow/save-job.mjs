#!/usr/bin/env node
// npm run save-job -- <job number> [more numbers]
//
// Takes job numbers from the last find-jobs list, fetches each full job
// description, and saves it as an application folder:
//   output/applications/<NN>-<company>-<role>/job.md
// The job is added to the pipeline with status "shortlisted".

import { writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import {
  ROOT, PATHS, ensureDir, parseArgs, readJson, htmlToText, slugify, loadPipeline, savePipeline, applicationDir,
} from './common.mjs';
import { jobKeywords } from './keywords.mjs';

const UA = 'Mozilla/5.0 (compatible; sg-job-hunter/2.0; +https://github.com/iamBertBrainCo/sg-job-hunter)';
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

const { args } = parseArgs();
const numbers = args.flatMap((a) => a.split(/[\s,]+/)).map(Number).filter((n) => Number.isInteger(n) && n > 0);
const search = readJson(PATHS.jobs, null);
if (!search) {
  console.log('No job list yet. Run npm run find-jobs -- "<role>" first.');
  process.exit(1);
}
if (!numbers.length) {
  console.log(`Which job? e.g. npm run save-job -- 3   (the list has jobs 1–${search.jobs.length})`);
  process.exit(1);
}

async function fetchText(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'user-agent': UA, ...(init.headers || {}) }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fullDescription(job) {
  const d = job.detail || {};
  if (d.kind === 'mcf') {
    const j = JSON.parse(await fetchText(`https://api.mycareersfuture.gov.sg/v2/jobs/${d.uuid}`));
    const extra = [
      j.minimumYearsExperience != null ? `Minimum experience: ${j.minimumYearsExperience} years` : '',
      (j.employmentTypes || []).length ? `Employment type: ${j.employmentTypes.map((e) => e.employmentType).join(', ')}` : '',
      (j.skills || []).length ? `Skills listed by employer: ${j.skills.map((s) => s.skill).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    return `${htmlToText(j.description)}\n\n${extra}`.trim();
  }
  if (d.kind === 'jobstreet') {
    const body = {
      operationName: 'jobDetails',
      variables: { jobId: d.id },
      query: 'query jobDetails($jobId: ID!) { jobDetails(id: $jobId) { job { content(platform: WEB) } } }',
    };
    const j = JSON.parse(await fetchText(`https://${d.host}/graphql`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    const html = j?.data?.jobDetails?.job?.content;
    if (html) return htmlToText(html);
  }
  if (job.description && job.description.length > 400) return job.description;
  try {
    return htmlToText(await fetchText(job.url)).slice(0, 12000);
  } catch {
    return job.description || '';
  }
}

// Keywords an ATS is likely to screen for: the job title, the employer's own
// skill tags (MyCareersFuture), and recognised terms in the description.
function keywordsFor(job, text) {
  const title = job.title.replace(/\(.*?\)|\[.*?\]|#\w+|\s[-–|/]\s.*$/g, '').trim();
  return jobKeywords(text, [title.length < 60 ? title : '', ...(job.skills || [])]);
}

const pipeline = loadPipeline();
const saved = [];
for (const n of numbers) {
  const job = search.jobs.find((j) => j.n === n);
  if (!job) {
    console.log(`Job ${n} is not in the list (1–${search.jobs.length}). Skipped.`);
    continue;
  }
  const existing = pipeline.applications.find((a) => a.url === job.url);
  if (existing) {
    console.log(`Job ${n} is already saved as application ${existing.num} (${existing.folder}).`);
    saved.push(existing);
    continue;
  }
  let text = '';
  try {
    text = await fullDescription(job);
  } catch (e) {
    text = job.description || '';
    console.log(`Note: could not download the full description for job ${n} (${e.message}). Ask the user to paste it into job.md if it looks short.`);
  }
  const num = pipeline.applications.reduce((m, a) => Math.max(m, a.num), 0) + 1;
  const folder = `${String(num).padStart(2, '0')}-${slugify(job.company, 24)}-${slugify(job.title, 32)}`;
  const app = {
    num, folder, title: job.title, company: job.company, location: job.location, salary: job.salary,
    url: job.url, source: job.source, posted: job.posted, keywords: keywordsFor(job, text),
    status: 'shortlisted', savedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const dir = ensureDir(applicationDir(app));
  writeFileSync(join(dir, 'job.md'), [
    `# ${job.title}`,
    '',
    `- Company: ${job.company}`,
    `- Location: ${job.location}`,
    `- Salary: ${job.salary || 'not stated'}`,
    `- Posted: ${job.posted || 'unknown'} on ${job.source}`,
    `- Apply here: ${job.url}`,
    `- ATS keywords: ${app.keywords.join(', ')}`,
    '',
    '## Job description',
    '',
    text || '(The description could not be downloaded. Paste it here.)',
    '',
  ].join('\n'), 'utf-8');
  pipeline.applications.push(app);
  saved.push(app);
  console.log(`Saved job ${n} as application ${num}: ${job.title} — ${job.company}\n  Folder: ${rel(dir)}`);
}
savePipeline(pipeline);

if (saved.length === 1) {
  const app = saved[0];
  const jobMd = join(applicationDir(app), 'job.md');
  console.log(`\nATS keywords: ${app.keywords.join(', ')}`);
  console.log(`\nNEXT STEP: read ${jobMd} and ${PATHS.cv}, then write ${join(applicationDir(app), 'resume.md')} (same format as cv.md, tailored to this job, facts only), then run: npm run resume -- ${app.num}`);
} else if (saved.length > 1) {
  console.log(`\nNEXT STEP: work on one at a time. For application ${saved[0].num}: read ${join(applicationDir(saved[0]), 'job.md')} and ${PATHS.cv}, write ${join(applicationDir(saved[0]), 'resume.md')}, then npm run resume -- ${saved[0].num}`);
}
process.exit(existsSync(PATHS.pipeline) ? 0 : 1);
