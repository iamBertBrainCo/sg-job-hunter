# SG Job Hunter

> A Singapore-first job search assistant for PMETs. You chat with an AI agent in [opencode](https://opencode.ai); it finds jobs in Singapore and ASEAN, writes an ATS-friendly resume for each job you pick, and keeps your applications in one pipeline with an Apply link for each.

**Created by:** [Bertram Yang](https://linkedin.com/in/bertramyang) · **License:** MIT

---

## How it works

```
You:  I want to find HR business partner jobs
AI:   Sure. Please drop your resume into the inbox folder and tell me anything
      that is not on it (your career log).
You:  Done. I also led a warehouse merger in 2023…
AI:   Thanks. Found 100 HR business partner jobs in Singapore. Top 25:
      | # | Role | Company | Salary | Match | …
You:  Let's do 3 and 13.
AI:   Saved. Here is a resume tailored to Lam Research (ATS check 92/100).
      Before it's final, please confirm 2 lines I reworded…
You:  Looks good.
AI:   Your pipeline is open in the browser. Click Apply on each job and upload
      the PDF. Tell me when you've applied.
```

1. **Your details**: your resume (PDF, Word or text) plus a *career log* of anything not on it.
2. **Find jobs**: MyCareersFuture, JobStreet and JobsDB, Kalibrr, Tech in Asia, and employer career pages (Agoda, Airwallex, Ninja Van, foodpanda and more), all searched in seconds. Results come with salary ranges where the employer gives them.
3. **Tailored resumes**: for each job you pick, the AI rewrites your resume using only your real facts. Every resume gets an **ATS check** (keywords, action verbs, numbers, layout) and a **fact check** that flags anything not in your own material.
4. **Your design**: see your own resume in all 8 designs side by side and pick one.
5. **Pipeline**: one page with every saved job, its status, your resume PDF and an **Apply** button. You apply yourself; the AI never submits anything.
6. **Interview prep**: a story bank of your STAR stories, a prep sheet per job (likely questions, which story to use, expected salary with a market benchmark, notice period, questions to ask), and practice rounds with feedback.

## Quick start

You need [Node.js 22 or newer](https://nodejs.org), [Git](https://git-scm.com) and [opencode](https://opencode.ai).

```bash
git clone https://github.com/iamBertBrainCo/sg-job-hunter.git
cd sg-job-hunter
opencode
```

The model provider is set in `opencode.json`. Add your API key in opencode with `/connect`: choose **Other**, enter the provider id `sealion`, and paste your key. (Any other model also works; pick it with `/models`.)

Then type what you are looking for, for example **"I want to find data analyst jobs"**. The agent follows [AGENTS.md](AGENTS.md), installs anything missing (`npm run check`), and walks you through the rest.

## Commands (what the agent runs for you)

| Command | What it does |
|---|---|
| `npm run check` | Checks Node.js, installs packages and the Chromium used for PDFs, shows the next step |
| `npm run import-resume -- [file]` | Reads a PDF/Word/text resume (default: the newest file in `inbox/`) |
| `npm run resume -- check` | Checks `cv.md`, your master resume |
| `npm run find-jobs -- "<role>" [--where asean\|MY\|ID\|PH\|TH\|VN]` | Searches all sources; Singapore by default |
| `npm run save-job -- <number> [more]` | Saves jobs from the list, with full description and ATS keywords |
| `npm run resume -- <number> [--template ats]` | Makes the tailored PDF, with ATS check and fact check |
| `npm run resume -- preview` / `use <number>` | Shows your resume in all 8 designs; saves your choice |
| `npm run pipeline` | Shows saved jobs and opens the pipeline page |
| `npm run status -- <number> applied` | Updates a job: `applied`, `interview`, `offer`, `rejected`, `skipped` |
| `npm run interview -- stories` / `<number>` | Checks your story bank; makes the interview prep sheet for a job |
| `npm run salary-benchmarks -- --role "<role>"` | Singapore salary ranges for a role or sector |
| `npm run clear-my-data [-- --yes]` | Lists, then deletes, all your personal files |
| `npm test` | Offline tests |

## Privacy

Your files stay on your computer. But **the AI has to read your resume to help you**, and anything it reads or you type in the chat is sent to the AI provider you connect in opencode. With the default set-up that is AI Singapore's SEA-LION service, whose terms allow it to use what you send to improve its service. Before you share your resume, the agent shows a short notice and asks you to agree. When you import a resume file, NRIC/FIN numbers, dates of birth, home addresses and referees' details are removed before the AI sees it. Read [PRIVACY.md](PRIVACY.md) for what to leave out, other options (such as running a model on your own computer) and how to delete everything.

## Your files

Everything stays on your computer. Your resume, career log, job lists and PDFs are listed in `.gitignore`, so git never uploads them.

| Where | What |
|---|---|
| `inbox/` | Drop your resume and career log here |
| `cv.md` | Your master resume (format: [examples/cv-format.md](examples/cv-format.md)) |
| `career-log.md` | Extra history: achievements, projects, courses |
| `story-bank.md` | Your STAR interview stories |
| `data/jobs.md` | The latest search results, with links |
| `output/applications/NN-company-role/` | `job.md`, your tailored `resume.md`, the PDF and `interview-prep.md` |
| `output/pipeline.html` | Your pipeline page |
| `sources.yml` | The job boards and career pages that are searched (copied from `sources.example.yml`) |

To add an employer, add a line under `career_pages` in `sources.yml`. Career pages hosted on Greenhouse, Lever, Ashby or SmartRecruiters work.

## Resume templates

Eight designs: `ats` (default), `standard`, `compact`, `executive`, `zh-minimal`, `modern`, `jake`, `leadership`. The first five are ATS-safe. `modern`, `jake` and `leadership` look good printed but can confuse applicant tracking systems, so use them for emailed applications only. The ATS rules behind the checks are in [ats-rules.yml](ats-rules.yml).

Singapore norms are built in: no photo, NRIC, age, race, religion or marital status (in line with the Tripartite Guidelines on Fair Employment Practices), British spelling, and SGD.

## Industries covered

All PMET sectors. Salary benchmarks for reference are in [data/salary-benchmarks-2026.md](data/salary-benchmarks-2026.md):

| Sector | Key roles | Mid-level salary (SGD/month) |
|--------|-----------|------------------------------|
| Software Engineering | Software Engineer, Full Stack, DevOps | $7,000 – $12,000 |
| Data & AI | Data Scientist, ML Engineer, AI Engineer | $8,000 – $15,000 |
| Finance & Banking | Financial Analyst, Risk Manager, Compliance | $6,500 – $14,000 |
| Life Sciences | Regulatory Affairs, QA Manager, Biotechnologist | $6,500 – $14,000 |
| Manufacturing | Process Engineer, Automation Engineer | $5,600 – $8,200 |
| Green Economy | Sustainability Manager, ESG Consultant | $6,500 – $12,000 |
| Care Economy | Social Worker, Psychologist, Care Manager | $5,000 – $9,000 |
| Digital Marketing | Digital Marketing Manager, SEO, E-commerce | $5,000 – $12,000 |
| Consulting | Management Consultant, Strategy Consultant | $7,000 – $13,000 |
| Supply Chain | Supply Chain Manager, Logistics, Procurement | $5,000 – $12,000 |
| L&D / OD | L&D Manager, OD Manager, Training Manager | $6,000 – $8,000 |
| Government | Policy Analyst, Programme Manager | $6,000 – $13,000 |

## Salary benchmarks

`npm run salary-benchmarks -- --role "HR business partner"` (or `--sector finance --level mid`) shows 2026 monthly base-salary ranges for Singapore. Ask the AI things like "what does a mid-level data analyst earn?".

## For developers

The guided commands live in `lib/flow/`; job-board connectors are in `lib/providers/`. The earlier command-line tools from v2.0 (scanner, 6-block evaluator, tracker scripts) are still in `lib/` but are not part of the supported flow. For example, `node lib/scan.mjs` with a `portals.yml` copied from `portals.example.yml`.

## Contributing

Contributions welcome: Singapore and ASEAN employers for `sources.example.yml`, better market rules in [modes/sg/_shared.md](modes/sg/_shared.md), salary data, translations, and bug reports.

## Credits

**Project creator:** [Bertram Yang](https://linkedin.com/in/bertramyang)

**Based on:** [career-ops](https://github.com/career-ops-hq/career-ops) by Santiago Fernández de Valderrama (MIT License). SG Job Hunter is an independent project and is not affiliated with or endorsed by career-ops.

**Salary data sources:** Hays Asia, Robert Walters, Michael Page, Robert Half, Skillta.tech, Fuku AI, JTE Recruit, Mavenside, Nodeflair/Vulcanpost, Skillup.sg, Glassdoor SG, Vertical Institute, MOM COMPASS, Reeracoen, Corestaff, Morgan McKinley, Atomic Group, NCSS/MOH.

Job data comes from public job-board and career-page feeds. Always check the original posting before you apply.
