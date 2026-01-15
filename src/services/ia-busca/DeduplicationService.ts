/**
 * DeduplicationService - Detects duplicate properties across multiple portals
 * 
 * Uses multiple signals to identify duplicate listings:
 * - Location similarity (geohash, address matching)
 * - Price similarity (±10% threshold)
 * - Area similarity (±10% threshold)
 * - Image hashing (perceptual hashing if available)
 * 
 * Groups similar properties and identifies the most complete one as "primary"
 */

import { PropertyCanonicalModel, DataQuality } from '../../models/PropertyCanonicalModel';

/**
 * Group of duplicate properties
 */
export interface DuplicateGroup {
  primary: PropertyCanonicalModel;      // Most complete property
  duplicates: PropertyCanonicalModel[]; // Other instances
  confidence: number;                   // Confidence score (0-1)
  matchReasons: string[];               // Reasons for matching
  portalCount: number;                  // Number of unique portals
  portals: string[];                    // List of portal names
}

/**
 * Deduplication options
 */
export interface DeduplicationOptions {
  threshold?: number;                   // Similarity threshold (0-1, default: 0.85)
  priceTolerancePercent?: number;       // Price difference tolerance (default: 10)
  areaTolerancePercent?: number;        // Area difference tolerance (default: 10)
  enableImageHashing?: boolean;         // Enable image comparison (default: false)
  geohashPrecision?: number;            // Geohash precision for location (default: 7)
}

/**
 * Similarity score components
 */
interface SimilarityScore {
  location: number;     // 0-1
  price: number;        // 0-1
  area: number;         // 0-1
  images: number;       // 0-1
  characteristics: number; // 0-1
  overall: number;      // 0-1 (weighted average)
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<DeduplicationOptions> = {
  threshold: 0.85,
  priceTolerancePercent: 10,
  areaTolerancePercent: 10,
  enableImageHashing: false,
  geohashPrecision: 7,
};

/**
 * DeduplicationService
 */
export class DeduplicationService {
  private options: Required<DeduplicationOptions>;

  constructor(options?: DeduplicationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Finds duplicate groups in a list of properties
   * 
   * @param properties - List of properties to analyze
   * @returns Array of duplicate groups
   */
  findDuplicates(properties: PropertyCanonicalModel[]): DuplicateGroup[] {
    console.log(`[DeduplicationService] Analyzing ${properties.length} properties for duplicates`);

    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    // Sort by data quality (best first) to ensure primary is the most complete
    const sortedProperties = [...properties].sort((a, b) => {
      const qualityOrder = {
        [DataQuality.HIGH]: 4,
        [DataQuality.MEDIUM]: 3,
        [DataQuality.LOW]: 2,
        [DataQuality.INVALID]: 1,
      };
      return qualityOrder[b.metadata.dataQuality] - qualityOrder[a.metadata.dataQuality];
    });

    for (let i = 0; i < sortedProperties.length; i++) {
      if (processed.has(sortedProperties[i].id)) continue;

      const primary = sortedProperties[i];
      const duplicates: PropertyCanonicalModel[] = [];
      const matchReasons: string[] = [];
      const portals = new Set<string>();

      // Add primary portal
      primary.metadata.sources.forEach(source => portals.add(source.name));

      // Find duplicates
      for (let j = i + 1; j < sortedProperties.length; j++) {
        if (processed.has(sortedProperties[j].id)) continue;

        const candidate = sortedProperties[j];
        const similarity = this.calculateSimilarity(primary, candidate);

        if (similarity.overall >= this.options.threshold) {
          duplicates.push(candidate);
          processed.add(candidate.id);
          candidate.metadata.sources.forEach(source => portals.add(source.name));

          // Collect match reasons
          if (similarity.location > 0.9) matchReasons.push('Localização idêntica');
          if (similarity.price > 0.9) matchReasons.push('Preço similar');
          if (similarity.area > 0.9) matchReasons.push('Área similar');
          if (similarity.characteristics > 0.8) matchReasons.push('Características similares');
          if (similarity.images > 0.7) matchReasons.push('Imagens similares');
        }
      }

      // Only create group if we found duplicates
      if (duplicates.length > 0) {
        processed.add(primary.id);

        // Merge data from duplicates into primary
        const mergedPrimary = this.mergeDuplicates(primary, duplicates);

        groups.push({
          primary: mergedPrimary,
          duplicates,
          confidence: this.calculateGroupConfidence(duplicates),
          matchReasons: [...new Set(matchReasons)],
          portalCount: portals.size,
          portals: Array.from(portals),
        });
      }
    }

    console.log(`[DeduplicationService] Found ${groups.length} duplicate groups`);
    return groups;
  }

  /**
   * Checks if two properties are duplicates
   * 
   * @param prop1 - First property
   * @param prop2 - Second property
   * @param threshold - Custom similarity threshold (optional)
   * @returns True if properties are duplicates
   */
  isDuplicate(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel,
    threshold?: number
  ): boolean {
    const similarity = this.calculateSimilarity(prop1, prop2);
    const usedThreshold = threshold ?? this.options.threshold;
    return similarity.overall >= usedThreshold;
  }

  /**
   * Calculates similarity score between two properties
   */
  private calculateSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): SimilarityScore {
    const location = this.calculateLocationSimilarity(prop1, prop2);
    const price = this.calculatePriceSimilarity(prop1, prop2);
    const area = this.calculateAreaSimilarity(prop1, prop2);
    const images = this.options.enableImageHashing
      ? this.calculateImageSimilarity(prop1, prop2)
      : 0;
    const characteristics = this.calculateCharacteristicsSimilarity(prop1, prop2);

    // Weighted average (location and price are most important)
    const overall = (
      location * 0.35 +
      price * 0.30 +
      area * 0.15 +
      characteristics * 0.15 +
      images * 0.05
    );

    return { location, price, area, images, characteristics, overall };
  }

  /**
   * Calculates location similarity using geohash and address components
   */
  private calculateLocationSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): number {
    let score = 0;
    let weights = 0;

    // Geohash comparison (strongest signal)
    if (prop1.location.geohash && prop2.location.geohash) {
      const precision = Math.min(
        prop1.location.geohash.length,
        prop2.location.geohash.length,
        this.options.geohashPrecision
      );
      const hash1 = prop1.location.geohash.substring(0, precision);
      const hash2 = prop2.location.geohash.substring(0, precision);
      score += hash1 === hash2 ? 50 : 0;
      weights += 50;
    }

    // Coordinates comparison (if no geohash)
    if (!prop1.location.geohash || !prop2.location.geohash) {
      if (prop1.location.coordinates && prop2.location.coordinates) {
        const distance = this.calculateDistance(
          prop1.location.coordinates.latitude,
          prop1.location.coordinates.longitude,
          prop2.location.coordinates.latitude,
          prop2.location.coordinates.longitude
        );
        // Properties within 100m are considered same location
        score += distance <= 0.1 ? 40 : distance <= 0.5 ? 20 : 0;
        weights += 40;
      }
    }

    // Address components
    const addr1 = prop1.location.address;
    const addr2 = prop2.location.address;

    if (addr1.distrito === addr2.distrito) score += 5;
    weights += 5;

    if (addr1.concelho === addr2.concelho) score += 10;
    weights += 10;

    if (addr1.freguesia && addr2.freguesia && addr1.freguesia === addr2.freguesia) {
      score += 10;
    }
    weights += 10;

    if (addr1.postalCode && addr2.postalCode && addr1.postalCode === addr2.postalCode) {
      score += 15;
    }
    weights += 15;

    if (addr1.street && addr2.street && this.normalizeString(addr1.street) === this.normalizeString(addr2.street)) {
      score += 15;
    }
    weights += 15;

    if (addr1.number && addr2.number && addr1.number === addr2.number) {
      score += 5;
    }
    weights += 5;

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Calculates price similarity with tolerance
   */
  private calculatePriceSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): number {
    const price1 = prop1.price.value;
    const price2 = prop2.price.value;

    if (price1 === 0 || price2 === 0) return 0;

    const difference = Math.abs(price1 - price2);
    const average = (price1 + price2) / 2;
    const percentDifference = (difference / average) * 100;

    if (percentDifference === 0) return 1;
    if (percentDifference <= this.options.priceTolerancePercent) {
      return 1 - (percentDifference / this.options.priceTolerancePercent);
    }
    return 0;
  }

  /**
   * Calculates area similarity with tolerance
   */
  private calculateAreaSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): number {
    const area1 = prop1.characteristics.totalArea || prop1.characteristics.usefulArea || 0;
    const area2 = prop2.characteristics.totalArea || prop2.characteristics.usefulArea || 0;

    if (area1 === 0 || area2 === 0) return 0;

    const difference = Math.abs(area1 - area2);
    const average = (area1 + area2) / 2;
    const percentDifference = (difference / average) * 100;

    if (percentDifference === 0) return 1;
    if (percentDifference <= this.options.areaTolerancePercent) {
      return 1 - (percentDifference / this.options.areaTolerancePercent);
    }
    return 0;
  }

  /**
   * Calculates characteristics similarity
   */
  private calculateCharacteristicsSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): number {
    let matches = 0;
    let total = 0;

    // Compare basic characteristics
    const comparisons = [
      { val1: prop1.type, val2: prop2.type, weight: 3 },
      { val1: prop1.characteristics.bedrooms, val2: prop2.characteristics.bedrooms, weight: 2 },
      { val1: prop1.characteristics.bathrooms, val2: prop2.characteristics.bathrooms, weight: 1 },
      { val1: prop1.characteristics.floor, val2: prop2.characteristics.floor, weight: 1 },
      { val1: prop1.characteristics.typology, val2: prop2.characteristics.typology, weight: 2 },
      { val1: prop1.price.transactionType, val2: prop2.price.transactionType, weight: 3 },
    ];

    for (const comp of comparisons) {
      if (comp.val1 !== undefined && comp.val2 !== undefined) {
        total += comp.weight;
        if (comp.val1 === comp.val2) {
          matches += comp.weight;
        }
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Calculates image similarity using perceptual hashing
   */
  private calculateImageSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): number {
    const images1 = prop1.images || [];
    const images2 = prop2.images || [];

    if (images1.length === 0 || images2.length === 0) return 0;

    let matchCount = 0;

    // Compare image hashes if available
    for (const img1 of images1) {
      if (!img1.hash) continue;
      for (const img2 of images2) {
        if (!img2.hash) continue;
        // Simple hash comparison (in production, use perceptual hash distance)
        if (img1.hash === img2.hash) {
          matchCount++;
          break;
        }
      }
    }

    const maxImages = Math.max(images1.length, images2.length);
    return matchCount / maxImages;
  }

  /**
   * Merges duplicate properties into primary, enriching its data
   */
  private mergeDuplicates(
    primary: PropertyCanonicalModel,
    duplicates: PropertyCanonicalModel[]
  ): PropertyCanonicalModel {
    const merged = primary;

    for (const duplicate of duplicates) {
      // Merge data using PropertyCanonicalModel's merge method
      merged.merge(duplicate);
    }

    // Update metadata
    merged.metadata.portalCount = merged.metadata.sources.length;
    merged.metadata.lastUpdated = new Date();

    return merged;
  }

  /**
   * Calculates confidence score for a duplicate group
   */
  private calculateGroupConfidence(duplicates: PropertyCanonicalModel[]): number {
    // More duplicates = higher confidence
    const countFactor = Math.min(duplicates.length / 5, 1) * 0.5;

    // More portals = higher confidence
    const portals = new Set<string>();
    duplicates.forEach(dup => {
      dup.metadata.sources.forEach(source => portals.add(source.name));
    });
    const portalFactor = Math.min(portals.size / 4, 1) * 0.5;

    return countFactor + portalFactor;
  }

  /**
   * Calculates distance between two coordinates in kilometers
   * Uses Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Converts degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Normalizes string for comparison (removes accents, lowercase, trim)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Generates a simple hash for a string (for image URL comparison)
   */
  private simpleHash(str: string): string {
    // Simple hash implementation for browser/Node compatibility
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}

/**
 * Factory function to create DeduplicationService instance
 */
export function createDeduplicationService(options?: DeduplicationOptions): DeduplicationService {
  return new DeduplicationService(options);
}
