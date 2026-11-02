#!/usr/bin/env node

/**
 * evaluate.mjs — Evaluation Orchestrator for SG Job Hunter
 *
 * Assembles the full evaluation context (profile, market rules, JD) and
 * feeds it to the AI agent for 6-block scoring. Generates reports,
 * application packages, and updates the tracker.
 *
 * Usage:
 *   node lib/evaluate.mjs --url <job-url>
 *   node lib/evaluate.mjs --url <job-url> --apply
 *   node lib/evaluate.mjs --url <job-url> --apply --yes
 *   node lib/evaluate.mjs --jd <file>
 *   node lib/evaluate.mjs --stdin
 *   node lib/evaluate.mjs --pipeline              # Process all pending jobs in pipeline.md
 *   node lib/evaluate.mjs --url <url> --json      # JSON output for agent integration
 *
 * Workflow:
 *   1. Fetch job description (browser-extract or file/stdin)
 *   2. Check deal-breakers (skip if matched)
 *   3. Reserve report number (atomic)
 *   4. Assemble evaluation context (profile + market rules + JD)
 *   5. AI agent scores 6 blocks → generates report
 *   6. If score ≥ 4.0 and --apply: generate tailored resume + cover letter
 *   7. Human-in-the-loop review (you vet every document)
 *   8. Update tracker, ready to apply
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── CLI Flags ───

const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--url' && i + 1 < argv.length) { flags.url = argv[++i]; }
  else if (arg === '--jd' && i + 1 < argv.length) { flags.jd = argv[++i]; }
  else if (arg === '--stdin') { flags.stdin = true; }
  else if (arg === '--apply') { flags.apply = true; }
  else if (arg === '--yes') { flags.yes = true; }
  else if (arg === '--json') { flags.json = true; }
  else if (arg === '--pipeline') { flags.pipeline = true; }
  else if (arg === '--patch' && i + 1 < argv.length) {
    flags.patch = argv[++i];
    if (flags.patch === 'apply' && i + 1 < argv.length) {
      flags.patchFile = argv[++i];
    }
  }
  else if (arg === '--help' || arg === '-h') { showHelp(); process.exit(0); }
}

function showHelp() {
  console.log(`
SG Job Hunter — Evaluation Orchestrator

Usage:
  node lib/evaluate.mjs --url <job-url> [options]
  node lib/evaluate.mjs --jd <file> [options]
  node lib/evaluate.mjs --stdin [options]
  node lib/evaluate.mjs --pipeline [options]

Options:
  --url <url>      Job posting URL to evaluate
  --jd <file>      Path to a job description file
  --stdin          Read job description from stdin
  --pipeline       Process all pending jobs in data/pipeline.md
  --apply          Generate tailored resume + cover letter if score ≥ 4.0
  --yes            Skip human review prompt (auto-approve)
  --json           Output results as JSON (for agent integration)
  --patch list     Show current resume override rules
  --patch add <f>  Open a generated file for manual override creation
  --patch apply <f> Apply overrides to an existing file
  --help           Show this help message

Workflow:
  1. Fetch job description (browser or file)
  2. Check deal-breakers (auto-skip if matched)
  3. Reserve report number
  4. Run 6-block evaluation (Role, Experience, Skills, Location, Compensation, Culture)
  5. Generate report → reports/{NNN}.md
  6. If score ≥ 4.0 and --apply: generate tailored resume + cover letter
  7. HUMAN-IN-THE-LOOP: You review every document before applying
  8. Update tracker → ready to apply

Editing Generated Documents:
  If you find an error in the generated resume or cover letter:

  Option A — Fix the source (recommended):
    1. Edit cv.md (your resume) or config/profile.yml
    2. Re-run: node lib/evaluate.mjs --url <url> --apply

  Option B — Add a persistent override (survives regeneration):
    1. Edit data/cv-overrides.json:
       { "find": "wrong text", "replace": "correct text" }
    2. Re-run: node lib/evaluate.mjs --url <url> --apply
       (overrides are applied automatically)

  Option C — Apply overrides to an existing file:
    node lib/evaluate.mjs --patch apply output/cvs/file.html

Examples:
  node lib/evaluate.mjs --url "https://www.mycareersfuture.gov.sg/job/123"
  node lib/evaluate.mjs --url "https://www.linkedin.com/jobs/view/123" --apply
  node lib/evaluate.mjs --pipeline --apply
  node lib/evaluate.mjs --patch list
  cat job-description.md | node lib/evaluate.mjs --stdin --apply
`);
}

// ─── Load Config & Context ───

function loadProfile() {
  const profilePath = join(ROOT, 'config', 'profile.yml');
  if (!existsSync(profilePath)) {
    console.error('❌ config/profile.yml not found.');
    console.error('   Run: node doctor.mjs --init-templates');
    process.exit(1);
  }
  return readFileSync(profilePath, 'utf-8');
}

function loadCv() {
  const cvPath = join(ROOT, 'cv.md');
  if (!existsSync(cvPath)) {
    console.error('❌ cv.md not found. Create your CV in markdown format.');
    console.error('   See cv.example.md for a template.');
    process.exit(1);
  }
  return readFileSync(cvPath, 'utf-8');
}

function loadProfileMode() {
  const modePath = join(ROOT, 'modes', '_profile.md');
  return existsSync(modePath) ? readFileSync(modePath, 'utf-8') : '';
}

function loadMarketRules() {
  const sgShared = join(ROOT, 'modes', 'sg', '_shared.md');
  const sgOferta = join(ROOT, 'modes', 'sg', 'oferta.md');
  let rules = '';
  if (existsSync(sgShared)) rules += readFileSync(sgShared, 'utf-8');
  if (existsSync(sgOferta)) rules += '\n' + readFileSync(sgOferta, 'utf-8');
  return rules;
}

function loadSalaryBenchmarks() {
  const path = join(ROOT, 'data', 'salary-benchmarks-2026.md');
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf-8');
}

function getSalaryRangeForRole(roleTitle, yearsOfExperience) {
  const benchmarks = loadSalaryBenchmarks();
  if (!benchmarks) return null;

  const roleLower = roleTitle.toLowerCase();
  const level = yearsOfExperience < 3 ? 'junior' : yearsOfExperience < 7 ? 'mid' : 'senior';

  // Search for the role in benchmarks
  const lines = benchmarks.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('|') && line.toLowerCase().includes(roleLower)) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        const junior = cells[1] || null;
        const mid = cells[2] || null;
        const senior = cells[3] || null;

        let range = null;
        if (level === 'junior' && junior) range = junior;
        else if (level === 'mid' && mid) range = mid;
        else if (level === 'senior' && senior) range = senior;

        if (range) {
          const match = range.match(/\$?\s*(\d[\d,]*)\s*–\s*(\d[\d,]*)/);
          if (match) {
            return {
              min: parseInt(match[1].replace(/,/g, '')),
              max: parseInt(match[2].replace(/,/g, '')),
              range: range,
              level,
            };
          }
        }
      }
    }
  }

  return null;
}

function loadDealBreakers() {
  const profile = parseYamlMinimal(loadProfile());
  return profile?.candidate?.deal_breakers || [];
}

function loadStates() {
  const statesPath = join(ROOT, 'states.yml');
  if (!existsSync(statesPath)) return ['Evaluated', 'Applied', 'Interview', 'Offer', 'Hired', 'Rejected', 'SKIP'];
  const content = readFileSync(statesPath, 'utf-8');
  const states = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      states.push(trimmed.slice(2).trim().replace(/['"]/g, ''));
    }
  }
  return states.length > 0 ? states : ['Evaluated', 'Applied', 'Interview', 'Offer', 'Hired', 'Rejected', 'SKIP'];
}

// ─── Minimal YAML Parser ───

function parseYamlMinimal(content) {
  const result = {};
  const lines = content.split('\n');
  const stack = [{ key: '', obj: result }];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = line.search(/\S/);
    const level = Math.floor(indent / 2);
    while (stack.length > level + 1) stack.pop();

    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim().replace(/^["']|["']$/g, '');
      const parent = stack[stack.length - 1].obj;
      const key = stack[stack.length - 1].key;
      if (!Array.isArray(parent[key])) parent[key] = [];
      parent[key].push(value);
    } else if (trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      const parent = stack[stack.length - 1].obj;
      if (value === '' || value === '|' || value === '>') {
        const newObj = {};
        parent[key] = newObj;
        stack.push({ key, obj: newObj });
      } else {
        parent[key] = value;
      }
    }
  }
  return result;
}

// ─── Job Description Fetcher ───

async function fetchJobDescription(source) {
  let jdText = '';
  let metadata = { company: '', title: '', location: '', url: '' };

  if (source.url) {
    metadata.url = source.url;
    console.log(`🔍 Fetching job description from: ${source.url}`);

    try {
      // Try browser-extract.mjs first (handles ATS APIs, JSON-LD, etc.)
      const extractResult = await runBrowserExtract(source.url);
      jdText = extractResult.text || '';
      if (extractResult.title) metadata.title = extractResult.title;
      if (extractResult.company) metadata.company = extractResult.company;
      if (extractResult.location) metadata.location = extractResult.location;
    } catch (err) {
      console.log(`⚠️  Browser extraction failed: ${err.message}`);
      console.log('   Falling back to HTTP fetch...');
      try {
        const response = await fetch(source.url, {
          headers: { 'User-Agent': 'SG-Job-Hunter/1.0' }
        });
        const html = await response.text();
        jdText = htmlToText(html);
        metadata.title = extractTitleFromUrl(source.url);
        metadata.company = extractCompanyFromUrl(source.url);
      } catch (fetchErr) {
        console.error(`❌ Failed to fetch: ${fetchErr.message}`);
        process.exit(1);
      }
    }
  } else if (source.jd) {
    console.log(`📄 Reading job description from: ${source.jd}`);
    jdText = readFileSync(source.jd, 'utf-8');
    const titleMatch = jdText.match(/^(?:#?\s*)?(.+?)(?:\n|$)/);
    if (titleMatch) metadata.title = titleMatch[1].trim();
  } else if (source.stdin) {
    console.log('📄 Reading job description from stdin...');
    jdText = await readStdin();
  }

  if (!jdText || jdText.length < 50) {
    console.error('❌ Job description too short or empty.');
    process.exit(1);
  }

  console.log(`✅ Job description loaded (${jdText.length} chars)`);
  if (metadata.title) console.log(`   Title: ${metadata.title}`);
  if (metadata.company) console.log(`   Company: ${metadata.company}`);

  return { text: jdText, metadata };
}

async function runBrowserExtract(url) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [join(ROOT, 'lib', 'browser-extract.mjs'), '--mode', 'jd', url], {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', code => {
      if (code === 0) {
        try {
          const json = JSON.parse(stdout.trim());
          resolve(json);
        } catch {
          reject(new Error(`Invalid JSON from browser-extract: ${stdout.slice(0, 200)}`));
        }
      } else {
        reject(new Error(stderr.trim() || `Exit code ${code}`));
      }
    });
  });
}

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitleFromUrl(url) {
  const match = url.match(/jobs\/view\/(\d+)/) || url.match(/job\/([^?]+)/);
  return match ? match[1] : '';
}

function extractCompanyFromUrl(url) {
  const match = url.match(/linkedin\.com\/company\/([^/?]+)/);
  return match ? match[1] : '';
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

// ─── Deal-Breaker Checker ───

function checkDealBreakers(jdText, metadata, dealBreakers) {
  const jdLower = jdText.toLowerCase();
  const titleLower = (metadata.title || '').toLowerCase();

  for (const breaker of dealBreakers) {
    const breakerLower = breaker.toLowerCase();
    // Check both JD text and title
    if (jdLower.includes(breakerLower) || titleLower.includes(breakerLower)) {
      return { skipped: true, reason: breaker };
    }
    // Check common variations
    const variations = {
      'no sales': ['sales', 'business development', 'BD', 'account executive'],
      'no security': ['security guard', 'security officer', 'security analyst'],
      'no junior': ['junior', 'graduate', 'intern', 'entry level', 'assistant', 'coordinator'],
      'no on-site': ['on-site only', 'office only', 'no remote', 'no hybrid'],
    };
    for (const [key, terms] of Object.entries(variations)) {
      if (breakerLower.includes(key)) {
        for (const term of terms) {
          if (jdLower.includes(term) || titleLower.includes(term)) {
            return { skipped: true, reason: breaker };
          }
        }
      }
    }
  }
  return { skipped: false };
}

// ─── Report Number Reserver ───

function reserveReportNumber() {
  try {
    const output = execSync(`node "${join(ROOT, 'lib', 'reserve-report-num.mjs')}" --count 1`, {
      cwd: ROOT,
      encoding: 'utf-8',
    }).trim();
    // Parse the output (expecting a number or JSON)
    const num = output.match(/\d+/);
    return num ? num[0].padStart(3, '0') : '001';
  } catch {
    // Fallback: find next available number
    const reportsDir = join(ROOT, 'reports');
    if (!existsSync(reportsDir)) return '001';
    const files = readdirSync(reportsDir).filter(f => f.match(/^\d{3}/));
    const nums = files.map(f => parseInt(f.match(/^(\d{3})/)[1])).sort((a, b) => b - a);
    const next = nums.length > 0 ? nums[0] + 1 : 1;
    return String(next).padStart(3, '0');
  }
}

// ─── Evaluation Context Assembler ───

function assembleEvaluationContext(jdText, metadata, profile, cvText, profileMode, marketRules) {
  return `# JOB EVALUATION REQUEST

## Instructions
Evaluate this job using the 6-block framework. Score each block 1-5, calculate weighted overall score, and provide a verdict (APPLY/CONSIDER/SKIP).

## Scoring Guide
- **4.5–5.0:** 🔥 Apply immediately
- **4.0–4.4:** ✅ Strong match, apply
- **3.5–3.9:** ⚠️ Consider if you have a specific reason
- **Below 3.5:** ❌ Skip

## Block Weights
- Block A (Role Match): 25%
- Block B (Experience Match): 25%
- Block C (Skills Match): 20%
- Block D (Location & Logistics): 10%
- Block E (Compensation): 10%
- Block F (Culture & Mission Fit): 10%

---

## JOB DETAILS
- **Company:** ${metadata.company || 'Not specified'}
- **Title:** ${metadata.title || 'Not specified'}
- **Location:** ${metadata.location || 'Not specified'}
- **URL:** ${metadata.url || 'N/A'}

---

## JOB DESCRIPTION
${jdText}

---

## CANDIDATE PROFILE
${profile}

---

## CANDIDATE RESUME
${cvText}

---

## MATCHING PROFILE (Archetypes, Proof Points, Signals)
${profileMode}

---

## SINGAPORE MARKET RULES
${marketRules}

---

## OUTPUT FORMAT
Generate a report in this exact format:

\`\`\`
# Report {NNN} — {Company} — {Role}

**Date:** {YYYY-MM-DD}
**Candidate:** {Name}
**Score:** {X.X}/5
**URL:** {job-url}

## Verdict: {APPLY/CONSIDER/SKIP} — {one-line reason}

## Block A — Role Match: {X}/5
{reasoning}

## Block B — Experience Match: {X}/5
{reasoning}

## Block C — Skills Match: {X}/5
{reasoning}

## Block D — Location & Logistics: {X}/5
{reasoning}

## Block E — Compensation: {X}/5
{reasoning}

## Block F — Culture & Mission Fit: {X}/5
{reasoning}

## Risk Summary
- **{Low/Medium/High} risk:** {description}

## Machine Summary
\`\`\`yaml
score: {X.X}
verdict: {APPLY|CONSIDER|SKIP}
reason: "{one-line reason}"
blocks:
  A_role_match: {X}
  B_experience: {X}
  C_skills: {X}
  D_location: {X}
  E_compensation: {X}
  F_culture: {X}
\`\`\`

## Job Description (archived verbatim)
{full JD text}
\`\`\`
`;
}

// ─── Report Writer ───

function writeReport(reportNum, reportContent, jdText, metadata) {
  const reportsDir = join(ROOT, 'reports');
  mkdirSync(reportsDir, { recursive: true });

  // Ensure report has JD archived
  if (!reportContent.includes('## Job Description (archived verbatim)')) {
    reportContent += `\n\n## Job Description (archived verbatim)\n\n${jdText}`;
  }

  const reportPath = join(reportsDir, `${reportNum}.md`);
  writeFileSync(reportPath, reportContent);
  return reportPath;
}

// ─── Override System ───

function loadOverrides() {
  const overridesPath = join(ROOT, 'data', 'cv-overrides.json');
  if (!existsSync(overridesPath)) return [];
  try {
    const content = readFileSync(overridesPath, 'utf-8');
    const data = JSON.parse(content);
    return data.rules || [];
  } catch {
    console.log('⚠️  Could not parse data/cv-overrides.json — skipping overrides.');
    return [];
  }
}

function applyOverrides(html, overrides) {
  if (overrides.length === 0) return html;
  let result = html;
  let applied = 0;
  for (const rule of overrides) {
    if (rule.find && rule.replace !== undefined) {
      const regex = new RegExp(escapeRegex(rule.find), 'g');
      if (regex.test(result)) {
        result = result.replace(regex, rule.replace);
        applied++;
      }
    }
  }
  if (applied > 0) {
    console.log(`   ✓ Applied ${applied} override rule(s) from data/cv-overrides.json`);
  }
  return result;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Override Manager (--patch mode) ───

async function manageOverrides(mode, filePath) {
  const overridesPath = join(ROOT, 'data', 'cv-overrides.json');
  let overrides = { _comment: 'CV Override Rules', rules: [] };

  if (existsSync(overridesPath)) {
    try {
      overrides = JSON.parse(readFileSync(overridesPath, 'utf-8'));
    } catch {
      overrides = { _comment: 'CV Override Rules', rules: [] };
    }
  }

  if (mode === 'list') {
    console.log('\n📋 Current resume overrides:');
    if (overrides.rules.length === 0) {
      console.log('   (none — data/cv-overrides.json is empty)');
    } else {
      overrides.rules.forEach((rule, i) => {
        console.log(`\n   Rule ${i + 1}:`);
        console.log(`     FIND:    "${rule.find}"`);
        console.log(`     REPLACE: "${rule.replace}"`);
      });
    }
    console.log('\n   Edit data/cv-overrides.json to add/remove rules.');
    return;
  }

  if (mode === 'add' && filePath) {
    // Read the generated file, let user pick what to fix
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const content = readFileSync(filePath, 'utf-8');
    console.log('\n📄 Opened:', filePath);
    console.log('   File size:', content.length, 'chars');
    console.log('\n💡 To create an override rule:');
    console.log('   1. Find the exact text you want to change');
    console.log('   2. Add a rule to data/cv-overrides.json:');
    console.log('      { "find": "wrong text", "replace": "correct text" }');
    console.log('   3. Re-run with --apply to regenerate with the fix');
    console.log('\n👉 Or edit data/cv-overrides.json directly.');

    // Show lines around common editable sections
    const lines = content.split('\n');
    const editableSections = [];
    let inSection = false;
    let sectionStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Why I\'m a Strong Fit') || line.includes('Key Achievements') || line.includes('Experience')) {
        inSection = true;
        sectionStart = i;
      }
      if (inSection && (line.includes('---') || line.includes('</div>') || i - sectionStart > 15)) {
        inSection = false;
        editableSections.push({
          start: sectionStart,
          end: Math.min(i, lines.length),
          preview: lines[sectionStart].trim().slice(0, 60),
        });
      }
    }

    if (editableSections.length > 0) {
      console.log('\n📍 Editable sections in this file:');
      editableSections.forEach((section, i) => {
        console.log(`   ${i + 1}. Line ${section.start + 1}: ${section.preview}...`);
      });
    }

    return;
  }

  if (mode === 'apply') {
    // Apply overrides to a specific file
    if (!filePath || !existsSync(filePath)) {
      console.error('❌ Usage: node lib/evaluate.mjs --patch apply <file-path>');
      process.exit(1);
    }

    const rules = loadOverrides();
    if (rules.length === 0) {
      console.log('No override rules configured. Edit data/cv-overrides.json to add rules.');
      return;
    }

    let content = readFileSync(filePath, 'utf-8');
    content = applyOverrides(content, rules);
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Applied ${rules.length} override rule(s) to ${filePath}`);
    return;
  }

  console.error(`❌ Unknown patch mode: ${mode}`);
  console.error('   Use: list, add <file>, or apply <file>');
}

// ─── Application Package Generator ───

async function generateApplicationPackage(jdText, metadata, profile, cvText, profileMode) {
  console.log('\n📄 Generating application package...');

  const companySlug = slugify(metadata.company || 'company');
  const roleSlug = slugify(metadata.title || 'role');
  const fileBase = `${companySlug}-${roleSlug}`;

  // Load overrides
  const overrides = loadOverrides();

  // Generate tailored resume
  let tailoredCv = tailorCv(cvText, jdText, metadata, profile, profileMode);
  tailoredCv = applyOverrides(tailoredCv, overrides);
  const cvPath = join(ROOT, 'output', 'cvs', `${fileBase}.html`);
  mkdirSync(join(ROOT, 'output', 'cvs'), { recursive: true });
  writeFileSync(cvPath, tailoredCv);
  console.log(`   ✓ Tailored resume: ${cvPath}`);

  // Generate cover letter
  let coverLetter = generateCoverLetter(jdText, metadata, profile, cvText, profileMode);
  coverLetter = applyOverrides(coverLetter, overrides);
  const clPath = join(ROOT, 'output', 'cover-letters', `${fileBase}.html`);
  mkdirSync(join(ROOT, 'output', 'cover-letters'), { recursive: true });
  writeFileSync(clPath, coverLetter);
  console.log(`   ✓ Cover letter: ${clPath}`);

  return { cvPath, clPath, fileBase };
}

function tailorCv(cvText, jdText, metadata, profile, profileMode) {
  const jdLower = jdText.toLowerCase();
  const keyRequirements = extractKeyRequirements(jdText);
  const proofPoints = extractProofPoints(cvText, profileMode);

  // Load CV template
  const templatePath = join(ROOT, 'cv-template.html');
  let template = '';
  if (existsSync(templatePath)) {
    template = readFileSync(templatePath, 'utf-8');
  }

  // Build tailored sections
  const tailoredSections = keyRequirements.slice(0, 5).map(req => {
    const match = findMatchingProof(cvText, req);
    return match ? `**${req}**: ${match}` : `Experience in **${req}**`;
  }).join('\n\n');

  const tailoredContent = `
## Why I'm a Strong Fit for ${metadata.title || 'This Role'} at ${metadata.company || 'Your Company'}

${tailoredSections}

---

## Key Achievements

${proofPoints.slice(0, 5).map(p => `• ${p}`).join('\n')}
`;

  if (template) {
    return template.replace(/<!-- CV CONTENT -->/g, markdownToHtml(tailoredContent));
  }

  // Fallback: simple HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resume — ${metadata.company || 'Company'} | ${metadata.title || 'Role'}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
  h1 { color: #1a1a2e; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
  h2 { color: #16213e; margin-top: 30px; }
  h3 { color: #0f3460; }
  .highlight { background: #f0f4ff; padding: 2px 6px; border-radius: 3px; }
  hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; }
</style>
</head>
<body>
${markdownToHtml(cvText + tailoredContent)}
</body>
</html>`;
}

function generateCoverLetter(jdText, metadata, profile, cvText, profileMode) {
  const keyRequirements = extractKeyRequirements(jdText);
  const proofPoints = extractProofPoints(cvText, profileMode);

  const profileData = parseYamlMinimal(profile);
  const candidateName = profileData?.candidate?.full_name || 'Your Name';
  const candidateEmail = profileData?.candidate?.email || 'your.email@example.com';
  const candidatePhone = profileData?.candidate?.phone || '+65 9XXX XXXX';
  const company = metadata.company || 'Dear Hiring Manager';
  const role = metadata.title || 'this role';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cover Letter — ${company} | ${role}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #333; }
  .header { margin-bottom: 30px; }
  .header h1 { color: #1a1a2e; margin: 0; }
  .header p { color: #666; margin: 5px 0; }
  .body p { margin-bottom: 15px; text-align: justify; }
  .body ul { margin-bottom: 15px; }
  .body li { margin-bottom: 8px; }
  .sign-off { margin-top: 30px; }
</style>
</head>
<body>
<div class="header">
  <h1>${candidateName}</h1>
  <p>${candidateEmail} • ${candidatePhone}</p>
  <p>${new Date().toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>

<p>Dear ${company} Hiring Team,</p>

<div class="body">
  <p>I am writing to express my strong interest in the <strong>${role}</strong> position at ${company}. With a track record of delivering measurable impact, I am confident I can bring immediate value to your team.</p>

  <p>Having reviewed the job description, I see a strong alignment between what you need and what I bring:</p>

  <ul>
    ${keyRequirements.slice(0, 4).map(req => {
      const proof = findMatchingProof(cvText, req);
      return `<li><strong>${req}:</strong> ${proof || 'I have extensive experience in this area'}</li>`;
    }).join('\n    ')}
  </ul>

  <p>Here are some highlights from my career:</p>

  <ul>
    ${proofPoints.slice(0, 4).map(p => `<li>${p}</li>`).join('\n    ')}
  </ul>

  <p>I am eager to bring my experience to contribute to ${company}'s continued growth. I have attached my resume for your review and would welcome the opportunity to discuss how I can contribute.</p>

  <p>Thank you for your time and consideration.</p>
</div>

<div class="sign-off">
  <p>Best regards,</p>
  <p><strong>${candidateName}</strong></p>
</div>
</body>
</html>`;
}

function extractKeyRequirements(jdText) {
  const requirements = [];
  const lines = jdText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && trimmed.length > 10 && trimmed.length < 200) {
      requirements.push(trimmed.replace(/^[-•*]\s*/, '').trim());
    }
  }
  if (requirements.length < 3) {
    const sentences = jdText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 200);
    requirements.push(...sentences.slice(0, 5));
  }
  return requirements.slice(0, 8);
}

function extractProofPoints(cvText, profileMode) {
  const proofs = [];
  if (profileMode) {
    const proofSection = profileMode.match(/## Proof points[\s\S]*?(?=##|\Z)/);
    if (proofSection && proofSection[0]) {
      const lines = proofSection[0].split('\n').filter(l => l.trim().startsWith('- '));
      proofs.push(...lines.map(l => l.replace(/^- /, '').trim()));
    }
  }
  const cvLines = cvText.split('\n');
  for (const line of cvLines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith('-') || trimmed.startsWith('•')) && /\d+%|\d+,?\d+\s*[\$]/.test(trimmed)) {
      proofs.push(trimmed.replace(/^[-•]\s*/, '').trim());
    }
  }
  return [...new Set(proofs)].slice(0, 6);
}

function findMatchingProof(cvText, requirement) {
  const reqLower = requirement.toLowerCase();
  const cvLines = cvText.split('\n');
  for (const line of cvLines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith('-') || trimmed.startsWith('•')) && trimmed.length > 20) {
      const content = trimmed.replace(/^[-•]\s*/, '').toLowerCase();
      const reqWords = reqLower.split(/\s+/).filter(w => w.length > 3);
      const matchCount = reqWords.filter(w => content.includes(w)).length;
      if (matchCount >= 2) return trimmed.replace(/^[-•]\s*/, '').trim();
    }
  }
  return null;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function markdownToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// ─── Human-in-the-Loop Review ───

async function promptReview(evaluation, packagePath) {
  if (evaluation.overall < 4.0) {
    console.log(`\n⚠️  Score ${evaluation.overall}/5.0 — below 4.0 threshold.`);
    console.log('   Review the report and decide manually.');
    return false;
  }

  if (flags.yes) {
    console.log('\n✅ Auto-approve mode (--yes). Skipping human review.');
    return true;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 HUMAN-IN-THE-LOOP REVIEW REQUIRED');
  console.log('='.repeat(60));
  console.log(`\nEvaluation score: ${evaluation.overall}/5.0 — Verdict: ${evaluation.verdict}`);
  console.log('\nGenerated documents:');
  console.log(`  📄 Resume:       ${packagePath.cvPath}`);
  console.log(`  📄 Cover Letter: ${packagePath.clPath}`);
  console.log('\n⚠️  IMPORTANT: Before applying, you MUST review these documents.');
  console.log('   Check for accuracy, tone, and relevance to the specific role.');
  console.log('   This is your chance to customize and personalize before hitting send.');
  console.log('\n👉 Open the files above, review them, and make any edits.');
  console.log('\n💡 FOUND AN ERROR? Here\'s how to fix it:');
  console.log('   Option A — Fix the source (recommended):');
  console.log('     1. Edit cv.md (your resume) or config/profile.yml');
  console.log('     2. Re-run: node lib/evaluate.mjs --url <url> --apply');
  console.log('   Option B — Add a persistent override (survives regeneration):');
  console.log('     1. Edit data/cv-overrides.json:');
  console.log('        { "find": "wrong text", "replace": "correct text" }');
  console.log('     2. Re-run — overrides are applied automatically');
  console.log('   Option C — Apply overrides to existing file:');
  console.log('     node lib/evaluate.mjs --patch apply <file-path>');
  console.log('='.repeat(60));

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question('\nHave you reviewed the documents? (yes/no): ', (a) => {
      rl.close();
      resolve(a.trim().toLowerCase());
    });
  });

  return answer === 'yes' || answer === 'y';
}

// ─── Tracker Update ───

function updateTracker(metadata, evaluation, packagePath) {
  const trackerPath = join(ROOT, 'data', 'applications.md');
  let trackerContent = '';
  let needsHeader = true;

  if (existsSync(trackerPath)) {
    trackerContent = readFileSync(trackerPath, 'utf-8');
    needsHeader = !trackerContent.includes('| # |');
  } else {
    mkdirSync(join(ROOT, 'data'), { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const entry = `| ${evaluation.reportNum} | ${timestamp} | ${metadata.company || 'TBD'} | ${metadata.title || 'TBD'} | ${evaluation.overall} | Evaluated | ${packagePath?.cvPath ? 'Yes' : 'No'} | reports/${evaluation.reportNum}.md |`;

  if (needsHeader) {
    const header = `# Applications Tracker\n\n| # | Date | Company | Role | Score | Status | PDF | Report |\n|---|------|---------|------|-------|--------|-----|--------|\n${entry}`;
    writeFileSync(trackerPath, header, 'utf-8');
  } else {
    writeFileSync(trackerPath, trackerContent + '\n' + entry, 'utf-8');
  }

  console.log(`\n📋 Tracker updated: ${trackerPath}`);
}

// ─── Pipeline Processor ───

async function processPipeline() {
  const pipelinePath = join(ROOT, 'data', 'pipeline.md');
  if (!existsSync(pipelinePath)) {
    console.error('❌ data/pipeline.md not found.');
    process.exit(1);
  }

  const content = readFileSync(pipelinePath, 'utf-8');
  const jobs = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]')) {
      const urlMatch = trimmed.match(/(https?:\/\/[^\s|]+)/);
      if (urlMatch) {
        const parts = trimmed.split('|').map(p => p.trim());
        jobs.push({
          url: urlMatch[1],
          company: parts[1]?.trim() || '',
          title: parts[2]?.trim() || '',
        });
      }
    }
  }

  if (jobs.length === 0) {
    console.log('No pending jobs in pipeline.');
    return;
  }

  console.log(`\n📋 Found ${jobs.length} pending job(s) in pipeline:\n`);
  jobs.forEach((job, i) => {
    console.log(`  ${i + 1}. ${job.company || 'Unknown'} — ${job.title || 'Unknown'}`);
    console.log(`     ${job.url}`);
  });

  // Process each job
  for (const job of jobs) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${job.company || 'Unknown'} — ${job.title || 'Unknown'}`);
    console.log('='.repeat(60));

    await evaluateSingleJob({ url: job.url }, { company: job.company, title: job.title });
  }
}

// ─── Main Evaluation Flow ───

async function evaluateSingleJob(source, overrideMetadata = {}) {
  // Load config
  const profile = loadProfile();
  const cvText = loadCv();
  const profileMode = loadProfileMode();
  const marketRules = loadMarketRules();
  const dealBreakers = loadDealBreakers();

  // Fetch job description
  const { text: jdText, metadata } = await fetchJobDescription(source);

  // Override metadata if provided (from pipeline)
  if (overrideMetadata.company) metadata.company = overrideMetadata.company;
  if (overrideMetadata.title) metadata.title = overrideMetadata.title;

  // Check deal-breakers
  const dealBreakerCheck = checkDealBreakers(jdText, metadata, dealBreakers);
  if (dealBreakerCheck.skipped) {
    console.log(`\n⛔ SKIPPED: Deal-breaker matched — "${dealBreakerCheck.reason}"`);
    return { skipped: true, reason: dealBreakerCheck.reason };
  }

  // Reserve report number
  const reportNum = reserveReportNumber();
  console.log(`\n📝 Report number: ${reportNum}`);

  // Assemble evaluation context
  const context = assembleEvaluationContext(jdText, metadata, profile, cvText, profileMode, marketRules);

  // In agent mode: the context is passed to the AI agent for scoring
  // In standalone mode: we do a basic heuristic evaluation
  let evaluation;
  let reportContent;

  if (flags.json) {
    // JSON mode: output context for agent to process
    const result = {
      reportNum,
      metadata,
      context: context.slice(0, 50000), // Truncate for safety
      jdLength: jdText.length,
      dealBreakersChecked: true,
    };
    console.log('\n' + JSON.stringify(result, null, 2));
    return result;
  }

  // Standalone mode: run heuristic evaluation
  console.log('\n📊 Running evaluation...');
  evaluation = runHeuristicEvaluation(jdText, metadata, profile, cvText, profileMode, marketRules);
  reportContent = generateReportContent(evaluation, jdText, metadata, profile);

  // Write report
  const reportPath = writeReport(reportNum, reportContent, jdText, metadata);
  console.log(`✅ Report saved: ${reportPath}`);
  console.log(`   Score: ${evaluation.overall}/5.0 — Verdict: ${evaluation.verdict}`);

  // Generate application package if requested
  let packagePath = null;
  if (flags.apply && evaluation.overall >= 4.0) {
    packagePath = await generateApplicationPackage(jdText, metadata, profile, cvText, profileMode);

    // Human-in-the-loop review
    const approved = await promptReview(evaluation, packagePath);

    if (approved) {
      console.log('\n✅ Documents approved! Updating tracker...');
      updateTracker(metadata, evaluation, packagePath);

      console.log('\n' + '='.repeat(60));
      console.log('🎯 READY TO APPLY');
      console.log('='.repeat(60));
      console.log('\nYour documents are ready. Next steps:');
      console.log(`1. Convert resume to PDF: npm run convert-cv`);
      console.log(`2. Convert cover letter to PDF: npm run convert-cover-letter`);
      console.log(`3. Go to: ${metadata.url}`);
      console.log(`4. Upload your PDFs and click Apply`);
      console.log(`5. Update status: npm run set-status -- --report ${reportNum} Applied`);
      console.log('\nRemember: YOU click "Apply". We prepared the documents.');
      console.log('='.repeat(60));
    } else {
      console.log('\n⏸️  Application paused. Review and edit documents, then re-run with --yes.');
    }
  } else if (flags.apply && evaluation.overall < 4.0) {
    console.log(`\n⚠️  Score ${evaluation.overall}/5.0 — below 4.0 threshold.`);
    console.log('   Application documents were not generated.');
  }

  return { skipped: false, reportNum, evaluation };
}

// ─── Heuristic Evaluation (Standalone Mode) ───

function runHeuristicEvaluation(jdText, metadata, profile, cvText, profileMode, marketRules) {
  const profileData = parseYamlMinimal(profile);
  const jdLower = jdText.toLowerCase();
  const cvLower = cvText.toLowerCase();
  const titleLower = (metadata.title || '').toLowerCase();

  // Block A: Role Match
  const blockA = evaluateRoleMatch(jdLower, titleLower, profileData, profileMode);
  // Block B: Experience
  const blockB = evaluateExperience(jdLower, profileData);
  // Block C: Skills
  const blockC = evaluateSkills(jdLower, cvLower, profileData);
  // Block D: Location
  const blockD = evaluateLocation(jdLower, metadata, profileData);
  // Block E: Compensation
  const blockE = evaluateCompensation(jdLower, profileData);
  // Block F: Culture
  const blockF = evaluateCulture(jdLower, profileMode);

  // Weighted score
  const weights = { A: 0.25, B: 0.25, C: 0.20, D: 0.10, E: 0.10, F: 0.10 };
  const overall = (
    blockA.score * weights.A +
    blockB.score * weights.B +
    blockC.score * weights.C +
    blockD.score * weights.D +
    blockE.score * weights.E +
    blockF.score * weights.F
  );

  const rounded = Math.round(overall * 10) / 10;
  const verdict = rounded >= 4.0 ? 'APPLY' : rounded >= 3.5 ? 'CONSIDER' : 'SKIP';

  return {
    blocks: { A: blockA, B: blockB, C: blockC, D: blockD, E: blockE, F: blockF },
    overall: rounded,
    verdict,
  };
}

function evaluateRoleMatch(jdLower, titleLower, profileData, profileMode) {
  let score = 1.0;
  const signals = [];

  const targetRoles = [];
  if (profileData?.candidate?.target_roles) {
    const roles = profileData.candidate.target_roles;
    if (Array.isArray(roles)) targetRoles.push(...roles);
    else if (typeof roles === 'object') {
      if (Array.isArray(roles.primary)) targetRoles.push(...roles.primary);
      if (Array.isArray(roles.secondary)) targetRoles.push(...roles.secondary);
    }
  }

  for (const role of targetRoles) {
    if (titleLower.includes(role.toLowerCase()) || jdLower.includes(role.toLowerCase())) {
      score = 5.0;
      signals.push(`Direct match: "${role}"`);
      break;
    }
  }

  if (profileMode) {
    const archetypeSection = profileMode.match(/## Archetypes[\s\S]*?(?=##|\Z)/);
    if (archetypeSection && archetypeSection[0]) {
      const keywords = archetypeSection[0].match(/—\s*(.+?)(?:\n|$)/g);
      if (keywords) {
        let matchCount = 0;
        keywords.forEach(k => {
          const terms = k.replace(/—\s*/, '').split(/[,,]/).map(t => t.trim().toLowerCase());
          terms.forEach(t => { if (jdLower.includes(t)) matchCount++; });
        });
        if (matchCount >= 3) score = Math.max(score, 4.0);
        else if (matchCount >= 1) score = Math.max(score, 3.0);
      }
    }
  }

  return { score: Math.round(score * 10) / 10, signals };
}

function evaluateExperience(jdLower, profileData) {
  let score = 3.0;
  const signals = [];

  const yearMatch = jdLower.match(/(\d+)\s*[\+\-]?\s*years?\s*(?:of\s*)?(?:experience|exp)/);
  const requiredYears = yearMatch ? parseInt(yearMatch[1]) : null;
  const candidateYears = profileData?.candidate?.years_of_experience ? parseInt(profileData.candidate.years_of_experience) : null;

  if (requiredYears && candidateYears) {
    if (candidateYears >= requiredYears * 1.5) { score = 5.0; signals.push(`Over-qualified: ${candidateYears}y vs ${requiredYears}y`); }
    else if (candidateYears >= requiredYears) { score = 4.5; signals.push(`Meets requirement: ${candidateYears}y vs ${requiredYears}y`); }
    else if (candidateYears >= requiredYears * 0.7) { score = 3.0; signals.push(`Slightly below: ${candidateYears}y vs ${requiredYears}y`); }
    else { score = 2.0; signals.push(`Below requirement: ${candidateYears}y vs ${requiredYears}y`); }
  }

  return { score: Math.round(score * 10) / 10, signals };
}

function evaluateSkills(jdLower, cvLower, profileData) {
  // Expanded skills database covering all PMET sectors
  const commonSkills = [
    // General professional skills
    'project management', 'stakeholder management', 'budget management',
    'team leadership', 'strategic planning', 'data analysis',
    'process improvement', 'change management', 'risk management',
    'vendor management', 'contract negotiation', 'supply chain',
    'procurement', 'sourcing', 'category management',
    'power bi', 'tableau', 'excel', 'sql',
    'agile', 'scrum', 'lean', 'six sigma',
    // Technology
    'python', 'java', 'javascript', 'typescript', 'react', 'node.js',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd',
    'machine learning', 'deep learning', 'natural language processing',
    'data engineering', 'data pipeline', 'etl', 'data warehouse',
    // Finance
    'financial modeling', 'fp&a', 'budgeting', 'forecasting',
    'risk assessment', 'compliance', 'regulatory', 'audit',
    'ifrs', 'gaap', 'tax planning', 'treasury management',
    // Life Sciences
    'gmp', 'cGMP', 'quality assurance', 'quality control',
    'regulatory affairs', 'clinical trials', 'validation',
    'pharmaceutical', 'biotechnology', 'bioprocess',
    // Green Economy
    'esg', 'sustainability', 'carbon footprint', 'renewable energy',
    'energy efficiency', 'climate risk', 'circular economy',
    // Manufacturing
    'process engineering', 'automation', 'robotics', 'mes',
    'lean manufacturing', 'six sigma', 'quality engineering',
    // Digital Marketing
    'digital marketing', 'seo', 'sem', 'google analytics',
    'social media', 'content marketing', 'e-commerce', 'growth hacking',
    // L&D / OD (retained)
    'training', 'learning and development', 'organizational development',
    'talent development', 'capability building',
  ];

  let matchCount = 0, totalRelevant = 0;
  const signals = [];
  const missing = [];

  for (const skill of commonSkills) {
    if (jdLower.includes(skill)) {
      totalRelevant++;
      if (cvLower.includes(skill)) { matchCount++; signals.push(`✓ ${skill}`); }
      else missing.push(skill);
    }
  }

  let score = 3.0;
  if (totalRelevant > 0) {
    const ratio = matchCount / totalRelevant;
    score = ratio >= 0.8 ? 5.0 : ratio >= 0.6 ? 4.0 : ratio >= 0.4 ? 3.0 : ratio >= 0.2 ? 2.0 : 1.5;
  }

  return { score: Math.round(score * 10) / 10, signals: signals.slice(0, 10), missing: missing.slice(0, 5) };
}

function evaluateLocation(jdLower, metadata, profileData) {
  let score = 3.0;
  const signals = [];
  const candidateLocation = (profileData?.candidate?.location || '').toLowerCase();

  const sgLocations = ['singapore', 'sg', 'central region', 'east region', 'west region', 'north region', 'marina bay', 'orchard', 'jurong', 'woodlands'];
  const isSgJob = sgLocations.some(loc => jdLower.includes(loc));
  const isSgCandidate = candidateLocation.includes('singapore') || candidateLocation.includes('sg');

  if (isSgJob && isSgCandidate) { score = 5.0; signals.push('Perfect: Singapore job, Singapore candidate'); }
  else if (isSgJob) { score = 4.0; signals.push('Singapore job — verify relocation'); }
  else if (jdLower.includes('remote') || jdLower.includes('hybrid')) { score = 4.5; signals.push('Remote/hybrid available'); }
  else { signals.push('Location not specified'); }

  return { score: Math.round(score * 10) / 10, signals };
}

function evaluateCompensation(jdLower, profileData) {
  let score = 3.0;
  const signals = [];

  const salaryMatch = jdLower.match(/sgd\s*\(?(\d[\d,]*)\s*[-–]\s*(\d[\d,)]*)/);
  const jdMin = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, '')) : null;
  const jdMax = salaryMatch ? parseInt(salaryMatch[2].replace(/,/g, '')) : null;

  const targetRange = profileData?.candidate?.compensation?.target_range || '';
  const candidateMinMatch = targetRange.match(/(\d[\d,]*)/);
  const candidateMin = candidateMinMatch ? parseInt(candidateMinMatch[1].replace(/,/g, '')) : null;

  // Try to get market benchmark for the target role
  const targetRoles = [];
  if (profileData?.candidate?.target_roles) {
    const roles = profileData.candidate.target_roles;
    if (Array.isArray(roles)) targetRoles.push(...roles);
    else if (typeof roles === 'object') {
      if (Array.isArray(roles.primary)) targetRoles.push(...roles.primary);
      if (Array.isArray(roles.secondary)) targetRoles.push(...roles.secondary);
    }
  }

  const years = profileData?.candidate?.years_of_experience ? parseInt(profileData.candidate.years_of_experience) : 5;
  const benchmark = targetRoles.length > 0 ? getSalaryRangeForRole(targetRoles[0], years) : null;

  // Score based on JD salary vs candidate expectation
  if (jdMin && candidateMin) {
    if (jdMin >= candidateMin * 1.2) { score = 5.0; signals.push(`Above target: SGD ${jdMin.toLocaleString()}`); }
    else if (jdMin >= candidateMin) { score = 4.5; signals.push(`Meets target: SGD ${jdMin.toLocaleString()}`); }
    else if (jdMin >= candidateMin * 0.8) { score = 3.0; signals.push(`Below target: SGD ${jdMin.toLocaleString()}`); }
    else { score = 2.0; signals.push(`Significantly below: SGD ${jdMin.toLocaleString()}`); }
  } else if (jdMin) {
    signals.push(`JD states: SGD ${jdMin.toLocaleString()}`);
    score = 3.5;

    // Compare with market benchmark
    if (benchmark) {
      if (jdMin >= benchmark.min * 0.9) {
        signals.push(`Market benchmark: SGD ${benchmark.range} (${benchmark.level})`);
        score = Math.max(score, 4.0);
      } else if (jdMin < benchmark.min * 0.7) {
        signals.push(`Below market benchmark: SGD ${benchmark.range} (${benchmark.level})`);
        score = Math.min(score, 2.5);
      }
    }
  } else {
    signals.push('No salary info in JD');
    score = 2.5;

    // Provide market benchmark as guidance
    if (benchmark) {
      signals.push(`Market benchmark for your role: SGD ${benchmark.range} (${benchmark.level})`);
      signals.push('💡 Negotiate based on this benchmark during interviews');
    }
  }

  return { score: Math.round(score * 10) / 10, signals };
}

function evaluateCulture(jdLower, profileMode) {
  let score = 3.0;
  const signals = [];

  const positiveGroups = [
    ['growth', 'development', 'learning', 'training'],
    ['innovation', 'creative', 'forward-thinking'],
    ['collaboration', 'teamwork', 'inclusive'],
    ['flexible', 'work-life', 'remote', 'hybrid'],
  ];

  let positiveCount = 0;
  for (const group of positiveGroups) {
    const matches = group.filter(k => jdLower.includes(k));
    if (matches.length > 0) { positiveCount += matches.length; signals.push(`Positive: ${matches.join(', ')}`); }
  }

  if (positiveCount >= 4) score = 5.0;
  else if (positiveCount >= 2) score = 4.0;
  else if (positiveCount >= 1) score = 3.5;

  if (profileMode) {
    const fitSection = profileMode.match(/## Strong-fit signals[\s\S]*?(?=##|\Z)/);
    if (fitSection && fitSection[0]) {
      const lines = fitSection[0].split('\n').filter(l => l.trim().startsWith('- '));
      let fitCount = 0;
      for (const line of lines) {
        if (jdLower.includes(line.replace(/^- /, '').toLowerCase())) fitCount++;
      }
      if (fitCount >= 3) score = Math.min(score + 1.0, 5.0);
    }
  }

  return { score: Math.round(score * 10) / 10, signals: signals.slice(0, 8) };
}

// ─── Report Content Generator ───

function generateReportContent(evaluation, jdText, metadata, profile) {
  const { blocks, overall, verdict } = evaluation;
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const profileData = parseYamlMinimal(profile);
  const candidateName = profileData?.candidate?.full_name || 'Candidate';

  const verdictEmoji = verdict === 'APPLY' ? '✅' : verdict === 'CONSIDER' ? '⚠️' : '❌';
  const scoreBar = '█'.repeat(Math.round(overall)) + '░'.repeat(5 - Math.round(overall));

  const grade = (s) => s >= 4.5 ? 'A' : s >= 4.0 ? 'B+' : s >= 3.5 ? 'B' : s >= 3.0 ? 'C' : s >= 2.0 ? 'D' : 'F';

  return `# Report — ${metadata.company || 'Company'} — ${metadata.title || 'Role'}

**Date:** ${timestamp}
**Candidate:** ${candidateName}
**Score:** ${overall}/5
**URL:** ${metadata.url || 'N/A'}

## Verdict: ${verdictEmoji} ${verdict}

**Overall: ${overall}/5** ${scoreBar}

${verdict === 'APPLY' ? 'Strong match. Recommended to proceed with application.' :
  verdict === 'CONSIDER' ? 'Has potential but has gaps. Review block scores before deciding.' :
  'Does not meet minimum criteria. Consider skipping.'}

---

## 6-Block Evaluation

### Block A — Role Match: ${blocks.A.score}/5
${blocks.A.signals.map(s => `• ${s}`).join('\n')}

### Block B — Experience Match: ${blocks.B.score}/5
${blocks.B.signals.map(s => `• ${s}`).join('\n')}

### Block C — Skills Match: ${blocks.C.score}/5
${blocks.C.signals.map(s => `• ${s}`).join('\n')}
${blocks.C.missing?.length ? '\nMissing: ' + blocks.C.missing.join(', ') : ''}

### Block D — Location & Logistics: ${blocks.D.score}/5
${blocks.D.signals.map(s => `• ${s}`).join('\n')}

### Block E — Compensation: ${blocks.E.score}/5
${blocks.E.signals.map(s => `• ${s}`).join('\n')}

### Block F — Culture & Mission Fit: ${blocks.F.score}/5
${blocks.F.signals.map(s => `• ${s}`).join('\n')}

---

## Score Summary

| Block | Score | Grade |
|-------|-------|-------|
| A: Role Match | ${blocks.A.score} | ${grade(blocks.A.score)} |
| B: Experience | ${blocks.B.score} | ${grade(blocks.B.score)} |
| C: Skills | ${blocks.C.score} | ${grade(blocks.C.score)} |
| D: Location | ${blocks.D.score} | ${grade(blocks.D.score)} |
| E: Compensation | ${blocks.E.score} | ${grade(blocks.E.score)} |
| F: Culture | ${blocks.F.score} | ${grade(blocks.F.score)} |
| **Overall** | **${overall}** | **${grade(overall)}** |

---

## Risk Summary

- **${overall >= 4.0 ? 'Low' : overall >= 3.0 ? 'Medium' : 'High'} risk:** ${overall >= 4.0 ? 'Strong match across most dimensions' : overall >= 3.0 ? 'Some gaps to address' : 'Significant mismatches'}

---

## Machine Summary

\`\`\`yaml
score: ${overall}
verdict: ${verdict}
reason: "${overall >= 4.0 ? 'Strong match' : overall >= 3.0 ? 'Partial match' : 'Below threshold'}"
blocks:
  A_role_match: ${blocks.A.score}
  B_experience: ${blocks.B.score}
  C_skills: ${blocks.C.score}
  D_location: ${blocks.D.score}
  E_compensation: ${blocks.E.score}
  F_culture: ${blocks.F.score}
\`\`\`

---

## Job Description (archived verbatim)

${jdText}

---

*Generated by SG Job Hunter — Evaluation Orchestrator*
`;
}

// ─── Main Entry Point ───

async function main() {
  console.log('SG Job Hunter — Evaluation Orchestrator');
  console.log('='.repeat(40));

  // Handle --patch mode
  if (flags.patch) {
    await manageOverrides(flags.patch, flags.patchFile);
    return;
  }

  if (!flags.url && !flags.jd && !flags.stdin && !flags.pipeline) {
    console.error('\n❌ No input provided.');
    console.error('   Use --url <job-url>, --jd <file>, --stdin, or --pipeline');
    console.error('   Run: node lib/evaluate.mjs --help');
    process.exit(1);
  }

  if (flags.pipeline) {
    await processPipeline();
    return;
  }

  await evaluateSingleJob(flags);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
