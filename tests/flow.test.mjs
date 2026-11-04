// npm test — offline checks for the guided flow and the CV templates.
// No network, no API key. Run with: node --test tests/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, slugify, findApplication, htmlToText, parseArgs } from '../lib/flow/common.mjs';
import { parseResumeMarkdown, renderResumeHtml, atsCheck, factCheck, availableTemplates } from '../lib/flow/resume-lib.mjs';
import { jobKeywords } from '../lib/flow/keywords.mjs';
import { parseStories } from '../lib/flow/stories.mjs';
import { listTemplates, parseMeta } from '../lib/cv-templates.mjs';

const sample = readFileSync(join(ROOT, 'examples', 'cv-format.md'), 'utf-8');

test('every CV template has a well-formed manifest and nothing renders before <html>', () => {
  const names = listTemplates('cv').map((t) => t.name);
  assert.ok(names.includes('ats'), 'ats template is discoverable');
  for (const t of listTemplates('cv')) {
    const head = readFileSync(t.path, 'utf-8').split('<html')[0];
    assert.equal(head.replace(/<!DOCTYPE html>/i, '').replace(/<!--[\s\S]*?-->/g, '').trim(), '', `${t.name}: stray text before <html>`);
    if (t.name !== 'standard') {
      const meta = parseMeta(t.path);
      assert.ok(meta.name && meta.version, `${t.name}: manifest has name and version`);
    }
  }
});

test('resume Markdown parses into the expected structure', () => {
  const { doc, warnings } = parseResumeMarkdown(sample);
  assert.deepEqual(warnings, []);
  assert.equal(doc.name, 'Tan Mei Ling');
  assert.equal(doc.title, 'Senior HR Business Partner');
  assert.equal(doc.email, 'meiling.tan@example.com');
  assert.equal(doc.phone, '+65 9123 4567');
  assert.equal(doc.experience.length, 2);
  assert.deepEqual(
    { role: doc.experience[0].role, company: doc.experience[0].company, location: doc.experience[0].location, period: doc.experience[0].period },
    { role: 'Senior HR Business Partner', company: 'Example Logistics Pte Ltd', location: 'Singapore', period: 'Mar 2021 – Present' },
  );
  assert.equal(doc.certifications[0].year, '2022');
  assert.equal(doc.skills[0].category, 'HR systems');
  assert.ok(!doc.skills.some((g) => g.items.join(' ').includes('Category')), 'HTML comments are ignored');
});

test('missing pieces produce plain-English warnings', () => {
  const { warnings } = parseResumeMarkdown('# Someone\n\n## Experience\n### Analyst\n');
  assert.ok(warnings.some((w) => /email/.test(w)));
  assert.ok(warnings.some((w) => /no company/.test(w)));
  assert.ok(warnings.some((w) => /no dates/.test(w)));
});

test('every template renders with no leftover placeholders or empty sections', () => {
  const { doc } = parseResumeMarkdown(sample);
  for (const t of availableTemplates()) {
    const html = renderResumeHtml(doc, t.name);
    assert.deepEqual(html.match(/\{\{[A-Z_]+\}\}/g) || [], [], `${t.name}: placeholders left`);
    assert.ok(html.includes('Cut regretted attrition'), `${t.name}: bullets rendered`);
    assert.ok(!/class="section-title">Projects</.test(html), `${t.name}: empty Projects section removed`);
  }
});

test('ATS check flags weak bullets, missing keywords and design templates', () => {
  const { doc } = parseResumeMarkdown(sample.replace('- Cut regretted', '- Responsible for cutting regretted'));
  const r = atsCheck(doc, ['Workforce Planning', 'Payroll', 'Workday'], 'modern');
  const by = Object.fromEntries(r.checks.map((c) => [c.label, c.passed]));
  assert.equal(by['ATS-safe template'], false);
  assert.equal(by['Bullets start with action verbs'], false);
  assert.deepEqual(r.keywordsMissing, ['Payroll']);
});

test('fact check passes honest tailoring and flags invented claims', () => {
  const honest = sample.replace('- Built a Power BI headcount dashboard adopted by 12 department heads\n', '');
  assert.deepEqual(factCheck(parseResumeMarkdown(honest).doc, sample), []);
  const padded = sample
    .replace('- Built a Power BI', '- Managed end-to-end recruitment and global mobility programmes for expatriate staff\n- Built a Power BI')
    .replace('adopted by 12 department heads', 'adopted by 40 department heads');
  const issues = factCheck(parseResumeMarkdown(padded).doc, sample);
  assert.ok(issues.some((i) => /recruitment/.test(i.text) && /new claim/.test(i.reason)));
  assert.ok(issues.some((i) => /40/.test(i.reason)));
});

test('job keywords cover non-tech PMET roles and Singapore terms', () => {
  const kws = jobKeywords('We need payroll and employee relations experience, knowledge of the Employment Act and CPF, IHRP certification preferred. Strong stakeholder management.');
  for (const k of ['payroll', 'employee relations', 'Employment Act', 'CPF', 'IHRP', 'stakeholder management']) assert.ok(kws.includes(k), k);
  assert.ok(!jobKeywords('the cat sat on a mat').includes('CA'));
});

test('helpers', () => {
  assert.equal(slugify('Lam Research (S) Pte. Ltd.'), 'lam-research-s-pte-ltd');
  const p = { applications: [{ num: 3, folder: '03-agoda-data-analyst' }] };
  assert.equal(findApplication(p, '3')?.num, 3);
  assert.equal(findApplication(p, '03-agoda-data-analyst')?.num, 3);
  assert.equal(findApplication(p, 'output/applications/03-agoda-data-analyst/')?.num, 3);
  assert.equal(findApplication(p, '9'), null);
  assert.equal(htmlToText('<p>A &amp; B</p><ul><li>one</li></ul>'), 'A & B\n- one');
  assert.deepEqual(parseArgs(['HR', 'manager', '--where', 'asean', '--limit=10']), { args: ['HR', 'manager'], opts: { where: 'asean', limit: '10' } });
});

test('fact check compares numbers with their units', () => {
  const src = 'Redeployed 140 staff. Budget of $2,000. 2 warehouses.';
  const doc = (b) => ({ experience: [{ role: 'r', company: '', bullets: [b] }], competencies: [], education: [], certifications: [], summary: '' });
  assert.ok(factCheck(doc('Saved the company $2 million'), src).some((i) => /\$2m/.test(i.reason)));
  assert.deepEqual(factCheck(doc('Redeployed 140 staff'), src), []);
  assert.deepEqual(factCheck(doc('Redeployed 140 staff <!-- note 99 -->'.replace(/<!--.*-->/, '')), src + '<!-- 55 -->'), []);
});

test('story bank parses STAR stories', () => {
  const s = parseStories('# Story bank\n\n## Cut attrition\n- Situation: A\n- Task: B\n- Action: C\n- Result: D\n- Good for: retention, data\n\n## Second\n- Action: E\n');
  assert.equal(s.length, 2);
  assert.deepEqual(s[0], { title: 'Cut attrition', situation: 'A', task: 'B', action: 'C', result: 'D', goodFor: ['retention', 'data'] });
  assert.equal(s[1].result, '');
});
