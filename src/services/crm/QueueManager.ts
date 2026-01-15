/**
 * QueueManager - Gerenciamento de fila com retry logic
 * 
 * Gerencia uma fila de operações CRM com:
 * - Controle de concorrência
 * - Retry com exponential backoff
 * - Logs detalhados
 */

import { QueueItem, QueueStats } from '../../types/crm';

export class QueueManager {
  private queue: Map<string, QueueItem> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrency: number;
  private retryDelay: number;
  private maxRetries: number;

  constructor(
    maxConcurrency: number = 3,
    retryDelay: number = 1000,
    maxRetries: number = 3
  ) {
    this.maxConcurrency = maxConcurrency;
    this.retryDelay = retryDelay;
    this.maxRetries = maxRetries;
  }

  /**
   * Adiciona um item à fila
   */
  enqueue(item: Omit<QueueItem, 'id' | 'retries' | 'status' | 'createdAt'>): string {
    const id = this.generateId();
    const queueItem: QueueItem = {
      id,
      retries: 0,
      status: 'pending',
      createdAt: new Date(),
      ...item,
    };

    this.queue.set(id, queueItem);
    console.log(`[QueueManager] Enqueued item ${id} of type ${item.type}`);
    
    // Tenta processar imediatamente se houver capacidade
    this.processNext();
    
    return id;
  }

  /**
   * Processa o próximo item da fila
   */
  private async processNext(): Promise<void> {
    // Verifica se há capacidade
    if (this.processing.size >= this.maxConcurrency) {
      return;
    }

    // Busca próximo item pendente
    const nextItem = this.getNextPendingItem();
    if (!nextItem) {
      return;
    }

    // Marca como processando
    nextItem.status = 'processing';
    nextItem.lastAttemptAt = new Date();
    this.processing.add(nextItem.id);

    console.log(
      `[QueueManager] Processing item ${nextItem.id} (attempt ${nextItem.retries + 1}/${nextItem.maxRetries})`
    );

    try {
      // O processamento real será feito pelo CRMService
      // Este método apenas gerencia o estado
      this.queue.set(nextItem.id, nextItem);
    } catch (error) {
      console.error(`[QueueManager] Error processing item ${nextItem.id}:`, error);
      await this.handleFailure(nextItem, error as Error);
    }
  }

  /**
   * Marca um item como completado
   */
  complete(itemId: string): void {
    const item = this.queue.get(itemId);
    if (!item) {
      console.warn(`[QueueManager] Item ${itemId} not found`);
      return;
    }

    item.status = 'completed';
    item.completedAt = new Date();
    this.queue.set(itemId, item);
    this.processing.delete(itemId);

    console.log(`[QueueManager] Completed item ${itemId}`);

    // Processa próximo
    this.processNext();
  }

  /**
   * Marca um item como falho e tenta retry
   */
  async fail(itemId: string, error: Error): Promise<void> {
    const item = this.queue.get(itemId);
    if (!item) {
      console.warn(`[QueueManager] Item ${itemId} not found`);
      return;
    }

    await this.handleFailure(item, error);
  }

  /**
   * Lida com falha de processamento
   */
  private async handleFailure(item: QueueItem, error: Error): Promise<void> {
    item.retries += 1;
    item.error = error.message;

    // Verifica se ainda pode fazer retry
    if (item.retries < item.maxRetries) {
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, item.retries - 1);
      
      console.log(
        `[QueueManager] Item ${item.id} failed, retrying in ${delay}ms (${item.retries}/${item.maxRetries})`
      );

      item.status = 'pending';
      this.processing.delete(item.id);
      this.queue.set(item.id, item);

      // Agenda retry
      setTimeout(() => this.processNext(), delay);
    } else {
      // Excedeu número de tentativas
      item.status = 'failed';
      this.processing.delete(item.id);
      this.queue.set(item.id, item);

      console.error(
        `[QueueManager] Item ${item.id} permanently failed after ${item.maxRetries} attempts:`,
        error
      );
    }
  }

  /**
   * Obtém próximo item pendente
   */
  private getNextPendingItem(): QueueItem | null {
    const items = Array.from(this.queue.values());
    for (const item of items) {
      if (item.status === 'pending') {
        return item;
      }
    }
    return null;
  }

  /**
   * Obtém um item da fila
   */
  getItem(itemId: string): QueueItem | undefined {
    return this.queue.get(itemId);
  }

  /**
   * Obtém todos os itens da fila
   */
  getAllItems(): QueueItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Obtém itens por status
   */
  getItemsByStatus(status: QueueItem['status']): QueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === status);
  }

  /**
   * Obtém estatísticas da fila
   */
  getStats(): QueueStats {
    const items = Array.from(this.queue.values());
    return {
      pending: items.filter(i => i.status === 'pending').length,
      processing: items.filter(i => i.status === 'processing').length,
      completed: items.filter(i => i.status === 'completed').length,
      failed: items.filter(i => i.status === 'failed').length,
      total: items.length,
    };
  }

  /**
   * Limpa itens completados ou falhos
   */
  cleanup(olderThanMs: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.queue.entries());
    for (const [id, item] of entries) {
      if (
        (item.status === 'completed' || item.status === 'failed') &&
        item.completedAt &&
        now - item.completedAt.getTime() > olderThanMs
      ) {
        this.queue.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[QueueManager] Cleaned ${cleaned} old items`);
    }

    return cleaned;
  }

  /**
   * Limpa toda a fila
   */
  clear(): void {
    this.queue.clear();
    this.processing.clear();
    console.log('[QueueManager] Queue cleared');
  }

  /**
   * Gera ID único para item da fila
   */
  private generateId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Inicia processamento de itens pendentes
   */
  start(): void {
    console.log('[QueueManager] Starting queue processing');
    // Processa até atingir concorrência máxima
    for (let i = 0; i < this.maxConcurrency; i++) {
      this.processNext();
    }
  }

  /**
   * Para processamento (aguarda itens atuais terminarem)
   */
  async stop(): Promise<void> {
    console.log('[QueueManager] Stopping queue processing');
    // Espera todos os itens em processamento terminarem
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('[QueueManager] Queue stopped');
  }

  /**
   * Verifica se a fila está vazia
   */
  isEmpty(): boolean {
    return this.queue.size === 0;
  }

  /**
   * Verifica se há itens sendo processados
   */
  isProcessing(): boolean {
    return this.processing.size > 0;
  }
}
