/**
 * CRM Service Queue Manager
 * Manages synchronization queue with retry logic
 */

import { SyncQueueItem, SyncStatus } from './types';
import { logger } from './logger';

export class SyncQueue {
  private queue: Map<string, SyncQueueItem> = new Map();
  private processing: boolean = false;

  /**
   * Add item to sync queue
   */
  enqueue(item: Omit<SyncQueueItem, 'id' | 'status' | 'retry_count' | 'created_at' | 'updated_at'>): string {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const queueItem: SyncQueueItem = {
      id,
      status: SyncStatus.PENDING,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    };

    this.queue.set(id, queueItem);
    logger.info('enqueue', `Added item to queue: ${id}`, { action: item.action });
    
    return id;
  }

  /**
   * Get next pending item from queue
   */
  dequeue(): SyncQueueItem | null {
    for (const [id, item] of this.queue) {
      if (item.status === SyncStatus.PENDING || item.status === SyncStatus.RETRY) {
        return item;
      }
    }
    return null;
  }

  /**
   * Update queue item status
   */
  updateStatus(id: string, status: SyncStatus, error?: string): void {
    const item = this.queue.get(id);
    if (!item) {
      logger.warn('updateStatus', `Item not found in queue: ${id}`);
      return;
    }

    item.status = status;
    item.updated_at = new Date().toISOString();
    
    if (error) {
      item.error_message = error;
    }

    if (status === SyncStatus.FAILED && item.retry_count < item.max_retries) {
      item.retry_count++;
      item.status = SyncStatus.RETRY;
      logger.info('updateStatus', `Queuing item for retry: ${id}`, { 
        retry_count: item.retry_count,
        max_retries: item.max_retries 
      });
    }

    this.queue.set(id, item);
  }

  /**
   * Remove item from queue
   */
  remove(id: string): void {
    this.queue.delete(id);
    logger.debug('remove', `Removed item from queue: ${id}`);
  }

  /**
   * Get queue item by ID
   */
  get(id: string): SyncQueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all items with specific status
   */
  getByStatus(status: SyncStatus): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === status);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Clear completed items older than specified time (default: 24 hours)
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    let removed = 0;
    const now = Date.now();

    for (const [id, item] of this.queue) {
      if (item.status === SyncStatus.SUCCESS) {
        const itemAge = now - new Date(item.updated_at).getTime();
        if (itemAge > maxAgeMs) {
          this.queue.delete(id);
          removed++;
        }
      }
    }

    if (removed > 0) {
      logger.info('cleanup', `Cleaned up ${removed} completed items`);
    }

    return removed;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    in_progress: number;
    success: number;
    failed: number;
    retry: number;
  } {
    const items = Array.from(this.queue.values());
    return {
      total: items.length,
      pending: items.filter(i => i.status === SyncStatus.PENDING).length,
      in_progress: items.filter(i => i.status === SyncStatus.IN_PROGRESS).length,
      success: items.filter(i => i.status === SyncStatus.SUCCESS).length,
      failed: items.filter(i => i.status === SyncStatus.FAILED).length,
      retry: items.filter(i => i.status === SyncStatus.RETRY).length,
    };
  }

  /**
   * Check if processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Set processing state
   */
  setProcessing(processing: boolean): void {
    this.processing = processing;
  }
}
