# ♠ Call Break Scoreboard

A modern, offline-friendly scoreboard app for Call Break card games. Built with React + TypeScript + Tailwind CSS.

## Features

- 🎮 **Live Match Tracking** — Round-by-round score entry with real-time rankings
- 👥 **Player Management** — Add/edit/delete players with avatars and lifetime stats
- 📊 **Analytics** — Win rates, avg scores, skill radar charts
- 📈 **Score Graphs** — Visual score progression during matches
- 🕐 **Match History** — Browse and expand all past matches
- 💾 **Database-backed** — All data stored via REST API (Express + Supabase/PostgreSQL)
- 📱 **Mobile First** — Responsive design optimized for phones

## Call Break Scoring Rules

- ✅ **Met bid**: score = bid + (extra tricks × 0.1)
- ❌ **Failed bid**: score = −bid
- Each round has exactly 13 tricks total

## Setup

1. Start the backend (see `../backend/README.md`) and run DB migrations.
2. Configure the API URL:

```bash
cp .env.example .env
```

3. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS** — utility-first styling with custom design tokens
- **Zustand** — lightweight state management with persistence
- **Recharts** — score graphs and analytics charts
- **Lucide React** — icon library
- **Vite** — fast build tooling

## Project Structure

```
src/
├── components/
│   ├── scoreboard/     # ScoreEntry modal
│   ├── graphs/         # ScoreGraph with Recharts
│   └── ui/             # BottomNav, PlayerAvatar, BgSuits
├── pages/
│   ├── Dashboard.tsx
│   ├── PlayerManagement.tsx
│   ├── MatchSetup.tsx
│   ├── LiveMatch.tsx
│   ├── MatchHistory.tsx
│   └── Analytics.tsx
├── store/
│   └── useAppStore.ts  # Zustand global state
├── types/
│   └── index.ts
└── utils/
    └── index.ts        # Score calculation helpers
```

## Design

- **Dark theme** with deep ink backgrounds
- **Gold accent** color system for rankings and CTAs
- **Playfair Display** for headings, **DM Sans** for UI text
- **Glassmorphism** cards with subtle borders
- **CSS animations** for page transitions, rank changes, score updates
