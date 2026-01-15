/**
 * PropertyCanonicalModel.test.ts - Testes para o modelo canônico
 */

import {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  PropertyCondition,
  DataQuality,
} from '../src/models/PropertyCanonicalModel';

describe('PropertyCanonicalModel', () => {
  describe('Constructor', () => {
    it('should create a property with minimal data', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
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
        characteristics: {},
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
          dataQuality: DataQuality.MEDIUM,
        },
      });

      expect(property.tenantId).toBe('tenant-123');
      expect(property.type).toBe(PropertyType.APARTMENT);
      expect(property.location.address.concelho).toBe('Lisboa');
      expect(property.price.value).toBe(250000);
      expect(property.metadata.sources).toHaveLength(1);
    });

    it('should create a property with complete data', () => {
      const now = new Date();
      const property = new PropertyCanonicalModel({
        id: 'prop-456',
        tenantId: 'tenant-123',
        teamId: 'team-789',
        type: PropertyType.HOUSE,
        location: {
          coordinates: {
            latitude: 38.7223,
            longitude: -9.1393,
            accuracy: 10,
          },
          address: {
            street: 'Rua do Comércio',
            number: '123',
            postalCode: '1100-150',
            freguesia: 'Baixa',
            concelho: 'Lisboa',
            distrito: 'Lisboa',
            country: 'Portugal',
          },
          geohash: 'eycs1234',
          formattedAddress: 'Rua do Comércio 123, 1100-150 Lisboa',
        },
        price: {
          value: 450000,
          currency: 'EUR',
          transactionType: TransactionType.SALE,
          imiTax: 500,
          pricePerM2: 3000,
        },
        characteristics: {
          totalArea: 150,
          usefulArea: 130,
          bedrooms: 3,
          bathrooms: 2,
          parkingSpaces: 2,
          floor: 2,
          totalFloors: 5,
          condition: PropertyCondition.GOOD,
          energyRating: 'B',
          typology: 'T3',
          features: {
            elevator: true,
            balcony: true,
            pool: false,
          },
        },
        metadata: {
          sources: [
            {
              type: 'CASAFARI',
              name: 'Casafari',
              id: 'casafari-123',
              url: 'https://casafari.com/property/123',
            },
          ],
          firstSeen: now,
          lastSeen: now,
          lastUpdated: now,
          dataQuality: DataQuality.HIGH,
          portalCount: 3,
        },
        title: 'Moradia T3 em Lisboa',
        description: 'Linda moradia com 3 quartos',
        images: [
          {
            url: 'https://example.com/image1.jpg',
            order: 0,
          },
        ],
        createdAt: now,
        updatedAt: now,
      });

      expect(property.id).toBe('prop-456');
      expect(property.type).toBe(PropertyType.HOUSE);
      expect(property.location.coordinates?.latitude).toBe(38.7223);
      expect(property.characteristics.bedrooms).toBe(3);
      expect(property.characteristics.typology).toBe('T3');
      expect(property.images).toHaveLength(1);
    });
  });

  describe('isValid', () => {
    it('should return true for valid property', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
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
        characteristics: {},
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
          dataQuality: DataQuality.MEDIUM,
        },
      });

      expect(property.isValid()).toBe(true);
    });

    it('should return false for invalid property (missing required fields)', () => {
      const property = new PropertyCanonicalModel({
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
          value: 0,
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
      });

      expect(property.isValid()).toBe(false);
    });
  });

  describe('calculateDataQuality', () => {
    it('should return HIGH quality for complete data', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
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
        characteristics: {},
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.LOW,
          validations: {
            hasValidAddress: true,
            hasValidCoordinates: true,
            hasValidPrice: true,
            hasMinimumCharacteristics: true,
            hasImages: true,
          },
        },
      });

      expect(property.calculateDataQuality()).toBe(DataQuality.HIGH);
    });

    it('should return MEDIUM quality for partial data', () => {
      const property = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
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
        characteristics: {},
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.LOW,
          validations: {
            hasValidAddress: true,
            hasValidCoordinates: false,
            hasValidPrice: true,
            hasMinimumCharacteristics: false,
            hasImages: true,
          },
        },
      });

      expect(property.calculateDataQuality()).toBe(DataQuality.MEDIUM);
    });
  });

  describe('merge', () => {
    it('should merge two properties correctly', () => {
      const property1 = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
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
        },
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
        title: 'Apartamento T2',
      });

      const property2 = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
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
          bathrooms: 1,
        },
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Imovirtual', id: '456' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
        description: 'Linda localização',
      });

      property1.merge(property2);

      expect(property1.title).toBe('Apartamento T2');
      expect(property1.description).toBe('Linda localização');
      expect(property1.location.coordinates).toBeDefined();
      expect(property1.location.coordinates?.latitude).toBe(38.7223);
      expect(property1.characteristics.bedrooms).toBe(2);
      expect(property1.characteristics.bathrooms).toBe(1);
      expect(property1.metadata.sources).toHaveLength(2);
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new PropertyCanonicalModel({
        tenantId: 'tenant-123',
        type: PropertyType.APARTMENT,
        location: {
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
        },
        metadata: {
          sources: [{ type: 'PORTAL', name: 'Idealista', id: '123' }],
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastUpdated: new Date(),
          dataQuality: DataQuality.MEDIUM,
        },
      });

      const json = original.toJSON();
      const deserialized = PropertyCanonicalModel.fromJSON(json);

      expect(deserialized.tenantId).toBe(original.tenantId);
      expect(deserialized.type).toBe(original.type);
      expect(deserialized.price.value).toBe(original.price.value);
      expect(deserialized.characteristics.bedrooms).toBe(original.characteristics.bedrooms);
      expect(deserialized.metadata.sources).toHaveLength(1);
    });
  });
});
