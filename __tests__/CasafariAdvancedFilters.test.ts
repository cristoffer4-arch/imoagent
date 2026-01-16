/**
 * CasafariAdvancedFilters.test.ts
 * 
 * Unit tests for advanced Casafari API filters
 * Tests Phase 1: Advanced filters implementation
 */

import { PortalAggregator } from '../src/services/ia-busca/PortalAggregator';
import { CasafariService } from '../src/services/casafari/CasafariService';
import { DeduplicationService } from '../src/services/ia-busca/DeduplicationService';
import type { SearchQuery, SearchMode, SearchSortBy } from '../src/types/search';

// Mock fetch
global.fetch = jest.fn();

describe('Casafari Advanced Filters - Phase 1', () => {
  let aggregator: PortalAggregator;
  let casafariService: CasafariService;

  beforeEach(() => {
    casafariService = new CasafariService({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.casafari.com/v1',
    });

    aggregator = new PortalAggregator({
      casafariService,
      deduplicationService: new DeduplicationService(),
    });

    jest.clearAllMocks();
  });

  describe('Range Filters', () => {
    it('should map bathrooms range filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          minBathrooms: 2,
          maxBathrooms: 4,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      // Mock casafari service to capture the filters
      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bathrooms_from: 2,
          bathrooms_to: 4,
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map construction year range filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          minConstructionYear: 2010,
          maxConstructionYear: 2023,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          construction_year_from: 2010,
          construction_year_to: 2023,
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map plot area range filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          minPlotArea: 500,
          maxPlotArea: 2000,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          plot_area_from: 500,
          plot_area_to: 2000,
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map price per sqm range filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          minPricePerSqm: 2000,
          maxPricePerSqm: 5000,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          price_per_sqm_from: 2000,
          price_per_sqm_to: 5000,
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map days on market range filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          minDaysOnMarket: 7,
          maxDaysOnMarket: 30,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          days_on_market_from: 7,
          days_on_market_to: 30,
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map gross yield range filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          minGrossYield: 4.5,
          maxGrossYield: 8.0,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          gross_yield_from: 4.5,
          gross_yield_to: 8.0,
        }),
        'test-tenant',
        undefined
      );
    });
  });

  describe('Property Characteristics Filters', () => {
    it('should map floors array correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          floors: ['ground', 'top'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          floors: ['ground', 'top'],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map floor numbers array correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          floorNumbers: [1, 2, 3],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          floor_number: [1, 2, 3],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map views array correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          views: ['water', 'city', 'landscape'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          view_types: ['water', 'city', 'landscape'],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map directions array correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          directions: ['north', 'south'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          directions: ['north', 'south'],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map orientation correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          orientation: 'exterior',
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          orientations: 'exterior',
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map characteristics must_have and exclude correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          mustHaveFeatures: ['pool', 'garage'],
          excludeFeatures: ['pet_friendly'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          characteristics: {
            must_have: ['pool', 'garage'],
            exclude: ['pet_friendly'],
          },
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map conditions array correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          condition: ['new', 'very-good'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          conditions: ['new', 'very-good'],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map energy ratings array correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          energyRatings: ['A+', 'A', 'B'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          energy_ratings: ['A+', 'A', 'B'],
        }),
        'test-tenant',
        undefined
      );
    });
  });

  describe('Business Filters', () => {
    it('should map business filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          privateListings: true,
          auctionOnly: false,
          bankOwned: true,
          casafariConnect: true,
          exclusiveListings: false,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          private: true,
          auction: false,
          bank: true,
          casafari_connect: true,
          exclusive: false,
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map agency filters correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          withAgencies: ['agency-1', 'agency-2'],
          withoutAgencies: ['agency-3'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          with_agencies: ['agency-1', 'agency-2'],
          without_agencies: ['agency-3'],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map listing agents and ref numbers correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          listingAgents: ['agent-1', 'agent-2'],
          refNumbers: ['REF-001', 'REF-002'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          listing_agents: ['agent-1', 'agent-2'],
          ref_numbers: ['REF-001', 'REF-002'],
        }),
        'test-tenant',
        undefined
      );
    });
  });

  describe('Location Filters', () => {
    it('should map location IDs correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          locationIds: ['loc-1', 'loc-2', 'loc-3'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          location_ids: ['loc-1', 'loc-2', 'loc-3'],
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map custom location boundary circle correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          customLocationBoundary: {
            type: 'circle',
            center: { latitude: 38.7223, longitude: -9.1393 },
            radius: 5000,
          },
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_location_boundary: {
            type: 'circle',
            center: { latitude: 38.7223, longitude: -9.1393 },
            radius: 5000,
          },
        }),
        'test-tenant',
        undefined
      );
    });

    it('should map custom location boundary polygon correctly', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          customLocationBoundary: {
            type: 'polygon',
            coordinates: [
              { latitude: 38.7223, longitude: -9.1393 },
              { latitude: 38.7323, longitude: -9.1493 },
              { latitude: 38.7423, longitude: -9.1593 },
            ],
          },
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_location_boundary: {
            type: 'polygon',
            coordinates: [
              { latitude: 38.7223, longitude: -9.1393 },
              { latitude: 38.7323, longitude: -9.1493 },
              { latitude: 38.7423, longitude: -9.1593 },
            ],
          },
        }),
        'test-tenant',
        undefined
      );
    });
  });

  describe('Date Filters', () => {
    it('should map advanced date filters correctly', async () => {
      const propertyDateFrom = new Date('2024-01-01');
      const propertyDateTo = new Date('2024-12-31');
      const createdDateFrom = new Date('2023-06-01');
      const updatedDateFrom = new Date('2024-06-01');

      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          propertyDateFrom,
          propertyDateTo,
          createdDateFrom,
          updatedDateFrom,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          property_date_from: propertyDateFrom.toISOString(),
          property_date_to: propertyDateTo.toISOString(),
          created_date_from: createdDateFrom.toISOString(),
          updated_date_from: updatedDateFrom.toISOString(),
        }),
        'test-tenant',
        undefined
      );
    });

    it('should maintain backward compatibility with legacy date filters', async () => {
      const publishedAfter = new Date('2024-01-01');
      const publishedBefore = new Date('2024-12-31');

      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          publishedAfter,
          publishedBefore,
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 10,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          publishedAfter: publishedAfter.toISOString(),
          publishedBefore: publishedBefore.toISOString(),
        }),
        'test-tenant',
        undefined
      );
    });
  });

  describe('Complex Filter Combinations', () => {
    it('should handle multiple advanced filters together', async () => {
      const query: SearchQuery = {
        mode: 'VENDA' as SearchMode,
        filters: {
          // Range filters
          minBathrooms: 2,
          maxBathrooms: 3,
          minConstructionYear: 2015,
          maxConstructionYear: 2023,
          minPricePerSqm: 2500,
          maxPricePerSqm: 4000,
          
          // Property characteristics
          floors: ['ground', 'middle'],
          views: ['water', 'city'],
          directions: ['south', 'west'],
          energyRatings: ['A', 'A+', 'B'],
          
          // Business filters
          privateListings: true,
          exclusiveListings: true,
          
          // Location
          locationIds: ['loc-1', 'loc-2'],
        },
        sortBy: 'PRICE_ASC' as SearchSortBy,
        page: 1,
        perPage: 20,
        tenantId: 'test-tenant',
      };

      const mockListProperties = jest.spyOn(casafariService, 'listProperties');
      mockListProperties.mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      await aggregator.aggregate(query, { enablePortals: false, enableCRM: false });

      expect(mockListProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bathrooms_from: 2,
          bathrooms_to: 3,
          construction_year_from: 2015,
          construction_year_to: 2023,
          price_per_sqm_from: 2500,
          price_per_sqm_to: 4000,
          floors: ['ground', 'middle'],
          view_types: ['water', 'city'],
          directions: ['south', 'west'],
          energy_ratings: ['A', 'A+', 'B'],
          private: true,
          exclusive: true,
          location_ids: ['loc-1', 'loc-2'],
        }),
        'test-tenant',
        undefined
      );
    });
  });
});
