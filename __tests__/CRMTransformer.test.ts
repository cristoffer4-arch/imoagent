/**
 * CRMTransformer.test.ts - Testes para o transformer de CRM
 */

import { CRMTransformer, CRMRawData } from '../src/models/transformers/CRMTransformer';
import { PropertyType, TransactionType, PropertyCondition } from '../src/models/PropertyCanonicalModel';

describe('CRMTransformer', () => {
  describe('transform', () => {
    it('should transform complete CRM data', () => {
      const crmData: CRMRawData = {
        id: 'crm-123',
        crmName: 'Salesforce',
        propertyType: 'apartment',
        dealType: 'sale',
        street: 'Rua Augusta',
        number: '100',
        postalCode: '1100-048',
        city: 'Lisboa',
        municipality: 'Lisboa',
        district: 'Lisboa',
        country: 'Portugal',
        latitude: 38.7098,
        longitude: -9.1366,
        price: 300000,
        currency: 'EUR',
        condominium: 50,
        imi: 300,
        totalArea: 120,
        livingArea: 100,
        numberOfBedrooms: 3,
        numberOfBathrooms: 2,
        numberOfWC: 1,
        parkingSpaces: 2,
        floor: 4,
        totalFloors: 8,
        propertyCondition: 'good',
        energyCertificate: 'B',
        typology: 'T3',
        features: {
          elevator: true,
          balcony: true,
          'air conditioning': true,
        },
        title: 'Apartamento T3 na Baixa',
        description: 'Excelente apartamento no centro histórico',
        notes: 'Cliente interessado em visita',
        photos: [
          { url: 'https://example.com/photo1.jpg', title: 'Sala', position: 0 },
          { url: 'https://example.com/photo2.jpg', title: 'Quarto', position: 1 },
        ],
        agency: 'Agência Premium',
        createdDate: '2024-01-10T09:00:00Z',
        modifiedDate: '2024-01-22T14:00:00Z',
        viewCount: 25,
      };

      const property = CRMTransformer.transform(crmData, 'tenant-123', 'team-456');

      expect(property.id).toBe('crm_Salesforce_crm-123');
      expect(property.tenantId).toBe('tenant-123');
      expect(property.teamId).toBe('team-456');
      expect(property.type).toBe(PropertyType.APARTMENT);
      expect(property.location.coordinates?.latitude).toBe(38.7098);
      expect(property.location.coordinates?.longitude).toBe(-9.1366);
      expect(property.location.address.street).toBe('Rua Augusta');
      expect(property.location.address.number).toBe('100');
      expect(property.location.address.postalCode).toBe('1100-048');
      expect(property.location.address.concelho).toBe('Lisboa');
      expect(property.price.value).toBe(300000);
      expect(property.price.condominium).toBe(50);
      expect(property.price.imiTax).toBe(300);
      expect(property.characteristics.totalArea).toBe(120);
      expect(property.characteristics.usefulArea).toBe(100);
      expect(property.characteristics.bedrooms).toBe(3);
      expect(property.characteristics.bathrooms).toBe(2);
      expect(property.characteristics.wc).toBe(1);
      expect(property.characteristics.typology).toBe('T3');
      expect(property.characteristics.energyRating).toBe('B');
      expect(property.characteristics.condition).toBe(PropertyCondition.GOOD);
      expect(property.characteristics.features?.elevator).toBe(true);
      expect(property.characteristics.features?.airConditioning).toBe(true);
      expect(property.title).toBe('Apartamento T3 na Baixa');
      expect(property.description).toContain('Excelente apartamento no centro histórico');
      expect(property.description).toContain('Cliente interessado em visita');
      expect(property.images).toHaveLength(2);
      expect(property.metadata.sources[0].type).toBe('CRM');
      expect(property.metadata.sources[0].name).toBe('Salesforce');
      expect(property.metadata.viewCount).toBe(25);
    });

    it('should transform minimal CRM data', () => {
      const crmData: CRMRawData = {
        id: 'crm-456',
        crmName: 'HubSpot',
        city: 'Porto',
        district: 'Porto',
        price: 200000,
      };

      const property = CRMTransformer.transform(crmData, 'tenant-123');

      expect(property.id).toBe('crm_HubSpot_crm-456');
      expect(property.location.address.concelho).toBe('Porto');
      expect(property.price.value).toBe(200000);
    });

    it('should infer typology from bedrooms', () => {
      const crmData: CRMRawData = {
        id: 'crm-789',
        crmName: 'Custom CRM',
        numberOfBedrooms: 2,
      };

      const property = CRMTransformer.transform(crmData, 'tenant-123');
      expect(property.characteristics.typology).toBe('T2');
    });

    it('should handle features as array', () => {
      const crmData: CRMRawData = {
        id: 'crm-101',
        crmName: 'Custom CRM',
        features: ['elevator', 'pool', 'garden'],
      };

      const property = CRMTransformer.transform(crmData, 'tenant-123');
      expect(property.characteristics.features?.elevator).toBe(true);
      expect(property.characteristics.features?.pool).toBe(true);
      expect(property.characteristics.features?.garden).toBe(true);
    });

    it('should handle amenities array', () => {
      const crmData: CRMRawData = {
        id: 'crm-102',
        crmName: 'Custom CRM',
        amenities: ['balcony', 'heating', 'storage'],
      };

      const property = CRMTransformer.transform(crmData, 'tenant-123');
      expect(property.characteristics.features?.balcony).toBe(true);
      expect(property.characteristics.features?.heating).toBe(true);
      expect(property.characteristics.features?.storage).toBe(true);
    });

    it('should build formatted address from parts', () => {
      const crmData: CRMRawData = {
        id: 'crm-103',
        crmName: 'Custom CRM',
        street: 'Av. da Liberdade',
        number: '200',
        postalCode: '1250-147',
        city: 'Lisboa',
      };

      const property = CRMTransformer.transform(crmData, 'tenant-123');
      expect(property.location.formattedAddress).toContain('Av. da Liberdade');
      expect(property.location.formattedAddress).toContain('200');
      expect(property.location.formattedAddress).toContain('1250-147');
    });

    it('should map transaction type correctly', () => {
      const saleData: CRMRawData = {
        id: '1',
        crmName: 'CRM',
        dealType: 'venda',
      };
      const saleProperty = CRMTransformer.transform(saleData, 'tenant-123');
      expect(saleProperty.price.transactionType).toBe(TransactionType.SALE);

      const rentData: CRMRawData = {
        id: '2',
        crmName: 'CRM',
        dealType: 'arrendamento',
      };
      const rentProperty = CRMTransformer.transform(rentData, 'tenant-123');
      expect(rentProperty.price.transactionType).toBe(TransactionType.RENT);
    });
  });

  describe('transformBatch', () => {
    it('should transform multiple CRM properties', () => {
      const crmDataArray: CRMRawData[] = [
        {
          id: 'crm-1',
          crmName: 'Salesforce',
          city: 'Lisboa',
          district: 'Lisboa',
          price: 250000,
        },
        {
          id: 'crm-2',
          crmName: 'Salesforce',
          city: 'Porto',
          district: 'Porto',
          price: 180000,
        },
      ];

      const properties = CRMTransformer.transformBatch(crmDataArray, 'tenant-123');

      expect(properties).toHaveLength(2);
      expect(properties[0].id).toBe('crm_Salesforce_crm-1');
      expect(properties[1].id).toBe('crm_Salesforce_crm-2');
    });
  });
});
