/**
 * CasafariValuation.test.ts - Unit tests for CasafariValuationService
 */

import {
  CasafariValuationService,
  createCasafariValuationService,
} from '../src/services/casafari/CasafariValuationService';
import { CasafariApiError } from '../src/services/casafari/CasafariService';
import type {
  CasafariComparablesFilters,
  CasafariComparablesResponse,
  CasafariComparablesV2Response,
  CasafariValuationRequest,
  CasafariEstimatedPrices,
} from '../src/services/casafari/types-valuation';

// Mock fetch global
global.fetch = jest.fn();

describe('CasafariValuationService', () => {
  let service: CasafariValuationService;
  const mockApiKey = 'test-valuation-api-key';
  const mockBaseUrl = 'https://api.casafari.com';

  beforeEach(() => {
    service = new CasafariValuationService({
      apiKey: mockApiKey,
      baseUrl: mockBaseUrl,
      timeout: 5000,
    });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with provided config', () => {
      expect(service).toBeInstanceOf(CasafariValuationService);
    });

    it('should use default baseUrl if not provided', () => {
      const defaultService = new CasafariValuationService({
        apiKey: mockApiKey,
      });
      expect(defaultService).toBeInstanceOf(CasafariValuationService);
    });
  });

  describe('searchComparables', () => {
    const mockComparablesResponse: CasafariComparablesResponse = {
      data: [
        {
          id: 'comp-1',
          propertyType: 'apartment',
          transactionType: 'sale',
          status: 'active',
          location: {
            latitude: 38.7223,
            longitude: -9.1393,
            municipality: 'Lisboa',
            district: 'Lisboa',
            country: 'Portugal',
          },
          price: {
            value: 250000,
            currency: 'EUR',
            pricePerSqm: 2941,
          },
          characteristics: {
            netArea: 85,
            bedrooms: 2,
            bathrooms: 1,
          },
          distance: 250,
          matchScore: 95,
        },
        {
          id: 'comp-2',
          propertyType: 'apartment',
          transactionType: 'sale',
          status: 'active',
          location: {
            latitude: 38.7230,
            longitude: -9.1400,
            municipality: 'Lisboa',
            district: 'Lisboa',
            country: 'Portugal',
          },
          price: {
            value: 270000,
            currency: 'EUR',
            pricePerSqm: 3000,
          },
          characteristics: {
            netArea: 90,
            bedrooms: 2,
            bathrooms: 1,
          },
          distance: 350,
          matchScore: 88,
        },
      ],
      statistics: {
        totalProperties: 2,
        price: {
          min: 250000,
          max: 270000,
          mean: 260000,
          median: 260000,
          stdDev: 10000,
        },
        pricePerSqm: {
          min: 2941,
          max: 3000,
          mean: 2970,
          median: 2970,
          stdDev: 30,
        },
        area: {
          min: 85,
          max: 90,
          mean: 87.5,
          median: 87.5,
        },
        daysOnMarket: {
          min: 30,
          max: 60,
          mean: 45,
          median: 45,
        },
      },
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      },
    };

    it('should search comparables with filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparablesResponse,
      });

      const filters: CasafariComparablesFilters = {
        location: {
          center: {
            latitude: 38.7223,
            longitude: -9.1393,
            radius: 1000,
          },
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
        minBedrooms: 2,
        maxBedrooms: 3,
        limit: 50,
      };

      const result = await service.searchComparables(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/comparables/search`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(filters),
        })
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].matchScore).toBe(95);
      expect(result.statistics.price.mean).toBe(260000);
    });

    it('should handle bbox location boundary', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparablesResponse,
      });

      const filters: CasafariComparablesFilters = {
        location: {
          bbox: [-9.2, 38.7, -9.1, 38.8],
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
      };

      const result = await service.searchComparables(filters);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_FILTERS',
            message: 'Invalid search filters',
          },
        }),
      });

      const filters: CasafariComparablesFilters = {
        location: {},
        propertyType: ['apartment'],
      };

      await expect(service.searchComparables(filters)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('searchComparablesV2', () => {
    const mockComparablesV2Response: CasafariComparablesV2Response = {
      data: [
        {
          id: 'comp-v2-1',
          propertyType: 'apartment',
          transactionType: 'sale',
          status: 'sold',
          location: {
            latitude: 38.7223,
            longitude: -9.1393,
            municipality: 'Lisboa',
            district: 'Lisboa',
            country: 'Portugal',
          },
          price: {
            value: 240000,
            currency: 'EUR',
            pricePerSqm: 2824,
          },
          characteristics: {
            netArea: 85,
            bedrooms: 2,
            bathrooms: 1,
          },
          distance: 200,
          matchScore: 92,
          source: {
            soldDate: '2024-06-15',
          },
        },
      ],
      statistics: {
        totalProperties: 1,
        price: {
          min: 240000,
          max: 240000,
          mean: 240000,
          median: 240000,
        },
        pricePerSqm: {
          min: 2824,
          max: 2824,
          mean: 2824,
          median: 2824,
        },
        area: {
          min: 85,
          max: 85,
          mean: 85,
          median: 85,
        },
        statusDistribution: {
          active: 5,
          sold: 10,
        },
      },
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
      },
      transactionalStatistics: {
        avgTimeOnMarket: 45,
        avgPriceReduction: 5,
        soldCount: 10,
        priceTrends: [
          { month: '2024-01', avgPrice: 230000, avgPricePerSqm: 2700, count: 5 },
          { month: '2024-02', avgPrice: 235000, avgPricePerSqm: 2750, count: 8 },
          { month: '2024-03', avgPrice: 240000, avgPricePerSqm: 2800, count: 10 },
        ],
      },
    };

    it('should search comparables v2 with transactional data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparablesV2Response,
      });

      const filters: CasafariComparablesFilters = {
        location: {
          center: {
            latitude: 38.7223,
            longitude: -9.1393,
            radius: 1000,
          },
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
        includeTransactional: true,
        soldAfter: '2024-01-01',
        limit: 100,
      };

      const result = await service.searchComparablesV2(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v2/comparables/search`,
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result.transactionalStatistics).toBeDefined();
      expect(result.transactionalStatistics?.avgTimeOnMarket).toBe(45);
      expect(result.transactionalStatistics?.priceTrends).toHaveLength(3);
    });
  });

  describe('getEstimatedPrices', () => {
    const mockEstimatedPrices: CasafariEstimatedPrices = {
      estimatedPrice: 260000,
      confidence: 85,
      priceRangeLow: 240000,
      priceRangeHigh: 280000,
      estimatedPricePerSqm: 3059,
      comparablesCount: 15,
      methodology: 'comparable_sales',
      factors: {
        location: 0.1,
        condition: 0.05,
        size: 0,
        amenities: 0.02,
        market: 0.03,
      },
    };

    it('should get estimated prices', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEstimatedPrices }),
      });

      const request: CasafariValuationRequest = {
        location: {
          latitude: 38.7223,
          longitude: -9.1393,
          municipality: 'Lisboa',
        },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: {
          netArea: 85,
          bedrooms: 2,
          bathrooms: 1,
        },
      };

      const result = await service.getEstimatedPrices(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/valuation/comparables-prices`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.estimatedPrice).toBe(260000);
      expect(result.confidence).toBe(85);
      expect(result.priceRangeLow).toBe(240000);
      expect(result.priceRangeHigh).toBe(280000);
    });

    it('should handle valuation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          error: {
            code: 'INSUFFICIENT_DATA',
            message: 'Not enough comparables found',
          },
        }),
      });

      const request: CasafariValuationRequest = {
        location: { latitude: 38.7223, longitude: -9.1393 },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: { netArea: 85 },
      };

      await expect(service.getEstimatedPrices(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getPropertyValuation', () => {
    const mockComparablesResponse: CasafariComparablesResponse = {
      data: [
        {
          id: 'comp-1',
          propertyType: 'apartment',
          transactionType: 'sale',
          location: { latitude: 38.7223, longitude: -9.1393 },
          price: { value: 250000, currency: 'EUR', pricePerSqm: 2941 },
          characteristics: { netArea: 85, bedrooms: 2, bathrooms: 1 },
          matchScore: 95,
        },
      ],
      statistics: {
        totalProperties: 1,
        price: { min: 250000, max: 250000, mean: 250000, median: 250000 },
        pricePerSqm: { min: 2941, max: 2941, mean: 2941, median: 2941 },
        area: { min: 85, max: 85, mean: 85, median: 85 },
      },
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    const mockEstimatedPrices: CasafariEstimatedPrices = {
      estimatedPrice: 255000,
      confidence: 80,
      priceRangeLow: 240000,
      priceRangeHigh: 270000,
      estimatedPricePerSqm: 3000,
      comparablesCount: 1,
    };

    it('should get complete property valuation', async () => {
      // Mock comparables search
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparablesResponse,
      });

      // Mock estimated prices
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEstimatedPrices }),
      });

      const request: CasafariValuationRequest = {
        location: {
          latitude: 38.7223,
          longitude: -9.1393,
          municipality: 'Lisboa',
        },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: {
          netArea: 85,
          bedrooms: 2,
          bathrooms: 1,
          condition: 'used',
        },
        features: {
          hasElevator: true,
        },
        searchRadius: 1000,
      };

      const result = await service.getPropertyValuation(request);

      expect(result.valuation).toEqual(mockEstimatedPrices);
      expect(result.comparables).toHaveLength(1);
      expect(result.statistics).toBeDefined();
      expect(result.marketInsights).toBeDefined();
      expect(result.marketInsights?.activityLevel).toBe('low');
      expect(result.meta?.valuationDate).toBeDefined();
    });

    it('should use v2 API when transactional data requested', async () => {
      const mockV2Response: CasafariComparablesV2Response = {
        ...mockComparablesResponse,
        transactionalStatistics: {
          avgTimeOnMarket: 45,
          soldCount: 5,
          priceTrends: [
            { month: '2024-01', avgPrice: 240000, avgPricePerSqm: 2800, count: 5 },
            { month: '2024-03', avgPrice: 255000, avgPricePerSqm: 3000, count: 8 },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockV2Response,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEstimatedPrices }),
      });

      const request: CasafariValuationRequest = {
        location: { latitude: 38.7223, longitude: -9.1393 },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: { netArea: 85 },
        includeTransactional: true,
      };

      const result = await service.getPropertyValuation(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v2/comparables/search`,
        expect.any(Object)
      );

      expect(result.marketInsights?.avgDaysOnMarket).toBe(45);
      expect(result.marketInsights?.trend).toBe('rising');
      expect(result.marketInsights?.priceEvolution).toBeCloseTo(6.25, 1);
    });
  });

  describe('comparePropertyPrice', () => {
    const mockEstimatedPrices: CasafariEstimatedPrices = {
      estimatedPrice: 250000,
      confidence: 85,
      priceRangeLow: 240000,
      priceRangeHigh: 260000,
      estimatedPricePerSqm: 2941,
      comparablesCount: 10,
    };

    it('should compare property priced below market', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEstimatedPrices }),
      });

      const request: CasafariValuationRequest = {
        location: { latitude: 38.7223, longitude: -9.1393 },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: { netArea: 85 },
      };

      const result = await service.comparePropertyPrice(request, 220000);

      expect(result.position).toBe('below');
      expect(result.askingPrice).toBe(220000);
      expect(result.estimatedPrice).toBe(250000);
      expect(result.difference).toBe(-30000);
      expect(result.differencePercentage).toBeCloseTo(-12, 0);
      expect(result.recommendation).toContain('below market value');
      expect(result.confidence).toBe(85);
    });

    it('should compare property priced at market', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEstimatedPrices }),
      });

      const request: CasafariValuationRequest = {
        location: { latitude: 38.7223, longitude: -9.1393 },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: { netArea: 85 },
      };

      const result = await service.comparePropertyPrice(request, 252000);

      expect(result.position).toBe('at');
      expect(result.differencePercentage).toBeCloseTo(0.8, 1);
      expect(result.recommendation).toContain('market value');
    });

    it('should compare property priced above market', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEstimatedPrices }),
      });

      const request: CasafariValuationRequest = {
        location: { latitude: 38.7223, longitude: -9.1393 },
        propertyType: 'apartment',
        transactionType: 'sale',
        characteristics: { netArea: 85 },
      };

      const result = await service.comparePropertyPrice(request, 280000);

      expect(result.position).toBe('above');
      expect(result.differencePercentage).toBeCloseTo(12, 0);
      expect(result.recommendation).toContain('above market value');
      expect(result.recommendation).toContain('negotiating');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const filters: CasafariComparablesFilters = {
        location: { center: { latitude: 38.7223, longitude: -9.1393, radius: 1000 } },
        propertyType: ['apartment'],
      };

      await expect(service.searchComparables(filters)).rejects.toThrow(CasafariApiError);
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const error = new Error('Timeout');
            error.name = 'AbortError';
            setTimeout(() => reject(error), 100);
          })
      );

      const filters: CasafariComparablesFilters = {
        location: {},
        propertyType: ['apartment'],
      };

      await expect(service.searchComparables(filters)).rejects.toThrow('Request timeout');
    });
  });

  describe('createCasafariValuationService factory', () => {
    it('should create service with environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';

      const service = createCasafariValuationService();
      expect(service).toBeInstanceOf(CasafariValuationService);

      delete process.env.CASAFARI_API_KEY;
    });

    it('should create service with provided config', () => {
      const service = createCasafariValuationService({
        apiKey: 'config-api-key',
        baseUrl: 'https://custom.api.com',
      });

      expect(service).toBeInstanceOf(CasafariValuationService);
    });

    it('should throw error if no API key provided', () => {
      delete process.env.CASAFARI_API_KEY;

      expect(() => createCasafariValuationService()).toThrow('Casafari API key is required');
    });
  });
});
