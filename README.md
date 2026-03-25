# CineScores

A movie scheduling and rating PWA for friend groups. Add movies, schedule watch dates, rate them together, and sync everything across devices via GitHub.

## Features

- **Movie Management** — Search and add movies via TMDB with auto-fetched posters and metadata. Schedule viewing dates and track watched status.
- **Group Ratings** — Rate movies on a 1–10 scale with optional reviews. View averages, spot controversial picks, and compare scores across the group.
- **Spoiler-Free Mode** — Hide other users' scores until you've submitted your own rating.
- **GitHub Sync** — Store and sync movie data as JSON files in a GitHub repo. Conflict resolution with last-write-wins merging and tombstone-based deletions.
- **Installable PWA** — Add to home screen on any device. Works offline with service worker caching.
- **Dark & Light Themes** — Automatic theme support with mobile-optimized UI and safe area insets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Routing | React Router 6 |
| State | Zustand (localStorage persistence) |
| Build | Vite + vite-plugin-pwa |
| Styling | CSS custom properties |
| Deploy | GitHub Pages via Actions |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/flcn-96/cine-scores.git
cd cine-scores
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview   # preview the production build
```

## Configuration

All configuration is done through the in-app Settings page — no `.env` files required.

| Setting | Purpose |
|---------|---------|
| TMDB API Key | Enables movie search and poster fetching |
| GitHub PAT | Personal access token for data sync (requires repo content read/write) |
| GitHub Repo | Target repository for storing synced data |

## Project Structure

```
src/
├── components/     # Reusable UI (sheets, posters, badges, icons)
├── hooks/          # useSync, useMovieStats
├── pages/          # Home, Upcoming, Ratings, Users, Settings
├── store/          # Zustand store with localStorage persistence
├── types/          # TypeScript interfaces
└── utils/          # Text sanitization helpers
```

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the included workflow.

## License

This project is unlicensed. All rights reserved.
