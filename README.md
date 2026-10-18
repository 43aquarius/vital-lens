# VitalLens

> Your blood tests, finally speaking your language.

VitalLens turns dense lab reports into plain-language health briefings, longitudinal
trends, and doctor-ready summaries. A vision-language model reads the report like a
lab technician would; a deterministic medical rules engine keeps every safety call
accountable — the AI explains, but it never gets the final word on danger.

| | |
|---|---|
| **Live demo** | https://vital-lens.pages.dev |
| **Demo video (3:28)** | https://43aquarius.github.io/vital-lens/demo.mp4 |
| **One-pager PDF** | [project-description.pdf](./project-description.pdf) |
| **Built for** | UnivaBio 2026 — *Artificial Intelligence for Human Health* |

## The problem

Every year, billions of lab tests are ordered, and patients receive the results as
PDFs or portals full of numbers, units, and reference ranges they were never trained
to read. A single out-of-range marker gets googled into a spiral of anxiety, while
the far more valuable signal — *how a marker has been drifting across months or
years* — stays invisible, because every report is read in isolation. Doctors get 15
minutes per visit; patients leave with questions they forgot to ask. VitalLens is
built around exactly that gap: interpretation, memory, and preparation.

## What it does — four modules

1. **Lab Decoder** — Upload a photo or scan of a lab report. A vision-language model
   extracts *every* marker (value, unit, and the reference range printed on the
   report) into strict structured data, then an LLM writes a plain-language briefing:
   what the report shows, what looks off, what to do next, and what to ask your doctor.
2. **Health Timeline** — Every saved report lands on one timeline with per-marker
   trend charts and reference bands, so a slow drift becomes impossible to miss.
   The built-in demo tells one story end-to-end: across three of Sarah Chen's
   reports, hemoglobin and ferritin slide gradually downward — trend analysis flags
   developing iron-deficiency anemia long before any single report looks alarming.
3. **Symptom Guide (Nurse V)** — A triage-style conversational guide. Describe how
   you feel; Nurse V asks structured follow-ups, returns plain-language guidance,
   and escalates to "seek urgent care" whenever the rules engine says so.
4. **Doctor Prep** — One tap produces the appointment briefing: current values vs.
   ranges, deltas vs. your last visit, and talking points — so the 15-minute visit
   starts where it should.

## How it works (and why it's safe)

- **Stage 1 — Vision extraction.** GLM vision model (via `z-ai-web-dev-sdk`) reads the
  lab report image and returns strict JSON: patient, date, lab, and every marker with
  its printed reference range. Anything not printed on the report is never invented.
- **Stage 2 — Deterministic medical layer** (`src/lib/medical.ts`). Reference ranges
  for 40+ markers, critical-value thresholds, status evaluation, and trend math all
  happen in ordinary TypeScript — not in the LLM.
- **Stage 3 — Language layer.** An LLM turns the structured data into the briefing
  you actually read. Every red flag shown to a user is computed by the rules engine;
  the model may explain a flag, but it can never create or suppress one.

VitalLens is an educational tool, not a medical device, and it says so — in the app
and in every briefing it produces.

## Demo story

The seeded demo (`POST /api/demo-seed`) loads Sarah Chen's three reports
(Apr → Jul → Oct 2026). Watch the Timeline module: hemoglobin 13.2 → 11.9 → 10.8
g/dL and ferritin 38 → 22 → 11 ng/mL. No single report is an emergency; the *trend*
is the finding.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui ·
Prisma + SQLite · recharts · framer-motion · react-markdown ·
`z-ai-web-dev-sdk` (GLM VLM + LLM)

## Quickstart

```bash
bun install            # or: npm install
bunx prisma db push    # creates the local SQLite database
bun dev                # http://localhost:3000

# load the demo story:
curl -X POST http://localhost:3000/api/demo-seed
```

Only `DATABASE_URL` is required (see `.env.example`); the AI layer configures itself
through `z-ai-web-dev-sdk`. A sample lab report image for testing the Decoder lives
at `public/samples/sample-lab-report.png`.

## Project structure

```
src/
  app/                    # routes + API (lab-reports, trends, symptom-checker, doctor-prep, demo-seed)
  components/vitallens/   # hero, lab-decoder, timeline, symptom-checker, doctor-prep, …
  lib/medical.ts          # deterministic rules engine: ranges, critical thresholds, trends
  lib/ai.ts               # VLM extraction + LLM briefing (server-only)
prisma/schema.prisma      # LabReport, SymptomSession
demo.mp4                  # 3:28 demo video (also served via GitHub Pages)
```

## Safety & disclaimer

VitalLens does not diagnose. It translates, visualizes, and prepares. Red-flag
escalation is rule-based and deterministic; AI-generated text is always framed as
information, never as a diagnosis. In a medical emergency, contact emergency
services — not VitalLens.

## Credits

Built by [aquars](https://github.com/43aquarius) for the UnivaBio 2026 hackathon.
