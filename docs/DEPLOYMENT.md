# Deployment Guide — Vercel + Supabase + Clerk

## Overview

| Concern   | Service  |
| --------- | -------- |
| App host  | Vercel   |
| Database  | Supabase (PostgreSQL) |
| Auth      | Clerk    |

## 1. Database (Supabase)

1. Create a project at <https://supabase.com>.
2. **Project Settings → Database → Connection string**:
   - `DATABASE_URL` → the **pooled** connection (port `6543`, add `?pgbouncer=true`).
   - `DIRECT_URL` → the **direct** connection (port `5432`) — used by migrations.
3. Push the schema:
   ```bash
   npm run db:push          # or: npm run db:migrate (versioned)
   ```
4. (Optional) seed demo data: `npm run db:seed`.

> Prisma is configured with both `url` and `directUrl` so pooled connections work
> in serverless while migrations use the direct connection.

## 2. Authentication (Clerk)

1. Create an application at <https://dashboard.clerk.com>.
2. Copy **API Keys**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Configure sign-in/up URLs (already wired in this app): `/sign-in`, `/sign-up`.
4. **Webhook** (keeps the local `User` table in sync):
   - Clerk → **Webhooks → Add Endpoint**
   - URL: `https://YOUR_DOMAIN/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SIGNING_SECRET`.

## 3. Deploy to Vercel

1. Push the repo to GitHub and **Import** it in Vercel.
2. Add environment variables (Project → Settings → Environment Variables) — all
   keys from `.env.example`:
   - `DATABASE_URL`, `DIRECT_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN`
3. Build command is `npm run build` (runs `prisma generate` first). Output is a
   standard Next.js build — no extra config needed.
4. Deploy. After the first deploy, set the Clerk webhook URL to your live domain.

### Running migrations in CI/CD

For versioned migrations, run `npx prisma migrate deploy` as a build/release step
(uses `DIRECT_URL`). For the simple push workflow, `prisma db push` suffices.

## 4. Post-deploy smoke test

1. Visit the domain → landing page renders.
2. Sign up → provisioned as a tutor → dashboard loads.
3. Add a student, schedule a class, mark attendance, record a payment.
4. In a second session, sign up as a student and join with the tutor invite code.
5. Confirm the Clerk webhook shows `200` responses in the Clerk dashboard.

## 5. Notes & gotchas

- **Middleware → Proxy**: Next 16 prints a deprecation notice for the
  `middleware.ts` convention (it still works). When Clerk publishes first-class
  `proxy.ts` guidance, rename accordingly.
- **PWA install**: served over HTTPS (Vercel default), the app is installable;
  `start_url` is `/dashboard`.
- **Connection limits**: always use the pooled `DATABASE_URL` in production to
  avoid exhausting Postgres connections from serverless functions.
