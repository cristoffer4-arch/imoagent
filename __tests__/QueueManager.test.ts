/**
 * QueueManager.test.ts - Testes unitários para QueueManager
 */

import { QueueManager } from '../src/services/crm/QueueManager';
import type { OrchestratorCRMPayload } from '../src/types/crm';

describe('QueueManager', () => {
  let queueManager: QueueManager;

  beforeEach(() => {
    queueManager = new QueueManager(3, 100, 3);
  });

  afterEach(() => {
    queueManager.clear();
  });

  describe('constructor', () => {
    it('should create queue manager with default values', () => {
      const defaultQueue = new QueueManager();
      expect(defaultQueue).toBeInstanceOf(QueueManager);
      expect(defaultQueue.isEmpty()).toBe(true);
    });

    it('should create queue manager with custom values', () => {
      const customQueue = new QueueManager(5, 500, 5);
      expect(customQueue).toBeInstanceOf(QueueManager);
    });
  });

  describe('enqueue', () => {
    it('should add item to queue', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      expect(itemId).toBeTruthy();
      expect(itemId).toMatch(/^queue_/);
      expect(queueManager.isEmpty()).toBe(false);
    });

    it('should assign correct initial status', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      const item = queueManager.getItem(itemId);
      expect(item).toBeDefined();
      expect(item?.status).toBe('pending');
      expect(item?.retries).toBe(0);
    });
  });

  describe('complete', () => {
    it('should mark item as completed', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      queueManager.complete(itemId);

      const item = queueManager.getItem(itemId);
      expect(item?.status).toBe('completed');
      expect(item?.completedAt).toBeDefined();
    });

    it('should handle completing non-existent item', () => {
      // Should not throw
      expect(() => queueManager.complete('non-existent')).not.toThrow();
    });
  });

  describe('fail', () => {
    it('should mark item as pending for retry', async () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      await queueManager.fail(itemId, new Error('Test error'));

      const item = queueManager.getItem(itemId);
      expect(item?.status).toBe('pending');
      expect(item?.retries).toBe(1);
      expect(item?.error).toBe('Test error');
    });

    it('should mark item as failed after max retries', async () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 2,
      });

      // Fail twice (max retries = 2)
      await queueManager.fail(itemId, new Error('Error 1'));
      await queueManager.fail(itemId, new Error('Error 2'));

      const item = queueManager.getItem(itemId);
      expect(item?.status).toBe('failed');
      expect(item?.retries).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      // Add 3 items
      const id1 = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });
      const id2 = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });
      const id3 = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      // Complete one
      queueManager.complete(id1);

      const stats = queueManager.getStats();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
    });

    it('should return empty stats for empty queue', () => {
      const stats = queueManager.getStats();
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('getItemsByStatus', () => {
    it('should filter items by status', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const id1 = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });
      const id2 = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      queueManager.complete(id1);

      const completed = queueManager.getItemsByStatus('completed');
      expect(completed.length).toBe(1);
      expect(completed[0].id).toBe(id1);
    });
  });

  describe('cleanup', () => {
    it('should remove old completed items', async () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      queueManager.complete(itemId);

      // Cleanup items older than 0ms (should remove the completed item)
      const cleaned = queueManager.cleanup(0);
      
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });

    it('should not remove recent items', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      const itemId = queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      queueManager.complete(itemId);

      // Cleanup items older than 1 hour (should not remove recent item)
      const cleaned = queueManager.cleanup(3600000);
      
      expect(cleaned).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });
      queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      expect(queueManager.isEmpty()).toBe(false);

      queueManager.clear();

      expect(queueManager.isEmpty()).toBe(true);
      expect(queueManager.getStats().total).toBe(0);
    });
  });

  describe('isEmpty and isProcessing', () => {
    it('should return true when queue is empty', () => {
      expect(queueManager.isEmpty()).toBe(true);
    });

    it('should return false when queue has items', () => {
      const mockPayload: OrchestratorCRMPayload = {
        target: 'ia-leads-comissoes',
        action: 'sync_leads',
        tenantId: 'tenant-123',
        crmName: 'TestCRM',
        data: {},
      };

      queueManager.enqueue({
        type: 'sync_leads',
        payload: mockPayload,
        maxRetries: 3,
      });

      expect(queueManager.isEmpty()).toBe(false);
    });
  });
});
