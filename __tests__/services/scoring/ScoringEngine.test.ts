/**
 * Tests for ScoringEngine
 */

import { ScoringEngine } from '@/services/scoring/ScoringEngine';
import { SearchCriteria, UserBehavior, TemporalFactors } from '@/services/scoring/types';
import { PropertyEntity } from '@/types';

describe('ScoringEngine', () => {
  let engine: ScoringEngine;
  let mockProperty: PropertyEntity;
  let mockCriteria: SearchCriteria;

  beforeEach(() => {
    engine = new ScoringEngine();
    
    mockProperty = {
      id: 'prop-123',
      tenant_id: 'tenant-1',
      lat: 38.7223,
      lon: -9.1393,
      freguesia: 'Alameda',
      concelho: 'Lisboa',
      distrito: 'Lisboa',
      typology: 'T2',
      area_m2: 75,
      bedrooms: 2,
      bathrooms: 1,
      price_main: 250000,
      portal_count: 3,
      first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      availability_probability: 0.8,
    };

    mockCriteria = {
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
  });

  describe('calculateScore', () => {
    it('should calculate a valid score between 0 and 100', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.finalScore).toBeGreaterThanOrEqual(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
    });

    it('should return all score components', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.components).toBeDefined();
      expect(result.components.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.components.behaviorScore).toBeGreaterThanOrEqual(0);
      expect(result.components.temporalScore).toBeGreaterThanOrEqual(0);
    });

    it('should include property ID and calculation timestamp', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.propertyId).toBe('prop-123');
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    it('should include reasons for the score', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.reasons).toBeDefined();
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should apply correct default weights (0.4, 0.3, 0.3)', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.weights.compatibility).toBe(0.4);
      expect(result.weights.behavior).toBe(0.3);
      expect(result.weights.temporal).toBe(0.3);
    });
  });

  describe('Compatibility Score', () => {
    it('should score high for perfect location match', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.components.compatibilityScore).toBeGreaterThan(70);
    });

    it('should score high for perfect price match', () => {
      const criteria: SearchCriteria = {
        price: { min: 200000, max: 300000 },
      };
      
      const result = engine.calculateScore(mockProperty, criteria);
      expect(result.components.compatibilityScore).toBeGreaterThan(50);
    });

    it('should score high for exact type match', () => {
      const criteria: SearchCriteria = {
        type: 'T2',
      };
      
      const result = engine.calculateScore(mockProperty, criteria);
      expect(result.components.compatibilityScore).toBeGreaterThan(50);
    });

    it('should score lower for type mismatch', () => {
      const criteria: SearchCriteria = {
        type: 'T3',
      };
      
      const result = engine.calculateScore(mockProperty, criteria);
      expect(result.components.compatibilityScore).toBeLessThan(80);
    });

    it('should handle GPS distance calculation', () => {
      const criteria: SearchCriteria = {
        location: {
          lat: 38.7223,
          lon: -9.1393,
          radius: 5,
        },
      };
      
      const result = engine.calculateScore(mockProperty, criteria);
      expect(result.components.compatibilityScore).toBeGreaterThan(50);
    });
  });

  describe('Behavior Score', () => {
    it('should score 50 (neutral) when no behavior data provided', () => {
      const result = engine.calculateScore(mockProperty, mockCriteria);
      
      expect(result.components.behaviorScore).toBe(50);
    });

    it('should increase score with multiple views', () => {
      const behavior: UserBehavior = {
        propertyId: 'prop-123',
        views: 3,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, behavior);
      // 3 views = 30 points (10 points per view)
      expect(result.components.behaviorScore).toBeGreaterThanOrEqual(30);
      expect(result.components.behaviorScore).toBeLessThanOrEqual(50);
    });

    it('should increase score with long view time', () => {
      const behavior: UserBehavior = {
        propertyId: 'prop-123',
        totalViewTime: 300, // 5 minutes
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, behavior);
      // 300 seconds = 30 points
      expect(result.components.behaviorScore).toBeGreaterThanOrEqual(30);
      expect(result.components.behaviorScore).toBeLessThanOrEqual(50);
    });

    it('should increase score with interactions', () => {
      const behavior: UserBehavior = {
        propertyId: 'prop-123',
        interactions: {
          saved: true,
          contacted: true,
        },
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, behavior);
      // 2 interactions = 20 points (10 points each)
      expect(result.components.behaviorScore).toBeGreaterThanOrEqual(20);
      expect(result.components.behaviorScore).toBeLessThanOrEqual(50);
    });

    it('should boost score for recent views', () => {
      const recentBehavior: UserBehavior = {
        propertyId: 'prop-123',
        views: 2,
        lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };
      
      const oldBehavior: UserBehavior = {
        propertyId: 'prop-123',
        views: 2,
        lastViewedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      };
      
      const recentResult = engine.calculateScore(mockProperty, mockCriteria, recentBehavior);
      const oldResult = engine.calculateScore(mockProperty, mockCriteria, oldBehavior);
      
      expect(recentResult.components.behaviorScore).toBeGreaterThan(oldResult.components.behaviorScore);
    });
  });

  describe('Temporal Score', () => {
    it('should score high for new listings', () => {
      const temporal: TemporalFactors = {
        daysOnMarket: 3,
        isNewListing: true,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, undefined, temporal);
      expect(result.components.temporalScore).toBeGreaterThan(70);
    });

    it('should score lower for stale listings', () => {
      const temporal: TemporalFactors = {
        daysOnMarket: 120,
        isNewListing: false,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, undefined, temporal);
      // Stale listing (120 days) gets penalty but has availability boost
      expect(result.components.temporalScore).toBeLessThan(70);
    });

    it('should increase score with high availability probability', () => {
      const temporal: TemporalFactors = {
        availabilityProbability: 0.9,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, undefined, temporal);
      expect(result.components.temporalScore).toBeGreaterThan(50);
    });

    it('should increase score for recent price drops', () => {
      const temporal: TemporalFactors = {
        recentPriceDropPct: 10,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, undefined, temporal);
      expect(result.components.temporalScore).toBeGreaterThan(60);
    });

    it('should increase score with multiple price changes', () => {
      const temporal: TemporalFactors = {
        priceChanges: 3,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, undefined, temporal);
      expect(result.components.temporalScore).toBeGreaterThan(50);
    });
  });

  describe('Weight Management', () => {
    it('should allow updating weights', () => {
      const newWeights = {
        compatibility: 0.5,
        behavior: 0.3,
        temporal: 0.2,
      };
      
      engine.updateWeights(newWeights);
      
      const result = engine.calculateScore(mockProperty, mockCriteria);
      expect(result.weights).toEqual(newWeights);
    });

    it('should throw error if weights do not sum to 1.0', () => {
      const invalidWeights = {
        compatibility: 0.5,
        behavior: 0.3,
        temporal: 0.3, // Sum = 1.1
      };
      
      expect(() => engine.updateWeights(invalidWeights)).toThrow();
    });

    it('should return current weights', () => {
      const weights = engine.getWeights();
      
      expect(weights.compatibility).toBe(0.4);
      expect(weights.behavior).toBe(0.3);
      expect(weights.temporal).toBe(0.3);
    });
  });

  describe('Confidence Calculation', () => {
    it('should have higher confidence with complete data', () => {
      const completeBehavior: UserBehavior = {
        propertyId: 'prop-123',
        views: 3,
        totalViewTime: 300,
        interactions: { saved: true },
      };
      
      const completeTemporal: TemporalFactors = {
        daysOnMarket: 5,
        priceChanges: 1,
        isNewListing: true,
      };
      
      const result = engine.calculateScore(
        mockProperty,
        mockCriteria,
        completeBehavior,
        completeTemporal
      );
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence with incomplete data', () => {
      const incompleteProperty: PropertyEntity = {
        id: 'prop-456',
        tenant_id: 'tenant-1',
      };
      
      const result = engine.calculateScore(incompleteProperty, {});
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Final Score Formula', () => {
    it('should correctly apply weight formula', () => {
      const behavior: UserBehavior = {
        propertyId: 'prop-123',
        views: 3,
      };
      
      const result = engine.calculateScore(mockProperty, mockCriteria, behavior);
      
      const expectedScore =
        result.components.compatibilityScore * 0.4 +
        result.components.behaviorScore * 0.3 +
        result.components.temporalScore * 0.3;
      
      expect(Math.abs(result.finalScore - expectedScore)).toBeLessThan(0.1);
    });
  });
});
