# Guia de Deployment - Imoagent

## 📋 Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **Supabase CLI** instalado
3. **Git** configurado
4. Credenciais do Supabase

## 🚀 Passo 1: Instalar Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via npm)
npm install -g supabase

# Verificar instalação
supabase --version
```

## 🔐 Passo 2: Login no Supabase

```bash
supabase login
```

Isso abrirá o navegador para autenticação.

## 📂 Passo 3: Clonar e Configurar o Projeto

```bash
# Clonar repositório
git clone https://github.com/cristoffer4-arch/imoagent.git
cd imoagent

# Instalar dependências
npm install
```

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ieponcrmmetksukwvmtv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzd...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzd...

# Gemini (sua chave existente)
GEMINI_API_KEY=sua-chave-gemini-aqui

# Stripe (criar em https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔗 Passo 5: Linkar Projeto ao Supabase

```bash
# Linkar ao projeto existente
supabase link --project-ref ieponcrmmetksukwvmtv
```

Quando solicitado, use:
- **Database password**: A senha que você definiu ao criar o projeto

## 📡 Passo 6: Deploy das Edge Functions

Agora vamos fazer deploy de todas as 7 Edge Functions:

```bash
# Deploy de todas as funções de uma vez
supabase functions deploy ia-orquestradora
supabase functions deploy ia-busca
supabase functions deploy ia-coaching
supabase functions deploy ia-gamificacao
supabase functions deploy ia-anuncios-idealista
supabase functions deploy ia-assistente-legal
supabase functions deploy ia-leads-comissoes
```

Ou deploy de todas de uma vez:

```bash
# Deploy de todas as funções
for func in ia-orquestradora ia-busca ia-coaching ia-gamificacao ia-anuncios-idealista ia-assistente-legal ia-leads-comissoes; do
  supabase functions deploy $func
done
```

## 🔍 Passo 7: Verificar Deployment

Após o deploy, acesse:

**Supabase Dashboard**: https://supabase.com/dashboard/project/ieponcrmmetksukwvmtv/functions

Verifique se todas as 7 funções estão listadas e ativas.

## 🧪 Passo 8: Testar as Funções

### Testar localmente:

```bash
# Iniciar todas as funções localmente
supabase functions serve

# Testar ia-orquestradora
curl -i --location --request POST 'http://localhost:54321/functions/v1/ia-orquestradora' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"event":"test"}'
```

### Testar em produção:

```bash
curl -i --location --request POST 'https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-orquestradora' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"event":"test"}'
```

## 🌐 Passo 9: Iniciar Aplicação

```bash
# Desenvolvimento
npm run dev

# Produção (build)
npm run build
npm start
```

Acesse: **http://localhost:3000**

## 📊 URLs das Edge Functions

Após deployment, suas funções estarão disponíveis em:

```
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-orquestradora
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-busca
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-coaching
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-gamificacao
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-anuncios-idealista
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-assistente-legal
https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-leads-comissoes
```

## 🔧 Troubleshooting

### Erro: "Project not linked"
```bash
supabase link --project-ref ieponcrmmetksukwvmtv
```

### Erro: "Authentication required"
```bash
supabase login
```

### Ver logs das funções:
```bash
supabase functions logs ia-orquestradora
```

### Deletar função (se necessário):
```bash
supabase functions delete ia-orquestradora
```

## ✅ Checklist de Deployment

- [ ] Supabase CLI instalado
- [ ] Login no Supabase realizado
- [ ] Projeto clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env.local` configurado
- [ ] Projeto linkado ao Supabase
- [ ] Schema SQL executado (já feito ✅)
- [ ] 7 Edge Functions deployed
- [ ] Funções testadas
- [ ] Aplicação rodando localmente

## 📚 Recursos Adicionais

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Suporte

Se encontrar problemas, verifique:

1. **Logs no Supabase Dashboard**: https://supabase.com/dashboard/project/ieponcrmmetksukwvmtv/logs
2. **Edge Functions Logs**: Seção Functions > Logs
3. **Database Logs**: Seção Database > Logs

---

**Próximos Passos após Deployment:**
1. Configurar Stripe Webhooks
2. Adicionar domínio customizado
3. Configurar CI/CD com GitHub Actions
4. Deploy em produção (Vercel/Netlify)
