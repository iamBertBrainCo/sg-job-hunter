#!/usr/bin/env node
// npm run resume -- check              check cv.md (the master resume) is readable
// npm run resume -- master             make output/master-resume.pdf from cv.md
// npm run resume -- <app number>       make the tailored PDF for a saved job,
//                                      e.g. npm run resume -- 1
// npm run resume -- templates          list resume designs
// npm run resume -- preview            show cv.md in every design, side by side
// npm run resume -- use <design>       remember the user's chosen design
// Options: --template <name>  (default: the chosen design, else ats)

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import {
  ROOT, PATHS, ensureDir, parseArgs, loadPipeline, savePipeline, findApplication, applicationDir, fileUrl,
  readJson, writeJson, escapeHtml, openInDefaultApp,
} from './common.mjs';
import {
  parseResumeMarkdown, renderResumeHtml, renderPdf, atsCheck, factCheck, availableTemplates, DEFAULT_TEMPLATE, ATS_SAFE,
} from './resume-lib.mjs';

const { args, opts } = parseArgs();
const what = String(args[0] || 'check').toLowerCase();
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

if (what === 'templates') {
  for (const t of availableTemplates()) console.log(`${t.name.padEnd(12)} ${t.label}${t.atsSafe ? '  (ATS-safe)' : '  (design only — not for online applications)'}`);
  process.exit(0);
}

function readResume(path) {
  if (!existsSync(path)) return null;
  return parseResumeMarkdown(readFileSync(path, 'utf-8'));
}

function printReport(doc, warnings, ats) {
  const bullets = doc.experience.reduce((n, j) => n + j.bullets.length, 0);
  console.log(`Name: ${doc.name || '(missing)'} | ${doc.experience.length} jobs, ${bullets} bullets, ${doc.education.length} education, ${doc.certifications.length} certifications`);
  if (warnings.length) {
    console.log('\nFORMAT PROBLEMS (fix these in the file, then run the command again):');
    for (const w of warnings) console.log(`- ${w}`);
  }
  if (ats) {
    console.log(`\nATS CHECK: ${ats.score}/100`);
    for (const c of ats.checks) console.log(`${c.passed ? '✓' : '✗'} ${c.label}: ${c.detail}`);
  }
}

const settings = readJson(PATHS.settings, {});
const template = String(opts.template || settings.template || DEFAULT_TEMPLATE).toLowerCase();
const designs = availableTemplates();

if (what === 'use') {
  const name = String(args[1] || '').toLowerCase();
  const t = designs.find((d) => d.name === name || String(designs.indexOf(d) + 1) === name);
  if (!t) {
    console.log(`Which design? Choose one of: ${designs.map((d, i) => `${i + 1} ${d.name}`).join(', ')}`);
    process.exit(1);
  }
  writeJson(PATHS.settings, { ...settings, template: t.name });
  console.log(`Saved: every resume will now use the "${t.label}" design (${t.name})${t.atsSafe ? '.' : '. Note: this design is NOT ATS-safe; for online applications use an ATS-safe one.'}`);
  console.log('NEXT STEP: ask which role or industry to search, then npm run find-jobs -- "<role>" (if not done yet).');
  process.exit(0);
}

if (what === 'preview') {
  const parsed = readResume(PATHS.cv);
  if (!parsed) {
    console.log('cv.md does not exist yet. Write it first, then run this again.');
    process.exit(1);
  }
  ensureDir(PATHS.gallery);
  const cards = designs.map((d, i) => {
    const file = join(PATHS.gallery, `${d.name}.html`);
    writeFileSync(file, renderResumeHtml(parsed.doc, d.name), 'utf-8');
    return `<figure class="card">
  <div class="frame"><iframe src="${escapeHtml(d.name)}.html" title="${escapeHtml(d.label)}" loading="lazy" tabindex="-1"></iframe></div>
  <figcaption><b>${i + 1}. ${escapeHtml(d.label)}</b>
  <span class="tag ${d.atsSafe ? 'safe' : 'design'}">${d.atsSafe ? 'ATS-safe: best for online applications' : 'Design only: for emailing or printing'}</span>
  <a href="${escapeHtml(d.name)}.html" target="_blank">Open full size</a></figcaption>
</figure>`;
  }).join('\n');
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Choose your resume design</title>
<style>
  :root { --bg:#f5f5f3; --card:#fff; --ink:#1d2433; --muted:#5f6b7a; --line:#e3e5e8; --ok:#1f7a4d; --warn:#9a5b00; }
  @media (prefers-color-scheme: dark) { :root { --bg:#14171c; --card:#1d2128; --ink:#e8eaee; --muted:#9aa4b2; --line:#2c323b; --ok:#4cc38a; --warn:#e0a948; } }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 1240px; margin: 0 auto; padding: 28px 16px 60px; }
  h1 { font-size: 24px; margin: 0 0 4px; } p { color: var(--muted); margin: 0 0 22px; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
  .card { margin:0; background:var(--card); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  .frame { height: 370px; overflow:hidden; background:#fff; border-bottom:1px solid var(--line); position:relative; padding: 8px 0 0 8px; }
  .frame iframe { width: 860px; height: 1123px; border:0; transform: scale(0.31); transform-origin: 0 0; pointer-events:none; overflow:hidden; }
  figcaption { padding: 12px 14px; display:flex; flex-direction:column; gap:4px; }
  .tag { font-size: 13px; font-weight: 600; } .tag.safe { color: var(--ok); } .tag.design { color: var(--warn); }
  a { font-size: 13px; color: inherit; }
</style></head><body><main>
<h1>Choose your resume design</h1>
<p>This is your own resume in each design. Tell the AI the number you like, for example "I'll take 3".</p>
<div class="grid">${cards}</div>
</main></body></html>`;
  const index = join(PATHS.gallery, 'index.html');
  writeFileSync(index, page, 'utf-8');
  const opened = openInDefaultApp(index);
  console.log(`Made a preview of cv.md in all ${designs.length} designs${opened ? ' and opened it in the browser' : ''}: ${fileUrl(index)}`);
  console.log(designs.map((d, i) => `${i + 1}. ${d.label} — ${d.atsSafe ? 'ATS-safe' : 'design only (not for online applications)'}`).join('\n'));
  console.log('\nNEXT STEP: ask the user which number they like. Recommend an ATS-safe one for online applications. Then run: npm run resume -- use <number or name>');
  process.exit(0);
}

if (what === 'check' || what === 'master') {
  const parsed = readResume(PATHS.cv);
  if (!parsed) {
    console.log('cv.md does not exist yet. Write it first (format: examples/cv-format.md).');
    process.exit(1);
  }
  const ats = atsCheck(parsed.doc, [], template);
  printReport(parsed.doc, parsed.warnings, ats);
  // Fact check the master resume against what the user actually supplied.
  const supplied = [PATHS.resumeOriginal, PATHS.careerLog].filter(existsSync).map((p) => readFileSync(p, 'utf-8')).join('\n');
  let factIssues = [];
  if (existsSync(PATHS.resumeOriginal)) {
    factIssues = factCheck(parsed.doc, supplied);
    if (factIssues.length) {
      console.log(`\nFACT CHECK: ${factIssues.length} line(s) in cv.md are not in the imported resume or career log:`);
      for (const f of factIssues.slice(0, 15)) console.log(`⚠ [${f.where}] "${f.text.slice(0, 140)}" — ${f.reason}`);
      console.log(`\nNEXT STEP: ask the user about each ⚠ line ("Is this true?"). Remove what they do not confirm from ${PATHS.cv}; add what they confirm to ${PATHS.careerLog} in their words. Then run npm run resume -- check again.`);
    } else {
      console.log('\nFACT CHECK: every line matches the imported resume or career log.');
    }
  }
  if (what === 'master') {
    ensureDir(join(ROOT, 'output'));
    const html = renderResumeHtml(parsed.doc, template);
    const htmlPath = join(ROOT, 'output', 'master-resume.html');
    const pdfPath = join(ROOT, 'output', 'master-resume.pdf');
    writeFileSync(htmlPath, html, 'utf-8');
    const { pages } = await renderPdf(html, pdfPath);
    console.log(`\nSaved ${rel(pdfPath)} (${pages} page${pages === 1 ? '' : 's'}, template: ${template})\nOpen: ${fileUrl(pdfPath)}`);
  } else if (!parsed.warnings.length && !factIssues.length) {
    console.log(settings.template
      ? `\ncv.md is readable (design: ${settings.template}). NEXT STEP: ask which role or industry to search, then npm run find-jobs -- "<role>"`
      : '\ncv.md is readable. NEXT STEP: let the user choose a resume design: npm run resume -- preview');
  }
  process.exit(parsed.warnings.some((w) => /Missing "# Full Name"|No "## Experience"/.test(w)) ? 1 : 0);
}

// A saved job (application) number.
const pipeline = loadPipeline();
const app = findApplication(pipeline, what);
if (!app) {
  console.log(`No saved job "${args[0]}". Saved jobs: ${pipeline.applications.map((a) => a.num).join(', ') || 'none yet — run npm run save-job -- <job number> first'}.`);
  process.exit(1);
}
if (!opts.template && !settings.template) {
  console.log('The user has not chosen a resume design yet.\nNEXT STEP: run npm run resume -- preview, ask which number they like, run npm run resume -- use <number>, then run this command again.');
  process.exit(1);
}
const dir = applicationDir(app);
const mdPath = join(dir, 'resume.md');
const parsed = readResume(mdPath);
if (!parsed) {
  console.log(`${rel(mdPath)} does not exist yet. Write the tailored resume there first (start from cv.md, same format), then run this again.`);
  process.exit(1);
}
// Keywords: the "ATS keywords" line in job.md (the user or agent may edit it).
const jobMd = existsSync(join(dir, 'job.md')) ? readFileSync(join(dir, 'job.md'), 'utf-8') : '';
const kwLine = (jobMd.match(/^- ATS keywords:\s*(.*)$/m) || [])[1];
const keywords = kwLine != null ? kwLine.split(/\s*,\s*/).filter(Boolean) : (app.keywords || []);
const ats = atsCheck(parsed.doc, keywords, template);
printReport(parsed.doc, parsed.warnings, ats);

// Fact check against the user's own material.
const sources = [PATHS.cv, PATHS.careerLog, PATHS.resumeOriginal].filter(existsSync).map((p) => readFileSync(p, 'utf-8')).join('\n');
const facts = factCheck(parsed.doc, sources);
if (facts.length) {
  console.log(`\nFACT CHECK: ${facts.length} line(s) are not in the user's resume or career log:`);
  for (const f of facts.slice(0, 15)) console.log(`⚠ [${f.where}] "${f.text.slice(0, 140)}" — ${f.reason}`);
} else {
  console.log('\nFACT CHECK: every line matches the user\'s resume or career log.');
}

const html = renderResumeHtml(parsed.doc, template);
const base = `resume-${(parsed.doc.name || 'candidate').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
const htmlPath = join(dir, `${base}.html`);
const pdfPath = join(dir, `${base}.pdf`);
writeFileSync(htmlPath, html, 'utf-8');
const { pages } = await renderPdf(html, pdfPath);

app.resumePdf = rel(pdfPath);
app.template = template;
app.atsScore = ats.score;
if (app.status === 'shortlisted') app.status = 'resume-ready';
app.updatedAt = new Date().toISOString();
savePipeline(pipeline);

console.log(`\nSaved ${rel(pdfPath)} (${pages} page${pages === 1 ? '' : 's'}, template: ${template}${ATS_SAFE.has(template) ? '' : ' — NOT ATS-safe'})`);
console.log(`Open: ${fileUrl(pdfPath)}`);
if (pages > 2) console.log('Note: over 2 pages. For most PMET roles, trim to 2 pages.');
if (facts.length) {
  console.log(`\nNEXT STEP: do NOT call this resume finished. Show the user each ⚠ line and ask: "Is this true?" Remove or fix every line they do not confirm in ${mdPath}. Add confirmed facts to ${PATHS.careerLog}. Then run npm run resume -- ${app.num} again.`);
} else {
  console.log(`\nNEXT STEP: tell the user the ATS score, the ✗ items, and that they can edit ${mdPath} (or ask you to) and run npm run resume -- ${app.num} again. When happy: npm run pipeline`);
}
