#!/usr/bin/env node
// npm run interview -- stories          help write / check story-bank.md
// npm run interview -- <app number>     interview prep sheet for a saved job
//
// The story bank is 5–8 STAR stories (Situation, Task, Action, Result) built
// only from the user's own resume and career log. The prep sheet maps likely
// questions for one job to those stories, adds Singapore-specific questions
// (expected salary, notice period, work pass) and questions to ask.

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';
import {
  ROOT, PATHS, parseArgs, loadPipeline, savePipeline, findApplication, applicationDir,
} from './common.mjs';
import { factCheck } from './resume-lib.mjs';
import { jobKeywords } from './keywords.mjs';
import { parseStories } from './stories.mjs';

const { args } = parseArgs();
const what = String(args[0] || 'stories').toLowerCase();
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf-8') : '');

const STORY_FORMAT = `# Story bank

## <Short title, e.g. Cut attrition from 18% to 11%>
- Situation: <where you were and what was going on, one sentence>
- Task: <what you were responsible for>
- Action: <what YOU did, step by step, in one or two sentences>
- Result: <what changed, with the real number if there is one>
- Good for: <question themes, e.g. leadership, influencing, using data, change>`;

// ── Story bank ─────────────────────────────────────────────────────────────

function sourcesText() {
  return [PATHS.cv, PATHS.careerLog, PATHS.resumeOriginal].map(read).join('\n');
}

function checkStories(stories) {
  const problems = [];
  const facts = [];
  const sources = sourcesText();
  for (const s of stories) {
    const missing = ['situation', 'task', 'action', 'result'].filter((k) => !s[k]);
    if (missing.length) problems.push(`"${s.title}" is missing: ${missing.join(', ')}`);
    // Reuse the resume fact check. Action and Result lines are checked like
    // resume bullets; Situation and Task are naturally paraphrased, so only a
    // new number there is flagged.
    const asDoc = (lines) => ({ experience: [{ role: s.title, company: '', bullets: lines.filter(Boolean) }], competencies: [], education: [], certifications: [], summary: '' });
    for (const f of factCheck(asDoc([s.action, s.result]), sources)) facts.push({ story: s.title, text: f.text, reason: f.reason });
    for (const f of factCheck(asDoc([s.situation, s.task]), sources)) if (/^number/.test(f.reason)) facts.push({ story: s.title, text: f.text, reason: f.reason });
  }
  return { problems, facts };
}

if (what === 'stories') {
  if (!existsSync(PATHS.cv)) {
    console.log('There is no cv.md yet. Build the master resume first (AGENTS.md step 2).');
    process.exit(1);
  }
  if (!existsSync(PATHS.storyBank)) {
    const achievements = [read(PATHS.cv), read(PATHS.careerLog)].join('\n').split('\n')
      .map((l) => l.trim()).filter((l) => /^[-*]\s+/.test(l) && /\d/.test(l)).map((l) => l.replace(/^[-*]\s+/, ''));
    console.log(`No story bank yet. The strongest raw material in the user's resume and career log:\n${achievements.slice(0, 12).map((a) => `- ${a}`).join('\n') || '- (no bullets with numbers found — ask the user for 3–5 proud moments)'}`);
    console.log(`\nNEXT STEP: pick 5–8 of these (different themes: leading, problem solving, conflict, change, results, failure/learning). For each, ask the user ONE short question to fill a gap you do not know (what was the situation? what exactly did you do?). Then write ${PATHS.storyBank} in this format, using only facts from cv.md, career-log.md and the user's answers:

${STORY_FORMAT}

Then run: npm run interview -- stories`);
    process.exit(0);
  }
  const stories = parseStories(read(PATHS.storyBank));
  const { problems, facts } = checkStories(stories);
  console.log(`Story bank: ${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}: ${stories.map((s) => s.title).join('; ')}`);
  if (stories.length < 5) problems.push(`Only ${stories.length} stories; aim for 5–8 covering different themes.`);
  if (problems.length) console.log(`\nFORMAT PROBLEMS:\n${problems.map((p) => `- ${p}`).join('\n')}`);
  if (facts.length) {
    console.log(`\nFACT CHECK: ${facts.length} line(s) are not in the user's resume, career log or answers saved in career-log.md:`);
    for (const f of facts.slice(0, 12)) console.log(`⚠ [${f.story}] "${f.text.slice(0, 140)}" — ${f.reason}`);
    console.log(`\nNEXT STEP: ask the user about each ⚠ line. Add what they confirm to ${PATHS.careerLog} in their words; remove the rest from ${PATHS.storyBank}. Then run npm run interview -- stories again.`);
  } else if (!problems.length) {
    console.log('\nFACT CHECK: every story matches the user\'s own material.\nNEXT STEP: tell the user their story bank is ready. For a saved job, run npm run interview -- <job number> to prepare for that interview.');
  }
  process.exit(0);
}

// ── Prep sheet for one saved job ───────────────────────────────────────────

const pipeline = loadPipeline();
const app = findApplication(pipeline, what);
if (!app) {
  console.log(`No saved job "${args[0]}". Saved jobs: ${pipeline.applications.map((a) => `${a.num} (${a.company})`).join(', ') || 'none yet'}.`);
  process.exit(1);
}
if (!existsSync(PATHS.storyBank)) {
  console.log('No story bank yet. NEXT STEP: run npm run interview -- stories first, then run this again.');
  process.exit(1);
}

const dir = applicationDir(app);
const jobMd = read(join(dir, 'job.md'));
const description = jobMd.split('## Job description')[1] || jobMd;
const kwLine = (jobMd.match(/^- ATS keywords:\s*(.*)$/m) || [])[1];
const keywords = kwLine ? kwLine.split(/\s*,\s*/).filter(Boolean) : jobKeywords(description);
const stories = parseStories(read(PATHS.storyBank));

// Competency questions, chosen by what the job asks for.
const THEMES = [
  { re: /stakeholder|partner|relationship|influenc|collaborat/i, q: 'Tell me about a time you had to influence a senior stakeholder who disagreed with you.' },
  { re: /lead|manage(r|ment)? (a )?team|people management|supervis|mentor|coach/i, q: 'Describe a time you led a team through a difficult period.' },
  { re: /change|transformation|restructur|merger|implement/i, q: 'Tell me about a change you drove. How did you bring people along?' },
  { re: /data|analy|report|dashboard|kpi|metric/i, q: 'Give an example of how you used data to make or change a decision.' },
  { re: /problem|improv|process|efficien|lean|six sigma/i, q: 'Walk me through a problem you solved and how you approached it.' },
  { re: /customer|client|service|patient/i, q: 'Tell me about a time you handled an unhappy customer or client.' },
  { re: /deadline|pressure|fast[- ]paced|prioriti|multitask/i, q: 'Tell me about a time you had several urgent deadlines at once.' },
  { re: /conflict|employee relations|disciplin|grievance|negotiat/i, q: 'Describe a conflict you resolved. What did you do, and what happened?' },
  { re: /budget|cost|commercial|revenue|p&l|sales|business development/i, q: 'Give an example of how you improved results or saved cost.' },
  { re: /compliance|regulat|policy|risk|audit|governance/i, q: 'Tell me about a time you had to enforce a policy or rule that people pushed back on.' },
];
const text = `${app.title}\n${description}`;
const competency = THEMES.filter((t) => t.re.test(text)).map((t) => t.q).slice(0, 6);
if (competency.length < 4) competency.push('Tell me about the achievement you are most proud of.', 'Tell me about a mistake you made and what you learned.');

// Requirement lines become "walk me through" questions.
const reqs = description.split('\n').map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
  .filter((l) => /(experience|knowledge|familiar|proficien|ability) (in|with|of)/i.test(l) && l.length < 160)
  .filter((l) => !/^(minimum|at least|\d+\+? years)|degree|diploma/i.test(l))
  .slice(0, 4)
  .map((l) => `The role asks for: "${l.replace(/\.$/, '')}". Walk me through your experience with this.`);

const words = (s) => new Set(String(s).toLowerCase().match(/[a-z]{4,}/g) || []);
function bestStory(question) {
  const q = words(question);
  let best = null;
  let score = 0;
  for (const s of stories) {
    const w = words(`${s.title} ${s.goodFor.join(' ')} ${s.situation} ${s.action} ${s.result}`);
    const n = [...q].filter((x) => w.has(x) || [...w].some((y) => y.startsWith(x.slice(0, 5)))).length;
    if (n > score) { best = s; score = n; }
  }
  return best ? best.title : '(no close match: pick the nearest story, or ask the user for a new one)';
}

// Market salary, from the benchmarks table, for the expected-salary answer.
// Try the title as posted, then without grade numbers and seniority words.
const cleanTitle = app.title.replace(/\(.*?\)|\[.*?\]|#\w+|\s[-–|/]\s.*$/g, '').trim();
const candidates = [...new Set([
  cleanTitle,
  cleanTitle.replace(/\s+(\d+|i{1,3}|iv|v)$/i, ''),
  cleanTitle.replace(/\s+(\d+|i{1,3}|iv|v)$/i, '').replace(/^(senior|sr\.?|junior|jr\.?|lead|principal|assistant|associate|head of|regional|global)\s+/i, ''),
])].filter(Boolean);
let roleForBenchmark = candidates[0];
let benchLines = [];
for (const role of candidates) {
  const bench = spawnSync(process.execPath, [join(ROOT, 'lib', 'salary-benchmarks.mjs'), '--role', role], { encoding: 'utf-8' });
  benchLines = String(bench.stdout || '').split('\n').filter((l) => /^\s+(Junior|Mid|Senior):/.test(l)).map((l) => l.trim().replace(/\s+/g, ' ')).slice(0, 3);
  if (benchLines.length) { roleForBenchmark = role; break; }
}

const questions = [
  { q: 'Tell me about yourself.', hint: 'Two minutes: current role, 2–3 strengths that match this job, why this role now.' },
  { q: `Why do you want to join ${app.company}?`, hint: 'One thing about the company, one thing about the role, one thing about your next step.' },
  { q: 'Why are you leaving your current role?', hint: 'Forward-looking and positive. Never criticise your employer.' },
  ...competency.map((q) => ({ q, story: bestStory(q) })),
  ...reqs.map((q) => ({ q, story: bestStory(q) })),
];

const sheet = `# Interview prep — ${app.title} at ${app.company}

Job: ${app.url}
Saved salary range: ${app.salary || 'not stated in the posting'}
Keywords to weave in (only where true): ${keywords.slice(0, 12).join(', ')}

## Likely questions

${questions.map((x, i) => `### ${i + 1}. ${x.q}
${x.story ? `- Story to use: ${x.story}` : `- Tip: ${x.hint}`}
- Answer outline: (to fill in)
`).join('\n')}
## Singapore-specific questions

### What is your expected salary?
- Posting: ${app.salary || 'not stated'}
- Market benchmark for "${roleForBenchmark}": ${benchLines.length ? benchLines.join(' · ') : 'no exact match; run npm run salary-benchmarks -- --role "<similar role>"'}
- Tip: give a range, say it is negotiable, and mention you are looking at the whole package (bonus, AWS, CPF, leave).

### What is your notice period?
- Tip: say it plainly (for example "one month") and whether you can negotiate an earlier release.

### Do you need a work pass?
- Tip: Singapore Citizens and PRs can say no. If you need an EP or S Pass, say so early and confidently.

## Questions to ask them

1. What would success look like in the first 90 days?
2. What is the biggest challenge the team is facing right now?
3. How is performance reviewed, and how often?
4. Who would I work with most closely?
5. What are the next steps in the process?
`;

const prepPath = join(dir, 'interview-prep.md');
writeFileSync(prepPath, sheet, 'utf-8');
app.interviewPrep = rel(prepPath);
app.updatedAt = new Date().toISOString();
savePipeline(pipeline);

console.log(`Interview prep saved: ${prepPath}`);
console.log(`${questions.length} likely questions, ${stories.length} stories available.`);
console.log(questions.map((x, i) => `${i + 1}. ${x.q}${x.story ? `  → ${x.story}` : ''}`).join('\n'));
if (benchLines.length) console.log(`Salary benchmark (${roleForBenchmark}): ${benchLines.join(' · ')}`);
console.log(`\nNEXT STEP: fill each "Answer outline" in ${prepPath} with 2–3 short bullet points from the named story (facts only, no new claims). Then offer the user a practice round: ask one question at a time, wait for their answer, give short feedback (structure, a number, length under 2 minutes), then the next question.`);
