# PROMPT GITHUB COPILOT - MÓDULO ANÚCNCIOS COM IA

## OBJETIVO
Implementar em `/src/app/ia-anuncios-idealista/page.tsx` um módulo completo React/Next.js (TypeScript) que permita:
1. Preencher dados do imóvel (tipologia, localização, áreas, estado, características)
2. Upload e edição de fotos com IA (simulação)
3. Geração automática de conteúdo SEO para 6 portais (Idealista, Facebook, Instagram, Casa Sapo, OLX, Email)
4. Revisão e exportação em ZIP

## ARQUITETURA

### Wizard de 4 Steps:
- Step 1: Formulário de dados
- Step 2: Upload e edição de fotos  
- Step 3: Geração de conteúdo IA
- Step 4: Painel de revisão e exportação

### Componentes Principais:
1. `ProgressStepper` - Barra de progresso visual
2. `FormularioDados` - Form com validação
3. `UploadEdicaoFotos` - Drag & drop, preview, reordenação
4. `GeradorConteudoIA` - Tabs por portal com conteúdo gerado
5. `PainelRevisao` - Grid de fotos + preview de textos + botões de ação

## TIPOS TYPESCRIPT

```typescript
interface DadosImovel {
  tipologia: string
  localizacao: string
  areaUtil: number
  areaBruta: number
  estado: 'novo' | 'renovado' | 'usado'
  caracteristicas: string[]
  pontosFortes: string
  descricaoLivre?: string
}

interface FotoImovel {
  id: string
  file: File
  preview: string
  processada?: string
  tipo: 'sala' | 'cozinha' | 'quarto' | 'banheiro' | 'varanda' | 'exterior'
  capa: boolean
  ordem: number
}

interface ConteudoGerado {
  idealista: { titulo: string; descricao: string; hashtags: string[] }
  facebook: { texto: string; hashtags: string[] }
  instagram: { texto: string; hashtags: string[] }
  casaSapo: { titulo: string; descricao: string }
  olx: { titulo: string; descricao: string }
  email: { assunto: string; corpo: string }
  destaques: string[]
  cta: string
}
```

## FEATURES OBRIGATÓRIAS

### Step 1 - Formulário:
- Select: Tipologia (T0-T5+)
- Input: Localização (texto)
- Number: Área útil e bruta
- Buttons: Estado (novo/renovado/usado)
- Multi-select: Características (suite, varanda, garagem, elevador, etc)
- Textarea: Pontos fortes
- Validação: Campos obrigatórios marcados com *

### Step 2 - Upload Fotos:
- Input file múltiplo ou drag & drop
- Preview imediato das fotos
- Simulação de processamento IA (setTimeout 2s)
- Reordenação drag & drop
- Botão "Marcar como capa" em cada foto
- Grid responsivo de fotos

### Step 3 - Geração IA:
- Loading state (2-3s)
- Função mock que gera texto baseado nos dados:
  - **Idealista**: 1500-2000 chars, SEO otimizado, estrutura em pirâmide
  - **Facebook**: 500-800 chars, storytelling emocional
  - **Instagram**: 150-200 chars + 20-25 hashtags
  - **Casa Sapo**: 1000-1500 chars, técnico
  - **OLX**: 300-500 chars, direto
  - **Email**: Template HTML com assunto e corpo
- Tabs para alternar entre portais
- Editação manual opcional
- Contador de caracteres

### Step 4 - Revisão:
- Grid de fotos processadas (2 colunas)
- Preview lado a lado de todos os textos
- Botões:
  - Copiar texto (por portal)
  - Download ZIP (mock - criar alert)
  - Voltar para editar

## DESIGN SYSTEM (Tailwind)

### Cores:
- Background: `bg-gradient-to-b from-slate-950 via-slate-900 to-black`
- Cards: `bg-slate-900 border border-slate-800 rounded-2xl`
- Primary: `bg-emerald-500` / `text-emerald-400`
- Secondary: `bg-slate-800`
- Text: `text-slate-50` / `text-slate-400`

### Componentes UI:
- Buttons: `px-6 py-3 rounded-lg font-bold`
- Inputs: `bg-slate-800 border border-slate-700 rounded-lg px-4 py-2`
- Cards: `p-8 space-y-6`
- Loading: Spinner com `animate-spin`

## ALGORITMO GERAÇÃO DE TEXTO SEO (Mock)

```typescript
function gerarConteudoImovel(dados: DadosImovel): ConteudoGerado {
  const { tipologia, localizacao, areaUtil, estado, caracteristicas, pontosFortes } = dados
  
  // Idealista - SEO otimizado
  const idealistaDesc = `Excelente ${tipologia} ${estado} em ${localizacao}, com ${areaUtil}m² de área útil. ${pontosFortes}. Características: ${caracteristicas.join(', ')}. Imóvel em localização privilegiada, próximo a comércios, transportes e serviços. Ideal para famílias que procuram conforto e qualidade de vida. Não perca esta oportunidade!`
  
  // Facebook - Storytelling
  const facebookTexto = `🏡 Encontre o lar dos seus sonhos! ${tipologia} ${estado} em ${localizacao}, perfeito para quem valoriza qualidade e localização. Com ${areaUtil}m², este imóvel oferece ${caracteristicas.slice(0,3).join(', ')} e muito mais. ${pontosFortes}. Marque já a sua visita!`
  
  // Instagram - Curto + Hashtags
  const instagramTexto = `🔑 ${tipologia} | ${localizacao}\n📏 ${areaUtil}m²\n✨ ${estado}\n\n${pontosFortes.substring(0, 100)}...`
  
  const hashtags = ['#imovel', `#${tipologia.toLowerCase()}`, '#porto', '#imobiliaria', '#venda', '#apartamento', '#casa', '#realestate', '#propriedade', '#investimento', '#novolar', `#${estado}`, '#qualidade', '#localizacao', '#conforto']
  
  return {
    idealista: { titulo: `${tipologia} ${estado} - ${localizacao}`, descricao: idealistaDesc, hashtags },
    facebook: { texto: facebookTexto, hashtags: hashtags.slice(0, 10) },
    instagram: { texto: instagramTexto, hashtags: hashtags.slice(0, 25) },
    casaSapo: { titulo: `${tipologia} com ${areaUtil}m² em ${localizacao}`, descricao: idealistaDesc.substring(0, 1200) },
    olx: { titulo: `${tipologia} ${localizacao} - ${areaUtil}m²`, descricao: `${tipologia} ${estado}, ${areaUtil}m². ${caracteristicas.join(', ')}. ${pontosFortes}` },
    email: { assunto: `Novo Imóvel: ${tipologia} em ${localizacao}`, corpo: `<p>${idealistaDesc}</p>` },
    destaques: caracteristicas.map(c => `• ${c}`),
    cta: 'Marque já a sua visita!'
  }
}
```

## ESTRUTURA DO CÓDIGO

Gere um arquivo único page.tsx com:
1. Imports (react, next/link, lucide-react icons)
2. Interfaces TypeScript
3. Componente principal AnunciosComIA
4. Funções auxiliares (gerar conteúdo, processar fotos mock)
5. Todos os sub-componentes inline
6. Export default

## CHECKLIST
- [ ] TypeScript sem erros
- [ ] Todos os 4 steps funcionais
- [ ] Progress stepper visual
- [ ] Validação de formulário
- [ ] Upload de fotos com preview
- [ ] Geração de conteúdo para 6 portais
- [ ] Tabs funcionais
- [ ] Botões de copiar texto
- [ ] Design responsivo
- [ ] Loading states
- [ ] Navegação entre steps
- [ ] Header com botão voltar

## INSTRUÇÕES FINAIS
Crie um módulo MVP funcional com todas as features descritas. Use funções mock para simular IA. Foque em UX fluida e design profissional com Tailwind. O código deve ser production-ready e bem comentado.
