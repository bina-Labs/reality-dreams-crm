# Reality Dreams CRM

Operational lead-management CRM for **realitydreams-galapagos.com** — bilingual (Hebrew RTL /
English LTR), built on Next.js 16 (App Router) + React 19 + `@supabase/ssr` + Tailwind v4.
Backend: the existing Reality Dreams Supabase project (do **not** create a new one).

## Environment variables

Only two variables are required. **Both are public/client-side** — the publishable anon key is safe
to expose and Row Level Security protects the data. The Supabase **service-role key** and the form
**intake secret** are NOT used by this app; they stay server-side inside Supabase.

| Variable | Where to set | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel → Project → Settings → Environment Variables (Production + Preview + Development) | `https://njgvltbmwvazpqeqafye.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | `sb_publishable_…` (Supabase → Settings → API → publishable key) |

Copy `.env.example` → `.env.local` for local development (git-ignored).

## Local development

```bash
npm install
cp .env.example .env.local   # then fill the two values
npm run dev                  # http://localhost:3000
npm run build                # production build
```

## Deploy — GitHub → Vercel (clean workflow)

### 1. Push to GitHub
```bash
git init                       # if not already a repo
git add -A
git commit -m "Reality Dreams CRM"
git branch -M main
git remote add origin https://github.com/<you>/reality-dreams-crm.git
git push -u origin main
```

### 2. Import into Vercel
1. Vercel → **Add New… → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Root directory: repo root.
3. **Environment Variables** — add the two above for **Production, Preview, and Development**.
4. **Deploy.**

### 3. Deployment Protection (production public, previews protected)
Vercel → Project → **Settings → Deployment Protection → Vercel Authentication** →
set to **"Only Preview Deployments"** (Standard Protection). Result:
- **Production** URL is publicly reachable (the app still gates all data behind Supabase login).
- **Preview** deployments stay behind Vercel SSO.

## Security model
- **Auth:** Supabase Auth (email + password). Middleware (`src/proxy.ts`) redirects any
  unauthenticated request to `/login`; nothing but `/login` and `/auth/*` is reachable without a session.
- **RLS:** enforced on every table. Only active team members can read CRM data; `app_config` and
  `website_proxy_hits` are deny-all except the service role.
- **First user = Admin:** the first account to sign up becomes an active **admin** automatically
  (DB trigger `handle_new_user`); everyone after is a pending **agent** until an admin activates them
  in **Settings → Team**. So the CRM can be bootstrapped safely with no seeded credentials.
- **No secrets in the repo:** only `NEXT_PUBLIC_*` (public) values are used; the service-role key and
  intake secret never touch the client or the repo.
