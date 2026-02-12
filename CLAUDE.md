# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ValutaCasa CRM — a real estate CRM dashboard for managing property valuation leads in the Italian market. All UI text is in Italian.

## Commands

- `npm run dev` — Start Vite dev server on port 3000
- `npm run build` — Production build
- `npm run preview` — Preview production build

No linter or test runner is configured.

## Tech Stack

- **React 19** with TypeScript (target ES2022, JSX react-jsx)
- **Vite 6** as build tool and dev server
- **Tailwind CSS 3** loaded via CDN `<script>` tag in `index.html` (no PostCSS config)
- **Framer Motion** for page transitions and micro-animations
- **Recharts** for data visualization (line, bar, pie charts)
- **Lucide React** for icons
- **@supabase/supabase-js** imported but currently using mock data

## Architecture

### Routing

Custom client-side router in `App.tsx` using `useState` for path tracking — no react-router. Navigation is passed down as an `onNavigate` callback prop. The browser URL does not change; routing is purely in-memory state.

Routes: `/dashboard`, `/dashboard/leads`, `/dashboard/leads/:id`, `/dashboard/analytics`, `/dashboard/activities` (placeholder), `/dashboard/settings` (placeholder).

### Data Layer

`lib/supabase.ts` contains all data types (`Lead`, `Activity`), mock data arrays, and async CRUD functions that simulate network latency. To connect a real backend, replace the mock function implementations with actual Supabase queries — the function signatures and types are already production-shaped.

### State Management

Local component state only (`useState` + `useEffect`). No global store. Each page fetches its own data on mount via async functions from `lib/supabase.ts`.

### File Organization

```
App.tsx                  — Root component with client-side router
index.tsx                — React DOM mount point
app/dashboard/
  layout.tsx             — Sidebar + header shell (wraps all pages)
  page.tsx               — Dashboard overview (KPIs, charts, widgets)
  leads/page.tsx         — Leads list with advanced table
  leads/[id]/page.tsx    — Lead detail with tabs (info, activity, notes)
  analytics/page.tsx     — Analytics with charts and performance tables
components/
  dashboard/             — Dashboard-specific widgets (FollowUpWidget, LeadsChart, RecentLeads)
  layout/                — Layout components (NotificationCenter)
  leads/                 — Lead components (LeadsTable, ActivityTimeline)
lib/
  supabase.ts            — Types, mock data, async data functions
  utils.ts               — cn() helper, Italian date/currency formatters, badge color helpers
```

## Conventions

- **Styling:** Pure Tailwind utility classes, no custom CSS files. Glass morphism pattern: `bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl`. Use `cn()` from `lib/utils.ts` for conditional classes.
- **Animations:** Framer Motion `motion.div` with `initial/animate/exit` for page transitions and list items. Interactive elements use `whileHover`/`whileTap`.
- **Lead statuses:** `nuovo`, `contattato`, `qualificato`, `in_trattativa`, `vinto`, `perso` — colors defined in `lib/utils.ts:getStatusColor`.
- **Lead quality:** `HOT`, `WARM`, `COLD` — colors defined in `lib/utils.ts:getLeadQualityColor`.
- **Path alias:** `@/*` maps to project root (configured in tsconfig.json and vite.config.ts).
- **New pages** go in `app/dashboard/<name>/page.tsx` and must be added to the router in `App.tsx`.
- **New data functions** go in `lib/supabase.ts` following the existing async pattern with simulated delay.
