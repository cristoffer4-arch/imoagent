/**
 * ScoringEngine.test.ts - Testes para o motor central de scoring
 */

import { ScoringEngine } from '../src/services/scoring/ScoringEngine';
import {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  DataQuality,
} from '../src/models/PropertyCanonicalModel';
import { UserPreferences, UserBehavior } from '../src/types/scoring';

describe('ScoringEngine', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine();
  });

  describe('Default Configuration', () => {
    it('should have default weights', () => {
      const weights = engine.getDefaultWeights();

      expect(weights.compatibility).toBe(0.4);
      expect(weights.behavior).toBe(0.3);
      expect(weights.temporal).toBe(0.3);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate complete score for property', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
          address: {
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
        },
        price: {
          value: 250000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {
          bedrooms: 3,
          bathrooms: 2,
          totalArea: 120,
        },
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.HIGH,
          portalCount: 3,
        },
      });

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        location: {
          preferredConcelhos: ['Lisboa'],
        },
        price: {
          min: 200000,
          max: 300000,
        },
        propertyTypes: [PropertyType.APARTMENT],
      };

      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: property.id,
        viewCount: 2,
        totalViewTimeSeconds: 180,
        averageViewTimeSeconds: 90,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actions: {
          saved: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = engine.calculateScore(property, preferences, behavior);

      expect(score.finalScore).toBeGreaterThan(0);
      expect(score.finalScore).toBeLessThanOrEqual(100);
      expect(score.propertyId).toBe(property.id);
      expect(score.userId).toBe(preferences.userId);
      expect(score.compatibility.total).toBeGreaterThan(0);
      expect(score.behavior.total).toBeGreaterThan(0);
      expect(score.temporal.total).toBeGreaterThan(0);
      expect(score.topReasons.length).toBeGreaterThan(0);
    });

    it('should calculate score without behavior data', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
          address: {
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
        },
        price: {
          value: 250000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {},
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
      });

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        location: {
          preferredConcelhos: ['Lisboa'],
        },
      };

      const score = engine.calculateScore(property, preferences);

      expect(score.finalScore).toBeGreaterThan(0);
      expect(score.behavior.total).toBe(50); // Neutral score
    });
  });

  describe('Custom Weights', () => {
    it('should apply custom weights', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
          address: {
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
        },
        price: {
          value: 250000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {},
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
      });

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
      };

      const customWeights = {
        compatibility: 0.5,
        behavior: 0.2,
        temporal: 0.3,
      };

      const score = engine.calculateScore(property, preferences, undefined, customWeights);

      expect(score.weights.compatibility).toBeCloseTo(0.5, 1);
      expect(score.weights.behavior).toBeCloseTo(0.2, 1);
      expect(score.weights.temporal).toBeCloseTo(0.3, 1);
    });
  });

  describe('Quick Score', () => {
    it('should calculate quick score without behavior', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
          address: {
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
        },
        price: {
          value: 250000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {},
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
      });

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        location: {
          preferredConcelhos: ['Lisboa'],
        },
      };

      const score = engine.calculateQuickScore(property, preferences);

      expect(score.finalScore).toBeGreaterThan(0);
      expect(score.weights.behavior).toBe(0);
      expect(score.weights.compatibility + score.weights.temporal).toBeCloseTo(1.0, 2);
    });
  });

  describe('Batch Scoring', () => {
    it('should calculate scores for multiple properties', async () => {
      const properties = [
        new PropertyCanonicalModel({
          tenantId: 'tenant-123',
          type: PropertyType.APARTMENT,
          location: {
            address: {
              concelho: 'Lisboa',
              distrito: 'Lisboa',
              country: 'Portugal',
            },
          },
          price: {
            value: 250000,
            currency: 'EUR',
            transactionType: TransactionType.SALE,
          },
          characteristics: {},
          metadata: {
            sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
            firstSeen: new Date(),
            lastSeen: new Date(),
            lastUpdated: new Date(),
            dataQuality: DataQuality.MEDIUM,
          },
        }),
        new PropertyCanonicalModel({
          tenantId: 'tenant-123',
          type: PropertyType.HOUSE,
          location: {
            address: {
              concelho: 'Porto',
              distrito: 'Porto',
              country: 'Portugal',
            },
          },
          price: {
            value: 350000,
            currency: 'EUR',
            transactionType: TransactionType.SALE,
          },
          characteristics: {},
          metadata: {
            sources: [{ type: 'PORTAL', name: 'Imovirtual', id: '456' }],
            firstSeen: new Date(),
            lastSeen: new Date(),
            lastUpdated: new Date(),
            dataQuality: DataQuality.MEDIUM,
          },
        }),
      ];

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        location: {
          preferredConcelhos: ['Lisboa'],
        },
      };

      const scores = await engine.calculateBatchScores(properties, preferences);

      expect(scores).toHaveLength(2);
      expect(scores[0].finalScore).toBeGreaterThan(0);
      expect(scores[1].finalScore).toBeGreaterThan(0);
    });
  });

  describe('Score Explanation', () => {
    it('should generate detailed explanation', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
          address: {
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
        },
        price: {
          value: 250000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {},
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
      });

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
      };

      const score = engine.calculateScore(property, preferences);
      const explanation = engine.explainScore(score);

      expect(explanation).toContain('Score Final');
      expect(explanation).toContain('Compatibilidade');
      expect(explanation).toContain('Comportamento');
      expect(explanation).toContain('Temporal');
      expect(explanation).toContain('Principais Razões');
    });
  });

  describe('Weight Updates', () => {
    it('should update default weights', () => {
      const newWeights = {
        compatibility: 0.5,
        behavior: 0.25,
        temporal: 0.25,
      };

      engine.updateDefaultWeights(newWeights);
      const updatedWeights = engine.getDefaultWeights();

      expect(updatedWeights.compatibility).toBeCloseTo(0.5, 1);
      expect(updatedWeights.behavior).toBeCloseTo(0.25, 1);
      expect(updatedWeights.temporal).toBeCloseTo(0.25, 1);
    });

    it('should normalize weights after update', () => {
      const newWeights = {
        compatibility: 0.6,
        behavior: 0.3,
        temporal: 0.3,
      };

      engine.updateDefaultWeights(newWeights);
      const updatedWeights = engine.getDefaultWeights();

      const total =
        updatedWeights.compatibility +
        updatedWeights.behavior +
        updatedWeights.temporal;

      expect(total).toBeCloseTo(1.0, 2);
    });
  });
});
