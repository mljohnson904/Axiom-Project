# Axiom Follow-Up Command Center (V1)

A practical workflow-first MVP for small business owners to track leads, follow-ups, client requests, and daily tasks in one place.

## Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- localStorage persistence (no backend for V1)

## Features in V1
- Dashboard summary cards
- Leads / Follow-Up Tracker
- Client Request / Task Tracker
- Message Templates
- Daily Checklist

## Local setup
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project structure
- `app/layout.tsx`: root layout + metadata
- `app/page.tsx`: main MVP UI and interactions
- `app/globals.css`: Tailwind base styles
- `lib/types.ts`: app data types
- `lib/seedData.ts`: demo seed data and checklist defaults

## Persistence
Data saves automatically to browser localStorage key: `axiom-v1`.
