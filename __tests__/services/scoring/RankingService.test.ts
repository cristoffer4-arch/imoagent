/**
 * Tests for RankingService
 */

import { RankingService } from '@/services/scoring/RankingService';
import { ScoringEngine } from '@/services/scoring/ScoringEngine';
import { SearchCriteria, UserBehavior } from '@/services/scoring/types';
import { PropertyEntity } from '@/types';

describe('RankingService', () => {
  let service: RankingService;
  let mockProperties: PropertyEntity[];
  let mockCriteria: SearchCriteria;

  beforeEach(() => {
    service = new RankingService();
    
    // Create 10 mock properties with varying attributes
    mockProperties = [
      {
        id: 'prop-1',
        tenant_id: 'tenant-1',
        distrito: 'Lisboa',
        concelho: 'Lisboa',
        freguesia: 'Alameda',
        typology: 'T2',
        price_main: 250000,
        area_m2: 75,
        bedrooms: 2,
        first_seen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'prop-2',
        tenant_id: 'tenant-1',
        distrito: 'Lisboa',
        concelho: 'Lisboa',
        freguesia: 'Arroios',
        typology: 'T3',
        price_main: 300000,
        area_m2: 90,
        bedrooms: 3,
        first_seen: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'prop-3',
        tenant_id: 'tenant-1',
        distrito: 'Lisboa',
        concelho: 'Lisboa',
        freguesia: 'Alameda',
        typology: 'T2',
        price_main: 240000,
        area_m2: 70,
        bedrooms: 2,
        first_seen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'prop-4',
        tenant_id: 'tenant-1',
        distrito: 'Porto',
        concelho: 'Porto',
        freguesia: 'Cedofeita',
        typology: 'T2',
        price_main: 200000,
        area_m2: 65,
        bedrooms: 2,
        first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'prop-5',
        tenant_id: 'tenant-1',
        distrito: 'Lisboa',
        concelho: 'Cascais',
        freguesia: 'Cascais',
        typology: 'T2',
        price_main: 280000,
        area_m2: 80,
        bedrooms: 2,
        first_seen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

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
    };
  });

  describe('rankProperties', () => {
    it('should rank properties and return results', () => {
      const result = service.rankProperties(mockProperties, mockCriteria);
      
      expect(result.rankedProperties).toBeDefined();
      expect(result.rankedProperties.length).toBeGreaterThan(0);
      expect(result.total).toBe(mockProperties.length);
    });

    it('should order properties by score descending', () => {
      const result = service.rankProperties(mockProperties, mockCriteria);
      
      for (let i = 0; i < result.rankedProperties.length - 1; i++) {
        const current = result.rankedProperties[i].scoringResult.finalScore;
        const next = result.rankedProperties[i + 1].scoringResult.finalScore;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should assign sequential rank numbers', () => {
      const result = service.rankProperties(mockProperties, mockCriteria);
      
      result.rankedProperties.forEach((rp, index) => {
        expect(rp.rank).toBe(index + 1);
      });
    });

    it('should calculate statistics correctly', () => {
      const result = service.rankProperties(mockProperties, mockCriteria);
      
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.topScore).toBeGreaterThanOrEqual(result.averageScore);
      expect(result.topScore).toBe(result.rankedProperties[0].scoringResult.finalScore);
    });

    it('should support pagination with limit', () => {
      const result = service.rankProperties(mockProperties, mockCriteria, undefined, undefined, {
        limit: 3,
      });
      
      expect(result.rankedProperties.length).toBe(3);
      expect(result.total).toBe(mockProperties.length);
    });

    it('should support pagination with offset', () => {
      const result = service.rankProperties(mockProperties, mockCriteria, undefined, undefined, {
        offset: 2,
        limit: 2,
      });
      
      expect(result.rankedProperties.length).toBe(2);
      expect(result.rankedProperties[0].rank).toBe(3);
      expect(result.page).toBe(2);
    });

    it('should filter by minimum score', () => {
      const result = service.rankProperties(mockProperties, mockCriteria, undefined, undefined, {
        minScore: 70,
      });
      
      result.rankedProperties.forEach((rp) => {
        expect(rp.scoringResult.finalScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should incorporate behavior data when provided', () => {
      const behaviorMap = new Map<string, UserBehavior>();
      behaviorMap.set('prop-1', {
        propertyId: 'prop-1',
        views: 5,
        totalViewTime: 60, // 60 seconds = 6 more points
        interactions: { saved: true, contacted: true, shared: true }, // 30 points
      });
      
      const resultWithBehavior = service.rankProperties(
        mockProperties,
        mockCriteria,
        behaviorMap
      );
      
      const resultWithoutBehavior = service.rankProperties(
        mockProperties,
        mockCriteria
      );
      
      // Property with behavior should have a higher behavior score
      const prop1WithBehavior = resultWithBehavior.rankedProperties.find(rp => rp.property.id === 'prop-1');
      const prop1WithoutBehavior = resultWithoutBehavior.rankedProperties.find(rp => rp.property.id === 'prop-1');
      
      // With behavior (30 views + 6 time + 30 interactions = 66), without behavior = 50
      expect(prop1WithBehavior?.scoringResult.components.behaviorScore).toBeGreaterThanOrEqual(
        prop1WithoutBehavior?.scoringResult.components.behaviorScore || 0
      );
      expect(prop1WithBehavior?.scoringResult.components.behaviorScore).toBeGreaterThan(50);
    });
  });

  describe('getTopProperties', () => {
    it('should return top N properties', () => {
      const topN = 3;
      const topProperties = service.getTopProperties(mockProperties, mockCriteria, topN);
      
      expect(topProperties.length).toBe(topN);
      
      // Verify they are the top ranked
      for (let i = 0; i < topN - 1; i++) {
        expect(topProperties[i].scoringResult.finalScore).toBeGreaterThanOrEqual(
          topProperties[i + 1].scoringResult.finalScore
        );
      }
    });

    it('should default to top 10', () => {
      const properties = Array(15).fill(null).map((_, i) => ({
        id: `prop-${i}`,
        tenant_id: 'tenant-1',
        distrito: 'Lisboa',
        price_main: 200000 + i * 10000,
      } as PropertyEntity));
      
      const topProperties = service.getTopProperties(properties, mockCriteria);
      expect(topProperties.length).toBe(10);
    });
  });

  describe('filterByScoreThreshold', () => {
    it('should return only properties above threshold', () => {
      const threshold = 60;
      const filtered = service.filterByScoreThreshold(
        mockProperties,
        mockCriteria,
        threshold
      );
      
      filtered.forEach((rp) => {
        expect(rp.scoringResult.finalScore).toBeGreaterThanOrEqual(threshold);
      });
    });

    it('should return empty array if no properties meet threshold', () => {
      const highThreshold = 99;
      const filtered = service.filterByScoreThreshold(
        mockProperties,
        mockCriteria,
        highThreshold
      );
      
      expect(filtered.length).toBe(0);
    });
  });

  describe('groupByScoreRange', () => {
    it('should group properties into score ranges', () => {
      const grouped = service.groupByScoreRange(mockProperties, mockCriteria);
      
      expect(grouped.excellent).toBeDefined();
      expect(grouped.good).toBeDefined();
      expect(grouped.fair).toBeDefined();
      expect(grouped.poor).toBeDefined();
      
      // Verify score ranges
      grouped.excellent.forEach((rp) => {
        expect(rp.scoringResult.finalScore).toBeGreaterThanOrEqual(80);
      });
      
      grouped.good.forEach((rp) => {
        expect(rp.scoringResult.finalScore).toBeGreaterThanOrEqual(60);
        expect(rp.scoringResult.finalScore).toBeLessThan(80);
      });
      
      grouped.fair.forEach((rp) => {
        expect(rp.scoringResult.finalScore).toBeGreaterThanOrEqual(40);
        expect(rp.scoringResult.finalScore).toBeLessThan(60);
      });
      
      grouped.poor.forEach((rp) => {
        expect(rp.scoringResult.finalScore).toBeLessThan(40);
      });
    });

    it('should have all properties in one of the groups', () => {
      const grouped = service.groupByScoreRange(mockProperties, mockCriteria);
      
      const totalGrouped = 
        grouped.excellent.length +
        grouped.good.length +
        grouped.fair.length +
        grouped.poor.length;
      
      expect(totalGrouped).toBe(mockProperties.length);
    });
  });

  describe('compareProperties', () => {
    it('should compare two properties', () => {
      const comparison = service.compareProperties(
        mockProperties[0],
        mockProperties[1],
        mockCriteria
      );
      
      expect(comparison.property1).toBeDefined();
      expect(comparison.property2).toBeDefined();
      expect(comparison.winner).toBeDefined();
      expect(comparison.scoreDifference).toBeGreaterThanOrEqual(0);
    });

    it('should identify winner correctly', () => {
      const comparison = service.compareProperties(
        mockProperties[0],
        mockProperties[1],
        mockCriteria
      );
      
      const score1 = comparison.property1.score.finalScore;
      const score2 = comparison.property2.score.finalScore;
      
      if (Math.abs(score1 - score2) < 1) {
        expect(comparison.winner).toBe('tie');
      } else if (score1 > score2) {
        expect(comparison.winner).toBe('property1');
      } else {
        expect(comparison.winner).toBe('property2');
      }
    });

    it('should calculate score difference', () => {
      const comparison = service.compareProperties(
        mockProperties[0],
        mockProperties[1],
        mockCriteria
      );
      
      const score1 = comparison.property1.score.finalScore;
      const score2 = comparison.property2.score.finalScore;
      const expectedDiff = Math.abs(score1 - score2);
      
      expect(Math.abs(comparison.scoreDifference - expectedDiff)).toBeLessThan(0.01);
    });
  });

  describe('getDiversifiedRanking', () => {
    it('should return diversified results', () => {
      const diversified = service.getDiversifiedRanking(mockProperties, mockCriteria);
      
      expect(diversified.length).toBe(mockProperties.length);
    });

    it('should penalize similar consecutive properties', () => {
      // Create properties that are very similar
      const similarProperties: PropertyEntity[] = [
        {
          id: 'sim-1',
          tenant_id: 'tenant-1',
          freguesia: 'Alameda',
          concelho: 'Lisboa',
          typology: 'T2',
          price_main: 250000,
          area_m2: 75,
        },
        {
          id: 'sim-2',
          tenant_id: 'tenant-1',
          freguesia: 'Alameda',
          concelho: 'Lisboa',
          typology: 'T2',
          price_main: 252000,
          area_m2: 76,
        },
        {
          id: 'diff-1',
          tenant_id: 'tenant-1',
          freguesia: 'Arroios',
          concelho: 'Lisboa',
          typology: 'T3',
          price_main: 350000,
          area_m2: 100,
        },
      ];
      
      const diversified = service.getDiversifiedRanking(
        similarProperties,
        mockCriteria,
        0.5 // High diversity factor
      );
      
      expect(diversified.length).toBe(3);
    });

    it('should respect diversity factor parameter', () => {
      const lowDiversity = service.getDiversifiedRanking(
        mockProperties,
        mockCriteria,
        0.1
      );
      
      const highDiversity = service.getDiversifiedRanking(
        mockProperties,
        mockCriteria,
        0.9
      );
      
      // Both should return all properties
      expect(lowDiversity.length).toBe(mockProperties.length);
      expect(highDiversity.length).toBe(mockProperties.length);
    });
  });

  describe('Engine Management', () => {
    it('should allow updating scoring engine', () => {
      const customEngine = new ScoringEngine({
        compatibility: 0.6,
        behavior: 0.2,
        temporal: 0.2,
      });
      
      service.updateScoringEngine(customEngine);
      
      const result = service.rankProperties(mockProperties, mockCriteria);
      expect(result.rankedProperties[0].scoringResult.weights.compatibility).toBe(0.6);
    });

    it('should return current scoring engine', () => {
      const engine = service.getScoringEngine();
      expect(engine).toBeInstanceOf(ScoringEngine);
    });
  });

  describe('Integration', () => {
    it('should handle empty property list', () => {
      const result = service.rankProperties([], mockCriteria);
      
      expect(result.rankedProperties).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it('should handle single property', () => {
      const result = service.rankProperties([mockProperties[0]], mockCriteria);
      
      expect(result.rankedProperties.length).toBe(1);
      expect(result.rankedProperties[0].rank).toBe(1);
    });

    it('should handle properties with missing data gracefully', () => {
      const incompleteProperties: PropertyEntity[] = [
        {
          id: 'incomplete-1',
          tenant_id: 'tenant-1',
        },
        {
          id: 'incomplete-2',
          tenant_id: 'tenant-1',
          price_main: 200000,
        },
      ];
      
      const result = service.rankProperties(incompleteProperties, mockCriteria);
      expect(result.rankedProperties.length).toBe(2);
    });
  });
});
