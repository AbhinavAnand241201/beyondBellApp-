# BeyondBell Circle — Mobile (React Native + Expo)

The iOS/Android client for BeyondBell Circle, built on the **same Supabase backend**
as the Next.js web app.

## Stack

- **Expo SDK 52** + **Expo Router** (file-based, typed routes)
- **TypeScript strict** (no `any`) — mirrors the web app's discipline (§19)
- **Supabase JS** with an AsyncStorage session adapter (§7)
- **TanStack Query** for the data layer (§18.2)

## Setup

```bash
npm install
cp .env.example .env     # fill in real values to connect the backend
npm start                # Expo dev server (press i / a / w)
npm run typecheck        # tsc --noEmit (strict)
npm run doctor           # expo-doctor
```

### Environment

Only the two `EXPO_PUBLIC_SUPABASE_*` values are required — the anon key is public
by design and RLS protects the data (§6). The app **ships with placeholder creds**
so it compiles and runs offline; screens show a "backend not connected" notice until
you add real values. Never embed the service-role key (§4).

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — from the web app's `.env.local`
- `EXPO_PUBLIC_API_BASE_URL` — deployed Next.js API / Edge Functions base for Path-B logic (AI tools)
- `EXPO_PUBLIC_SITE_URL` — OAuth deep-link base (defaults to the app scheme)

## What's built

| Area | Status | Notes |
|---|---|---|
| Auth (email / Google / phone OTP) | ✅ | `src/lib/auth.ts`, `app/(auth)/` |
| Onboarding gate + 5-step wizard | ✅ | `src/features/onboarding/`, `app/onboarding/` |
| Dashboard (3-state) | ✅ | `src/features/dashboard/` |
| Community feed / post / reply / react | ✅ | `src/features/community/` — reactions & replies are direct RLS-guarded writes (§13) |
| Direct messages + Realtime | ✅ | `src/features/messages/`, `app/(main)/messages/[userId].tsx` (§14) |
| Resources / Library | ✅ | `src/features/resources/` (§15) |
| AI Studio (Lesson Architect wired) | ✅ | calls the API base via Bearer JWT (§11, §18.2) |
| Profile + reputation | ✅ | `src/features/profile/` — points are read-only (§9) |

## Architecture notes

- **Path A reads** (feed, dashboard, messages, resources, profile) go **direct to
  Supabase** from the RN client; RLS scopes them automatically (§5/§6).
- **Path B writes** that need server-side rules: post/DM creation are direct inserts
  guarded by RLS `WITH CHECK` (tier, not-banned, not-blocked). The one rule RLS can't
  express — the **Standard DM rate limit** — needs the web `/api/messages/send` ported
  to an Edge Function; this is flagged in `src/features/messages/mutations.ts` rather
  than silently skipped.
- **AI tools** call the deployed Next.js `/api/ai/*` routes with the user's JWT
  (`src/lib/api.ts`). Set `EXPO_PUBLIC_API_BASE_URL` to enable them.
- **Never written from the app:** `circle_points_ledger` / points (§9), or any
  append-only table.

## Layout

```
app/                         # Expo Router routes
  (auth)/                    # sign-in, sign-up, phone OTP
  onboarding/                # 5-step wizard
  (main)/                    # protected app
    (tabs)/                  # Home, Community, Messages, AI Studio, Profile
    post/[id], compose,      # detail / modal screens stacked over tabs
    messages/[userId],
    profile/[userId],
    ai-studio/lesson-architect,
    library, resources
src/
  components/ui/             # design-system primitives (bb-* tokens)
  features/<domain>/         # queries + mutations + screens per feature
  lib/                       # supabase, api, auth, tier, format
  theme/                     # tokens
  types/db.ts                # hand-written row types (§19)
```

## Not built (backend not ready — defer per §17)

Principal Desk / Compliance (RAG empty), payments (Razorpay), push notifications,
study groups, events. Screens can be added against the future API shape.
