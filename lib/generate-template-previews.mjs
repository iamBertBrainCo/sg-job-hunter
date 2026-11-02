#!/usr/bin/env node
// generate-template-previews.mjs — Render each CV template with sample data for the gallery.
// Produces preview HTML files under examples/template-previews/

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { atsLint } from './cv-templates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Sample profile data (based on the L&D Professional example)
const sampleData = {
  NAME: 'Sarah Tan',
  ROLE_TITLE: 'Learning & Development Manager',
  LOCATION: 'Singapore',
  PHONE: '+65 8123 4567',
  EMAIL: 'sarah.tan@example.com',
  LINKEDIN: 'linkedin.com/in/sarahtan',
  LANG: 'en',
  PAGE_WIDTH: '8.5in',
  SUMMARY: `Learning & Development professional with 6 years designing and delivering training programmes across corporate and government sectors. Built capability programmes that trained 2,000+ participants with 4.8/5 average satisfaction score.`,
  IMPACT: '2,000+ participants trained • 50+ programmes delivered • 4.8/5 satisfaction score',
  EXPERIENCE: `
    <div class="job">
      <div class="job-header">
        <div class="job-title">Learning & Development Specialist</div>
        <div class="job-company">DBS Bank — Singapore</div>
        <div class="job-date">2022 – Present</div>
      </div>
      <ul class="job-bullets">
        <li>Design and deliver blended learning programmes for 500+ employees across retail and corporate banking</li>
        <li>Develop digital learning modules and facilitation guides for new product launches</li>
        <li>Achieved 4.8/5 average post-training satisfaction score across all programmes</li>
        <li>Built internal trainer programme that certified 20 subject matter experts</li>
      </ul>
    </div>
    <div class="job">
      <div class="job-header">
        <div class="job-title">Training Coordinator → Training Executive</div>
        <div class="job-company">NTUC Enterprise — Singapore</div>
        <div class="job-date">2020 – 2022</div>
      </div>
      <ul class="job-bullets">
        <li>Coordinated training programmes for 1,000+ employees across retail and F&B divisions</li>
        <li>Developed SOPs and training materials for new store openings</li>
        <li>Promoted from coordinator to executive within 18 months based on performance</li>
      </ul>
    </div>
    <div class="job">
      <div class="job-header">
        <div class="job-title">Training Intern → Junior Training Executive</div>
        <div class="job-company">Singtel — Singapore</div>
        <div class="job-date">2018 – 2020</div>
      </div>
      <ul class="job-bullets">
        <li>Supported delivery of leadership development programmes for 200+ managers</li>
        <li>Created training materials and digital learning content</li>
        <li>Conducted post-training evaluations and recommended improvements</li>
      </ul>
    </div>
  `,
  EDUCATION: `
    <div class="education-entry">
      <div class="education-degree">Bachelor of Science in Human Resources Management</div>
      <div class="education-school">Nanyang Technological University (NTU)</div>
      <div class="education-date">2018</div>
    </div>
  `,
  CREDENTIALS: 'ATD Certified Professional in Learning and Performance (CPLP) • WSQ Train the Trainer • Microsoft Learn AI Trainer',
  SKILLS: `
    <div class="skills-category">
      <div class="skills-label">Learning & Development</div>
      <div class="skills-list">Blended learning design, curriculum development, training needs analysis, digital learning modules</div>
    </div>
    <div class="skills-category">
      <div class="skills-label">Facilitation & Training</div>
      <div class="skills-list">Workshop design, classroom delivery, virtual training, on-the-job training</div>
    </div>
    <div class="skills-category">
      <div class="skills-label">Digital Tools</div>
      <div class="skills-list">Learning management systems (LMS), Microsoft Teams, Zoom, Articulate Storyline, Canva</div>
    </div>
  `,
  INTERESTS: 'Professional development, instructional design, mentorship, community building',
  PROJECTS: '',
  CERTIFICATIONS: '',
  LANGUAGES: 'English (Fluent), Mandarin (Conversational)',
  VOLUNTEER: '',
  AWARDS: 'Training Excellence Award 2023 — DBS Bank',
  REFERENCES: 'Available upon request',
};

// Discover all CV templates — HTML only for previews (LaTeX needs compilation)
const templateFiles = readdirSync(root)
  .filter(f => f.startsWith('cv-template.') && f.endsWith('.html'));

// Also check ats/ subdirectory
const atsDir = resolve(root, 'ats');
const atsFiles = existsSync(atsDir)
  ? readdirSync(atsDir).filter(f => f.startsWith('cv-template.') && f.endsWith('.html'))
  : [];

const allTemplates = [
  ...templateFiles.map(f => ({ file: f, path: resolve(root, f), dir: '' })),
  ...atsFiles.map(f => ({ file: f, path: resolve(atsDir, f), dir: 'ats/' })),
];

// Parse template name from filename
function parseTemplateName(filename) {
  const match = filename.match(/^cv-template\.([a-z0-9-]+)\.html$/);
  if (!match) return 'standard';
  return match[1];
}

function prettify(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Generate preview for each template
const outputDir = resolve(root, 'examples', 'template-previews');
mkdirSync(outputDir, { recursive: true });

const previews = [];

for (const template of allTemplates) {
  const name = parseTemplateName(template.file);
  const displayName = prettify(name);

  // Run ATS lint on the raw template (before placeholder substitution)
  const lintResult = atsLint(template.path, 'cv', { rulesPath: resolve(root, 'ats-rules.yml') });
  const hasWarnings = lintResult.findings.length > 0;
  const warningCount = lintResult.findings.length;

  let html = readFileSync(template.path, 'utf-8');

  // Replace placeholders with sample data
  for (const [key, value] of Object.entries(sampleData)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Remove any remaining placeholders (replace with empty or placeholder text)
  html = html.replace(/\{\{[A-Z_]+\}\}/g, '');

  // Add preview wrapper
  const previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Preview: ${displayName}</title>
  <style>
    body {
      background: #f0f0f0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .preview-container {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 40px;
    }
    .preview-header {
      text-align: center;
      margin-bottom: 30px;
      padding: 15px;
      background: #667eea;
      color: white;
      border-radius: 8px;
    }
    .preview-header h2 {
      margin: 0 0 5px 0;
      font-size: 1.5em;
    }
    .preview-header p {
      margin: 0;
      opacity: 0.9;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 20px;
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <a href="#" id="back-link" class="back-link">← Back to Template Gallery</a>
    <div class="preview-header">
      <h2>📄 ${displayName} Template</h2>
      <p>Preview with sample profile data</p>
    </div>
    ${html}
  </div>
  <script>
    // Compute gallery path that works in both file:// and http:// contexts
    (function() {
      var href = window.location.href;
      var dir = href.substring(0, href.lastIndexOf('/') + 1);
      document.getElementById('back-link').href = dir + '../template-gallery.html';
    })();
  </script>
</body>
</html>
  `;
  
  const outputFile = resolve(outputDir, `preview-${name}.html`);
  writeFileSync(outputFile, previewHtml);
  
  previews.push({
    name,
    displayName,
    file: template.file,
    previewUrl: `examples/template-previews/preview-${name}.html`,
    atsOk: lintResult.ok,
    atsWarnings: warningCount,
    atsFindings: lintResult.findings,
  });
  
  console.log(`✅ Generated preview: ${displayName} (${name})`);
}

// Generate the gallery page
const galleryHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SG Job Hunter — Template Gallery</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f7fa;
      color: #333;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 0;
      text-align: center;
      margin-bottom: 30px;
    }

    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    header p {
      font-size: 1.2em;
      opacity: 0.9;
    }

    .nav-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .nav-link {
      display: inline-block;
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 500;
      transition: background 0.3s;
    }

    .nav-link:hover {
      background: #5568d3;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    .template-card {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .template-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }

    .template-preview {
      height: 350px;
      overflow: hidden;
      position: relative;
      background: #fafafa;
    }

    .template-preview iframe {
      width: 100%;
      height: 100%;
      border: none;
      pointer-events: none;
    }

    .template-info {
      padding: 20px;
    }

    .template-info h3 {
      color: #667eea;
      margin-bottom: 8px;
      font-size: 1.3em;
    }

    .template-info p {
      color: #666;
      margin-bottom: 15px;
      font-size: 0.95em;
    }

    .template-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 5px;
      text-decoration: none;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.3s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .template-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
      margin-bottom: 10px;
    }

    .badge-default {
      background: #e8f5e9;
      color: #388e3c;
    }

    .badge-ats {
      background: #fff3e0;
      color: #f57c00;
    }

    .badge-cjk {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge-ats-pass {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-ats-warn {
      background: #fff3e0;
      color: #e65100;
    }

    .help-section {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .help-section h2 {
      color: #667eea;
      margin-bottom: 15px;
    }

    .help-section ol {
      margin-left: 20px;
      color: #555;
    }

    .help-section li {
      margin-bottom: 10px;
    }

    @media (max-width: 768px) {
      header h1 {
        font-size: 2em;
      }

      .template-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>📄 CV Template Gallery</h1>
      <p>Choose the perfect template for your job application</p>
    </div>
  </header>

  <div class="container">
    <div class="nav-links">
      <a href="../dashboard.html" class="nav-link">📊 Dashboard</a>
      <a href="../README.md" class="nav-link">📖 Documentation</a>
    </div>

    <div class="help-section">
      <h2>How to Choose a Template</h2>
      <ol>
        <li><strong>Browse the previews below</strong> — each template is rendered with sample data so you can see how it looks</li>
        <li><strong>Click "Preview"</strong> to see the full template in a new tab</li>
        <li><strong>Tell the AI which one you like</strong> — just say "Use the Modern template" and it will be set for your profile</li>
        <li><strong>Your choice is saved</strong> — once selected, every CV you generate will use that template automatically</li>
      </ol>
    </div>

    <div class="template-grid">
      ${previews.map(p => `
      <div class="template-card">
        <div class="template-preview">
          <iframe src="template-previews/preview-${p.name}.html" loading="lazy" title="${p.displayName} preview"></iframe>
        </div>
        <div class="template-info">
          ${p.name === 'standard' ? '<span class="template-badge badge-default">Default</span>' : ''}
          ${p.name === 'ats' ? '<span class="template-badge badge-ats">ATS Optimized</span>' : ''}
          ${p.name === 'cjk' || p.name === 'zh-minimal' ? '<span class="template-badge badge-cjk">CJK Support</span>' : ''}
          ${p.atsOk ? '<span class="template-badge badge-ats-pass">✅ ATS Pass</span>' : `<span class="template-badge badge-ats-warn">⚠️ ${p.atsWarnings} warning${p.atsWarnings !== 1 ? 's' : ''}</span>`}
          <h3>${p.displayName}</h3>
          <p>
            ${p.name === 'standard' ? 'Clean, professional layout. Great for most roles and industries.' : ''}
            ${p.name === 'modern' ? 'Contemporary design with accent colours. Ideal for tech and creative roles.' : ''}
            ${p.name === 'executive' ? 'Polished, authoritative style. Perfect for senior leadership positions.' : ''}
            ${p.name === 'leadership' ? 'Management-focused layout highlighting team size and impact metrics.' : ''}
            ${p.name === 'compact' ? 'Dense, efficient layout. Fits experience-heavy profiles on 1-2 pages.' : ''}
            ${p.name === 'jake' ? 'Creative, distinctive style. Stands out for design and media roles.' : ''}
            ${p.name === 'ats' ? 'Maximum ATS compatibility. Simple structure optimised for parsing systems.' : ''}
            ${p.name === 'zh-minimal' ? 'Minimal design with Chinese language support. Clean and professional.' : ''}
          </p>
          <div class="template-actions">
            <a href="template-previews/preview-${p.name}.html" target="_blank" class="btn btn-primary">👁 Preview</a>
            <button class="btn btn-secondary" onclick="selectTemplate('${p.name}')">✅ Select</button>
          </div>
        </div>
      </div>
      `).join('\n')}
    </div>
  </div>

  <script>
    function selectTemplate(name) {
      // Show confirmation
      const displayName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      // Create a modal-like confirmation
      const confirmation = document.createElement('div');
      confirmation.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;';
      confirmation.innerHTML = \`
        <div style="background:white;padding:30px;border-radius:10px;max-width:400px;text-align:center;">
          <h3 style="color:#667eea;margin-bottom:15px;">✅ Template Selected!</h3>
          <p style="margin-bottom:20px;">You chose the <strong>\${displayName}</strong> template.</p>
          <p style="margin-bottom:20px;color:#666;">Tell your AI assistant: <br><em>"Use the \${displayName.toLowerCase()} template"</em></p>
          <button onclick="this.closest('div').parentElement.remove()" style="background:#667eea;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">Got it!</button>
        </div>
      \`;
      document.body.appendChild(confirmation);
      
      // Click outside to close
      confirmation.addEventListener('click', (e) => {
        if (e.target === confirmation) confirmation.remove();
      });
    }
  </script>
</body>
</html>
`;

writeFileSync(resolve(root, 'examples', 'template-gallery.html'), galleryHtml);
console.log(`\n✅ Generated template gallery: examples/template-gallery.html`);
console.log(`📊 Total templates: ${previews.length}`);
