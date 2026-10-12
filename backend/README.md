# Wizpace Backend (Job Platform API)

Express + MongoDB backend implementing the spec: JWT auth, resume-upload
onboarding with automated parsing/autofill, job discovery, Wizbot AI
assistant, and resume builder with PDF export.

## Setup

```bash
npm install
cp .env.example .env
# fill in .env: MONGO_URI (Atlas), JWT_SECRET, CLOUDINARY_*, SMTP_* (optional), ANTHROPIC_API_KEY (for Wizbot)
npm run dev     # nodemon, auto-restarts on change
# or
npm start
```

Server boots on `PORT` (default 5000). Health check: `GET /health`.

## What's real vs. what needs your keys

Everything runs and responds correctly out of the box **except** it needs
real credentials for these external services to actually do their job:

| Feature | Needs | Without it |
|---|---|---|
| Any DB operation | `MONGO_URI` (MongoDB Atlas) | Server fails to boot (by design — see below) |
| Resume/avatar upload | `CLOUDINARY_*` | Upload calls throw a clear error |
| Verification/reset emails | `SMTP_*` | Logs a warning, doesn't crash — lets you test the rest of the flow without email set up |
| Wizbot replies | `ANTHROPIC_API_KEY` | That one endpoint throws a clear "not configured" error; everything else works |

`env.js` validates required vars at boot and throws immediately with the
exact missing variable names — you'll never get a mysterious crash mid-request
because of a missing `.env` value.

## Resume parser — honest limitations

`resumeParser.service.js` uses regex/heuristics, not an LLM. Tested and
verified against generated PDF and DOCX resumes with standard section
headers (EXPERIENCE, EDUCATION, SKILLS) — email, phone, and skills extract
reliably; name/experience/education depend on the resume following common
formatting. That's exactly why the onboarding flow has a manual review step —
it's the safety net for whatever this parser gets wrong. If you want higher
accuracy later, swap `extractStructuredFields()` for an LLM call — the rest
of the pipeline (upload → extract text → return JSON) doesn't change.

## Two things added beyond the original spec

- **`Application` model** — the spec didn't include one, but "quick-apply,"
  application modals, and dashboard "application metrics" all need a record
  of who applied to what. Without it those features have no real data.
- **`WizbotConversation` model** — needed to persist chat history between
  requests; a chat UI with no memory isn't functional.

## API overview

All routes mounted under `/api/v1`:
- `/auth` — signup, signin, logout, me, verify-email, forgot/reset-password
- `/onboarding` — parse-resume (upload + autofill), complete, status
- `/users` — profile, dashboard
- `/jobs` — list/search (public), recommended, CRUD, apply, my applications
- `/resume` — templates, get/update, PDF preview (streamed), PDF export (Cloudinary URL)
- `/wizbot` — conversations, send message, bot config

## Testing notes

This was built and verified in a sandboxed environment without access to a
live MongoDB instance (the sandbox's network allowlist doesn't include
MongoDB's binary download host, so `mongodb-memory-server` couldn't run
either). What **was** tested directly, with real generated files and a real
running Express server:

- Resume parsing against actual generated PDF and DOCX files (caught and
  fixed a real bug in experience-entry detection during this process)
- PDF generation for all 3 resume templates (validated as real PDF output)
- JWT sign/verify roundtrip, invalid-token handling, bcrypt hash/compare
- Every Zod validator's accept/reject behavior
- A live-booted Express server hit with real HTTP requests: health check,
  404 handling, validation errors, auth guards (401 without a token), CORS
  headers, and the full middleware chain — all before any code path touches
  the database
- Every file passes `node --check` (syntax validation)

Not tested here (needs a real MongoDB Atlas cluster on your end): the actual
read/write database operations inside each controller (`User.create`,
`Job.find`, etc.), Cloudinary uploads, and email sending. These use standard,
well-documented Mongoose/Cloudinary/Nodemailer APIs, but "the code is correct
Mongoose" and "I watched it write to your actual Atlas cluster" are different
claims — connect `MONGO_URI` to a real cluster and run through the signup →
onboarding → job search flow to confirm end-to-end.
