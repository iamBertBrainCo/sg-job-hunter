// generate-dashboard.mjs - Generate dashboard HTML from applications.md
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Parse applications.md
function parseApplications(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const applications = [];

  let headerIndex = -1;
  let header = [];

  // Find header row
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|') && lines[i].includes('Company') && lines[i].includes('Role')) {
      headerIndex = i;
      header = lines[i].split('|').map(h => h.trim()).filter(h => h);
      break;
    }
  }

  if (headerIndex === -1) {
    console.log('❌ Could not find header row in applications.md');
    return [];
  }

  // Parse data rows
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length < header.length) continue;

    const app = {};
    header.forEach((h, idx) => {
      app[h.toLowerCase()] = cells[idx];
    });

    applications.push(app);
  }

  return applications;
}

// Generate dashboard HTML
function generateDashboard(applications) {
  const appsJSON = JSON.stringify(applications, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SG Job Hunter - Dashboard</title>
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

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-card h3 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .stat-card p {
            color: #666;
            font-size: 1.1em;
        }

        .funnel-container {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .funnel-container h2 {
            margin-bottom: 20px;
            color: #333;
        }

        .funnel {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 20px 0;
        }

        .funnel-stage {
            display: flex;
            align-items: center;
            gap: 20px;
            width: 100%;
            max-width: 600px;
        }

        .funnel-bar {
            height: 50px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .funnel-bar:hover {
            opacity: 0.8;
        }

        .funnel-label {
            width: 150px;
            text-align: right;
            font-weight: 500;
        }

        .funnel-value {
            width: 80px;
            text-align: left;
            font-weight: 600;
            color: #667eea;
        }

        .applications-table {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow-x: auto;
        }

        .applications-table h2 {
            margin-bottom: 20px;
            color: #333;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }

        .status-evaluated {
            background: #e3f2fd;
            color: #1976d2;
        }

        .status-applied {
            background: #e8f5e9;
            color: #388e3c;
        }

        .status-interview {
            background: #fff3e0;
            color: #f57c00;
        }

        .status-offer {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .status-rejected {
            background: #ffebee;
            color: #d32f2f;
        }

        .status-skip {
            background: #f5f5f5;
            color: #757575;
        }

        .score {
            font-weight: 600;
            color: #667eea;
        }

        .chart-container {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .chart-container h2 {
            margin-bottom: 20px;
            color: #333;
        }

        .bar-chart {
            display: flex;
            align-items: flex-end;
            height: 200px;
            gap: 20px;
            padding: 20px 0;
        }

        .bar {
            flex: 1;
            background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
            border-radius: 5px 5px 0 0;
            position: relative;
            transition: all 0.3s ease;
        }

        .bar:hover {
            opacity: 0.8;
        }

        .bar-label {
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.9em;
            color: #666;
            white-space: nowrap;
        }

        .bar-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: 600;
            color: #333;
        }

        .export-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .export-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: background 0.3s;
        }

        .export-btn:hover {
            background: #5568d3;
        }

        @media (max-width: 768px) {
            header h1 {
                font-size: 2em;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            table {
                font-size: 0.9em;
            }

            th, td {
                padding: 8px;
            }

            .funnel-label {
                width: 100px;
                font-size: 0.9em;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>🇸🇬 SG Job Hunter</h1>
            <p>Your application pipeline dashboard</p>
        </div>
    </header>

    <div class="container">
        <!-- Export Buttons -->
        <div class="export-buttons">
            <button class="export-btn" onclick="exportToPDF()">📄 Export to PDF</button>
            <button class="export-btn" onclick="exportToCSV()">📊 Export to CSV</button>
            <button class="export-btn" onclick="refreshData()">🔄 Refresh</button>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <h3 id="total-jobs">0</h3>
                <p>Total Jobs Found</p>
            </div>
            <div class="stat-card">
                <h3 id="evaluated-jobs">0</h3>
                <p>Evaluated</p>
            </div>
            <div class="stat-card">
                <h3 id="applied-jobs">0</h3>
                <p>Applied</p>
            </div>
            <div class="stat-card">
                <h3 id="interview-jobs">0</h3>
                <p>Interviews</p>
            </div>
            <div class="stat-card">
                <h3 id="offer-jobs">0</h3>
                <p>Offers</p>
            </div>
        </div>

        <!-- Funnel Visualization -->
        <div class="funnel-container">
            <h2>📊 Application Funnel</h2>
            <div class="funnel" id="funnel-chart">
                <!-- Funnel will be populated by JavaScript -->
            </div>
        </div>

        <!-- Applications Table -->
        <div class="applications-table">
            <h2>📋 Applications</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>PDF</th>
                        <th>Report</th>
                    </tr>
                </thead>
                <tbody id="applications-body">
                    <!-- Data will be populated by JavaScript -->
                </tbody>
            </table>
        </div>

        <!-- Status Distribution Chart -->
        <div class="chart-container">
            <h2>📊 Status Distribution</h2>
            <div class="bar-chart" id="status-chart">
                <!-- Chart will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <script>
        // Data from applications.md
        const applications = ${appsJSON};

        // Populate statistics
        document.getElementById('total-jobs').textContent = applications.length;
        document.getElementById('evaluated-jobs').textContent = applications.filter(a => a.status === 'Evaluated').length;
        document.getElementById('applied-jobs').textContent = applications.filter(a => a.status === 'Applied').length;
        document.getElementById('interview-jobs').textContent = applications.filter(a => a.status === 'Interview').length;
        document.getElementById('offer-jobs').textContent = applications.filter(a => a.status === 'Offer').length;

        // Populate applications table
        const tbody = document.getElementById('applications-body');
        applications.forEach(app => {
            const row = document.createElement('tr');
            row.innerHTML = \`
                <td>\${app['#']}</td>
                <td>\${app.date}</td>
                <td>\${app.company}</td>
                <td>\${app.role}</td>
                <td class="score">\${app.score}</td>
                <td><span class="status status-\${app.status.toLowerCase()}">\${app.status}</span></td>
                <td>\${app.pdf}</td>
                <td>\${app.report}</td>
            \`;
            tbody.appendChild(row);
        });

        // Populate funnel chart
        const funnelStages = [
            { label: 'Jobs Found', count: applications.length },
            { label: 'Evaluated', count: applications.filter(a => a.status === 'Evaluated').length },
            { label: 'Applied', count: applications.filter(a => a.status === 'Applied').length },
            { label: 'Interviews', count: applications.filter(a => a.status === 'Interview').length },
            { label: 'Offers', count: applications.filter(a => a.status === 'Offer').length }
        ];

        const funnel = document.getElementById('funnel-chart');
        const maxCount = Math.max(...funnelStages.map(s => s.count));

        funnelStages.forEach(stage => {
            const stageDiv = document.createElement('div');
            stageDiv.className = 'funnel-stage';
            stageDiv.innerHTML = \`
                <div class="funnel-label">\${stage.label}</div>
                <div class="funnel-bar" style="width: \${(stage.count / maxCount) * 100}%">\${stage.count}</div>
                <div class="funnel-value">\${stage.count}</div>
            \`;
            funnel.appendChild(stageDiv);
        });

        // Populate status distribution chart
        const statusCounts = {};
        applications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        });

        const chart = document.getElementById('status-chart');
        const maxStatusCount = Math.max(...Object.values(statusCounts));

        Object.entries(statusCounts).forEach(([status, count]) => {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = \`\${(count / maxStatusCount) * 100}%\`;
            bar.innerHTML = \`
                <div class="bar-value">\${count}</div>
                <div class="bar-label">\${status}</div>
            \`;
            chart.appendChild(bar);
        });

        // Export to PDF
        function exportToPDF() {
            window.print();
        }

        // Export to CSV
        function exportToCSV() {
            const csv = [
                ['#', 'Date', 'Company', 'Role', 'Score', 'Status', 'PDF', 'Report'],
                ...applications.map(app => [
                    app['#'],
                    app.date,
                    app.company,
                    app.role,
                    app.score,
                    app.status,
                    app.pdf,
                    app.report
                ])
            ].map(row => row.join(',')).join('\\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'applications.csv';
            a.click();
        }

        // Refresh data
        function refreshData() {
            location.reload();
        }
    </script>
</body>
</html>`;
}

// Main
const filePath = join('data', 'applications.md');
const applications = parseApplications(filePath);
const html = generateDashboard(applications);
writeFileSync('dashboard.html', html);

console.log(`✅ Dashboard generated with ${applications.length} applications`);
console.log(`📄 Open dashboard.html in your browser to view`);
