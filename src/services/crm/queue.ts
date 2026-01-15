/**
 * CRM Sync Queue
 * 
 * Manages synchronization queue with retry logic and exponential backoff
 */

import type { SyncOperation } from './types';

/**
 * In-memory sync queue with retry logic
 */
export class SyncQueue {
  private queue: Map<string, SyncOperation> = new Map();
  private processing: Set<string> = new Set();

  /**
   * Add operation to queue
   */
  add(operation: Omit<SyncOperation, 'id' | 'attempts' | 'createdAt' | 'status'>): string {
    const id = this.generateId();
    const op: SyncOperation = {
      ...operation,
      id,
      attempts: 0,
      createdAt: new Date(),
      status: 'pending',
    };

    this.queue.set(id, op);
    console.log(`[SyncQueue] Added operation ${id} (type: ${op.type})`);
    return id;
  }

  /**
   * Get next operation to process
   */
  getNext(): SyncOperation | null {
    const now = new Date();

    for (const [id, op] of this.queue.entries()) {
      // Skip if already processing
      if (this.processing.has(id)) {
        continue;
      }

      // Skip if waiting for retry
      if (op.nextRetry && op.nextRetry > now) {
        continue;
      }

      // Skip if failed permanently
      if (op.status === 'failed' && op.attempts >= op.maxAttempts) {
        continue;
      }

      // Skip if completed
      if (op.status === 'completed') {
        continue;
      }

      return op;
    }

    return null;
  }

  /**
   * Mark operation as processing
   */
  markProcessing(id: string): void {
    const op = this.queue.get(id);
    if (op) {
      op.status = 'processing';
      op.attempts += 1;
      this.processing.add(id);
      console.log(`[SyncQueue] Processing operation ${id} (attempt ${op.attempts}/${op.maxAttempts})`);
    }
  }

  /**
   * Mark operation as completed
   */
  markCompleted(id: string): void {
    const op = this.queue.get(id);
    if (op) {
      op.status = 'completed';
      this.processing.delete(id);
      console.log(`[SyncQueue] Completed operation ${id}`);
      
      // Remove completed operations after 5 minutes (for cleanup)
      setTimeout(() => {
        this.queue.delete(id);
        console.log(`[SyncQueue] Cleaned up operation ${id}`);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Mark operation as failed with retry
   */
  markFailed(id: string, error: string): void {
    const op = this.queue.get(id);
    if (!op) return;

    op.error = error;
    this.processing.delete(id);

    // Check if should retry
    if (op.attempts < op.maxAttempts) {
      // Calculate exponential backoff: 2^attempts * base delay
      const backoffMs = Math.pow(2, op.attempts) * 1000; // 1s, 2s, 4s, 8s, etc.
      op.nextRetry = new Date(Date.now() + backoffMs);
      op.status = 'pending';
      console.log(`[SyncQueue] Failed operation ${id} (attempt ${op.attempts}/${op.maxAttempts}), retry in ${backoffMs}ms`);
    } else {
      op.status = 'failed';
      console.error(`[SyncQueue] Operation ${id} failed permanently after ${op.attempts} attempts: ${error}`);
    }
  }

  /**
   * Get operation by ID
   */
  get(id: string): SyncOperation | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all operations
   */
  getAll(): SyncOperation[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const stats = {
      total: this.queue.size,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const op of this.queue.values()) {
      stats[op.status] += 1;
    }

    return stats;
  }

  /**
   * Clear all operations (use with caution)
   */
  clear(): void {
    this.queue.clear();
    this.processing.clear();
    console.log('[SyncQueue] Cleared all operations');
  }

  /**
   * Generate unique ID for operation
   */
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Global sync queue instance
 */
export const syncQueue = new SyncQueue();
