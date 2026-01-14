# Módulo IA Coaching SMART - Resumo da Implementação

## 🎯 Visão Geral

Sistema completo de coaching com IA para consultores imobiliários, implementado em Next.js 15 com TypeScript, Tailwind CSS, Supabase e Google Gemini AI.

## 📊 Componentes Implementados

### 1. Dashboard de KPIs
- 8 métricas principais (Leads, Visitas, Angariações, Vendas, Taxa Conversão, Ticket Médio, Comissões, Pipeline)
- 3 tipos de gráficos (Linha, Pizza, Barras)
- Filtros de período (7d, 30d, 90d)
- Cards com gradientes e indicadores de crescimento

### 2. Metas SMART
- Definição de meta de faturamento anual (€50k - €500k)
- Cálculo automático de metas derivadas
- Breakdown em metas mensais, semanais e diárias
- 6 métricas operacionais

### 3. Coaching com IA (Gemini)
- 5 tipos de sessões de coaching
- Chat interativo com histórico
- Extração automática de insights e compromissos
- Persistência de sessões

### 4. Plano de Ação
- CRUD completo de ações
- 5 categorias de atividades
- Sistema de prioridades e status
- Geração automática com IA

### 5. Análise DISC & PNL
- Questionário de 16 perguntas
- Cálculo de perfil comportamental
- Scripts PNL personalizados por perfil
- Técnicas de comunicação

### 6. Gamificação
- Sistema de níveis e pontos
- Streaks diários
- 4 desafios semanais
- 12 conquistas/badges
- Ranking da equipe

## 🗄️ Banco de Dados

### Tabelas Criadas
1. `goals` - Metas anuais e mensais
2. `kpis` - KPIs diários/semanais
3. `coaching_sessions_v2` - Sessões de coaching
4. `action_items` - Plano de ação
5. `disc_profiles` - Perfis DISC
6. `user_stats` - Estatísticas de gamificação
7. `achievements` - Conquistas

### Segurança
- Row Level Security (RLS) habilitado
- Políticas baseadas em `auth.uid()`
- Índices para otimização

## 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── coaching.ts                    # Interfaces TypeScript
├── lib/
│   └── supabase-coaching.ts          # Funções helper
├── app/
│   ├── api/
│   │   └── gemini-coach/
│   │       └── route.ts              # API do Gemini
│   └── ia-coaching/
│       └── page.tsx                  # Página principal
└── components/
    └── coaching/
        ├── SmartGoals.tsx            # Metas SMART
        ├── KPIDashboard.tsx          # Dashboard
        ├── CoachingChat.tsx          # Chat IA
        ├── ActionPlan.tsx            # Plano de ação
        ├── DISCAnalysis.tsx          # DISC & PNL
        └── Gamification.tsx          # Gamificação

supabase-coaching-tables.sql          # Schema SQL
```

## 🚀 Como Usar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Executar Migrations
Execute `supabase-coaching-tables.sql` no Supabase Dashboard

### 4. Iniciar Servidor
```bash
npm run dev
```

### 5. Acessar o Módulo
Navegue para `http://localhost:3000/ia-coaching`

## 🎨 Design

- Tema dark com gradientes
- Navegação por tabs
- Responsivo (mobile/desktop)
- Animações suaves
- Loading states
- Footer com quick stats

## 🔧 Tecnologias

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Recharts 2.10
- Supabase
- Google Gemini API

## ✅ Status

- ✅ Build successful
- ✅ TypeScript sem erros
- ✅ Interface testada
- ✅ Screenshots capturadas
- ✅ Pronto para produção

## 📸 Screenshots

Veja as capturas de tela no PR description.

## 📝 Notas

- O módulo requer configuração das variáveis de ambiente para funcionar completamente
- A integração com Supabase requer execução das migrations
- A integração com Gemini requer uma chave de API válida
- Dados de demonstração são exibidos quando não há dados reais disponíveis
