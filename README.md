# WedBudget

A wedding budget planner for couples in Taiwan. Enter your budget, city and guest count. WedBudget splits the money across six categories and shows vendors you can afford in each one.

**Live site:** https://wedbudget-tw.vercel.app

## What it does

- **Budget allocation.** The total budget is split across venues, photography, attire, bridal styling, hosting and favors. Sliders let you rebalance it, and you'll see if you go over.
- **Vendor matching.** Each category shows up to 6 vendors whose estimated cost fits its budget. The estimate takes the city and the price unit into account: per event, per table or per guest.
- **Vendor pages.** Browse each category by region and vendor type.

Vendors are demo data for now.

## Tech stack

| Part | Choice |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, GSAP |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Database | SQL Server (Docker locally, Azure SQL in production) |
| Hosting | Vercel for the frontend and the API as a Python function |

## Run locally

```bash
# Database + API (see backend/README.md for first-time setup)
cd backend
docker compose up -d
.venv/bin/uvicorn app.main:app --reload

# Frontend, in a second terminal
npm install
npm run dev
```

The backend spec, including the calculation rules, data model and API, is in [backend/SPEC.md](backend/SPEC.md).
