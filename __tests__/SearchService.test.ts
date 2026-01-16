/**
 * SearchService Test Suite
 * 
 * Tests for intelligent property search
 * Covers: filtering, sorting, pagination, statistics, facets, multi-source aggregation
 */

import { SearchService } from '../src/services/ia-busca/SearchService';
import type { PropertyCanonicalModel } from '../src/models/PropertyCanonicalModel';
import type { SearchQuery, SearchResults } from '../src/types/search';

// Mock dependencies
jest.mock('../src/services/ia-busca/ScoringService');
jest.mock('../src/services/ia-busca/DeduplicationService');

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    service = new SearchService();
    jest.clearAllMocks();
  });

  // Sample test data
  const createMockProperties = (): PropertyCanonicalModel[] => [
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
        freguesia: 'Estrela'
      },
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      url: 'https://idealista.pt/prop-1'
    },
    {
      id: 'prop-2',
      source: 'olx',
      type: 'moradia',
      operation: 'venda',
      price: 450000,
      area: 150,
      bedrooms: 4,
      location: {
        distrito: 'Porto',
        concelho: 'Porto',
        freguesia: 'Cedofeita'
      },
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-10').toISOString(),
      url: 'https://olx.pt/prop-2'
    },
    {
      id: 'prop-3',
      source: 'imovirtual',
      type: 'apartamento',
      operation: 'arrendamento',
      price: 1200,
      area: 75,
      bedrooms: 1,
      location: {
        distrito: 'Lisboa',
        concelho: 'Cascais',
        freguesia: 'Estoril'
      },
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      url: 'https://imovirtual.com/prop-3'
    },
    {
      id: 'prop-4',
      source: 'casafari',
      type: 'apartamento',
      operation: 'venda',
      price: 320000,
      area: 95,
      bedrooms: 3,
      bathrooms: 2,
      features: ['garagem', 'elevador', 'varanda'],
      location: {
        distrito: 'Lisboa',
        concelho: 'Lisboa',
        freguesia: 'Alvalade'
      },
      createdAt: new Date('2024-01-18').toISOString(),
      updatedAt: new Date('2024-01-18').toISOString(),
      url: 'https://casafari.com/prop-4'
    }
  ];

  describe('search - ANGARIACAO mode', () => {
    it('should return all properties in angariação mode', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO'
      };

      const result = await service.search(params);

      expect(result.properties).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
    });

    it('should prioritize recent listings in angariação mode', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        sortBy: 'recency'
      };

      const result = await service.search(params);

      const dates = result.properties.map(p => new Date(p.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);
      
      expect(dates).toEqual(sortedDates);
    });
  });

  describe('search - VENDA mode', () => {
    it('should return properties matching lead profile', async () => {
      const params: SearchParams = {
        mode: 'VENDA',
        leadProfile: {
          type: 'apartamento',
          priceRange: { min: 200000, max: 300000 },
          bedrooms: 2
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.type).toBe('apartamento');
        expect(prop.price).toBeGreaterThanOrEqual(200000);
        expect(prop.price).toBeLessThanOrEqual(300000);
      });
    });

    it('should sort by score in venda mode', async () => {
      const params: SearchParams = {
        mode: 'VENDA',
        sortBy: 'score'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        expect(result.properties[i].score).toBeGreaterThanOrEqual(
          result.properties[i + 1].score || 0
        );
      }
    });
  });

  describe('filter by property type', () => {
    it('should filter properties by type', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          type: 'apartamento'
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.type).toBe('apartamento');
      });
    });

    it('should filter properties by multiple types', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          types: ['apartamento', 'moradia']
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(['apartamento', 'moradia']).toContain(prop.type);
      });
    });
  });

  describe('filter by location', () => {
    it('should filter properties by distrito', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          distrito: 'Lisboa'
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.location.distrito).toBe('Lisboa');
      });
    });

    it('should filter properties by concelho', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          concelho: 'Cascais'
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.location.concelho).toBe('Cascais');
      });
    });

    it('should filter properties by freguesia', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          freguesia: 'Estrela'
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.location.freguesia).toBe('Estrela');
      });
    });

    it('should filter properties by multiple locations', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          locations: ['Lisboa', 'Porto', 'Cascais']
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        const location = prop.location.distrito || prop.location.concelho || '';
        expect(['Lisboa', 'Porto', 'Cascais']).toContain(location);
      });
    });
  });

  describe('filter by price range', () => {
    it('should filter properties by minimum price', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          priceMin: 300000
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.price).toBeGreaterThanOrEqual(300000);
      });
    });

    it('should filter properties by maximum price', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          priceMax: 300000
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.price).toBeLessThanOrEqual(300000);
      });
    });

    it('should filter properties by price range', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          priceRange: { min: 200000, max: 350000 }
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.price).toBeGreaterThanOrEqual(200000);
        expect(prop.price).toBeLessThanOrEqual(350000);
      });
    });
  });

  describe('filter by area range', () => {
    it('should filter properties by minimum area', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          areaMin: 100
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.area).toBeGreaterThanOrEqual(100);
      });
    });

    it('should filter properties by maximum area', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          areaMax: 100
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.area).toBeLessThanOrEqual(100);
      });
    });

    it('should filter properties by area range', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          areaRange: { min: 80, max: 100 }
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.area).toBeGreaterThanOrEqual(80);
        expect(prop.area).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('filter by bedrooms', () => {
    it('should filter properties by exact bedroom count', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          bedrooms: 2
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.bedrooms).toBe(2);
      });
    });

    it('should filter properties by minimum bedrooms', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          bedroomsMin: 3
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.bedrooms).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('filter by features', () => {
    it('should filter properties by single feature', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          features: ['garagem']
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.features).toContain('garagem');
      });
    });

    it('should filter properties by multiple features (AND logic)', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          features: ['garagem', 'elevador']
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.features).toContain('garagem');
        expect(prop.features).toContain('elevador');
      });
    });
  });

  describe('sort by score', () => {
    it('should sort properties by score descending', async () => {
      const params: SearchParams = {
        mode: 'VENDA',
        sortBy: 'score',
        sortOrder: 'desc'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        expect(result.properties[i].score).toBeGreaterThanOrEqual(
          result.properties[i + 1].score || 0
        );
      }
    });
  });

  describe('sort by price', () => {
    it('should sort properties by price ascending', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        sortBy: 'price',
        sortOrder: 'asc'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        expect(result.properties[i].price).toBeLessThanOrEqual(
          result.properties[i + 1].price
        );
      }
    });

    it('should sort properties by price descending', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        sortBy: 'price',
        sortOrder: 'desc'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        expect(result.properties[i].price).toBeGreaterThanOrEqual(
          result.properties[i + 1].price
        );
      }
    });
  });

  describe('sort by area', () => {
    it('should sort properties by area ascending', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        sortBy: 'area',
        sortOrder: 'asc'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        expect(result.properties[i].area).toBeLessThanOrEqual(
          result.properties[i + 1].area
        );
      }
    });

    it('should sort properties by area descending', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        sortBy: 'area',
        sortOrder: 'desc'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        expect(result.properties[i].area).toBeGreaterThanOrEqual(
          result.properties[i + 1].area
        );
      }
    });
  });

  describe('sort by recency', () => {
    it('should sort properties by creation date (newest first)', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        sortBy: 'recency',
        sortOrder: 'desc'
      };

      const result = await service.search(params);

      for (let i = 0; i < result.properties.length - 1; i++) {
        const date1 = new Date(result.properties[i].createdAt).getTime();
        const date2 = new Date(result.properties[i + 1].createdAt).getTime();
        expect(date1).toBeGreaterThanOrEqual(date2);
      }
    });
  });

  describe('pagination', () => {
    it('should return first page by default', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO'
      };

      const result = await service.search(params);

      expect(result.page).toBe(1);
    });

    it('should return specified page', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        page: 2,
        perPage: 10
      };

      const result = await service.search(params);

      expect(result.page).toBe(2);
    });

    it('should respect perPage limit', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        perPage: 5
      };

      const result = await service.search(params);

      expect(result.properties.length).toBeLessThanOrEqual(5);
      expect(result.perPage).toBe(5);
    });

    it('should calculate total pages correctly', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        perPage: 10
      };

      const result = await service.search(params);

      const expectedPages = Math.ceil(result.total / 10);
      expect(result.totalPages).toBe(expectedPages);
    });

    it('should handle page beyond available data', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        page: 999,
        perPage: 10
      };

      const result = await service.search(params);

      expect(result.properties).toHaveLength(0);
      expect(result.page).toBe(999);
    });
  });

  describe('statistics calculation', () => {
    it('should calculate average price', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeStats: true
      };

      const result = await service.search(params);

      expect(result.statistics).toBeDefined();
      expect(result.statistics?.averagePrice).toBeGreaterThan(0);
    });

    it('should calculate median price', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeStats: true
      };

      const result = await service.search(params);

      expect(result.statistics?.medianPrice).toBeGreaterThan(0);
    });

    it('should calculate price range', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeStats: true
      };

      const result = await service.search(params);

      expect(result.statistics?.priceRange).toBeDefined();
      expect(result.statistics?.priceRange.min).toBeGreaterThan(0);
      expect(result.statistics?.priceRange.max).toBeGreaterThanOrEqual(
        result.statistics?.priceRange.min
      );
    });

    it('should calculate average area', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeStats: true
      };

      const result = await service.search(params);

      expect(result.statistics?.averageArea).toBeGreaterThan(0);
    });
  });

  describe('facets calculation', () => {
    it('should calculate type facets', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeFacets: true
      };

      const result = await service.search(params);

      expect(result.facets).toBeDefined();
      expect(result.facets?.types).toBeDefined();
      expect(Array.isArray(result.facets?.types)).toBe(true);
    });

    it('should calculate location facets', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeFacets: true
      };

      const result = await service.search(params);

      expect(result.facets?.locations).toBeDefined();
      expect(Array.isArray(result.facets?.locations)).toBe(true);
    });

    it('should calculate price range facets', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeFacets: true
      };

      const result = await service.search(params);

      expect(result.facets?.priceRanges).toBeDefined();
      expect(Array.isArray(result.facets?.priceRanges)).toBe(true);
    });

    it('should include count in facets', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        includeFacets: true
      };

      const result = await service.search(params);

      result.facets?.types.forEach(facet => {
        expect(facet.count).toBeGreaterThan(0);
      });
    });
  });

  describe('empty results', () => {
    it('should handle no matching properties gracefully', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          type: 'terreno',
          priceRange: { min: 10000000, max: 20000000 }
        }
      };

      const result = await service.search(params);

      expect(result.properties).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty statistics when no results', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          type: 'nonexistent'
        },
        includeStats: true
      };

      const result = await service.search(params);

      expect(result.statistics).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid page number', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        page: -1
      };

      await expect(service.search(params)).rejects.toThrow();
    });

    it('should handle invalid perPage value', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        perPage: 0
      };

      await expect(service.search(params)).rejects.toThrow();
    });

    it('should handle invalid price range', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        filters: {
          priceRange: { min: 500000, max: 200000 }
        }
      };

      await expect(service.search(params)).rejects.toThrow();
    });
  });

  describe('multi-source aggregation', () => {
    it('should aggregate properties from multiple sources', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO'
      };

      const result = await service.search(params);

      const sources = new Set(result.properties.map(p => p.source));
      expect(sources.size).toBeGreaterThan(1);
    });

    it('should include source metadata', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO'
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.source).toBeDefined();
        expect(['idealista', 'olx', 'imovirtual', 'casafari', 'crm']).toContain(prop.source);
      });
    });
  });

  describe('scoring integration', () => {
    it('should include scores in venda mode', async () => {
      const params: SearchParams = {
        mode: 'VENDA',
        leadProfile: {
          type: 'apartamento',
          priceRange: { min: 200000, max: 300000 }
        }
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.score).toBeDefined();
        expect(prop.score).toBeGreaterThanOrEqual(0);
        expect(prop.score).toBeLessThanOrEqual(100);
      });
    });

    it('should not include scores in angariação mode by default', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO'
      };

      const result = await service.search(params);

      result.properties.forEach(prop => {
        expect(prop.score).toBeUndefined();
      });
    });
  });

  describe('deduplication integration', () => {
    it('should deduplicate results when enabled', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        deduplicate: true
      };

      const result = await service.search(params);

      const uniqueProperties = new Set();
      result.properties.forEach(prop => {
        const key = `${prop.location.distrito}-${prop.price}-${prop.area}`;
        expect(uniqueProperties.has(key)).toBe(false);
        uniqueProperties.add(key);
      });
    });

    it('should not deduplicate when disabled', async () => {
      const params: SearchParams = {
        mode: 'ANGARIACAO',
        deduplicate: false
      };

      const result = await service.search(params);

      expect(result.properties).toBeDefined();
    });
  });
});
