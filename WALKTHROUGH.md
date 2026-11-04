# Walkthrough: Your First Job Search with SG Job Hunter

## 30-Minute Demo

This walkthrough shows you how to go from zero to your first job application in 30 minutes.

---

## Step 1: Setup (5 minutes)

### 1.1 Clone the Repository

```bash
git clone https://github.com/sg-job-hunter/sg-job-hunter.git
cd sg-job-hunter
npm install
npx playwright install chromium
```

### 1.2 Initialize Templates

```bash
node doctor.mjs --json --init-templates
```

This creates:
- `cv.md` — Your canonical CV
- `config/profile.yml` — Your targeting strategy
- `modes/_profile.md` — Your archetypes and narrative
- `portals.yml` — Your target companies

---

## Step 2: Profile Setup (10 minutes)

### 2.1 Edit Your CV

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

### 2.2 Edit Your Profile

Open `config/profile.yml` and fill in:

```yaml
candidate:
  full_name: "Your Full Name"
  email: "your.email@example.com"
  phone: "+65 9XXX XXXX"
  location: "Singapore"
  years_of_experience: 10

target_roles:
  primary:
    - "Learning & Development Manager"
    - "Organisational Development Manager"
  secondary:
    - "Training Manager"
    - "Creative Technologist"

compensation:
  target_range: "SGD 6,800 - 10,000"
  currency: "SGD"
  minimum: "SGD 6,800"
```

### 2.3 Edit Your Target Companies

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

## Step 3: Run the Scanner (5 minutes)

```bash
# Scan all configured companies
node scan.mjs

# Check results
cat data/scan-history.tsv
```

The scanner will:
- Visit each company's careers page
- Look for jobs matching your title filters
- Filter by location and experience
- Save results to `data/scan-history.tsv`

**Expected output:** 10-50 jobs depending on your target roles and companies.

---

## Step 4: Evaluate Jobs (5 minutes)

### 4.1 Add Jobs to Pipeline

```bash
# Add a job URL to your pipeline
echo "- [ ] https://company.com/job/123 | Company | Role" >> data/pipeline.md
```

### 4.2 Evaluate a Job

Paste a job URL and the system will score it 1-5 based on the 6-block framework:

| Block | What It Checks | Weight |
|-------|---------------|--------|
| **A** | Role Match | 25% |
| **B** | Experience Match | 25% |
| **C** | Skills Match | 20% |
| **D** | Location & Logistics | 10% |
| **E** | Compensation | 10% |
| **F** | Culture & Mission Fit | 10% |

**Scores:**
- 4.5-5.0: 🔥 Apply immediately
- 4.0-4.4: ✅ Strong match, apply
- 3.5-3.9: ⚠️ Consider if you have a specific reason
- Below 3.5: ❌ Skip

### 4.3 Review Reports

Reports are saved in `reports/` and include:
- **Block A-F scores** with detailed reasoning
- **Overall score** (1-5)
- **Verdict** (Apply, Consider, Skip)
- **Risk summary**

---

## Step 5: Generate Application Packages (5 minutes)

For jobs scored 4.0+:

### 5.1 Generate Tailored CV

Ask your AI agent to write a tailored copy of your `cv.md` for the job (for example `output/cv-<role>.md`), emphasising the experience that matches the job description. Then convert it to PDF:

```bash
npm run convert-cv
```

`npm run convert-cv` runs `convert-cv-to-pdf.mjs`, which converts every CV listed in its `cvFiles` array. Add one entry per tailored CV first, e.g.
`{ md: 'output/cv-<role>.md', pdf: 'output/cv-<name>-<role>.pdf', title: '<Name> — <Role Title>' }`.

### 5.2 Generate Cover Letter

Follow the cover letter mode to generate a tailored cover letter.

### 5.3 Generate Application Email

Follow the email mode to generate a professional application email.

---

## Step 6: Submit Applications (5 minutes)

### 6.1 Upload to Job Portals

1. Open the job listing on MyCareersFuture, JobStreet, or LinkedIn
2. Click "Apply"
3. Upload your tailored CV and cover letter PDFs
4. Submit

### 6.2 Update Tracker

```bash
# Update application status
node set-status.mjs --report <report#> Applied
```

### 6.3 Set Follow-up Dates

```bash
# Calculate follow-up dates
node followup-cadence.mjs
```

---

## Next Steps

### Daily Routine

- **Morning (15 min):** Check pipeline, run scanner if it's scan day
- **Afternoon (30 min):** Evaluate 2-3 new jobs, generate applications
- **Evening (15 min):** Update tracker, plan tomorrow

### Weekly Routine

- **Monday:** Run full scan, evaluate 5-10 jobs, submit 2-3 applications
- **Wednesday:** Follow up on previous applications, research new companies
- **Friday:** Review week's progress, analyze patterns, plan next week

---

## Troubleshooting

### Scanner not finding jobs
- Check `portals.yml` companies have valid careers URLs
- Check title filters match your target roles
- Check location filters include Singapore

### Playwright errors
- Reinstall Playwright: `npx playwright install chromium`
- Check you have enough disk space
- Check you have internet connection

### Evaluation scores seem wrong
- Check `config/profile.yml` target roles
- Check `modes/_profile.md` archetypes
- Check `cv.md` has quantified achievements

---

## Congratulations! 🎉

You've completed your first job search with SG Job Hunter. Keep the momentum going:

- ✅ Setup complete
- ✅ Profile configured
- ✅ Scanner running
- ✅ Jobs evaluated
- ✅ Applications generated
- ✅ Applications submitted

**Next:** Continue scanning, evaluating, and applying. Quality over quantity, always.

---

*This walkthrough is designed to be completed in 30 minutes. Take your time, ask questions, and don't hesitate to reach out for help.*
