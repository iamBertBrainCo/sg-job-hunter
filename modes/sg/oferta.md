# Singapore-Specific Evaluation Mode

## For Evaluating Jobs in the Singapore Market

This mode supplements the default evaluation rules with Singapore-specific context for Blocks D, E, F, and G.

## Loading This Mode

Add to `config/profile.yml`:

```yaml
language:
  output: "en"
  modes_dir: "modes/sg"
```

## Evaluation Adjustments

### Block D: Location & Logistics

**Singapore-specific factors:**

- **Commute time:** >45 minutes one way is considered long
- **ERP charges:** Electronic Road Pricing during peak hours
- **Public transport:** MRT + bus, ~SGD 1,500/month with monthly pass
- **Work arrangement:** Hybrid (2-3 days office) is common post-pandemic

**Location zones:**
- **CCA (Central Business District):** Raffles Place, Marina Bay, Orchard
- **East:** Paya Lebar, Tanglin, Katong
- **West:** Buona Vista, Clementi, Jurong
- **North:** Woodlands, Sengkang, Yishun
- **North East:** Punggol, Serangoon, Hougang

**Adjust Block D based on commute:**
- Same zone or <30 min commute: No adjustment
- 30-45 min commute: -0.5
- >45 min commute: -1.0
- Remote/hybrid option: +0.5

### Block E: Compensation

**Singapore salary benchmarks (monthly, gross SGD):**

| Role | Entry (0-3 yr) | Mid (4-7 yr) | Senior (8+ yr) |
|------|----------------|--------------|----------------|
| Training Executive | 3,000 | 4,000 | 5,000 |
| Training Manager | 4,500 | 6,500 | 8,500 |
| L&D Manager | 5,000 | 7,000 | 9,000 |
| OD Manager | 6,000 | 8,000 | 10,000 |
| Creative Technologist | 5,000 | 7,000 | 9,000 |

**Consider total compensation:**
- Base salary + monthly allowance + annual bonus + CPF employer contribution
- Typical bonus: 1-3 months (government: 1-2, private: 2-3)
- CPF employer: 17% of salary (significant hidden value)

**Example:** SGD 7,000/month + 2 months bonus + 17% CPF = ~SGD 105,000/year total value

**Adjust scores based on market rates:**
- Above market by 20%+: +0.5 to Block E score
- At market: No adjustment
- Below market by 10-20%: -0.5 to Block E score
- Below market by 20%+: -1.0 to Block E score

### Block F: Culture & Mission Fit

**Singapore-specific cultural factors:**

- **Hierarchy:** Respect for seniority and title
- **Communication:** Indirect, save face, avoid confrontation
- **Work-life balance:** Improving but still long hours in many sectors
- **Diversity:** Multi-racial (Chinese, Malay, Indian, Others), multi-religious
- **Government influence:** Strong government presence in economy

**Sector characteristics:**
- **Government/Statutory Boards:** Stable, structured, slower decision-making, good benefits
- **Multinationals:** Global standards, diverse, competitive, good compensation
- **Local companies:** Family-owned common, hierarchical, loyal workforce
- **Startups:** Fast-paced, flexible, risky, equity compensation common

### Block G: Posting Legitimacy

**Singapore-specific legitimacy signals:**

**Positive signals:**
- Listed on MyCareersFuture (government-verified)
- Company registered with ACRA (Accounting and Corporate Regulatory Authority)
- Has physical office address in Singapore
- Has Singapore LinkedIn company page with employees
- Mentions CPF, Employment Pass, or local benefits

**Negative signals:**
- No Singapore office address
- No ACRA registration number
- Salary in foreign currency without explanation
- Vague company description
- No LinkedIn presence in Singapore

**Aggregator warning:**
- JobStreet, LinkedIn, Glassdoor listings should be verified at employer's careers page
- MyCareersFuture listings are government-verified but still check employer presence

## Work Pass Considerations

### For Foreign Candidates

**Employment Pass (EP):**
- Minimum salary: SGD 5,000/month (increasing to SGD 6,000 in 2025)
- COMPASS framework: Points-based system (salary, diversity, support for locals)
- Valid for 1-3 years, renewable

**S Pass:**
- Minimum salary: SGD 3,150/month (increasing to SGD 3,500 in 2025)
- Quota system: Companies limited by company size and sector
- Valid for 2 years, renewable

**Adjust evaluation for work pass requirements:**
- If candidate needs EP/S Pass and company hasn't sponsored before: -0.5 to Block D
- If company is known EP sponsor: No adjustment
- If salary below EP threshold: -1.0 to Block D (unless S Pass eligible)

## Seasonal Patterns

**Best times to apply:**
- **January-March:** Post-year-end budget approval, new hires planned
- **July-August:** Mid-year budget adjustments, holiday coverage
- **November-December:** Next year planning, urgent hires

**Slow times:**
- **April-June:** Year-end evaluations, frozen hiring
- **September-October:** Back from holidays, planning mode

**Adjust Block D based on timing:**
- Applying in peak season: +0.5
- Applying in slow season: -0.5

## Local Vocabulary

Use these terms in evaluations and applications:

| Term | Meaning |
|------|---------|
| PMET | Professional, Manager, Executive, Technician |
| CPF | Central Provident Fund (retirement savings) |
| EP | Employment Pass (work visa for professionals) |
| S Pass | Work visa for mid-level skilled workers |
| MYT | Mid-Career Pathway (government programme) |
| WSG | Workforce Singapore |
| SSG | SkillsFuture Singapore |
| NTUC | National Trades Union Congress |
| e2i | Employment and Employability Institute |
| ACRA | Accounting and Corporate Regulatory Authority |
| ERP | Electronic Road Pricing (toll charges) |
| MRT | Mass Rapid Transit (train system) |
| HDB | Housing Development Board (public housing) |
| CDC | Community Development Council |
| PA | People's Association |
| WSQ | Workforce Skills Qualifications |
| COMPASS | Points-based work pass system |

---

*This mode is loaded automatically when evaluating jobs in the Singapore market. It supplies local context for Blocks D, E, F, and G.*
