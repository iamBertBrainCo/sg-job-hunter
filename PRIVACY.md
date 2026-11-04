# Privacy: what happens to your data

SG Job Hunter is a free, open-source tool that runs on **your own computer**. It does not have a server, an account system or a database of its own, and its authors never receive your files.

But it uses an **AI model**, and the AI has to read your resume to help you. This page explains exactly where your information goes, so you can decide what to share.

> This page explains how the tool works. It is not legal advice.

## Where your information goes

| What | Where it goes |
|---|---|
| Your files: resume, career log, story bank, tailored resumes, job lists, pipeline | Saved **only on your computer**, in the `sg-job-hunter` folder. Git is set never to upload them (see `.gitignore`). |
| **Anything the AI reads or you type in the chat**, including your resume text | Sent over the internet to the **AI model provider** you connected in opencode. With the default set-up, that is the **SEA-LION API run by AI Singapore**. |
| Your job search words (for example "HR business partner") | Sent to the job boards and career sites being searched (MyCareersFuture, JobStreet and others). Your resume is **not** sent to them. |
| Your chat history | Saved by opencode on your computer. |

### "Open-source" does not mean "stays on your computer"

The Qwen SEA-LION model is open: anyone can download it. But with the default set-up you are **not** running it on your laptop; you are using AI Singapore's online service. Your text travels to their servers for the AI to read it.

### What AI Singapore's terms say

From the [SEA-LION Terms of Use](https://sea-lion.ai/terms-of-use/) and [Privacy Policy](https://sea-lion.ai/privacy-policy/), checked November 2026:

- The service is run by **AI Singapore**, a national programme hosted by the National University of Singapore, under Singapore law.
- They **may use what you send** "to provide, maintain, develop and improve our Services", and **may monitor use** of the service.
- You are responsible for what you send: you must make sure it "does not violate any applicable law".
- Answers may be **cached**, and the policy does not say how long chat content is kept or where it is stored.
- AI answers "may not always be accurate". Check everything before you use it.
- The AI must **not be used to make employment decisions about other people**. Use this tool for your own job search, not to assess other people's resumes.

Their terms can change. Read the current versions before you start. To ask about or delete data they hold, contact AI Singapore at sealion@aisingapore.org.

## Before you share your resume

Leave these out of anything you give the AI. Your resume should not include them anyway. When you **import a file** (from the `inbox` folder or a file path), the tool removes NRIC/FIN numbers, dates of birth, home addresses and referees' details *before* the AI sees the text. If you **type or paste** text into the chat yourself, it is sent exactly as you wrote it.


- **NRIC, FIN or passport numbers.**
- Date of birth, age, home address, marital status, religion, race or a photo.
- Salary history and payslips.
- **Other people's details**, such as referees' names, phone numbers and emails, or names in your career log. Write "References available on request" instead.
- Health information, and anything your current employer would treat as confidential (client names, internal figures you may not share).

If you are not comfortable sending your resume to an online AI service, you can:

- remove or change details before importing (for example "a regional bank" instead of the bank's name);
- connect a different AI provider whose terms you prefer, with `/connect` and `/models` in opencode;
- run an open model on your own computer instead, if it is powerful enough. Then nothing leaves your laptop.

## Deleting your data

- **Files on your computer:** tell the AI "delete my data" (it runs `npm run clear-my-data`). Or delete the `sg-job-hunter` folder.
- **The chat:** delete the session in opencode, because it contains what you shared.
- **Your API key on a shared computer:** `opencode auth logout sealion`.
- **Data held by the AI provider:** ask them. For SEA-LION, email sealion@aisingapore.org.

## Responsibility

SG Job Hunter is provided under the [MIT License](LICENSE), "as is", without warranty. You choose what you share, which AI provider you connect, and what you send to employers. The authors do not receive, store or process your personal data, and are not responsible for how third-party services (AI providers, job boards, employers) handle it. Always check AI-written resumes and answers before using them: the tool's fact check helps, but you are the final check.
