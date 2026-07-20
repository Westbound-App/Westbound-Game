# WESTBOUND — Security

## Threat model (MVP)

| Asset | Risk |
|-------|------|
| Walker official state | Client forgery, double-tick races |
| Credits / wallet | Overspend, double-spend, replay |
| Control outcomes | Stale contributions, race after close |
| Admin powers | Unauthorized pause/reset/credit grants |
| PII / payments (later) | Leakage, webhook spoofing |

## Controls in Phase A

### Secrets

- All secrets via environment variables (see `.env.example`).
- `SUPABASE_SERVICE_ROLE_KEY` **never** exposed to the browser.
- Only `NEXT_PUBLIC_*` keys ship to the client.

### Authentication

- Supabase Auth for sessions (cookie-based SSR via `@supabase/ssr`).
- `profiles` row created on signup (trigger or app hook).
- Roles stored on `profiles.role`; not trustable from client claims alone for admin actions.

### Authorization / RLS

- Enable RLS on all user-facing tables.
- Public read for live game state, public events, route geometry of active games.
- Users read own wallet and transactions only.
- No direct client writes to `walker_state`, `route_*`, `admin_audit_log`, or financial tables.
- Mutations go through server routes or SECURITY DEFINER RPCs with checks.

### Input validation

- Zod schemas on API bodies.
- Contribution requests (later) accept only: window id, option id, credits, idempotency key.

### Idempotency

- Unique `(user_id, idempotency_key)` on wallet transactions.
- Future payment provider IDs unique; webhooks retry-safe.

### Atomic credits

- Deduct via single DB transaction / RPC with row lock on `wallets`.
- Reject if `available_balance < amount`.

### Admin

- Admin pages gated by `role IN ('admin','super_admin')` server-side.
- High-impact actions require `reason` and write `admin_audit_log`.
- No production reset control in UI.

### Rate limiting (planned)

- Account creation, contributions, payment attempts, admin actions, route requests.
- Bot protection before real money (Phase 2).

## Client trust boundary

**Never trust the browser for:**

- Walker coordinates or speed
- Wallet balances or totals
- Winning option selection
- Route legality
- Game completion

Clients may:

- Animate between server-confirmed points
- Display cached snapshots with “reconnecting” fallback
- Submit intent (contribute N credits to option X)

## Payments (Phase 2 only)

- Server-created checkout sessions
- Credits granted only after verified webhook signature
- No credit grant from browser success redirects alone
- Chargebacks / refunds reverse ledger with audit trail

## Data exposure

Public:

- Walker snapshot, routes, control window aggregates, faction stats, public usernames (if allowed)

Private:

- Email, payment methods, full wallet ledger details beyond own user, internal admin notes

## Dependency & deploy hygiene

- Strict TypeScript; avoid `any`
- Keep dependencies minimal
- Separate sandbox vs production Supabase projects when real money exists
- Backups and monitoring before public launch with payments
