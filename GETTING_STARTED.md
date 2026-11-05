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

Either in the terminal (from inside the `sg-job-hunter` folder):

```bash
opencode
```

or in the **opencode desktop app**: open the `sg-job-hunter` folder as your project. It must be this exact folder; any other folder, including an older copy, will not have the instructions.

Then choose an AI model: type `/models` and pick one marked **Free**. No account or API key is needed. Because you will share your resume, pick a free model whose provider keeps no data and does not train on it, and avoid any that say not to submit personal data. [PRIVACY.md](PRIVACY.md) shows how to check. If a free model stops working (free offers change), just pick another.

## 4. Say what you want

> I want to find marketing manager jobs

The AI takes it from there: it installs what is missing, shows a short privacy notice (please read [PRIVACY.md](PRIVACY.md); the AI service reads what you share), asks for your resume and career log, finds jobs, writes a tailored resume for each one you choose, and opens your pipeline page with Apply links. See [WALKTHROUGH.md](WALKTHROUGH.md) for the whole journey, and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if something goes wrong.

## Clearing your data at the end

Tell the AI **"delete my data"**. It lists your personal files (resume, career log, saved jobs, tailored resumes, pipeline) and deletes them once you confirm. Then:

- Delete the chat itself from opencode's session list, since it contains your resume text.
- On a shared or borrowed computer, if you added an API key to opencode, remove it:

```bash
opencode auth logout
```

## Getting updates later

```bash
git pull
```

Your own files (resume, career log, saved jobs) are not touched by updates.
