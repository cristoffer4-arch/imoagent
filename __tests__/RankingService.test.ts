/**
 * RankingService.test.ts - Testes para o serviço de ranking
 */

import { RankingService } from '../src/services/scoring/RankingService';
import {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  DataQuality,
} from '../src/models/PropertyCanonicalModel';
import { UserPreferences, UserBehavior } from '../src/types/scoring';

describe('RankingService', () => {
  let service: RankingService;

  beforeEach(() => {
    service = new RankingService();
  });

  describe('Basic Ranking', () => {
    it('should rank properties by score', async () => {
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
            dataQuality: DataQuality.HIGH,
          },
        }),
        new PropertyCanonicalModel({
          tenantId: 'tenant-123',
          type: PropertyType.APARTMENT,
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

      const result = await service.rankProperties(properties, preferences);

      expect(result.properties).toHaveLength(2);
      expect(result.properties[0].rank).toBe(1);
      expect(result.properties[1].rank).toBe(2);
      expect(result.properties[0].score.finalScore).toBeGreaterThanOrEqual(
        result.properties[1].score.finalScore
      );
      expect(result.metadata.totalProperties).toBe(2);
    });

    it('should rank with behavior data', async () => {
      const properties = [
        new PropertyCanonicalModel({
          id: 'prop-1',
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
          id: 'prop-2',
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
            value: 300000,
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

      const behaviors = new Map<string, UserBehavior>();
      behaviors.set('prop-2', {
        userId: 'user-123',
        propertyId: 'prop-2',
        viewCount: 5,
        totalViewTimeSeconds: 600,
        averageViewTimeSeconds: 120,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actions: {
          saved: true,
          contacted: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.rankProperties(properties, preferences, behaviors);

      expect(result.properties).toHaveLength(2);
      // Property with behavior should rank higher
      expect(result.properties[0].property.id).toBe('prop-2');
    });
  });

  describe('Ranking Options', () => {
    it('should filter by minimum score', async () => {
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
          type: PropertyType.APARTMENT,
          location: {
            address: {
              concelho: 'Porto',
              distrito: 'Porto',
              country: 'Portugal',
            },
          },
          price: {
            value: 900000,
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
        price: {
          max: 300000,
        },
      };

      const result = await service.rankProperties(properties, preferences, undefined, {
        minScore: 50,
      });

      expect(result.properties.length).toBeLessThanOrEqual(2);
      result.properties.forEach(sp => {
        expect(sp.score.finalScore).toBeGreaterThanOrEqual(50);
      });
    });

    it('should limit results', async () => {
      const properties = Array.from({ length: 10 }, (_, i) =>
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
            value: 200000 + i * 10000,
            currency: 'EUR',
            transactionType: TransactionType.SALE,
          },
          characteristics: {},
          metadata: {
            sources: [{ type: 'PORTAL', name: 'Idealista', id: `${i}` }],
            firstSeen: new Date(),
            lastSeen: new Date(),
            lastUpdated: new Date(),
            dataQuality: DataQuality.MEDIUM,
          },
        })
      );

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
      };

      const result = await service.rankProperties(properties, preferences, undefined, {
        maxResults: 5,
      });

      expect(result.properties).toHaveLength(5);
    });

    it('should sort by price', async () => {
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
            value: 300000,
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
          type: PropertyType.APARTMENT,
          location: {
            address: {
              concelho: 'Lisboa',
              distrito: 'Lisboa',
              country: 'Portugal',
            },
          },
          price: {
            value: 200000,
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
      };

      const result = await service.rankProperties(properties, preferences, undefined, {
        sortBy: 'price',
        sortDirection: 'asc',
      });

      expect(result.properties[0].property.price.value).toBeLessThan(
        result.properties[1].property.price.value
      );
    });
  });

  describe('Quick Rank', () => {
    it('should rank without behavior data', async () => {
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
      ];

      const preferences: UserPreferences = {
        userId: 'user-123',
        tenantId: 'tenant-123',
      };

      const result = await service.quickRank(properties, preferences);

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].rank).toBe(1);
      expect(result.properties[0].score.weights.behavior).toBe(0);
    });
  });

  describe('Metadata', () => {
    it('should calculate metadata correctly', async () => {
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
          type: PropertyType.APARTMENT,
          location: {
            address: {
              concelho: 'Lisboa',
              distrito: 'Lisboa',
              country: 'Portugal',
            },
          },
          price: {
            value: 300000,
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
      };

      const result = await service.rankProperties(properties, preferences);

      expect(result.metadata.totalProperties).toBe(2);
      expect(result.metadata.averageScore).toBeGreaterThan(0);
      expect(result.metadata.topScore).toBeGreaterThanOrEqual(
        result.metadata.bottomScore
      );
      expect(result.metadata.userId).toBe('user-123');
      expect(result.metadata.calculatedAt).toBeInstanceOf(Date);
    });
  });
});
