/**
 * PortalAggregator Test Suite
 * 
 * Tests for multi-source property aggregation
 * Covers: Casafari, portals (Idealista, OLX, Imovirtual), CRM, parallel querying, error handling
 */

import { PortalAggregator } from '../src/services/PortalAggregator';
import type { PropertyCanonicalModel, AggregationResult } from '../src/types';

// Mock external services
jest.mock('../src/services/CasafariService');
jest.mock('../src/services/CRMService');
jest.mock('../src/services/portals/IdealistaConnector');
jest.mock('../src/services/portals/OLXConnector');
jest.mock('../src/services/portals/ImovirtualConnector');

import { CasafariService } from '../src/services/CasafariService';
import { CRMService } from '../src/services/CRMService';
import { IdealistaConnector } from '../src/services/portals/IdealistaConnector';
import { OLXConnector } from '../src/services/portals/OLXConnector';
import { ImovirtualConnector } from '../src/services/portals/ImovirtualConnector';

describe('PortalAggregator', () => {
  let aggregator: PortalAggregator;
  let mockCasafariService: jest.Mocked<CasafariService>;
  let mockCRMService: jest.Mocked<CRMService>;
  let mockIdealistaConnector: jest.Mocked<IdealistaConnector>;
  let mockOLXConnector: jest.Mocked<OLXConnector>;
  let mockImovirtualConnector: jest.Mocked<ImovirtualConnector>;

  beforeEach(() => {
    mockCasafariService = new CasafariService() as jest.Mocked<CasafariService>;
    mockCRMService = new CRMService() as jest.Mocked<CRMService>;
    mockIdealistaConnector = new IdealistaConnector() as jest.Mocked<IdealistaConnector>;
    mockOLXConnector = new OLXConnector() as jest.Mocked<OLXConnector>;
    mockImovirtualConnector = new ImovirtualConnector() as jest.Mocked<ImovirtualConnector>;

    aggregator = new PortalAggregator({
      casafariService: mockCasafariService,
      crmService: mockCRMService,
      idealistaConnector: mockIdealistaConnector,
      olxConnector: mockOLXConnector,
      imovirtualConnector: mockImovirtualConnector
    });

    jest.clearAllMocks();
  });

  describe('aggregate from Casafari', () => {
    it('should fetch properties from Casafari successfully', async () => {
      const mockProperties: PropertyCanonicalModel[] = [
        {
          id: 'casafari-1',
          source: 'casafari',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://casafari.com/prop-1'
        }
      ];

      mockCasafariService.search.mockResolvedValue(mockProperties);

      const result = await aggregator.aggregateFromCasafari({
        location: 'Lisboa',
        type: 'apartamento'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].source).toBe('casafari');
      expect(mockCasafariService.search).toHaveBeenCalledWith({
        location: 'Lisboa',
        type: 'apartamento'
      });
    });

    it('should handle Casafari API errors gracefully', async () => {
      mockCasafariService.search.mockRejectedValue(new Error('Casafari API error'));

      const result = await aggregator.aggregateFromCasafari({ location: 'Lisboa' });

      expect(result.properties).toHaveLength(0);
      expect(result.errors).toContain('casafari');
    });

    it('should transform Casafari data to canonical model', async () => {
      const mockProperties: PropertyCanonicalModel[] = [
        {
          id: 'casafari-1',
          source: 'casafari',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          bedrooms: 2,
          bathrooms: 2,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            freguesia: 'Estrela'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://casafari.com/prop-1'
        }
      ];

      mockCasafariService.search.mockResolvedValue(mockProperties);

      const result = await aggregator.aggregateFromCasafari({ location: 'Lisboa' });

      expect(result.properties[0]).toMatchObject({
        source: 'casafari',
        type: 'apartamento',
        price: 250000,
        area: 85
      });
    });
  });

  describe('aggregate from portals', () => {
    it('should fetch properties from Idealista successfully', async () => {
      const mockProperties: PropertyCanonicalModel[] = [
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          location: { distrito: 'Porto', concelho: 'Porto' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ];

      mockIdealistaConnector.search.mockResolvedValue(mockProperties);

      const result = await aggregator.aggregateFromPortals({
        portals: ['idealista'],
        location: 'Porto'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].source).toBe('idealista');
    });

    it('should fetch properties from OLX successfully', async () => {
      const mockProperties: PropertyCanonicalModel[] = [
        {
          id: 'olx-1',
          source: 'olx',
          type: 'moradia',
          operation: 'venda',
          price: 450000,
          area: 150,
          location: { distrito: 'Faro', concelho: 'Albufeira' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-1'
        }
      ];

      mockOLXConnector.search.mockResolvedValue(mockProperties);

      const result = await aggregator.aggregateFromPortals({
        portals: ['olx'],
        location: 'Faro'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].source).toBe('olx');
    });

    it('should fetch properties from Imovirtual successfully', async () => {
      const mockProperties: PropertyCanonicalModel[] = [
        {
          id: 'imovirtual-1',
          source: 'imovirtual',
          type: 'apartamento',
          operation: 'arrendamento',
          price: 1200,
          area: 75,
          location: { distrito: 'Lisboa', concelho: 'Cascais' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://imovirtual.com/prop-1'
        }
      ];

      mockImovirtualConnector.search.mockResolvedValue(mockProperties);

      const result = await aggregator.aggregateFromPortals({
        portals: ['imovirtual'],
        location: 'Cascais'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].source).toBe('imovirtual');
    });

    it('should aggregate from multiple portals simultaneously', async () => {
      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      mockOLXConnector.search.mockResolvedValue([
        {
          id: 'olx-1',
          source: 'olx',
          type: 'apartamento',
          operation: 'venda',
          price: 270000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://olx.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateFromPortals({
        portals: ['idealista', 'olx'],
        location: 'Lisboa'
      });

      expect(result.properties).toHaveLength(2);
      expect(result.properties.map(p => p.source)).toContain('idealista');
      expect(result.properties.map(p => p.source)).toContain('olx');
    });
  });

  describe('aggregate from CRM', () => {
    it('should fetch properties from CRM successfully', async () => {
      const mockProperties: PropertyCanonicalModel[] = [
        {
          id: 'crm-1',
          source: 'crm',
          type: 'apartamento',
          operation: 'venda',
          price: 320000,
          area: 95,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://example.com/crm/prop-1'
        }
      ];

      mockCRMService.getProperties.mockResolvedValue(mockProperties);

      const result = await aggregator.aggregateFromCRM({
        status: 'active'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].source).toBe('crm');
    });

    it('should handle CRM errors gracefully', async () => {
      mockCRMService.getProperties.mockRejectedValue(new Error('CRM connection error'));

      const result = await aggregator.aggregateFromCRM({});

      expect(result.properties).toHaveLength(0);
      expect(result.errors).toContain('crm');
    });
  });

  describe('parallel querying', () => {
    it('should query all sources in parallel', async () => {
      const startTime = Date.now();

      mockCasafariService.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      mockIdealistaConnector.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      mockOLXConnector.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      await aggregator.aggregateAll({
        sources: ['casafari', 'idealista', 'olx'],
        location: 'Lisboa'
      });

      const duration = Date.now() - startTime;

      // Should complete in ~100ms (parallel) not ~300ms (sequential)
      expect(duration).toBeLessThan(200);
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow sources', async () => {
      mockCasafariService.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10000))
      );

      const result = await aggregator.aggregateFromCasafari(
        { location: 'Lisboa' },
        { timeout: 1000 }
      );

      expect(result.properties).toHaveLength(0);
      expect(result.errors).toContain('casafari');
    });

    it('should continue with other sources if one times out', async () => {
      mockCasafariService.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10000))
      );

      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateAll(
        { sources: ['casafari', 'idealista'], location: 'Lisboa' },
        { timeout: 1000 }
      );

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].source).toBe('idealista');
      expect(result.errors).toContain('casafari');
    });
  });

  describe('partial failure tolerance', () => {
    it('should continue if one source fails', async () => {
      mockCasafariService.search.mockRejectedValue(new Error('API error'));
      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateAll({
        sources: ['casafari', 'idealista'],
        location: 'Lisboa'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.errors).toContain('casafari');
    });

    it('should return partial results when multiple sources fail', async () => {
      mockCasafariService.search.mockRejectedValue(new Error('API error'));
      mockOLXConnector.search.mockRejectedValue(new Error('API error'));
      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateAll({
        sources: ['casafari', 'idealista', 'olx'],
        location: 'Lisboa'
      });

      expect(result.properties).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('casafari');
      expect(result.errors).toContain('olx');
    });
  });

  describe('deduplication integration', () => {
    it('should deduplicate properties from multiple sources', async () => {
      const duplicateProperty = {
        type: 'apartamento' as const,
        operation: 'venda' as const,
        price: 250000,
        area: 85,
        location: {
          distrito: 'Lisboa',
          concelho: 'Lisboa',
          address: 'Rua das Flores, 123'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockIdealistaConnector.search.mockResolvedValue([
        {
          ...duplicateProperty,
          id: 'idealista-1',
          source: 'idealista',
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      mockOLXConnector.search.mockResolvedValue([
        {
          ...duplicateProperty,
          id: 'olx-1',
          source: 'olx',
          url: 'https://olx.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateAll({
        sources: ['idealista', 'olx'],
        location: 'Lisboa',
        deduplicate: true
      });

      expect(result.properties).toHaveLength(1);
    });
  });

  describe('statistics calculation', () => {
    it('should calculate statistics across all sources', async () => {
      mockCasafariService.search.mockResolvedValue([
        {
          id: 'casafari-1',
          source: 'casafari',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://casafari.com/prop-1'
        }
      ]);

      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 300000,
          area: 95,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateAll({
        sources: ['casafari', 'idealista'],
        location: 'Lisboa'
      });

      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalProperties).toBe(2);
      expect(result.statistics.averagePrice).toBe(275000);
      expect(result.statistics.sourceBreakdown).toBeDefined();
    });
  });

  describe('empty results from all sources', () => {
    it('should handle empty results gracefully', async () => {
      mockCasafariService.search.mockResolvedValue([]);
      mockIdealistaConnector.search.mockResolvedValue([]);
      mockOLXConnector.search.mockResolvedValue([]);

      const result = await aggregator.aggregateAll({
        sources: ['casafari', 'idealista', 'olx'],
        location: 'Lisboa'
      });

      expect(result.properties).toHaveLength(0);
      expect(result.statistics.totalProperties).toBe(0);
    });
  });

  describe('error from specific source', () => {
    it('should track which source failed', async () => {
      mockCasafariService.search.mockRejectedValue(new Error('Casafari error'));

      const result = await aggregator.aggregateFromCasafari({ location: 'Lisboa' });

      expect(result.errors).toContain('casafari');
      expect(result.properties).toHaveLength(0);
    });

    it('should include error messages in result', async () => {
      mockIdealistaConnector.search.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await aggregator.aggregateFromPortals({
        portals: ['idealista'],
        location: 'Lisboa'
      });

      expect(result.errorMessages).toBeDefined();
      expect(result.errorMessages['idealista']).toContain('Rate limit exceeded');
    });
  });

  describe('transformation to PropertyCanonicalModel', () => {
    it('should transform all properties to canonical model', async () => {
      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          bedrooms: 2,
          bathrooms: 2,
          location: {
            distrito: 'Lisboa',
            concelho: 'Lisboa',
            freguesia: 'Estrela'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateFromPortals({
        portals: ['idealista'],
        location: 'Lisboa'
      });

      result.properties.forEach(prop => {
        expect(prop).toHaveProperty('id');
        expect(prop).toHaveProperty('source');
        expect(prop).toHaveProperty('type');
        expect(prop).toHaveProperty('operation');
        expect(prop).toHaveProperty('price');
        expect(prop).toHaveProperty('area');
        expect(prop).toHaveProperty('location');
        expect(prop).toHaveProperty('createdAt');
        expect(prop).toHaveProperty('updatedAt');
        expect(prop).toHaveProperty('url');
      });
    });
  });

  describe('source metadata preservation', () => {
    it('should preserve original source metadata', async () => {
      mockCasafariService.search.mockResolvedValue([
        {
          id: 'casafari-1',
          source: 'casafari',
          type: 'apartamento',
          operation: 'venda',
          price: 250000,
          area: 85,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://casafari.com/prop-1',
          metadata: {
            casafariId: 'CF-12345',
            quality: 'high'
          }
        }
      ]);

      const result = await aggregator.aggregateFromCasafari({ location: 'Lisboa' });

      expect(result.properties[0].metadata).toBeDefined();
      expect(result.properties[0].metadata?.casafariId).toBe('CF-12345');
    });

    it('should track query timestamp for each source', async () => {
      mockIdealistaConnector.search.mockResolvedValue([
        {
          id: 'idealista-1',
          source: 'idealista',
          type: 'apartamento',
          operation: 'venda',
          price: 280000,
          area: 90,
          location: { distrito: 'Lisboa', concelho: 'Lisboa' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://idealista.pt/prop-1'
        }
      ]);

      const result = await aggregator.aggregateFromPortals({
        portals: ['idealista'],
        location: 'Lisboa'
      });

      expect(result.queryTimestamp).toBeDefined();
      expect(new Date(result.queryTimestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
