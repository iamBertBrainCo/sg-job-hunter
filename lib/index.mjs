#!/usr/bin/env node
// SG Job Hunter — Main entry point
// This file provides a unified interface to all SG Job Hunter commands.
//
// Usage:
//   node lib/index.mjs setup        — Auto-setup (install + onboarding)
//   node lib/index.mjs onboard      — Interactive profile onboarding
//   node lib/index.mjs doctor       — Check setup
//   node lib/index.mjs scan         — Scan for jobs
//   node lib/index.mjs [command]    — Run any command
//
// For a full list of commands, run:
//   node lib/index.mjs help

import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const commands = {
  // Setup & Onboarding
  setup: 'setup.mjs',
  onboard: 'onboard.mjs',
  doctor: 'doctor.mjs',

  // Job Search
  evaluate: 'lib/evaluate.mjs',
  scan: 'lib/scan.mjs',
  scrape: 'lib/scrape-jobs.mjs',
  'scrape-more': 'lib/scrape-more-jobs.mjs',
  'fetch-jds': 'lib/fetch-jds.mjs',

  // Application Generation
  'convert-cv': 'convert-cv-to-pdf.mjs',
  'convert-cover-letter': 'convert-cover-letter-to-pdf.mjs',

  // Pipeline Management
  'merge-tracker': 'lib/merge-tracker.mjs',
  'set-status': 'lib/set-status.mjs',
  analyze: 'lib/analyze-patterns.mjs',
  stats: 'lib/stats.mjs',
  verify: 'lib/verify-pipeline.mjs',
  'check-liveness': 'lib/check-liveness.mjs',
  'reserve-report': 'lib/reserve-report-num.mjs',
  followup: 'lib/followup-cadence.mjs',
  coverage: 'lib/coverage-check.mjs',

  // Career Development
  upskill: 'lib/upskill.mjs',
  'salary-gap': 'lib/salary-gap.mjs',
  'salary-benchmarks': 'lib/salary-benchmarks.mjs',

  // Testing
  test: 'lib/test-all.mjs',
};

function showHelp() {
  console.log(`
SG Job Hunter — Automated job search for Singapore & ASEAN professionals

🚀 Quick Start (Non-Technical Users):
  node lib/index.mjs setup          # One-command auto-install + onboarding
  node lib/index.mjs onboard        # Interactive profile setup

Usage:
  node lib/index.mjs <command> [options]

Available commands:
  SETUP & ONBOARDING
    setup               Auto-setup: install deps + interactive onboarding
    onboard             Interactive profile onboarding (step-by-step)
    doctor              Check setup and dependencies

  JOB SEARCH
    evaluate            Evaluate a job (6-block scoring + report)
    scan                Scan configured companies for jobs
    scrape              Scrape job portals (MyCareersFuture, JobStreet, etc.)
    scrape-more         Scrape additional job sources
    fetch-jds           Fetch job descriptions

  APPLICATION GENERATION
    convert-cv          Convert CV to PDF
    convert-cover-letter Convert cover letter to PDF

  PIPELINE MANAGEMENT
    merge-tracker       Merge tracker data
    set-status          Update application status
    analyze             Analyze application patterns
    stats               Show statistics
    verify              Verify pipeline integrity
    check-liveness      Check portal liveness
    reserve-report      Reserve a report number
    followup            Calculate follow-up cadence
    coverage            Check coverage

  CAREER DEVELOPMENT
    upskill             Upskill recommendations
    salary-gap          Analyze salary gaps
    salary-benchmarks   Show salary benchmarks for your sector

  TESTING
    test                Run all tests
    help                Show this help message

Examples:
  # First time setup
  node lib/index.mjs setup

  # Quick job search
  node lib/index.mjs scan
  node lib/index.mjs evaluate --url "https://www.mycareersfuture.gov.sg/job/123"

  # Generate application package
  node lib/index.mjs evaluate --url <job-url> --apply

  # Check your pipeline
  node lib/index.mjs stats
  node lib/index.mjs followup

  # Salary research
  node lib/index.mjs salary-benchmarks

For more information, see README.md or run:
  npm run doctor
`);
}

const command = process.argv[2];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

if (!commands[command]) {
  console.error(`Unknown command: \${command}`);
  console.error('Run "node lib/index.mjs help" for available commands.');
  process.exit(1);
}

const scriptPath = resolve(root, commands[command]);
const args = process.argv.slice(3).join(' ');

try {
  execSync(`node "\${scriptPath}" \${args}`, {
    cwd: root,
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(error.status || 1);
}
