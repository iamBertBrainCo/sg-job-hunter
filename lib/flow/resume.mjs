#!/usr/bin/env node
// npm run resume -- check              check cv.md (the master resume) is readable
// npm run resume -- master             make output/master-resume.pdf from cv.md
// npm run resume -- <app number>       make the tailored PDF for a saved job,
//                                      e.g. npm run resume -- 1
// npm run resume -- templates          list resume designs
// Options: --template <name>  (default: ats)

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import {
  ROOT, PATHS, ensureDir, parseArgs, loadPipeline, savePipeline, findApplication, applicationDir, fileUrl,
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

const template = String(opts.template || DEFAULT_TEMPLATE).toLowerCase();

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
    console.log('\ncv.md is readable. NEXT STEP: ask which role or industry to search, then npm run find-jobs -- "<role>"');
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
