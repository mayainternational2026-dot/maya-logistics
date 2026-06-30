---
name: Railway deployment layout
description: Which Railway project/service owns the custom domain and Postgres
---

## Key services

| Project | Service | ID | Role |
|---------|---------|-----|------|
| easygoing-exploration | maya-logistics | a8d4fdca-0f4f-4e16-9630-eba4b2389410 | Serves www.mayaimportexport.com |
| easygoing-exploration | Postgres | 38809eaf-0652-423c-8b34-877993313689 | Railway managed Postgres |
| zealous-possibility | @workspace/api-server | 64141ec1-6c13-4b18-a73a-300997e4a26d | Secondary, not used by domain |

## Environment IDs
- easygoing-exploration production env: 7b108e4a-4b99-4818-9a32-5d7fb2204a60
- zealous-possibility production env: ba38e6b1-3bb6-4c44-ba5c-0f41ec99ab63

## Database
- Railway Postgres public URL: switchback.proxy.rlwy.net:27872 (db: railway, user: postgres)
- Internal URL (same project only): postgres.railway.internal:5432
- Schema applied + seeded via manual node-pg script (drizzle-kit push is interactive-only)

**Why:** There are two Railway projects. The custom domain www.mayaimportexport.com is bound to maya-logistics in easygoing-exploration, NOT zealous-possibility. Always configure env vars on the easygoing-exploration project's maya-logistics service.

**How to apply:** When setting Railway env vars for the production site, use projectId=02fab5fa, environmentId=7b108e4a, serviceId=a8d4fdca. For schema changes, connect to switchback.proxy.rlwy.net:27872 and apply SQL directly (drizzle-kit push cannot be run non-interactively).
