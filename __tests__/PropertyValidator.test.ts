/**
 * PropertyValidator.test.ts - Testes para validadores
 */

import {
  validateProperty,
  validatePortugueseAddress,
  validateCoordinates,
  normalizePostalCode,
  normalizeTypology,
  normalizeEnergyRating,
} from '../src/models/validators/PropertyValidator';
import { PropertyType, TransactionType, DataQuality } from '../src/models/PropertyCanonicalModel';

describe('PropertyValidator', () => {
  describe('validateProperty', () => {
    it('should validate a complete property', () => {
      const property = {
        id: 'prop-123',
        tenantId: 'tenant-456',
        type: PropertyType.APARTMENT,
        location: {
          coordinates: {
            latitude: 38.7223,
            longitude: -9.1393,
          },
          address: {
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
        },
        price: {
          value: 250000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {
          bedrooms: 2,
          bathrooms: 1,
        },
        metadata: {
          sources: [
            {
              type: 'PORTAL',
              name: 'Idealista',
              id: 'idealista-123',
            },
          ],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.HIGH,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateProperty(property);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fail validation for missing required fields', () => {
      const property = {
        id: 'prop-123',
        tenantId: '',
        type: PropertyType.APARTMENT,
        location: {
          address: {
            concelho: '',
            distrito: '',
            country: 'Portugal',
          },
        },
        price: {
          value: -100, // Invalid negative price
          currency: 'EUR',
          transactionType: TransactionType.SALE,
        },
        characteristics: {},
        metadata: {
          sources: [],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.LOW,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateProperty(property);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validatePortugueseAddress', () => {
    it('should validate a correct Portuguese address', () => {
      const address = {
        street: 'Rua do Comércio',
        number: '123',
        postalCode: '1100-150',
        freguesia: 'Baixa',
        concelho: 'Lisboa',
        distrito: 'Lisboa',
        country: 'Portugal',
      };

      const result = validatePortugueseAddress(address);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fail for invalid postal code format', () => {
      const address = {
        postalCode: '123456', // Invalid format
        concelho: 'Lisboa',
        distrito: 'Lisboa',
        country: 'Portugal',
      };

      const result = validatePortugueseAddress(address);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail for missing required fields', () => {
      const address = {
        concelho: '',
        distrito: '',
        country: 'Portugal',
      };

      const result = validatePortugueseAddress(address);
      expect(result.success).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      const coords = {
        latitude: 38.7223,
        longitude: -9.1393,
        accuracy: 10,
      };

      const result = validateCoordinates(coords);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fail for invalid latitude', () => {
      const coords = {
        latitude: 91, // Out of range
        longitude: -9.1393,
      };

      const result = validateCoordinates(coords);
      expect(result.success).toBe(false);
    });

    it('should fail for invalid longitude', () => {
      const coords = {
        latitude: 38.7223,
        longitude: 181, // Out of range
      };

      const result = validateCoordinates(coords);
      expect(result.success).toBe(false);
    });
  });

  describe('normalizePostalCode', () => {
    it('should normalize valid postal code without hyphen', () => {
      expect(normalizePostalCode('1100150')).toBe('1100-150');
    });

    it('should normalize valid postal code with hyphen', () => {
      expect(normalizePostalCode('1100-150')).toBe('1100-150');
    });

    it('should normalize postal code with spaces', () => {
      expect(normalizePostalCode('1100 150')).toBe('1100-150');
    });

    it('should return null for invalid postal code', () => {
      expect(normalizePostalCode('12345')).toBeNull();
      expect(normalizePostalCode('abcd-efg')).toBeNull();
      expect(normalizePostalCode('1100-1500')).toBeNull();
    });
  });

  describe('normalizeTypology', () => {
    it('should normalize T0', () => {
      expect(normalizeTypology('t0')).toBe('T0');
      expect(normalizeTypology('T0')).toBe('T0');
    });

    it('should normalize T3', () => {
      expect(normalizeTypology('t3')).toBe('T3');
      expect(normalizeTypology('T3')).toBe('T3');
    });

    it('should normalize T5+', () => {
      expect(normalizeTypology('t5+')).toBe('T5+');
      expect(normalizeTypology('T5+')).toBe('T5+');
    });

    it('should return null for invalid typology', () => {
      expect(normalizeTypology('A3')).toBeNull();
      expect(normalizeTypology('T')).toBeNull();
      expect(normalizeTypology('123')).toBeNull();
    });
  });

  describe('normalizeEnergyRating', () => {
    it('should normalize A+', () => {
      expect(normalizeEnergyRating('a+')).toBe('A+');
      expect(normalizeEnergyRating('A+')).toBe('A+');
    });

    it('should normalize B', () => {
      expect(normalizeEnergyRating('b')).toBe('B');
      expect(normalizeEnergyRating('B')).toBe('B');
    });

    it('should normalize B-', () => {
      expect(normalizeEnergyRating('b-')).toBe('B-');
      expect(normalizeEnergyRating('B-')).toBe('B-');
    });

    it('should normalize G', () => {
      expect(normalizeEnergyRating('g')).toBe('G');
      expect(normalizeEnergyRating('G')).toBe('G');
    });

    it('should return null for invalid rating', () => {
      expect(normalizeEnergyRating('H')).toBeNull();
      expect(normalizeEnergyRating('A++')).toBeNull();
      expect(normalizeEnergyRating('123')).toBeNull();
    });
  });
});
