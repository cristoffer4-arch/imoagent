# Sistema de Scoring e Ranking Inteligente

Sistema inteligente de pontuação e classificação de propriedades para o módulo IA Busca do Imoagent.

## 📋 Visão Geral

O sistema implementa três algoritmos de scoring que combinam para criar uma pontuação final:

1. **Score de Compatibilidade (40%)** - Localização, preço, tipo, características
2. **Score de Comportamento (30%)** - Visualizações, tempo, interações do utilizador
3. **Score Temporal (30%)** - Urgência, disponibilidade, timing de mercado

**Fórmula:** `ScoreFinal = (0.4 × Compatibilidade) + (0.3 × Comportamento) + (0.3 × Temporal)`

## 🚀 Início Rápido

```typescript
import { ScoringEngine, RankingService } from '@/services/scoring';
import { PropertyEntity } from '@/types';

// Criar engine de scoring
const engine = new ScoringEngine();

// Definir critérios de busca
const criteria = {
  location: {
    distrito: 'Lisboa',
    concelho: 'Lisboa',
  },
  price: {
    min: 200000,
    max: 300000,
  },
  type: 'T2',
  characteristics: {
    bedrooms: 2,
    area_min: 70,
  },
};

// Calcular score para uma propriedade
const property: PropertyEntity = { /* ... */ };
const score = engine.calculateScore(property, criteria);

console.log(`Score final: ${score.finalScore}`);
console.log(`Razões: ${score.reasons.join(', ')}`);
```

## 📊 Componentes do Sistema

### 1. ScoringEngine

Motor principal de cálculo de scores.

#### Uso Básico

```typescript
const engine = new ScoringEngine();

// Com dados de comportamento
const behavior = {
  propertyId: 'prop-123',
  views: 5,
  totalViewTime: 300, // segundos
  lastViewedAt: new Date(),
  interactions: {
    saved: true,
    contacted: true,
    shared: false,
    scheduled_visit: false,
  },
};

// Com dados temporais
const temporal = {
  daysOnMarket: 7,
  isNewListing: true,
  priceChanges: 1,
  recentPriceDropPct: 5,
  availabilityProbability: 0.8,
};

const result = engine.calculateScore(property, criteria, behavior, temporal);
```

#### Resultado do Score

```typescript
{
  propertyId: 'prop-123',
  finalScore: 85.3,
  components: {
    compatibilityScore: 90,
    behaviorScore: 75,
    temporalScore: 88
  },
  weights: {
    compatibility: 0.4,
    behavior: 0.3,
    temporal: 0.3
  },
  confidence: 0.92,
  reasons: [
    'Excelente correspondência com seus critérios de busca',
    'Localizado em Alameda, Lisboa',
    'Preço dentro da sua faixa preferida',
    'Novo no mercado',
    'Alta probabilidade de disponibilidade'
  ],
  calculatedAt: Date
}
```

### 2. RankingService

Serviço para ordenar e classificar propriedades.

#### Ranking Básico

```typescript
const service = new RankingService();

// Rankear lista de propriedades
const result = service.rankProperties(properties, criteria);

console.log(`Total: ${result.total}`);
console.log(`Score médio: ${result.averageScore}`);
console.log(`Top score: ${result.topScore}`);

result.rankedProperties.forEach((rp) => {
  console.log(`#${rp.rank} - ${rp.property.id}: ${rp.scoringResult.finalScore}`);
});
```

#### Top N Propriedades

```typescript
// Obter top 10 propriedades
const top10 = service.getTopProperties(properties, criteria, 10);
```

#### Filtrar por Threshold

```typescript
// Apenas propriedades com score >= 70
const goodProperties = service.filterByScoreThreshold(properties, criteria, 70);
```

#### Agrupar por Faixas de Score

```typescript
const grouped = service.groupByScoreRange(properties, criteria);

console.log(`Excelentes (80-100): ${grouped.excellent.length}`);
console.log(`Boas (60-79): ${grouped.good.length}`);
console.log(`Regulares (40-59): ${grouped.fair.length}`);
console.log(`Fracas (0-39): ${grouped.poor.length}`);
```

#### Comparar Propriedades

```typescript
const comparison = service.compareProperties(
  property1,
  property2,
  criteria
);

console.log(`Vencedor: ${comparison.winner}`);
console.log(`Diferença: ${comparison.scoreDifference} pontos`);
```

#### Ranking Diversificado

Evita mostrar propriedades muito similares consecutivamente:

```typescript
const diversified = service.getDiversifiedRanking(
  properties,
  criteria,
  0.3 // fator de diversidade (0-1)
);
```

### 3. MLWeightOptimizer

Sistema de Machine Learning para ajuste dinâmico de pesos.

#### Treinamento Básico

```typescript
import { MLWeightOptimizer } from '@/services/scoring';

const optimizer = new MLWeightOptimizer();

// Adicionar amostras de treinamento
optimizer.addTrainingSample({
  propertyId: 'prop-123',
  features: {
    compatibilityScore: 85,
    behaviorScore: 70,
    temporalScore: 75,
  },
  outcome: 'converted', // converted, contacted, viewed, ignored
  timestamp: new Date(),
});

// Treinar quando tiver >= 50 amostras
optimizer.train();

// Obter pesos otimizados
const optimizedWeights = optimizer.getOptimizedWeights();
console.log(optimizedWeights);
// { compatibility: 0.45, behavior: 0.32, temporal: 0.23 }
```

#### Avaliar Modelo

```typescript
const evaluation = optimizer.evaluate();

console.log(`Precisão: ${evaluation.accuracy * 100}%`);
console.log(`Erro médio: ${evaluation.avgError}`);
console.log(`Amostras: ${evaluation.sampleCount}`);
```

#### Sugestões de Ajuste

```typescript
const suggestion = optimizer.suggestWeightAdjustments();

console.log('Pesos atuais:', suggestion.current);
console.log('Pesos sugeridos:', suggestion.suggested);
console.log('Razão:', suggestion.rationale);
```

#### Teste A/B

```typescript
const weightsA = { compatibility: 0.4, behavior: 0.3, temporal: 0.3 };
const weightsB = { compatibility: 0.5, behavior: 0.3, temporal: 0.2 };

const result = await MLWeightOptimizer.abTest(weightsA, weightsB, testSamples);

console.log(`Vencedor: ${result.winner}`);
console.log(`Score A: ${result.scoreA}`);
console.log(`Score B: ${result.scoreB}`);
```

#### Persistência do Modelo

```typescript
// Salvar estado
const state = optimizer.getModelState();
localStorage.setItem('ml-model', JSON.stringify(state));

// Carregar estado
const savedState = JSON.parse(localStorage.getItem('ml-model'));
optimizer.loadModelState(savedState);
```

## 🔧 Integração com IA Busca

### Atualizar Edge Function

```typescript
// supabase/functions/ia-busca/handler.ts
import { ScoringEngine, RankingService } from '@/services/scoring';

export async function handler(request: Request): Promise<Response> {
  const payload = await request.json();
  
  // ... buscar propriedades dos portais ...
  
  // Criar serviços de scoring
  const engine = new ScoringEngine();
  const ranking = new RankingService(engine);
  
  // Rankear resultados
  const rankedResults = ranking.rankProperties(
    properties,
    payload.criteria,
    behaviorMap,
    temporalMap
  );
  
  return new Response(JSON.stringify({
    properties: rankedResults.rankedProperties,
    total: rankedResults.total,
    averageScore: rankedResults.averageScore,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Frontend Usage

```typescript
// src/app/ia-busca/page.tsx
'use client';

import { ScoringEngine, RankingService } from '@/services/scoring';
import { useEffect, useState } from 'react';

export default function BuscaPage() {
  const [rankedProperties, setRankedProperties] = useState([]);
  
  useEffect(() => {
    async function loadProperties() {
      // Buscar propriedades
      const response = await fetch('/api/properties/search', {
        method: 'POST',
        body: JSON.stringify({ criteria }),
      });
      const properties = await response.json();
      
      // Rankear no cliente
      const engine = new ScoringEngine();
      const ranking = new RankingService(engine);
      
      const result = ranking.rankProperties(properties, criteria);
      setRankedProperties(result.rankedProperties);
    }
    
    loadProperties();
  }, []);
  
  return (
    <div>
      {rankedProperties.map((rp) => (
        <PropertyCard
          key={rp.property.id}
          property={rp.property}
          rank={rp.rank}
          score={rp.scoringResult.finalScore}
          reasons={rp.scoringResult.reasons}
        />
      ))}
    </div>
  );
}
```

## 🧪 Testes

O sistema inclui 73 testes unitários cobrindo todos os componentes:

```bash
# Executar todos os testes
npm test -- __tests__/services/scoring

# Executar testes específicos
npm test -- __tests__/services/scoring/ScoringEngine.test.ts
npm test -- __tests__/services/scoring/RankingService.test.ts
npm test -- __tests__/services/scoring/MLWeightOptimizer.test.ts
```

### Cobertura de Testes

- **ScoringEngine**: 26 testes
  - Cálculo de scores
  - Algoritmo de compatibilidade
  - Algoritmo de comportamento
  - Algoritmo temporal
  - Gestão de pesos
  - Cálculo de confiança

- **RankingService**: 27 testes
  - Ranking básico
  - Paginação
  - Filtragem
  - Agrupamento
  - Comparação
  - Diversificação

- **MLWeightOptimizer**: 20 testes
  - Inicialização
  - Treinamento
  - Avaliação
  - Sugestões
  - Teste A/B
  - Persistência

## 📈 Algoritmos Detalhados

### Score de Compatibilidade (0-100)

1. **Localização (30 pontos)**
   - Distrito: correspondência exata
   - Concelho: correspondência exata
   - Freguesia: correspondência exata
   - GPS: distância dentro do raio

2. **Preço (30 pontos)**
   - Dentro da faixa: 80-100%
   - Abaixo da faixa: 70%
   - Acima da faixa: 0-60% (com tolerância)

3. **Tipo (20 pontos)**
   - Correspondência exata: 100%
   - Não corresponde: 0%

4. **Características (20 pontos)**
   - Quartos: >= requerido
   - Casas de banho: >= requerido
   - Área: dentro da faixa
   - Features: % de correspondência

### Score de Comportamento (0-100)

1. **Visualizações (30 pontos)**
   - 10 pontos por visualização (máx 3)

2. **Tempo de Visualização (30 pontos)**
   - 300 segundos = 30 pontos

3. **Interações (40 pontos)**
   - Guardado: 10 pontos
   - Partilhado: 10 pontos
   - Contactado: 10 pontos
   - Visita agendada: 10 pontos

4. **Boost de Recência (×1.1)**
   - Visualizado nas últimas 24h

### Score Temporal (0-100)

Base: 50 pontos

1. **Novidade (+30 pontos)**
   - < 7 dias: +30
   - < 30 dias: +20
   - < 90 dias: +10
   - > 90 dias: -10

2. **Disponibilidade (+30 pontos)**
   - Probabilidade × 30

3. **Redução de Preço (+20 pontos)**
   - % redução × 2 (máx 20)

4. **Múltiplas Alterações (+10 pontos)**
   - Nº alterações × 3 (máx 10)

## 🎯 Casos de Uso

### 1. Busca Personalizada

```typescript
// Usuário busca T2 em Lisboa
const criteria = {
  location: { distrito: 'Lisboa', concelho: 'Lisboa' },
  price: { min: 200000, max: 300000 },
  type: 'T2',
};

const results = ranking.rankProperties(properties, criteria);
// Propriedades ordenadas por compatibilidade
```

### 2. Leads Quentes

```typescript
// Identificar propriedades com alto engagement
const behaviorMap = getBehaviorData();
const results = ranking.rankProperties(properties, criteria, behaviorMap);

const hotLeads = results.rankedProperties.filter(
  rp => rp.scoringResult.components.behaviorScore > 70
);
```

### 3. Oportunidades Urgentes

```typescript
// Propriedades com alta urgência temporal
const temporalMap = getTemporalData();
const results = ranking.rankProperties(properties, criteria, undefined, temporalMap);

const urgent = results.rankedProperties.filter(
  rp => rp.scoringResult.components.temporalScore > 80
);
```

### 4. Otimização Contínua

```typescript
// Sistema aprende com conversões
const optimizer = new MLWeightOptimizer();

// Após cada interação do utilizador
onPropertyConverted((propertyId, features) => {
  optimizer.addTrainingSample({
    propertyId,
    features,
    outcome: 'converted',
    timestamp: new Date(),
  });
});

// Aplicar pesos otimizados
const optimizedWeights = optimizer.getOptimizedWeights();
const engine = new ScoringEngine(optimizedWeights);
```

## 🔍 Debugging

```typescript
// Ativar logging detalhado
const result = engine.calculateScore(property, criteria, behavior, temporal);

console.log('Componentes:', result.components);
console.log('Pesos:', result.weights);
console.log('Confiança:', result.confidence);
console.log('Razões:', result.reasons);

// Verificar cálculo
const manual = 
  result.components.compatibilityScore * result.weights.compatibility +
  result.components.behaviorScore * result.weights.behavior +
  result.components.temporalScore * result.weights.temporal;

console.log('Score manual:', manual);
console.log('Score calculado:', result.finalScore);
```

## 📝 Notas de Implementação

1. **Performance**: O sistema é otimizado para processar centenas de propriedades em milissegundos

2. **Escalabilidade**: Pode ser facilmente estendido com novos algoritmos de scoring

3. **Flexibilidade**: Pesos podem ser ajustados dinamicamente por ML ou manualmente

4. **Confiança**: Scores incluem métricas de confiança baseadas na completude dos dados

5. **Explicabilidade**: Cada score inclui razões humanas legíveis

## 🚧 Próximos Passos

- [ ] Integrar com Edge Function ia-busca
- [ ] Adicionar cache de scores para performance
- [ ] Implementar API REST para acesso externo
- [ ] Dashboard de monitorização de scores
- [ ] Feedback loop automático para ML
- [ ] Suporte para multi-idioma nas razões
- [ ] Webhooks para notificações de high-score properties

## 📚 Referências

- [Documentação Principal](../../README.md)
- [Tipos TypeScript](./types.ts)
- [Testes](../../../__tests__/services/scoring/)

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2026  
**Licença**: MIT
