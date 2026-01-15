/**
 * SyncQueue.test.ts - Tests for Sync Queue
 */

import { SyncQueue } from '../src/services/crm/queue';
import type { SyncOperation } from '../src/services/crm/types';

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(() => {
    queue = new SyncQueue();
  });

  describe('add', () => {
    it('should add operation to queue', () => {
      const id = queue.add({
        type: 'sync',
        payload: { test: 'data' },
        maxAttempts: 3,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^sync_/);

      const operation = queue.get(id);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('sync');
      expect(operation?.status).toBe('pending');
      expect(operation?.attempts).toBe(0);
    });

    it('should generate unique IDs', () => {
      const id1 = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      const id2 = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      expect(id1).not.toBe(id2);
    });
  });

  describe('getNext', () => {
    it('should return next pending operation', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      const operation = queue.getNext();
      expect(operation).not.toBeNull();
      expect(operation?.id).toBe(id);
    });

    it('should skip processing operations', () => {
      const id1 = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      const id2 = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      // Mark first as processing
      queue.markProcessing(id1);

      // Should return second operation
      const operation = queue.getNext();
      expect(operation?.id).toBe(id2);
    });

    it('should skip operations waiting for retry', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      queue.markProcessing(id);
      queue.markFailed(id, 'Test error');

      // Operation should be pending but with nextRetry set
      const operation = queue.get(id);
      expect(operation?.status).toBe('pending');
      expect(operation?.nextRetry).toBeDefined();

      // Should not be returned by getNext (waiting for retry)
      const next = queue.getNext();
      expect(next?.id).not.toBe(id);
    });

    it('should return null when queue is empty', () => {
      const operation = queue.getNext();
      expect(operation).toBeNull();
    });
  });

  describe('markProcessing', () => {
    it('should mark operation as processing', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      queue.markProcessing(id);

      const operation = queue.get(id);
      expect(operation?.status).toBe('processing');
      expect(operation?.attempts).toBe(1);
    });

    it('should increment attempts on each processing', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      queue.markProcessing(id);
      expect(queue.get(id)?.attempts).toBe(1);

      // Simulate retry
      queue.markFailed(id, 'Error');
      queue.markProcessing(id);
      expect(queue.get(id)?.attempts).toBe(2);
    });
  });

  describe('markCompleted', () => {
    it('should mark operation as completed', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      queue.markProcessing(id);
      queue.markCompleted(id);

      const operation = queue.get(id);
      expect(operation?.status).toBe('completed');
    });

    it('should remove operation from processing set', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      queue.markProcessing(id);
      queue.markCompleted(id);

      // Should not be in processing anymore
      const next = queue.getNext();
      expect(next).toBeNull(); // No other pending operations
    });
  });

  describe('markFailed', () => {
    it('should mark operation for retry with exponential backoff', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      queue.markProcessing(id);
      queue.markFailed(id, 'Test error');

      const operation = queue.get(id);
      expect(operation?.status).toBe('pending'); // Ready for retry
      expect(operation?.nextRetry).toBeDefined();
      expect(operation?.error).toBe('Test error');
    });

    it('should use exponential backoff for retry delay', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 3,
      });

      const now = Date.now();

      // First failure - should retry after 2^1 * 1000ms = 2s
      queue.markProcessing(id);
      queue.markFailed(id, 'Error 1');

      let operation = queue.get(id);
      let expectedDelay = Math.pow(2, 1) * 1000; // 2000ms
      let actualDelay = operation!.nextRetry!.getTime() - now;
      
      // Allow small timing variance
      expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 100);
      expect(actualDelay).toBeLessThanOrEqual(expectedDelay + 100);

      // Second failure - should retry after 2^2 * 1000ms = 4s
      queue.markProcessing(id);
      queue.markFailed(id, 'Error 2');

      operation = queue.get(id);
      expectedDelay = Math.pow(2, 2) * 1000; // 4000ms
      actualDelay = operation!.nextRetry!.getTime() - now;
      
      expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 100);
    });

    it('should mark as permanently failed after max attempts', () => {
      const id = queue.add({
        type: 'sync',
        payload: {},
        maxAttempts: 2,
      });

      // Attempt 1
      queue.markProcessing(id);
      queue.markFailed(id, 'Error 1');
      expect(queue.get(id)?.status).toBe('pending');

      // Attempt 2 (last attempt)
      queue.markProcessing(id);
      queue.markFailed(id, 'Error 2');
      expect(queue.get(id)?.status).toBe('failed');
    });
  });

  describe('getAll', () => {
    it('should return all operations', () => {
      queue.add({ type: 'sync', payload: {}, maxAttempts: 3 });
      queue.add({ type: 'update', payload: {}, maxAttempts: 3 });
      queue.add({ type: 'status', payload: {}, maxAttempts: 3 });

      const all = queue.getAll();
      expect(all.length).toBe(3);
    });

    it('should return empty array when queue is empty', () => {
      const all = queue.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      // Add operations in different states
      const id1 = queue.add({ type: 'sync', payload: {}, maxAttempts: 3 });
      const id2 = queue.add({ type: 'sync', payload: {}, maxAttempts: 3 });
      const id3 = queue.add({ type: 'sync', payload: {}, maxAttempts: 1 });

      queue.markProcessing(id2);
      queue.markCompleted(id1);
      queue.markProcessing(id3);
      queue.markFailed(id3, 'Error');

      const stats = queue.getStats();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.pending).toBe(0);
      expect(stats.failed).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all operations', () => {
      queue.add({ type: 'sync', payload: {}, maxAttempts: 3 });
      queue.add({ type: 'update', payload: {}, maxAttempts: 3 });

      expect(queue.getAll().length).toBe(2);

      queue.clear();

      expect(queue.getAll().length).toBe(0);
      expect(queue.getStats().total).toBe(0);
    });
  });
});
