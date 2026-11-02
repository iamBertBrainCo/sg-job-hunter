# Automatic Setup Flow

## For Non-Technical Users (AI Agent-First)

This document describes the automatic setup flow that the AI agent runs when a new user starts.

---

## User Experience

```
User: "I want to find L&D jobs in Singapore"
      ↓
AI Agent: "Great! Let me set up your job search system. This takes 2-3 minutes."
          "Installing dependencies... ✅"
          "Downloading browser for job scraping... ✅"
          "Creating your profile templates... ✅"
          "Setup complete! Now tell me about your experience..."
      ↓
User: "I have 10 years in L&D and training..."
      ↓
AI Agent: Creates cv.md, config/profile.yml, modes/_profile.md
          "Here's your profile. Looks good?"
      ↓
User: "Yes, looks good"
      ↓
AI Agent: "Great! Let's find some jobs."
```

**User never sees:** Terminal commands, file paths, error messages
**User sees:** Progress messages, questions, results

---

## AI Agent Setup Flow

### Step 1: Check Prerequisites

```javascript
// Check if Node.js is available
const nodeVersion = await shell('node --version');
if (!nodeVersion.includes('v18') && !nodeVersion.includes('v20')) {
  console.log('⚠️ Node.js 18+ required. Please update Node.js.');
  return;
}

// Check if Git is available
const gitVersion = await shell('git --version');
if (!gitVersion) {
  console.log('⚠️ Git required. Please install Git.');
  return;
}
```

**User sees:** Nothing (prerequisites usually already installed in OpenCode)

### Step 2: Clone Repository

```javascript
// Check if repo exists
const repoExists = await shell('ls -la sg-job-hunter');
if (!repoExists) {
  console.log('📦 Cloning job search system...');
  await shell('git clone https://github.com/sg-job-hunter/sg-job-hunter.git');
  await shell('cd sg-job-hunter');
}
```

**User sees:** "📦 Cloning job search system..."

### Step 3: Install Dependencies

```javascript
console.log('🔧 Installing dependencies...');
await shell('npm install');
console.log('✅ Dependencies installed');
```

**User sees:** "🔧 Installing dependencies... ✅ Dependencies installed"

### Step 4: Install Playwright Browser

```javascript
console.log('🌐 Downloading browser for job scraping (2 minutes)...');
await shell('npx playwright install chromium');
console.log('✅ Browser downloaded');
```

**User sees:** "🌐 Downloading browser for job scraping (2 minutes)... ✅ Browser downloaded"

### Step 5: Initialize Templates

```javascript
console.log('📝 Creating your profile templates...');
await shell('node doctor.mjs --json --init-templates');
console.log('✅ Templates created');
```

**User sees:** "📝 Creating your profile templates... ✅ Templates created"

### Step 6: Verify Setup

```javascript
console.log('✅ Setup complete!');
console.log('Your job search system is ready.');
console.log('Now tell me about your experience...');
```

**User sees:** "✅ Setup complete! Your job search system is ready. Now tell me about your experience..."

---

## Error Handling

### Playwright Installation Fails

```javascript
try {
  await shell('npx playwright install chromium');
} catch (error) {
  console.log('⚠️ Browser download failed. Let me try again...');
  await shell('npx playwright install chromium');
  
  if (stillFailed) {
    console.log('❌ Browser download failed. Please check your internet connection.');
    console.log('You can still use the system, but some features will be limited.');
  }
}
```

**User sees:** "⚠️ Browser download failed. Let me try again... ❌ Please check your internet connection."

### npm Install Fails

```javascript
try {
  await shell('npm install');
} catch (error) {
  console.log('❌ Dependency installation failed. Please check your internet connection.');
  console.log('Error:', error.message);
}
```

**User sees:** "❌ Dependency installation failed. Please check your internet connection."

---

## Conversation Flow

### Onboarding Conversation

```
AI: "Great! Let me set up your job search system. This takes 2-3 minutes."
AI: "🔧 Installing dependencies... ✅"
AI: "🌐 Downloading browser for job scraping (2 minutes)... ✅"
AI: "📝 Creating your profile templates... ✅"
AI: "✅ Setup complete!"
AI: "Now let's create your profile. Tell me about your experience:"
AI: "1. What's your current role?"
AI: "2. How many years of experience do you have?"
AI: "3. What roles are you targeting?"
AI: "4. What's your salary expectation?"
AI: "5. Any deal-breakers? (e.g., no on-site, no startups)"

User: "I'm a Training Manager with 8 years experience. I want L&D Manager roles. SGD 7,000-9,000. No sales roles."

AI: "Got it. Let me create your profile..."
AI: "Here's your profile:"
AI: "- Target roles: L&D Manager, Training Manager, Talent Development"
AI: "- Salary: SGD 7,000-9,000"
AI: "- Location: Singapore"
AI: "- Deal-breakers: No sales roles"
AI: "Looks good?"

User: "Yes, looks good"

AI: "Great! Let's find some jobs."
```

### Job Discovery Conversation

```
User: "Find me some jobs"

AI: "🔍 Scanning 163+ companies..."
AI: "📊 Found 28 jobs matching your profile:"
AI: ""
AI: "🏆 Top 5 Matches:"
AI: "1. FutureSkills Singapore — Manager, Skills Development (4.6/5)"
AI: "2. GrandStay Hotels — L&D Manager (4.5/5)"
AI: "3. AirLink Singapore — Training Manager (4.3/5)"
AI: "4. TalentBridge — OD Manager (4.2/5)"
AI: "5. ... "
AI: ""
AI: "Want me to evaluate these in detail?"

User: "Yes, evaluate the top 5"

AI: "📊 Evaluating jobs..."
AI: "✅ Evaluations complete:"
AI: ""
AI: "1. FutureSkills Singapore — 4.6/5 ✅ APPLY"
AI: "   - Perfect match for workforce development"
AI: "   - Government role, stable"
AI: "   - SGD 6,000-9,000 estimated"
AI: ""
AI: "2. GrandStay Hotels — 4.5/5 ✅ APPLY"
AI: "   - Strong F&B industry connection"
AI: "   - Premium hospitality brand"
AI: "   - SGD 6,000-9,000 estimated"
AI: ""
AI: "..."
AI: ""
AI: "Want me to generate application packages?"

User: "Yes, generate applications for the top 4"

AI: "📄 Generating application packages..."
AI: "✅ Applications ready:"
AI: ""
AI: "✅ FutureSkills Singapore — CV + Cover Letter + Email"
AI: "✅ GrandStay Hotels — CV + Cover Letter + Email"
AI: "✅ AirLink Singapore — CV + Cover Letter + Email"
AI: "✅ TalentBridge — CV + Cover Letter + Email"
AI: ""
AI: "Click to preview each PDF. Ready to apply?"

User: "Let me apply"

AI: "📋 Application Checklist:"
AI: ""
AI: "1. FutureSkills Singapore"
AI: "   - URL: [link]"
AI: "   - Upload: cv-sample-candidate-futureskills.pdf"
AI: "   - Upload: cover-letter-sample-candidate-futureskills.pdf"
AI: "   - Status: ⏳ Pending"
AI: ""
AI: "2. GrandStay Hotels"
AI: "   - URL: [link]"
AI: "   - Upload: cv-sample-candidate-grandstay.pdf"
AI: "   - Upload: cover-letter-sample-candidate-grandstay.pdf"
AI: "   - Status: ⏳ Pending"
AI: ""
AI: "..."
AI: ""
AI: "I've opened the job pages. Upload the PDFs and click Apply."
AI: "Let me know when you've submitted each one."

User: "I've submitted all 4"

AI: "✅ Great! I've updated your tracker."
AI: "📅 Follow-up Schedule:"
AI: "- Day 7 (Nov 8): FutureSkills Singapore, GrandStay Hotels"
AI: "- Day 14 (Nov 15): AirLink Singapore, TalentBridge"
AI: "- Day 21 (Nov 22): Final follow-up or move on"
AI: ""
AI: "I've drafted follow-up emails. Want me to send them on schedule?"
```

---

## Implementation Checklist

### For the AI Agent

- [ ] Auto-check prerequisites (Node.js, Git)
- [ ] Auto-clone repository
- [ ] Auto-install dependencies (`npm install`)
- [ ] Auto-install Playwright browser (`npx playwright install chromium`)
- [ ] Auto-initialize templates (`node doctor.mjs --json --init-templates`)
- [ ] Auto-verify setup
- [ ] Ask user for profile details through conversation
- [ ] Create `cv.md`, `config/profile.yml`, `modes/_profile.md`
- [ ] Show profile preview for user confirmation
- [ ] Run scanner when user asks for jobs
- [ ] Present results in chat
- [ ] Run evaluations when user asks
- [ ] Present reports in chat
- [ ] Generate application packages when user asks
- [ ] Show PDFs in Review pane
- [ ] Open job portal tabs in browser
- [ ] Guide user through upload process
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

**The system is fully automatic.** The AI agent runs everything. The user converses.

**User journey:** Conversation → Results → Decision → Action
**Technical journey:** Scripts → Data → Reports → PDFs

**Same system. Different interface.**

---

*This flow makes the system accessible to non-technical users while retaining all the power of the underlying scripts.*
