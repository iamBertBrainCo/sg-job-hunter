# Troubleshooting

Most problems can be fixed by telling the AI what you see. If you are stuck, run this in the `sg-job-hunter` folder and read the lines marked FAIL:

```bash
npm run check
```

## Setup

| What you see | What to do |
|---|---|
| `node` / `npm` / `git` / `opencode` "is not recognized" or "command not found" | Install it (see [GETTING_STARTED.md](GETTING_STARTED.md)), then **close and reopen** the terminal. |
| `Node.js … is too old` | Install Node.js 22 LTS or newer from https://nodejs.org. |
| `npm install failed` | Check your internet connection and run `npm run check` again. On office laptops, a company proxy may block downloads; try another network. |
| `Chromium install failed` | Run `npx playwright install chromium`. Without it, PDFs cannot be made, but job search still works. |
| opencode asks for a model or says "no provider" | In opencode type `/models` and pick a model marked **Free**. See [PRIVACY.md](PRIVACY.md) for which free models are best for resumes. |
| Claude Code, Codex or Antigravity doesn't follow the steps (it never runs `npm run check`) | Make sure you started it **inside** the `sg-job-hunter` folder, or opened that exact folder as the project. Then type: *Please follow AGENTS.md*. |
| Claude Code, Codex or Antigravity keeps asking permission to run commands | That is normal. Allow the `npm run …` commands it asks for. Do not allow anything that would sign in, send an email or submit an application for you. |

## While using it

| What you see | What to do |
|---|---|
| "Rate limit", "usage limit", "429" or the AI pauses | Free models have usage limits. Wait a minute and type **continue**. If a free model stops working, pick another free one with `/models`. On a paid plan (Claude, ChatGPT, Gemini), you have hit your plan's limit for now; the message usually says when it resets. |
| opencode asks permission to access a folder outside the project | Choose **reject**. Everything it needs is inside the `sg-job-hunter` folder. Then type **continue**. |
| "No resume found" | Put your resume in the `inbox` folder (PDF or Word), or paste the text into the chat. |
| "almost no text — probably a scanned image" | Your PDF is a picture. Use the Word version, or paste the text. |
| Old `.doc` file | Open it in Word or Google Docs and save as `.docx` or PDF. |
| Few or no jobs found | Ask for a broader title ("HR" instead of "HRBP"), a different title, or "search ASEAN too". |
| "Could not reach: …" after a search | That one site was slow or down; the other results are still fine. Try again later. |
| FACT CHECK ⚠ lines | The resume has something that is not in your resume or career log. Answer honestly: keep only what is true. |
| The PDF is more than 2 pages | Ask the AI to "cut it to 2 pages". |
| The pipeline page did not open | Open `output/pipeline.html` from the `sg-job-hunter` folder in your browser. |

## Starting again

To redo your master resume, ask the AI to "start my resume again", or delete `cv.md` and `career-log.md`. Your saved jobs are in `output/applications/`; delete a folder there to remove one, and delete `data/pipeline.json` to clear the whole pipeline.
