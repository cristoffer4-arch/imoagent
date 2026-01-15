/**
 * scoring.ts - Tipos e interfaces para o sistema de scoring e ranking
 */

import { PropertyCanonicalModel } from '../models/PropertyCanonicalModel';

/**
 * Preferências do usuário para busca de imóveis
 */
export interface UserPreferences {
  userId: string;
  tenantId: string;
  
  // Preferências de localização
  location?: {
    preferredConcelhos?: string[];
    preferredDistritos?: string[];
    maxDistanceKm?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Preferências de preço
  price?: {
    min?: number;
    max?: number;
    ideal?: number;
  };
  
  // Preferências de tipo
  propertyTypes?: string[];
  
  // Características desejadas
  characteristics?: {
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    minArea?: number;
    maxArea?: number;
    requiredFeatures?: string[];
    preferredFeatures?: string[];
  };
  
  // Transação
  transactionType?: 'SALE' | 'RENT' | 'SALE_OR_RENT';
  
  // Metadados
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Comportamento do usuário com propriedades
 */
export interface UserBehavior {
  userId: string;
  propertyId: string;
  
  // Métricas de interação
  viewCount: number;
  totalViewTimeSeconds: number;
  averageViewTimeSeconds: number;
  lastViewedAt: Date;
  firstViewedAt: Date;
  
  // Ações realizadas
  actions: {
    saved?: boolean;
    shared?: boolean;
    contacted?: boolean;
    scheduled?: boolean;
    inquired?: boolean;
  };
  
  // Engajamento
  imagesViewed?: number;
  detailsExpanded?: boolean;
  mapViewed?: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pesos para cálculo de score
 */
export interface ScoringWeights {
  compatibility: number;  // Default: 0.4
  behavior: number;       // Default: 0.3
  temporal: number;       // Default: 0.3
}

/**
 * Resultado do score de compatibilidade
 */
export interface CompatibilityScore {
  total: number;  // 0-100
  breakdown: {
    location: number;      // 0-30
    price: number;         // 0-25
    type: number;          // 0-15
    characteristics: number; // 0-30
  };
  reasons: string[];
}

/**
 * Resultado do score de comportamento
 */
export interface BehaviorScore {
  total: number;  // 0-100
  breakdown: {
    viewFrequency: number;     // 0-30
    viewDuration: number;      // 0-30
    interactions: number;      // 0-40
  };
  reasons: string[];
}

/**
 * Resultado do score temporal
 */
export interface TemporalScore {
  total: number;  // 0-100
  breakdown: {
    urgency: number;           // 0-40
    availability: number;      // 0-35
    marketTrend: number;       // 0-25
  };
  reasons: string[];
}

/**
 * Resultado final do scoring
 */
export interface PropertyScore {
  propertyId: string;
  userId: string;
  
  // Scores parciais
  compatibility: CompatibilityScore;
  behavior: BehaviorScore;
  temporal: TemporalScore;
  
  // Score final
  finalScore: number;  // 0-100
  
  // Pesos aplicados
  weights: ScoringWeights;
  
  // Razões principais
  topReasons: string[];
  
  // Metadados
  calculatedAt: Date;
}

/**
 * Propriedade com score calculado
 */
export interface ScoredProperty {
  property: PropertyCanonicalModel;
  score: PropertyScore;
  rank?: number;
}

/**
 * Opções para ranking
 */
export interface RankingOptions {
  weights?: Partial<ScoringWeights>;
  minScore?: number;
  maxResults?: number;
  groupBy?: 'concelho' | 'distrito' | 'type' | 'priceRange';
  sortBy?: 'score' | 'price' | 'recency' | 'popularity';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Resultado de ranking
 */
export interface RankingResult {
  properties: ScoredProperty[];
  metadata: {
    totalProperties: number;
    averageScore: number;
    topScore: number;
    bottomScore: number;
    calculatedAt: Date;
    userId: string;
    filters?: any;
  };
}

/**
 * Feedback do usuário para ML
 */
export interface UserFeedback {
  userId: string;
  propertyId: string;
  
  // Tipo de feedback
  feedbackType: 'positive' | 'negative' | 'neutral';
  
  // Ação que gerou o feedback
  action: 'viewed' | 'saved' | 'contacted' | 'scheduled' | 'ignored' | 'hidden';
  
  // Score sugerido pelo sistema na época
  suggestedScore?: number;
  
  // Timestamp
  createdAt: Date;
}

/**
 * Configuração de ML para otimização de pesos
 */
export interface MLConfig {
  learningRate: number;
  minSamples: number;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
}

/**
 * Métricas de performance do scoring
 */
export interface ScoringMetrics {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Precisão do scoring
  accuracy: number;
  precision: number;
  recall: number;
  
  // Estatísticas
  totalScores: number;
  averageScore: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  
  // Pesos otimizados
  optimizedWeights: ScoringWeights;
  
  calculatedAt: Date;
}
