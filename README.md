<div align="center">

<img src="public/applyai-logo.png" alt="ApplyAI" width="340" />

### Tailor every resume to the job — before you apply.

The web app for **ApplyAI**: upload a résumé, analyze it against a job with AI, rewrite it, export a role‑ready PDF, and track every application on a kanban board.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-ff4d8d?logo=framer&logoColor=white)

**Backend API →** [marwaneqada/applyai-api](https://github.com/marwaneqada/applyai-api)

</div>

---

## ✨ Overview

ApplyAI helps job seekers **tailor each application** instead of sending the same résumé everywhere. This repository is the **frontend** — a Next.js 16 App Router single‑page app that talks to the [ApplyAI Laravel API](https://github.com/marwaneqada/applyai-api) over a typed REST client with token auth.

The flow: **upload a résumé → analyze it against a job description → review scores, gaps, rewrites & a cover letter → export a tailored PDF → track the application.**

## 🚀 Features

**Marketing**
- Animated, responsive landing page with a scroll‑reveal narrative and product mockups

**Authenticated app**
- 🔐 **Auth** — email/password login & register (token sessions via Laravel Sanctum)
- 📄 **Résumés** — drag‑&‑drop PDF upload (≤5 MB) with instant parse status, list & delete
- 🧠 **AI analysis** — match score with keyword / experience / skills breakdowns, matched vs missing keywords, strengths, weaknesses, a severity‑tagged gap analysis, rewritten bullet points, and a generated cover letter
- 🎯 **Tailored PDF export** — Harvard, Modern, or Minimal templates
- 🗂️ **Application tracker** — kanban board (Saved → Applied → Interview → Offer → Rejected) with **drag‑and‑drop**, optimistic updates + rollback, and stats
- 🧭 **Dashboard** — workspace overview with recent analyses and pipeline
- 💡 **Guided tour** — an interactive, cross‑page onboarding walkthrough

## 🧱 Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Auth | Laravel Sanctum bearer tokens (stored client‑side) |
| Data | Typed `fetch` client in `src/lib/api.ts` |

## 📸 Screenshots

> Drop images in `public/screenshots/` and reference them here, e.g. `![Landing](public/screenshots/landing.png)`.

## 🏁 Getting started

**Prerequisites:** Node.js 18+ and a running [ApplyAI API](https://github.com/marwaneqada/applyai-api).

```bash
# 1. Install dependencies
npm install

# 2. Point the app at your API (create .env.local)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the ApplyAI API (the client appends `/api`). |
| `NEXT_PUBLIC_REVERB_APP_KEY` | Public Reverb application key. |
| `NEXT_PUBLIC_REVERB_HOST` | Public hostname of the Reverb WebSocket server. |
| `NEXT_PUBLIC_REVERB_PORT` | Public WebSocket port (`8080` locally, usually `443` in production). |
| `NEXT_PUBLIC_REVERB_SCHEME` | WebSocket transport scheme (`http` locally, `https` in production). |

## 📜 Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint
```

## 🗂️ Project structure

```txt
src/
  app/                 # App Router routes (landing, /login, /register, /app/*)
  components/
    landing/           # landing-page sections
    app/               # authenticated app views (resumes, analyses, applications, tour)
    brand/             # shared logo
    ui/                # shared primitives
  contexts/            # auth context
  lib/                 # typed API client
public/                # logo, icon, static assets
```

## 🔗 Related

- **API / backend:** [marwaneqada/applyai-api](https://github.com/marwaneqada/applyai-api)

<div align="center"><sub>Built with Next.js · TypeScript · Tailwind CSS</sub></div>
