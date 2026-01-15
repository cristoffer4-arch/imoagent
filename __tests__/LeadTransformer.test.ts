/**
 * LeadTransformer.test.ts - Testes unitários para LeadTransformer
 */

import { LeadTransformer, CRMLeadRawData } from '../src/services/crm/LeadTransformer';
import { LeadStatus, LeadSource, LeadInterestType } from '../src/types/crm';

describe('LeadTransformer', () => {
  const mockTenantId = 'tenant-123';
  const mockTeamId = 'team-456';

  describe('transform', () => {
    it('should transform complete CRM lead data', () => {
      const crmData: CRMLeadRawData = {
        id: 'crm-lead-1',
        crmName: 'TestCRM',
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao.silva@example.com',
        phone: '+351912345678',
        status: 'qualified',
        source: 'website',
        score: 85,
        interest: 'buy',
        concelho: 'Lisboa',
        distrito: 'Lisboa',
        minBudget: 200000,
        maxBudget: 300000,
        currency: 'EUR',
        message: 'Procuro apartamento T2',
        agentId: 'agent-1',
        createdDate: '2024-01-01T00:00:00Z',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId, mockTeamId);

      expect(lead.id).toBe('lead_TestCRM_crm-lead-1');
      expect(lead.tenantId).toBe(mockTenantId);
      expect(lead.teamId).toBe(mockTeamId);
      expect(lead.name).toBe('João Silva');
      expect(lead.email).toBe('joao.silva@example.com');
      expect(lead.phone).toBe('+351912345678');
      expect(lead.status).toBe(LeadStatus.QUALIFIED);
      expect(lead.source).toBe(LeadSource.WEBSITE);
      expect(lead.score).toBe(85);
      expect(lead.interestType).toBe(LeadInterestType.BUY);
      expect(lead.locationInterest?.concelho).toBe('Lisboa');
      expect(lead.locationInterest?.distrito).toBe('Lisboa');
      expect(lead.budget?.min).toBe(200000);
      expect(lead.budget?.max).toBe(300000);
      expect(lead.budget?.currency).toBe('EUR');
      expect(lead.message).toBe('Procuro apartamento T2');
      expect(lead.metadata.agentId).toBe('agent-1');
      expect(lead.metadata.sources).toHaveLength(1);
      expect(lead.metadata.sources[0].type).toBe('CRM');
    });

    it('should handle minimal CRM lead data', () => {
      const crmData: CRMLeadRawData = {
        id: 'crm-lead-2',
        crmName: 'MinimalCRM',
        name: 'Maria Santos',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.id).toBe('lead_MinimalCRM_crm-lead-2');
      expect(lead.name).toBe('Maria Santos');
      expect(lead.status).toBe(LeadStatus.NEW);
      expect(lead.source).toBe(LeadSource.OTHER);
      expect(lead.interestType).toBe(LeadInterestType.BUY);
      expect(lead.score).toBeUndefined();
    });

    it('should build full name from firstName and lastName', () => {
      const crmData: CRMLeadRawData = {
        id: 'crm-lead-3',
        crmName: 'TestCRM',
        firstName: 'Pedro',
        lastName: 'Oliveira',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.name).toBe('Pedro Oliveira');
    });

    it('should use default name when no name provided', () => {
      const crmData: CRMLeadRawData = {
        id: 'crm-lead-4',
        crmName: 'TestCRM',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.name).toBe('Nome não informado');
    });
  });

  describe('mapStatus', () => {
    it('should map Portuguese status names', () => {
      const testCases = [
        { input: 'novo', expected: LeadStatus.NEW },
        { input: 'contatado', expected: LeadStatus.CONTACTED },
        { input: 'qualificado', expected: LeadStatus.QUALIFIED },
        { input: 'convertido', expected: LeadStatus.CONVERTED },
        { input: 'perdido', expected: LeadStatus.LOST },
      ];

      testCases.forEach(({ input, expected }) => {
        const crmData: CRMLeadRawData = {
          id: 'test',
          crmName: 'Test',
          status: input,
        };
        const lead = LeadTransformer.transform(crmData, mockTenantId);
        expect(lead.status).toBe(expected);
      });
    });

    it('should map English status names', () => {
      const testCases = [
        { input: 'new', expected: LeadStatus.NEW },
        { input: 'contacted', expected: LeadStatus.CONTACTED },
        { input: 'qualified', expected: LeadStatus.QUALIFIED },
        { input: 'converted', expected: LeadStatus.CONVERTED },
        { input: 'lost', expected: LeadStatus.LOST },
      ];

      testCases.forEach(({ input, expected }) => {
        const crmData: CRMLeadRawData = {
          id: 'test',
          crmName: 'Test',
          status: input,
        };
        const lead = LeadTransformer.transform(crmData, mockTenantId);
        expect(lead.status).toBe(expected);
      });
    });
  });

  describe('mapSource', () => {
    it('should map various source types', () => {
      const testCases = [
        { input: 'website', expected: LeadSource.WEBSITE },
        { input: 'portal', expected: LeadSource.PORTAL },
        { input: 'idealista', expected: LeadSource.PORTAL },
        { input: 'referral', expected: LeadSource.REFERRAL },
        { input: 'facebook', expected: LeadSource.SOCIAL_MEDIA },
        { input: 'campaign', expected: LeadSource.CAMPAIGN },
      ];

      testCases.forEach(({ input, expected }) => {
        const crmData: CRMLeadRawData = {
          id: 'test',
          crmName: 'Test',
          source: input,
        };
        const lead = LeadTransformer.transform(crmData, mockTenantId);
        expect(lead.source).toBe(expected);
      });
    });
  });

  describe('mapScore', () => {
    it('should use numeric score when provided', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
        score: 75,
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);
      expect(lead.score).toBe(75);
    });

    it('should convert rating to score', () => {
      const testCases = [
        { rating: 'hot', expectedMin: 85 },
        { rating: 'warm', expectedMin: 50 },
        { rating: 'cold', expectedMin: 20 },
      ];

      testCases.forEach(({ rating, expectedMin }) => {
        const crmData: CRMLeadRawData = {
          id: 'test',
          crmName: 'Test',
          rating,
        };
        const lead = LeadTransformer.transform(crmData, mockTenantId);
        expect(lead.score).toBeGreaterThanOrEqual(expectedMin);
      });
    });

    it('should cap score at 100', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
        score: 150, // Over 100
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);
      expect(lead.score).toBe(100);
    });
  });

  describe('mapInterestType', () => {
    it('should map interest types correctly', () => {
      const testCases = [
        { input: 'buy', expected: LeadInterestType.BUY },
        { input: 'comprar', expected: LeadInterestType.BUY },
        { input: 'sell', expected: LeadInterestType.SELL },
        { input: 'vender', expected: LeadInterestType.SELL },
        { input: 'rent', expected: LeadInterestType.RENT },
        { input: 'alugar', expected: LeadInterestType.RENT },
      ];

      testCases.forEach(({ input, expected }) => {
        const crmData: CRMLeadRawData = {
          id: 'test',
          crmName: 'Test',
          interest: input,
        };
        const lead = LeadTransformer.transform(crmData, mockTenantId);
        expect(lead.interestType).toBe(expected);
      });
    });
  });

  describe('transformLocation', () => {
    it('should transform location data', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
        concelho: 'Porto',
        distrito: 'Porto',
        freguesia: 'Cedofeita',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.locationInterest).toBeDefined();
      expect(lead.locationInterest?.concelho).toBe('Porto');
      expect(lead.locationInterest?.distrito).toBe('Porto');
      expect(lead.locationInterest?.freguesia).toBe('Cedofeita');
    });

    it('should return undefined when no location data', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.locationInterest).toBeUndefined();
    });
  });

  describe('transformBudget', () => {
    it('should transform budget with min and max', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
        minBudget: 100000,
        maxBudget: 200000,
        currency: 'EUR',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.budget).toBeDefined();
      expect(lead.budget?.min).toBe(100000);
      expect(lead.budget?.max).toBe(200000);
      expect(lead.budget?.currency).toBe('EUR');
    });

    it('should use default currency when not provided', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
        maxBudget: 150000,
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.budget?.currency).toBe('EUR');
    });

    it('should return undefined when no budget data', () => {
      const crmData: CRMLeadRawData = {
        id: 'test',
        crmName: 'Test',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);

      expect(lead.budget).toBeUndefined();
    });
  });

  describe('transformBatch', () => {
    it('should transform multiple leads', () => {
      const crmDataArray: CRMLeadRawData[] = [
        {
          id: 'lead-1',
          crmName: 'TestCRM',
          name: 'Lead 1',
        },
        {
          id: 'lead-2',
          crmName: 'TestCRM',
          name: 'Lead 2',
        },
        {
          id: 'lead-3',
          crmName: 'TestCRM',
          name: 'Lead 3',
        },
      ];

      const leads = LeadTransformer.transformBatch(crmDataArray, mockTenantId, mockTeamId);

      expect(leads).toHaveLength(3);
      expect(leads[0].name).toBe('Lead 1');
      expect(leads[1].name).toBe('Lead 2');
      expect(leads[2].name).toBe('Lead 3');
    });

    it('should handle empty array', () => {
      const leads = LeadTransformer.transformBatch([], mockTenantId);

      expect(leads).toHaveLength(0);
    });
  });

  describe('toUpdatePayload', () => {
    it('should convert lead to update payload', () => {
      const crmData: CRMLeadRawData = {
        id: 'crm-lead-1',
        crmName: 'TestCRM',
        name: 'Test Lead',
      };

      const lead = LeadTransformer.transform(crmData, mockTenantId);
      const payload = LeadTransformer.toUpdatePayload(lead);

      expect(payload.id).toBe('crm-lead-1');
      expect(payload.status).toBeDefined();
      expect(payload.updatedAt).toBeDefined();
    });
  });
});
