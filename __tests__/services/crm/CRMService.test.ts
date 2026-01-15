/**
 * CRM Service Tests
 */

import { CRMService, LeadStatus, LeadSource, SyncStatus } from '../../../src/services/crm';

// Mock fetch globally
global.fetch = jest.fn();

describe('CRMService', () => {
  let crmService: CRMService;
  const mockOrchestratorUrl = 'https://test-orchestrator.com/api';

  beforeEach(() => {
    crmService = new CRMService({
      orchestratorUrl: mockOrchestratorUrl,
      enableQueue: false,
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
      },
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    crmService.destroy();
  });

  describe('syncLeads', () => {
    it('should sync leads successfully', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '+351912345678',
          source: LeadSource.PORTAL,
          status: LeadStatus.NEW,
        },
        {
          id: 'lead-2',
          name: 'Maria Santos',
          email: 'maria@example.com',
          phone: '+351923456789',
          source: LeadSource.WEBSITE,
          status: LeadStatus.NEW,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'sync_lead',
          data: { synced: true },
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await crmService.syncLeads(mockLeads);

      expect(result.success).toBe(true);
      expect(result.synced_leads).toBe(2);
      expect(result.failed_leads).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle sync failures', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'CRM service unavailable',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await crmService.syncLeads(mockLeads);

      expect(result.success).toBe(false);
      expect(result.synced_leads).toBe(0);
      expect(result.failed_leads).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Sync failed');
    });

    it('should transform raw leads to canonical format', async () => {
      const rawLeads = [
        {
          external_id: 'crm-12345',
          full_name: 'Test User',
          email_address: 'test@example.com',
          phone_number: '+351900000000',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'sync_lead',
          data: { synced: true },
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await crmService.syncLeads(rawLeads);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
      
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.payload.lead.name).toBe('Test User');
      expect(callBody.payload.lead.email).toBe('test@example.com');
      expect(callBody.payload.lead.phone).toBe('+351900000000');
    });
  });

  describe('updateLead', () => {
    it('should update lead successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'update_lead',
          data: { updated: true },
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await crmService.updateLead({
        lead_id: 'lead-1',
        updates: {
          status: LeadStatus.CONTACTED,
        },
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        mockOrchestratorUrl,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle update failures', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Lead not found',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await crmService.updateLead({
        lead_id: 'lead-999',
        updates: {
          status: LeadStatus.CONTACTED,
        },
      });

      expect(result).toBe(false);
    });
  });

  describe('getLeadStatus', () => {
    it('should get lead status successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'get_lead_status',
          data: {
            status: LeadStatus.QUALIFIED,
            last_updated: '2026-01-15T10:00:00Z',
            metadata: {
              source: 'CRM',
              last_contact: '2026-01-15T09:00:00Z',
            },
          },
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await crmService.getLeadStatus('lead-1');

      expect(result).not.toBeNull();
      expect(result?.lead_id).toBe('lead-1');
      expect(result?.status).toBe(LeadStatus.QUALIFIED);
      expect(result?.crm_metadata).toHaveProperty('source', 'CRM');
    });

    it('should return null on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await crmService.getLeadStatus('lead-1');

      expect(result).toBeNull();
    });
  });

  describe('Queue Management', () => {
    it('should add items to queue when enabled', async () => {
      const queuedService = new CRMService({
        orchestratorUrl: mockOrchestratorUrl,
        enableQueue: true,
        autoProcessQueue: false,
      });

      const mockLeads = [
        {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
        },
      ];

      const result = await queuedService.syncLeads(mockLeads);

      expect(result.synced_leads).toBe(1);
      
      const stats = queuedService.getQueueStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.pending).toBeGreaterThan(0);

      queuedService.destroy();
    });

    it('should process queue items', async () => {
      const queuedService = new CRMService({
        orchestratorUrl: mockOrchestratorUrl,
        enableQueue: true,
        autoProcessQueue: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'sync_lead',
          data: { synced: true },
          timestamp: new Date().toISOString(),
        }),
      });

      await queuedService.syncLeads([
        {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
        },
      ]);

      await queuedService.processQueue();

      const stats = queuedService.getQueueStats();
      expect(stats.success).toBeGreaterThan(0);

      queuedService.destroy();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: false,
              error: 'Temporary error',
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            action: 'sync_lead',
            data: { synced: true },
            timestamp: new Date().toISOString(),
          }),
        });
      });

      const result = await crmService.syncLeads([
        {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
        },
      ]);

      expect(result.success).toBe(true);
      expect(callCount).toBeGreaterThan(1);
    });
  });
});
