/**
 * DeduplicationService Test Suite
 * 
 * Tests for intelligent property deduplication
 * Covers: location matching, price/area similarity, multi-signal detection, grouping
 */

import { DeduplicationService } from '../src/services/DeduplicationService';
import type { PropertyCanonicalModel, DuplicateGroup } from '../src/types';

describe('DeduplicationService', () => {
  let service: DeduplicationService;

  beforeEach(() => {
    service = new DeduplicationService();
  });

  describe('findDuplicates - exact location match', () => {
    it('should find duplicates with exact address match', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            freguesia: 'Estrela',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            freguesia: 'Estrela',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].properties).toHaveLength(2);
      expect(duplicates[0].properties.map(p => p.id)).toContain('prop-1');
      expect(duplicates[0].properties.map(p => p.id)).toContain('prop-2');
    });

    it('should not flag different addresses as duplicates', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua do Sol, 456'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('findDuplicates - geohash proximity', () => {
    it('should find duplicates with nearby coordinates', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7167, lon: -9.1333 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7168, lon: -9.1334 } // ~10 meters away
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].properties).toHaveLength(2);
    });

    it('should not flag distant properties as duplicates', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7167, lon: -9.1333 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Porto',
            concelho: 'Porto',
            coordinates: { lat: 41.1579, lon: -8.6291 } // Porto, far away
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('findDuplicates - price similarity', () => {
    it('should find duplicates with similar prices (±10%)', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 260000, // 4% difference
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
    });

    it('should not flag properties with large price differences', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 350000, // 40% difference
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('findDuplicates - area similarity', () => {
    it('should find duplicates with similar areas (±10%)', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7167, lon: -9.1333 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 88, // 3.5% difference
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7168, lon: -9.1334 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
    });

    it('should not flag properties with large area differences', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7167, lon: -9.1333 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 150, // 76% difference
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7168, lon: -9.1334 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('findDuplicates - multi-signal detection', () => {
    it('should detect duplicates with multiple matching signals', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
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
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          bedrooms: 2,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            freguesia: 'Estrela',
            coordinates: { lat: 38.7168, lon: -9.1334 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        },
        {
          id: 'prop-3',
          source: 'imovirtual',
          type: 'apartamento',
          operation: 'venda',
          price: 252000,
          area: 86,
          bedrooms: 2,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            freguesia: 'Estrela',
            coordinates: { lat: 38.7167, lon: -9.1333 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://imovirtual.com/prop-3'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].properties).toHaveLength(3);
    });

    it('should require minimum threshold of matching signals', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'moradia', // Different type
          operation: 'venda',
          price: 450000, // Different price
          area: 150, // Different area
          location: {
            distrito: 'Porto', // Different location
            concelho: 'Porto'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('groupDuplicates', () => {
    it('should group duplicate properties correctly', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const groups = service.groupDuplicates(properties);

      expect(groups).toHaveLength(1);
      expect(groups[0].properties).toHaveLength(2);
      expect(groups[0].primaryProperty).toBeDefined();
      expect(groups[0].reason).toBeDefined();
    });

    it('should return empty array when no duplicates found', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'moradia',
          operation: 'venda',
          price: 450000,
          area: 150,
          location: {
            distrito: 'Porto',
            concelho: 'Porto',
            address: 'Rua do Sol, 456'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const groups = service.groupDuplicates(properties);

      expect(groups).toHaveLength(0);
    });
  });

  describe('selectPrimaryProperty', () => {
    it('should select property with most complete data as primary', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'incomplete',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/incomplete'
        },
        {
          id: 'complete',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          bedrooms: 2,
          bathrooms: 2,
          floor: 3,
          features: ['garagem', 'elevador'],
          images: ['img1.jpg', 'img2.jpg'],
          description: 'Complete description',
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/complete'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates[0].primaryProperty.id).toBe('complete');
    });

    it('should prefer casafari source as primary', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'olx-prop',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop'
        },
        {
          id: 'casafari-prop',
          source: 'casafari',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://casafari.com/prop'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates[0].primaryProperty.id).toBe('casafari-prop');
    });
  });

  describe('edge cases', () => {
    it('should handle empty property list', () => {
      const duplicates = service.findDuplicates([]);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle single property', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'single',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/single'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle properties with missing coordinates', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'no-coords-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/no-coords-1'
        },
        {
          id: 'no-coords-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 255000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            address: 'Rua das Flores, 123'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/no-coords-2'
        }
      ];

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
    });

    it('should handle all properties being duplicates', () => {
      const properties: PropertyCanonicalModel[] = Array.from({ length: 5 }, (_, i) => ({
        id: `prop-${i}`,
        source: ['idealista', 'olx', 'imovirtual', 'casafari', 'casasapo'][i],
        type: 'apartamento',
        operation: 'venda',
        price: 250000 + i * 1000,
        area: 85,
        location: {
          distrito: 'Lisboa',
          concelho: 'Lisboa',
          address: 'Rua das Flores, 123'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: `https://example.com/prop-${i}`
      }));

      const duplicates = service.findDuplicates(properties);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].properties).toHaveLength(5);
    });
  });

  describe('threshold configuration', () => {
    it('should respect custom similarity thresholds', () => {
      const properties: PropertyCanonicalModel[] = [
        {
          id: 'prop-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7167, lon: -9.1333 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        },
        {
          id: 'prop-2',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 270000, // 8% difference
          area: 85,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            coordinates: { lat: 38.7168, lon: -9.1334 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-2'
        }
      ];

      const strictService = new DeduplicationService({ priceTolerance: 0.05 }); // 5%
      const lenientService = new DeduplicationService({ priceTolerance: 0.15 }); // 15%

      const strictDuplicates = strictService.findDuplicates(properties);
      const lenientDuplicates = lenientService.findDuplicates(properties);

      expect(strictDuplicates).toHaveLength(0);
      expect(lenientDuplicates).toHaveLength(1);
    });
  });

  describe('haversine distance calculation', () => {
    it('should calculate distance between coordinates correctly', () => {
      const distance = service.calculateDistance(
        { lat: 38.7167, lon: -9.1333 },
        { lat: 38.7268, lon: -9.1433 }
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2); // Should be ~1.2 km
    });

    it('should return 0 for same coordinates', () => {
      const distance = service.calculateDistance(
        { lat: 38.7167, lon: -9.1333 },
        { lat: 38.7167, lon: -9.1333 }
      );

      expect(distance).toBe(0);
    });
  });
});
