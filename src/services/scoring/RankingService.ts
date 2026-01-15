/**
 * RankingService - Orders and ranks properties by final score
 * 
 * Provides multiple ranking strategies and result pagination
 */

import { PropertyEntity } from '@/types';
import {
  SearchCriteria,
  UserBehavior,
  TemporalFactors,
  RankedProperty,
  ScoringResult,
} from './types';
import { ScoringEngine } from './ScoringEngine';

/**
 * Options for ranking
 */
export interface RankingOptions {
  limit?: number;
  offset?: number;
  minScore?: number;
  includeReasons?: boolean;
}

/**
 * Ranking result with pagination info
 */
export interface RankingResult {
  rankedProperties: RankedProperty[];
  total: number;
  page: number;
  perPage: number;
  averageScore: number;
  topScore: number;
}

/**
 * RankingService for ordering search results
 */
export class RankingService {
  private scoringEngine: ScoringEngine;

  constructor(scoringEngine?: ScoringEngine) {
    this.scoringEngine = scoringEngine || new ScoringEngine();
  }

  /**
   * Rank a list of properties based on criteria
   */
  public rankProperties(
    properties: PropertyEntity[],
    criteria: SearchCriteria,
    behaviorMap?: Map<string, UserBehavior>,
    temporalMap?: Map<string, TemporalFactors>,
    options: RankingOptions = {}
  ): RankingResult {
    // Calculate scores for all properties
    const scoredProperties = properties.map((property) => {
      const behavior = behaviorMap?.get(property.id);
      const temporal = temporalMap?.get(property.id);
      
      const scoringResult = this.scoringEngine.calculateScore(
        property,
        criteria,
        behavior,
        temporal
      );

      return {
        property,
        scoringResult,
      };
    });

    // Filter by minimum score if specified
    let filtered = scoredProperties;
    if (options.minScore !== undefined) {
      filtered = scoredProperties.filter(
        (item) => item.scoringResult.finalScore >= options.minScore!
      );
    }

    // Sort by final score (descending)
    filtered.sort((a, b) => b.scoringResult.finalScore - a.scoringResult.finalScore);

    // Calculate statistics
    const totalFiltered = filtered.length;
    const averageScore = totalFiltered > 0
      ? filtered.reduce((sum, item) => sum + item.scoringResult.finalScore, 0) / totalFiltered
      : 0;
    const topScore = totalFiltered > 0 ? filtered[0].scoringResult.finalScore : 0;

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || totalFiltered;
    const paged = filtered.slice(offset, offset + limit);

    // Add rank numbers
    const rankedProperties: RankedProperty[] = paged.map((item, index) => ({
      property: item.property,
      scoringResult: item.scoringResult,
      rank: offset + index + 1,
    }));

    return {
      rankedProperties,
      total: totalFiltered,
      page: Math.floor(offset / (limit || 1)) + 1,
      perPage: limit,
      averageScore: Math.round(averageScore * 100) / 100,
      topScore: Math.round(topScore * 100) / 100,
    };
  }

  /**
   * Re-rank properties with updated weights (for A/B testing or ML optimization)
   */
  public reRankWithWeights(
    rankedResult: RankingResult,
    criteria: SearchCriteria,
    behaviorMap?: Map<string, UserBehavior>,
    temporalMap?: Map<string, TemporalFactors>
  ): RankingResult {
    const properties = rankedResult.rankedProperties.map((rp) => rp.property);
    return this.rankProperties(properties, criteria, behaviorMap, temporalMap);
  }

  /**
   * Get top N properties
   */
  public getTopProperties(
    properties: PropertyEntity[],
    criteria: SearchCriteria,
    topN: number = 10,
    behaviorMap?: Map<string, UserBehavior>,
    temporalMap?: Map<string, TemporalFactors>
  ): RankedProperty[] {
    const result = this.rankProperties(
      properties,
      criteria,
      behaviorMap,
      temporalMap,
      { limit: topN }
    );
    return result.rankedProperties;
  }

  /**
   * Filter properties by score threshold
   */
  public filterByScoreThreshold(
    properties: PropertyEntity[],
    criteria: SearchCriteria,
    threshold: number,
    behaviorMap?: Map<string, UserBehavior>,
    temporalMap?: Map<string, TemporalFactors>
  ): RankedProperty[] {
    const result = this.rankProperties(
      properties,
      criteria,
      behaviorMap,
      temporalMap,
      { minScore: threshold }
    );
    return result.rankedProperties;
  }

  /**
   * Get properties grouped by score ranges
   */
  public groupByScoreRange(
    properties: PropertyEntity[],
    criteria: SearchCriteria,
    behaviorMap?: Map<string, UserBehavior>,
    temporalMap?: Map<string, TemporalFactors>
  ): {
    excellent: RankedProperty[]; // 80-100
    good: RankedProperty[]; // 60-79
    fair: RankedProperty[]; // 40-59
    poor: RankedProperty[]; // 0-39
  } {
    const result = this.rankProperties(properties, criteria, behaviorMap, temporalMap);

    return {
      excellent: result.rankedProperties.filter((rp) => rp.scoringResult.finalScore >= 80),
      good: result.rankedProperties.filter(
        (rp) => rp.scoringResult.finalScore >= 60 && rp.scoringResult.finalScore < 80
      ),
      fair: result.rankedProperties.filter(
        (rp) => rp.scoringResult.finalScore >= 40 && rp.scoringResult.finalScore < 60
      ),
      poor: result.rankedProperties.filter((rp) => rp.scoringResult.finalScore < 40),
    };
  }

  /**
   * Compare two properties side-by-side
   */
  public compareProperties(
    property1: PropertyEntity,
    property2: PropertyEntity,
    criteria: SearchCriteria,
    behavior1?: UserBehavior,
    behavior2?: UserBehavior,
    temporal1?: TemporalFactors,
    temporal2?: TemporalFactors
  ): {
    property1: { property: PropertyEntity; score: ScoringResult };
    property2: { property: PropertyEntity; score: ScoringResult };
    winner: 'property1' | 'property2' | 'tie';
    scoreDifference: number;
  } {
    const score1 = this.scoringEngine.calculateScore(property1, criteria, behavior1, temporal1);
    const score2 = this.scoringEngine.calculateScore(property2, criteria, behavior2, temporal2);

    const difference = Math.abs(score1.finalScore - score2.finalScore);
    let winner: 'property1' | 'property2' | 'tie';

    if (difference < 1) {
      winner = 'tie';
    } else if (score1.finalScore > score2.finalScore) {
      winner = 'property1';
    } else {
      winner = 'property2';
    }

    return {
      property1: { property: property1, score: score1 },
      property2: { property: property2, score: score2 },
      winner,
      scoreDifference: Math.round(difference * 100) / 100,
    };
  }

  /**
   * Get diversity score to avoid showing too similar properties
   */
  public getDiversifiedRanking(
    properties: PropertyEntity[],
    criteria: SearchCriteria,
    diversityFactor: number = 0.3, // 0-1, higher = more diversity
    behaviorMap?: Map<string, UserBehavior>,
    temporalMap?: Map<string, TemporalFactors>
  ): RankedProperty[] {
    // First, get standard ranking
    const standardRanking = this.rankProperties(
      properties,
      criteria,
      behaviorMap,
      temporalMap
    );

    // Apply diversity penalty for similar consecutive properties
    const diversified: RankedProperty[] = [];
    const used: Set<string> = new Set();

    for (const ranked of standardRanking.rankedProperties) {
      if (diversified.length === 0) {
        diversified.push(ranked);
        used.add(ranked.property.id);
        continue;
      }

      // Check similarity with last added property
      const lastAdded = diversified[diversified.length - 1];
      const similarity = this.calculateSimilarity(ranked.property, lastAdded.property);
      
      // Apply diversity penalty
      const adjustedScore = ranked.scoringResult.finalScore * (1 - similarity * diversityFactor);
      
      // Create new scoring result with adjusted score
      const adjustedScoringResult: ScoringResult = {
        ...ranked.scoringResult,
        finalScore: adjustedScore,
      };

      diversified.push({
        ...ranked,
        scoringResult: adjustedScoringResult,
      });
      used.add(ranked.property.id);
    }

    // Re-sort by adjusted scores
    diversified.sort((a, b) => b.scoringResult.finalScore - a.scoringResult.finalScore);

    // Update ranks
    return diversified.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  /**
   * Calculate similarity between two properties (0-1)
   */
  private calculateSimilarity(prop1: PropertyEntity, prop2: PropertyEntity): number {
    let similarity = 0;
    let factors = 0;

    // Same location
    if (prop1.freguesia === prop2.freguesia && prop1.freguesia) {
      similarity += 0.3;
      factors++;
    } else if (prop1.concelho === prop2.concelho && prop1.concelho) {
      similarity += 0.2;
      factors++;
    }

    // Same typology
    if (prop1.typology === prop2.typology && prop1.typology) {
      similarity += 0.3;
      factors++;
    }

    // Similar price (within 10%)
    if (prop1.price_main && prop2.price_main) {
      const priceDiff = Math.abs(prop1.price_main - prop2.price_main);
      const avgPrice = (prop1.price_main + prop2.price_main) / 2;
      if (priceDiff / avgPrice < 0.1) {
        similarity += 0.2;
      }
      factors++;
    }

    // Similar size
    if (prop1.area_m2 && prop2.area_m2) {
      const sizeDiff = Math.abs(prop1.area_m2 - prop2.area_m2);
      const avgSize = (prop1.area_m2 + prop2.area_m2) / 2;
      if (sizeDiff / avgSize < 0.15) {
        similarity += 0.2;
      }
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Update the scoring engine (useful for ML weight updates)
   */
  public updateScoringEngine(newEngine: ScoringEngine): void {
    this.scoringEngine = newEngine;
  }

  /**
   * Get the current scoring engine
   */
  public getScoringEngine(): ScoringEngine {
    return this.scoringEngine;
  }
}
