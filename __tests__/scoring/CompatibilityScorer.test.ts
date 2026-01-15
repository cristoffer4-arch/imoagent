/**
 * CompatibilityScorer.test.ts - Testes para o scorer de compatibilidade
 */

import { CompatibilityScorer } from '../../src/services/scoring/CompatibilityScorer';
import {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  DataQuality,
} from '../../src/models/PropertyCanonicalModel';
import { UserPreferences } from '../../src/types/scoring';

describe('CompatibilityScorer', () => {
  let scorer: CompatibilityScorer;

  beforeEach(() => {
    scorer = new CompatibilityScorer();
  });

  describe('Location Score', () => {
    it('should give high score for preferred concelho', () => {
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
          preferredDistritos: ['Lisboa'],
        },
      };

      const score = scorer.calculate(property, preferences);

      expect(score.breakdown.location).toBeGreaterThan(20);
      expect(score.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('Price Score', () => {
    it('should give high score for price within range', () => {
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
        price: {
          min: 200000,
          max: 300000,
        },
      };

      const score = scorer.calculate(property, preferences);

      expect(score.breakdown.price).toBe(25);
    });
  });

  describe('Type Score', () => {
    it('should give maximum score for matching type', () => {
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
        propertyTypes: [PropertyType.APARTMENT],
      };

      const score = scorer.calculate(property, preferences);

      expect(score.breakdown.type).toBe(15);
    });
  });

  describe('Total Score', () => {
    it('should calculate total score correctly', () => {
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
          dataQuality: DataQuality.MEDIUM,
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

      const score = scorer.calculate(property, preferences);

      expect(score.total).toBeGreaterThan(50);
      expect(score.total).toBeLessThanOrEqual(100);
    });
  });
});
