#!/usr/bin/env node

/**
 * onboard.mjs — Interactive Onboarding for Non-Technical Job Seekers
 *
 * Guides users through setting up their job search profile step by step.
 * No technical knowledge required — just answer questions.
 *
 * Usage:
 *   node onboard.mjs              # Full interactive onboarding
 *   node onboard.mjs --resume     # Import from existing resume file
 *   node onboard.mjs --profile    # Edit profile only
 *   node onboard.mjs --search     # Start job search directly
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const ROOT = __dirname;

// ─── Color Helpers ───

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

function log(msg, color = 'reset') { console.log(`${c[color]}${msg}${c.reset}`); }
function section(title) {
  console.log('');
  log('─'.repeat(60), 'cyan');
  log(`  ${title}`, 'bold');
  log('─'.repeat(60), 'cyan');
}

function success(msg) { log(`✅ ${msg}`, 'green'); }
function warn(msg) { log(`⚠️  ${msg}`, 'yellow'); }
function info(msg) { log(`   ${msg}`, 'gray'); }

// ─── Input Helpers ───

function question(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

function menu(title, options) {
  log(`${title}`, 'bold');
  options.forEach((opt, i) => log(`  ${i + 1}) ${opt.label}`, 'cyan'));
  return question('Choose (number): ');
}

// ─── Industry Database ───

const INDUSTRIES = {
  tech: {
    name: 'Technology / Software Engineering',
    roles: {
      primary: ['Software Engineer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer'],
      secondary: ['Mobile Developer', 'DevOps Engineer', 'Site Reliability Engineer', 'Solutions Architect'],
    },
    salary: { junior: '$5,500 – $7,500', mid: '$7,000 – $12,000', senior: '$10,000 – $15,000+' },
    keywords: ['software', 'engineering', 'developer', 'programming', 'full stack', 'backend', 'frontend', 'mobile', 'devops', 'cloud'],
  },
  data: {
    name: 'Data & AI',
    roles: {
      primary: ['Data Scientist', 'Data Engineer', 'Machine Learning Engineer', 'AI Engineer'],
      secondary: ['Data Analyst', 'Business Intelligence Analyst', 'ML Ops Engineer', 'Data Architect'],
    },
    salary: { junior: '$4,000 – $8,500', mid: '$7,000 – $15,000', senior: '$11,000 – $20,000+' },
    keywords: ['data', 'analytics', 'machine learning', 'AI', 'ML', 'data science', 'data engineering', 'BI', 'business intelligence'],
  },
  finance: {
    name: 'Finance & Banking',
    roles: {
      primary: ['Financial Analyst', 'Risk Manager', 'Compliance Officer', 'Investment Analyst'],
      secondary: ['FP&A Manager', 'Treasury Manager', 'Wealth Manager', 'Fintech Product Manager'],
    },
    salary: { junior: '$4,000 – $7,500', mid: '$6,500 – $14,000', senior: '$10,000 – $22,000+' },
    keywords: ['finance', 'banking', 'investment', 'risk', 'compliance', 'treasury', 'FP&A', 'fintech', 'wealth'],
  },
  lifecycle: {
    name: 'Life Sciences & Pharmaceuticals',
    roles: {
      primary: ['Regulatory Affairs Manager', 'QA Manager', 'Process Development Scientist', 'Biotechnologist'],
      secondary: ['Clinical Affairs Specialist', 'QC Analyst', 'Validation Engineer', 'Medical Science Liaison'],
    },
    salary: { junior: '$3,500 – $7,000', mid: '$6,500 – $14,000', senior: '$10,000 – $20,000+' },
    keywords: ['pharmaceutical', 'biotech', 'regulatory', 'GMP', 'QA', 'QC', 'clinical', 'biotechnology', 'life sciences'],
  },
  manufacturing: {
    name: 'Manufacturing & Semiconductor',
    roles: {
      primary: ['Process Engineer', 'Automation Engineer', 'Production Manager', 'Quality Engineer'],
      secondary: ['Equipment Engineer', 'Manufacturing Engineer', 'Industrial Engineer', 'Plant Manager'],
    },
    salary: { junior: '$4,000 – $5,800', mid: '$5,600 – $8,200', senior: '$8,000 – $12,000+' },
    keywords: ['manufacturing', 'semiconductor', 'process', 'production', 'automation', 'quality', 'plant', 'operations'],
  },
  green: {
    name: 'Green Economy & Sustainability',
    roles: {
      primary: ['Sustainability Manager', 'ESG Consultant', 'Energy Efficiency Manager', 'Carbon Footprint Analyst'],
      secondary: ['Green Building Consultant', 'Climate Risk Analyst', 'Circular Economy Specialist', 'Renewable Energy Engineer'],
    },
    salary: { junior: '$3,500 – $7,000', mid: '$6,500 – $12,000', senior: '$10,000 – $18,000+' },
    keywords: ['sustainability', 'ESG', 'green', 'carbon', 'renewable', 'energy efficiency', 'climate', 'circular economy'],
  },
  care: {
    name: 'Care Economy & Social Services',
    roles: {
      primary: ['Social Worker', 'Clinical Psychologist', 'Community Care Manager', 'Programme Manager'],
      secondary: ['Occupational Therapist', 'Physiotherapist', 'Counsellor', 'Medical Social Worker'],
    },
    salary: { junior: '$3,000 – $5,000', mid: '$5,000 – $9,000', senior: '$8,000 – $15,000+' },
    keywords: ['social work', 'care', 'counselling', 'therapy', 'community care', 'mental health', 'elderly care'],
  },
  marketing: {
    name: 'Digital Marketing & Creative',
    roles: {
      primary: ['Digital Marketing Manager', 'Performance Marketing Specialist', 'SEO Specialist', 'E-commerce Manager'],
      secondary: ['Content Marketing Manager', 'Social Media Manager', 'Growth Hacker', 'Brand Manager'],
    },
    salary: { junior: '$3,500 – $6,000', mid: '$5,000 – $12,000', senior: '$8,000 – $18,000+' },
    keywords: ['marketing', 'digital marketing', 'SEO', 'SEM', 'e-commerce', 'content', 'social media', 'brand'],
  },
  consulting: {
    name: 'Consulting & Professional Services',
    roles: {
      primary: ['Management Consultant', 'Strategy Consultant', 'HR Consultant', 'Change Management Consultant'],
      secondary: ['IT Systems Consultant', 'Legal Consultant', 'Patent Attorney', 'Business Analyst'],
    },
    salary: { junior: '$3,800 – $8,000', mid: '$7,000 – $13,000', senior: '$10,000 – $22,000+' },
    keywords: ['consulting', 'consultant', 'strategy', 'management', 'advisory', 'professional services'],
  },
  supplychain: {
    name: 'Supply Chain & Logistics',
    roles: {
      primary: ['Supply Chain Manager', 'Logistics Manager', 'Procurement Manager', 'Operations Manager'],
      secondary: ['Planning Manager', 'Warehouse Manager', 'Sourcing Manager', 'Distribution Manager'],
    },
    salary: { junior: '$3,500 – $6,000', mid: '$5,000 – $12,000', senior: '$8,000 – $17,000+' },
    keywords: ['supply chain', 'logistics', 'procurement', 'operations', 'planning', 'warehouse', 'distribution'],
  },
  ld: {
    name: 'Learning & Development / OD',
    roles: {
      primary: ['Learning & Development Manager', 'Organisational Development Manager', 'Training Manager', 'Talent Development Consultant'],
      secondary: ['Learning Designer', 'Curriculum Developer', 'Capability Development Manager', 'Workforce Development Manager'],
    },
    salary: { junior: '$3,000 – $5,000', mid: '$5,000 – $8,000', senior: '$8,000 – $13,000+' },
    keywords: ['learning', 'development', 'training', 'organisational development', 'L&D', 'OD', 'talent development'],
  },
  other: {
    name: 'Other / Mixed Industries',
    roles: {
      primary: ['Your Role Title 1', 'Your Role Title 2', 'Your Role Title 3'],
      secondary: ['Your Role Title 4', 'Your Role Title 5', 'Your Role Title 6'],
    },
    salary: { junior: 'Market rate', mid: 'Market rate', senior: 'Market rate' },
    keywords: [],
  },
};

// ─── Profile Builder ───

async function buildProfile() {
  section('👤 Step 1: Your Details');

  const name = await question('What is your full name? ');
  const email = await question('What is your email address? ');
  const phone = await question('What is your phone number? (e.g., +65 9XXX XXXX) ');
  const years = await question('How many years of professional experience do you have? ');
  const linkedin = await question('LinkedIn profile URL? (press Enter to skip) ');

  return {
    candidate: {
      full_name: name || 'Your Full Name',
      email: email || 'your.email@example.com',
      phone: phone || '+65 9XXX XXXX',
      years_of_experience: years ? parseInt(years) : 5,
      location: 'Singapore',
      timezone: 'Asia/Singapore',
      ...(linkedin && { linkedin }),
    },
  };
}

async function selectIndustry() {
  section('🏢 Step 2: Your Industry');

  log('What industry are you targeting for your next role?', 'bold');
  log('', 'reset');

  const options = Object.entries(INDUSTRIES).map(([key, ind]) => ({
    key, label: `${ind.name} (Mid: ${ind.salary.mid})`,
  }));

  options.forEach((opt, i) => log(`  ${i + 1}) ${opt.label}`, 'cyan'));
  log('', 'reset');

  const choice = await question('Choose your industry (number): ');
  const selected = options[parseInt(choice) - 1];

  if (!selected) {
    warn('Invalid selection — defaulting to Technology');
    return INDUSTRIES.tech;
  }

  return INDUSTRIES[selected.key];
}

async function customizeRoles(industry) {
  section('🎯 Step 3: Your Target Roles');

  log(`Suggested roles for ${industry.name}:`, 'bold');
  log('Primary:', 'cyan');
  industry.roles.primary.forEach(r => log(`  • ${r}`, 'gray'));
  log('Secondary:', 'cyan');
  industry.roles.secondary.forEach(r => log(`  • ${r}`, 'gray'));
  log('', 'reset');

  const customize = await question('Use these suggestions? (yes/no) — type "no" to customize ');
  if (customize.toLowerCase() === 'no') {
    log('Enter your target roles (comma-separated):', 'bold');
    const primary = await question('Primary roles: ');
    const secondary = await question('Secondary roles: ');
    return {
      primary: primary.split(',').map(s => s.trim()).filter(Boolean),
      secondary: secondary.split(',').map(s => s.trim()).filter(Boolean),
    };
  }

  return industry.roles;
}

async function setCompensation(industry, years) {
  section('💰 Step 4: Salary Expectations');

  const level = years < 3 ? 'junior' : years < 7 ? 'mid' : 'senior';
  log(`Based on your experience (${years} years), market rate for your sector:`, 'bold');
  log(`  Junior: ${industry.salary.junior}`, 'cyan');
  log(`  Mid: ${industry.salary.mid}`, 'cyan');
  log(`  Senior: ${industry.salary.senior}`, 'cyan');
  log('', 'reset');

  const target = await question(`What is your target monthly salary range? (e.g., "SGD 7,000 - 10,000") `);
  const minimum = await question('What is your minimum acceptable salary? (e.g., "SGD 6,000") ');

  return {
    target_range: target || `SGD ${industry.salary.mid}`,
    currency: 'SGD',
    minimum: minimum || 'SGD 5,000',
    notes: '- Monthly gross salary\n- Open to total compensation discussion (bonus, CPF, allowances)\n- Government roles: accept market rate for grade\n- Startup roles: open to equity discussion',
  };
}

async function setDealBreakers() {
  section('🚫 Step 5: Deal Breakers');

  log('What would make you automatically reject a job?', 'bold');
  log('Examples: "No sales roles", "No shift work", "No on-site only"', 'cyan');
  log('', 'reset');

  const breakers = await question('List your deal breakers (comma-separated, or press Enter to skip): ');

  return breakers
    ? breakers.split(',').map(s => s.trim()).filter(Boolean)
    : ['No sales roles (unless technical sales)', 'No junior roles (Executive, Assistant, Associate)'];
}

async function setNarrative() {
  section('📝 Step 6: Your Story');

  log('Help us tell your story to potential employers.', 'bold');
  log('', 'reset');

  const headline = await question('Professional headline? (e.g., "Data Engineer building scalable pipelines") ');
  const superpowers = await question('Your top 3 strengths (comma-separated): ');
  const exitNarrative = await question('Why are you looking for a new role? (1-2 sentences) ');

  return {
    headline: headline || 'Professional seeking new opportunities',
    superpowers: superpowers
      ? superpowers.split(',').map(s => s.trim()).filter(Boolean)
      : ['Problem solver', 'Team player', 'Continuous learner'],
    exit_narrative: exitNarrative || 'Looking for new challenges and growth opportunities.',
  };
}

// ─── Profile Writer ───

function writeProfile(profile) {
  const profilePath = join(ROOT, 'config', 'profile.yml');
  mkdirSync(join(ROOT, 'config'), { recursive: true });

  // Simple YAML writer
  const yaml = [
    '# Singapore Job Search Profile — Auto-generated by onboard.mjs',
    '# Edit this file to customize your job search',
    '',
    'candidate:',
    `  full_name: "${profile.candidate.full_name}"`,
    `  email: "${profile.candidate.email}"`,
    `  phone: "${profile.candidate.phone}"`,
    `  years_of_experience: ${profile.candidate.years_of_experience}`,
    `  location: "${profile.candidate.location}"`,
    `  timezone: "${profile.candidate.timezone}"`,
    profile.candidate.linkedin ? `  linkedin: "${profile.candidate.linkedin}"` : '',
    '',
    'target_roles:',
    '  primary:',
    ...profile.target_roles.primary.map(r => `    - "${r}"`),
    '  secondary:',
    ...profile.target_roles.secondary.map(r => `    - "${r}"`),
    '',
    'compensation:',
    `  target_range: "${profile.compensation.target_range}"`,
    `  currency: "${profile.compensation.currency}"`,
    `  minimum: "${profile.compensation.minimum}"`,
    '  notes: |',
    ...profile.compensation.notes.split('\n').map(l => `    ${l}`),
    '',
    'location:',
    '  country: "Singapore"',
    '  city: "Singapore"',
    '  timezone: "Asia/Singapore"',
    '  preferences:',
    '    - "Central (CCA)"',
    '    - "East"',
    '    - "West"',
    '    - "North East"',
    '  remote: "Hybrid (2-3 days office)"',
    '',
    'deal_breakers:',
    ...profile.deal_breakers.map(d => `  - "${d}"`),
    '',
    'narrative:',
    `  headline: "${profile.narrative.headline}"`,
    '  superpowers:',
    ...profile.narrative.superpowers.map(s => `    - "${s}"`),
    '  exit_narrative: |',
    `    ${profile.narrative.exit_narrative}`,
    '',
    'archetypes:',
    '  - name: "Primary Role"',
    '    level: "Manager"',
    '    fit: "primary"',
    '    description: "Your ideal role"',
    '',
    'spend_tier: "standard"',
    '',
    'language:',
    '  output: "en"',
    '  modes_dir: "modes/sg"',
    '',
    'cv:',
    '  output_format: "pdf"',
    '  template: "default"',
  ].filter(Boolean).join('\n');

  writeFileSync(profilePath, yaml, 'utf-8');
  success(`Profile saved to config/profile.yml`);
}

// ─── CV Template Creator ───

function createCvTemplate(profile) {
  const cvPath = join(ROOT, 'cv.md');
  const cv = [
    `# ${profile.candidate.full_name}`,
    `## ${profile.target_roles.primary[0] || 'Your Target Title'}`,
    '',
    `**${profile.candidate.location}** • ${profile.candidate.phone} • ${profile.candidate.email}`,
    profile.candidate.linkedin ? `• ${profile.candidate.linkedin}` : '',
    '',
    '---',
    '',
    '## Professional Profile',
    '',
    profile.narrative.headline,
    '',
    '**Impact at a glance:**',
    ...profile.narrative.superpowers.map(s => `- ${s}`),
    '',
    '---',
    '',
    '## Experience',
    '',
    '### Company Name — Singapore',
    '**Your Job Title**',
    'Start Year – End Year',
    '',
    '- [Action verb] + [what you did] + [impact/metric]',
    '- [Action verb] + [what you did] + [impact/metric]',
    '- [Action verb] + [what you did] + [impact/metric]',
    '',
    '### Previous Company — Location',
    '**Previous Job Title**',
    'Start Year – End Year',
    '',
    '- [Action verb] + [what you did] + [impact/metric]',
    '- [Action verb] + [what you did] + [impact/metric]',
    '',
    '---',
    '',
    '## Education',
    '',
    '### University Name',
    '**Degree, Major**',
    'Graduation Year',
    '',
    '---',
    '',
    '## Skills',
    '',
    '- Technical skills relevant to your target roles',
    '- Tools and technologies you use',
    '- Certifications and qualifications',
    '',
    '---',
    '',
    '## Certifications',
    '',
    '- Certification Name — Issuing Organisation (Year)',
    '',
    '---',
    '',
    '*Tip: Replace placeholder text with your actual experience. Quantify achievements with numbers.*',
  ].join('\n');

  writeFileSync(cvPath, cv, 'utf-8');
  success(`CV template saved to cv.md — edit this with your experience`);
}

// ─── Main Flow ───

async function main() {
  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                              ║', 'cyan');
  log('║   🇸🇬  SG Job Hunter — Quick Start Onboarding               ║', 'cyan');
  log('║   Let\'s set up your job search in 5 minutes                 ║', 'cyan');
  log('║                                                              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Check if already set up
  const profilePath = join(ROOT, 'config', 'profile.yml');
  if (existsSync(profilePath)) {
    const overwrite = await question('Profile already exists. Overwrite? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes') {
      log('Profile unchanged. Run with --force to overwrite.', 'yellow');
      return;
    }
  }

  // Build profile step by step
  const candidate = await buildProfile();
  const industry = await selectIndustry();
  const targetRoles = await customizeRoles(industry);
  const compensation = await setCompensation(industry, candidate.candidate.years_of_experience);
  const dealBreakers = await setDealBreakers();
  const narrative = await setNarrative();

  const profile = {
    candidate: candidate.candidate,
    target_roles: targetRoles,
    compensation,
    deal_breakers,
    narrative,
  };

  // Write files
  writeProfile(profile);
  createCvTemplate(profile);

  // Show summary
  section('📋 Your Profile Summary');
  log(`Name: ${profile.candidate.full_name}`, 'bold');
  log(`Experience: ${profile.candidate.years_of_experience} years`, 'cyan');
  log(`Industry: ${industry.name}`, 'cyan');
  log(`Target Roles: ${profile.target_roles.primary.join(', ')}`, 'cyan');
  log(`Salary Target: ${profile.compensation.target_range}`, 'cyan');
  log('');

  section('🎉 You\'re Ready to Search!');

  log('Your profile is set up. Here\'s what to do next:', 'bold');
  log('');
  log('1. Edit your CV with real experience:', 'cyan');
  log('   nano cv.md', 'gray');
  log('');
  log('2. Add target companies:', 'cyan');
  log('   nano portals.yml', 'gray');
  log('');
  log('3. Start scanning for jobs:', 'cyan');
  log('   node lib/index.mjs scan', 'gray');
  log('');
  log('4. Or ask your AI assistant:', 'cyan');
  log('   "Find me jobs in [your industry]"', 'gray');
  log('');
  log('💡 Check data/salary-benchmarks-2026.md for market rates!', 'yellow');
}

main().catch(err => {
  log(`Error: ${err.message}`, 'red');
  process.exit(1);
});
