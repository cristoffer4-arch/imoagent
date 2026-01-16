/**
 * ScoringService Test Suite
 * 
 * Tests for intelligent property scoring system
 * Covers: compatibility, behavior, temporal scoring, caching, edge cases
 */

import { ScoringService } from '../src/services/ScoringService';
import type { PropertyCanonicalModel, ScoringContext, PropertyScore } from '../src/types';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('calculateScore - ANGARIACAO mode', () => {
    it('should calculate score for angariação mode with all components', () => {
      const property: PropertyCanonicalModel = {
        id: 'prop-1',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        bedrooms: 2,
        location: {
          distrito: 'Lisboa',
          concelho: 'Lisboa',
          freguesia: 'Estrela',
          coordinates: { lat: 38.7167, lon: -9.1333 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/prop-1'
      };

      const context: ScoringContext = {
        mode: 'ANGARIACAO',
        userPreferences: {
          propertyTypes: ['apartamento', 'moradia'],
          locations: ['Lisboa'],
          priceRange: { min: 200000, max: 300000 },
          areaRange: { min: 70, max: 100 }
        }
      };

      const score = service.calculateScore(property, context);

      expect(score.finalScore).toBeGreaterThanOrEqual(0);
      expect(score.finalScore).toBeLessThanOrEqual(100);
      expect(score.components.compatibility).toBeDefined();
      expect(score.components.behavior).toBeDefined();
      expect(score.components.temporal).toBeDefined();
      expect(score.confidence).toBeGreaterThan(0);
      expect(score.topReasons).toHaveLength(3);
    });

    it('should prioritize recent listings in angariação mode', () => {
      const recentProperty: PropertyCanonicalModel = {
        id: 'recent',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/recent'
      };

      const oldProperty: PropertyCanonicalModel = {
        ...recentProperty,
        id: 'old',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        url: 'https://example.com/old'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };

      const recentScore = service.calculateScore(recentProperty, context);
      const oldScore = service.calculateScore(oldProperty, context);

      expect(recentScore.components.temporal).toBeGreaterThan(oldScore.components.temporal);
      expect(recentScore.finalScore).toBeGreaterThan(oldScore.finalScore);
    });

    it('should reward underpriced properties in angariação mode', () => {
      const underpricedProperty: PropertyCanonicalModel = {
        id: 'underpriced',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 180000,
        area: 90,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/underpriced',
        pricePerSqm: 2000 // Below market average
      };

      const context: ScoringContext = {
        mode: 'ANGARIACAO',
        marketData: {
          averagePricePerSqm: 3000,
          medianPrice: 250000
        }
      };

      const score = service.calculateScore(underpricedProperty, context);

      expect(score.components.behavior).toBeGreaterThan(60);
      expect(score.topReasons).toContain('Preço abaixo do mercado');
    });
  });

  describe('calculateScore - VENDA mode', () => {
    it('should calculate score for venda mode with lead matching', () => {
      const property: PropertyCanonicalModel = {
        id: 'prop-2',
        source: 'crm',
        type: 'moradia',
        operation: 'venda',
        price: 450000,
        area: 150,
        bedrooms: 4,
        location: {
          distrito: 'Porto',
          concelho: 'Porto',
          freguesia: 'Cedofeita',
          coordinates: { lat: 41.1579, lon: -8.6291 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/prop-2'
      };

      const context: ScoringContext = {
        mode: 'VENDA',
        leadProfile: {
          type: 'moradia',
          location: 'Porto',
          priceRange: { min: 400000, max: 500000 },
          areaRange: { min: 140, max: 180 },
          bedrooms: 4,
          urgency: 'high'
        }
      };

      const score = service.calculateScore(property, context);

      expect(score.finalScore).toBeGreaterThanOrEqual(70);
      expect(score.components.compatibility).toBeGreaterThan(80);
      expect(score.topReasons).toContain('Tipo compatível com lead');
    });

    it('should prioritize urgency in venda mode', () => {
      const property: PropertyCanonicalModel = {
        id: 'urgent',
        source: 'crm',
        type: 'apartamento',
        operation: 'venda',
        price: 300000,
        area: 90,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/urgent'
      };

      const urgentContext: ScoringContext = {
        mode: 'VENDA',
        leadProfile: { urgency: 'high' }
      };

      const normalContext: ScoringContext = {
        mode: 'VENDA',
        leadProfile: { urgency: 'low' }
      };

      const urgentScore = service.calculateScore(property, urgentContext);
      const normalScore = service.calculateScore(property, normalContext);

      expect(urgentScore.components.temporal).toBeGreaterThan(normalScore.components.temporal);
    });

    it('should penalize price mismatches in venda mode', () => {
      const property: PropertyCanonicalModel = {
        id: 'expensive',
        source: 'crm',
        type: 'apartamento',
        operation: 'venda',
        price: 600000,
        area: 90,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/expensive'
      };

      const context: ScoringContext = {
        mode: 'VENDA',
        leadProfile: {
          priceRange: { min: 200000, max: 350000 }
        }
      };

      const score = service.calculateScore(property, context);

      expect(score.components.compatibility).toBeLessThan(50);
      expect(score.finalScore).toBeLessThan(60);
    });
  });

  describe('calculateCompatibilityScore', () => {
    it('should score type match correctly', () => {
      const property: PropertyCanonicalModel = {
        id: 'type-match',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/type-match'
      };

      const matchContext: ScoringContext = {
        mode: 'VENDA',
        leadProfile: { type: 'apartamento' }
      };

      const mismatchContext: ScoringContext = {
        mode: 'VENDA',
        leadProfile: { type: 'moradia' }
      };

      const matchScore = service.calculateScore(property, matchContext);
      const mismatchScore = service.calculateScore(property, mismatchContext);

      expect(matchScore.components.compatibility).toBeGreaterThan(mismatchScore.components.compatibility);
    });

    it('should score location match correctly', () => {
      const property: PropertyCanonicalModel = {
        id: 'location-match',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: {
          distrito: 'Lisboa',
          concelho: 'Cascais',
          freguesia: 'Estoril'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/location-match'
      };

      const context: ScoringContext = {
        mode: 'VENDA',
        leadProfile: { location: 'Cascais' }
      };

      const score = service.calculateScore(property, context);

      expect(score.components.compatibility).toBeGreaterThan(70);
      expect(score.topReasons).toContain('Localização preferida');
    });

    it('should score price range match correctly', () => {
      const property: PropertyCanonicalModel = {
        id: 'price-match',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 275000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/price-match'
      };

      const context: ScoringContext = {
        mode: 'VENDA',
        leadProfile: {
          priceRange: { min: 250000, max: 300000 }
        }
      };

      const score = service.calculateScore(property, context);

      expect(score.components.compatibility).toBeGreaterThan(70);
    });

    it('should score area range match correctly', () => {
      const property: PropertyCanonicalModel = {
        id: 'area-match',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 90,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/area-match'
      };

      const context: ScoringContext = {
        mode: 'VENDA',
        leadProfile: {
          areaRange: { min: 80, max: 100 }
        }
      };

      const score = service.calculateScore(property, context);

      expect(score.components.compatibility).toBeGreaterThan(70);
    });

    it('should score bedroom match correctly', () => {
      const property: PropertyCanonicalModel = {
        id: 'bedroom-match',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        bedrooms: 3,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/bedroom-match'
      };

      const context: ScoringContext = {
        mode: 'VENDA',
        leadProfile: { bedrooms: 3 }
      };

      const score = service.calculateScore(property, context);

      expect(score.components.compatibility).toBeGreaterThan(70);
    });
  });

  describe('calculateBehaviorScore', () => {
    it('should reward high view counts', () => {
      const popularProperty: PropertyCanonicalModel = {
        id: 'popular',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/popular',
        metadata: { views: 500 }
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(popularProperty, context);

      expect(score.components.behavior).toBeGreaterThan(60);
    });

    it('should reward complete property data', () => {
      const completeProperty: PropertyCanonicalModel = {
        id: 'complete',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        condition: 'new',
        energyCertificate: 'A',
        features: ['garagem', 'elevador', 'varanda'],
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        description: 'Apartamento T2 moderno com excelente localização',
        location: {
          distrito: 'Lisboa',
          concelho: 'Lisboa',
          freguesia: 'Estrela',
          coordinates: { lat: 38.7167, lon: -9.1333 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/complete'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(completeProperty, context);

      expect(score.components.behavior).toBeGreaterThan(70);
      expect(score.confidence).toBeGreaterThan(0.8);
    });

    it('should penalize incomplete property data', () => {
      const incompleteProperty: PropertyCanonicalModel = {
        id: 'incomplete',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/incomplete'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(incompleteProperty, context);

      expect(score.confidence).toBeLessThan(0.7);
    });
  });

  describe('calculateTemporalScore', () => {
    it('should score recent properties higher', () => {
      const recentProperty: PropertyCanonicalModel = {
        id: 'recent',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/recent'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(recentProperty, context);

      expect(score.components.temporal).toBeGreaterThan(85);
    });

    it('should penalize old properties', () => {
      const oldProperty: PropertyCanonicalModel = {
        id: 'old',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/old'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(oldProperty, context);

      expect(score.components.temporal).toBeLessThan(40);
    });

    it('should consider seasonal factors', () => {
      const property: PropertyCanonicalModel = {
        id: 'seasonal',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Faro', concelho: 'Albufeira' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/seasonal'
      };

      const context: ScoringContext = {
        mode: 'ANGARIACAO',
        seasonalFactors: { summer: 1.2 }
      };

      const score = service.calculateScore(property, context);

      expect(score.components.temporal).toBeGreaterThan(60);
    });
  });

  describe('batchScore', () => {
    it('should score multiple properties efficiently', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'batch-1',
          source: 'casafari',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://example.com/batch-1'
        },
        {
          id: 'batch-2',
          source: 'casafari',
          type: 'moradia',
          operation: 'venda',
          price: 450000,
          area: 150,
          location: { distrito: 'Porto', concelho: 'Porto' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://example.com/batch-2'
        }
      ];

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const scores = service.batchScore(properties, context);

      expect(scores).toHaveLength(2);
      expect(scores[0].propertyId).toBe('batch-1');
      expect(scores[1].propertyId).toBe('batch-2');
      scores.forEach(score => {
        expect(score.finalScore).toBeGreaterThanOrEqual(0);
        expect(score.finalScore).toBeLessThanOrEqual(100);
      });
    });

    it('should handle empty batch', () => {
      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const scores = service.batchScore([], context);

      expect(scores).toHaveLength(0);
    });
  });

  describe('cache functionality', () => {
    it('should cache scoring results', () => {
      const property: PropertyCanonicalModel = {
        id: 'cached',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/cached'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };

      const score1 = service.calculateScore(property, context);
      const score2 = service.calculateScore(property, context);

      expect(score1).toEqual(score2);
    });

    it('should clear cache when requested', () => {
      const property: PropertyCanonicalModel = {
        id: 'cache-clear',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/cache-clear'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };

      service.calculateScore(property, context);
      service.clearCache();
      
      // After cache clear, should recalculate
      const score = service.calculateScore(property, context);
      expect(score).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing price data', () => {
      const property: PropertyCanonicalModel = {
        id: 'no-price',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 0,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/no-price'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(property, context);

      expect(score.finalScore).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThan(0.5);
    });

    it('should handle missing location data', () => {
      const property: PropertyCanonicalModel = {
        id: 'no-location',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/no-location'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(property, context);

      expect(score.finalScore).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThan(0.6);
    });

    it('should handle invalid date formats', () => {
      const property: PropertyCanonicalModel = {
        id: 'invalid-date',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
        url: 'https://example.com/invalid-date'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      
      expect(() => service.calculateScore(property, context)).not.toThrow();
    });

    it('should handle null context gracefully', () => {
      const property: PropertyCanonicalModel = {
        id: 'null-context',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/null-context'
      };

      const score = service.calculateScore(property, {} as ScoringContext);

      expect(score.finalScore).toBeGreaterThanOrEqual(0);
      expect(score.finalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('score components validation', () => {
    it('should ensure all component scores are within 0-100', () => {
      const property: PropertyCanonicalModel = {
        id: 'components',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/components'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(property, context);

      expect(score.components.compatibility).toBeGreaterThanOrEqual(0);
      expect(score.components.compatibility).toBeLessThanOrEqual(100);
      expect(score.components.behavior).toBeGreaterThanOrEqual(0);
      expect(score.components.behavior).toBeLessThanOrEqual(100);
      expect(score.components.temporal).toBeGreaterThanOrEqual(0);
      expect(score.components.temporal).toBeLessThanOrEqual(100);
    });

    it('should ensure final score is weighted average of components', () => {
      const property: PropertyCanonicalModel = {
        id: 'weighted',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/weighted'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(property, context);

      const expectedScore = 
        score.components.compatibility * 0.4 +
        score.components.behavior * 0.3 +
        score.components.temporal * 0.3;

      expect(Math.abs(score.finalScore - expectedScore)).toBeLessThan(1);
    });
  });

  describe('top reasons extraction', () => {
    it('should always return 3 top reasons', () => {
      const property: PropertyCanonicalModel = {
        id: 'reasons',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/reasons'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      const score = service.calculateScore(property, context);

      expect(score.topReasons).toHaveLength(3);
      score.topReasons.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
      });
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on data completeness', () => {
      const completeProperty: PropertyCanonicalModel = {
        id: 'complete-confidence',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        bedrooms: 2,
        bathrooms: 2,
        floor: 3,
        condition: 'new',
        energyCertificate: 'A',
        features: ['garagem', 'elevador'],
        images: ['img1.jpg', 'img2.jpg'],
        description: 'Description',
        location: {
          distrito: 'Lisboa',
          concelho: 'Lisboa',
          freguesia: 'Estrela',
          coordinates: { lat: 38.7167, lon: -9.1333 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/complete-confidence'
      };

      const incompleteProperty: PropertyCanonicalModel = {
        id: 'incomplete-confidence',
        source: 'casafari',
        type: 'apartamento',
        operation: 'venda',
        price: 250000,
        area: 85,
        location: { distrito: 'Lisboa', concelho: 'Lisboa' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://example.com/incomplete-confidence'
      };

      const context: ScoringContext = { mode: 'ANGARIACAO' };
      
      const completeScore = service.calculateScore(completeProperty, context);
      const incompleteScore = service.calculateScore(incompleteProperty, context);

      expect(completeScore.confidence).toBeGreaterThan(incompleteScore.confidence);
      expect(completeScore.confidence).toBeGreaterThan(0.7);
      expect(incompleteScore.confidence).toBeLessThan(0.7);
    });
  });
});
