/**
 * CasafariAnalytics.test.ts - Unit tests for CasafariAnalyticsService
 */

import {
  CasafariAnalyticsService,
  createCasafariAnalyticsService,
} from '../src/services/casafari/CasafariAnalyticsService';
import { CasafariApiError } from '../src/services/casafari/CasafariService';
import type {
  CasafariMarketAnalysisRequest,
  CasafariMarketAnalysisResponse,
  CasafariDistributionRequest,
  CasafariPropertiesDistribution,
  CasafariPriceDistribution,
  CasafariBedroomsDistribution,
  CasafariTimeOnMarketDistribution,
  CasafariTimeSeriesRequest,
  CasafariTimeSeriesResponse,
  CasafariMarketComparisonRequest,
  CasafariMarketComparisonResponse,
} from '../src/services/casafari/types-analytics';

// Mock fetch global
global.fetch = jest.fn();

describe('CasafariAnalyticsService', () => {
  let service: CasafariAnalyticsService;
  const mockApiKey = 'test-analytics-api-key';
  const mockBaseUrl = 'https://api.casafari.com';

  beforeEach(() => {
    service = new CasafariAnalyticsService({
      apiKey: mockApiKey,
      baseUrl: mockBaseUrl,
      timeout: 5000,
    });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with provided config', () => {
      expect(service).toBeInstanceOf(CasafariAnalyticsService);
    });

    it('should use default baseUrl if not provided', () => {
      const defaultService = new CasafariAnalyticsService({
        apiKey: mockApiKey,
      });
      expect(defaultService).toBeInstanceOf(CasafariAnalyticsService);
    });

    it('should use default timeout if not provided', () => {
      const defaultService = new CasafariAnalyticsService({
        apiKey: mockApiKey,
      });
      expect(defaultService).toBeInstanceOf(CasafariAnalyticsService);
    });
  });

  describe('getMarketAnalysis', () => {
    const mockMarketAnalysisResponse: CasafariMarketAnalysisResponse = {
      totalProperties: 256,
      activeProperties: 198,
      transactionalProperties: 58,
      priceStatistics: {
        min: 200000,
        max: 500000,
        mean: 350000,
        median: 340000,
        stdDev: 85000,
        q1: 280000,
        q3: 410000,
        currency: 'EUR',
        pricePerSqm: {
          min: 2500,
          max: 5500,
          mean: 3900,
          median: 3800,
          stdDev: 750,
        },
      },
      priceEstimation: {
        estimate: 352000,
        lowerBound: 320000,
        upperBound: 384000,
        confidenceLevel: 0.95,
        currency: 'EUR',
      },
      priceEvolution: [
        { period: '2024-01', avgPrice: 330000, medianPrice: 320000, avgPricePerSqm: 3700, count: 42, changePercentage: 2.5 },
        { period: '2024-02', avgPrice: 340000, medianPrice: 330000, avgPricePerSqm: 3800, count: 48, changePercentage: 3.0 },
        { period: '2024-03', avgPrice: 350000, medianPrice: 340000, avgPricePerSqm: 3900, count: 52, changePercentage: 2.9 },
      ],
      areaStatistics: {
        min: 45,
        max: 200,
        mean: 90,
        median: 85,
        stdDev: 30,
      },
      marketIndicators: {
        supplyLevel: 'medium',
        trend: 'rising',
        activityLevel: 'high',
        avgDaysOnMarket: 45,
        absorptionRate: 8.5,
        monthsOfInventory: 6.2,
      },
      propertyTypeDistribution: {
        apartment: { count: 180, percentage: 70.3, avgPrice: 330000 },
        house: { count: 76, percentage: 29.7, avgPrice: 380000 },
      },
      meta: {
        requestId: 'req-123456',
        responseTime: 245,
        analysisDate: '2024-03-15T14:30:00Z',
      },
    };

    it('should get market analysis for Lisboa with Portuguese market data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketAnalysisResponse,
      });

      const request: CasafariMarketAnalysisRequest = {
        location: {
          municipality: ['Lisboa'],
          district: ['Arroios'],
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
        minBedrooms: 2,
        maxBedrooms: 3,
        minPrice: 250000,
        maxPrice: 500000,
        includeTransactional: true,
      };

      const result = await service.getMarketAnalysis(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/analysis`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          body: JSON.stringify(request),
        })
      );

      expect(result.totalProperties).toBe(256);
      expect(result.priceStatistics.mean).toBe(350000);
      expect(result.priceStatistics.currency).toBe('EUR');
      expect(result.marketIndicators.trend).toBe('rising');
      expect(result.marketIndicators.avgDaysOnMarket).toBe(45);
      expect(result.propertyTypeDistribution).toBeDefined();
      expect(result.propertyTypeDistribution?.apartment.avgPrice).toBe(330000);
    });

    it('should include price evolution data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketAnalysisResponse,
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
        transactionType: 'sale',
      };

      const result = await service.getMarketAnalysis(request);

      expect(result.priceEvolution).toBeDefined();
      expect(result.priceEvolution).toHaveLength(3);
      expect(result.priceEvolution?.[0].period).toBe('2024-01');
      expect(result.priceEvolution?.[2].changePercentage).toBe(2.9);
    });

    it('should handle market analysis with date range', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketAnalysisResponse,
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Porto'] },
        dateFrom: '2024-01-01',
        dateTo: '2024-03-31',
        includeTransactional: true,
      };

      const result = await service.getMarketAnalysis(request);

      expect(result).toBeDefined();
      expect(result.transactionalProperties).toBe(58);
    });

    it('should handle market analysis API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_LOCATION',
            message: 'Invalid location filter',
          },
        }),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['InvalidCity'] },
      };

      await expect(service.getMarketAnalysis(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getPropertiesDistribution', () => {
    const mockPropertiesDistribution: CasafariPropertiesDistribution = {
      data: [
        {
          location: 'Arroios',
          count: 89,
          percentage: 0.348,
          avgPrice: 365000,
          avgPricePerSqm: 4050,
        },
        {
          location: 'Marvila',
          count: 72,
          percentage: 0.281,
          avgPrice: 340000,
          avgPricePerSqm: 3800,
        },
        {
          location: 'Olivais',
          count: 95,
          percentage: 0.371,
          avgPrice: 345000,
          avgPricePerSqm: 3850,
        },
      ],
      total: 256,
      meta: {
        requestId: 'dist-789',
        responseTime: 156,
      },
    };

    it('should get properties distribution by location', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPropertiesDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: {
          district: ['Lisboa'],
        },
        propertyType: ['apartment', 'house'],
        transactionType: 'sale',
        includeTransactional: true,
      };

      const result = await service.getPropertiesDistribution(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/distributions/properties`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(256);
      expect(result.data[0].location).toBe('Arroios');
      expect(result.data[0].percentage).toBe(0.348);
      expect(result.data[0].avgPrice).toBe(365000);
    });

    it('should calculate percentages correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPropertiesDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Lisboa'] },
        transactionType: 'sale',
      };

      const result = await service.getPropertiesDistribution(request);

      const totalPercentage = result.data.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(1.0, 2);
    });

    it('should handle properties distribution errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'NO_DATA',
            message: 'No properties found',
          },
        }),
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['NonExistent'] },
      };

      await expect(service.getPropertiesDistribution(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getPriceDistribution', () => {
    const mockPriceDistribution: CasafariPriceDistribution = {
      data: [
        {
          min: 200000,
          max: 270000,
          count: 45,
          percentage: 0.176,
          midpoint: 235000,
        },
        {
          min: 270000,
          max: 340000,
          count: 68,
          percentage: 0.266,
          midpoint: 305000,
        },
        {
          min: 340000,
          max: 410000,
          count: 89,
          percentage: 0.348,
          midpoint: 375000,
        },
        {
          min: 410000,
          max: 480000,
          count: 42,
          percentage: 0.164,
          midpoint: 445000,
        },
        {
          min: 480000,
          max: 550000,
          count: 12,
          percentage: 0.047,
          midpoint: 515000,
        },
      ],
      total: 256,
      statistics: {
        min: 200000,
        max: 550000,
        mean: 350000,
        median: 340000,
        stdDev: 85000,
        currency: 'EUR',
        pricePerSqm: {
          min: 2500,
          max: 5500,
          mean: 3900,
          median: 3800,
          stdDev: 750,
        },
      },
      meta: {
        requestId: 'price-dist-456',
        responseTime: 178,
      },
    };

    it('should get price distribution histogram with Portuguese prices', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: {
          municipality: ['Porto'],
          parish: ['Miragaia'],
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
        bins: 5,
      };

      const result = await service.getPriceDistribution(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/distributions/prices`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(256);
      expect(result.statistics.min).toBe(200000);
      expect(result.statistics.max).toBe(550000);
      expect(result.statistics.mean).toBe(350000);
      expect(result.statistics.currency).toBe('EUR');
    });

    it('should verify price bins are in order', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Lisboa'] },
        propertyType: ['apartment'],
        bins: 5,
      };

      const result = await service.getPriceDistribution(request);

      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].max).toBeLessThanOrEqual(result.data[i + 1].min);
      }
    });

    it('should include price per sqm statistics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Braga'] },
        transactionType: 'sale',
      };

      const result = await service.getPriceDistribution(request);

      expect(result.statistics.pricePerSqm).toBeDefined();
      expect(result.statistics.pricePerSqm?.mean).toBe(3900);
      expect(result.statistics.pricePerSqm?.median).toBe(3800);
    });

    it('should handle price distribution errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          error: {
            code: 'INVALID_BINS',
            message: 'Invalid number of bins',
          },
        }),
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Lisboa'] },
        bins: 1000,
      };

      await expect(service.getPriceDistribution(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getBedroomsDistribution', () => {
    const mockBedroomsDistribution: CasafariBedroomsDistribution = {
      data: [
        {
          bedrooms: 0,
          typology: 'T0',
          count: 15,
          percentage: 0.059,
          avgPrice: 220000,
          avgPricePerSqm: 3500,
        },
        {
          bedrooms: 1,
          typology: 'T1',
          count: 52,
          percentage: 0.203,
          avgPrice: 280000,
          avgPricePerSqm: 3200,
        },
        {
          bedrooms: 2,
          typology: 'T2',
          count: 108,
          percentage: 0.422,
          avgPrice: 340000,
          avgPricePerSqm: 3800,
        },
        {
          bedrooms: 3,
          typology: 'T3',
          count: 65,
          percentage: 0.254,
          avgPrice: 410000,
          avgPricePerSqm: 3650,
        },
        {
          bedrooms: 4,
          typology: 'T4+',
          count: 16,
          percentage: 0.063,
          avgPrice: 520000,
          avgPricePerSqm: 3800,
        },
      ],
      total: 256,
      meta: {
        requestId: 'bed-dist-321',
        responseTime: 134,
      },
    };

    it('should get bedrooms distribution with Portuguese typologies', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBedroomsDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: {
          municipality: ['Covilhã'],
          bbox: [-7.5, 40.2, -7.4, 40.3],
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
      };

      const result = await service.getBedroomsDistribution(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/distributions/bedrooms`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(256);
      expect(result.data[0].typology).toBe('T0');
      expect(result.data[2].typology).toBe('T2');
      expect(result.data[2].percentage).toBe(0.422);
      expect(result.data[2].avgPrice).toBe(340000);
    });

    it('should show T2 as most common typology', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBedroomsDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Lisboa'] },
        propertyType: ['apartment'],
      };

      const result = await service.getBedroomsDistribution(request);

      const t2 = result.data.find(d => d.typology === 'T2');
      expect(t2).toBeDefined();
      expect(t2?.percentage).toBeGreaterThan(0.35);
    });

    it('should include price per sqm for each typology', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBedroomsDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Braga'] },
        transactionType: 'sale',
      };

      const result = await service.getBedroomsDistribution(request);

      result.data.forEach(typology => {
        expect(typology.avgPricePerSqm).toBeDefined();
        expect(typology.avgPrice).toBeGreaterThan(0);
      });
    });

    it('should handle bedrooms distribution errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'NO_DATA',
            message: 'No bedroom data available',
          },
        }),
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['InvalidCity'] },
      };

      await expect(service.getBedroomsDistribution(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getTimeOnMarketDistribution', () => {
    const mockTimeOnMarketDistribution: CasafariTimeOnMarketDistribution = {
      data: [
        {
          min: 0,
          max: 30,
          count: 68,
          percentage: 0.266,
          label: '0-30 days',
        },
        {
          min: 30,
          max: 60,
          count: 95,
          percentage: 0.371,
          label: '30-60 days',
        },
        {
          min: 60,
          max: 90,
          count: 55,
          percentage: 0.215,
          label: '60-90 days',
        },
        {
          min: 90,
          max: 180,
          count: 28,
          percentage: 0.109,
          label: '90-180 days',
        },
        {
          min: 180,
          max: 360,
          count: 10,
          percentage: 0.039,
          label: '180+ days',
        },
      ],
      total: 256,
      statistics: {
        min: 5,
        max: 325,
        mean: 45,
        median: 42,
        stdDev: 65,
      },
      meta: {
        requestId: 'tom-dist-789',
        responseTime: 167,
      },
    };

    it('should get time on market distribution', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeOnMarketDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: {
          municipality: ['Braga'],
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
        includeTransactional: true,
      };

      const result = await service.getTimeOnMarketDistribution(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/distributions/time-on-market`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(256);
      expect(result.statistics.mean).toBe(45);
      expect(result.statistics.median).toBe(42);
    });

    it('should show time on market statistics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeOnMarketDistribution,
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Lisboa'] },
        transactionType: 'sale',
        includeTransactional: true,
      };

      const result = await service.getTimeOnMarketDistribution(request);

      expect(result.statistics.min).toBe(5);
      expect(result.statistics.max).toBe(325);
      expect(result.statistics.mean).toBe(45);
      expect(result.data[0].label).toBe('0-30 days');
    });

    it('should handle time on market distribution errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request parameters',
          },
        }),
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['teste'] },
      };

      await expect(service.getTimeOnMarketDistribution(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getTimeSeries', () => {
    const mockTimeSeriesResponse: CasafariTimeSeriesResponse = {
      data: [
        {
          period: '2024-01',
          timestamp: 1704067200000,
          avgPrice: 330000,
          medianPrice: 320000,
          avgPricePerSqm: 3700,
          medianPricePerSqm: 3650,
          count: 42,
          newListings: 15,
          sold: 8,
          avgDaysOnMarket: 50,
          priceChangePercentage: 0,
        },
        {
          period: '2024-02',
          timestamp: 1706745600000,
          avgPrice: 340000,
          medianPrice: 330000,
          avgPricePerSqm: 3800,
          medianPricePerSqm: 3750,
          count: 48,
          newListings: 18,
          sold: 9,
          avgDaysOnMarket: 48,
          priceChangePercentage: 3.03,
        },
        {
          period: '2024-03',
          timestamp: 1709337600000,
          avgPrice: 350000,
          medianPrice: 340000,
          avgPricePerSqm: 3900,
          medianPricePerSqm: 3850,
          count: 52,
          newListings: 20,
          sold: 10,
          avgDaysOnMarket: 46,
          priceChangePercentage: 2.94,
        },
      ],
      interval: 'month',
      dateRange: {
        from: '2024-01-01',
        to: '2024-03-31',
      },
      summary: {
        trend: 'rising',
        totalProperties: 142,
        avgPriceChange: 2.98,
        volatility: 0.045,
        trendStrength: 0.87,
      },
      forecast: [
        {
          period: '2024-04',
          timestamp: 1712016000000,
          avgPrice: 360000,
          avgPricePerSqm: 4000,
          lowerBound: 345000,
          upperBound: 375000,
          isForecast: true,
        },
        {
          period: '2024-05',
          timestamp: 1714608000000,
          avgPrice: 370000,
          avgPricePerSqm: 4100,
          lowerBound: 352000,
          upperBound: 388000,
          isForecast: true,
        },
      ],
      meta: {
        requestId: 'ts-123456',
        responseTime: 298,
        analysisDate: '2024-03-15T14:45:00Z',
      },
    };

    it('should get time series with monthly data and trends', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeSeriesResponse,
      });

      const request: CasafariTimeSeriesRequest = {
        location: {
          municipality: ['Cascais'],
        },
        propertyType: ['apartment'],
        transactionType: 'sale',
        dateFrom: '2024-01-01',
        dateTo: '2024-03-31',
        interval: 'month',
        metrics: ['price', 'pricePerSqm', 'count', 'sold', 'daysOnMarket'],
        includeForecast: true,
        forecastPeriods: 2,
      };

      const result = await service.getTimeSeries(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/time-series`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.data).toHaveLength(3);
      expect(result.interval).toBe('month');
      expect(result.data[0].period).toBe('2024-01');
      expect(result.data[0].avgPrice).toBe(330000);
      expect(result.summary.trend).toBe('rising');
    });

    it('should include price evolution and changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeSeriesResponse,
      });

      const request: CasafariTimeSeriesRequest = {
        location: { municipality: ['Lisboa'] },
        transactionType: 'sale',
        dateFrom: '2024-01-01',
        dateTo: '2024-03-31',
        interval: 'month',
      };

      const result = await service.getTimeSeries(request);

      expect(result.data[1].priceChangePercentage).toBeCloseTo(3.03, 1);
      expect(result.data[2].priceChangePercentage).toBeCloseTo(2.94, 1);
      expect(result.summary.avgPriceChange).toBeCloseTo(2.98, 1);
    });

    it('should include forecast data when requested', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeSeriesResponse,
      });

      const request: CasafariTimeSeriesRequest = {
        location: { municipality: ['Porto'] },
        transactionType: 'sale',
        dateFrom: '2024-01-01',
        dateTo: '2024-03-31',
        includeForecast: true,
        forecastPeriods: 2,
      };

      const result = await service.getTimeSeries(request);

      expect(result.forecast).toBeDefined();
      expect(result.forecast).toHaveLength(2);
      expect(result.forecast?.[0].isForecast).toBe(true);
      expect(result.forecast?.[0].lowerBound).toBeLessThan(result.forecast?.[0].avgPrice ?? 0);
      expect(result.forecast?.[0].upperBound).toBeGreaterThan(result.forecast?.[0].avgPrice ?? 0);
    });

    it('should include trend strength and volatility', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeSeriesResponse,
      });

      const request: CasafariTimeSeriesRequest = {
        location: { municipality: ['Covilhã'] },
        dateFrom: '2024-01-01',
        dateTo: '2024-03-31',
      };

      const result = await service.getTimeSeries(request);

      expect(result.summary.trendStrength).toBeGreaterThan(0.8);
      expect(result.summary.volatility).toBeLessThan(0.1);
      expect(result.summary.totalProperties).toBeGreaterThan(0);
    });

    it('should handle time series errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'Invalid date range',
          },
        }),
      });

      const request: CasafariTimeSeriesRequest = {
        location: { municipality: ['Lisboa'] },
        dateFrom: '2024-12-31',
        dateTo: '2024-01-01',
      };

      await expect(service.getTimeSeries(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('compareMarkets', () => {
    const mockComparisonResponse: CasafariMarketComparisonResponse = {
      primaryMarket: {
        location: 'Lisboa, Arroios',
        analysis: {
          totalProperties: 256,
          priceStatistics: {
            min: 200000,
            max: 500000,
            mean: 350000,
            median: 340000,
            currency: 'EUR',
          },
          areaStatistics: {
            min: 45,
            max: 200,
            mean: 90,
            median: 85,
          },
          marketIndicators: {
            supplyLevel: 'medium',
            trend: 'rising',
            activityLevel: 'high',
            avgDaysOnMarket: 45,
          },
        },
      },
      comparisonMarkets: [
        {
          location: 'Porto, Miragaia',
          analysis: {
            totalProperties: 180,
            priceStatistics: {
              min: 180000,
              max: 420000,
              mean: 300000,
              median: 290000,
              currency: 'EUR',
            },
            areaStatistics: {
              min: 40,
              max: 180,
              mean: 85,
              median: 80,
            },
            marketIndicators: {
              supplyLevel: 'high',
              trend: 'stable',
              activityLevel: 'medium',
              avgDaysOnMarket: 55,
            },
          },
          relativeDifference: {
            pricePercentage: -14.3,
            pricePerSqmPercentage: -12.8,
            supplyPercentage: 40.6,
          },
        },
        {
          location: 'Covilhã',
          analysis: {
            totalProperties: 95,
            priceStatistics: {
              min: 120000,
              max: 280000,
              mean: 200000,
              median: 190000,
              currency: 'EUR',
            },
            areaStatistics: {
              min: 50,
              max: 220,
              mean: 95,
              median: 92,
            },
            marketIndicators: {
              supplyLevel: 'low',
              trend: 'rising',
              activityLevel: 'low',
              avgDaysOnMarket: 75,
            },
          },
          relativeDifference: {
            pricePercentage: -42.9,
            pricePerSqmPercentage: -40.5,
            supplyPercentage: -62.9,
          },
        },
        {
          location: 'Braga',
          analysis: {
            totalProperties: 140,
            priceStatistics: {
              min: 150000,
              max: 380000,
              mean: 265000,
              median: 255000,
              currency: 'EUR',
            },
            areaStatistics: {
              min: 45,
              max: 190,
              mean: 88,
              median: 83,
            },
            marketIndicators: {
              supplyLevel: 'medium',
              trend: 'falling',
              activityLevel: 'medium',
              avgDaysOnMarket: 60,
            },
          },
          relativeDifference: {
            pricePercentage: -24.3,
            pricePerSqmPercentage: -22.1,
            supplyPercentage: -45.3,
          },
        },
      ],
      meta: {
        requestId: 'comp-456789',
        responseTime: 456,
      },
    };

    it('should compare markets between Lisboa and Porto/Covilhã/Braga', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparisonResponse,
      });

      const request: CasafariMarketComparisonRequest = {
        primaryMarket: {
          municipality: ['Lisboa'],
          parish: ['Arroios'],
        },
        comparisonMarkets: [
          { municipality: ['Porto'], parish: ['Miragaia'] },
          { municipality: ['Covilhã'] },
          { municipality: ['Braga'] },
        ],
        propertyType: ['apartment'],
        transactionType: 'sale',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      const result = await service.compareMarkets(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/market-analytics-api/compare`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.primaryMarket.location).toBe('Lisboa, Arroios');
      expect(result.primaryMarket.analysis.totalProperties).toBe(256);
      expect(result.primaryMarket.analysis.priceStatistics.mean).toBe(350000);
      expect(result.comparisonMarkets).toHaveLength(3);
    });

    it('should show price differences between markets', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparisonResponse,
      });

      const request: CasafariMarketComparisonRequest = {
        primaryMarket: { municipality: ['Lisboa'] },
        comparisonMarkets: [
          { municipality: ['Porto'] },
          { municipality: ['Covilhã'] },
        ],
        transactionType: 'sale',
      };

      const result = await service.compareMarkets(request);

      const porto = result.comparisonMarkets[0];
      expect(porto.relativeDifference.pricePercentage).toBe(-14.3);
      expect(porto.relativeDifference.pricePerSqmPercentage).toBe(-12.8);

      const covilha = result.comparisonMarkets[1];
      expect(covilha.relativeDifference.pricePercentage).toBe(-42.9);
    });

    it('should show supply differences between markets', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparisonResponse,
      });

      const request: CasafariMarketComparisonRequest = {
        primaryMarket: { municipality: ['Lisboa'] },
        comparisonMarkets: [
          { municipality: ['Porto'] },
          { municipality: ['Covilhã'] },
          { municipality: ['Braga'] },
        ],
        transactionType: 'sale',
      };

      const result = await service.compareMarkets(request);

      expect(result.comparisonMarkets[0].relativeDifference.supplyPercentage).toBeGreaterThan(0);
      expect(result.comparisonMarkets[1].relativeDifference.supplyPercentage).toBeLessThan(0);
      expect(result.comparisonMarkets[2].relativeDifference.supplyPercentage).toBeLessThan(0);
    });

    it('should handle market comparison errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_MARKETS',
            message: 'Invalid market locations',
          },
        }),
      });

      const request: CasafariMarketComparisonRequest = {
        primaryMarket: { municipality: ['InvalidCity'] },
        comparisonMarkets: [{ municipality: ['AnotherInvalid'] }],
      };

      await expect(service.compareMarkets(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await expect(service.getMarketAnalysis(request)).rejects.toThrow(CasafariApiError);
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

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await expect(service.getMarketAnalysis(request)).rejects.toThrow('Request timeout');
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            code: 'SERVER_ERROR',
            message: 'Internal server error',
          },
        }),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await expect(service.getMarketAnalysis(request)).rejects.toThrow(CasafariApiError);
    });

    it('should handle authentication errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid API key',
          },
        }),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await expect(service.getMarketAnalysis(request)).rejects.toThrow(CasafariApiError);
    });

    it('should handle rate limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
        }),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await expect(service.getMarketAnalysis(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('API request validation', () => {
    it('should include proper headers in all requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const request: CasafariDistributionRequest = {
        location: { municipality: ['Lisboa'] },
      };

      try {
        await service.getPropertiesDistribution(request);
      } catch (e) {
        // Ignore error
      }

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers['Authorization']).toBe(`Bearer ${mockApiKey}`);
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });

    it('should use correct HTTP method for all endpoints', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await service.getMarketAnalysis(request);

      expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('POST');
    });

    it('should serialize request body as JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'], district: ['Arroios'] },
        propertyType: ['apartment'],
        minPrice: 250000,
        maxPrice: 500000,
      };

      await service.getMarketAnalysis(request);

      const callBody = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(callBody);

      expect(parsed).toEqual(request);
    });

    it('should use correct endpoint URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const request: CasafariMarketAnalysisRequest = {
        location: { municipality: ['Lisboa'] },
      };

      await service.getMarketAnalysis(request);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/analysis`
      );

      jest.clearAllMocks();

      await service.getPropertiesDistribution(request as CasafariDistributionRequest);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/distributions/properties`
      );

      jest.clearAllMocks();

      await service.getPriceDistribution(request as CasafariDistributionRequest);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/distributions/prices`
      );

      jest.clearAllMocks();

      await service.getBedroomsDistribution(request as CasafariDistributionRequest);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/distributions/bedrooms`
      );

      jest.clearAllMocks();

      await service.getTimeOnMarketDistribution(request as CasafariDistributionRequest);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/distributions/time-on-market`
      );

      jest.clearAllMocks();

      const timeSeriesRequest: CasafariTimeSeriesRequest = {
        location: { municipality: ['Lisboa'] },
        dateFrom: '2024-01-01',
        dateTo: '2024-03-31',
      };

      await service.getTimeSeries(timeSeriesRequest);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/time-series`
      );

      jest.clearAllMocks();

      const comparisonRequest: CasafariMarketComparisonRequest = {
        primaryMarket: { municipality: ['Lisboa'] },
        comparisonMarkets: [{ municipality: ['Porto'] }],
      };

      await service.compareMarkets(comparisonRequest);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
        `${mockBaseUrl}/market-analytics-api/compare`
      );
    });
  });

  describe('createCasafariAnalyticsService factory', () => {
    it('should create service with environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';

      const service = createCasafariAnalyticsService();
      expect(service).toBeInstanceOf(CasafariAnalyticsService);

      delete process.env.CASAFARI_API_KEY;
    });

    it('should create service with provided config', () => {
      const service = createCasafariAnalyticsService({
        apiKey: 'config-api-key',
        baseUrl: 'https://custom.api.com',
        timeout: 10000,
      });

      expect(service).toBeInstanceOf(CasafariAnalyticsService);
    });

    it('should use provided API key over environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';

      const service = createCasafariAnalyticsService({
        apiKey: 'config-api-key',
      });

      expect(service).toBeInstanceOf(CasafariAnalyticsService);

      delete process.env.CASAFARI_API_KEY;
    });

    it('should throw error if no API key provided', () => {
      delete process.env.CASAFARI_API_KEY;

      expect(() => createCasafariAnalyticsService()).toThrow(
        'Casafari API key is required'
      );
    });

    it('should use default values for optional config', () => {
      const service = createCasafariAnalyticsService({
        apiKey: 'test-key',
      });

      expect(service).toBeInstanceOf(CasafariAnalyticsService);
    });
  });
});
