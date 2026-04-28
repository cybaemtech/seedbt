# SeedTrack Pro

## Overview

Asset & batch management system for an agriculture seed company.
React + Vite frontend with sidebar dashboard, Express backend, and a JSON
file as the data store (no database).

## Stack

- **Frontend**: React + Vite (Tailwind v4, shadcn/ui, react-query, wouter, react-hook-form)
- **Backend**: Express 5 (`artifacts/api-server`)
- **Storage**: JSON file at `artifacts/api-server/data/seedtrack.json`
- **Validation**: Zod schemas generated from `lib/api-spec/openapi.yaml`
- **API client**: React Query hooks generated from the same OpenAPI spec

## Features

- Dashboard with summary cards, alert groups (expiring / expired / low stock),
  and a recent activity feed.
- Inventory table with search, status filter, and color-coded status badges.
  Status (Fresh / Expiring / Expired) is auto-calculated from `expiryDate`
  on every read.
- Add / edit / delete asset workflows with confirmation.
- Per-asset batch detail page with a vertical movement-history timeline
  and a "Log Movement" form (Created / Stored / Dispatched / Delivered).

## API Endpoints

All under `/api`:
- `GET /assets`, `POST /assets`, `GET/PUT/DELETE /assets/:id`
- `GET /assets/:id/history`, `POST /assets/:id/history`
- `GET /dashboard/summary`, `GET /dashboard/alerts`, `GET /dashboard/recent-activity`
- `GET /healthz`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/seedtrack-pro run dev` — run the frontend
