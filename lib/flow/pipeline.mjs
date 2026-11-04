#!/usr/bin/env node
// npm run pipeline            show saved jobs and open output/pipeline.html
// npm run pipeline -- --no-open   (print only)

import { writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import {
  ROOT, PATHS, ensureDir, parseArgs, loadPipeline, escapeHtml, openInDefaultApp, fileUrl, STATUSES,
} from './common.mjs';

const { opts } = parseArgs();
const pipeline = loadPipeline();
const apps = pipeline.applications;

if (!apps.length) {
  console.log('No saved jobs yet. Run npm run find-jobs -- "<role>", then npm run save-job -- <number>.');
  process.exit(0);
}

const LABEL = {
  shortlisted: 'Shortlisted', 'resume-ready': 'Resume ready', applied: 'Applied', interview: 'Interview',
  offer: 'Offer', rejected: 'Rejected', skipped: 'Skipped',
};
const order = (s) => STATUSES.indexOf(s);
const sorted = [...apps].sort((a, b) => order(a.status) - order(b.status) || a.num - b.num);

// Terminal view (Markdown table — opencode renders links).
const rows = sorted.map((a) => {
  const resume = a.resumePdf && existsSync(join(ROOT, a.resumePdf)) ? `[PDF](${fileUrl(join(ROOT, a.resumePdf))})` : '—';
  return `| ${a.num} | ${a.title.replace(/\|/g, '/').slice(0, 50)} | ${a.company.replace(/\|/g, '/').slice(0, 30)} | ${LABEL[a.status] || a.status} | ${a.atsScore ?? '—'} | ${resume} | [Apply](${a.url}) |`;
});
console.log(`| # | Role | Company | Status | ATS | Resume | Apply |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}`);

// Browser view.
const counts = STATUSES.map((s) => [s, apps.filter((a) => a.status === s).length]).filter(([, n]) => n);
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>My job pipeline</title>
<style>
  :root { --bg:#f7f7f5; --card:#fff; --ink:#1d2433; --muted:#5f6b7a; --line:#e3e5e8; --accent:#c8102e; --ok:#1f7a4d; }
  @media (prefers-color-scheme: dark) { :root { --bg:#14171c; --card:#1d2128; --ink:#e8eaee; --muted:#9aa4b2; --line:#2c323b; --accent:#ff5a6e; --ok:#4cc38a; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 1040px; margin: 0 auto; padding: 28px 16px 60px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .sub { color: var(--muted); margin: 0 0 20px; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
  .chip { background:var(--card); border:1px solid var(--line); border-radius:999px; padding:4px 12px; font-size:13px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; margin-bottom:12px; display:grid; grid-template-columns: 1fr auto; gap: 8px 16px; }
  .role { font-weight:600; font-size:16px; }
  .meta { color:var(--muted); font-size:13px; }
  .status { justify-self:end; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; padding:3px 10px; border-radius:6px; border:1px solid var(--line); height:fit-content; }
  .status.resume-ready { color: var(--ok); border-color: var(--ok); }
  .status.applied, .status.interview, .status.offer { background: var(--ok); color: #fff; border-color: var(--ok); }
  .actions { grid-column: 1 / -1; display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }
  a.btn { text-decoration:none; padding:7px 14px; border-radius:8px; font-weight:600; font-size:14px; border:1px solid var(--line); color:var(--ink); }
  a.btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
  .hint { grid-column: 1 / -1; color: var(--muted); font-size: 13px; }
  code { background: var(--bg); padding: 1px 5px; border-radius: 4px; }
</style></head><body><main>
<h1>My job pipeline</h1>
<p class="sub">${apps.length} saved job${apps.length === 1 ? '' : 's'} · updated ${escapeHtml(new Date().toLocaleString('en-SG'))}. Review each resume, then click Apply.</p>
<div class="chips">${counts.map(([s, n]) => `<span class="chip">${escapeHtml(LABEL[s])}: ${n}</span>`).join('')}</div>
${sorted.map((a) => {
    const pdf = a.resumePdf && existsSync(join(ROOT, a.resumePdf)) ? fileUrl(join(ROOT, a.resumePdf)) : '';
    const folder = fileUrl(join(PATHS.applications, a.folder));
    const prep = a.interviewPrep && existsSync(join(ROOT, a.interviewPrep)) ? fileUrl(join(ROOT, a.interviewPrep)) : '';
    return `<div class="card">
  <div><div class="role">${a.num}. ${escapeHtml(a.title)}</div>
  <div class="meta">${escapeHtml(a.company)} · ${escapeHtml(a.location || '')}${a.salary ? ` · ${escapeHtml(a.salary)}` : ''}${a.atsScore != null ? ` · ATS check ${a.atsScore}/100` : ''}</div></div>
  <div class="status ${escapeHtml(a.status)}">${escapeHtml(LABEL[a.status] || a.status)}</div>
  <div class="actions">
    <a class="btn primary" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">Apply on ${escapeHtml(a.source || 'job site')}</a>
    ${pdf ? `<a class="btn" href="${escapeHtml(pdf)}" target="_blank">Open resume PDF</a>` : ''}
    ${prep ? `<a class="btn" href="${escapeHtml(prep)}" target="_blank">Interview prep</a>` : ''}
    <a class="btn" href="${escapeHtml(folder)}" target="_blank">Open folder</a>
  </div>
  ${!pdf ? `<div class="hint">No resume yet — ask the AI: “make a resume for job ${a.num}”.</div>` : a.status === 'resume-ready' ? `<div class="hint">After you apply, tell the AI “I applied to ${a.num}” (or run <code>npm run status -- ${a.num} applied</code>).</div>`
    : a.status === 'interview' && !prep ? `<div class="hint">Interview coming up? Ask the AI: “help me prepare for the interview for job ${a.num}”.</div>` : ''}
</div>`;
  }).join('\n')}
</main></body></html>
`;
ensureDir(join(ROOT, 'output'));
writeFileSync(PATHS.pipelineHtml, html, 'utf-8');
const opened = opts['no-open'] ? false : openInDefaultApp(PATHS.pipelineHtml);
console.log(`\nPipeline page: ${fileUrl(PATHS.pipelineHtml)}${opened ? ' (opened in the browser)' : ''}`);
console.log(`Saved under ${relative(ROOT, PATHS.pipelineHtml).replace(/\\/g, '/')}`);
