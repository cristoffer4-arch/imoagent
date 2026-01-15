/**
 * CasafariService.test.ts - Testes unitários para CasafariService
 */

import { CasafariService, CasafariApiError, createCasafariService } from '../src/services/casafari/CasafariService';
import type { CasafariSearchFilters, CasafariListResponse, CasafariDetailResponse } from '../src/services/casafari/types';
import { PropertyType } from '../src/models/PropertyCanonicalModel';

// Mock fetch global
global.fetch = jest.fn();

describe('CasafariService', () => {
  let service: CasafariService;
  const mockApiKey = 'test-api-key-123';
  const mockBaseUrl = 'https://api.casafari.com/v1';

  beforeEach(() => {
    service = new CasafariService({
      apiKey: mockApiKey,
      baseUrl: mockBaseUrl,
      timeout: 5000,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('constructor', () => {
    it('should create service with provided config', () => {
      expect(service).toBeInstanceOf(CasafariService);
    });

    it('should use default baseUrl if not provided', () => {
      const defaultService = new CasafariService({
        apiKey: mockApiKey,
      });
      expect(defaultService).toBeInstanceOf(CasafariService);
    });
  });

  describe('listProperties', () => {
    const mockListResponse: CasafariListResponse = {
      data: [
        {
          id: 'prop-1',
          propertyType: 'apartment',
          transactionType: 'sale',
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
          },
          characteristics: {
            netArea: 85,
            bedrooms: 2,
            bathrooms: 1,
          },
        },
        {
          id: 'prop-2',
          propertyType: 'house',
          transactionType: 'sale',
          location: {
            municipality: 'Porto',
            district: 'Porto',
            country: 'Portugal',
          },
          price: {
            value: 350000,
            currency: 'EUR',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    };

    it('should list properties without filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      const result = await service.listProperties(undefined, 'tenant-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/properties'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
          }),
        })
      );

      expect(result.properties).toHaveLength(2);
      expect(result.properties[0].type).toBe(PropertyType.APARTMENT);
      expect(result.properties[0].tenantId).toBe('tenant-123');
      expect(result.pagination).toEqual(mockListResponse.pagination);
    });

    it('should list properties with filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      const filters: CasafariSearchFilters = {
        municipality: 'Lisboa',
        minPrice: 200000,
        maxPrice: 300000,
        minBedrooms: 2,
        page: 1,
        limit: 10,
      };

      const result = await service.listProperties(filters, 'tenant-123', 'team-456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('municipality=Lisboa'),
        expect.any(Object)
      );

      expect(result.properties).toHaveLength(2);
      expect(result.properties[0].teamId).toBe('team-456');
    });

    it('should use cache on subsequent calls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      // Primeira chamada
      await service.listProperties(undefined, 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Segunda chamada (deve usar cache)
      await service.listProperties(undefined, 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if no tenantId provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      const result = await service.listProperties();

      expect(result.properties).toEqual([]);
      expect(result.pagination).toEqual(mockListResponse.pagination);
    });

    it('should handle API errors', async () => {
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

      await expect(service.listProperties()).rejects.toThrow(CasafariApiError);
      
      // Reset mock for second call
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
      
      await expect(service.listProperties()).rejects.toThrow('Invalid API key');
    });
  });

  describe('getPropertyDetails', () => {
    const mockDetailResponse: CasafariDetailResponse = {
      data: {
        id: 'prop-123',
        propertyType: 'apartment',
        transactionType: 'sale',
        location: {
          latitude: 38.7223,
          longitude: -9.1393,
          address: 'Rua do Comércio 123',
          postalCode: '1100-150',
          municipality: 'Lisboa',
          district: 'Lisboa',
          country: 'Portugal',
        },
        price: {
          value: 250000,
          currency: 'EUR',
        },
        characteristics: {
          netArea: 85,
          grossArea: 100,
          bedrooms: 2,
          bathrooms: 1,
          parkingSpaces: 1,
        },
        title: 'Apartamento T2 em Lisboa',
        description: 'Lindo apartamento com vista para o rio',
        images: [
          { url: 'https://example.com/img1.jpg', order: 0 },
        ],
      },
    };

    it('should get property details by id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetailResponse,
      });

      const property = await service.getPropertyDetails('prop-123', 'tenant-123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/properties/prop-123`,
        expect.any(Object)
      );

      expect(property).not.toBeNull();
      expect(property?.id).toBe('casafari_prop-123');
      expect(property?.type).toBe(PropertyType.APARTMENT);
      expect(property?.tenantId).toBe('tenant-123');
      expect(property?.title).toBe('Apartamento T2 em Lisboa');
    });

    it('should use cache on subsequent calls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetailResponse,
      });

      // Primeira chamada
      await service.getPropertyDetails('prop-123', 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Segunda chamada (deve usar cache)
      await service.getPropertyDetails('prop-123', 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return null if no tenantId provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetailResponse,
      });

      const property = await service.getPropertyDetails('prop-123');

      expect(property).toBeNull();
    });

    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'NOT_FOUND',
            message: 'Property not found',
          },
        }),
      });

      await expect(service.getPropertyDetails('invalid-id', 'tenant-123'))
        .rejects.toThrow(CasafariApiError);
    });
  });

  describe('searchProperties', () => {
    const mockSearchResponse: CasafariListResponse = {
      data: [
        {
          id: 'search-1',
          propertyType: 'house',
          transactionType: 'sale',
          location: {
            municipality: 'Cascais',
            district: 'Lisboa',
            country: 'Portugal',
          },
          price: {
            value: 500000,
            currency: 'EUR',
          },
          characteristics: {
            netArea: 150,
            bedrooms: 3,
            bathrooms: 2,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    it('should search properties with filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const filters: CasafariSearchFilters = {
        propertyType: ['house'],
        transactionType: 'sale',
        district: 'Lisboa',
        minBedrooms: 3,
        minPrice: 400000,
        maxPrice: 600000,
      };

      const result = await service.searchProperties(filters, 'tenant-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/properties/search'),
        expect.any(Object)
      );

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('district=Lisboa');
      expect(url).toContain('minBedrooms=3');
      expect(url).toContain('minPrice=400000');
      expect(url).toContain('maxPrice=600000');

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].type).toBe(PropertyType.HOUSE);
    });

    it('should handle multiple property types', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const filters: CasafariSearchFilters = {
        propertyType: ['apartment', 'house'],
      };

      await service.searchProperties(filters, 'tenant-123');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      // URL encoding: propertyType[] becomes propertyType%5B%5D
      expect(url).toContain('propertyType%5B%5D=apartment');
      expect(url).toContain('propertyType%5B%5D=house');
    });

    it('should handle sorting parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const filters: CasafariSearchFilters = {
        sortBy: 'price',
        sortOrder: 'asc',
      };

      await service.searchProperties(filters, 'tenant-123');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('sortBy=price');
      expect(url).toContain('sortOrder=asc');
    });
  });

  describe('cache management', () => {
    it('should clear all cache', async () => {
      const mockResponse: CasafariListResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Faz chamadas para popular cache
      await service.listProperties(undefined, 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Limpa cache
      service.clearCache();

      // Nova chamada deve fazer fetch novamente
      await service.listProperties(undefined, 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear expired cache entries', async () => {
      const mockResponse: CasafariListResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      // Cria serviço com TTL curto
      const shortTTLService = new CasafariService({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await shortTTLService.listProperties(undefined, 'tenant-123');
      
      // Simula expiração do cache (não há método público para isso,
      // mas o clearExpiredCache deve ser chamado)
      shortTTLService.clearExpiredCache();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      // Clear cache to ensure fresh request
      service.clearCache();
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.listProperties(undefined, 'tenant-123'))
        .rejects.toThrow(CasafariApiError);
      
      // Reset mock for second call
      service.clearCache();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(service.listProperties(undefined, 'tenant-123'))
        .rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      service.clearCache();
      
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => {
          const error = new Error('Timeout');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 100);
        })
      );

      await expect(service.listProperties(undefined, 'tenant-123'))
        .rejects.toThrow(CasafariApiError);
      
      // Reset for second call
      service.clearCache();
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => {
          const error = new Error('Timeout');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 100);
        })
      );
      
      await expect(service.listProperties(undefined, 'tenant-123'))
        .rejects.toThrow('Request timeout');
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(service.listProperties(undefined, 'tenant-123'))
        .rejects.toThrow(CasafariApiError);
    });
  });

  describe('createCasafariService factory', () => {
    it('should create service with environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';
      
      const service = createCasafariService();
      expect(service).toBeInstanceOf(CasafariService);
      
      delete process.env.CASAFARI_API_KEY;
    });

    it('should create service with provided config', () => {
      const service = createCasafariService({
        apiKey: 'config-api-key',
        baseUrl: 'https://custom.api.com',
      });
      
      expect(service).toBeInstanceOf(CasafariService);
    });

    it('should throw error if no API key provided', () => {
      delete process.env.CASAFARI_API_KEY;
      
      expect(() => createCasafariService()).toThrow('Casafari API key is required');
    });

    it('should prefer config over environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';
      
      const service = createCasafariService({
        apiKey: 'config-api-key',
      });
      
      expect(service).toBeInstanceOf(CasafariService);
      
      delete process.env.CASAFARI_API_KEY;
    });
  });
});

describe('CasafariApiError', () => {
  it('should create error with all properties', () => {
    const error = new CasafariApiError(
      'Test error',
      400,
      'BAD_REQUEST',
      { field: 'test' }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CasafariApiError');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.details).toEqual({ field: 'test' });
  });

  it('should create error with minimal properties', () => {
    const error = new CasafariApiError('Minimal error', 500);

    expect(error.message).toBe('Minimal error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});
