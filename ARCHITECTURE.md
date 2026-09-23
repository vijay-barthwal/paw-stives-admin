# Pawstives Admin Panel — Architecture

The internal staff-facing Next.js app for Pawstives. Platform team members use it to approve vet/clinic registrations, manage users/pets/appointments platform-wide, define service categories, review analytics, and moderate disputes. It is a pure client of `paw-stives-backend` — it holds no data of its own, and is a completely separate app/login from the owner+vet website (`paw-stives-frontend`).

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Forms/validation**: `react-hook-form` + `zod`, via `@hookform/resolvers` — schemas under `src/lib/validation/*.ts`
- **Data fetching**: no React Query/Redux. A hand-rolled `apiClient` (`src/lib/api-client.ts`) wraps `fetch`, attaches the bearer token from `src/lib/token.ts` (localStorage), and throws a typed `ApiError`. Every page fetches its own data with plain `useState`/`useEffect` — no shared cache.
- **Auth/session**: `AdminSessionProvider` (React Context) bootstraps from `GET /auth/me`, enforces the caller's role is `admin` or `superadmin`, and redirects to `/login` otherwise. `DashboardShell` wraps every authenticated route and renders the sidebar/drawer nav.
- **Charts**: `recharts` (Reports page trend charts).

## Route Map

- `/login` — public
- `/` — dashboard home (pending/approved/rejected provider stat cards)
- `/providers`, `/providers/detail` — clinic approval queue and review (approve/reject with a required rejection reason)
- `/vets`, `/vets/detail` — approved-vet list and per-clinic management: accept/decline/reschedule/cancel appointments, adjust fees, manage blackout availability, and staff-assist a walk-in booking — this is effectively "operate a clinic on the vet's behalf"
- `/users`, `/users/detail` — platform-wide user list/search, suspend/reactivate an account
- `/pets`, `/pets/detail` — platform-wide pet list/search, read-only detail, delete
- `/appointments` — platform-wide, cross-clinic, **read-only** appointment search (status/date/provider/text filters); any actual action (accept, reschedule, fee change) links out to the relevant clinic's `/vets/detail` page rather than duplicating that logic here
- `/service-categories` — CRUD for the platform's service category catalog, each with a suggested price range
- `/reports` — platform summary stat tiles + bookings/revenue trend charts
- `/disputes`, `/disputes/detail` — appointment-scoped complaint moderation queue (Open/Investigating/Resolved/Dismissed), with resolution notes

## How It Works

Every list page follows the same shape: search/filter controls, a paginated table, loading skeletons, and an `ApiError`-aware error state. Detail pages/drawers pull one record and expose whatever mutating actions are appropriate for that resource. There's no separate "admin" backend module per se for most of these — the backend exposes admin-only endpoints (gated by role) alongside the same modules the public site uses (e.g. `GET /pets/admin` lives in the same backend module as the owner-facing pet endpoints).

---

# Project Details

## How this app connects to the rest of the system

This app is one of two independent frontends against a single backend (`paw-stives-backend`), configured via its own `NEXT_PUBLIC_API_URL`. It shares **no session, no code, and no direct connection** with `paw-stives-frontend` — a staff member's admin login is entirely separate from any pet-owner or vet account they might also have. Every action taken here (approving a clinic, suspending a user, resolving a dispute) is visible on the owner/vet site purely because it changed the shared backend's data — there's no push from this app to that one.

## How the pieces this app manages actually work

- **Provider approval**: a vet completes their clinic profile on the public site → it lands here with `status: pending` in the `/providers` queue → an admin reviews the full profile (services, pricing, hours, photos) in `/providers/detail` and approves or rejects (rejection requires a reason, shown back to the vet if they edit and resubmit). Approval is what makes a clinic visible in public search.
- **Appointments/booking, end to end**: an owner books through the public site's multi-step flow (pet → service → date/time → notes) against a clinic's live-computed available slots. The appointment starts `pending` (or auto-confirms if the clinic has instant booking on). **No notification is sent to the vet or the owner at any point in this flow today** — not on booking, acceptance, decline, reschedule, or cancellation. The vet finds new requests by opening their own dashboard (or an admin operating on their behalf via `/vets/detail`); the owner finds status changes by reopening their Pet Passport. This app's `/appointments` page exists specifically to give staff platform-wide visibility into this otherwise siloed, pull-only flow.
- **Pet Passport / clinical records**: once a vet has an appointment on record with a pet, the backend allows that vet (and only that vet, or an admin) to add vaccinations, clinical documents, and structured prescriptions to the pet's record. The `/pets` section here is read/moderate-only — it doesn't let staff add clinical entries themselves, since that's meant to stay a vet responsibility tied to an actual visit.
- **Disputes**: a pet owner or a vet can file a dispute against a specific appointment from their respective app (not from here). This app is where staff triage and close them out — there is deliberately no ratings/reviews system underneath disputes; they're scoped strictly to appointment complaints, independent of any review feature.
- **Service categories**: purely an admin-side catalog with a suggested price range per category — informational for now, not enforced against what a clinic actually charges at booking time.
- **Reports**: aggregate counts and a daily trend, computed on demand from the live database — not a separate analytics pipeline or warehouse.

## Known gaps

- No bulk actions, audit trail, or advanced sort/pagination beyond simple prev/next on any list.
- No SMS/email is ever sent by anything in this app — moderation and approval decisions only take effect by changing backend state that the other app happens to read.
- Reports has no date-range export or drill-down beyond the fixed trend window.

## Keeping this file current

**Update this file whenever a task changes a route, adds/removes an admin capability, changes how an existing flow (approval, booking visibility, disputes, reports) works, or closes one of the gaps above.** Treat a stale ARCHITECTURE.md as a bug.
