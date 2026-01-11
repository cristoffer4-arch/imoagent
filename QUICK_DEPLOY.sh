#!/bin/bash

# Quick Deploy Script - Imoagent Edge Functions
# Este script faz o deploy de todas as 7 Edge Functions para o Supabase

echo "🚀 Iniciando deploy das Edge Functions..."
echo ""

# Verificar se está logado no Supabase
echo "📋 Verificando login no Supabase..."
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Você não está logado no Supabase!"
    echo "Execute: supabase login"
    exit 1
fi

echo "✅ Login verificado!"
echo ""

# Verificar se o projeto está linkado
echo "🔗 Verificando link do projeto..."
if [ ! -f "./.supabase/config.toml" ]; then
    echo "⚠️  Projeto não está linkado. Linkando agora..."
    supabase link --project-ref ieponcrmmetksukwvmtv
fi

echo "✅ Projeto linkado!"
echo ""

# Array com nomes das funções
functions=(
    "ia-orquestradora"
    "ia-busca"
    "ia-coaching"
    "ia-gamificacao"
    "ia-anuncios-idealista"
    "ia-assistente-legal"
    "ia-leads-comissoes"
)

# Contador
total=${#functions[@]}
current=0

echo "📡 Deploying $total Edge Functions..."
echo "══════════════════════════════════════════"

# Deploy de cada função
for func in "${functions[@]}"; do
    current=$((current + 1))
    echo ""
    echo "[$current/$total] Deploying $func..."
    
    if supabase functions deploy "$func" --no-verify-jwt; then
        echo "    ✅ $func deployed successfully!"
    else
        echo "    ❌ Error deploying $func"
        echo "    Continuando com as próximas..."
    fi
done

echo ""
echo "══════════════════════════════════════════"
echo "✅ Deploy concluído!"
echo ""
echo "🔍 Verifique as funções em:"
echo "https://supabase.com/dashboard/project/ieponcrmmetksukwvmtv/functions"
echo ""
echo "📊 URLs das funções:"
for func in "${functions[@]}"; do
    echo "  • https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/$func"
done
echo ""
echo "🧪 Para testar localmente:"
echo "supabase functions serve"
echo ""
echo "✨ Deployment completo!"
