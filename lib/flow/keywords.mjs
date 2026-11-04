// lib/flow/keywords.mjs — pick the terms an ATS is likely to screen for out of
// a job description, for any PMET field (not only tech).
//
// Recognised terms come from three places: the tech vocabulary in
// lib/skill-extract.mjs, the cross-industry list below, and Singapore-specific
// terms (regulators, schemes, certifications). Matching is case-insensitive
// and on word boundaries; the job's own spelling is returned.

import { extractSkills } from '../skill-extract.mjs';

const PMET_TERMS = `
stakeholder management|project management|programme management|change management|people management|team leadership|
strategic planning|business planning|budgeting|forecasting|financial analysis|financial reporting|management reporting|
cost control|cost management|p&l|profit and loss|variance analysis|audit|internal audit|external audit|internal controls|
risk management|compliance|regulatory compliance|governance|corporate governance|aml|kyc|credit risk|market risk|
operational risk|treasury|tax|gst|accounts payable|accounts receivable|general ledger|month-end closing|ifrs|sfrs|
consolidation|payroll|procurement|sourcing|vendor management|supplier management|contract management|negotiation|
supply chain|logistics|inventory management|warehouse management|demand planning|operations management|
process improvement|continuous improvement|lean|six sigma|kaizen|quality assurance|quality control|iso 9001|iso 14001|iso 45001|
workplace safety|wsh|health and safety|ehs|maintenance|manufacturing|production planning|
recruitment|talent acquisition|onboarding|employee relations|employee engagement|performance management|
compensation and benefits|c&b|learning and development|training needs analysis|instructional design|curriculum development|
facilitation|coaching|mentoring|succession planning|workforce planning|organisational development|organizational development|
hris|hr policies|hr business partnering|industrial relations|union|work pass|work permit|employment pass|
customer service|customer experience|client management|account management|key account management|relationship management|
business development|sales|lead generation|crm|pipeline management|partnerships|
marketing|digital marketing|social media|content marketing|seo|sem|brand management|campaign management|market research|
public relations|communications|corporate communications|copywriting|events management|
data analysis|data analytics|data visualisation|data visualization|dashboards|reporting|business intelligence|kpis|
product management|product roadmap|user research|agile|scrum|waterfall|business analysis|requirements gathering|
uat|system implementation|digital transformation|it governance|cybersecurity|information security|
legal|contract drafting|litigation|corporate law|intellectual property|data protection|
clinical|patient care|nursing|healthcare|pharmaceutical|gmp|gdp|regulatory affairs|
teaching|lesson planning|student development|research|grant writing|
interior design|architecture|civil engineering|mechanical engineering|electrical engineering|building services|
property management|facilities management|real estate|leasing|
problem solving|analytical skills|communication skills|interpersonal skills|presentation skills|attention to detail|
time management|written communication|verbal communication|leadership|teamwork|bilingual|mandarin|malay|tamil|bahasa
`;

const SG_TERMS = `
employment act|mom|cpf|pdpa|mas|acra|iras|skillsfuture|wsq|wsg|ssg|ihrp|ihrp-cp|ihrp-sp|acta|aclp|
cpa|ca|acca|cfa|cia|cisa|pmp|prince2|csm|cissp|cism|ceh|itil|togaf|cips|cscp|
nric|e2i|ntuc|tafep|fair consideration framework|tripartite guidelines|bca|ura|hdb|lta|mpa|nea|scdf|moh|hsa
`;

function compile(list) {
  return list.split('|').map((t) => t.trim()).filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()[\]\\]/g, '\\$&'))
    .join('|');
}

const PMET_RE = new RegExp(`(?<![a-z0-9])(${compile(PMET_TERMS)})(?![a-z0-9])`, 'gi');
// Short acronyms must match in capitals (so "ca" is not found inside every sentence).
const SG_RE = new RegExp(`(?<![A-Za-z0-9])(${compile(SG_TERMS).toUpperCase()}|Employment Act|SkillsFuture|Fair Consideration Framework|Tripartite Guidelines)(?![A-Za-z0-9])`, 'g');

export function jobKeywords(text, extra = []) {
  const found = new Map();
  const add = (t) => {
    const k = String(t).trim();
    if (k && !found.has(k.toLowerCase())) found.set(k.toLowerCase(), k);
  };
  for (const t of extra) add(t);
  const body = String(text || '');
  for (const m of body.matchAll(PMET_RE)) add(m[1]);
  for (const m of body.matchAll(SG_RE)) add(m[1]);
  try {
    for (const s of extractSkills(body)) add(s);
  } catch { /* best effort */ }
  return [...found.values()].slice(0, 25);
}
