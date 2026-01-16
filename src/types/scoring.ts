/**
 * Scoring Types - Tipos para o sistema de scoring de propriedades
 * 
 * Fórmula base:
 * ScoreFinal = (0.4 * ScoreCompatibilidade) + (0.3 * ScoreComportamento) + (0.3 * ScoreTemporal)
 */

import { PropertyCanonicalModel } from '../models/PropertyCanonicalModel';

/**
 * Pesos dos componentes de score
 */
export interface ScoringWeights {
  compatibility: number;    // Peso do score de compatibilidade (default: 0.4)
  behavior: number;         // Peso do score de comportamento (default: 0.3)
  temporal: number;         // Peso do score temporal (default: 0.3)
}

/**
 * Score completo de uma propriedade
 */
export interface PropertyScore {
  // Score final (0-100)
  finalScore: number;
  
  // Componentes individuais (0-100)
  compatibilityScore: number;
  behaviorScore: number;
  temporalScore: number;
  
  // Detalhamento de cada componente
  components: ScoreComponents;
  
  // Razões principais para o score
  topReasons: string[];
  
  // Confiança no score (0-1)
  confidence: number;
  
  // Metadados
  calculatedAt: Date;
  version: string;           // Versão do algoritmo
}

/**
 * Componentes detalhados do score
 */
export interface ScoreComponents {
  compatibility: CompatibilityScoreComponents;
  behavior: BehaviorScoreComponents;
  temporal: TemporalScoreComponents;
}

/**
 * Componentes do Score de Compatibilidade (40% do total)
 * 
 * Avalia quão bem a propriedade se encaixa nos critérios de busca
 */
export interface CompatibilityScoreComponents {
  // Tipo de propriedade (0-25 pts)
  typeMatch: number;
  typeMatchReason: string;
  
  // Localização (0-25 pts)
  locationMatch: number;
  locationMatchReason: string;
  
  // Preço (0-25 pts)
  priceMatch: number;
  priceMatchReason: string;
  
  // Área (0-25 pts)
  areaMatch: number;
  areaMatchReason: string;
  
  // Subtotal (0-100)
  subtotal: number;
}

/**
 * Componentes do Score de Comportamento (30% do total)
 * 
 * Baseado no histórico de interações do usuário
 */
export interface BehaviorScoreComponents {
  // Histórico de interações (0-40 pts)
  interactionHistory: number;
  interactionReason: string;
  
  // Padrões de busca (0-30 pts)
  searchPatterns: number;
  searchPatternsReason: string;
  
  // Preferências do usuário (0-30 pts)
  userPreferences: number;
  userPreferencesReason: string;
  
  // Subtotal (0-100)
  subtotal: number;
}

/**
 * Componentes do Score Temporal (30% do total)
 * 
 * Baseado em recência e urgência
 */
export interface TemporalScoreComponents {
  // Recência (0-40 pts)
  recency: number;
  recencyReason: string;
  
  // Urgência (0-30 pts)
  urgency: number;
  urgencyReason: string;
  
  // Sazonalidade (0-30 pts)
  seasonality: number;
  seasonalityReason: string;
  
  // Subtotal (0-100)
  subtotal: number;
}

/**
 * Contexto para cálculo de score
 */
export interface ScoringContext {
  // Modo de busca (afeta pesos e cálculos)
  mode: 'ANGARIACAO' | 'VENDA';
  
  // Dados do usuário (para score comportamental)
  userId?: string;
  userHistory?: UserSearchHistory;
  userPreferences?: UserPreferences;
  
  // Filtros de busca (para score de compatibilidade)
  filters?: {
    propertyType?: string[];
    location?: {
      distrito?: string;
      concelho?: string;
      freguesia?: string;
    };
    priceRange?: {
      min?: number;
      max?: number;
    };
    areaRange?: {
      min?: number;
      max?: number;
    };
  };
  
  // Pesos customizados (opcional)
  weights?: Partial<ScoringWeights>;
}

/**
 * Histórico de buscas do usuário
 */
export interface UserSearchHistory {
  searches: Array<{
    timestamp: Date;
    filters: any;
    resultsViewed: string[];    // IDs das propriedades visualizadas
    resultsContacted: string[]; // IDs das propriedades contactadas
  }>;
}

/**
 * Preferências do usuário
 */
export interface UserPreferences {
  // Localizações favoritas
  favoriteDistritos?: string[];
  favoriteConcelhos?: string[];
  
  // Tipos preferidos
  preferredPropertyTypes?: string[];
  
  // Faixas de preço habituais
  typicalPriceRange?: {
    min: number;
    max: number;
  };
  
  // Faixas de área habituais
  typicalAreaRange?: {
    min: number;
    max: number;
  };
}

/**
 * Score específico de Angariação
 * 
 * Prioriza:
 * - Recência (imóveis recém-publicados)
 * - Multi-portal (aparece em múltiplos portais)
 * - Divergência de preço (variação entre portais)
 */
export interface AngariacaoScore extends PropertyScore {
  // Componentes específicos
  angariacao: {
    // Recência (0-40 pts)
    recencyScore: number;
    
    // Multi-portal (0-30 pts)
    multiPortalScore: number;
    portalCount: number;
    
    // Divergência de preço (0-30 pts)
    priceDivergenceScore: number;
    priceDivergencePercentage: number;
  };
}

/**
 * Score específico de Venda
 * 
 * Prioriza:
 * - Disponibilidade (probabilidade de estar ativo)
 * - Recência de atualização
 * - Visibilidade (número de portais)
 */
export interface VendaScore extends PropertyScore {
  // Componentes específicos
  venda: {
    // Disponibilidade (0-40 pts)
    availabilityScore: number;
    availabilityProbability: number;
    
    // Recência de atualização (0-30 pts)
    updateRecencyScore: number;
    daysSinceUpdate: number;
    
    // Visibilidade (0-30 pts)
    visibilityScore: number;
    portalCount: number;
  };
}

/**
 * Resultado de cálculo de score em lote
 */
export interface BatchScoringResult {
  scores: Map<string, PropertyScore>; // propertyId -> score
  totalProcessed: number;
  totalFailed: number;
  averageScore: number;
  executionTimeMs: number;
}

/**
 * Configuração do motor de scoring
 */
export interface ScoringEngineConfig {
  // Pesos padrão
  defaultWeights: ScoringWeights;
  
  // Pesos específicos por modo
  angariacaoWeights?: ScoringWeights;
  vendaWeights?: ScoringWeights;
  
  // Configurações de cache
  cacheEnabled: boolean;
  cacheTTLSeconds: number;
  
  // Configurações de performance
  batchSize: number;
  maxConcurrency: number;
  
  // Versão do algoritmo
  version: string;
}

/**
 * Entrada para cálculo de score
 */
export interface ScoringInput {
  property: PropertyCanonicalModel;
  context: ScoringContext;
}

/**
 * Saída de cálculo de score
 */
export interface ScoringOutput {
  propertyId: string;
  score: PropertyScore | AngariacaoScore | VendaScore;
  success: boolean;
  error?: string;
}
