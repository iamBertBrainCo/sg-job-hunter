# Privacy: what happens to your data

SG Job Hunter is a free, open-source tool that runs on **your own computer**. It does not have a server, an account system or a database of its own, and its authors never receive your files.

But it uses an **AI model** that you choose (in opencode, or in Claude Code, Codex, Antigravity or another tool you already pay for), and the AI has to read your resume to help you. This page explains where your information goes, so you can decide what to share and which model to use.

> This page explains how the tool works. It is not legal advice.

## Where your information goes

| What | Where it goes |
|---|---|
| Your files: resume, career log, story bank, tailored resumes, job lists, pipeline | Saved **only on your computer**, in the `sg-job-hunter` folder. Git is set never to upload them (see `.gitignore`). |
| **Anything the AI reads or you type in the chat**, including your resume text | Sent over the internet to the **company that runs the AI model** you picked. |
| Your job search words (for example "HR business partner") | Sent to the job boards and career sites being searched (MyCareersFuture, JobStreet and others). Your resume is **not** sent to them. |
| Your chat history | Saved by your AI tool. opencode keeps it on your computer; some tools (for example the Claude, ChatGPT and Gemini apps) also keep it in your online account. |

## Choosing a free model for your resume

opencode offers several **free** models (type `/models` and look for **Free**). They are run by different companies, mostly in the US and EU, and their privacy rules are **not all the same**. opencode lists each one's rules on its [Zen page](https://opencode.ai/docs/zen), under "Privacy" and "Free models". When this page was written (November 2026), the list fell into three groups:

| What opencode says about the model | OK for your resume? |
|---|---|
| The provider "follows a zero-retention policy and does not use your data for model training" | **Best choice.** |
| Data is kept for a while (for example 30 days) but "not used for training" | Acceptable if you have left out the sensitive details below. |
| "Collected data may be used to improve the model" during its free period | **Avoid for your resume.** Fine for general questions. |
| "Do not submit personal or confidential data" | **Do not use** for your resume. |

Free models come and go, and their rules can change. Check the Zen page when you choose one. If you already pay for an AI service you trust, you can use that model in opencode instead, or use that company's own tool (see below).

## If you use a paid plan (Claude, ChatGPT, Gemini)

You can run SG Job Hunter in Claude Code, Codex or Antigravity instead of opencode. Your resume then goes to that company, under your plan's privacy rules. Personal plans and work plans are often treated differently:

- **Personal plans** (for example Claude Pro or Max, ChatGPT Plus or Pro, Google AI plans): the company may use your chats to improve its models unless you turn this off. Look in the app's privacy or data settings (at the time of writing: "Help improve Claude" in Claude, "Improve the model for everyone" in ChatGPT, and Gemini Apps Activity in Google). Turn it off before you share your resume if you prefer.
- **Work or team plans** (for example Claude Team or Enterprise, ChatGPT Business or Enterprise): these usually do not train on your data by default, but your employer may be able to see what you send. Use a personal plan for your own job search.

Settings and names change, so check the company's privacy page when you start.

### "Open-source" or "free" does not mean "stays on your computer"

A free model in opencode still runs on another company's servers; your text travels there for the AI to read it. The only way to keep everything on your laptop is to run an open model on your own computer, which needs a powerful machine.

### Use it for your own job search

AI providers generally do not allow their models to be used to make hiring decisions about other people. Use this tool for **your own** job search, not to assess other people's resumes. AI answers can be wrong: check everything before you use it.

## Before you share your resume

Leave these out of anything you give the AI. Your resume should not include them anyway. When you **import a file** (from the `inbox` folder or a file path), the tool removes NRIC/FIN numbers, dates of birth, home addresses and referees' details *before* the AI sees the text. If you **type or paste** text into the chat yourself, it is sent exactly as you wrote it.

- **NRIC, FIN or passport numbers.**
- Date of birth, age, home address, marital status, religion, race or a photo.
- Salary history and payslips.
- **Other people's details**, such as referees' names, phone numbers and emails, or names in your career log. Write "References available on request" instead.
- Health information, and anything your current employer would treat as confidential (client names, internal figures you may not share).

If you are still not comfortable, you can also remove or change details before importing (for example "a regional bank" instead of the bank's name).

## Deleting your data

- **Files on your computer:** tell the AI "delete my data" (it runs `npm run clear-my-data`). Or delete the `sg-job-hunter` folder.
- **The chat:** delete the session or chat in your AI tool, because it contains what you shared. If your tool also keeps chats in your online account, delete it there too.
- **Signing out on a shared computer:** in opencode, remove any API key you added with `opencode auth logout`. In Claude Code type `/logout`; in Codex run `codex logout`; in Antigravity sign out from the app.
- **Data held by an AI provider:** ask that provider, using the contact details in its privacy policy.

## Responsibility

SG Job Hunter is provided under the [MIT License](LICENSE), "as is", without warranty. You choose what you share, which AI model you use, and what you send to employers. The authors do not receive, store or process your personal data, and are not responsible for how third-party services (AI providers, job boards, employers) handle it. Always check AI-written resumes and answers before using them: the tool's fact check helps, but you are the final check.
