/**
 * Retry Logic Tests
 */

import { withRetry, calculateBackoffDelay, sleep, DEFAULT_RETRY_CONFIG } from '../../../src/services/crm/retry';

describe('Retry Logic', () => {
  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay0 = calculateBackoffDelay(0);
      const delay1 = calculateBackoffDelay(1);
      const delay2 = calculateBackoffDelay(2);

      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThanOrEqual(1300);
      
      expect(delay1).toBeGreaterThanOrEqual(2000);
      expect(delay1).toBeLessThanOrEqual(2600);
      
      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThanOrEqual(5200);
    });

    it('should respect max delay', () => {
      const config = {
        ...DEFAULT_RETRY_CONFIG,
        maxDelayMs: 5000,
      };
      
      const delay = calculateBackoffDelay(10, config);
      
      expect(delay).toBeLessThanOrEqual(5000 * 1.3);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified time', async () => {
      const startTime = Date.now();
      await sleep(100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(endTime - startTime).toBeLessThan(150);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn, 'test-operation');
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(mockFn, 'test-operation', {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(
        withRetry(mockFn, 'test-operation', {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow('Persistent failure');
      
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});
