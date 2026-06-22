# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server (after build)
```

No test suite is configured.

## Architecture

**카카오톡 채팅 분석기** — A single-page Next.js app that parses a KakaoTalk CSV export and uses the Claude API to generate a summary, topic list, and prioritized action items for group chat admins.

### Data flow

1. `app/page.tsx` (Client Component) — handles CSV upload (drag-and-drop or file picker), parses it with PapaParse, and renders chat metadata + analysis results.
2. On "AI 분석 시작", the page POSTs `{ messages }` to `/api/analyze`.
3. API route processes the messages and returns structured JSON — see @app/api/CLAUDE.md for details.

### CSV format expected

The uploaded CSV must have headers: `date`, `user`, `message` (case-insensitive — PapaParse lowercases them). Rows missing `date` or `user` are dropped.

### Key dependencies

| Package | Role |
|---|---|
| `next` 16.2.9 | App Router framework — **read `node_modules/next/dist/docs/` before editing** |
| `@anthropic-ai/sdk` | Claude API client |
| `papaparse` | CSV parsing in the browser |
| `tailwindcss` v4 | Styling (PostCSS plugin, no `tailwind.config.*`) |
