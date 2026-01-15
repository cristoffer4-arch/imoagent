/**
 * ScoringEngine - Intelligent Property Scoring System
 * 
 * Implements three scoring algorithms:
 * 1. Compatibility Score (40%): Location, price, type, characteristics
 * 2. Behavior Score (30%): User views, time spent, interactions
 * 3. Temporal Score (30%): Urgency, availability, market timing
 * 
 * Formula: FinalScore = (0.4 * Compatibility) + (0.3 * Behavior) + (0.3 * Temporal)
 */

import { PropertyEntity } from '@/types';
import {
  SearchCriteria,
  UserBehavior,
  TemporalFactors,
  ScoreComponents,
  ScoringResult,
  ScoreWeights,
} from './types';

/**
 * Default weights for score calculation
 * Can be adjusted dynamically via ML
 */
const DEFAULT_WEIGHTS: ScoreWeights = {
  compatibility: 0.4,
  behavior: 0.3,
  temporal: 0.3,
};

/**
 * ScoringEngine class for calculating property scores
 */
export class ScoringEngine {
  private weights: ScoreWeights;

  constructor(weights: ScoreWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Calculate complete score for a property
   */
  public calculateScore(
    property: PropertyEntity,
    criteria: SearchCriteria,
    behavior?: UserBehavior,
    temporal?: TemporalFactors
  ): ScoringResult {
    // Calculate individual components
    const compatibilityScore = this.calculateCompatibilityScore(property, criteria);
    const behaviorScore = behavior 
      ? this.calculateBehaviorScore(behavior)
      : 50; // Default neutral score if no behavior data
    const temporalScore = this.calculateTemporalScore(property, temporal);

    const components: ScoreComponents = {
      compatibilityScore,
      behaviorScore,
      temporalScore,
    };

    // Calculate weighted final score
    const finalScore = 
      (this.weights.compatibility * compatibilityScore) +
      (this.weights.behavior * behaviorScore) +
      (this.weights.temporal * temporalScore);

    // Generate explanation reasons
    const reasons = this.generateReasons(property, components, criteria);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(property, behavior, temporal);

    return {
      propertyId: property.id,
      finalScore: Math.round(finalScore * 100) / 100,
      components,
      weights: this.weights,
      confidence,
      reasons,
      calculatedAt: new Date(),
    };
  }

  /**
   * Algorithm 1: Compatibility Score (0-100)
   * Based on location, price, type, and characteristics match
   */
  private calculateCompatibilityScore(
    property: PropertyEntity,
    criteria: SearchCriteria
  ): number {
    let score = 0;
    let maxScore = 0;

    // Location matching (30 points)
    maxScore += 30;
    if (criteria.location) {
      const locationScore = this.scoreLocation(property, criteria.location);
      score += locationScore * 30;
    } else {
      score += 15; // Neutral if no location criteria
    }

    // Price matching (30 points)
    maxScore += 30;
    if (criteria.price && property.price_main) {
      const priceScore = this.scorePrice(property.price_main, criteria.price);
      score += priceScore * 30;
    } else {
      score += 15; // Neutral if no price criteria
    }

    // Type matching (20 points)
    maxScore += 20;
    if (criteria.type && property.typology) {
      if (property.typology.toLowerCase() === criteria.type.toLowerCase()) {
        score += 20;
      }
    } else {
      score += 10; // Neutral if no type criteria
    }

    // Characteristics matching (20 points)
    maxScore += 20;
    if (criteria.characteristics) {
      const charScore = this.scoreCharacteristics(property, criteria.characteristics);
      score += charScore * 20;
    } else {
      score += 10; // Neutral if no characteristics criteria
    }

    return Math.min(100, (score / maxScore) * 100);
  }

  /**
   * Score location match (0-1)
   */
  private scoreLocation(
    property: PropertyEntity,
    location: NonNullable<SearchCriteria['location']>
  ): number {
    let score = 0;
    let factors = 0;

    // District match (highest priority)
    if (location.distrito) {
      factors++;
      if (property.distrito?.toLowerCase() === location.distrito.toLowerCase()) {
        score += 1;
      }
    }

    // Municipality match
    if (location.concelho) {
      factors++;
      if (property.concelho?.toLowerCase() === location.concelho.toLowerCase()) {
        score += 1;
      }
    }

    // Parish match (most specific)
    if (location.freguesia) {
      factors++;
      if (property.freguesia?.toLowerCase() === location.freguesia.toLowerCase()) {
        score += 1;
      }
    }

    // GPS distance (if coordinates provided)
    if (location.lat && location.lon && property.lat && property.lon) {
      factors++;
      const distance = this.calculateDistance(
        location.lat,
        location.lon,
        property.lat,
        property.lon
      );
      const radius = location.radius || 10; // Default 10km
      if (distance <= radius) {
        score += 1 - (distance / radius); // Closer is better
      }
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Score price match (0-1)
   */
  private scorePrice(
    propertyPrice: number,
    priceRange: NonNullable<SearchCriteria['price']>
  ): number {
    const { min, max, preferred } = priceRange;

    // Exact preferred match
    if (preferred) {
      const diff = Math.abs(propertyPrice - preferred);
      const tolerance = preferred * 0.1; // 10% tolerance
      return Math.max(0, 1 - (diff / tolerance));
    }

    // Range match
    if (min !== undefined && max !== undefined) {
      if (propertyPrice >= min && propertyPrice <= max) {
        // Perfect range match
        const midpoint = (min + max) / 2;
        const distanceFromMid = Math.abs(propertyPrice - midpoint);
        const maxDistance = (max - min) / 2;
        return 1 - (distanceFromMid / maxDistance) * 0.2; // 0.8-1.0 score within range
      } else if (propertyPrice < min) {
        // Below range (still attractive for buyers)
        return 0.7;
      } else {
        // Above range (less attractive)
        const excess = propertyPrice - max;
        const tolerance = max * 0.2; // 20% tolerance above max
        return Math.max(0, 0.6 - (excess / tolerance) * 0.6);
      }
    }

    return 0.5; // Neutral if no clear price criteria
  }

  /**
   * Score characteristics match (0-1)
   */
  private scoreCharacteristics(
    property: PropertyEntity,
    characteristics: NonNullable<SearchCriteria['characteristics']>
  ): number {
    let score = 0;
    let factors = 0;

    // Bedrooms
    if (characteristics.bedrooms !== undefined && property.bedrooms !== undefined) {
      factors++;
      if (property.bedrooms >= characteristics.bedrooms) {
        score += 1;
      } else {
        score += Math.max(0, 1 - (characteristics.bedrooms - property.bedrooms) * 0.2);
      }
    }

    // Bathrooms
    if (characteristics.bathrooms !== undefined && property.bathrooms !== undefined) {
      factors++;
      if (property.bathrooms >= characteristics.bathrooms) {
        score += 1;
      } else {
        score += Math.max(0, 1 - (characteristics.bathrooms - property.bathrooms) * 0.3);
      }
    }

    // Area
    if (property.area_m2) {
      if (characteristics.area_min !== undefined) {
        factors++;
        score += property.area_m2 >= characteristics.area_min ? 1 : 0.5;
      }
      if (characteristics.area_max !== undefined) {
        factors++;
        score += property.area_m2 <= characteristics.area_max ? 1 : 0.5;
      }
    }

    // Features match
    if (characteristics.features && characteristics.features.length > 0) {
      factors++;
      const propertyFeatures = property.features || {};
      const matchedFeatures = characteristics.features.filter(
        (feature) => propertyFeatures[feature]
      );
      score += matchedFeatures.length / characteristics.features.length;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Algorithm 2: Behavior Score (0-100)
   * Based on user engagement with the property
   */
  private calculateBehaviorScore(behavior: UserBehavior): number {
    let score = 0;

    // Views contribute 30 points
    if (behavior.views) {
      score += Math.min(30, behavior.views * 10); // Max at 3 views
    }

    // Time spent contributes 30 points
    if (behavior.totalViewTime) {
      // 60 seconds = 10 points, 300 seconds (5 min) = 30 points
      const timeScore = Math.min(30, (behavior.totalViewTime / 300) * 30);
      score += timeScore;
    }

    // Interactions contribute 40 points
    if (behavior.interactions) {
      const { saved, contacted, shared, scheduled_visit } = behavior.interactions;
      if (saved) score += 10;
      if (shared) score += 10;
      if (contacted) score += 10;
      if (scheduled_visit) score += 10;
    }

    // Recency boost (viewed recently = more interested)
    if (behavior.lastViewedAt) {
      const hoursSinceView = 
        (Date.now() - behavior.lastViewedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceView < 24) {
        score *= 1.1; // 10% boost for recent views
      }
    }

    return Math.min(100, score);
  }

  /**
   * Algorithm 3: Temporal Score (0-100)
   * Based on urgency and availability factors
   */
  private calculateTemporalScore(
    property: PropertyEntity,
    temporal?: TemporalFactors
  ): number {
    let score = 50; // Start at neutral

    // Use temporal factors if provided, otherwise derive from property
    const daysOnMarket = temporal?.daysOnMarket ?? this.getDaysOnMarket(property);
    const isNewListing = temporal?.isNewListing ?? (daysOnMarket < 7);
    const availabilityProb = temporal?.availabilityProbability ?? property.availability_probability ?? 0.5;
    const recentPriceDropPct = temporal?.recentPriceDropPct ?? 0;

    // New listings score higher (30 points)
    if (isNewListing) {
      score += 30;
    } else if (daysOnMarket < 30) {
      score += 20;
    } else if (daysOnMarket < 90) {
      score += 10;
    } else {
      score -= 10; // Stale listings score lower
    }

    // Availability probability (30 points)
    score += availabilityProb * 30;

    // Recent price drop is urgent (20 points)
    if (recentPriceDropPct > 0) {
      score += Math.min(20, recentPriceDropPct * 2);
    }

    // Multiple price changes indicate motivated seller (10 points)
    if (temporal?.priceChanges && temporal.priceChanges > 1) {
      score += Math.min(10, temporal.priceChanges * 3);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate days on market from property data
   */
  private getDaysOnMarket(property: PropertyEntity): number {
    if (!property.first_seen) return 999;
    
    const firstSeen = new Date(property.first_seen);
    const now = new Date();
    return Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate human-readable reasons for the score
   */
  private generateReasons(
    property: PropertyEntity,
    components: ScoreComponents,
    criteria: SearchCriteria
  ): string[] {
    const reasons: string[] = [];

    // Compatibility reasons
    if (components.compatibilityScore >= 80) {
      reasons.push('Excelente correspondência com seus critérios de busca');
    } else if (components.compatibilityScore >= 60) {
      reasons.push('Boa correspondência com suas preferências');
    }

    if (criteria.location && property.freguesia) {
      reasons.push(`Localizado em ${property.freguesia}, ${property.concelho}`);
    }

    if (criteria.price && property.price_main) {
      const { min, max } = criteria.price;
      if (min && max && property.price_main >= min && property.price_main <= max) {
        reasons.push('Preço dentro da sua faixa preferida');
      }
    }

    // Behavior reasons
    if (components.behaviorScore >= 70) {
      reasons.push('Alto nível de interesse demonstrado');
    }

    // Temporal reasons
    if (components.temporalScore >= 80) {
      reasons.push('Oportunidade urgente - aja rapidamente');
    }

    const daysOnMarket = this.getDaysOnMarket(property);
    if (daysOnMarket < 7) {
      reasons.push('Novo no mercado');
    }

    if (property.availability_probability && property.availability_probability > 0.7) {
      reasons.push('Alta probabilidade de disponibilidade');
    }

    if (property.portal_count && property.portal_count > 3) {
      reasons.push(`Anunciado em ${property.portal_count} portais diferentes`);
    }

    return reasons.slice(0, 5); // Limit to top 5 reasons
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(
    property: PropertyEntity,
    behavior?: UserBehavior,
    temporal?: TemporalFactors
  ): number {
    let confidence = 0.5;
    let factors = 0;

    // Property data completeness
    if (property.lat && property.lon) {
      confidence += 0.1;
      factors++;
    }
    if (property.price_main) {
      confidence += 0.1;
      factors++;
    }
    if (property.typology) {
      confidence += 0.05;
      factors++;
    }
    if (property.area_m2) {
      confidence += 0.05;
      factors++;
    }

    // Behavior data availability
    if (behavior && (behavior.views || behavior.totalViewTime || behavior.interactions)) {
      confidence += 0.1;
      factors++;
    }

    // Temporal data availability
    if (temporal || property.first_seen) {
      confidence += 0.1;
      factors++;
    }

    return Math.min(1, confidence);
  }

  /**
   * Update weights (used by ML system)
   */
  public updateWeights(newWeights: ScoreWeights): void {
    // Validate weights sum to approximately 1
    const sum = newWeights.compatibility + newWeights.behavior + newWeights.temporal;
    if (Math.abs(sum - 1) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }
    this.weights = newWeights;
  }

  /**
   * Get current weights
   */
  public getWeights(): ScoreWeights {
    return { ...this.weights };
  }
}
