/**
 * Scoring and Ranking System - Main Export
 * 
 * Sistema inteligente de scoring e ranking para o módulo IA Busca
 */

export { ScoringEngine } from './ScoringEngine';
export { RankingService } from './RankingService';
export { MLWeightOptimizer } from './MLWeightOptimizer';

export type {
  SearchCriteria,
  UserBehavior,
  TemporalFactors,
  ScoreComponents,
  ScoringResult,
  ScoreWeights,
  MLModelState,
  RankedProperty,
} from './types';

export type { RankingOptions, RankingResult } from './RankingService';
export type { UserOutcome, TrainingSample } from './MLWeightOptimizer';
