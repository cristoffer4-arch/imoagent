/**
 * CRM Service
 * Communicates with CRM systems ONLY through IA Orquestradora
 * Never connects directly to CRM APIs
 */

import {
  CanonicalLead,
  CRMOrchestratorResponse,
  SyncResult,
  UpdateLeadRequest,
  LeadStatusResponse,
  LeadStatus,
  SyncStatus,
} from './types';
import { SyncQueue } from './queue';
import { logger } from './logger';
import { withRetry, DEFAULT_RETRY_CONFIG, RetryConfig } from './retry';

export interface CRMServiceConfig {
  orchestratorUrl: string;
  retryConfig?: RetryConfig;
  enableQueue?: boolean;
  autoProcessQueue?: boolean;
  queueProcessIntervalMs?: number;
}

const DEFAULT_CONFIG: Partial<CRMServiceConfig> = {
  retryConfig: DEFAULT_RETRY_CONFIG,
  enableQueue: true,
  autoProcessQueue: false,
  queueProcessIntervalMs: 5000,
};

export class CRMService {
  private config: CRMServiceConfig;
  private queue: SyncQueue;
  private queueProcessorInterval?: NodeJS.Timeout;

  constructor(config: CRMServiceConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new SyncQueue();
    
    logger.info('constructor', 'CRMService initialized', {
      orchestratorUrl: this.config.orchestratorUrl,
      enableQueue: this.config.enableQueue,
    });

    if (this.config.autoProcessQueue) {
      this.startQueueProcessor();
    }
  }

  /**
   * Call IA Orquestradora with CRM action
   * This is the ONLY method that communicates with external services
   */
  private async callOrchestrator(
    action: string,
    payload: any
  ): Promise<CRMOrchestratorResponse> {
    const requestBody = {
      module: 'ia-busca',
      action: `crm_${action}`,
      payload,
      timestamp: new Date().toISOString(),
    };

    logger.debug('callOrchestrator', `Calling orchestrator for action: ${action}`, requestBody);

    try {
      const response = await fetch(this.config.orchestratorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Orchestrator returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('callOrchestrator', `Orchestrator response for ${action}`, {
        success: data.success,
        action: data.action,
      });

      return data as CRMOrchestratorResponse;
    } catch (error) {
      logger.error('callOrchestrator', `Error calling orchestrator for ${action}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Transform lead data to canonical format
   * Ensures consistent data structure across different CRM systems
   */
  private transformToCanonical(rawLead: any): CanonicalLead {
    return {
      id: rawLead.id || rawLead.external_id || `lead_${Date.now()}`,
      name: rawLead.name || rawLead.full_name || 'Unknown',
      email: rawLead.email || rawLead.email_address,
      phone: rawLead.phone || rawLead.phone_number || rawLead.mobile,
      source: rawLead.source || 'MANUAL',
      status: rawLead.status || LeadStatus.NEW,
      property_interest: rawLead.property_interest || rawLead.interests || {},
      metadata: rawLead.metadata || rawLead.custom_fields || {},
      created_at: rawLead.created_at || new Date().toISOString(),
      updated_at: rawLead.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Sync leads from CRM via IA Orquestradora
   * @param leads - Array of leads to sync
   * @returns Sync result with statistics
   */
  async syncLeads(leads: any[]): Promise<SyncResult> {
    logger.info('syncLeads', `Starting sync for ${leads.length} leads`);

    const result: SyncResult = {
      success: true,
      synced_leads: 0,
      failed_leads: 0,
      errors: [],
    };

    // Transform leads to canonical format
    const canonicalLeads = leads.map(lead => this.transformToCanonical(lead));

    if (this.config.enableQueue) {
      // Add to queue for batch processing
      for (const lead of canonicalLeads) {
        this.queue.enqueue({
          action: 'sync',
          lead_data: lead,
          max_retries: this.config.retryConfig?.maxRetries || 3,
        });
      }
      
      result.synced_leads = canonicalLeads.length;
      logger.info('syncLeads', `Added ${canonicalLeads.length} leads to queue`);
      
      return result;
    }

    // Direct sync without queue
    for (const lead of canonicalLeads) {
      try {
        await withRetry(
          async () => {
            const response = await this.callOrchestrator('sync_lead', { lead });
            
            if (!response.success) {
              throw new Error(response.error || 'Sync failed');
            }
            
            return response;
          },
          `syncLead-${lead.id}`,
          this.config.retryConfig
        );

        result.synced_leads++;
      } catch (error) {
        result.failed_leads++;
        result.success = false;
        result.errors.push({
          lead_id: lead.id,
          error: (error as Error).message,
        });
        
        logger.error('syncLeads', `Failed to sync lead ${lead.id}`, {
          error: (error as Error).message,
        });
      }
    }

    logger.info('syncLeads', 'Sync completed', {
      synced: result.synced_leads,
      failed: result.failed_leads,
    });

    return result;
  }

  /**
   * Update lead status via IA Orquestradora
   * @param request - Lead update request
   * @returns Success status
   */
  async updateLead(request: UpdateLeadRequest): Promise<boolean> {
    logger.info('updateLead', `Updating lead ${request.lead_id}`);

    if (this.config.enableQueue) {
      this.queue.enqueue({
        action: 'update',
        lead_data: { id: request.lead_id, ...request.updates },
        max_retries: this.config.retryConfig?.maxRetries || 3,
      });
      
      logger.info('updateLead', `Added update for lead ${request.lead_id} to queue`);
      return true;
    }

    try {
      const response = await withRetry(
        async () => {
          const result = await this.callOrchestrator('update_lead', request);
          
          if (!result.success) {
            throw new Error(result.error || 'Update failed');
          }
          
          return result;
        },
        `updateLead-${request.lead_id}`,
        this.config.retryConfig
      );

      logger.info('updateLead', `Successfully updated lead ${request.lead_id}`);
      return response.success;
    } catch (error) {
      logger.error('updateLead', `Failed to update lead ${request.lead_id}`, {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get lead status from CRM via IA Orquestradora
   * @param leadId - Lead identifier
   * @returns Lead status information
   */
  async getLeadStatus(leadId: string): Promise<LeadStatusResponse | null> {
    logger.info('getLeadStatus', `Getting status for lead ${leadId}`);

    try {
      const response = await withRetry(
        async () => {
          const result = await this.callOrchestrator('get_lead_status', { lead_id: leadId });
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to get status');
          }
          
          return result;
        },
        `getLeadStatus-${leadId}`,
        this.config.retryConfig
      );

      const statusResponse: LeadStatusResponse = {
        lead_id: leadId,
        status: response.data?.status || LeadStatus.NEW,
        last_updated: response.data?.last_updated || new Date().toISOString(),
        crm_metadata: response.data?.metadata || {},
      };

      logger.info('getLeadStatus', `Retrieved status for lead ${leadId}`, {
        status: statusResponse.status,
      });

      return statusResponse;
    } catch (error) {
      logger.error('getLeadStatus', `Failed to get status for lead ${leadId}`, {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Process queue items
   */
  async processQueue(): Promise<void> {
    if (this.queue.isProcessing()) {
      logger.debug('processQueue', 'Queue is already being processed');
      return;
    }

    this.queue.setProcessing(true);
    logger.info('processQueue', 'Starting queue processing');

    try {
      let processed = 0;
      let item = this.queue.dequeue();

      while (item) {
        this.queue.updateStatus(item.id, SyncStatus.IN_PROGRESS);

        try {
          let response: CRMOrchestratorResponse;

          switch (item.action) {
            case 'sync':
              response = await this.callOrchestrator('sync_lead', { lead: item.lead_data });
              break;
            case 'update':
              response = await this.callOrchestrator('update_lead', { 
                lead_id: (item.lead_data as any).id,
                updates: item.lead_data 
              });
              break;
            case 'get_status':
              response = await this.callOrchestrator('get_lead_status', { 
                lead_id: (item.lead_data as any).id 
              });
              break;
            default:
              throw new Error(`Unknown action: ${item.action}`);
          }

          if (response.success) {
            this.queue.updateStatus(item.id, SyncStatus.SUCCESS);
            processed++;
          } else {
            this.queue.updateStatus(item.id, SyncStatus.FAILED, response.error);
          }
        } catch (error) {
          this.queue.updateStatus(item.id, SyncStatus.FAILED, (error as Error).message);
        }

        item = this.queue.dequeue();
      }

      logger.info('processQueue', `Queue processing completed`, { processed });
    } finally {
      this.queue.setProcessing(false);
    }

    // Cleanup old successful items
    this.queue.cleanup();
  }

  /**
   * Start automatic queue processor
   */
  private startQueueProcessor(): void {
    if (this.queueProcessorInterval) {
      return;
    }

    logger.info('startQueueProcessor', 'Starting automatic queue processor', {
      intervalMs: this.config.queueProcessIntervalMs,
    });

    this.queueProcessorInterval = setInterval(
      () => this.processQueue(),
      this.config.queueProcessIntervalMs
    );
  }

  /**
   * Stop automatic queue processor
   */
  stopQueueProcessor(): void {
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = undefined;
      logger.info('stopQueueProcessor', 'Stopped automatic queue processor');
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue.getStats();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopQueueProcessor();
    logger.info('destroy', 'CRMService destroyed');
  }
}
