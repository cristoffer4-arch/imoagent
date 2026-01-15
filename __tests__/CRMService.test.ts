/**
 * CRMService.test.ts - Testes unitários para CRMService
 */

import { CRMService, CRMServiceError, createCRMService } from '../src/services/crm/CRMService';
import { LeadStatus } from '../src/types/crm';

// Mock fetch global
global.fetch = jest.fn();

describe('CRMService', () => {
  let service: CRMService;
  const mockOrchestratorUrl = 'https://test.supabase.co/functions/v1/ia-orquestradora';
  const mockTenantId = 'tenant-123';
  const mockTeamId = 'team-456';

  beforeEach(() => {
    service = new CRMService({
      orchestratorUrl: mockOrchestratorUrl,
      tenantId: mockTenantId,
      teamId: mockTeamId,
      timeout: 5000,
      maxRetries: 3,
      retryDelay: 100,
      queueConcurrency: 2,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.clearQueue();
  });

  describe('constructor', () => {
    it('should create service with provided config', () => {
      expect(service).toBeInstanceOf(CRMService);
    });

    it('should initialize with default values', () => {
      const defaultService = new CRMService({
        orchestratorUrl: mockOrchestratorUrl,
        tenantId: mockTenantId,
      });
      expect(defaultService).toBeInstanceOf(CRMService);
    });
  });

  describe('syncLeads', () => {
    const mockSyncResponse = {
      function: 'ia-orquestradora',
      status: 'ok',
      action: 'sync_leads',
      data: {
        success: true,
        leads: [
          {
            id: 'lead_TestCRM_1',
            tenantId: mockTenantId,
            teamId: mockTeamId,
            name: 'João Silva',
            email: 'joao@example.com',
            phone: '+351912345678',
            status: LeadStatus.NEW,
            source: 'website',
            interestType: 'buy',
            metadata: {
              sources: [
                {
                  type: 'CRM',
                  name: 'TestCRM',
                  id: '1',
                },
              ],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        syncMetadata: {
          syncedAt: new Date(),
          source: 'TestCRM',
          totalProcessed: 1,
          totalSuccess: 1,
          totalFailed: 0,
        },
      },
    };

    it('should sync leads successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncResponse,
      });

      const result = await service.syncLeads('TestCRM');

      expect(global.fetch).toHaveBeenCalledWith(
        mockOrchestratorUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.leads).toHaveLength(1);
      expect(result.leads[0].name).toBe('João Silva');
    });

    it('should sync leads with filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncResponse,
      });

      const filters = {
        status: [LeadStatus.NEW, LeadStatus.CONTACTED],
        dateFrom: '2024-01-01',
        limit: 10,
      };

      const result = await service.syncLeads('TestCRM', filters);

      expect(result.success).toBe(true);
    });

    it('should handle sync error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      const result = await service.syncLeads('TestCRM');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      const result = await service.syncLeads('TestCRM');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network');
    });

    it('should handle timeout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await service.syncLeads('TestCRM');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('updateLead', () => {
    const mockUpdateResponse = {
      function: 'ia-orquestradora',
      status: 'ok',
      action: 'update_lead',
      data: {
        success: true,
        lead: {
          id: 'lead_TestCRM_1',
          tenantId: mockTenantId,
          name: 'João Silva',
          status: LeadStatus.CONTACTED,
          metadata: {
            sources: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    };

    it('should update lead successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdateResponse,
      });

      const result = await service.updateLead('lead-1', 'TestCRM', {
        status: LeadStatus.CONTACTED,
        notes: 'Contacted via phone',
      });

      expect(result.success).toBe(true);
      expect(result.lead).toBeDefined();
      expect(result.lead?.status).toBe(LeadStatus.CONTACTED);
    });

    it('should handle update error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Lead not found' }),
      });

      const result = await service.updateLead('invalid-lead', 'TestCRM', {
        status: LeadStatus.CONTACTED,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getLeadStatus', () => {
    const mockStatusResponse = {
      function: 'ia-orquestradora',
      status: 'ok',
      action: 'get_lead_status',
      data: {
        success: true,
        lead: {
          id: 'lead_TestCRM_1',
          tenantId: mockTenantId,
          name: 'João Silva',
          status: LeadStatus.QUALIFIED,
          metadata: {
            sources: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        status: LeadStatus.QUALIFIED,
        lastUpdated: new Date(),
      },
    };

    it('should get lead status successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatusResponse,
      });

      const result = await service.getLeadStatus('lead-1', 'TestCRM');

      expect(result.success).toBe(true);
      expect(result.status).toBe(LeadStatus.QUALIFIED);
      expect(result.lead).toBeDefined();
    });

    it('should handle status error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Access denied' }),
      });

      const result = await service.getLeadStatus('lead-1', 'TestCRM');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('queue management', () => {
    it('should get queue stats', () => {
      const stats = service.getQueueStats();
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeDefined();
      expect(stats.pending).toBeDefined();
      expect(stats.processing).toBeDefined();
      expect(stats.completed).toBeDefined();
      expect(stats.failed).toBeDefined();
    });

    it('should cleanup old queue items', () => {
      const cleaned = service.cleanupQueue(0);
      
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });

    it('should clear queue', () => {
      service.clearQueue();
      
      const stats = service.getQueueStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('transformLead', () => {
    it('should transform single lead', () => {
      const crmData = {
        id: 'crm-lead-1',
        crmName: 'TestCRM',
        name: 'Test Lead',
        email: 'test@example.com',
      };

      const lead = service.transformLead(crmData);

      expect(lead.id).toBe('lead_TestCRM_crm-lead-1');
      expect(lead.name).toBe('Test Lead');
      expect(lead.email).toBe('test@example.com');
    });

    it('should transform multiple leads', () => {
      const crmDataArray = [
        {
          id: 'crm-lead-1',
          crmName: 'TestCRM',
          name: 'Lead 1',
        },
        {
          id: 'crm-lead-2',
          crmName: 'TestCRM',
          name: 'Lead 2',
        },
      ];

      const leads = service.transformLeads(crmDataArray);

      expect(leads).toHaveLength(2);
      expect(leads[0].name).toBe('Lead 1');
      expect(leads[1].name).toBe('Lead 2');
    });
  });

  describe('createCRMService', () => {
    it('should create service with factory function', () => {
      const service = createCRMService({
        orchestratorUrl: mockOrchestratorUrl,
        tenantId: mockTenantId,
      });

      expect(service).toBeInstanceOf(CRMService);
    });

    it('should throw error when tenant ID missing', () => {
      expect(() => {
        createCRMService({
          orchestratorUrl: mockOrchestratorUrl,
        });
      }).toThrow('Tenant ID is required');
    });

    it('should use environment variables', () => {
      process.env.NEXT_PUBLIC_TENANT_ID = 'env-tenant-id';
      
      const service = createCRMService({
        orchestratorUrl: mockOrchestratorUrl,
      });

      expect(service).toBeInstanceOf(CRMService);
      
      delete process.env.NEXT_PUBLIC_TENANT_ID;
    });
  });

  describe('CRMServiceError', () => {
    it('should create error with all properties', () => {
      const error = new CRMServiceError('Test error', 500, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('CRMServiceError');
    });
  });
});
