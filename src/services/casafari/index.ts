/**
 * Casafari API Service
 * Integrates with Casafari API for property data
 * Documentation: https://docs.api.casafari.com
 */

import type {
  CasafariProperty,
  CasafariListResponse,
  CasafariSearchParams,
  CasafariServiceConfig,
  ServiceResponse,
  CanonicalProperty,
} from './types';
import { transformCasafariProperty, transformCasafariProperties, validateCasafariProperty } from './transformer';
import { casafariCache } from './cache';

const DEFAULT_BASE_URL = 'https://api.casafari.com/v1';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_CACHE_TTL = 300; // 5 minutes

export class CasafariService {
  private config: Required<CasafariServiceConfig>;
  private isDevelopment: boolean;

  constructor(config: CasafariServiceConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      enableCache: config.enableCache !== false,
      cacheTtl: config.cacheTtl || DEFAULT_CACHE_TTL,
    };

    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Makes an authenticated request to Casafari API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Casafari API request error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get cached data or fetch from API
   */
  private async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<ServiceResponse<T>>
  ): Promise<ServiceResponse<T>> {
    if (this.config.enableCache) {
      const cached = casafariCache.get<T>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date(),
        };
      }
    }

    const response = await fetchFn();

    if (response.success && response.data && this.config.enableCache) {
      casafariCache.set(cacheKey, response.data, this.config.cacheTtl);
    }

    return response;
  }

  /**
   * Returns mock data for development/testing
   */
  private getMockProperties(): CasafariProperty[] {
    return [
      {
        id: 'mock-001',
        reference: 'CASA-001',
        title: 'Apartamento T3 em Lisboa - Mock',
        description: 'Apartamento moderno com vista para o Tejo (dados mock)',
        type: 'apartment',
        operation: 'sale',
        price: 450000,
        currency: 'EUR',
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        location: {
          address: 'Avenida da Liberdade',
          city: 'Lisboa',
          district: 'Lisboa',
          country: 'Portugal',
          coordinates: {
            latitude: 38.7223,
            longitude: -9.1393,
          },
        },
        images: [
          'https://via.placeholder.com/800x600?text=Mock+Image+1',
          'https://via.placeholder.com/800x600?text=Mock+Image+2',
        ],
        features: ['Varanda', 'Garagem', 'Aquecimento central'],
        energyRating: 'B',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://www.casafari.com/property/mock-001',
        agent: {
          name: 'Agente Mock',
          phone: '+351 910 000 000',
          email: 'mock@example.com',
        },
      },
      {
        id: 'mock-002',
        reference: 'CASA-002',
        title: 'Moradia T4 no Porto - Mock',
        description: 'Moradia espaçosa com jardim (dados mock)',
        type: 'house',
        operation: 'sale',
        price: 650000,
        currency: 'EUR',
        area: 200,
        bedrooms: 4,
        bathrooms: 3,
        location: {
          address: 'Rua de Santa Catarina',
          city: 'Porto',
          district: 'Porto',
          country: 'Portugal',
          coordinates: {
            latitude: 41.1579,
            longitude: -8.6291,
          },
        },
        images: [
          'https://via.placeholder.com/800x600?text=Mock+House',
        ],
        features: ['Jardim', 'Piscina', 'Garagem para 2 carros'],
        energyRating: 'A',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: 'https://www.casafari.com/property/mock-002',
      },
    ];
  }

  /**
   * List properties with pagination
   */
  async listProperties(
    page: number = 1,
    perPage: number = 20
  ): Promise<ServiceResponse<CanonicalProperty[]>> {
    // Mock fallback for development without API key
    if (!this.config.apiKey || this.config.apiKey === 'mock') {
      const mockData = this.getMockProperties();
      const canonicalData = transformCasafariProperties(mockData);
      
      return {
        success: true,
        data: canonicalData,
        timestamp: new Date(),
      };
    }

    const cacheKey = `list:${page}:${perPage}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      const endpoint = `/properties?page=${page}&per_page=${perPage}`;
      const response = await this.makeRequest<CasafariListResponse>(endpoint);

      if (!response.success || !response.data) {
        return response as ServiceResponse<CanonicalProperty[]>;
      }

      const validProperties = response.data.data.filter(validateCasafariProperty);
      const canonicalData = transformCasafariProperties(validProperties);

      return {
        success: true,
        data: canonicalData,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Get details of a specific property by ID
   */
  async getPropertyDetails(propertyId: string): Promise<ServiceResponse<CanonicalProperty>> {
    // Mock fallback
    if (!this.config.apiKey || this.config.apiKey === 'mock') {
      const mockData = this.getMockProperties().find(p => p.id === propertyId);
      
      if (!mockData) {
        return {
          success: false,
          error: 'Property not found (mock)',
          timestamp: new Date(),
        };
      }

      const canonicalData = transformCasafariProperty(mockData);
      
      return {
        success: true,
        data: canonicalData,
        timestamp: new Date(),
      };
    }

    const cacheKey = `property:${propertyId}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      const endpoint = `/properties/${propertyId}`;
      const response = await this.makeRequest<CasafariProperty>(endpoint);

      if (!response.success || !response.data) {
        return response as ServiceResponse<CanonicalProperty>;
      }

      if (!validateCasafariProperty(response.data)) {
        return {
          success: false,
          error: 'Invalid property data received',
          timestamp: new Date(),
        };
      }

      const canonicalData = transformCasafariProperty(response.data);

      return {
        success: true,
        data: canonicalData,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Search properties with filters
   */
  async searchProperties(
    params: CasafariSearchParams
  ): Promise<ServiceResponse<CanonicalProperty[]>> {
    // Mock fallback
    if (!this.config.apiKey || this.config.apiKey === 'mock') {
      let mockData = this.getMockProperties();

      // Apply basic filters to mock data
      if (params.city) {
        mockData = mockData.filter(p => 
          p.location.city.toLowerCase().includes(params.city.toLowerCase())
        );
      }
      if (params.minPrice) {
        mockData = mockData.filter(p => p.price >= params.minPrice);
      }
      if (params.maxPrice) {
        mockData = mockData.filter(p => p.price <= params.maxPrice);
      }
      if (params.bedrooms) {
        mockData = mockData.filter(p => p.bedrooms === params.bedrooms);
      }
      if (params.operation) {
        mockData = mockData.filter(p => p.operation === params.operation);
      }

      const canonicalData = transformCasafariProperties(mockData);
      
      return {
        success: true,
        data: canonicalData,
        timestamp: new Date(),
      };
    }

    const cacheKey = `search:${JSON.stringify(params)}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      const endpoint = `/properties/search?${queryParams.toString()}`;
      const response = await this.makeRequest<CasafariListResponse>(endpoint);

      if (!response.success || !response.data) {
        return response as ServiceResponse<CanonicalProperty[]>;
      }

      const validProperties = response.data.data.filter(validateCasafariProperty);
      const canonicalData = transformCasafariProperties(validProperties);

      return {
        success: true,
        data: canonicalData,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    casafariCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return {
      size: casafariCache.size(),
    };
  }
}

/**
 * Factory function to create CasafariService instance
 */
export function createCasafariService(config?: Partial<CasafariServiceConfig>): CasafariService {
  const apiKey = config?.apiKey || process.env.CASAFARI_API_KEY || 'mock';
  
  return new CasafariService({
    apiKey,
    ...config,
  });
}
