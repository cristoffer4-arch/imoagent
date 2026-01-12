# Imoagent AI Coding Agent Instructions

## Architecture Overview

Imoagent is a **Next.js 15 real estate platform** with **7 specialized Supabase Edge Functions** (Deno) powered by Google Gemini AI for property search, coaching, gamification, listings optimization, legal assistance, and lead/commission management. A central orchestrator AI coordinates all functions.

**Technology Stack:**
- Frontend: Next.js 15 (App Router), TypeScript 5, Tailwind CSS 4, React 19
- Backend: Supabase (Postgres + Edge Functions with Deno)
- AI: Google Gemini API (via `src/lib/gemini.ts`)
- Payments: Stripe (subscription model)
- Testing: Jest (unit) + Playwright (E2E)

## Critical Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/checkout/ # Stripe payment API route
│   └── ia-*/         # 7 AI-specific pages (client routes)
├── lib/
│   ├── gemini.ts     # Gemini API client (shared functions)
│   └── supabase/     # Supabase client initialization
supabase/
├── functions/        # 7 Edge Functions (Deno runtime)
│   ├── ia-orquestradora/  # Orchestrator (routes between AIs)
│   ├── ia-busca/          # Multi-portal property search
│   ├── ia-coaching/       # SMART goals, CNV, DISC, PNL
│   ├── ia-gamificacao/    # Rankings, challenges, rewards
│   ├── ia-anuncios-idealista/ # Idealista listing optimization
│   ├── ia-assistente-legal/   # Legal contracts, OCR
│   └── ia-leads-comissoes/    # CRM pipeline, commission tracking
└── schema.sql        # 16 tables with Row Level Security (RLS)
```

## Edge Function Pattern (Supabase/Deno)

**Every Edge Function follows this exact structure:**

```typescript
// supabase/functions/ia-*/index.ts
import { handler } from "./handler.ts";
Deno.serve(handler);

// supabase/functions/ia-*/handler.ts
export async function handler(request: Request): Promise<Response> {
  const payload = await request.json().catch(() => ({}));
  // Business logic here
  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" }
  });
}
```

**Never use `serve()` from `@supabase/supabase-js` - use `Deno.serve()` directly.**

## Gemini AI Integration

- Located in `src/lib/gemini.ts`
- Gracefully falls back to mock responses when `GEMINI_API_KEY` is missing (dev mode only)
- Model: `gemini-1.5-flash-latest` (configurable via `GEMINI_MODEL`)
- Temperature: 0.4, Max tokens: 512
- Example functions: `iaBusca()`, `iaCoaching()`, `iaGamificacao()` etc.

**When adding new AI features:**
1. Add function to `gemini.ts` with descriptive prompt
2. Call from frontend via API route or directly (client-side)
3. Never hardcode prompts - keep them centralized

## Database Conventions

- **16 tables** with UUID primary keys (`gen_random_uuid()`)
- **RLS enabled on all tables** - check `schema.sql` for policies
- Foreign keys cascade on delete: `references profiles(id) on delete cascade`
- Standard timestamps: `created_at timestamptz default now()`
- Key tables: `profiles`, `consultants`, `properties`, `leads`, `commissions`, `subscriptions`, `payments`

**When creating migrations:**
```bash
# Always use Supabase CLI for schema changes
supabase db diff --file new_migration_name
```

## Deployment Workflow

**Edge Functions deployment (critical):**
```bash
# Login and link project
supabase login
supabase link --project-ref ieponcrmmetksukwvmtv

# Deploy individual function
supabase functions deploy ia-orquestradora

# Or use quick deploy script
./QUICK_DEPLOY.sh
```

**All 7 functions must be deployed before frontend works.** URLs follow pattern:
`https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-*`

**Frontend deployment:**
- Optimized for Vercel (Next.js native)
- Alternative: Netlify (see `netlify.toml`)
- Environment variables required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`

## Development Commands

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint (config: eslint.config.mjs)
npm test             # Jest unit tests
npm run test:e2e     # Playwright E2E tests
```

**Testing guidelines:**
- Unit tests in `__tests__/` (Jest + Testing Library)
- E2E tests in `tests/e2e/` (Playwright)
- Always test AI fallback behavior when `GEMINI_API_KEY` is missing

## Stripe Integration

- Subscription-based: Free/Premium tiers
- Checkout API: `src/app/api/checkout/route.ts`
- Launch voucher: "LancamentoPortugal" (50% off, configured via `STRIPE_COUPON_ID`)
- Mock mode when `STRIPE_SECRET_KEY` is absent (dev)
- Success/cancel redirects configured in checkout session

## Portuguese Language Context

**This is a Portuguese real estate platform (Portugal market).** All:
- UI text in European Portuguese (`lang="pt"` in layout)
- Currency: EUR
- AI prompts reference Portuguese portals: OLX, Idealista, Casa Sapo, Imovirtual, BPI, Facebook, Casafari
- Legal documents follow Portuguese law

## Common Gotchas

1. **Edge Functions must use Deno syntax** - no Node.js APIs (`process`, `fs`, etc.)
2. **Gemini API requires key but gracefully degrades** - never block dev workflow
3. **Supabase project ID is hardcoded**: `ieponcrmmetksukwvmtv` (see `DEPLOYMENT.md`)
4. **All 7 Edge Functions are interdependent** via orchestrator - deploy atomically
5. **Next.js 15 uses App Router exclusively** - no pages/ directory
6. **Tailwind 4 (postcss-based)** - config in `postcss.config.mjs`, not `tailwind.config.js`

## Key Documentation Files

- `README.md` - Quick start and architecture overview
- `PROJECT_SUMMARY.md` - Complete project status and deliverables
- `docs/DEPLOYMENT.md` - Step-by-step deployment guide
- `NEXT_STEPS.md` - Current deployment status and next actions

## When Adding New Features

1. **New AI function?** Follow Edge Function pattern, update orchestrator routes, deploy via Supabase CLI
2. **New database table?** Add to `schema.sql`, enable RLS, create migration
3. **New page?** Create in `src/app/` following App Router conventions (page.tsx)
4. **New API route?** Use Route Handlers in `src/app/api/` (route.ts)
5. **Update documentation** in `README.md` or relevant file in `docs/`

---

**Project Status:** ✅ Complete and production-ready (as of Jan 2026)  
**Deployment Status:** ⏳ Edge Functions awaiting Supabase CLI deployment (frontend ready)
