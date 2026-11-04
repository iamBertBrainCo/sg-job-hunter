// lib/flow/privacy.mjs — keep sensitive personal data away from the AI.
//
// scrubSensitive(text) runs on imported files BEFORE their text is saved or
// printed (printing is how the agent, and therefore the AI provider, sees it):
//   - removes NRIC/FIN numbers, dates of birth, home addresses and referees'
//     details, none of which belong on a resume;
//   - lists other details the user may want to remove themselves.

// Singapore NRIC/FIN: S, T, F, G or M, seven digits, one letter.
const NRIC_RE = /\b[STFGM]\d{7}[A-Z]\b/gi;
const DOB_RE = /\b(date of birth|d\.?o\.?b\.?|born on|birth ?date)\b/i;
const ADDRESS_RE = /\b(blk|block)\s+\d+[a-z]?\b|\bsingapore\s*\(?\d{6}\)?(?!\d)|\bS\(\d{6}\)/i;
const REFEREE_HEADING_RE = /^\s*(#+\s*)?(referees?|references?)\s*:?\s*$/i;
const REFEREE_INLINE_RE = /^\s*[-*•]?\s*(referees?|references?)\s*:\s*\S/i;

const WARNINGS = [
  [/\bage\s*[:\-]\s*\d{2}\b|\b\d{2}\s*(years old|y\/o)\b/i, 'your age'],
  [/\bmarital status\b/i, 'marital status'],
  [/\b(religion|race|ethnicity)\s*[:\-]/i, 'race or religion'],
  [/\b(passport (no|number)|passport\s*[:\-])/i, 'a passport number'],
  [/\b(current|last[- ]drawn|expected) salary\b/i, 'salary details'],
];

export function scrubSensitive(text) {
  const removed = { nric: 0, dob: 0, address: 0, referees: 0 };
  let s = String(text).replace(NRIC_RE, () => {
    removed.nric += 1;
    return '[NRIC removed]';
  });

  const lines = [];
  let inReferees = false;
  for (const line of s.split('\n')) {
    // A referees section runs until the next heading or blank-line-then-heading.
    if (REFEREE_HEADING_RE.test(line)) {
      inReferees = true;
      removed.referees += 1;
      lines.push(line.replace(/(referees?|references?).*/i, 'References available on request'));
      continue;
    }
    if (inReferees) {
      if (/^\s*#/.test(line) || /^[A-Z][A-Z &]{3,}$/.test(line.trim())) inReferees = false;
      else continue;
    }
    if (REFEREE_INLINE_RE.test(line)) {
      removed.referees += 1;
      lines.push('References available on request');
      continue;
    }
    // Within a line, drop only the " | "-separated parts that are a date of
    // birth or an address, so the rest of a contact line survives.
    const parts = line.split(/(\s*[|•]\s*)/);
    let changed = false;
    for (let i = 0; i < parts.length; i += 2) {
      if (DOB_RE.test(parts[i])) { parts[i] = '[date of birth removed]'; removed.dob += 1; changed = true; } else if (ADDRESS_RE.test(parts[i])) { parts[i] = '[address removed]'; removed.address += 1; changed = true; }
    }
    lines.push(changed ? parts.join('') : line);
  }
  s = lines.join('\n');

  const found = WARNINGS.filter(([re]) => re.test(s)).map(([, label]) => label);
  return { text: s, removed, found };
}
