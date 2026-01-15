/**
 * Example Usage of Intelligent Scoring and Ranking System
 * 
 * Este arquivo demonstra todos os casos de uso do sistema
 */

import { ScoringEngine, RankingService, MLWeightOptimizer } from '@/services/scoring';
import type { 
  SearchCriteria, 
  UserBehavior, 
  TemporalFactors,
  PropertyEntity 
} from '@/services/scoring';

// ============================================================================
// EXEMPLO 1: Busca Básica com Scoring
// ============================================================================

export async function example1_BasicSearch() {
  console.log('=== EXEMPLO 1: Busca Básica ===\n');

  // Dados de exemplo
  const properties: PropertyEntity[] = [
    {
      id: 'prop-1',
      tenant_id: 'tenant-1',
      distrito: 'Lisboa',
      concelho: 'Lisboa',
      freguesia: 'Alameda',
      typology: 'T2',
      price_main: 250000,
      area_m2: 75,
      bedrooms: 2,
      bathrooms: 1,
      portal_count: 3,
      first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.8,
    },
    {
      id: 'prop-2',
      tenant_id: 'tenant-1',
      distrito: 'Lisboa',
      concelho: 'Lisboa',
      freguesia: 'Arroios',
      typology: 'T3',
      price_main: 300000,
      area_m2: 90,
      bedrooms: 3,
      bathrooms: 2,
      portal_count: 2,
      first_seen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.6,
    },
  ];

  // Critérios do utilizador
  const criteria: SearchCriteria = {
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

  // Rankear propriedades
  const rankingService = new RankingService();
  const result = rankingService.rankProperties(properties, criteria);

  console.log(`Total de propriedades: ${result.total}`);
  console.log(`Score médio: ${result.averageScore.toFixed(2)}`);
  console.log(`Top score: ${result.topScore.toFixed(2)}\n`);

  result.rankedProperties.forEach((rp) => {
    console.log(`#${rp.rank} - ${rp.property.id}`);
    console.log(`  Score Final: ${rp.scoringResult.finalScore.toFixed(2)}`);
    console.log(`  Componentes:`);
    console.log(`    - Compatibilidade: ${rp.scoringResult.components.compatibilityScore.toFixed(2)}`);
    console.log(`    - Comportamento: ${rp.scoringResult.components.behaviorScore.toFixed(2)}`);
    console.log(`    - Temporal: ${rp.scoringResult.components.temporalScore.toFixed(2)}`);
    console.log(`  Razões: ${rp.scoringResult.reasons.join(', ')}\n`);
  });
}

// ============================================================================
// EXEMPLO 2: Busca com Dados de Comportamento
// ============================================================================

export async function example2_BehaviorBasedSearch() {
  console.log('=== EXEMPLO 2: Busca com Comportamento do Utilizador ===\n');

  const properties: PropertyEntity[] = [
    {
      id: 'prop-101',
      tenant_id: 'tenant-1',
      distrito: 'Lisboa',
      concelho: 'Lisboa',
      typology: 'T2',
      price_main: 250000,
      area_m2: 75,
      bedrooms: 2,
      first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const criteria: SearchCriteria = {
    location: { distrito: 'Lisboa' },
    price: { min: 200000, max: 300000 },
  };

  // Dados de comportamento do utilizador
  const behaviorMap = new Map<string, UserBehavior>();
  behaviorMap.set('prop-101', {
    propertyId: 'prop-101',
    views: 3,
    totalViewTime: 240, // 4 minutos
    lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    interactions: {
      saved: true,
      contacted: false,
      shared: true,
      scheduled_visit: false,
    },
  });

  const rankingService = new RankingService();
  const result = rankingService.rankProperties(properties, criteria, behaviorMap);

  const rp = result.rankedProperties[0];
  console.log(`Propriedade: ${rp.property.id}`);
  console.log(`Score de Comportamento: ${rp.scoringResult.components.behaviorScore.toFixed(2)}`);
  console.log(`Score Final: ${rp.scoringResult.finalScore.toFixed(2)}`);
  console.log(`Confiança: ${(rp.scoringResult.confidence * 100).toFixed(1)}%\n`);
}

// ============================================================================
// EXEMPLO 3: Identificar Oportunidades Urgentes
// ============================================================================

export async function example3_UrgentOpportunities() {
  console.log('=== EXEMPLO 3: Oportunidades Urgentes ===\n');

  const properties: PropertyEntity[] = [
    {
      id: 'urgent-1',
      tenant_id: 'tenant-1',
      distrito: 'Porto',
      typology: 'T2',
      price_main: 200000,
      first_seen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.9,
    },
    {
      id: 'stale-1',
      tenant_id: 'tenant-1',
      distrito: 'Porto',
      typology: 'T2',
      price_main: 210000,
      first_seen: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.3,
    },
  ];

  const criteria: SearchCriteria = {
    location: { distrito: 'Porto' },
    type: 'T2',
  };

  // Adicionar dados temporais explícitos
  const temporalMap = new Map<string, TemporalFactors>();
  temporalMap.set('urgent-1', {
    daysOnMarket: 2,
    isNewListing: true,
    priceChanges: 0,
    recentPriceDropPct: 0,
    availabilityProbability: 0.9,
  });
  temporalMap.set('stale-1', {
    daysOnMarket: 120,
    isNewListing: false,
    priceChanges: 3,
    recentPriceDropPct: 10,
    availabilityProbability: 0.3,
  });

  const rankingService = new RankingService();
  const result = rankingService.rankProperties(properties, criteria, undefined, temporalMap);

  // Filtrar apenas propriedades com alto score temporal
  const urgent = result.rankedProperties.filter(
    (rp) => rp.scoringResult.components.temporalScore > 75
  );

  console.log(`Propriedades urgentes encontradas: ${urgent.length}\n`);
  urgent.forEach((rp) => {
    console.log(`Propriedade: ${rp.property.id}`);
    console.log(`  Score Temporal: ${rp.scoringResult.components.temporalScore.toFixed(2)}`);
    console.log(`  Razões: ${rp.scoringResult.reasons.join(', ')}\n`);
  });
}

// ============================================================================
// EXEMPLO 4: Agrupar por Qualidade
// ============================================================================

export async function example4_GroupByQuality() {
  console.log('=== EXEMPLO 4: Agrupar por Qualidade ===\n');

  // Simular 20 propriedades com scores variados
  const properties: PropertyEntity[] = Array(20).fill(null).map((_, i) => ({
    id: `prop-${i}`,
    tenant_id: 'tenant-1',
    distrito: 'Lisboa',
    typology: i % 2 === 0 ? 'T2' : 'T3',
    price_main: 200000 + i * 15000,
    area_m2: 70 + i * 5,
    bedrooms: i % 2 === 0 ? 2 : 3,
    first_seen: new Date(Date.now() - i * 10 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const criteria: SearchCriteria = {
    location: { distrito: 'Lisboa' },
    price: { min: 200000, max: 400000 },
    type: 'T2',
  };

  const rankingService = new RankingService();
  const grouped = rankingService.groupByScoreRange(properties, criteria);

  console.log(`Excelentes (80-100): ${grouped.excellent.length} propriedades`);
  console.log(`Boas (60-79): ${grouped.good.length} propriedades`);
  console.log(`Regulares (40-59): ${grouped.fair.length} propriedades`);
  console.log(`Fracas (0-39): ${grouped.poor.length} propriedades\n`);

  if (grouped.excellent.length > 0) {
    console.log('Top 3 excelentes:');
    grouped.excellent.slice(0, 3).forEach((rp) => {
      console.log(`  - ${rp.property.id}: ${rp.scoringResult.finalScore.toFixed(2)}`);
    });
  }
}

// ============================================================================
// EXEMPLO 5: Comparar Duas Propriedades
// ============================================================================

export async function example5_CompareProperties() {
  console.log('\n=== EXEMPLO 5: Comparar Propriedades ===\n');

  const property1: PropertyEntity = {
    id: 'compare-1',
    tenant_id: 'tenant-1',
    distrito: 'Lisboa',
    concelho: 'Lisboa',
    freguesia: 'Alameda',
    typology: 'T2',
    price_main: 250000,
    area_m2: 75,
    bedrooms: 2,
    first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const property2: PropertyEntity = {
    id: 'compare-2',
    tenant_id: 'tenant-1',
    distrito: 'Lisboa',
    concelho: 'Cascais',
    freguesia: 'Cascais',
    typology: 'T2',
    price_main: 280000,
    area_m2: 80,
    bedrooms: 2,
    first_seen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const criteria: SearchCriteria = {
    location: {
      distrito: 'Lisboa',
      concelho: 'Lisboa',
    },
    price: { min: 200000, max: 300000 },
    type: 'T2',
  };

  const rankingService = new RankingService();
  const comparison = rankingService.compareProperties(property1, property2, criteria);

  console.log(`Propriedade 1: ${property1.id}`);
  console.log(`  Score: ${comparison.property1.score.finalScore.toFixed(2)}`);
  console.log(`\nPropriedade 2: ${property2.id}`);
  console.log(`  Score: ${comparison.property2.score.finalScore.toFixed(2)}`);
  console.log(`\nVencedor: ${comparison.winner}`);
  console.log(`Diferença: ${comparison.scoreDifference.toFixed(2)} pontos\n`);
}

// ============================================================================
// EXEMPLO 6: Machine Learning - Otimização de Pesos
// ============================================================================

export async function example6_MLOptimization() {
  console.log('=== EXEMPLO 6: Otimização ML de Pesos ===\n');

  const optimizer = new MLWeightOptimizer();

  // Simular 60 interações de utilizadores
  console.log('Adicionando amostras de treinamento...');
  
  // Padrão: Alta compatibilidade leva a conversões
  for (let i = 0; i < 30; i++) {
    optimizer.addTrainingSample({
      propertyId: `prop-${i}`,
      features: {
        compatibilityScore: 80 + Math.random() * 20,
        behaviorScore: 50 + Math.random() * 30,
        temporalScore: 60 + Math.random() * 20,
      },
      outcome: 'converted',
      timestamp: new Date(),
    });
  }

  // Baixa compatibilidade leva a ignorar
  for (let i = 30; i < 60; i++) {
    optimizer.addTrainingSample({
      propertyId: `prop-${i}`,
      features: {
        compatibilityScore: 30 + Math.random() * 30,
        behaviorScore: 40 + Math.random() * 20,
        temporalScore: 40 + Math.random() * 30,
      },
      outcome: 'ignored',
      timestamp: new Date(),
    });
  }

  console.log('Treinando modelo...\n');
  optimizer.train();

  const evaluation = optimizer.evaluate();
  console.log(`Precisão do modelo: ${(evaluation.accuracy * 100).toFixed(1)}%`);
  console.log(`Erro médio: ${evaluation.avgError.toFixed(2)}`);
  console.log(`Amostras de treinamento: ${evaluation.sampleCount}\n`);

  const optimizedWeights = optimizer.getOptimizedWeights();
  console.log('Pesos otimizados:');
  console.log(`  Compatibilidade: ${(optimizedWeights.compatibility * 100).toFixed(1)}%`);
  console.log(`  Comportamento: ${(optimizedWeights.behavior * 100).toFixed(1)}%`);
  console.log(`  Temporal: ${(optimizedWeights.temporal * 100).toFixed(1)}%\n`);

  const suggestion = optimizer.suggestWeightAdjustments();
  console.log('Sugestão do sistema:');
  console.log(`  ${suggestion.rationale}\n`);

  // Aplicar pesos otimizados
  const engine = new ScoringEngine(optimizedWeights);
  console.log('✓ Engine atualizada com pesos otimizados');
}

// ============================================================================
// EXEMPLO 7: Teste A/B de Configurações
// ============================================================================

export async function example7_ABTesting() {
  console.log('\n=== EXEMPLO 7: Teste A/B ===\n');

  const weightsA = {
    compatibility: 0.5,  // Prioriza compatibilidade
    behavior: 0.3,
    temporal: 0.2,
  };

  const weightsB = {
    compatibility: 0.3,
    behavior: 0.4,  // Prioriza comportamento
    temporal: 0.3,
  };

  // Criar amostras de teste
  const testSamples = Array(60).fill(null).map((_, i) => ({
    propertyId: `test-${i}`,
    features: {
      compatibilityScore: 60 + Math.random() * 40,
      behaviorScore: 50 + Math.random() * 50,
      temporalScore: 40 + Math.random() * 60,
    },
    outcome: (['converted', 'contacted', 'viewed'] as const)[Math.floor(Math.random() * 3)],
    timestamp: new Date(),
  }));

  console.log('Executando teste A/B...\n');
  
  const result = await MLWeightOptimizer.abTest(weightsA, weightsB, testSamples);

  console.log('Configuração A (Prioriza Compatibilidade):');
  console.log(`  Score: ${(result.scoreA * 100).toFixed(1)}%\n`);
  
  console.log('Configuração B (Prioriza Comportamento):');
  console.log(`  Score: ${(result.scoreB * 100).toFixed(1)}%\n`);
  
  console.log(`Vencedor: Configuração ${result.winner}\n`);
}

// ============================================================================
// EXEMPLO 8: Ranking Diversificado
// ============================================================================

export async function example8_DiversifiedRanking() {
  console.log('=== EXEMPLO 8: Ranking Diversificado ===\n');

  // Criar propriedades muito similares
  const properties: PropertyEntity[] = [
    // Grupo similar 1 (Lisboa, Alameda, T2)
    { id: 'sim-1', tenant_id: 'tenant-1', distrito: 'Lisboa', concelho: 'Lisboa', 
      freguesia: 'Alameda', typology: 'T2', price_main: 250000, area_m2: 75 },
    { id: 'sim-2', tenant_id: 'tenant-1', distrito: 'Lisboa', concelho: 'Lisboa',
      freguesia: 'Alameda', typology: 'T2', price_main: 252000, area_m2: 76 },
    { id: 'sim-3', tenant_id: 'tenant-1', distrito: 'Lisboa', concelho: 'Lisboa',
      freguesia: 'Alameda', typology: 'T2', price_main: 248000, area_m2: 74 },
    
    // Propriedade diferente
    { id: 'diff-1', tenant_id: 'tenant-1', distrito: 'Porto', concelho: 'Porto',
      freguesia: 'Cedofeita', typology: 'T3', price_main: 200000, area_m2: 90 },
  ];

  const criteria: SearchCriteria = {
    location: { distrito: 'Lisboa' },
    type: 'T2',
  };

  const rankingService = new RankingService();
  
  // Ranking normal
  const normal = rankingService.rankProperties(properties, criteria);
  console.log('Ranking Normal (pode ter propriedades similares consecutivas):');
  normal.rankedProperties.forEach((rp, i) => {
    console.log(`  ${i + 1}. ${rp.property.id} - ${rp.property.freguesia || 'N/A'}`);
  });

  console.log('\n');

  // Ranking diversificado
  const diversified = rankingService.getDiversifiedRanking(
    properties,
    criteria,
    0.5  // Alto fator de diversidade
  );
  console.log('Ranking Diversificado (penaliza similaridade):');
  diversified.forEach((rp, i) => {
    console.log(`  ${i + 1}. ${rp.property.id} - ${rp.property.freguesia || 'N/A'}`);
  });
  console.log('\n');
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export async function runAllExamples() {
  await example1_BasicSearch();
  await example2_BehaviorBasedSearch();
  await example3_UrgentOpportunities();
  await example4_GroupByQuality();
  await example5_CompareProperties();
  await example6_MLOptimization();
  await example7_ABTesting();
  await example8_DiversifiedRanking();
  
  console.log('=== Todos os exemplos executados com sucesso! ===');
}

// Execute if run directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
