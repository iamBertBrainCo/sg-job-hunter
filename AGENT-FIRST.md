# AI Agent-First Design

## For Non-Technical Users

This document describes how SG Job Hunter works when run through OpenCode (or any AI coding CLI).

---

## Core Principle

**The AI agent runs everything. The user converses.**

| Old Way (CLI) | New Way (AI Agent) |
|---------------|-------------------|
| User types `npm install` | AI agent installs dependencies |
| User types `node scan.mjs` | AI agent runs scanner |
| User types `node evaluate.mjs` | AI agent evaluates jobs |
| User types `npm run convert-cv` | AI agent generates PDFs |
| User reads terminal output | User sees results in chat |
| User opens files manually | AI agent shows files in Review pane |

---

## User Journey (No CLI Required)

### Step 1: Onboarding (5 minutes)

**User:** "I want to find L&D jobs in Singapore"

**AI Agent:**
1. Clones the repo (if not already done)
2. Runs `npm install` and `npx playwright install chromium`
3. Asks user for profile details through conversation
4. Creates `cv.md`, `config/profile.yml`, `modes/_profile.md`
5. Confirms setup is complete

**User experience:** Just a conversation. No commands.

### Step 2: Job Discovery (5 minutes)

**User:** "Find me some jobs"

**AI Agent:**
1. Runs `node scan.mjs` in background
2. Runs `node scrape-jobs.mjs` for aggregator portals
3. Presents results in chat:
   ```
   🔍 Found 28 jobs matching your profile:
   
   🏆 Top 5 Matches:
   1. FutureSkills Singapore — Manager, Skills Development (4.6/5)
   2. GrandStay Hotels — L&D Manager (4.5/5)
   3. AirLink Singapore — Training Manager (4.3/5)
   4. TalentBridge — OD Manager (4.2/5)
   5. ...
   
   Want me to evaluate these in detail?
   ```

**User experience:** Sees results in chat. No terminal.

### Step 3: Evaluation (5 minutes)

**User:** "Yes, evaluate the top 5"

**AI Agent:**
1. Runs evaluation for each job
2. Presents reports in chat:
   ```
   📊 Evaluation Complete:
   
   1. FutureSkills Singapore — 4.6/5 ✅ APPLY
      - Perfect match for workforce development
      - Government role, stable
      - SGD 6,000-9,000 estimated
   
   2. GrandStay Hotels — 4.5/5 ✅ APPLY
      - Strong F&B industry connection
      - Premium hospitality brand
      - SGD 6,000-9,000 estimated
   
   ...
   
   Want me to generate application packages?
   ```

**User experience:** Reads summaries in chat. Can ask for details.

### Step 4: Application Generation (5 minutes)

**User:** "Generate applications for the top 4"

**AI Agent:**
1. Generates tailored CVs, cover letters, emails
2. Converts to PDF
3. Shows PDFs in Review pane:
   ```
   📄 Application packages ready:
   
   ✅ FutureSkills Singapore — CV + Cover Letter + Email
   ✅ GrandStay Hotels — CV + Cover Letter + Email
   ✅ AirLink Singapore — CV + Cover Letter + Email
   ✅ TalentBridge — CV + Cover Letter + Email
   
   Click to preview each PDF. Ready to apply?
   ```

**User experience:** Sees PDFs in Review pane. Can download or preview.

### Step 5: Application Submission (5 minutes)

**User:** "Let me apply"

**AI Agent:**
1. Opens job portal tabs in browser
2. Guides user through upload process:
   ```
   📋 Application Checklist:
   
   1. FutureSkills Singapore
      - URL: [link]
      - Upload: cv-sample-candidate-futureskills.pdf
      - Upload: cover-letter-sample-candidate-futureskills.pdf
      - Status: ⏳ Pending
   
   2. GrandStay Hotels
      - URL: [link]
      - Upload: cv-sample-candidate-grandstay.pdf
      - Upload: cover-letter-sample-candidate-grandstay.pdf
      - Status: ⏳ Pending
   
   ...
   
   I've opened the job pages. Upload the PDFs and click Apply.
   Let me know when you've submitted each one.
   ```

**User experience:** Follows simple checklist. AI agent tracks progress.

### Step 6: Follow-up (Ongoing)

**User:** "When should I follow up?"

**AI Agent:**
1. Calculates follow-up dates
2. Drafts follow-up emails
3. Sets reminders:
   ```
   📅 Follow-up Schedule:
   
   - Day 7 (Nov 8): FutureSkills Singapore, GrandStay Hotels
   - Day 14 (Nov 15): AirLink Singapore, TalentBridge
   - Day 21 (Nov 22): Final follow-up or move on
   
   I've drafted follow-up emails. Want me to send them on schedule?
   ```

**User experience:** AI agent manages follow-up calendar.

---

## Technical Implementation

### What the AI Agent Runs (Invisible to User)

```javascript
// Onboarding
await shell('npm install');
await shell('npx playwright install chromium');
await shell('node doctor.mjs --json --init-templates');

// Job Discovery
await shell('node scan.mjs');
await shell('node scrape-jobs.mjs');
await shell('node scrape-more-jobs.mjs');

// Evaluation
await shell('node reserve-report-num.mjs --count 5');
// Run evaluation for each job (AI model call)

// Application Generation
await shell('npm run convert-cv');
await shell('node convert-cover-letter-to-pdf.mjs');

// Tracking
await shell('node set-status.mjs --report 001 Applied');
await shell('node merge-tracker.mjs');
await shell('node followup-cadence.mjs');
```

**User never sees these commands.** They happen in the background.

### What the User Sees

```
User: "Find me L&D jobs in Singapore"
AI: 🔍 Found 28 jobs. Top 5: [list]
User: "Evaluate these"
AI: 📊 Evaluations complete. 4 jobs scored 4.0+. Want applications?
User: "Yes"
AI: 📄 Applications ready. Preview PDFs here.
User: "Apply to all 4"
AI: 📋 Checklist ready. I've opened the job pages.
```

---

## Playwright Limitations & Alternatives

### Current Limitation

Playwright requires:
- Installation (`npx playwright install chromium`)
- Browser download (~300MB)
- System dependencies

### Alternative: WebFetch + WebSearch

For users who can't install Playwright:

```javascript
// Instead of Playwright scraping
const jobs = await websearch('site:mycareersfuture.gov.sg "Learning & Development"');
const jd = await webfetch('https://www.mycareersfuture.gov.sg/job/...');
```

**Trade-offs:**
| Approach | Pros | Cons |
|----------|------|------|
| **Playwright** | Reliable scraping, handles dynamic content | Requires installation, slower |
| **WebFetch/WebSearch** | No installation, fast | May miss dynamic content, rate limits |

### Recommendation

**For OpenCode harness:**
1. **Try Playwright first** — AI agent installs it automatically
2. **Fall back to WebFetch/WebSearch** — If Playwright fails
3. **User never knows the difference** — Same conversation flow

---

## Teaching Non-Technical Users

### Lesson Plan Adjustment

**Old approach:** Teach CLI commands
**New approach:** Teach conversation patterns

| Day | Old Lesson | New Lesson |
|-----|-----------|------------|
| 1 | Setup CLI, install dependencies | Tell AI your profile, review CV |
| 2 | Run scanner, check results | Ask AI to find jobs, review matches |
| 3 | Evaluate jobs manually | Ask AI to evaluate, review scores |
| 4 | Generate PDFs manually | Ask AI to generate applications |
| 5 | Submit applications | Follow AI's checklist, upload PDFs |

### Key Teaching Points

1. **Conversation patterns:** "Find me jobs", "Evaluate these", "Generate applications"
2. **Reviewing outputs:** Reading reports, previewing PDFs
3. **Decision making:** Which jobs to apply to, when to follow up
4. **Human-in-the-loop:** Always review before submitting

### No Technical Prerequisites

Users need:
- ✅ OpenCode account (or any AI coding CLI)
- ✅ Internet connection
- ✅ Basic computer literacy (click, upload, download)

Users DON'T need:
- ❌ CLI knowledge
- ❌ Node.js installation
- ❌ Git knowledge
- ❌ Programming skills

---

## Implementation Checklist

### For the AI Agent (Me)

- [ ] Auto-install dependencies on first run
- [ ] Auto-initialize templates on first run
- [ ] Run scripts in background, present results in chat
- [ ] Show PDFs in Review pane
- [ ] Open job portal tabs in browser
- [ ] Track application status automatically
- [ ] Calculate follow-up dates automatically
- [ ] Draft follow-up emails automatically

### For the User

- [ ] Tell AI their profile details
- [ ] Review CV and profile
- [ ] Review job matches and evaluations
- [ ] Review application packages
- [ ] Upload PDFs to job portals
- [ ] Click "Apply" buttons
- [ ] Confirm when applications are submitted

---

## Conclusion

**The system is designed for AI agents, not CLI users.**

The `.mjs` scripts are the engine. The AI agent is the driver. The user is the passenger.

**User journey:** Conversation → Results → Decision → Action
**Technical journey:** Scripts → Data → Reports → PDFs

**Same system. Different interface.**

---

*This design makes the system accessible to non-technical users while retaining all the power of the underlying scripts.*
