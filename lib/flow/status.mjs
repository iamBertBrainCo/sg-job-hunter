#!/usr/bin/env node
// npm run status -- <application number> <status>
// Statuses: shortlisted, resume-ready, applied, interview, offer, rejected, skipped

import { parseArgs, loadPipeline, savePipeline, findApplication, STATUSES } from './common.mjs';

const { args } = parseArgs();
const [ref, rawStatus] = args;
const status = String(rawStatus || '').toLowerCase().replace(/\s+/g, '-');
const pipeline = loadPipeline();
const app = findApplication(pipeline, ref);

if (!app || !STATUSES.includes(status)) {
  console.log(`Usage: npm run status -- <number> <status>\nStatuses: ${STATUSES.join(', ')}\nSaved jobs: ${pipeline.applications.map((a) => `${a.num} (${a.company})`).join(', ') || 'none'}`);
  process.exit(1);
}
app.status = status;
app.updatedAt = new Date().toISOString();
if (status === 'applied' && !app.appliedAt) app.appliedAt = app.updatedAt.slice(0, 10);
savePipeline(pipeline);
console.log(`Application ${app.num} (${app.title} — ${app.company}) is now: ${status}.`);
if (status === 'applied') console.log('Tip: follow up in about 7 days if there is no reply.');
