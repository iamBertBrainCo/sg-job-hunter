#!/usr/bin/env node
// npm run find-jobs -- "<role or industry>" [--where sg|asean|MY,ID,...] [--limit 25]
//
// Searches every enabled source in sources.yml at once (job boards plus
// employer career pages), keeps jobs in the chosen countries, ranks them
// against the role and cv.md, and saves:
//   data/jobs.json  — everything found (used by save-job)
//   data/jobs.md    — the numbered list the user reads
// Then prints the top of the list.

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { ROOT, PATHS, ensureDir, parseArgs, readJson, writeJson, htmlToText, money } from './common.mjs';

const UA = 'Mozilla/5.0 (compatible; sg-job-hunter/2.0; +https://github.com/iamBertBrainCo/sg-job-hunter)';
const TIMEOUT_MS = 20000;
const ASEAN = ['SG', 'MY', 'ID', 'PH', 'TH', 'VN'];
const COUNTRY_NAMES = { SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines', TH: 'Thailand', VN: 'Vietnam' };

const COUNTRY_PATTERNS = {
  SG: /\bsingapore\b|\bsg\b/i,
  MY: /malaysia|kuala lumpur|selangor|penang|johor|petaling|cyberjaya|putrajaya|shah alam|\bkl\b/i,
  ID: /indonesia|jakarta|surabaya|bandung|bali|tangerang|bekasi|medan/i,
  PH: /philippines|manila|makati|taguig|pasig|cebu|quezon|bgc|ortigas|davao/i,
  TH: /thailand|bangkok|chiang mai|phuket/i,
  VN: /vietnam|viet nam|ho chi minh|hanoi|ha noi|da nang/i,
};

const STOP = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'in', 'for', 'to', 'jobs', 'job', 'role', 'roles', 'position', 'singapore', 'asean', 'with', 'at']);

// ── Inputs ─────────────────────────────────────────────────────────────────

const { args, opts } = parseArgs();
const query = args.join(' ').trim() || readJson(PATHS.jobs, {}).query;
if (!query) {
  console.log('Tell me what to search for, e.g.  npm run find-jobs -- "HR business partner"');
  process.exit(1);
}
// The resume comes first: jobs are ranked against it, and the user expects to
// be asked for it. --skip-resume lets someone browse without one.
if (!existsSync(PATHS.cv) && !opts['skip-resume']) {
  console.log(`Not searching yet: there is no master resume (cv.md).
NEXT STEP: ask the user for their resume (they can drop it into the inbox folder, paste the file path, or paste the text) and their career log. Then follow AGENTS.md step 2 to write cv.md, and run this search again.
(Only if the user says they want to browse jobs without a resume: npm run find-jobs -- "${query}" --skip-resume)`);
  process.exit(1);
}
const where = String(opts.where || 'sg').toUpperCase();
const countries = where === 'ASEAN' ? ASEAN : where.split(/[\s,]+/).filter((c) => COUNTRY_NAMES[c]);
if (!countries.length) {
  console.log(`--where must be sg, asean, or country codes like MY,ID (got "${opts.where}")`);
  process.exit(1);
}
const limit = Math.max(5, Math.min(60, Number(opts.limit) || 25));

if (!existsSync(PATHS.sources)) copyFileSync(PATHS.sourcesExample, PATHS.sources);
const { loadYaml } = await import('../yaml-document.mjs');
const sources = loadYaml(readFileSync(PATHS.sources, 'utf-8')) || {};

const terms = query.toLowerCase().replace(/[^a-z0-9&+#/ ]+/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t));
const phrase = terms.join(' ');
const cvText = existsSync(PATHS.cv) ? readFileSync(PATHS.cv, 'utf-8').toLowerCase() : '';
const cvSkills = extractCvSkills(cvText);

// ── Sources ────────────────────────────────────────────────────────────────

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'user-agent': UA, accept: 'application/json', ...(init.headers || {}) }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fromMyCareersFuture() {
  const out = [];
  for (let page = 0; page < 2; page++) {
    const data = await getJson(`https://api.mycareersfuture.gov.sg/v2/search?limit=100&page=${page}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ search: query, sortBy: [] }),
    });
    for (const r of data.results || []) {
      const overseas = (r.address?.districts || []).some((d) => /overseas/i.test(d.region || '')) || r.address?.isOverseas;
      const sal = r.salary || {};
      out.push({
        source: 'MyCareersFuture',
        id: `mcf-${r.uuid}`,
        title: r.title,
        company: r.postedCompany?.name || r.hiringCompany?.name || '',
        location: overseas ? 'Overseas' : 'Singapore',
        country: overseas ? '' : 'SG',
        salary: sal.minimum ? money(sal.minimum, sal.maximum, /annual/i.test(sal.type?.salaryType || '') ? 'year' : 'month') : '',
        salaryMin: sal.minimum || 0,
        posted: r.metadata?.newPostingDate || '',
        url: r.metadata?.jobDetailsUrl || `https://www.mycareersfuture.gov.sg/job/${r.uuid}`,
        level: (r.positionLevels || []).map((p) => p.position).join(', '),
        skills: (r.skills || []).map((s) => s.skill),
        detail: { kind: 'mcf', uuid: r.uuid },
      });
    }
    if ((data.results || []).length < 100) break;
  }
  return out;
}

async function fromJobStreet(board) {
  const host = board.site;
  const siteKey = `${(board.country || host.slice(0, 2)).toUpperCase()}-Main`;
  const data = await getJson(`https://${host}/api/jobsearch/v5/search?siteKey=${siteKey}&keywords=${encodeURIComponent(query)}&pageSize=100&page=1&locale=en-${board.country}`);
  return (data.data || []).map((r) => ({
    source: board.name,
    id: `js-${host.split('.')[0]}-${r.id}`,
    title: r.title,
    company: r.advertiser?.description || r.companyName || '',
    location: (r.locations || []).map((l) => l.label).join(', ') || COUNTRY_NAMES[board.country],
    country: board.country,
    salary: r.salaryLabel || '',
    salaryMin: 0,
    posted: (r.listingDate || '').slice(0, 10),
    url: `https://${host}/job/${r.id}`,
    level: '',
    skills: [],
    description: [r.teaser, ...(r.bulletPoints || [])].filter(Boolean).join('\n'),
    detail: { kind: 'jobstreet', host, id: String(r.id), country: board.country },
  }));
}

async function fromProvider(providerId, entry, sourceName) {
  const { makeHttpCtx } = await import('../providers/_http.mjs');
  const provider = (await import(`../providers/${providerId}.mjs`)).default;
  const jobs = await withTimeout(provider.fetch(entry, makeHttpCtx()), 60000);
  return jobs.map((j) => ({
    source: sourceName,
    id: `${providerId}-${(j.externalId || j.url).toString().slice(-60)}`,
    title: j.title,
    company: j.company || entry.name,
    location: j.location || '',
    country: countryOf(j.location),
    salary: j.salary && (j.salary.min || j.salary.max) ? `${j.salary.currency || ''} ${[j.salary.min, j.salary.max].filter(Boolean).map((n) => Number(n).toLocaleString('en-SG')).join(' – ')} / year`.trim() : '',
    salaryMin: 0,
    posted: j.postedAt ? new Date(j.postedAt).toISOString().slice(0, 10) : '',
    url: j.url,
    level: '',
    skills: [],
    description: htmlToText(j.description || '').slice(0, 8000),
    detail: { kind: 'page' },
  }));
}

function careerPageProvider(url) {
  if (/greenhouse\.io/.test(url)) return 'greenhouse';
  if (/lever\.co/.test(url)) return 'lever';
  if (/ashbyhq\.com/.test(url)) return 'ashby';
  if (/smartrecruiters\.com/.test(url)) return 'smartrecruiters';
  return null;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timed out')), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ── Matching ───────────────────────────────────────────────────────────────

function countryOf(location) {
  for (const [code, re] of Object.entries(COUNTRY_PATTERNS)) if (re.test(location || '')) return code;
  return '';
}

function extractCvSkills(text) {
  const items = new Set();
  const section = (name) => (text.match(new RegExp(`##\\s*${name}[^\\n]*\\n([\\s\\S]*?)(\\n##\\s|$)`)) || [])[1] || '';
  for (const block of [section('core competencies'), section('skills'), section('certifications')]) {
    for (const line of block.split('\n')) {
      const body = line.replace(/^[-*]\s*/, '').replace(/^[^:]{1,40}:\s*/, '');
      for (const item of body.split(/\s*[,;|]\s*/)) {
        const s = item.trim();
        if (s.length > 2 && s.length < 40) items.add(s);
      }
    }
  }
  return [...items];
}

const EXCLUDE = /\b(intern|internship|trainee|part[- ]time|temp(orary)?|freelance)\b/i;

function score(job) {
  const title = job.title.toLowerCase();
  let titleScore = 0;
  if (phrase && title.includes(phrase)) titleScore = 1;
  else if (terms.length) titleScore = terms.filter((t) => title.includes(t)).length / terms.length * 0.8;
  const hay = `${title} ${(job.skills || []).join(' ')} ${job.description || ''}`.toLowerCase();
  const skillHits = cvSkills.filter((s) => hay.includes(s));
  const skillScore = cvSkills.length ? Math.min(1, skillHits.length / Math.max(4, cvSkills.length * 0.35)) : 0.5;
  const days = job.posted ? (Date.now() - Date.parse(job.posted)) / 86400000 : 30;
  const fresh = days <= 7 ? 1 : days <= 21 ? 0.6 : 0.3;
  job.matchedSkills = skillHits.slice(0, 6);
  job.titleMatch = titleScore;
  return Math.round(titleScore * 55 + skillScore * 35 + fresh * 10);
}

// ── Run ────────────────────────────────────────────────────────────────────

const tasks = [];
for (const b of sources.job_boards || []) {
  if (b.enabled === false) continue;
  if (b.type === 'mycareersfuture' && countries.includes('SG')) tasks.push([b.name, fromMyCareersFuture()]);
  else if (b.type === 'jobstreet' && countries.includes(b.country)) tasks.push([b.name, fromJobStreet(b)]);
  else if (b.type === 'kalibrr' && countries.some((c) => ['PH', 'ID'].includes(c))) {
    tasks.push([b.name, fromProvider('kalibrr', { name: b.name, api: 'https://www.kalibrr.com/kjs/job_board/search', searchKeywords: query, pageSize: 100, max_pages: 2 }, b.name)]);
  } else if (b.type === 'techinasia') {
    tasks.push([b.name, fromProvider('techinasia', { name: b.name, max_pages: 2 }, b.name)]);
  }
}
for (const c of sources.career_pages || []) {
  if (c.enabled === false) continue;
  const id = careerPageProvider(c.url || '');
  if (!id) continue;
  tasks.push([c.name, fromProvider(id, { name: c.name, careers_url: c.url }, `${c.name} careers`)]);
}

// Providers log progress to the console; keep the output short for the agent.
const realLog = console.log;
const realWarn = console.warn;
const realError = console.error;
console.log = console.warn = console.error = () => {};
const settled = await Promise.allSettled(tasks.map(([, p]) => p));
console.log = realLog;
console.warn = realWarn;
console.error = realError;

const failed = [];
let raw = [];
settled.forEach((r, i) => {
  if (r.status === 'fulfilled') raw = raw.concat(r.value);
  else failed.push(`${tasks[i][0]} (${String(r.reason?.message || r.reason).slice(0, 60)})`);
});

const seen = new Set();
const jobs = [];
for (const j of raw) {
  if (!j.title || !j.url) continue;
  if (!j.country || !countries.includes(j.country)) continue;
  if (EXCLUDE.test(j.title) && !EXCLUDE.test(query)) continue;
  const key = `${j.company.toLowerCase().replace(/\b(pte|ltd|limited|sdn|bhd|inc|private)\b|[^a-z0-9]/g, '')}|${j.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  if (seen.has(key)) continue;
  seen.add(key);
  j.match = score(j);
  // Career pages return every opening at the company; keep only on-topic ones.
  if (j.detail.kind === 'page' && j.titleMatch < 0.5) continue;
  if (j.titleMatch === 0 && j.match < 30) continue;
  jobs.push(j);
}
jobs.sort((a, b) => b.match - a.match || (b.posted || '').localeCompare(a.posted || ''));
const kept = jobs.slice(0, 100).map((j, i) => ({ n: i + 1, ...j }));

writeJson(PATHS.jobs, { query, where: countries, searchedAt: new Date().toISOString(), jobs: kept });

const row = (j) => `| ${j.n} | ${j.title.replace(/\|/g, '/')} | ${j.company.replace(/\|/g, '/')} | ${j.location.replace(/\|/g, '/').slice(0, 40)} | ${j.salary || '—'} | ${j.match}% | [link](${j.url}) |`;
const header = '| # | Role | Company | Location | Salary | Match | Link |\n|---|---|---|---|---|---|---|';
ensureDir(join(ROOT, 'data'));
writeFileSync(PATHS.jobsMd, `# Jobs for "${query}" — ${countries.map((c) => COUNTRY_NAMES[c]).join(', ')}\n\nSearched ${new Date().toLocaleString('en-SG')}. ${kept.length} jobs.\n\n${header}\n${kept.map(row).join('\n')}\n`, 'utf-8');

const sourceCounts = {};
for (const j of kept) sourceCounts[j.source] = (sourceCounts[j.source] || 0) + 1;
console.log(`Found ${kept.length} jobs for "${query}" in ${countries.map((c) => COUNTRY_NAMES[c]).join(', ')} (from ${raw.length} listings searched).`);
console.log(`By source: ${Object.entries(sourceCounts).map(([s, n]) => `${s} ${n}`).join(', ') || 'none'}`);
if (failed.length) console.log(`Could not reach: ${failed.join('; ')}`);
if (!kept.length) {
  console.log('\nNo matches. Try a broader or different job title (for example "HR" instead of "HRBP"), or add --where asean.');
  process.exit(0);
}
// Links stay in data/jobs.md and the pipeline page: they are long and cost
// the model tokens without helping it choose.
const shortRow = (j) => `| ${j.n} | ${j.title.replace(/\|/g, '/').slice(0, 70)} | ${j.company.replace(/\|/g, '/').slice(0, 40)} | ${j.country === 'SG' ? 'SG' : j.location.replace(/\|/g, '/').slice(0, 30)} | ${j.salary || '—'} | ${j.match}% |`;
console.log(`\n| # | Role | Company | Location | Salary | Match |\n|---|---|---|---|---|---|\n${kept.slice(0, limit).map(shortRow).join('\n')}`);
if (kept.length > limit) console.log(`\n(${kept.length - limit} more, with links, in data/jobs.md)`);
console.log('\nNEXT STEP: show this table to the user and ask which job numbers they want. For each one: npm run save-job -- <number>');
process.exit(0);
