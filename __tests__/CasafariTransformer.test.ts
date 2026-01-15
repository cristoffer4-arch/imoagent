/**
 * CasafariTransformer.test.ts - Testes para o transformer do Casafari
 */

import { CasafariTransformer, CasafariRawData } from '../src/models/transformers/CasafariTransformer';
import { PropertyType, TransactionType, PropertyCondition, DataQuality } from '../src/models/PropertyCanonicalModel';

describe('CasafariTransformer', () => {
  describe('transform', () => {
    it('should transform complete Casafari data', () => {
      const casafariData: CasafariRawData = {
        id: 'casafari-123',
        propertyType: 'apartment',
        transactionType: 'sale',
        location: {
          latitude: 38.7223,
          longitude: -9.1393,
          address: 'Rua do Comércio 123',
          postalCode: '1100-150',
          parish: 'Baixa',
          municipality: 'Lisboa',
          district: 'Lisboa',
          country: 'Portugal',
        },
        price: {
          value: 250000,
          currency: 'EUR',
        },
        characteristics: {
          grossArea: 100,
          netArea: 85,
          bedrooms: 2,
          bathrooms: 1,
          parkingSpaces: 1,
          floor: 3,
          totalFloors: 5,
          condition: 'good',
          energyCertificate: 'B',
          typology: 'T2',
        },
        features: {
          elevator: true,
          balcony: true,
          pool: false,
        },
        title: 'Apartamento T2 em Lisboa',
        description: 'Lindo apartamento com vista para o rio',
        images: [
          { url: 'https://example.com/img1.jpg', order: 0 },
          { url: 'https://example.com/img2.jpg', order: 1 },
        ],
        source: {
          portal: 'Idealista',
          url: 'https://idealista.pt/property/123',
          agency: 'Agência XYZ',
          publishedDate: '2024-01-15T10:00:00Z',
          lastUpdated: '2024-01-20T15:30:00Z',
        },
      };

      const property = CasafariTransformer.transform(casafariData, 'tenant-123', 'team-456');

      expect(property.id).toBe('casafari_casafari-123');
      expect(property.tenantId).toBe('tenant-123');
      expect(property.teamId).toBe('team-456');
      expect(property.type).toBe(PropertyType.APARTMENT);
      expect(property.location.coordinates?.latitude).toBe(38.7223);
      expect(property.location.coordinates?.longitude).toBe(-9.1393);
      expect(property.location.address.concelho).toBe('Lisboa');
      expect(property.location.address.distrito).toBe('Lisboa');
      expect(property.location.address.postalCode).toBe('1100-150');
      expect(property.price.value).toBe(250000);
      expect(property.price.currency).toBe('EUR');
      expect(property.price.transactionType).toBe(TransactionType.SALE);
      expect(property.characteristics.totalArea).toBe(100);
      expect(property.characteristics.usefulArea).toBe(85);
      expect(property.characteristics.bedrooms).toBe(2);
      expect(property.characteristics.bathrooms).toBe(1);
      expect(property.characteristics.typology).toBe('T2');
      expect(property.characteristics.energyRating).toBe('B');
      expect(property.characteristics.condition).toBe(PropertyCondition.GOOD);
      expect(property.characteristics.features?.elevator).toBe(true);
      expect(property.characteristics.features?.balcony).toBe(true);
      expect(property.title).toBe('Apartamento T2 em Lisboa');
      expect(property.description).toBe('Lindo apartamento com vista para o rio');
      expect(property.images).toHaveLength(2);
      expect(property.metadata.sources).toHaveLength(1);
      expect(property.metadata.sources[0].type).toBe('CASAFARI');
      expect(property.metadata.sources[0].name).toBe('Idealista');
      expect(property.metadata.dataQuality).toBe(DataQuality.HIGH);
    });

    it('should transform minimal Casafari data', () => {
      const casafariData: CasafariRawData = {
        id: 'casafari-456',
        location: {
          municipality: 'Porto',
          district: 'Porto',
        },
        price: {
          value: 150000,
        },
      };

      const property = CasafariTransformer.transform(casafariData, 'tenant-123');

      expect(property.id).toBe('casafari_casafari-456');
      expect(property.tenantId).toBe('tenant-123');
      expect(property.location.address.concelho).toBe('Porto');
      expect(property.location.address.distrito).toBe('Porto');
      expect(property.price.value).toBe(150000);
      expect(property.price.currency).toBe('EUR');
      expect(property.metadata.dataQuality).toBe(DataQuality.LOW);
    });

    it('should map Portuguese property types correctly', () => {
      const apartmentData: CasafariRawData = {
        id: '1',
        propertyType: 'apartamento',
      };
      const apartment = CasafariTransformer.transform(apartmentData, 'tenant-123');
      expect(apartment.type).toBe(PropertyType.APARTMENT);

      const houseData: CasafariRawData = {
        id: '2',
        propertyType: 'moradia',
      };
      const house = CasafariTransformer.transform(houseData, 'tenant-123');
      expect(house.type).toBe(PropertyType.HOUSE);

      const landData: CasafariRawData = {
        id: '3',
        propertyType: 'terreno',
      };
      const land = CasafariTransformer.transform(landData, 'tenant-123');
      expect(land.type).toBe(PropertyType.LAND);
    });

    it('should calculate price per m² correctly', () => {
      const casafariData: CasafariRawData = {
        id: 'casafari-789',
        price: {
          value: 200000,
        },
        characteristics: {
          netArea: 100,
        },
      };

      const property = CasafariTransformer.transform(casafariData, 'tenant-123');
      expect(property.price.pricePerM2).toBe(2000);
    });

    it('should normalize postal code', () => {
      const casafariData: CasafariRawData = {
        id: 'casafari-101',
        location: {
          postalCode: '1100150', // Without hyphen
          municipality: 'Lisboa',
          district: 'Lisboa',
        },
      };

      const property = CasafariTransformer.transform(casafariData, 'tenant-123');
      expect(property.location.address.postalCode).toBe('1100-150');
    });
  });

  describe('transformBatch', () => {
    it('should transform multiple properties', () => {
      const casafariDataArray: CasafariRawData[] = [
        {
          id: 'casafari-1',
          location: {
            municipality: 'Lisboa',
            district: 'Lisboa',
          },
          price: {
            value: 250000,
          },
        },
        {
          id: 'casafari-2',
          location: {
            municipality: 'Porto',
            district: 'Porto',
          },
          price: {
            value: 180000,
          },
        },
      ];

      const properties = CasafariTransformer.transformBatch(casafariDataArray, 'tenant-123');

      expect(properties).toHaveLength(2);
      expect(properties[0].id).toBe('casafari_casafari-1');
      expect(properties[1].id).toBe('casafari_casafari-2');
    });
  });
});
