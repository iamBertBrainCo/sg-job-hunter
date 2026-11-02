# Getting Started Guide

## For Singapore Job Seekers — All Industries

**Time to complete:** 15 minutes (with auto-setup)  
**Outcome:** Ready to scan for jobs in your industry

---

## Prerequisites

Before you start, make sure you have:

- ✅ **Node.js 22.13+** installed (`node --version`)
- ✅ **Git** installed (`git --version`)
- ✅ **GitHub account** (optional, for saving your work)

### Installing Prerequisites

```bash
# Install Node.js (if not installed)
# macOS:  brew install node
# Windows: Download from https://nodejs.org/
# Linux:  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
#         sudo apt-get install -y nodejs

# Install Git (if not installed)
# macOS:  brew install git
# Windows: Download from https://git-scm.com/
# Linux:  sudo apt-get install git
```

---

## Option A: One-Command Setup (Recommended for Non-Technical Users)

**This is the easiest way to get started:**

```bash
# Clone the repo
git clone https://github.com/sg-job-hunter/sg-job-hunter.git
cd sg-job-hunter

# Run the setup wizard
npm run setup
```

The setup wizard will:
1. ✅ Check your system (Node.js, Git, npm)
2. ✅ Install all dependencies automatically
3. ✅ Download the browser needed for job scraping
4. ✅ Guide you through setting up your profile step by step
5. ✅ Create your CV template and configuration files

**That's it!** You're ready to search for jobs.

---

## Option B: Interactive Onboarding

If you've already run setup but want to configure your profile:

```bash
npm run onboard
```

This walks you through:
1. Your personal details (name, email, phone, experience)
2. Your target industry (12+ sectors covered)
3. Your target roles (auto-suggested based on industry)
4. Your salary expectations (with market rate guidance)
5. Your deal breakers
6. Your professional story

---

## Option C: Manual Setup (For Technical Users)

```bash
# Clone and install
git clone https://github.com/sg-job-hunter/sg-job-hunter.git
cd sg-job-hunter
npm install
npx playwright install chromium

# Initialize templates
node doctor.mjs --init-templates
```

Then edit these files:
- `config/profile.yml` — Your target roles, compensation, location
- `cv.md` — Your resume (markdown)
- `portals.yml` — Companies and job portals to scan

---

## Industries Covered

SG Job Hunter covers **all major PMET sectors** in Singapore:

| Sector | Example Roles |
|--------|--------------|
| **Technology** | Software Engineer, Full Stack Developer, DevOps |
| **Data & AI** | Data Scientist, ML Engineer, AI Engineer |
| **Finance** | Financial Analyst, Risk Manager, Compliance Officer |
| **Life Sciences** | Regulatory Affairs, QA Manager, Biotechnologist |
| **Manufacturing** | Process Engineer, Automation Engineer |
| **Green Economy** | Sustainability Manager, ESG Consultant |
| **Care Economy** | Social Worker, Psychologist, Care Manager |
| **Digital Marketing** | Digital Marketing Manager, SEO, E-commerce |
| **Consulting** | Management Consultant, Strategy Consultant |
| **Supply Chain** | Supply Chain Manager, Logistics, Procurement |
| **L&D / OD** | L&D Manager, OD Manager, Training Manager |
| **Government** | Policy Analyst, Programme Manager |

> Check `data/salary-benchmarks-2026.md` for detailed salary data by sector.

---

## Step 1: Configure Your Profile

### Using the Onboarding Wizard (Easiest)

```bash
npm run onboard
```

### Manual Configuration

Edit `config/profile.yml`:

```yaml
candidate:
  full_name: "Your Full Name"
  email: "your.email@example.com"
  phone: "+65 9XXX XXXX"
  location: "Singapore"
  years_of_experience: 5

target_roles:
  primary:
    - "Your Primary Role Title"
    - "Your Secondary Role Title"
  secondary:
    - "Alternative Role Title"

compensation:
  target_range: "SGD 7,000 - 10,000"
  currency: "SGD"
  minimum: "SGD 7,000"
```

**💡 Tip:** Check `data/salary-benchmarks-2026.md` for market rates in your sector before setting your expectations.

---

## Step 2: Edit Your Resume

Open `cv.md` and fill in your experience:

```markdown
# Your Name
## Your Target Title

**Singapore** • +65 9XXX XXXX • your.email@example.com

---

## Professional Profile

[2-3 sentences about your experience and impact]

**Impact at a glance:** [3-4 quantified achievements]

---

## Experience

### Company Name — Singapore
**Your Job Title**
Start Year – End Year

- [Action verb] + [what you did] + [impact/metric]
```

**Tips:**
- Quantify everything (e.g., "~1,800 jobseekers" not "many people")
- Use action verbs (Designed, Built, Led, Authored)
- Lead with impact, not duties
- Keep it to 2 pages max

---

## Step 3: Configure Your Target Companies

Open `portals.yml` and add companies you want to work for:

```yaml
companies:
  - name: "Company Name"
    careers_url: "https://company.com/careers"
    sector: "Sector"
    notes: "Brief description"
```

**Start with 20-30 companies** you really want to work for.

---

## Step 4: Run Your First Scan

```bash
# Scan all configured companies
npm run scan

# Scrape job portals (MyCareersFuture, JobStreet, LinkedIn, etc.)
npm run scrape

# Check results
cat data/scan-history.tsv
```

The scanner will:
- Visit each company's careers page
- Look for jobs matching your title filters
- Filter by location and experience
- Save results to `data/scan-history.tsv`

---

## Step 5: Evaluate Jobs

### Evaluate a Single Job

```bash
npm run evaluate -- --url "https://www.mycareersfuture.gov.sg/job/123"
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

### Generate Application Package

For jobs scored 4.0+:

```bash
# Evaluate and generate application documents
npm run evaluate -- --url "https://www.linkedin.com/jobs/view/123" --apply
```

---

## Step 6: Convert to PDF & Apply

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

---

## Step 7: Track & Follow Up

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

## Daily Routine

### Morning (15 min)
- Check `data/pipeline.md` for new jobs
- Run `npm run scan` if it's scan day
- Review any new responses

### Afternoon (30 min)
- Evaluate 2-3 new jobs
- Generate application packages for strong matches
- Submit applications

### Evening (15 min)
- Update tracker: `npm run set-status -- --report XXX Applied`
- Plan tomorrow's activities
- Send LinkedIn connection requests

---

## Weekly Routine

### Monday
- Run full scan: `npm run scan`
- Evaluate 5-10 new jobs
- Submit 2-3 applications

### Wednesday
- Follow up on previous applications: `npm run followup`
- Research new companies
- Update profile if needed

### Friday
- Review week's progress: `npm run stats`
- Analyze patterns: `npm run analyze`
- Plan next week

---

## Troubleshooting

### Setup fails
- Make sure Node.js 22.13+ is installed: `node --version`
- Try running setup again: `npm run setup`
- Check error messages for specific issues

### Scanner not finding jobs
- Check `portals.yml` companies have valid careers URLs
- Check title filters match your target roles
- Check location filters include Singapore
- Try `npm run scrape` for portal-based scraping

### Playwright errors
- Reinstall Playwright: `npx playwright install chromium`
- Check you have enough disk space
- Check you have internet connection

### Evaluation scores seem wrong
- Check `config/profile.yml` target roles
- Check `cv.md` has quantified achievements
- Check `data/salary-benchmarks-2026.md` for market rates

### PDF generation fails
- Check Playwright is installed
- Check you have enough disk space
- Check the resume file is valid markdown
- Run `npm run doctor` to validate setup

---

## Next Steps

Once you're comfortable with the basics:

1. **Explore salary data** — `npm run salary-benchmarks -- --sector tech`
2. **Join the community** — Connect with other users on LinkedIn
3. **Contribute** — Add new companies, improve templates, fix bugs
4. **Teach others** — Share this system with fellow job seekers
5. **Track outcomes** — Record interviews and offers to improve the system

---

## Support

- **Documentation:** Read `README.md` and `programme/README.md`
- **Issues:** Report bugs on GitHub
- **Questions:** Ask on LinkedIn or in the community group

---

*Welcome to systematic job searching. Quality over quantity, always.*
