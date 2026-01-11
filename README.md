# Imoagent – plataforma imobiliária com IA

Plataforma Next.js 15 (App Router) + Supabase (PostgreSQL + RLS + 7 Edge Functions) +
Stripe com 7 IAs Gemini (Busca, Coaching, Gamificação, Anúncios Idealista, Assistente
Legal, Leads/Comissões e IA Orquestradora).

## Arquitetura
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, design iOS-style com dark/light.
- **Dados**: Supabase com 15+ tabelas e RLS (`supabase/schema.sql`), autenticação e storage.
- **IA**: Gemini via `src/lib/gemini.ts` e 7 Edge Functions em `supabase/functions`.
- **Pagamentos**: Stripe Free/Premium (€3.99) e voucher `LancamentoPortugal` (3 meses grátis) na rota `/api/checkout`.
- **Testes**: Jest (unit) em `__tests__` e Playwright (e2e) em `tests/e2e`.

## Como rodar
```bash
npm install
npm run dev
```

### Testes
```bash
npm run lint
npm test          # Jest
npm run test:e2e  # Playwright (sobe servidor dev automaticamente)
```

## Variáveis de ambiente
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=models/gemini-1.5-flash-latest
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=price_imoagent_premium
STRIPE_COUPON_ID=
```

## Supabase
- Esquema e RLS: `supabase/schema.sql` (15 tabelas: profiles, consultants, properties, leads, commissions, subscriptions, payments, appointments, tasks, documents, storage_files, coaching_sessions, kpi_snapshots, competitions, notifications).
- Edge Functions (7): `ia-busca`, `ia-coaching`, `ia-gamificacao`, `ia-anuncios-idealista`, `ia-assistente-legal`, `ia-leads-comissoes`, `ia-orquestradora`.

## Stripe
Rota `/api/checkout` cria sessão de assinatura. Voucher `LancamentoPortugal` aplica 3 meses grátis
quando `STRIPE_COUPON_ID` está configurado.

## IAs Gemini
Biblioteca utilitária em `src/lib/gemini.ts` com chamadas tolerantes a ausência de chave (resposta mock
para desenvolvimento offline).
