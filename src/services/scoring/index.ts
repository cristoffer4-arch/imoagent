/**
 * Scoring Services - Sistema de scoring e ranking inteligente
 * 
 * Exports:
 * - ScoringEngine: Motor central de scoring
 * - RankingService: Serviço de ranking e ordenação
 * - MLScoreOptimizer: Otimização de pesos com ML
 * - CompatibilityScorer: Score de compatibilidade
 * - BehaviorScorer: Score de comportamento
 * - TemporalScorer: Score temporal
 */

export { ScoringEngine } from './ScoringEngine';
export { RankingService } from './RankingService';
export { MLScoreOptimizer } from './MLScoreOptimizer';
export { CompatibilityScorer } from './CompatibilityScorer';
export { BehaviorScorer } from './BehaviorScorer';
export { TemporalScorer } from './TemporalScorer';

// Re-export tipos para conveniência
export type {
  UserPreferences,
  UserBehavior,
  ScoringWeights,
  CompatibilityScore,
  BehaviorScore,
  TemporalScore,
  PropertyScore,
  ScoredProperty,
  RankingOptions,
  RankingResult,
  UserFeedback,
  MLConfig,
  ScoringMetrics,
} from '../../types/scoring';
