// lib/flow/resume-lib.mjs — the resume engine behind `npm run resume`.
//
//   parseResumeMarkdown(md)  → a structured resume (see examples/cv-format.md)
//   renderResumeHtml(doc, t) → fills a cv-template.<t>.html
//   renderPdf(html, path)    → A4 PDF via Playwright's Chromium
//   atsCheck(doc, keywords)  → score + plain-English fixes, based on ats-rules.yml
//
// The Markdown format is deliberately simple so a small model can write it and
// a non-technical user can edit it in any text editor.

import { existsSync, readFileSync, realpathSync } from 'fs';
import { dirname, join } from 'path';
import { listTemplates } from '../cv-templates.mjs';
import { ROOT, escapeHtml } from './common.mjs';

// Templates whose layout survives ATS text extraction (ats-rules.yml measured
// modern/jake/leadership splitting headings into fragments).
export const ATS_SAFE = new Set(['ats', 'standard', 'compact', 'executive', 'zh-minimal']);
export const DEFAULT_TEMPLATE = 'ats';

const SECTION_ALIASES = {
  summary: ['summary', 'professional summary', 'profile', 'professional profile', 'about me', 'career summary', 'objective'],
  competencies: ['core competencies', 'competencies', 'key skills', 'areas of expertise', 'expertise', 'strengths'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'career history', 'work history'],
  projects: ['projects', 'key projects', 'selected projects'],
  education: ['education', 'education and training', 'qualifications', 'academic qualifications'],
  certifications: ['certifications', 'certificates', 'licences', 'licenses', 'certifications and licences', 'professional certifications', 'courses', 'training'],
  awards: ['awards', 'awards and honours', 'awards and honors', 'achievements', 'honours', 'honors'],
  skills: ['skills', 'technical skills', 'tools', 'skills and tools', 'languages and tools', 'technical skills and tools'],
  interests: ['interests', 'volunteering', 'volunteer work', 'community'],
};

function sectionKey(heading) {
  const h = heading.toLowerCase().replace(/[*_`]/g, '').replace(/&/g, 'and').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [key, names] of Object.entries(SECTION_ALIASES)) if (names.includes(h)) return key;
  return null;
}

const PERIOD_RE = /\b(19|20)\d{2}\b|\bpresent\b|\bcurrent\b|\bnow\b/i;
const strip = (s) => String(s || '').replace(/\*\*|__|`/g, '').trim();
// "Role | Company | Location | Dates". Only when there is no "|" does an em
// dash separate parts — never an en dash, which date ranges use (2021 – 2023).
const splitParts = (s) => {
  const t = strip(s);
  return t.split(t.includes('|') ? /\s*\|\s*/ : /\s+—\s+/).map((x) => x.trim()).filter(Boolean);
};

function parseContact(line, doc) {
  for (const part of line.split(/\s*[|•·]\s*/).map((x) => x.trim()).filter(Boolean)) {
    if (/@/.test(part) && !doc.email) doc.email = part.replace(/^mailto:/, '');
    else if (/linkedin\./i.test(part)) doc.linkedin = part;
    else if (/^\+?[\d\s()-]{7,}$/.test(part)) doc.phone = part;
    else if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(part)) doc.portfolio = part;
    else doc.location = doc.location ? `${doc.location}, ${part}` : part;
  }
}

/** Parse the resume Markdown format (examples/cv-format.md). Returns { doc, warnings }. */
export function parseResumeMarkdown(md) {
  const doc = {
    name: '', title: '', email: '', phone: '', linkedin: '', portfolio: '', location: '',
    summary: '', competencies: [], experience: [], projects: [], education: [],
    certifications: [], awards: [], skills: [], interests: [],
  };
  const warnings = [];
  let section = null;
  let entry = null;
  let headerLines = 0;
  const summaryLines = [];

  // HTML comments (notes to the user or the AI) never reach the resume.
  const text = String(md).replace(/\r/g, '').replace(/<!--[\s\S]*?(-->|$)/g, '');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line)) continue;

    let m;
    if ((m = line.match(/^#\s+(.+)/)) && !doc.name) {
      doc.name = strip(m[1]);
      section = 'header';
      continue;
    }
    if ((m = line.match(/^##\s+(.+)/))) {
      section = sectionKey(m[1]);
      entry = null;
      if (!section) {
        warnings.push(`Unknown section "## ${strip(m[1])}" was skipped. Use one of: Summary, Core Competencies, Experience, Projects, Education, Certifications, Awards, Skills.`);
        section = 'unknown';
      }
      continue;
    }
    if (section === 'header') {
      if (headerLines === 0 && !/[|@]/.test(line) && !/^\+?\d/.test(line)) doc.title = strip(line);
      else parseContact(strip(line), doc);
      headerLines++;
      continue;
    }
    if (section === 'unknown' || !section) continue;

    const bullet = (m = line.match(/^[-*•]\s+(.+)/)) ? strip(m[1]) : null;
    const sub = (m = line.match(/^###\s+(.+)/)) ? m[1] : null;

    switch (section) {
      case 'summary':
        summaryLines.push(bullet ?? strip(line));
        break;
      case 'competencies':
      case 'interests':
        for (const item of (bullet ?? strip(line)).split(/\s*[,;|]\s*|\s+·\s+/)) if (item) doc[section].push(item);
        break;
      case 'experience':
        if (sub) {
          const parts = splitParts(sub);
          const pIdx = parts.map((p) => PERIOD_RE.test(p)).lastIndexOf(true);
          const period = pIdx > -1 ? parts.splice(pIdx, 1)[0] : '';
          entry = { role: parts[0] || '', company: parts[1] || '', location: parts.slice(2).join(', '), period, bullets: [], context: '' };
          doc.experience.push(entry);
        } else if (entry) {
          if (bullet) entry.bullets.push(bullet);
          else if (/^\*?(\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(strip(line)) && PERIOD_RE.test(line) && !entry.period) entry.period = strip(line);
          else entry.context = entry.context ? `${entry.context} ${strip(line)}` : strip(line);
        } else warnings.push(`Experience line "${line.slice(0, 50)}" has no "### Role | Company | Location | Dates" heading above it.`);
        break;
      case 'projects':
        if (sub) {
          const parts = splitParts(sub);
          entry = { name: parts[0] || '', tech: parts.slice(1).join(', '), desc: '' };
          doc.projects.push(entry);
        } else if (entry) entry.desc = entry.desc ? `${entry.desc} ${bullet ?? strip(line)}` : (bullet ?? strip(line));
        break;
      case 'education':
        if (sub) {
          const parts = splitParts(sub);
          const yIdx = parts.map((p) => PERIOD_RE.test(p)).lastIndexOf(true);
          const year = yIdx > -1 ? parts.splice(yIdx, 1)[0] : '';
          entry = { title: parts[0] || '', org: parts[1] || '', location: parts.slice(2).join(', '), year, desc: '' };
          doc.education.push(entry);
        } else if (entry) entry.desc = entry.desc ? `${entry.desc}; ${bullet ?? strip(line)}` : (bullet ?? strip(line));
        else if (bullet) doc.education.push(itemFromParts(bullet, true));
        break;
      case 'certifications':
      case 'awards':
        doc[section].push(itemFromParts(bullet ?? strip(sub ?? line)));
        break;
      case 'skills': {
        const text = bullet ?? strip(line);
        const c = text.match(/^([^:]{1,40}):\s*(.+)$/);
        doc.skills.push(c ? { category: c[1].trim(), items: c[2].split(/\s*,\s*/).filter(Boolean) } : { category: '', items: text.split(/\s*,\s*/).filter(Boolean) });
        break;
      }
      default:
    }
  }
  doc.summary = summaryLines.join(' ').trim();

  if (!doc.name) warnings.push('Missing "# Full Name" on the first line.');
  if (!doc.email) warnings.push('No email address in the contact line.');
  if (!doc.phone) warnings.push('No phone number in the contact line.');
  if (!doc.experience.length) warnings.push('No "## Experience" entries found (each job needs a "### Role | Company | Location | Dates" line).');
  for (const j of doc.experience) {
    if (!j.company) warnings.push(`Job "${j.role}" has no company. Write it as "### Role | Company | Location | Dates".`);
    if (!j.period) warnings.push(`Job "${j.role}" has no dates.`);
    if (!j.bullets.length) warnings.push(`Job "${j.role}" has no bullet points.`);
  }
  return { doc, warnings };
}

function itemFromParts(text, isEdu = false) {
  const parts = splitParts(text);
  const yIdx = parts.map((p) => PERIOD_RE.test(p)).lastIndexOf(true);
  const year = yIdx > -1 ? parts.splice(yIdx, 1)[0] : '';
  return isEdu ? { title: parts[0] || '', org: parts.slice(1).join(', '), location: '', year, desc: '' }
    : { title: parts[0] || '', org: parts.slice(1).join(', '), year };
}

// ── Templates ──────────────────────────────────────────────────────────────

export function availableTemplates() {
  return listTemplates('cv').map((t) => ({ name: t.name, label: t.displayName, path: t.path, atsSafe: ATS_SAFE.has(t.name) }));
}

function resolveTemplate(name) {
  const all = availableTemplates();
  const t = all.find((x) => x.name === name);
  if (!t) throw new Error(`Unknown template "${name}". Choose one of: ${all.map((x) => x.name).join(', ')}`);
  return t;
}

// A section partial (sections/<name>.html): the ENTRY markup plus optional
// <!--X_BLOCK-->…<!--/X_BLOCK--> pieces used only when field X has a value.
function loadPartial(templatePath, name) {
  const real = realpathSync(templatePath);
  for (const dir of [join(dirname(real), 'sections'), join(ROOT, 'sections')]) {
    const file = join(dir, `${name}.html`);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf-8');
    const m = text.match(/<!--ENTRY-->([\s\S]*?)<!--\/ENTRY-->/);
    if (!m) continue;
    const blocks = {};
    let body = m[1].replace(/<!--([A-Z_]+)-->([\s\S]*?)<!--\/\1-->/g, (_, key, inner) => {
      blocks[key] = inner;
      return '';
    });
    return { body: body.trim(), blocks };
  }
  return null;
}

function fillEntry(partial, fields) {
  let out = partial.body.replace(/\{\{([A-Z_]+)_BLOCK\}\}/g, (_, key) => {
    const v = fields[key];
    if (v) return partial.blocks[`${key}_BLOCK`] || '';
    return partial.blocks[`${key}_EMPTY`] || '';
  });
  // Block bodies were inserted above and may hold their own {{FIELD}}.
  out = out.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => (key === 'BULLETS' ? fields.BULLETS || '' : escapeHtml(fields[key] || '')));
  return out;
}

function renderSection(templatePath, name, items, toFields) {
  const partial = loadPartial(templatePath, name);
  if (!partial) return '';
  return items.map((it) => fillEntry(partial, toFields(it))).join('\n');
}

function dropSection(page, token) {
  const re = new RegExp(
    `<div class="section">\\s*<div class="section-title">\\{\\{${token}\\}\\}</div>[\\s\\S]*?(?=<div class="section">|<div class="cv-consent">|</div>\\s*</body>|</main>|</body>)`,
  );
  return page.replace(re, '');
}

const urlOf = (v) => (v && !/^(https?:|mailto:)/i.test(v) ? `https://${v}` : v || '');
const display = (v) => String(v || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

export function renderResumeHtml(doc, templateName = DEFAULT_TEMPLATE) {
  const t = resolveTemplate(templateName);
  let page = readFileSync(t.path, 'utf-8');
  page = page.replace(/<!--[\s\S]*?-->/g, '');

  const experience = renderSection(t.path, 'experience', doc.experience, (j) => ({
    ROLE: j.role, COMPANY: j.company, PERIOD: j.period, LOCATION: j.location, CONTEXT: j.context,
    BULLETS: j.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join(''),
  }));
  const education = renderSection(t.path, 'education', doc.education, (e) => ({
    TITLE: e.title, ORG: e.org, YEAR: e.year, LOCATION: e.location, DESC: e.desc,
  }));
  const certifications = renderSection(t.path, 'certifications', doc.certifications, (c) => ({ TITLE: c.title, ORG: c.org, YEAR: c.year }));
  const awards = renderSection(t.path, 'awards', doc.awards, (c) => ({ TITLE: c.title, ORG: c.org, YEAR: c.year }));
  const projects = renderSection(t.path, 'projects', doc.projects, (p) => ({ NAME: p.name, DESC: p.desc, TECH: p.tech, BADGE: '' }));
  const competencies = renderSection(t.path, 'competencies', doc.competencies, (c) => ({ TAG: c }));
  const skills = renderSection(t.path, 'skills', doc.skills.filter((g) => g.items.length), (g) => ({
    CATEGORY: g.category, ITEMS_TEXT: g.items.join(', '),
  }));
  const interests = escapeHtml(doc.interests.join(' · '));

  const sections = {
    SUMMARY: ['Professional Summary', doc.summary],
    COMPETENCIES: ['Core Competencies', competencies],
    EXPERIENCE: ['Work Experience', experience],
    PROJECTS: ['Projects', projects],
    EDUCATION: ['Education', education],
    CERTIFICATIONS: ['Certifications', certifications],
    AWARDS: ['Awards', awards],
    SKILLS: ['Skills', skills],
    INTERESTS: ['Interests', interests],
  };
  // ATS rule: no empty sections — drop the heading too.
  for (const [key, [, content]] of Object.entries(sections)) if (!String(content).trim()) page = dropSection(page, `SECTION_${key}`);

  const values = {
    LANG: 'en',
    NAME: escapeHtml(doc.name || 'Your Name'),
    TITLE_BLOCK: doc.title ? `<div class="header-title">${escapeHtml(doc.title)}</div>` : '',
    PHONE: escapeHtml(doc.phone),
    EMAIL: escapeHtml(doc.email),
    LINKEDIN_URL: escapeHtml(urlOf(doc.linkedin)),
    LINKEDIN_DISPLAY: escapeHtml(display(doc.linkedin)),
    PORTFOLIO_URL: escapeHtml(urlOf(doc.portfolio)),
    PORTFOLIO_DISPLAY: escapeHtml(display(doc.portfolio)),
    LOCATION: escapeHtml(doc.location),
    PHOTO: '',
    CONSENT: '',
    SUMMARY_TEXT: escapeHtml(doc.summary),
    COMPETENCIES: competencies,
    EXPERIENCE: experience,
    PROJECTS: projects,
    EDUCATION: education,
    CERTIFICATIONS: certifications,
    AWARDS: awards,
    SKILLS: skills,
    INTERESTS: interests,
    PAGE_WIDTH: '8.27in',
  };
  for (const [key, [heading]] of Object.entries(sections)) values[`SECTION_${key}`] = heading;
  page = page.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => values[k] ?? '');
  // Empty contact links (no portfolio, no LinkedIn) would leave stray separators.
  page = page.replace(/<a[^>]*href="[^"]*"[^>]*>\s*<\/a>/g, '').replace(/<span[^>]*>\s*<\/span>/g, '');
  return page;
}

export async function renderPdf(html, pdfPath) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
    const pages = await page.evaluate(() => Math.ceil(document.body.scrollHeight / 1123));
    return { pages };
  } finally {
    await browser.close();
  }
}

// ── Fact check ─────────────────────────────────────────────────────────────
//
// A tailored resume may reorder, cut and reword the user's facts, but must
// not add new ones. This compares every line against the user's own sources
// (cv.md, career-log.md, the imported original) and lists anything new — a
// number, an employer, a qualification, or a bullet whose content words are
// mostly not in the sources — so the agent asks the user before it stays.

const FILLER = new Set(('the and for with from into across including include includes within through while using via over under '
  + 'that this their them they have has had was were are our your its also more most well both each such than then '
  + 'strong proven track record experience experienced years year skills skill knowledge ability able key '
  + 'support supported supporting partner partnered partnering manage managed managing lead led leading work worked working '
  + 'business team teams staff role roles various multiple related relevant end').split(' '));

const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '').replace(/(e)$/, '');
function contentWords(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9&+#\s-]/g, ' ').split(/[\s-]+/)
    .filter((w) => w.length > 2 && !FILLER.has(w) && !/^\d/.test(w)).map(stem);
}
// A number keeps its currency and unit, so "$2 million" only matches
// "$2 million" (or "S$2m"), never a stray "2" elsewhere in the sources.
function numbersIn(text) {
  const re = /(\$|s\$|sgd\s?|usd\s?)?(\d[\d,]*(?:\.\d+)?)\s*(%|k\b|m\b|mil\b|million\b|b\b|bn\b|billion\b)?/gi;
  const out = [];
  for (const m of String(text).matchAll(re)) {
    const cur = m[1] ? '$' : '';
    const unit = (m[3] || '').toLowerCase().replace(/^(m|mil|million)$/, 'm').replace(/^(b|bn|billion)$/, 'b');
    out.push(`${cur}${m[2].replace(/,/g, '')}${unit}`);
  }
  return out;
}

/** Lines in `doc` that are not backed by `sourceText`. Returns [{ where, text, reason }]. */
export function factCheck(doc, sourceTextRaw) {
  const sourceText = String(sourceTextRaw).replace(/<!--[\s\S]*?-->/g, '');
  const vocab = new Set(contentWords(sourceText));
  const nums = new Set(numbersIn(sourceText));
  const lower = String(sourceText).toLowerCase();
  const issues = [];
  const check = (where, text, { strict = false } = {}) => {
    if (!text) return;
    const newNums = numbersIn(text).filter((n) => !nums.has(n) && !/^(19|20)\d\d$/.test(n));
    if (newNums.length) {
      issues.push({ where, text, reason: `number${newNums.length > 1 ? 's' : ''} ${newNums.join(', ')} not in the user's resume or career log` });
      return;
    }
    const words = contentWords(text);
    const unknown = [...new Set(words.filter((w) => !vocab.has(w)))];
    if (strict ? unknown.length > 0 : unknown.length >= 3 && unknown.length / Math.max(1, new Set(words).size) >= 0.35) {
      issues.push({ where, text, reason: `new claim — not in the user's resume or career log (${unknown.slice(0, 5).join(', ')})` });
    }
  };
  for (const j of doc.experience) {
    if (j.company && !lower.includes(j.company.toLowerCase())) issues.push({ where: 'Experience', text: j.company, reason: 'employer not in the user\'s resume or career log' });
    for (const b of j.bullets) check(`${j.role} @ ${j.company}`, b);
  }
  for (const c of doc.competencies) check('Core Competencies', c, { strict: true });
  for (const e of doc.education) if (e.title && !contentWords(e.title).every((w) => vocab.has(w))) issues.push({ where: 'Education', text: e.title, reason: 'qualification not in the user\'s resume or career log' });
  for (const c of doc.certifications) if (c.title && !contentWords(c.title).every((w) => vocab.has(w))) issues.push({ where: 'Certifications', text: c.title, reason: 'certification not in the user\'s resume or career log' });
  for (const s of doc.summary.split(/(?<=[.!?])\s+/)) check('Summary', s);
  return issues;
}

// ── ATS check ──────────────────────────────────────────────────────────────

const WEAK_STARTS = new Set(['responsible', 'responsibilities', 'helped', 'assisted', 'worked', 'tasked', 'duties', 'involved', 'i', 'my', 'we', 'in', 'was']);
const FIRST_PERSON = /\b(I|me|my|mine|myself)\b/;

const norm = (s) => ` ${String(s).toLowerCase().replace(/[^a-z0-9+#./ ]+/g, ' ').replace(/\s+/g, ' ')} `;

function keywordVariants(k) {
  const base = k.toLowerCase().trim();
  const v = new Set([base, base.replace(/&/g, 'and'), base.replace(/ and /g, ' & ')]);
  if (base.endsWith('s')) v.add(base.slice(0, -1));
  else v.add(`${base}s`);
  return [...v].map((x) => norm(x).trim());
}

export function atsCheck(doc, keywords = [], templateName = DEFAULT_TEMPLATE) {
  const bullets = doc.experience.flatMap((j) => j.bullets);
  const text = norm([doc.title, doc.summary, doc.competencies.join(' '), bullets.join(' '),
    doc.experience.map((j) => `${j.role} ${j.context}`).join(' '),
    doc.skills.flatMap((g) => g.items).join(' '), doc.certifications.map((c) => c.title).join(' ')].join(' '));
  const checks = [];
  const add = (label, passed, detail, weight) => checks.push({ label, passed: !!passed, detail, weight });

  const missingContact = ['name', 'email', 'phone'].filter((k) => !doc[k]);
  add('Contact details', !missingContact.length, missingContact.length ? `Missing: ${missingContact.join(', ')}.` : 'Name, email and phone are present.', 15);
  add('ATS-safe template', ATS_SAFE.has(templateName), ATS_SAFE.has(templateName)
    ? 'Single-column layout with standard headings.'
    : `The "${templateName}" design can split headings when an ATS reads it. Use --template ats for online applications.`, 10);

  const kws = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))];
  const hits = kws.filter((k) => keywordVariants(k).some((v) => text.includes(` ${v} `)));
  const coverage = kws.length ? hits.length / kws.length : 1;
  add('Job keywords covered', coverage >= 0.6, kws.length
    ? `${hits.length} of ${kws.length} job keywords appear.${hits.length < kws.length ? ` Not yet covered: ${kws.filter((k) => !hits.includes(k)).slice(0, 8).join(', ')}. Add only the ones the candidate truly has.` : ''}`
    : 'No job keywords to compare (master resume).', 25);

  const weak = bullets.filter((b) => WEAK_STARTS.has((b.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '')));
  add('Bullets start with action verbs', bullets.length && !weak.length, !bullets.length ? 'Add achievement bullets under each job.'
    : weak.length ? `${weak.length} bullet(s) start weakly, e.g. "${weak[0].slice(0, 60)}". Start with a verb like Led, Built, Cut, Grew.` : 'Every bullet starts with an action verb.', 15);

  const withNumbers = bullets.filter((b) => /\d/.test(b));
  add('Measurable results', bullets.length && withNumbers.length / bullets.length >= 0.4,
    `${withNumbers.length} of ${bullets.length} bullets include a number (%, $, count, time). Aim for 40%+, using real figures only.`, 15);

  const long = bullets.filter((b) => b.split(/\s+/).length > 32);
  add('Concise bullets', !long.length, long.length ? `${long.length} bullet(s) are over 32 words; split or trim them.` : 'All bullets are short enough to scan.', 5);

  const fp = [doc.summary, ...bullets].join(' ').match(FIRST_PERSON);
  add('No first-person words', !fp, fp ? `Remove words like "${fp[0]}".` : 'Written without I/me/my, as resumes should be.', 5);

  const words = doc.summary.split(/\s+/).filter(Boolean).length;
  add('Summary length', words >= 25 && words <= 90, `Summary is ${words} words; aim for 30–80.`, 10);

  const score = Math.round((checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0) / checks.reduce((s, c) => s + c.weight, 0)) * 100);
  return { score, checks, keywordsHit: hits, keywordsMissing: kws.filter((k) => !hits.includes(k)) };
}
