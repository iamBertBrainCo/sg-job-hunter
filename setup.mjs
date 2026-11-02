#!/usr/bin/env node

/**
 * setup.mjs — One-Command Auto-Setup for SG Job Hunter
 *
 * Designed for non-technical users. Runs through installation,
 * dependency checks, and interactive onboarding in one command.
 *
 * Usage:
 *   node setup.mjs              # Full interactive setup
 *   node setup.mjs --quick      # Quick setup with defaults
 *   node setup.mjs --check      # Check dependencies only
 *   node setup.mjs --reinstall  # Reinstall everything from scratch
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const ROOT = __dirname;

// ─── Color Helpers ───

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('');
  log('═'.repeat(60), 'cyan');
  log(`  ${title}`, 'bold');
  log('═'.repeat(60), 'cyan');
}

function success(message) { log(`✅ ${message}`, 'green'); }
function warn(message) { log(`⚠️  ${message}`, 'yellow'); }
function error(message) { log(`❌ ${message}`, 'red'); }
function info(message) { log(`   ${message}`, 'gray'); }

// ─── CLI Flags ───

const argv = process.argv.slice(2);
const flags = {
  quick: argv.includes('--quick'),
  check: argv.includes('--check'),
  reinstall: argv.includes('--reinstall'),
  yes: argv.includes('--yes') || argv.includes('-y'),
};

// ─── Dependency Checks ───

async function checkNode() {
  const required = { major: 22, minor: 13 };
  const version = process.version.replace('v', '').split('.').map(Number);
  const [major, minor] = version;

  if (major < required.major || (major === required.major && minor < required.minor)) {
    error(`Node.js ${required.major}.${required.minor}+ required, found ${process.version}`);
    log('', 'reset');
    log('How to install Node.js:', 'bold');
    log('  macOS:  brew install node', 'cyan');
    log('  Windows: Download from https://nodejs.org/', 'cyan');
    log('  Linux:  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -', 'cyan');
    log('           sudo apt-get install -y nodejs', 'cyan');
    log('  Or use nvm: https://github.com/nvm-sh/nvm', 'cyan');
    return false;
  }
  success(`Node.js ${process.version} — OK`);
  return true;
}

async function checkGit() {
  try {
    const version = execSync('git --version', { encoding: 'utf-8' }).trim();
    success(`Git ${version} — OK`);
    return true;
  } catch {
    error('Git not found');
    log('', 'reset');
    log('How to install Git:', 'bold');
    log('  macOS:  brew install git', 'cyan');
    log('  Windows: Download from https://git-scm.com/', 'cyan');
    log('  Linux:  sudo apt-get install git', 'cyan');
    return false;
  }
}

async function checkNpm() {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    success(`npm ${version} — OK`);
    return true;
  } catch {
    error('npm not found (usually comes with Node.js)');
    return false;
  }
}

async function installDependencies() {
  section('Installing Dependencies');

  const needsInstall = !existsSync(join(ROOT, 'node_modules'));

  if (needsInstall || flags.reinstall) {
    log('Installing npm packages...', 'bold');
    try {
      execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
      success('npm packages installed');
    } catch (err) {
      error('Failed to install npm packages');
      info(err.message);
      return false;
    }
  } else {
    success('npm packages already installed');
  }

  return true;
}

async function installPlaywright() {
  section('Installing Browser (Playwright Chromium)');

  log('This is needed to scan job portals and fetch job descriptions.', 'bold');
  log('Downloading Chromium browser... (this may take a minute)', 'cyan');

  try {
    execSync('npx playwright install chromium', { cwd: ROOT, stdio: 'inherit' });
    success('Playwright Chromium installed');
  } catch (err) {
    warn('Playwright installation failed — job scraping may not work');
    info('You can retry later with: npx playwright install chromium');
    // Don't fail the entire setup for this
  }

  return true;
}

// ─── Template Initialization ───

function initTemplates() {
  section('Initializing Your Profile');

  const templates = [
    {
      src: 'config/profile.example.yml',
      dest: 'config/profile.yml',
      label: 'Profile configuration',
    },
    {
      src: 'portals.example.yml',
      dest: 'portals.yml',
      label: 'Target companies',
    },
    {
      src: 'cv.example.md',
      dest: 'cv.md',
      label: 'Your resume (CV)',
    },
  ];

  for (const template of templates) {
    const srcPath = join(ROOT, template.src);
    const destPath = join(ROOT, template.dest);

    if (!existsSync(srcPath)) {
      warn(`Template not found: ${template.src}`);
      continue;
    }

    if (existsSync(destPath) && !flags.reinstall) {
      info(`${template.label} already exists — skipping`);
      continue;
    }

    const content = readFileSync(srcPath, 'utf-8');
    writeFileSync(destPath, content, 'utf-8');
    success(`${template.label} created: ${template.dest}`);
  }

  // Create data directories
  const dirs = ['data', 'reports', 'output/cvs', 'output/cover-letters'];
  for (const dir of dirs) {
    mkdirSync(join(ROOT, dir), { recursive: true });
  }
  success('Data directories created');
}

// ─── Interactive Onboarding ───

function question(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function interactiveOnboarding() {
  section('🎯 Let\'s Set Up Your Job Search Profile');

  log('This will help us configure SG Job Hunter for YOUR job search.', 'bold');
  log('You can always edit these later in config/profile.yml', 'cyan');
  log('', 'reset');

  // Name
  const name = await question('👤 What is your full name? ');
  if (name) {
    updateProfileField('candidate.full_name', name);
  }

  // Email
  const email = await question('📧 What is your email address? ');
  if (email) {
    updateProfileField('candidate.email', email);
  }

  // Phone
  const phone = await question('📱 What is your phone number? (e.g., +65 9XXX XXXX) ');
  if (phone) {
    updateProfileField('candidate.phone', phone);
  }

  // Experience
  const years = await question('💼 How many years of professional experience do you have? ');
  if (years) {
    updateProfileField('candidate.years_of_experience', years);
  }

  // Target industry
  log('', 'reset');
  log('🏢 What industry are you targeting?', 'bold');
  log('  1) Technology / Software Engineering', 'cyan');
  log('  2) Data & AI', 'cyan');
  log('  3) Finance & Banking', 'cyan');
  log('  4) Life Sciences & Pharmaceuticals', 'cyan');
  log('  5) Manufacturing & Semiconductor', 'cyan');
  log('  6) Green Economy & Sustainability', 'cyan');
  log('  7) Care Economy & Social Services', 'cyan');
  log('  8) Digital Marketing & Creative', 'cyan');
  log('  9) Consulting & Professional Services', 'cyan');
  log('  10) Supply Chain & Logistics', 'cyan');
  log('  11) Learning & Development / OD', 'cyan');
  log('  12) Other / Mixed', 'cyan');
  log('', 'reset');

  const industry = await question('Enter number (1-12): ');

  const industryRoles = {
    '1': ['Software Engineer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer'],
    '2': ['Data Scientist', 'Data Engineer', 'Machine Learning Engineer', 'AI Engineer'],
    '3': ['Financial Analyst', 'Risk Manager', 'Compliance Officer', 'Investment Analyst'],
    '4': ['Regulatory Affairs Manager', 'QA Manager', 'Process Development Scientist', 'Biotechnologist'],
    '5': ['Process Engineer', 'Automation Engineer', 'Production Manager', 'Quality Engineer'],
    '6': ['Sustainability Manager', 'ESG Consultant', 'Energy Efficiency Manager', 'Carbon Footprint Analyst'],
    '7': ['Social Worker', 'Clinical Psychologist', 'Community Care Manager', 'Programme Manager'],
    '8': ['Digital Marketing Manager', 'Performance Marketing Specialist', 'SEO Specialist', 'E-commerce Manager'],
    '9': ['Management Consultant', 'Strategy Consultant', 'HR Consultant', 'Change Management Consultant'],
    '10': ['Supply Chain Manager', 'Logistics Manager', 'Procurement Manager', 'Operations Manager'],
    '11': ['Learning & Development Manager', 'Organisational Development Manager', 'Training Manager', 'Talent Development Consultant'],
    '12': ['Your Role Title 1', 'Your Role Title 2', 'Your Role Title 3', 'Your Role Title 4'],
  };

  const selectedRoles = industryRoles[industry] || industryRoles['12'];
  log(`\n📋 Suggested roles for your industry: ${selectedRoles.join(', ')}`, 'cyan');
  log('You can customize these later.', 'gray');

  // Salary expectation
  log('', 'reset');
  const salary = await question('💰 What is your target monthly salary range? (e.g., "SGD 7,000 - 10,000") ');
  if (salary) {
    updateProfileField('compensation.target_range', salary);
  }

  // Deal breakers
  log('', 'reset');
  const dealBreakers = await question('🚫 Any deal breakers? (e.g., "No sales roles", "No shift work") — press Enter to skip ');
  if (dealBreakers) {
    log('Note: Deal breakers have been noted. Edit config/profile.yml to add them to the deal_breakers list.', 'cyan');
  }

  success('Profile initialized!');
}

function updateProfileField(path, value) {
  // Simple field update — in production, use a proper YAML library
  const profilePath = join(ROOT, 'config', 'profile.yml');
  if (!existsSync(profilePath)) return;

  try {
    let content = readFileSync(profilePath, 'utf-8');
    const key = path.split('.').pop();
    const regex = new RegExp(`(${key}:\\s*)["']?[^"\\n]*["']?`, 'm');
    content = content.replace(regex, `$1"${value}"`);
    writeFileSync(profilePath, content, 'utf-8');
  } catch (err) {
    warn(`Could not update ${path} automatically — edit config/profile.yml manually`);
  }
}

// ─── Final Checks ───

function finalChecks() {
  section('Final Checks');

  const checks = [
    { path: 'config/profile.yml', label: 'Profile configuration' },
    { path: 'cv.md', label: 'Resume (CV)' },
    { path: 'portals.yml', label: 'Target companies' },
    { path: 'data/salary-benchmarks-2026.md', label: 'Salary benchmarks' },
    { path: 'modes/sg/_shared.md', label: 'Singapore market rules' },
  ];

  let allGood = true;
  for (const check of checks) {
    const path = join(ROOT, check.path);
    if (existsSync(path)) {
      success(`${check.label} — ready`);
    } else {
      warn(`${check.label} — missing (you can add this later)`);
      allGood = false;
    }
  }

  return allGood;
}

function showNextSteps() {
  section('🎉 Setup Complete!');

  log('Your SG Job Hunter is ready to use!', 'green');
  log('', 'reset');
  log('Next steps:', 'bold');
  log('', 'reset');
  log('1. Edit your profile:', 'cyan');
  log('   nano config/profile.yml', 'gray');
  log('', 'reset');
  log('2. Edit your resume:', 'cyan');
  log('   nano cv.md', 'gray');
  log('', 'reset');
  log('3. Add target companies:', 'cyan');
  log('   nano portals.yml', 'gray');
  log('', 'reset');
  log('4. Start scanning for jobs:', 'cyan');
  log('   node lib/index.mjs scan', 'gray');
  log('', 'reset');
  log('5. Or use the AI agent:', 'cyan');
  log('   Tell your AI assistant: "Find me jobs in [your industry]"', 'gray');
  log('', 'reset');
  log('💡 Pro tip: The more specific your target roles, the better the matching!', 'yellow');
  log('💡 Check data/salary-benchmarks-2026.md for market rates in your sector.', 'yellow');
  log('', 'reset');
  log('Full documentation: README.md', 'cyan');
  log('Quick start guide: GETTING_STARTED.md', 'cyan');
  log('Walkthrough: WALKTHROUGH.md', 'cyan');
}

// ─── Main ───

async function main() {
  log('', 'reset');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                              ║', 'cyan');
  log('║   🇸🇬  SG Job Hunter — Auto Setup                           ║', 'cyan');
  log('║   Automated job search for Singapore & ASEAN professionals  ║', 'cyan');
  log('║                                                              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('', 'reset');

  // Check mode
  if (flags.check) {
    section('Checking Dependencies');
    const nodeOk = await checkNode();
    const gitOk = await checkGit();
    const npmOk = await checkNpm();

    if (nodeOk && gitOk && npmOk) {
      success('All dependencies are satisfied!');
    } else {
      error('Some dependencies are missing. Please install them and try again.');
      process.exit(1);
    }
    return;
  }

  // Step 1: Check prerequisites
  section('Checking Prerequisites');
  const nodeOk = await checkNode();
  const gitOk = await checkGit();
  const npmOk = await checkNpm();

  if (!nodeOk || !gitOk || !npmOk) {
    error('Prerequisites not met. Please install the missing dependencies.');
    log('See the messages above for installation instructions.', 'yellow');
    process.exit(1);
  }

  // Step 2: Install dependencies
  const depsOk = await installDependencies();
  if (!depsOk) {
    error('Dependency installation failed.');
    process.exit(1);
  }

  // Step 3: Install Playwright
  await installPlaywright();

  // Step 4: Initialize templates
  initTemplates();

  // Step 5: Interactive onboarding (skip in --quick mode)
  if (!flags.quick && !flags.yes) {
    await interactiveOnboarding();
  } else {
    log('Quick mode — skipping interactive onboarding.', 'yellow');
    log('Edit config/profile.yml to customize your profile.', 'cyan');
  }

  // Step 6: Final checks
  finalChecks();

  // Step 7: Show next steps
  showNextSteps();
}

main().catch(err => {
  error(`Setup failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
