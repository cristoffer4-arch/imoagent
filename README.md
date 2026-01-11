# 🏠 Imoagent - Plataforma Imobiliária com IA

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-orange)](https://ai.google.dev/)

Plataforma completa de gestão imobiliária com **7 IAs especializadas**, busca em múltiplos portais, coaching personalizado, gamificação e análise de dados em tempo real.

## ✨ Características Principais

### 🤖 7 IAs Especializadas

1. **IA Orquestradora** - Coordena todas as IAs e gerencia fluxos
2. **IA de Busca** - Pesquisa em 7+ portais (Idealista, Casa Sapo, Imovirtual, etc.)
3. **IA de Coaching** - Metas SMART, técnicas de vendas, CNV
4. **IA de Gamificação** - Ranking, desafios, recompensas
5. **IA Anúncios Idealista** - Otimização para Idealista
6. **IA Assistente Legal** - Contratos, documentação jurídica
7. **IA Leads/Comissões** - Gestão de pipeline e CRM

### 🎯 Funcionalidades

- **Busca Multi-Portal** com deduplicação e validação comunitária
- **Geolocalização** via Supabase Maps
- **Coaching Personalizado** com análise DISC e PNL
- **Dashboard Diretor** com QR codes para monitoramento
- **Agenda Inteligente** com técnica Pomodoro e assistente IA
- **Gamificação** com competições e recompensas
- **Gestão Documental** com OCR e armazenamento seguro
- **Sistema de Pagamentos** via Stripe (Free/Premium)

## 🏗️ Arquitetura

```
imoagent/
├── src/
│   ├── app/              # Next.js 15 App Router
│   ├── components/       # Componentes React
│   └── lib/              # Utilities, Supabase client
├── supabase/
│   ├── functions/        # 7 Edge Functions (Deno)
│   │   ├── ia-orquestradora/
│   │   ├── ia-busca/
│   │   ├── ia-coaching/
│   │   ├── ia-gamificacao/
│   │   ├── ia-anuncios-idealista/
│   │   ├── ia-assistente-legal/
│   │   └── ia-leads-comissoes/
│   └── schema.sql        # Database schema + RLS
├── docs/
│   └── DEPLOYMENT.md     # Guia completo de deployment
└── tests/
    ├── __tests__/        # Jest unit tests
    └── e2e/              # Playwright E2E tests
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Supabase CLI
- Conta Supabase (Free tier OK)
- Gemini API Key
- Stripe Account (opcional para pagamentos)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/cristoffer4-arch/imoagent.git
cd imoagent

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Inicie desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

## 📦 Deployment

Veja guia completo em [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Deploy Rápido das Edge Functions

```bash
# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref ieponcrmmetksukwvmtv

# Deploy todas as funções
for func in ia-orquestradora ia-busca ia-coaching ia-gamificacao ia-anuncios-idealista ia-assistente-legal ia-leads-comissoes; do
  supabase functions deploy $func
done
```

## 🔐 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ieponcrmmetksukwvmtv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testes

```bash
# Unit tests (Jest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📊 Database Schema

16 tabelas principais:
- `profiles` - Usuários e consultores
- `properties` - Imóveis dos portais
- `leads` - Pipeline de vendas
- `commissions` - Gestão de comissões
- `appointments` - Agenda com IA
- `tasks` - Tarefas e lembretes
- `coaching_sessions` - Sessões de coaching
- `kpi_snapshots` - Métricas e KPIs
- `competitions` - Gamificação
- `notifications` - Sistema de alertas
- E mais...

Todas com **Row Level Security (RLS)** configurado.

## 🎨 Stack Tecnológica

**Frontend:**
- Next.js 15 (App Router)
- TypeScript 5
- Tailwind CSS
- Shadcn/ui

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Edge Functions (Deno Deploy)
- Gemini 1.5 Pro

**Pagamentos:**
- Stripe (Free €0, Premium €3.99/mês)
- Voucher "lancamentoPortugal" (3 meses grátis)

**Testes:**
- Jest (unit)
- Playwright (E2E)

## 📱 Módulos

### Para Consultores
- 🏠 **Busca Inteligente** - Multi-portal com IA
- 🎯 **Coaching** - Desenvolvimento pessoal
- 🏆 **Gamificação** - Competições e ranking
- 📊 **Dashboard** - KPIs em tempo real
- 📅 **Agenda IA** - Organização inteligente
- 💼 **CRM** - Gestão de leads

### Para Diretores
- 📊 **Dashboard Executivo** - Visão geral da equipe
- 👥 **Gestão de Equipe** - QR codes para monitoramento
- 📈 **Analytics** - Relatórios detalhados
- 🎖️ **Competições** - Criar desafios para equipe

## 🌟 Diferenciais

✅ **7 IAs especializadas** trabalhando em conjunto
✅ **Busca em 7+ portais** simultaneamente
✅ **Gamificação real** com recompensas
✅ **Coaching com CNV** e técnicas comprovadas
✅ **Agenda com IA** (Pomodoro, Time Blocking)
✅ **Dashboard Diretor** com QR monitoring
✅ **Sistema de vouchers** para lançamento

## 📄 Licença

MIT License - veja [LICENSE](LICENSE)

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md)

## 📞 Suporte

- **Email**: cristoffer4@gmail.com
- **GitHub Issues**: [github.com/cristoffer4-arch/imoagent/issues](https://github.com/cristoffer4-arch/imoagent/issues)

## 🗺️ Roadmap

- [ ] Deploy Edge Functions em produção
- [ ] Integração com mais portais (OLX, Facebook)
- [ ] App móvel React Native
- [ ] Integração WhatsApp Business
- [ ] Dashboard analytics avançado
- [ ] Sistema de referral

---

**Desenvolvido com ❤️ em Porto, Portugal** 🇵🇹
