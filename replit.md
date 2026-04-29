# SeedTrack Pro

## Overview

Full-stack operational SaaS system for agriculture seed inventory management.

## Architecture

- **Monorepo**: pnpm workspaces with shared packages in `/lib`
- **Frontend**: React 19 + Vite (port 5000, proxies `/api` to port 8080)
- **Backend**: Express 5 + TypeScript (port 8080)
- **API Contract**: OpenAPI spec in `lib/api-spec/openapi.yaml` → Orval codegen → `lib/api-client-react`
- **State**: TanStack Query (React Query v5)
- **Routing**: Wouter
- **Styling**: Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Charts**: Recharts

## Key Features

1. **Dashboard** — 6 KPI cards (assets, fresh/expiring/expired, total value $, value at risk $), risk summary, inventory-over-time area chart, category pie chart, expiry bar chart, recent activity timeline, alerts tabs
2. **Seed Inventory** — Table with category, germination rate, expiry intelligence badges (🟢 Safe / 🟡 Monitor / 🔴 Sell Now), multi-field filters, CSV export
3. **Register / Edit Batch** — Full form with new fields: category, supplier, germinationRate, pricePerUnit, productionDate
4. **Asset Detail** — Summary KPIs, stock forecast widget (stockout date, risk flag), full detail grid, event history, inline edit form
5. **Stock Movements** — IN/OUT/TRANSFER log with KPI row, date range filters, "Move Stock" dialog form, CSV export
6. **Analytics** — Financial KPIs ($55K value, $17.8K at risk), stock-over-time area chart, movement trends bar chart, category donut, location stock bars, CSV report downloads

## Data Model (StoredAsset)

New fields beyond legacy schema:
- `category`: "Vegetable" | "Grain" | "Legume" | "Oilseed" | "Fiber" | "Spice" | "Fruit" | "Herb" | "Other"
- `supplier`: string
- `germinationRate`: number (0–100)
- `pricePerUnit`: number
- `productionDate`: ISO string
- Computed: `status`, `daysRemaining`, `expiryPriority`, `totalValue`

## API Routes

All prefixed `/api`:
- `GET /api/assets`, `POST /api/assets`, `GET /api/assets/:id`, `PUT /api/assets/:id`, `DELETE /api/assets/:id`
- `GET /api/dashboard/summary` — includes `totalInventoryValue`, `riskValue`
- `GET /api/alerts` — `{ expiringSoon, expired, lowStock }`
- `GET /api/activity`
- `GET /api/movements`, `POST /api/movements`
- `GET /api/locations`, `POST /api/locations`, `DELETE /api/locations/:name`
- `GET /api/analytics`
- `GET /api/reports/inventory`, `GET /api/reports/expiry`, `GET /api/reports/movements` (CSV downloads)
- `GET /api/healthz`

## Workflows

- **API Server**: `PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev`
- **Frontend**: `PORT=23005 BASE_PATH=/ pnpm --filter @workspace/seedtrack-pro run dev`

## Important Notes

- Data persisted in `artifacts/api-server/data/seedtrack.json` (auto-generated on first run with 12-batch sample data)
- Toast imports: `import { toast } from "sonner"` (direct), Toaster from `@/components/ui/toaster`
- API codegen: run `pnpm --filter @workspace/api-spec run codegen` after editing the OpenAPI spec
- Vite proxy: `/api` → `http://localhost:8080`
