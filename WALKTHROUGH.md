# Walkthrough: your first job search with SG Job Hunter

From a fresh laptop to a tailored, ATS-checked resume and an Apply link in about 30 minutes. You talk to the AI agent in opencode; it runs the commands.

---

## Step 1: Set up (10 minutes)

1. Install [Node.js 22 or newer](https://nodejs.org), [Git](https://git-scm.com) and [opencode](https://opencode.ai).
2. Open a terminal and run:

   ```bash
   git clone https://github.com/iamBertBrainCo/sg-job-hunter.git
   ```

   ```bash
   cd sg-job-hunter
   ```

   ```bash
   opencode
   ```

3. In opencode, type `/models` and choose a model marked **Free**. No account or API key is needed. For your resume, pick one whose provider keeps no data (see [PRIVACY.md](PRIVACY.md)).

   Already pay for Claude, ChatGPT or Gemini? Instead of `opencode`, run `claude` or `codex` in the folder, or open the folder in Antigravity. The rest of this walkthrough is the same.

## Step 2: Tell the agent what you want (2 minutes)

Type, in your own words:

> I want to find supply chain manager jobs

The agent runs `npm run check`. That command installs the packages and the Chromium browser used to make PDFs, then asks for your resume.

## Step 3: Give it your resume and career log (5 minutes)

- **Resume**: drag your PDF or Word file into the `inbox` folder (or paste its path, or paste the text).
- **Career log**: anything not on your resume, such as achievements with numbers, projects, awards, courses, volunteer work, and what you want next. Rough notes are fine.

The agent turns these into `cv.md`, your master resume, and checks it with `npm run resume -- check`. Read its summary and correct anything wrong.

Then a page opens showing **your resume in all 8 designs**. Each one is marked "ATS-safe" (best for online applications) or "design only" (for emailing or printing). Tell the agent the number you like, for example **"I'll take 3"**, and every resume will use it.

## Step 4: Find jobs (2 minutes)

The agent runs `npm run find-jobs -- "supply chain manager"` and shows a numbered table:

| # | Role | Company | Location | Salary | Match |
|---|---|---|---|---|---|
| 1 | Supply Chain Manager | … | SG | SGD 7,000 – 9,500 / month | 78% |

- Say **"include Malaysia"** or **"search ASEAN"** to widen the search.
- Say **"try procurement instead"** to change the role.
- The links for every job are in `data/jobs.md`.

Pick the jobs you like: **"Let's do 1 and 4."** The agent saves each one (`npm run save-job -- 1 4`) with its full description.

## Step 5: Tailored resume (5 minutes per job)

The agent writes `resume.md` for the job and runs `npm run resume -- 1`. You get:

- **A PDF** in `output/applications/01-company-role/`.
- **An ATS check** (out of 100): job keywords covered, action verbs, measurable results, length, layout.
- **A fact check**: any line that is not in your resume or career log is flagged. The agent asks you about each one. Only say yes to what is true.

Want changes? Ask (**"make the summary shorter"**, **"use the executive design"**), or open `resume.md` and edit it yourself, then ask the agent to rebuild the PDF.

## Step 6: Apply (5 minutes)

Say **"show my pipeline"**. The agent runs `npm run pipeline` and a page opens in your browser:

- Each saved job, with its status, salary and ATS score.
- **Apply on …** opens the job posting. Upload your PDF there.
- **Open resume PDF** and **Open folder** for your files.

Tell the agent **"I applied to 1"**, and it marks the job as applied (`npm run status -- 1 applied`).

## Step 7: Prepare for the interview (15 minutes)

Got an interview? Say **"I got an interview for 1, help me prepare"**.

1. **Story bank (once).** The agent picks 5–8 of your achievements and asks you a short question about each. It then writes them as STAR stories (Situation, Task, Action, Result) in `story-bank.md`. As with resumes, anything you did not tell it is flagged for you to confirm.
2. **Prep sheet for the job.** `interview-prep.md` in that job's folder has:
   - likely questions for this role, each with the story to use;
   - Singapore questions: expected salary (the posting's range plus a market benchmark), notice period, work pass;
   - good questions to ask the interviewer.
   It also appears as an **Interview prep** button on your pipeline page.
3. **Practice.** Say **"practise with me"**. The agent asks one question at a time and gives short feedback on each answer.

---

## Tips

- One job at a time works best: save, tailor, check, apply.
- Free models have usage limits. If the agent pauses with a limit message, wait a minute and say "continue", or switch to another free model with `/models`.
- Your files never leave your computer; git ignores them (see `.gitignore`).
