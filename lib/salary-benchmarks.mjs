#!/usr/bin/env node

/**
 * salary-benchmarks.mjs — Look up salary benchmarks for your sector
 *
 * Usage:
 *   node lib/salary-benchmarks.mjs                    # Show all sectors
 *   node lib/salary-benchmarks.mjs --sector tech      # Show tech sector
 *   node lib/salary-benchmarks.mjs --role "Data Scientist"  # Search by role
 *   node lib/salary-benchmarks.mjs --level mid        # Filter by experience level
 *   node lib/salary-benchmarks.mjs --json             # JSON output for agents
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── CLI Flags ───

const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--sector' && i + 1 < argv.length) { flags.sector = argv[++i]; }
  else if (arg === '--role' && i + 1 < argv.length) { flags.role = argv[++i]; }
  else if (arg === '--level' && i + 1 < argv.length) { flags.level = argv[++i]; }
  else if (arg === '--json') { flags.json = true; }
  else if (arg === '--help' || arg === '-h') { showHelp(); process.exit(0); }
}

function showHelp() {
  console.log(`
SG Job Hunter — Salary Benchmarks Lookup

Usage:
  node lib/salary-benchmarks.mjs [options]

Options:
  --sector <name>    Filter by sector (tech, data, finance, lifecycle, manufacturing,
                     green, care, marketing, consulting, supplychain, ld, government)
  --role <name>      Search for a specific role
  --level <name>     Filter by experience level (junior, mid, senior)
  --json             Output as JSON (for agent integration)
  --help             Show this help message

Examples:
  node lib/salary-benchmarks.mjs --sector tech
  node lib/salary-benchmarks.mjs --role "Data Scientist"
  node lib/salary-benchmarks.mjs --sector green --level mid
  node lib/salary-benchmarks.mjs --json
`);
}

// ─── Sector Mapping ───

const SECTOR_MAP = {
  tech: 'Software Engineering & Technology',
  data: 'Data & AI',
  finance: 'Finance, Banking & Professional Services',
  lifecycle: 'Life Sciences & Pharmaceuticals',
  manufacturing: 'Manufacturing & Semiconductor',
  green: 'Green Economy & Sustainability',
  care: 'Care Economy & Social Services',
  marketing: 'Creative, Digital Media & Advertising',
  consulting: 'Finance, Banking & Professional Services',
  supplychain: 'Supply Chain, Logistics & Operations',
  ld: 'Learning & Development / Organisational Development',
  government: 'Government & Statutory Boards',
  realestate: 'Real Estate & Property',
  education: 'Education & Research',
};

// ─── Data Loading ───

function loadBenchmarks() {
  const path = join(ROOT, 'data', 'salary-benchmarks-2026.md');
  if (!existsSync(path)) {
    console.error('❌ Salary benchmarks file not found.');
    console.error('   Expected: data/salary-benchmarks-2026.md');
    process.exit(1);
  }
  return readFileSync(path, 'utf-8');
}

function parseTables(content) {
  const tables = [];
  const lines = content.split('\n');
  let currentSection = '';
  let inTable = false;
  let tableLines = [];

  for (const line of lines) {
    // Track section headers (## and ###)
    if (line.startsWith('## ')) {
      currentSection = line.replace(/^#+\s*/, '').trim();
    } else if (line.startsWith('### ')) {
      currentSection = line.replace(/^#+\s*/, '').trim();
    }

    // Detect table separator line (contains |---| or |------|)
    if (line.startsWith('|') && line.includes('|--')) {
      inTable = true;
      tableLines = [];
      continue;
    }

    // Collect table data rows
    if (inTable && line.startsWith('|')) {
      tableLines.push(line);
      continue;
    }

    // End of table
    if (inTable && !line.startsWith('|')) {
      if (tableLines.length > 0) {
        tables.push({ section: currentSection, rows: parseTableRows(tableLines) });
      }
      inTable = false;
      tableLines = [];
    }
  }

  // Handle table at end of file
  if (inTable && tableLines.length > 0) {
    tables.push({ section: currentSection, rows: parseTableRows(tableLines) });
  }

  return tables;
}

function parseTableRows(lines) {
  const rows = [];
  for (const line of lines) {
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      rows.push(cells);
    }
  }
  return rows;
}

// ─── Display ───

function displaySector(sectorKey, tables) {
  const sectorName = SECTOR_MAP[sectorKey];
  if (!sectorName) {
    console.error(`Unknown sector: ${sectorKey}`);
    console.error('Available sectors:', Object.keys(SECTOR_MAP).join(', '));
    process.exit(1);
  }

  const matchingTables = tables.filter(t =>
    t.section.toLowerCase().includes(sectorKey.toLowerCase()) ||
    t.section.includes(sectorName)
  );

  if (matchingTables.length === 0) {
    console.error(`No data found for sector: ${sectorName}`);
    return;
  }

  console.log(`\n📊 Salary Benchmarks: ${sectorName}`);
  console.log('─'.repeat(60));
  console.log('All figures are monthly base salary in SGD\n');

  for (const table of matchingTables) {
    console.log(`📋 ${table.section}`);
    console.log('─'.repeat(40));

    // Find header row
    const headerIdx = table.rows.findIndex(row =>
      row.some(cell => cell.includes('Role') || cell.includes('Junior') || cell.includes('Entry'))
    );

    if (headerIdx >= 0) {
      const header = table.rows[headerIdx];
      const dataRows = table.rows.slice(headerIdx + 1);

      // Filter by level if specified
      const filteredRows = flags.level
        ? dataRows.filter(row => row.some(cell => cell.toLowerCase().includes(flags.level.toLowerCase())))
        : dataRows;

      if (filteredRows.length === 0) {
        console.log('  No data found for level:', flags.level);
        continue;
      }

      // Filter by role if specified
      const finalRows = flags.role
        ? filteredRows.filter(row => row.some(cell => cell.toLowerCase().includes(flags.role.toLowerCase())))
        : filteredRows;

      if (finalRows.length === 0) {
        console.log('  No data found for role:', flags.role);
        continue;
      }

      // Print header
      const colWidths = header.map((h, i) => Math.max(h.length, ...finalRows.map(r => r[i]?.length || 0)));
      const formatRow = (row) => row.map((cell, i) => (cell || '').padEnd(colWidths[i] || 0)).join('  |  ');

      console.log(formatRow(header));
      console.log(formatRow(colWidths.map(w => '-'.repeat(w))));

      for (const row of finalRows) {
        console.log(formatRow(row));
      }
      console.log('');
    }
  }
}

function displayAll(tables) {
  console.log('\n📊 Singapore Salary Benchmarks 2026 — All Sectors');
  console.log('─'.repeat(60));
  console.log('All figures are monthly base salary in SGD\n');

  console.log('Available sectors:\n');

  const sectors = Object.entries(SECTOR_MAP);
  for (const [key, name] of sectors) {
    const hasData = tables.some(t =>
      t.section.toLowerCase().includes(key.toLowerCase()) ||
      t.section.includes(name)
    );
    console.log(`  ${hasData ? '✅' : '⏳'} ${key.padEnd(15)} → ${name}`);
  }

  console.log('\n💡 Use --sector <name> to see detailed benchmarks for a sector');
  console.log('💡 Use --role "<role name>" to search for a specific role');
  console.log('💡 Use --level <junior|mid|senior> to filter by experience level\n');
}

function displayJson(tables) {
  const result = {
    source: 'data/salary-benchmarks-2026.md',
    last_updated: 'November 2026',
    currency: 'SGD',
    frequency: 'monthly',
    sectors: {},
  };

  for (const table of tables) {
    const sectorKey = Object.keys(SECTOR_MAP).find(key =>
      table.section.toLowerCase().includes(key.toLowerCase()) ||
      table.section.includes(SECTOR_MAP[key])
    );

    if (sectorKey) {
      if (!result.sectors[sectorKey]) {
        result.sectors[sectorKey] = { name: SECTOR_MAP[sectorKey], roles: [] };
      }

      for (const row of table.rows) {
        if (row[0] && !row[0].includes('Role') && !row[0].includes('Entry') && !row[0].includes('Junior')) {
          result.sectors[sectorKey].roles.push({
            role: row[0],
            junior: row[1] || null,
            mid: row[2] || null,
            senior: row[3] || null,
            demand: row[4] || null,
            growth: row[5] || null,
          });
        }
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

// ─── Main ───

function main() {
  const content = loadBenchmarks();
  const tables = parseTables(content);

  if (flags.json) {
    displayJson(tables);
    return;
  }

  if (flags.sector) {
    displaySector(flags.sector, tables);
    return;
  }

  if (flags.role) {
    // Search across all tables
    console.log(`\n🔍 Searching for: "${flags.role}"`);
    console.log('─'.repeat(60));

    let found = false;
    for (const table of tables) {
      for (const row of table.rows) {
        if (row[0] && row[0].toLowerCase().includes(flags.role.toLowerCase())) {
          if (!found) {
            console.log(`\n📋 Found in: ${table.section}`);
            console.log('─'.repeat(40));
            found = true;
          }
          console.log(`  ${row[0]}`);
          if (row[1]) console.log(`    Junior: ${row[1]}`);
          if (row[2]) console.log(`    Mid:    ${row[2]}`);
          if (row[3]) console.log(`    Senior: ${row[3]}`);
          if (row[4]) console.log(`    Demand: ${row[4]}`);
          if (row[5]) console.log(`    Growth: ${row[5]}`);
          console.log('');
        }
      }
    }

    if (!found) {
      console.log(`No roles found matching "${flags.role}"`);
      console.log('Try a different search term or use --sector to browse a sector.');
    }
    return;
  }

  displayAll(tables);
}

main();
