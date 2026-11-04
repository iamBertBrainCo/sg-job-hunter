#!/usr/bin/env node
// npm run import-resume -- [file]
//
// Reads the user's existing resume (PDF, Word .docx, .txt or .md) and prints
// its text so the agent can rewrite it as cv.md. With no file argument it
// looks in inbox/ — the folder users drop their files into.
//
// Also accepts a career log file: npm run import-resume -- inbox/log.docx --as career-log

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { extname, join, resolve, basename } from 'path';
import { homedir } from 'os';
import { ROOT, PATHS, ensureDir, parseArgs, privacyAccepted, readJson, writeJson } from './common.mjs';
import { scrubSensitive } from './privacy.mjs';

const SUPPORTED = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.rtf'];

// Printed with the resume text so the agent can write cv.md without another
// file read (the full example is examples/cv-format.md).
const CV_FORMAT = `# Full Name
Target Job Title
Singapore | +65 9123 4567 | name@example.com | linkedin.com/in/name

## Summary
Two to four sentences: years of experience, sectors, strengths, key certification.

## Core Competencies
- Competency one
- Competency two

## Experience
### Role | Company | Location | Mon YYYY – Mon YYYY
- Achievement starting with a verb, with a real number where there is one

## Education
### Qualification | School | Year

## Certifications
- Certification name | Issuer | Year

## Skills
- Category: item, item, item

Rules: leave out sections with nothing in them. No photo, NRIC, age, race, religion, marital status or salary. British spelling.`;
const INBOX = join(ROOT, 'inbox');

function cleanPath(raw) {
  let p = String(raw).trim().replace(/^['"]|['"]$/g, '');
  if (p.startsWith('file://')) p = decodeURIComponent(p.replace(/^file:\/\/(localhost)?/, ''));
  if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1); // file:///C:/... on Windows
  if (p.startsWith('~')) p = join(homedir(), p.slice(1));
  p = p.replace(/\\ /g, ' '); // drag-and-drop escapes spaces on macOS
  return resolve(ROOT, p);
}

export async function extractText(file) {
  const ext = extname(file).toLowerCase();
  if (ext === '.pdf') {
    const { extractText: pdfText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(readFileSync(file)));
    const { text } = await pdfText(pdf, { mergePages: true });
    return String(text);
  }
  if (ext === '.docx') {
    const mammoth = (await import('mammoth')).default;
    const { value } = await mammoth.extractRawText({ path: file });
    return value;
  }
  if (ext === '.doc') {
    throw new Error('Old .doc files cannot be read. Open it in Word or Google Docs and save as .docx or PDF.');
  }
  let text = readFileSync(file, 'utf-8');
  if (ext === '.rtf') text = text.replace(/\\par[d]?/g, '\n').replace(/\{\*?\\[^{}]+}|[{}]|\\[a-z]+-?\d* ?/gi, '');
  return text;
}

function tidy(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const { args, opts } = parseArgs();
if (!privacyAccepted()) {
  console.log('Not reading any files yet: the user has not seen the privacy notice.\nNEXT STEP: run npm run check and follow its NEXT STEP (show the notice, get their agreement), then run this again.');
  process.exit(1);
}
let files;
if (args.length) {
  files = args.map(cleanPath);
} else {
  ensureDir(INBOX);
  files = readdirSync(INBOX)
    .filter((f) => SUPPORTED.includes(extname(f).toLowerCase()) || extname(f).toLowerCase() === '.doc')
    .map((f) => join(INBOX, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (!files.length) {
    console.log(`No resume found. Ask the user to put their resume (PDF or Word) in this folder:\n  ${INBOX}\nor to paste the file path, or to paste the resume text in the chat.`);
    process.exit(1);
  }
}

const asLog = opts.as === 'career-log';
let all = '';
for (const file of files) {
  if (!existsSync(file)) {
    console.log(`File not found: ${file}\nAsk the user to check the path, or to drop the file into ${INBOX}`);
    process.exit(1);
  }
  let text;
  try {
    text = tidy(await extractText(file));
  } catch (e) {
    console.log(`Could not read ${basename(file)}: ${e.message}`);
    process.exit(1);
  }
  if (text.length < 200 && extname(file).toLowerCase() === '.pdf') {
    console.log(`${basename(file)} has almost no text — it is probably a scanned image. Ask the user for a Word version or to paste the text.`);
    process.exit(1);
  }
  all += `\n\n===== ${basename(file)} =====\n${text}`;
}

// Blank NRIC/FIN numbers before anything is saved or printed (printing is how
// the AI sees the text), and list other details the user may want to remove.
const scrub = scrubSensitive(all);
all = scrub.text;
const r = scrub.removed;
const removedList = [
  r.nric && (r.nric === 1 ? 'an NRIC/FIN number' : `${r.nric} NRIC/FIN numbers`),
  r.dob && 'a date of birth',
  r.address && 'a home address',
  r.referees && "referees' details (replaced with \"References available on request\")",
].filter(Boolean);
const privacyNote = [
  removedList.length ? `PRIVACY: removed ${removedList.join(', ')} before you saw the text. In your reply, tell the user in one sentence that these were left out to protect their privacy.` : '',
  scrub.found.length ? `PRIVACY: the file also seems to contain ${scrub.found.join(', ')}. Do NOT put these in cv.md, and tell the user you left them out.` : '',
].filter(Boolean).join('\n');
// Remembered so the next commands can remind the agent to tell the user.
const leftOut = [...removedList.map((x) => x.replace(/ \(replaced.*\)$/, '')), ...scrub.found];
if (leftOut.length) writeJson(PATHS.settings, { ...readJson(PATHS.settings, {}), privacyLeftOut: leftOut });

const target = asLog ? PATHS.careerLog : PATHS.resumeOriginal;
ensureDir(join(target, '..'));
if (asLog) {
  writeFileSync(target, `# Career log\n\n${all.trim()}\n`, 'utf-8');
  console.log(`Saved the career log to career-log.md (${all.length} characters).`);
  if (privacyNote) console.log(privacyNote);
} else {
  writeFileSync(target, all.trim() + '\n', 'utf-8');
  const shown = all.length > 15000 ? all.slice(0, 15000) + '\n…(cut; full text in data/resume-original.txt)' : all;
  console.log(`Read ${files.length} file(s). Full text saved to data/resume-original.txt\n${shown}`);
  if (privacyNote) console.log(`\n${privacyNote}`);
  console.log(`\nNEXT STEP: ${privacyNote ? 'first tell the user what was left out for privacy (see PRIVACY lines above). Then ' : ''}write ${PATHS.cv} in this exact format, using ONLY facts from the text above and the career log (no need to open any other file):

${CV_FORMAT}
Then run: npm run resume -- check`);
}
