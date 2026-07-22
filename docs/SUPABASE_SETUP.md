# WESTBOUND — Supabase Setup (your ten minutes)

This is the step that makes the journey truly permanent: state that
survives every deploy, restart, and quiet week (vision §15 Phase 2). The
code already supports it — it switches over automatically the moment the
environment variables exist.

## 1. Create the project (~3 minutes)

1. Go to **supabase.com** → sign up (free tier is fine to start)
2. **New project** → name it `westbound` → choose a strong database
   password (save it somewhere) → region: **East US** (closest to the
   walker) → Create
3. Wait for the project to finish provisioning

## 2. Create the tables (~3 minutes)

1. In the left sidebar: **SQL Editor** → **New query**
2. In GitHub, open `supabase/migrations/001_initial_schema.sql`, copy the
   whole file, paste into the editor, press **Run**
3. Repeat for `002_rls_policies.sql`, `003_seed_sandbox.sql`,
   `004_control_windows.sql`, `005_paid_actions.sql` — **in that order**

## 3. Copy the keys (~1 minute)

Left sidebar → **Project Settings → API**:

- **Project URL** (looks like `https://xxxx.supabase.co`)
- **anon public** key
- **service_role** key (keep this one secret — server only)

## 4. Give the keys to Netlify (~2 minutes)

Netlify → your site → **Site configuration → Environment variables** →
add these three:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | the Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role key |

Then **Deploys → Trigger deploy → Deploy site**.

## 5. Tell Claude it's done

Say "supabase is set up" — I'll verify the live site is reading from the
database, port anything the Supabase path is missing versus the local
engine (the newer features were built local-first), and set up the
scheduled reconciliation job so the walker keeps moving even when nobody
visits for days.

## Notes

- Nothing breaks if this waits — the site keeps running on the temporary
  engine until the variables exist.
- The service_role key never goes in code or in anything public. Netlify
  environment variables are the only place it lives.
