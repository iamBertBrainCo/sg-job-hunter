# Agent-first design

SG Job Hunter is built to be driven by an AI agent in [opencode](https://opencode.ai). The user talks; the agent runs a small set of commands. The agent's instructions are in [AGENTS.md](AGENTS.md), which opencode loads automatically.

## Principles

1. **Few, complete commands.** Each step is one `npm run` command that does the whole job and prints everything the agent needs, ending with a `NEXT STEP:` line. Smaller models follow that reliably, and it keeps the number of model requests low, which matters with rate-limited APIs.
2. **Plain files, not hidden state.** Resumes are Markdown (`cv.md`, `resume.md`), job lists are `data/jobs.md`, and the pipeline is `data/pipeline.json` plus a page at `output/pipeline.html`. The user can open and edit any of them.
3. **The model writes words; the code checks them.** The agent writes the resume text. The code renders the PDF, scores it against ATS rules, and fact-checks it against the user's own material, so invented claims are caught even when the model ignores its instructions.
4. **Human in the loop.** The agent never submits applications, sends messages or signs in anywhere. The user applies from the pipeline page.
5. **Same on every computer.** Every command works the same on Windows, macOS and Linux. The only setup command is `npm run check`.

## The flow

| User says | Agent runs | Result |
|---|---|---|
| "I want to find HR jobs" | `npm run check` | Installs what is missing and asks for the resume and career log |
| (shares resume) | `npm run import-resume`, writes `cv.md`, `npm run resume -- check` | Master resume |
| (confirms details) | `npm run find-jobs -- "HR business partner"` | Numbered job table with salaries |
| "Let's do 3" | `npm run save-job -- 3` | `output/applications/01-…/job.md` |
| (continues) | writes `resume.md`, `npm run resume -- 1` | PDF, ATS check, fact check |
| "Show my pipeline" | `npm run pipeline` | Pipeline page with Apply buttons |
| "I applied to 1" | `npm run status -- 1 applied` | Updated pipeline |

## Code map

| File | Role |
|---|---|
| `lib/flow/check.mjs` | First-run check and installs |
| `lib/flow/import-resume.mjs` | PDF / Word / text resume reading |
| `lib/flow/find-jobs.mjs` | Searches the sources in `sources.yml`, filters by country, ranks against the role and `cv.md` |
| `lib/flow/save-job.mjs` | Full job description and ATS keywords per saved job |
| `lib/flow/keywords.mjs` | Cross-industry and Singapore keyword vocabulary |
| `lib/flow/resume-lib.mjs` | Resume Markdown parser, template renderer, PDF, ATS check, fact check |
| `lib/flow/pipeline.mjs`, `status.mjs` | Pipeline page and status updates |
| `lib/providers/` | Job-board and career-page connectors (shared with the advanced scanner) |
| `cv-template.*.html`, `ats/`, `sections/` | Resume designs and their section layouts |
