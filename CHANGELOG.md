# Changelog — SG Job Hunter

## v2.1.0 (November 2026) — Guided flow for opencode

- **Talk to an AI agent instead of running tools.** Open opencode in the folder and say "I want to find <role> jobs". The agent follows `AGENTS.md`.
- **New commands:** `check`, `import-resume` (PDF / Word / text), `find-jobs` (MyCareersFuture, JobStreet/JobsDB in SG, MY, ID, PH, TH, Kalibrr, Tech in Asia and employer career pages), `save-job`, `resume` (8 templates, ATS check, fact check), `pipeline` (page with Apply links) and `status`.
- **Fact check:** every tailored resume is compared with your own resume and career log, and anything new is flagged for you to confirm.
- **Fixed:** template metadata no longer shows at the top of resumes; the ATS template is listed; docs no longer point to missing scripts.
- **Removed:** the US-only H-1B sponsor plugin, career-ops leftovers, the old interactive `setup` / `onboard` commands, and commands that crashed or read the old tracker (`scan`, `evaluate`, `scrape`, `set-status`, `analyze`, `upskill` and others are no longer npm commands). `npm run doctor` now runs `npm run check`.
- **Privacy:** your resume, career log, job lists and `inbox/` are excluded from git.

## v2.0.0 (November 2026) — Major Release

### 🎉 What's New

#### All PMET Sectors Covered
- Removed L&D/OD bias — tool now supports **12+ industries**
- Full salary benchmarks for: Tech, Data/AI, Finance, Life Sciences, Manufacturing, Green Economy, Care Economy, Digital Marketing, Consulting, Supply Chain, Real Estate, Government, L&D/OD
- Industry-specific keywords and skills evaluation
- Sector-specific market rules and employer lists

#### One-Command Setup
- `npm run setup` — Auto-installs dependencies, downloads browser, runs interactive onboarding
- `npm run onboard` — Step-by-step profile setup wizard for non-technical users
- No technical knowledge required to get started

#### Comprehensive Salary Data
- 2026 salary benchmarks from 15+ sources (Hays, Robert Walters, Michael Page, MOM, etc.)
- Monthly base salary in SGD for all sectors
- Junior/Mid/Senior breakdowns with demand and YoY growth data
- Green economy and care economy salary data (new)
- Manufacturing and life sciences salary data (new)

#### Improved Evaluation
- Dynamic salary lookup during job evaluation (Block E)
- Market benchmark comparison for compensation scoring
- Expanded skills database covering all PMET sectors
- Industry-specific culture and sector characteristics

### 📁 New Files

| File | Description |
|------|-------------|
| `setup.mjs` | One-command auto-setup script |
| `onboard.mjs` | Interactive onboarding wizard |
| `data/salary-benchmarks-2026.md` | Comprehensive salary data (12+ sectors) |
| `lib/salary-benchmarks.mjs` | Salary benchmark lookup CLI tool |

### ✏️ Updated Files

| File | Changes |
|------|---------|
| `modes/sg/_shared.md` | Expanded to cover all PMET sectors |
| `config/profile.example.yml` | Industry-agnostic with examples for all sectors |
| `lib/evaluate.mjs` | Dynamic salary lookup, expanded skills database |
| `lib/index.mjs` | New commands: setup, onboard, salary-benchmarks |
| `package.json` | v2.0.0, new scripts, expanded keywords |
| `README.md` | Complete rewrite for v2.0 features |
| `GETTING_STARTED.md` | Updated with auto-setup flow |

### 🔧 New Commands

```bash
npm run setup              # One-command auto-setup
npm run onboard            # Interactive profile onboarding
npm run salary-benchmarks  # Look up salary data
npm run salary-benchmarks -- --sector tech    # Tech sector salaries
npm run salary-benchmarks -- --role "Data Scientist"  # Search by role
npm run salary-benchmarks -- --json           # JSON output for agents
```

### 📊 Salary Data Sources

- Hays Asia Salary Guide 2026
- Robert Walters Singapore Salary Survey 2026
- Michael Page Singapore Salary Guide 2026
- Robert Half Marketing & Creative Salary Guide 2026
- Skillta.tech Singapore Tech Salaries 2026
- Fuku AI Singapore Tech Salary Benchmark 2026
- JTE Recruit IT & Tech Salary Guide Singapore 2026
- Mavenside Singapore Salary Guide 2026
- Nodeflair 2026 Singapore Tech Salaries (Vulcanpost)
- Skillup.sg Tech Salary Guides Singapore 2026
- Glassdoor Singapore
- Vertical Institute Digital Marketing Salary Singapore 2026
- MOM COMPASS Salary Benchmarks 2026
- Reeracoen Singapore Salary Guide 2025-2026
- Corestaff Manufacturing Salary Guide 2026
- Morgan McKinley Accounting & Finance 2026
- Atomic Group Life Sciences Salary Guide 2026
- MOH/MSF Community Care Salary Guidelines 2026

### 🎯 Key Improvements

1. **No more L&D/OD bias** — Default keywords, examples, and benchmarks cover all sectors
2. **Non-technical friendly** — Setup wizard guides users through everything
3. **Market-aware** — Salary benchmarks loaded automatically during evaluation
4. **Future-proof** — Easy to add new sectors by updating the salary data file
5. **AI agent-ready** — JSON output for integration with AI assistants

### ⚠️ Breaking Changes

- `package.json` version bumped to 2.0.0
- Default target roles in `config/profile.example.yml` changed from L&D/OD to generic placeholders
- `modes/sg/_shared.md` expanded significantly (backwards compatible)

### 🐛 Bug Fixes

- Skills evaluation now covers all PMET sectors (was L&D/OD biased)
- Compensation evaluation now uses market benchmarks (was generic)
- Profile example no longer assumes L&D/OD career path

---

## v1.0.0 (Previous)

- Initial release with L&D/OD focus
- 36 CLI tools
- Singapore-specific market rules
- 6-block evaluation framework
- 8 resume templates
