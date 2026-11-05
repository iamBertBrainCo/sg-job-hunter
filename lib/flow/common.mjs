// lib/flow/common.mjs — shared paths and small helpers for the guided flow
// (check → import resume → find jobs → save job → tailor resume → pipeline).
//
// Every command in lib/flow/ prints short, plain output that a small model can
// read in one go, and writes its state to plain files under data/ and output/.

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const PATHS = {
  cv: join(ROOT, 'cv.md'),
  careerLog: join(ROOT, 'career-log.md'),
  resumeOriginal: join(ROOT, 'data', 'resume-original.txt'),
  jobs: join(ROOT, 'data', 'jobs.json'),
  jobsMd: join(ROOT, 'data', 'jobs.md'),
  pipeline: join(ROOT, 'data', 'pipeline.json'),
  applications: join(ROOT, 'output', 'applications'),
  pipelineHtml: join(ROOT, 'output', 'pipeline.html'),
  settings: join(ROOT, 'data', 'settings.json'),
  gallery: join(ROOT, 'output', 'resume-designs'),
  storyBank: join(ROOT, 'story-bank.md'),
  sources: join(ROOT, 'sources.yml'),
  sourcesExample: join(ROOT, 'sources.example.yml'),
};

// Shown (word for word) before the user shares a resume. Details: PRIVACY.md.
export const PRIVACY_NOTICE = `Before you share your resume, please know:
1. Your files stay on this computer. Nothing is uploaded to the people who made this tool.
2. When I (the AI) read your resume, or anything you type here, that text is sent to the company running the AI model you chose in opencode, often in the US or EU. Some free models keep what you send or use it to improve the model. PRIVACY.md shows how to pick one that does not.
3. Please leave out your NRIC/FIN or passport number, date of birth, home address, and other people's contact details (such as referees). In files you import, NRIC/FIN numbers, dates of birth, home addresses and referees' details are removed automatically, but text you type or paste here is sent as it is.
4. You can delete your files at any time: just say "delete my data".
Full details are in PRIVACY.md.`;

export function privacyAccepted() {
  return Boolean(readJson(PATHS.settings, {}).privacyAcceptedAt);
}

export const STATUSES = ['shortlisted', 'resume-ready', 'applied', 'interview', 'offer', 'rejected', 'skipped'];

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

export function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

export function writeJson(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf-8');
}

export function slugify(text, max = 40) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '') || 'job';
}

export function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Positional args and --flag / --flag=value / --flag value options.
export function parseArgs(argv = process.argv.slice(2)) {
  const args = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) opts[a.slice(2, eq)] = a.slice(eq + 1);
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) opts[a.slice(2)] = argv[++i];
      else opts[a.slice(2)] = true;
    } else {
      args.push(a);
    }
  }
  return { args, opts };
}

// Open a file or URL in the user's default app, on macOS, Windows or Linux.
export function openInDefaultApp(target) {
  const cmd = process.platform === 'darwin' ? ['open', [target]]
    // `start` takes the first quoted argument as a window title, so pass an empty one.
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', target]]
      : ['xdg-open', [target]];
  try {
    const child = spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

export function fileUrl(path) {
  const p = resolve(path).replace(/\\/g, '/');
  return 'file://' + (p.startsWith('/') ? '' : '/') + encodeURI(p);
}

// ── Pipeline (the jobs the user saved to work on) ──────────────────────────

export function loadPipeline() {
  return readJson(PATHS.pipeline, { applications: [] });
}

export function savePipeline(pipeline) {
  writeJson(PATHS.pipeline, pipeline);
}

// "1", "01", "01-agoda-data-analyst" or a folder path → the application entry.
export function findApplication(pipeline, ref) {
  const s = String(ref ?? '').trim().replace(/[\\/]+$/, '');
  if (!s) return null;
  const base = s.split(/[\\/]/).pop();
  const num = Number((base.match(/^(\d+)/) || [])[1]);
  return pipeline.applications.find((a) => a.folder === base)
    || (Number.isFinite(num) ? pipeline.applications.find((a) => a.num === num) : null)
    || null;
}

export function applicationDir(app) {
  return join(PATHS.applications, app.folder);
}

export function listApplicationFolders() {
  if (!existsSync(PATHS.applications)) return [];
  return readdirSync(PATHS.applications, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

export function money(min, max, period = 'month') {
  const f = (n) => 'SGD ' + Number(n).toLocaleString('en-SG');
  if (min && max) return `${f(min)} – ${Number(max).toLocaleString('en-SG')} / ${period}`;
  if (min || max) return `${f(min || max)} / ${period}`;
  return '';
}
