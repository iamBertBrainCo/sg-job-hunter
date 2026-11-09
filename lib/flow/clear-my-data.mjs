#!/usr/bin/env node
// npm run clear-my-data            list the personal files that would be deleted
// npm run clear-my-data -- --yes   delete them
//
// Removes everything the guided flow saved about the user: master resume,
// career log, imported resume text, files in inbox/, job searches, saved jobs,
// tailored resumes and the pipeline. Leaves the program and sources.yml alone.

import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ROOT, PATHS, parseArgs } from './common.mjs';

const { opts } = parseArgs();
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

const targets = [
  PATHS.cv,
  PATHS.careerLog,
  PATHS.resumeOriginal,
  PATHS.jobs,
  PATHS.jobsMd,
  PATHS.pipeline,
  PATHS.pipelineHtml,
  PATHS.applications,
  PATHS.storyBank,
  PATHS.settings,
  PATHS.gallery,
  join(ROOT, 'output', 'master-resume.pdf'),
  join(ROOT, 'output', 'master-resume.html'),
];
const inbox = join(ROOT, 'inbox');
if (existsSync(inbox)) {
  for (const f of readdirSync(inbox)) if (f !== 'README.md') targets.push(join(inbox, f));
}
const found = targets.filter((p) => existsSync(p));

if (!found.length) {
  console.log('No personal files found. Nothing to delete.');
} else if (!opts.yes) {
  console.log('These personal files would be deleted:');
  for (const p of found) console.log(`- ${rel(p)}${statSync(p).isDirectory() ? '/ (all saved jobs and tailored resumes)' : ''}`);
  console.log('\nNEXT STEP: ask the user to confirm ("Delete all of this? It cannot be undone."). Only if they say yes, run: npm run clear-my-data -- --yes');
  process.exit(0);
} else {
  for (const p of found) rmSync(p, { recursive: true, force: true });
  console.log(`Deleted ${found.length} item(s): ${found.map(rel).join(', ')}`);
}

console.log(`
Two things this command cannot remove (tell the user):
1. This chat, which contains the resume text. Delete it from the AI tool's session or chat list
   (and from the online account too, if the tool keeps chats there).
   opencode in a terminal: close opencode, then run  opencode session list  and  opencode session delete <id>
2. On a shared computer, sign out of the AI tool: opencode auth logout (if an API key was added),
   /logout in Claude Code, codex logout in Codex, or sign out in the Antigravity app.`);
