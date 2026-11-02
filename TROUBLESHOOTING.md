# Troubleshooting Guide

## Common Issues & Solutions

This guide helps you resolve common problems when using SG Job Hunter.

---

## Setup Issues

### Problem: "npm install" fails

**Symptoms:**
- Error message about missing dependencies
- Installation stops midway

**Solutions:**

1. **Check Node.js version**
   ```bash
   node --version
   ```
   Must be 18 or higher. If not, update Node.js from https://nodejs.org/

2. **Check internet connection**
   - Make sure you're connected to the internet
   - Try running `npm install` again

3. **Clear npm cache**
   ```bash
   npm cache clean --force
   npm install
   ```

4. **Run as administrator (Windows)**
   - Open Command Prompt as Administrator
   - Run `npm install` again

---

### Problem: Playwright installation fails

**Symptoms:**
- Error message about Chromium download
- Browser not found error

**Solutions:**

1. **Check disk space**
   - Playwright needs ~300MB for Chromium download
   - Free up space if needed

2. **Check internet connection**
   - Make sure you're connected to the internet
   - Try running `npx playwright install chromium` again

3. **Manual installation**
   ```bash
   npx playwright install chromium
   ```

4. **Alternative: Use WebFetch instead**
   - If Playwright continues to fail, you can use WebFetch for job discovery
   - Some features will be limited, but the system still works

---

### Problem: "node command not found"

**Symptoms:**
- Error message about node not being recognized

**Solutions:**

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Install the LTS version (long-term support)

2. **Restart terminal**
   - Close and reopen your terminal
   - Try running the command again

3. **Check installation**
   ```bash
   node --version
   npm --version
   ```
   Both should show version numbers

---

## Scanner Issues

### Problem: Scanner finds no jobs

**Symptoms:**
- Scan completes but returns 0 jobs
- Empty results

**Solutions:**

1. **Check portals.yml**
   - Make sure companies have valid careers URLs
   - Test URLs in your browser

2. **Check title filters**
   - Make sure your target roles are in the positive filters
   - Remove overly specific filters

3. **Check location filters**
   - Make sure Singapore is in the allowed locations
   - Remove location restrictions if needed

4. **Run manual scan**
   ```bash
   node scan.mjs --verbose
   ```
   This shows detailed output for debugging

---

### Problem: Scanner timeouts

**Symptoms:**
- Scanner hangs on certain companies
- Timeout errors

**Solutions:**

1. **Check internet connection**
   - Make sure you're connected to the internet
   - Try loading the company's careers page in your browser

2. **Reduce number of companies**
   - Start with 20-30 companies
   - Add more as you go

3. **Increase timeout**
   - Edit `portals.yml` and increase timeout settings
   - Or run scanner with `--timeout` flag

---

## Evaluation Issues

### Problem: Evaluation scores seem wrong

**Symptoms:**
- Jobs you think are good get low scores
- Jobs you think are bad get high scores

**Solutions:**

1. **Check your profile**
   - Make sure `config/profile.yml` has your target roles
   - Make sure `modes/_profile.md` has your archetypes

2. **Check your resume**
   - Make sure `cv.md` has quantified achievements
   - Make sure your experience is clearly stated

3. **Review evaluation report**
   - Read the detailed report in `reports/`
   - Check each block score and reasoning

4. **Adjust your profile**
   - If you keep getting low scores on Block C, maybe you need to develop those skills
   - If you keep getting low scores on Block E, maybe you need to adjust your salary expectations

---

### Problem: Evaluation fails

**Symptoms:**
- Error message during evaluation
- Report not generated

**Solutions:**

1. **Check AI model access**
   - Make sure you have access to the AI model
   - Check your API keys if using standalone evaluators

2. **Check job URL**
   - Make sure the job URL is valid
   - Try loading the URL in your browser

3. **Run evaluation manually**
   ```bash
   node reserve-report-num.mjs --count 1
   ```
   Then paste the job URL and run evaluation

---

## PDF Generation Issues

### Problem: PDF generation fails

**Symptoms:**
- Error message about Playwright
- PDF not generated

**Solutions:**

1. **Check Playwright installation**
   ```bash
   npx playwright install chromium
   ```

2. **Check resume file**
   - Make sure `cv.md` exists and is valid markdown
   - Check for syntax errors

3. **Run PDF generation manually**
   ```bash
   node convert-cv-to-pdf.mjs
   ```

---

## Tracker Issues

### Problem: Tracker not updating

**Symptoms:**
- Application status not changing
- New applications not appearing

**Solutions:**

1. **Check applications.md**
   - Make sure the file exists in `data/` directory
   - Check for syntax errors

2. **Run merge command**
   ```bash
   node merge-tracker.mjs
   ```

3. **Update status manually**
   ```bash
   node set-status.mjs --report <report#> Applied
   ```

---

## Dashboard Issues

### Problem: Dashboard shows no data

**Symptoms:**
- Empty dashboard
- No applications displayed

**Solutions:**

1. **Generate dashboard**
   ```bash
   node generate-dashboard.mjs
   ```

2. **Check applications.md**
   - Make sure the file has data
   - Check for syntax errors

3. **Open dashboard in browser**
   - Open `dashboard.html` in your browser
   - Refresh the page

---

## General Issues

### Problem: System runs slowly

**Symptoms:**
- Commands take a long time to complete
- System hangs

**Solutions:**

1. **Check computer resources**
   - Make sure you have enough RAM (8GB recommended)
   - Make sure you have enough disk space

2. **Reduce number of companies**
   - Start with 20-30 companies
   - Add more as you go

3. **Close other applications**
   - Free up system resources
   - Try running the system again

---

### Problem: Unknown error

**Symptoms:**
- Error message you don't recognize
- System behaves unexpectedly

**Solutions:**

1. **Check error message**
   - Read the error message carefully
   - Search for the error message online

2. **Check logs**
   - Look for log files in `data/` directory
   - Check for error details

3. **Ask for help**
   - Post your question on GitHub Discussions
   - Contact the community for support

---

## Getting Help

### GitHub Discussions

Post your question on GitHub Discussions:
https://github.com/sg-job-hunter/sg-job-hunter/discussions

### Community Channels

Join our community for support:
- LinkedIn Group: [TBD]
- Telegram Channel: [TBD]

### Bug Reports

If you found a bug, report it on GitHub:
https://github.com/sg-job-hunter/sg-job-hunter/issues

---

*This guide is updated regularly. Check for the latest version on GitHub.*
