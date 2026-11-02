# SG Job Hunter

> A library of CLI tools and templates for systematic job searching in Singapore and ASEAN.
> **All PMET sectors covered** — Tech, Finance, Life Sciences, Green Economy, Care Economy, Manufacturing, and more.

**Created by:** [Bertram Yang](https://linkedin.com/in/bertramyang)
**License:** MIT | **Status:** v2.0 — Comprehensive industry coverage, auto-setup, interactive onboarding

---

## What's New in v2.0

- 🏢 **All PMET sectors** — Not just L&D/OD anymore. Full salary benchmarks for 12+ industries
- 🚀 **One-command setup** — `npm run setup` installs everything and guides you through onboarding
- 💰 **Comprehensive salary data** — 2026 benchmarks from Hays, Robert Walters, Michael Page, MOM, and more
- 🌱 **Green Economy & Care Economy** — New industry coverage with market-specific salary data
- 🤖 **AI agent-ready** — Designed to work with AI assistants for conversational job searching
- 📊 **12+ industries covered** — Tech, Data/AI, Finance, Life Sciences, Manufacturing, Green Economy, Care Economy, Digital Marketing, Consulting, Supply Chain, Real Estate, Government, L&D/OD

---

## What This Is

SG Job Hunter is a **collection of runnable CLI scripts and templates** that automate parts of the job search pipeline. Think of it as a toolkit — each tool does one thing well:

| Tool | What It Does |
|------|-------------|
| `setup` | **One-command auto-install** + interactive onboarding |
| `onboard` | Step-by-step profile setup (no technical knowledge needed) |
| `doctor` | Checks setup, validates config, initializes templates |
| `scan` | Scans company career pages for matching roles |
| `scrape` / `scrape-more` | Scrapes job portals (MyCareersFuture, JobStreet, LinkedIn, etc.) |
| `evaluate` | 6-block job scoring + generates reports |
| `convert-cv` | Converts your `cv.md` (resume) to a polished PDF |
| `convert-cover-letter` | Converts cover letter HTML to PDF |
| `set-status` | Updates application status in the tracker |
| `analyze` | Detects rejection patterns across applications |
| `stats` | Shows pipeline statistics and funnel metrics |
| `followup` | Calculates follow-up cadence for pending applications |
| `verify` | Health-checks pipeline data integrity |
| `upskill` | Recommends skills to develop based on market gaps |
| `salary-gap` | Analyzes salary gaps between your target and market rates |
| `salary-benchmarks` | Shows salary benchmarks for your sector |

**40+ CLI scripts** ship with the project. All are runnable. All are documented.

## Industries Covered

SG Job Hunter v2.0 covers **all major PMET sectors** in Singapore:

| Sector | Key Roles | Mid-Level Salary (SGD/month) |
|--------|-----------|------------------------------|
| **Software Engineering** | Software Engineer, Full Stack, DevOps | $7,000 – $12,000 |
| **Data & AI** | Data Scientist, ML Engineer, AI Engineer | $8,000 – $15,000 |
| **Finance & Banking** | Financial Analyst, Risk Manager, Compliance | $6,500 – $14,000 |
| **Life Sciences** | Regulatory Affairs, QA Manager, Biotechnologist | $6,500 – $14,000 |
| **Manufacturing** | Process Engineer, Automation Engineer | $5,600 – $8,200 |
| **Green Economy** | Sustainability Manager, ESG Consultant | $6,500 – $12,000 |
| **Care Economy** | Social Worker, Psychologist, Care Manager | $5,000 – $9,000 |
| **Digital Marketing** | Digital Marketing Manager, SEO, E-commerce | $5,000 – $12,000 |
| **Consulting** | Management Consultant, Strategy Consultant | $7,000 – $13,000 |
| **Supply Chain** | Supply Chain Manager, Logistics, Procurement | $5,000 – $12,000 |
| **L&D / OD** | L&D Manager, OD Manager, Training Manager | $6,000 – $8,000 |
| **Government** | Policy Analyst, Programme Manager | $6,000 – $13,000 |

> Full salary benchmarks in `data/salary-benchmarks-2026.md`

---

## Quick Start

### For Non-Technical Users (Recommended)

**One command to get started:**

```bash
# Clone and setup
git clone https://github.com/sg-job-hunter/sg-job-hunter.git
cd sg-job-hunter
npm run setup
```

The setup wizard will:
1. ✅ Check your system (Node.js, Git, npm)
2. ✅ Install all dependencies automatically
3. ✅ Download the browser needed for job scraping
4. ✅ Guide you through setting up your profile step by step
5. ✅ Create your CV template and configuration files

**That's it!** You're ready to search for jobs.

### For Technical Users

```bash
git clone https://github.com/sg-job-hunter/sg-job-hunter.git
cd sg-job-hunter
npm install
npx playwright install chromium
node doctor.mjs --init-templates
```

Then edit:
- `config/profile.yml` — Your target roles, compensation, location
- `cv.md` — Your resume (markdown)
- `portals.yml` — Companies and job portals to scan

---

## The Job Search Workflow

### Step 1: Find Jobs

```bash
# Scan company career pages
npm run scan

# Scrape job portals (MyCareersFuture, JobStreet, LinkedIn, etc.)
npm run scrape

# Or use the AI agent:
# Tell your AI assistant: "Find me Data Engineer jobs in Singapore"
```

### Step 2: Evaluate Jobs

```bash
# Evaluate a single job URL
npm run evaluate -- --url "https://www.mycareersfuture.gov.sg/job/123"

# Evaluate and generate application documents (if score ≥ 4.0)
npm run evaluate -- --url "https://www.linkedin.com/jobs/view/123" --apply

# Process all pending jobs in your pipeline
npm run evaluate -- --pipeline --apply
```

The 6-block evaluation framework scores every job:

| Block | What It Checks | Weight |
|-------|---------------|--------|
| **A** | Role Match | 25% |
| **B** | Experience Match | 25% |
| **C** | Skills Match | 20% |
| **D** | Location & Logistics | 10% |
| **E** | Compensation (vs market rates) | 10% |
| **F** | Culture & Mission Fit | 10% |

**Scores:**
- 4.5-5.0: 🔥 Apply immediately
- 4.0-4.4: ✅ Strong match, apply
- 3.5-3.9: ⚠️ Consider if you have a specific reason
- Below 3.5: ❌ Skip

### Step 3: Human Review (You)

- Review the evaluation report in `reports/`
- Review the tailored resume and cover letter in `output/`
- Make any edits to personalize your application
- **You are the human-in-the-loop — you decide what gets sent**

### Step 4: Convert to PDF & Apply

```bash
# Convert resume to PDF
npm run convert-cv

# Convert cover letter to PDF
npm run convert-cover-letter

# Go to the job portal and upload your PDFs
# Click "Apply" (you do this)

# Update tracker
npm run set-status -- --report 001 Applied
```

### Step 5: Track & Follow Up

```bash
# View pipeline statistics
npm run stats

# Calculate follow-up dates
npm run followup

# Analyze rejection patterns
npm run analyze

# Check salary benchmarks for your sector
npm run salary-benchmarks
```

---

## The Vision: AI Agent-First

The goal is an **AI agent-first** system where non-technical users converse with an AI agent and the agent runs all the scripts automatically:

```
User: "Find me Data Engineer jobs in Singapore"
AI Agent: Runs scan → evaluates matches → presents top 5 in chat
User: "Generate applications for the top 3"
AI Agent: Generates resumes, cover letters, PDFs → shows previews
User: "Ready to apply"
AI Agent: Opens job portals → guides uploads → tracks status
```

The scripts to make this work exist. The orchestration layer that ties them together into a seamless conversation is what's being built next.

---

## Singapore & ASEAN Job Portals

Pre-configured to scan these portals:

### Singapore (Core)

| Portal | Coverage |
|--------|----------|
| **MyCareersFuture** | Government-verified, PMET roles |
| **JobStreet** | Largest private portal |
| **LinkedIn Jobs** | Global (SG filter) |
| **JobsDB** | Professional & management roles |
| **Glassdoor** | Company reviews + jobs |
| **Glints** | Tech, startup, modern roles |
| **CareerPage** | Local corporate & government |
| **JobCentral** | 1M monthly page views |
| **Indeed** | Aggregator, wide coverage |
| **FastJobs** | Professional & non-executive |

### ASEAN (Enable on Demand)

| Country | Portals |
|---------|---------|
| **Malaysia** | JobStreet, Hiredly, JobsDB |
| **Indonesia** | JobStreet, Glints, Kalibrr |
| **Philippines** | JobStreet, Indeed |
| **Thailand** | JobStreet, JobsDB |
| **Vietnam** | JobStreet, VietnamWorks |

---

## Key Features

- **6-Block Evaluation Framework** — Score jobs on Role Match, Experience, Skills, Location, Compensation, and Culture Fit
- **All PMET Sectors** — Salary benchmarks for 12+ industries with 2026 data
- **40+ CLI Tools** — Each does one thing well; combine them for your workflow
- **One-Command Setup** — `npm run setup` handles everything
- **Interactive Onboarding** — Step-by-step profile setup for non-technical users
- **Singapore-Specific Rules** — CPF calculations, work pass considerations, local vocabulary
- **Web Dashboard** — Generate a funnel visualization from your applications data
- **Plugin System** — Extend with custom providers, extractors, and modes
- **8 Resume Templates** — Multiple styles for different industries and seniority levels

---

## Project Structure

```
sg-job-hunter/
├── README.md                    # This file
├── GETTING_STARTED.md           # 30-minute setup guide
├── WALKTHROUGH.md               # 30-minute demo script
├── TROUBLESHOOTING.md           # Common issues & solutions
│
├── setup.mjs                    # 🆕 One-command auto-setup
├── onboard.mjs                  # 🆕 Interactive onboarding wizard
├── doctor.mjs                   # Setup validation (runnable)
├── convert-cv-to-pdf.mjs        # Resume → PDF converter (runnable)
├── convert-cover-letter-to-pdf.mjs  # Cover letter → PDF (runnable)
│
├── lib/                         # 40+ CLI scripts and library modules
│   ├── index.mjs                # Unified CLI entry point
│   ├── scan.mjs                 # Portal scanner
│   ├── scrape-jobs.mjs          # Job portal scraper
│   ├── evaluate.mjs             # 6-block job evaluator
│   ├── analyze-patterns.mjs     # Rejection pattern detector
│   ├── followup-cadence.mjs     # Follow-up calendar
│   ├── salary-benchmarks.mjs    # 🆕 Salary benchmark lookup
│   └── ...                      # 33+ more tools
│
├── config/                      # Profile configuration templates
├── data/                        # Applications tracker, scan history (your data)
│   └── salary-benchmarks-2026.md  # 🆕 Comprehensive salary data
├── reports/                     # Evaluation reports (generated)
├── output/                      # Generated PDFs (resumes, cover letters)
│
├── modes/sg/                    # Singapore-specific market rules (all sectors)
│   └── _shared.md               # 🆕 Updated for all PMET sectors
├── ats/                         # ATS rules and filters
├── plugins/                     # Plugin system
│
├── cv-template*.html            # 8 resume template variants
├── cover-letter-template.html   # Cover letter template
│
├── portals.yml                  # Company and portal configuration
├── *.yml                        # Rules: ATS, discard, jurisdiction, protected grounds
│
├── programme/                   # 5-day learning programme
├── examples/                    # Sample profiles and evaluation reports
└── tutorials/                   # Video tutorial scripts
```

---

## Contributing

This project is open source. Contributions welcome:

- Add new companies to `portals.yml`
- Improve Singapore/ASEAN evaluation rules
- Add salary data for new sectors
- Translate documentation to other languages
- Build the agent orchestration layer
- Report bugs and suggest features

---

## Credits

**Project Creator:** [Bertram Yang](https://linkedin.com/in/bertramyang)

Built for Singapore and ASEAN job seekers who deserve a systematic, quality-first approach to job searching.

**Salary Data Sources:** Hays Asia, Robert Walters, Michael Page, Robert Half, Skillta.tech, Fuku AI, JTE Recruit, Mavenside, Nodeflair/Vulcanpost, Skillup.sg, Glassdoor SG, Vertical Institute, MOM COMPASS, Reeracoen, Corestaff, Morgan McKinley, Atomic Group, NCSS/MOH.

---

## Additional Documentation

- [Getting Started](GETTING_STARTED.md) — 30-minute setup guide
- [Walkthrough](WALKTHROUGH.md) — 30-minute demo script
- [Troubleshooting](TROUBLESHOOTING.md) — Common issues and solutions
- [Salary Benchmarks 2026](data/salary-benchmarks-2026.md) — Comprehensive salary data
- [Market Rules](modes/sg/_shared.md) — Singapore market evaluation rules
