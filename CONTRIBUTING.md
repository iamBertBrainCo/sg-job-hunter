# Contributing to SG Job Hunter

Thank you for interested in contributing! 🇸🇬

## Who is this for?

- **Job seekers** — Report bugs, suggest features, add salary data
- **Developers** — Improve tools, add integrations, fix bugs
- **HR / Recruiters** — Share market insights, suggest improvements
- **Everyone** — Spread the word, star the repo, share with friends

---

## Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/sg-job-hunter.git
cd sg-job-hunter

# Install everything (packages and the Chromium used for PDFs)
npm run check

# Run the offline tests
npm test
```

---

## How it is built

SG Job Hunter is driven by an AI agent in [opencode](https://opencode.ai). The agent's instructions are in [AGENTS.md](AGENTS.md), which opencode loads automatically.

1. **Few, complete commands.** Each step is one `npm run` command that does the whole job, prints what the agent needs, and ends with a `NEXT STEP:` line. Small models follow that reliably, and it keeps model requests low on rate-limited APIs.
2. **Plain files.** Resumes are Markdown (`cv.md`, `resume.md`), stories are `story-bank.md`, and the pipeline is `data/pipeline.json` plus `output/pipeline.html`. The user can open and edit any of them.
3. **The model writes words; the code checks them.** The code renders PDFs, scores resumes against `ats-rules.yml`, and fact-checks resumes and stories against the user's own material.
4. **Human in the loop.** The agent never submits applications, sends messages or signs in.
5. **Same on Windows, macOS and Linux.**

| File | Role |
|---|---|
| `lib/flow/check.mjs` | First-run check and installs |
| `lib/flow/import-resume.mjs` | PDF / Word / text resume reading |
| `lib/flow/find-jobs.mjs` | Searches `sources.yml`, filters by country, ranks against the role and `cv.md` |
| `lib/flow/save-job.mjs` | Full job description and ATS keywords per saved job |
| `lib/flow/keywords.mjs` | Cross-industry and Singapore keyword vocabulary |
| `lib/flow/resume-lib.mjs` | Resume parser, template renderer, PDF, ATS check, fact check |
| `lib/flow/resume.mjs` | `npm run resume` (check, preview, use, per-job PDF) |
| `lib/flow/interview.mjs` | Story bank check and interview prep |
| `lib/flow/pipeline.mjs`, `status.mjs`, `clear-my-data.mjs` | Pipeline page, status updates, data removal |
| `lib/providers/` | Job-board and career-page connectors |
| `cv-template.*.html`, `ats/`, `sections/` | Resume designs and their section layouts |

The older v2.0 tools (scanner, 6-block evaluator, tracker scripts) are still in `lib/` but are not part of the supported flow.

---

## How to Contribute

### 1. Report a Bug 🐛
- Check existing issues first
- Use the **Bug Report** template
- Include steps to reproduce and your environment

### 2. Suggest a Feature 💡
- Use the **Feature Request** template
- Describe the problem and proposed solution
- Discuss with maintainers before implementing

### 3. Add Salary Data 📊
- Fork the repository
- Update `data/salary-benchmarks-2026.md`
- **Cite your sources** (links, reports, surveys)
- Submit a pull request

### 4. Improve Documentation 📝
- Fix typos, clarify instructions, add examples
- Translate docs to other languages (Malay, Mandarin, Tamil)
- Submit a pull request

### 5. Add New Companies 🏢
- Update `portals.yml` with company career pages
- Include sector and notes
- Submit a pull request

---

## Pull Request Guidelines

- ✅ Use a descriptive title (e.g. "feat: add aviation sector salary data")
- ✅ Reference related issues (e.g. "Closes #123")
- ✅ Include testing steps
- ✅ Update documentation if needed
- ✅ Keep changes focused (one PR = one feature)

## Commit Message Format

```
type: short description

type: feat | fix | docs | chore | refactor
```

Examples:
- `feat: add green economy salary benchmarks`
- `fix: resolve playwright installation on Windows`
- `docs: translate README to Mandarin`

---

## Code of Conduct

- Be respectful and constructive
- Welcome contributors from all backgrounds
- No discrimination of any kind
- Focus on the problem, not the person

---

## Questions?

- Open a **Discussion** on GitHub
- Email: bertram.yang@gmail.com
- LinkedIn: linkedin.com/in/bertramyang

---

*Built for Singapore and ASEAN job seekers. Quality over quantity, always.*
