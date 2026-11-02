# Build Roadmap: SG Job Hunter

## Goal: Package SG Job Hunter into a teachable system for Singapore job seekers

---

## Phase 1: Foundation ✅

### Completed
- [x] Created repo structure (`sg-job-hunter/`)
- [x] Written comprehensive README.md
- [x] Created 5-day learning programme (`programme/README.md`)
- [x] Created Singapore-specific evaluation rules (`modes/sg/_shared.md`)
- [x] Created example config files (`config/profile.example.yml`)
- [x] Created example CV template (`cv.example.md`)
- [x] Created example portals file (`portals.example.yml`)
- [x] Created .gitignore
- [x] Created Getting Started guide (`GETTING_STARTED.md`)
- [x] Generated 4 application packages (CVs + cover letters + emails + PDFs)
- [x] Updated applications tracker with 8 entries
- [x] Created dashboard with theme system
- [x] Created template gallery with ATS linting
- [x] Fixed all critical pre-launch issues

### Output Files
```
sg-job-hunter/
├── README.md                    # Main documentation
├── GETTING_STARTED.md           # Step-by-step guide
├── cv.example.md                # Example CV template
├── portals.example.yml          # Example companies config
├── .gitignore                   # Git ignore rules
├── LICENSE                      # MIT license
├── SECURITY.md                  # Security policy
├── CONTRIBUTING.md              # Contribution guidelines
├── CODE_OF_CONDUCT.md           # Code of conduct
├── dashboard.html               # Application dashboard
├── config/
│   └── profile.example.yml      # Example profile config
├── modes/
│   └── sg/
│       └── _shared.md           # Singapore market rules
├── examples/
│   ├── template-gallery.html    # Template gallery
│   └── template-previews/       # Template previews
└── programme/
    └── README.md                # 5-day learning programme
```

### Remaining Today
- [ ] Copy scripts to new repo
- [ ] Create package.json with dependencies
- [ ] Test the setup with a clean clone
- [ ] Push to GitHub

---

## Phase 2: Script Integration & Testing ✅

### Completed
- [x] Copy essential `.mjs` scripts (77+ scripts)
- [x] Create `package.json` with dependencies
- [x] Create test workflow (`TEST-WORKFLOW.md`)
- [x] Create troubleshooting guide (`TROUBLESHOOTING.md`)
- [x] Create 4 video tutorial scripts (`tutorials/`)
- [x] Update README with tutorial links
- [x] Rename project to "SG Job Hunter" across all files
- [x] Fix all broken npm scripts
- [x] Create unified entry point (`lib/index.mjs`)

### Output Files
```
sg-job-hunter/
├── TEST-WORKFLOW.md             # End-to-end test verification
├── TROUBLESHOOTING.md           # Common issues & solutions
├── tutorials/                   # 4 video scripts (40 min total)
│   ├── tutorial-1-setup.md
│   ├── tutorial-2-scanner.md
│   ├── tutorial-3-evaluation.md
│   └── tutorial-4-applications.md
└── lib/                         # 77+ automation scripts
```

### Remaining Today
- [ ] Run test workflow on clean directory
- [ ] Record 4 video tutorials
- [ ] Push to GitHub

---

## Phase 3: Content & Templates ✅

### Completed
- [x] Create 3 example profiles:
  - [x] L&D Professional (mid-career)
  - [x] Creative Technologist (senior)
  - [x] Career Changer (from corporate to L&D)
- [x] Create sample application packages for each profile
- [x] Create examples README with usage guide
- [x] Create template gallery system
- [x] Add ATS linting to all templates

### Output Files
```
examples/
├── README.md                          # How to use examples
├── sample-profiles/
│   ├── ld-professional.md             # L&D Professional profile
│   ├── creative-technologist.md       # Creative Technologist profile
│   └── career-changer.md              # Career Changer profile
├── sample-output/
│   ├── ld-professional-application.md  # L&D application package
│   ├── creative-technologist-application.md # Creative Tech application package
│   └── career-changer-application.md   # Career Changer application package
├── template-gallery.html              # Visual template gallery
└── template-previews/                 # Individual template previews
```

### Remaining Today
- [ ] Create quiz/assessment for each day of the programme
- [ ] Create certificate of completion template
- [ ] Create learner workbook (printable PDF)
- [ ] Create facilitator guide (detailed lesson plans)

---

## Phase 4: Community & Scaling (Upcoming)

### Goals
- Set up community channels
- Create contribution guidelines
- Plan for scaling to more learners

### Tasks
- [ ] Create GitHub Discussions template
- [ ] Create issue templates (bug report, feature request, question) ✅
- [ ] Create Pull Request template ✅
- [ ] Write CONTRIBUTING.md ✅
- [ ] Write CODE_OF_CONDUCT.md ✅
- [ ] Create LinkedIn group or Telegram channel for learners
- [ ] Create referral programme (learners refer learners)
- [ ] Create alumni network plan
- [ ] Plan for async learning (recorded sessions)

### Deliverables
- GitHub templates ✅
- Community channels
- Contribution guidelines ✅
- Scaling plan

---

## Phase 5: Launch & First Cohort (Upcoming)

### Goals
- Launch the repo publicly
- Recruit first cohort of learners
- Run pilot programme

### Tasks
- [ ] Final review of all documentation
- [ ] Create launch announcement (LinkedIn post)
- [ ] Create promotional materials (carousel, infographic)
- [ ] Recruit first cohort (10-15 learners)
- [ ] Set up scheduling for 5-day programme
- [ ] Run pilot programme
- [ ] Collect feedback
- [ ] Iterate based on feedback

### Deliverables
- Public repo launch
- First cohort recruited
- Pilot programme completed
- Feedback collected
- Iteration plan

---

## Success Metrics

### By End of Week
- ✅ Repo has 100+ stars on GitHub
- ✅ First cohort completes 5-day programme
- ✅ 10+ learners have submitted applications
- ✅ 3+ learners have interviews scheduled
- ✅ Feedback score 4.0+/5.0

### By End of Month
- ✅ 50+ learners have gone through the programme
- ✅ 50+ applications submitted
- ✅ 10+ interviews
- ✅ 2+ offers
- ✅ Programme refined based on feedback

### By End of Quarter
- ✅ 200+ learners
- ✅ 200+ applications
- ✅ 50+ interviews
- ✅ 10+ offers
- ✅ Programme running asynchronously (recorded sessions)
- ✅ Community self-sustaining

---

## Risks & Mitigation

### Risk: Learners struggle with technical setup
**Mitigation:** Create video tutorials, offer 1-on-1 support for first cohort

### Risk: Not enough job matches for all learners
**Mitigation:** Expand company list, add more job portals, teach manual discovery

### Risk: Low completion rate
**Mitigation:** Create accountability partners, weekly check-ins, certificate incentive

### Risk: System doesn't work for all roles
**Mitigation:** Collect feedback, iterate quickly, create role-specific templates

---

## Resources Needed

### Time
- **You:** 2-3 hours/day for 5 days
- **Learners:** 2-3 hours/day for 5 days

### Tools
- GitHub repo (free)
- LinkedIn account (free)
- Zoom/Google Meet (free for small groups)
- Screen recording software (free: OBS, QuickTime)

### Budget
- **Minimal:** Free tools, volunteer learners
- **Recommended:** LinkedIn Premium for job searches, Zoom Pro for larger groups

---

## Next Steps (Today)

1. **Copy scripts** to new repo
2. **Create package.json** with dependencies
3. **Test the setup** with a clean clone
4. **Push to GitHub**
5. **Create LinkedIn announcement** for first cohort

---

*This roadmap is designed to be aggressive but achievable. Focus on delivering value to the first cohort, then iterate based on feedback.*
