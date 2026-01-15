/**
 * Unit tests for Casafari Service
 */

import { CasafariService, createCasafariService } from '@/services/casafari';
import { transformCasafariProperty, transformCasafariProperties, validateCasafariProperty } from '@/services/casafari/transformer';
import { casafariCache } from '@/services/casafari/cache';
import type { CasafariProperty } from '@/services/casafari/types';

describe('CasafariService', () => {
  let service: CasafariService;

  beforeEach(() => {
    // Clear cache before each test
    casafariCache.clear();
    
    // Create service with mock API key
    service = createCasafariService({ apiKey: 'mock' });
  });

  afterEach(() => {
    casafariCache.clear();
  });

  describe('listProperties', () => {
    it('should return a list of properties', async () => {
      const response = await service.listProperties();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data!.length).toBeGreaterThan(0);
    });

    it('should return properties in canonical format', async () => {
      const response = await service.listProperties();

      expect(response.success).toBe(true);
      const firstProperty = response.data![0];
      
      expect(firstProperty).toHaveProperty('id');
      expect(firstProperty).toHaveProperty('source', 'casafari');
      expect(firstProperty).toHaveProperty('title');
      expect(firstProperty).toHaveProperty('price');
      expect(firstProperty).toHaveProperty('area');
      expect(firstProperty).toHaveProperty('city');
    });

    it('should support pagination', async () => {
      const page1 = await service.listProperties(1, 10);
      const page2 = await service.listProperties(2, 10);

      expect(page1.success).toBe(true);
      expect(page2.success).toBe(true);
    });
  });

  describe('getPropertyDetails', () => {
    it('should return property details for valid ID', async () => {
      const response = await service.getPropertyDetails('mock-001');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.sourceId).toBe('mock-001');
      expect(response.data?.title).toContain('Lisboa');
    });

    it('should return error for invalid ID', async () => {
      const response = await service.getPropertyDetails('invalid-id');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should return property with all expected fields', async () => {
      const response = await service.getPropertyDetails('mock-001');

      expect(response.success).toBe(true);
      expect(response.data).toMatchObject({
        source: 'casafari',
        sourceId: 'mock-001',
        type: expect.any(String),
        price: expect.any(Number),
        area: expect.any(Number),
        city: expect.any(String),
      });
    });
  });

  describe('searchProperties', () => {
    it('should search properties with city filter', async () => {
      const response = await service.searchProperties({ city: 'Lisboa' });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.every(p => p.city.toLowerCase().includes('lisboa'))).toBe(true);
    });

    it('should search properties with price range', async () => {
      const response = await service.searchProperties({ 
        minPrice: 400000, 
        maxPrice: 500000 
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.every(p => p.price >= 400000 && p.price <= 500000)).toBe(true);
    });

    it('should search properties with bedroom filter', async () => {
      const response = await service.searchProperties({ bedrooms: 3 });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.every(p => p.bedrooms === 3)).toBe(true);
    });

    it('should search properties with operation filter', async () => {
      const response = await service.searchProperties({ operation: 'sale' });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.every(p => p.operation === 'sale')).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const response = await service.searchProperties({
        city: 'Porto',
        minPrice: 600000,
        bedrooms: 4,
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });
  });

  describe('caching', () => {
    it('should cache property list results', async () => {
      const response1 = await service.listProperties();
      expect(response1.cached).toBeUndefined();

      const response2 = await service.listProperties();
      expect(response2.cached).toBe(true);
    });

    it('should cache property details', async () => {
      const response1 = await service.getPropertyDetails('mock-001');
      expect(response1.cached).toBeUndefined();

      const response2 = await service.getPropertyDetails('mock-001');
      expect(response2.cached).toBe(true);
    });

    it('should cache search results', async () => {
      const searchParams = { city: 'Lisboa' };
      
      const response1 = await service.searchProperties(searchParams);
      expect(response1.cached).toBeUndefined();

      const response2 = await service.searchProperties(searchParams);
      expect(response2.cached).toBe(true);
    });

    it('should clear cache', async () => {
      await service.listProperties();
      expect(casafariCache.size()).toBeGreaterThan(0);

      service.clearCache();
      expect(casafariCache.size()).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(typeof stats.size).toBe('number');
    });
  });
});

describe('Transformer', () => {
  const mockCasafariProperty: CasafariProperty = {
    id: 'test-123',
    title: 'Test Property',
    type: 'apartment',
    operation: 'sale',
    price: 300000,
    currency: 'EUR',
    area: 100,
    bedrooms: 2,
    bathrooms: 1,
    location: {
      city: 'Lisboa',
      country: 'Portugal',
      coordinates: {
        latitude: 38.7223,
        longitude: -9.1393,
      },
    },
  };

  describe('transformCasafariProperty', () => {
    it('should transform property to canonical format', () => {
      const canonical = transformCasafariProperty(mockCasafariProperty);

      expect(canonical).toMatchObject({
        id: 'casafari-test-123',
        source: 'casafari',
        sourceId: 'test-123',
        title: 'Test Property',
        type: 'apartment',
        price: 300000,
        area: 100,
        bedrooms: 2,
        bathrooms: 1,
        city: 'Lisboa',
        country: 'Portugal',
        latitude: 38.7223,
        longitude: -9.1393,
      });
    });

    it('should map property types correctly', () => {
      const testCases = [
        { input: 'apartment', expected: 'apartment' },
        { input: 'flat', expected: 'apartment' },
        { input: 'house', expected: 'house' },
        { input: 'villa', expected: 'house' },
        { input: 'land', expected: 'land' },
        { input: 'commercial', expected: 'commercial' },
      ];

      testCases.forEach(({ input, expected }) => {
        const prop = { ...mockCasafariProperty, type: input };
        const canonical = transformCasafariProperty(prop);
        expect(canonical.type).toBe(expected);
      });
    });

    it('should handle optional fields', () => {
      const minimalProp: CasafariProperty = {
        id: 'min-1',
        title: 'Minimal',
        type: 'apartment',
        operation: 'rent',
        price: 1000,
        currency: 'EUR',
        area: 50,
        location: {
          city: 'Porto',
          country: 'Portugal',
        },
      };

      const canonical = transformCasafariProperty(minimalProp);
      
      expect(canonical.bedrooms).toBeUndefined();
      expect(canonical.bathrooms).toBeUndefined();
      expect(canonical.latitude).toBeUndefined();
      expect(canonical.longitude).toBeUndefined();
    });
  });

  describe('transformCasafariProperties', () => {
    it('should transform array of properties', () => {
      const properties = [mockCasafariProperty, { ...mockCasafariProperty, id: 'test-456' }];
      const canonical = transformCasafariProperties(properties);

      expect(canonical).toHaveLength(2);
      expect(canonical[0].sourceId).toBe('test-123');
      expect(canonical[1].sourceId).toBe('test-456');
    });

    it('should handle empty array', () => {
      const canonical = transformCasafariProperties([]);
      expect(canonical).toEqual([]);
    });
  });

  describe('validateCasafariProperty', () => {
    it('should validate valid property', () => {
      expect(validateCasafariProperty(mockCasafariProperty)).toBe(true);
    });

    it('should reject property without id', () => {
      const invalid = { ...mockCasafariProperty, id: undefined };
      expect(validateCasafariProperty(invalid)).toBe(false);
    });

    it('should reject property without title', () => {
      const invalid = { ...mockCasafariProperty, title: undefined };
      expect(validateCasafariProperty(invalid)).toBe(false);
    });

    it('should reject property without price', () => {
      const invalid = { ...mockCasafariProperty, price: undefined };
      expect(validateCasafariProperty(invalid)).toBe(false);
    });

    it('should reject property without area', () => {
      const invalid = { ...mockCasafariProperty, area: undefined };
      expect(validateCasafariProperty(invalid)).toBe(false);
    });

    it('should reject property without city', () => {
      const invalid = { 
        ...mockCasafariProperty, 
        location: { ...mockCasafariProperty.location, city: undefined as any }
      };
      expect(validateCasafariProperty(invalid)).toBe(false);
    });
  });
});

describe('Cache', () => {
  beforeEach(() => {
    casafariCache.clear();
  });

  afterEach(() => {
    casafariCache.clear();
  });

  it('should store and retrieve data', () => {
    const data = { test: 'value' };
    casafariCache.set('key1', data, 300);

    const retrieved = casafariCache.get<typeof data>('key1');
    expect(retrieved).toEqual(data);
  });

  it('should return null for non-existent key', () => {
    const result = casafariCache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should expire data after TTL', async () => {
    casafariCache.set('expiring', { data: 'test' }, 1); // 1 second TTL
    
    expect(casafariCache.get('expiring')).not.toBeNull();
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(casafariCache.get('expiring')).toBeNull();
  });

  it('should check if key exists', () => {
    casafariCache.set('exists', 'value', 300);
    
    expect(casafariCache.has('exists')).toBe(true);
    expect(casafariCache.has('notexists')).toBe(false);
  });

  it('should delete entries', () => {
    casafariCache.set('todelete', 'value', 300);
    expect(casafariCache.has('todelete')).toBe(true);
    
    casafariCache.delete('todelete');
    expect(casafariCache.has('todelete')).toBe(false);
  });

  it('should clear all entries', () => {
    casafariCache.set('key1', 'value1', 300);
    casafariCache.set('key2', 'value2', 300);
    
    expect(casafariCache.size()).toBe(2);
    
    casafariCache.clear();
    expect(casafariCache.size()).toBe(0);
  });

  it('should cleanup expired entries', async () => {
    casafariCache.set('keep', 'value', 300); // 5 minutes
    casafariCache.set('expire', 'value', 1); // 1 second
    
    expect(casafariCache.size()).toBe(2);
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const removed = casafariCache.cleanup();
    expect(removed).toBe(1);
    expect(casafariCache.size()).toBe(1);
    expect(casafariCache.has('keep')).toBe(true);
  });
});

describe('Factory function', () => {
  it('should create service with custom config', () => {
    const service = createCasafariService({
      apiKey: 'custom-key',
      timeout: 60000,
    });

    expect(service).toBeInstanceOf(CasafariService);
  });

  it('should create service with env API key', () => {
    process.env.CASAFARI_API_KEY = 'env-key';
    const service = createCasafariService();

    expect(service).toBeInstanceOf(CasafariService);
    delete process.env.CASAFARI_API_KEY;
  });

  it('should fallback to mock API key', () => {
    delete process.env.CASAFARI_API_KEY;
    const service = createCasafariService();

    expect(service).toBeInstanceOf(CasafariService);
  });
});
