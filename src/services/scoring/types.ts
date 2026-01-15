/**
 * Types for the Intelligent Scoring and Ranking System
 */

import { PropertyEntity } from '@/types';

/**
 * User preferences and search criteria for compatibility scoring
 */
export interface SearchCriteria {
  location?: {
    lat?: number;
    lon?: number;
    radius?: number; // in km
    distrito?: string;
    concelho?: string;
    freguesia?: string;
  };
  price?: {
    min?: number;
    max?: number;
    preferred?: number;
  };
  type?: string; // typology
  characteristics?: {
    bedrooms?: number;
    bathrooms?: number;
    area_min?: number;
    area_max?: number;
    features?: string[];
  };
}

/**
 * User behavior data for behavioral scoring
 */
export interface UserBehavior {
  propertyId: string;
  views?: number;
  totalViewTime?: number; // in seconds
  lastViewedAt?: Date;
  interactions?: {
    saved?: boolean;
    contacted?: boolean;
    shared?: boolean;
    scheduled_visit?: boolean;
  };
}

/**
 * Temporal factors for urgency scoring
 */
export interface TemporalFactors {
  daysOnMarket?: number;
  priceChanges?: number;
  recentPriceDropPct?: number;
  isNewListing?: boolean;
  availabilityProbability?: number;
}

/**
 * Individual score components
 */
export interface ScoreComponents {
  compatibilityScore: number; // 0-100
  behaviorScore: number; // 0-100
  temporalScore: number; // 0-100
}

/**
 * Final scoring result with breakdown
 */
export interface ScoringResult {
  propertyId: string;
  finalScore: number; // 0-100
  components: ScoreComponents;
  weights: ScoreWeights;
  confidence: number; // 0-1
  reasons: string[];
  calculatedAt: Date;
}

/**
 * Configurable weights for score components
 */
export interface ScoreWeights {
  compatibility: number; // default 0.4
  behavior: number; // default 0.3
  temporal: number; // default 0.3
}

/**
 * Machine learning model for dynamic weight adjustment
 */
export interface MLModelState {
  weights: ScoreWeights;
  trainingData: {
    propertyId: string;
    features: ScoreComponents;
    outcome: 'converted' | 'contacted' | 'viewed' | 'ignored';
    timestamp: Date;
  }[];
  lastTrainedAt?: Date;
  accuracy?: number;
}

/**
 * Ranked property with score details
 */
export interface RankedProperty {
  property: PropertyEntity;
  scoringResult: ScoringResult;
  rank: number;
}
