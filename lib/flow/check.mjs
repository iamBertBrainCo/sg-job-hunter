#!/usr/bin/env node
// npm run check — first thing the agent runs. Installs what is missing
// (npm packages, the Chromium used for PDFs), copies starter files, and prints
// one NEXT STEP line so the agent knows where the user is in the flow.
//
// Uses only Node built-ins at the top level, so it works before `npm install`.

import { existsSync, copyFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { ROOT, PATHS, readJson, writeJson, PRIVACY_NOTICE } from './common.mjs';

// npm run check -- --accept-privacy  records that the user agreed to the notice.
if (process.argv.includes('--accept-privacy')) {
  writeJson(PATHS.settings, { ...readJson(PATHS.settings, {}), privacyAcceptedAt: new Date().toISOString() });
  console.log('Recorded: the user has read and agreed to the privacy notice.');
}

const lines = [];
const ok = (m) => lines.push(`OK    ${m}`);
const fix = (m) => lines.push(`FIXED ${m}`);
const todo = (m) => lines.push(`TODO  ${m}`);
const fail = (m) => lines.push(`FAIL  ${m}`);

function run(cmd, args) {
  // shell: true so npm/npx resolve to npm.cmd/npx.cmd on Windows.
  // One command string (the args are fixed words, nothing user-supplied).
  const r = spawnSync([cmd, ...args].join(' '), { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], shell: true, encoding: 'utf-8' });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-5).join('\n') };
}

// 1. Node version
const [major, minor] = process.versions.node.split('.').map(Number);
if (major > 22 || (major === 22 && minor >= 13)) ok(`Node.js ${process.versions.node}`);
else fail(`Node.js ${process.versions.node} is too old. Install Node.js 22 LTS or newer from https://nodejs.org and reopen the terminal.`);

// 2. npm packages
const pkgs = ['playwright', 'js-yaml', 'unpdf', 'mammoth'];
const missing = pkgs.filter((p) => !existsSync(join(ROOT, 'node_modules', p)));
if (missing.length === 0) ok('npm packages installed');
else {
  const r = run('npm', ['install', '--no-audit', '--no-fund']);
  if (r.ok) fix('installed npm packages');
  else fail(`npm install failed:\n${r.out}`);
}

// 3. Chromium (used to turn resumes into PDFs)
async function chromiumReady() {
  try {
    const { chromium } = await import('playwright');
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}
if (await chromiumReady()) ok('Chromium for PDFs installed');
else {
  const r = run('npx', ['playwright', 'install', 'chromium']);
  if (r.ok && (await chromiumReady())) fix('installed Chromium for PDFs');
  else fail(`Chromium install failed (PDFs will not work until it is fixed):\n${r.out}`);
}

// 4. Starter files
if (!existsSync(PATHS.sources) && existsSync(PATHS.sourcesExample)) {
  copyFileSync(PATHS.sourcesExample, PATHS.sources);
  fix('created sources.yml (job boards and employer career pages to search)');
} else if (existsSync(PATHS.sources)) ok('sources.yml present');

// 5. Where is the user in the flow?
const hasCv = existsSync(PATHS.cv) && !/Your Full Name|Jane Doe/.test(readFileSync(PATHS.cv, 'utf-8'));
const hasLog = existsSync(PATHS.careerLog);
const jobs = readJson(PATHS.jobs, null);
const pipeline = readJson(PATHS.pipeline, { applications: [] });
hasCv ? ok('cv.md (master resume) present') : todo('cv.md (master resume) not created yet');
hasLog ? ok('career-log.md present') : todo('career-log.md not created yet (optional)');
jobs ? ok(`last job search: "${jobs.query}" — ${jobs.jobs.length} jobs (${jobs.searchedAt.slice(0, 10)})`) : todo('no job search yet');
ok(`pipeline: ${pipeline.applications.length} saved job(s)`);
const design = readJson(PATHS.settings, {}).template;
design ? ok(`resume design: ${design}`) : todo('resume design not chosen yet');
const privacy = Boolean(readJson(PATHS.settings, {}).privacyAcceptedAt);
privacy ? ok('privacy notice agreed') : todo('privacy notice not shown yet');

let next;
if (lines.some((l) => l.startsWith('FAIL'))) next = 'Fix the FAIL lines above (tell the user in plain words), then run npm run check again.';
else if (!privacy) {
  next = `Before asking for any resume, show the user this notice word for word, then ask "Is that OK with you?":

${PRIVACY_NOTICE}

Only if they agree, run: npm run check -- --accept-privacy
If they do not agree, do not ask for their resume. Tell them they can read PRIVACY.md and come back, or remove details they do not want to share first.`;
} else if (!hasCv) next = 'Ask the user for their resume (file path or pasted text) and their career log, then follow AGENTS.md step 2.';
else if (!design) next = 'Run npm run resume -- check, then let the user choose a resume design: npm run resume -- preview';
else if (!jobs) next = 'Ask which role or industry they want, then run: npm run find-jobs -- "<role>"';
else if (pipeline.applications.length === 0) next = 'Show the job list (data/jobs.md) and ask which job numbers to save: npm run save-job -- <number>';
else next = 'Continue with the pipeline: npm run pipeline';

console.log(lines.join('\n'));
console.log(`\nNEXT STEP: ${next}`);
