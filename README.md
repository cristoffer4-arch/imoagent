# ImoAgent - Plataforma Imobiliária com IA

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Plataforma completa de gestão imobiliária com 7 agentes de IA (Gemini), busca em 7+ portais, coaching com metas SMART, gamificação, análise jurídica, gestão de leads, agenda inteligente com Pomodoro, design iOS-style responsivo, 15+ tabelas Supabase, 7 Edge Functions, integração Stripe, scanner de documentos, calculadora de comissões, documentação completa e testes.

## 🚀 Funcionalidades Principais

### 7 Agentes de IA (Google Gemini)

1. **Agente de Busca** - Scraping em 7+ portais imobiliários simultaneamente
2. **Agente de Coaching** - Acompanhamento de metas SMART
3. **Agente de Gamificação** - Sistema de rankings e conquistas
4. **Agente de Anúncios** - Otimização de marketing
5. **Agente Legal** - Análise de documentos jurídicos
6. **Agente de Leads** - Qualificação e roteamento
7. **Agente de Tracking** - Gestão de agenda com IA

### 🎨 Design e UI/UX

- **iOS-Style Design**: Interface inspirada no iOS
- **Dark/Light Mode**: Tema automático
- **Responsivo**: Mobile-first design
- **Animações**: Transições suaves

### 💾 Database (15+ Tabelas Supabase)

profiles, properties, leads, appointments, goals, achievements, rankings, commissions, documents, teams, team_members, subscriptions, activities, notifications, pomodoro_sessions, minigames

### ⚡ 7 Edge Functions

property-scraper, calculate-rankings, lead-scoring, calculate-commission, ai-coaching, document-processor, notifications

## 📦 Instalação Rápida

```bash
# Clone
git clone https://github.com/cristoffer4-arch/imoagent.git
cd imoagent

# Instalar dependências
npm install --legacy-peer-deps

# Configurar .env
cp .env.example .env
# Edite .env com suas credenciais

# Executar migrações Supabase
# No painel Supabase, execute supabase/migrations/001_initial_schema.sql

# Iniciar
npm run dev
```

## 🛠️ Tecnologias

- Next.js 16.1 + React 19 + TypeScript
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Google Gemini API (7 agentes)
- Stripe (Pagamentos)
- Tailwind CSS 4 (iOS-style)
- Zustand, React Hook Form, Zod

## 📚 Documentação

Ver documentação completa em [docs/](./docs/)

## 🤝 Contribuição

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

## 📄 Licença

MIT License - veja [LICENSE](LICENSE)

---

Desenvolvido com ❤️ para corretores de imóveis
