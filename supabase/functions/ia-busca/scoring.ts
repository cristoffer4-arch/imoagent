/**
 * Scoring Engine for Deno/Edge Functions
 * Adapted from the main ScoringEngine for use in Supabase Edge Functions
 */

// Types (simplified for Edge Function use)
export interface SearchCriteria {
  location?: {
    lat?: number;
    lon?: number;
    radius?: number;
    distrito?: string;
    concelho?: string;
    freguesia?: string;
  };
  price?: {
    min?: number;
    max?: number;
    preferred?: number;
  };
  type?: string;
  characteristics?: {
    bedrooms?: number;
    bathrooms?: number;
    area_min?: number;
    area_max?: number;
  };
}

export interface PropertyData {
  id: string;
  lat?: number;
  lon?: number;
  freguesia?: string;
  concelho?: string;
  distrito?: string;
  typology?: string;
  area_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  price_main?: number;
  portal_count?: number;
  first_seen?: string;
  availability_probability?: number;
}

export interface ScoredProperty {
  property: PropertyData;
  finalScore: number;
  compatibilityScore: number;
  behaviorScore: number;
  temporalScore: number;
  reasons: string[];
  rank: number;
}

const DEFAULT_WEIGHTS = {
  compatibility: 0.4,
  behavior: 0.3,
  temporal: 0.3,
};

/**
 * Calculate compatibility score (0-100)
 */
function calculateCompatibilityScore(
  property: PropertyData,
  criteria: SearchCriteria
): number {
  let score = 0;
  let maxScore = 0;

  // Location (30 points)
  maxScore += 30;
  if (criteria.location) {
    let locationScore = 0;
    let factors = 0;

    if (criteria.location.distrito && property.distrito) {
      factors++;
      if (property.distrito.toLowerCase() === criteria.location.distrito.toLowerCase()) {
        locationScore += 1;
      }
    }

    if (criteria.location.concelho && property.concelho) {
      factors++;
      if (property.concelho.toLowerCase() === criteria.location.concelho.toLowerCase()) {
        locationScore += 1;
      }
    }

    if (criteria.location.freguesia && property.freguesia) {
      factors++;
      if (property.freguesia.toLowerCase() === criteria.location.freguesia.toLowerCase()) {
        locationScore += 1;
      }
    }

    score += (factors > 0 ? locationScore / factors : 0.5) * 30;
  } else {
    score += 15;
  }

  // Price (30 points)
  maxScore += 30;
  if (criteria.price && property.price_main) {
    const { min, max } = criteria.price;
    if (min !== undefined && max !== undefined) {
      if (property.price_main >= min && property.price_main <= max) {
        const midpoint = (min + max) / 2;
        const distanceFromMid = Math.abs(property.price_main - midpoint);
        const maxDistance = (max - min) / 2;
        score += (1 - (distanceFromMid / maxDistance) * 0.2) * 30;
      } else if (property.price_main < min) {
        score += 21; // 70% of 30
      } else {
        const excess = property.price_main - max;
        const tolerance = max * 0.2;
        score += Math.max(0, 0.6 - (excess / tolerance) * 0.6) * 30;
      }
    } else {
      score += 15;
    }
  } else {
    score += 15;
  }

  // Type (20 points)
  maxScore += 20;
  if (criteria.type && property.typology) {
    if (property.typology.toLowerCase() === criteria.type.toLowerCase()) {
      score += 20;
    }
  } else {
    score += 10;
  }

  // Characteristics (20 points)
  maxScore += 20;
  if (criteria.characteristics) {
    let charScore = 0;
    let factors = 0;

    if (criteria.characteristics.bedrooms !== undefined && property.bedrooms !== undefined) {
      factors++;
      if (property.bedrooms >= criteria.characteristics.bedrooms) {
        charScore += 1;
      } else {
        charScore += Math.max(0, 1 - (criteria.characteristics.bedrooms - property.bedrooms) * 0.2);
      }
    }

    if (property.area_m2 && criteria.characteristics.area_min !== undefined) {
      factors++;
      charScore += property.area_m2 >= criteria.characteristics.area_min ? 1 : 0.5;
    }

    score += (factors > 0 ? charScore / factors : 0.5) * 20;
  } else {
    score += 10;
  }

  return Math.min(100, (score / maxScore) * 100);
}

/**
 * Calculate temporal score (0-100)
 */
function calculateTemporalScore(property: PropertyData): number {
  let score = 50;

  // Days on market
  let daysOnMarket = 999;
  if (property.first_seen) {
    const firstSeen = new Date(property.first_seen);
    const now = new Date();
    daysOnMarket = Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
  }

  // New listings score higher
  if (daysOnMarket < 7) {
    score += 30;
  } else if (daysOnMarket < 30) {
    score += 20;
  } else if (daysOnMarket < 90) {
    score += 10;
  } else {
    score -= 10;
  }

  // Availability probability
  if (property.availability_probability) {
    score += property.availability_probability * 30;
  } else {
    score += 15;
  }

  // Multiple portals indicate good opportunity
  if (property.portal_count && property.portal_count > 3) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable reasons
 */
function generateReasons(
  property: PropertyData,
  compatScore: number,
  temporalScore: number,
  criteria: SearchCriteria
): string[] {
  const reasons: string[] = [];

  if (compatScore >= 80) {
    reasons.push('Excelente correspondência com seus critérios');
  } else if (compatScore >= 60) {
    reasons.push('Boa correspondência com suas preferências');
  }

  if (property.freguesia && property.concelho) {
    reasons.push(`Localizado em ${property.freguesia}, ${property.concelho}`);
  }

  if (criteria.price && property.price_main) {
    const { min, max } = criteria.price;
    if (min && max && property.price_main >= min && property.price_main <= max) {
      reasons.push('Preço dentro da faixa desejada');
    }
  }

  if (temporalScore >= 80) {
    reasons.push('Oportunidade urgente');
  }

  const daysOnMarket = property.first_seen
    ? Math.floor((Date.now() - new Date(property.first_seen).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysOnMarket < 7) {
    reasons.push('Novo no mercado');
  }

  if (property.availability_probability && property.availability_probability > 0.7) {
    reasons.push('Alta probabilidade de disponibilidade');
  }

  if (property.portal_count && property.portal_count > 3) {
    reasons.push(`Anunciado em ${property.portal_count} portais`);
  }

  return reasons.slice(0, 5);
}

/**
 * Score and rank properties
 */
export function scoreAndRankProperties(
  properties: PropertyData[],
  criteria: SearchCriteria
): ScoredProperty[] {
  const scored = properties.map((property) => {
    const compatibilityScore = calculateCompatibilityScore(property, criteria);
    const behaviorScore = 50; // Default neutral (no behavior data in Edge Function)
    const temporalScore = calculateTemporalScore(property);

    const finalScore =
      DEFAULT_WEIGHTS.compatibility * compatibilityScore +
      DEFAULT_WEIGHTS.behavior * behaviorScore +
      DEFAULT_WEIGHTS.temporal * temporalScore;

    const reasons = generateReasons(property, compatibilityScore, temporalScore, criteria);

    return {
      property,
      finalScore: Math.round(finalScore * 100) / 100,
      compatibilityScore,
      behaviorScore,
      temporalScore,
      reasons,
      rank: 0,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}
