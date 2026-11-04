# Getting started

You need three free programs, then you talk to the AI.

## 1. Install (once)

| Program | Where | Check it worked |
|---|---|---|
| Node.js 22 or newer | https://nodejs.org (choose "LTS") | `node -v` shows v22 or higher |
| Git | https://git-scm.com | `git --version` |
| opencode | https://opencode.ai | `opencode --version` |

On Windows, use **Windows Terminal** or **PowerShell** for the commands below.

## 2. Download SG Job Hunter

```bash
git clone https://github.com/iamBertBrainCo/sg-job-hunter.git
```

```bash
cd sg-job-hunter
```

## 3. Start the AI

```bash
opencode
```

The first time, connect the AI model: type `/connect`, choose **Other**, enter `sealion`, and paste your API key.

## 4. Say what you want

> I want to find marketing manager jobs

The AI takes it from there: it installs what is missing, asks for your resume and career log, finds jobs, writes a tailored resume for each one you choose, and opens your pipeline page with Apply links. See [WALKTHROUGH.md](WALKTHROUGH.md) for the whole journey, and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if something goes wrong.

## Getting updates later

```bash
git pull
```

Your own files (resume, career log, saved jobs) are not touched by updates.
