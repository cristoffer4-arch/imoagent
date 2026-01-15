/**
 * Queue Tests
 */

import { SyncQueue } from '../../../src/services/crm/queue';
import { SyncStatus } from '../../../src/services/crm/types';

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(() => {
    queue = new SyncQueue();
  });

  describe('enqueue', () => {
    it('should add items to queue', () => {
      const id = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      expect(id).toBeDefined();
      expect(queue.size()).toBe(1);
    });
  });

  describe('dequeue', () => {
    it('should return pending items', () => {
      queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      const item = queue.dequeue();
      
      expect(item).not.toBeNull();
      expect(item?.status).toBe(SyncStatus.PENDING);
    });

    it('should return null when queue is empty', () => {
      const item = queue.dequeue();
      
      expect(item).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update item status', () => {
      const id = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      queue.updateStatus(id, SyncStatus.SUCCESS);
      
      const item = queue.get(id);
      expect(item?.status).toBe(SyncStatus.SUCCESS);
    });

    it('should set retry status when retries are available', () => {
      const id = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      queue.updateStatus(id, SyncStatus.FAILED, 'Test error');
      
      const item = queue.get(id);
      expect(item?.status).toBe(SyncStatus.RETRY);
      expect(item?.retry_count).toBe(1);
      expect(item?.error_message).toBe('Test error');
    });

    it('should mark as failed when max retries exceeded', () => {
      const id = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 1,
      });

      queue.updateStatus(id, SyncStatus.FAILED);
      queue.updateStatus(id, SyncStatus.FAILED);
      
      const item = queue.get(id);
      expect(item?.status).toBe(SyncStatus.FAILED);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const id1 = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });
      
      const id2 = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-2',
          name: 'Maria Santos',
          email: 'maria@example.com',
          source: 'WEBSITE',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      queue.updateStatus(id1, SyncStatus.SUCCESS);

      const stats = queue.getStats();
      
      expect(stats.total).toBe(2);
      expect(stats.success).toBe(1);
      expect(stats.pending).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove old successful items', () => {
      const id = queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      queue.updateStatus(id, SyncStatus.SUCCESS);
      
      // Cleanup with very short max age
      const removed = queue.cleanup(0);
      
      expect(removed).toBe(1);
      expect(queue.size()).toBe(0);
    });

    it('should not remove pending items', () => {
      queue.enqueue({
        action: 'sync',
        lead_data: {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          source: 'PORTAL',
          status: 'NEW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        max_retries: 3,
      });

      const removed = queue.cleanup(0);
      
      expect(removed).toBe(0);
      expect(queue.size()).toBe(1);
    });
  });
});
