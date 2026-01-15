/**
 * CRMService.test.ts - Tests for CRM Service
 */

import { CRMService, createCRMService, syncQueue, LeadStage } from '../src/services/crm';
import type { LeadUpdate, CRMConfig } from '../src/services/crm';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
  })),
}));

describe('CRMService', () => {
  let service: CRMService;

  beforeEach(() => {
    // Clear queue and mocks
    syncQueue.clear();
    jest.clearAllMocks();

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    // Create service instance
    service = createCRMService();
  });

  describe('syncLeads', () => {
    it('should sync leads successfully', async () => {
      // Mock orchestrator response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            leads: [
              {
                id: 'crm-001',
                crmName: 'TestCRM',
                propertyType: 'apartment',
                city: 'Lisboa',
                district: 'Lisboa',
                price: 300000,
                numberOfBedrooms: 2,
              },
            ],
          },
        }),
      });

      const result = await service.syncLeads('tenant-123', 'TestCRM');

      expect(result.success).toBe(true);
      expect(result.leadsProcessed).toBe(1);
      expect(result.leadsCreated).toBe(1);
      expect(result.leadsFailed).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ia-orquestradora'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle orchestrator errors', async () => {
      // Mock orchestrator error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await service.syncLeads('tenant-123', 'TestCRM');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should process leads in batches', async () => {
      // Create many mock leads
      const manyLeads = Array.from({ length: 55 }, (_, i) => ({
        id: `crm-${i}`,
        crmName: 'TestCRM',
        city: 'Lisboa',
        district: 'Lisboa',
        price: 300000 + i * 1000,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { leads: manyLeads },
        }),
      });

      const result = await service.syncLeads('tenant-123', 'TestCRM');

      expect(result.success).toBe(true);
      expect(result.leadsProcessed).toBe(55);
      // Should process in batches of 50
    });
  });

  describe('updateLead', () => {
    it('should update lead successfully', async () => {
      // Mock orchestrator response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { updated: true },
        }),
      });

      const update: LeadUpdate = {
        leadId: 'lead-123',
        crmId: 'crm-123',
        stage: LeadStage.QUALIFIED,
        score: 85,
      };

      const result = await service.updateLead(update);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should add failed updates to queue for retry', async () => {
      // Mock orchestrator failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
      });

      const update: LeadUpdate = {
        leadId: 'lead-123',
        crmId: 'crm-123',
        stage: LeadStage.QUALIFIED,
      };

      const result = await service.updateLead(update);

      expect(result).toBe(false);

      // Check queue has failed operation
      const stats = service.getQueueStats();
      expect(stats.failed + stats.pending).toBeGreaterThan(0);
    });
  });

  describe('getLeadStatus', () => {
    it('should get lead status successfully', async () => {
      // Mock orchestrator response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            leadId: 'lead-123',
            crmId: 'crm-123',
            stage: 'qualified',
            score: 75,
          },
        }),
      });

      const status = await service.getLeadStatus('lead-123', 'crm-123');

      expect(status).not.toBeNull();
      expect(status?.leadId).toBe('lead-123');
      expect(status?.stage).toBe('qualified');
    });

    it('should return null on error', async () => {
      // Mock orchestrator error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const status = await service.getLeadStatus('lead-123', 'crm-123');

      expect(status).toBeNull();
    });
  });

  describe('processQueue', () => {
    it('should process pending operations in queue', async () => {
      // Add some operations to queue
      syncQueue.add({
        type: 'update',
        payload: {
          leadId: 'lead-1',
          crmId: 'crm-1',
          stage: LeadStage.CONTACTED,
        },
        maxAttempts: 3,
      });

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await service.processQueue();

      const stats = service.getQueueStats();
      expect(stats.completed).toBeGreaterThan(0);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', () => {
      syncQueue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      const stats = service.getQueueStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.pending).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig: Partial<CRMConfig> = {
        retryAttempts: 5,
        syncBatchSize: 100,
      };

      const customService = createCRMService(customConfig);
      expect(customService).toBeInstanceOf(CRMService);
    });

    it('should throw error if Supabase credentials missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createCRMService()).toThrow('Supabase URL and key are required');
    });
  });
});
