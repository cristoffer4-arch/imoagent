/**
 * CRM Service
 * 
 * Service for CRM integration via IA Orquestradora.
 * Communicates ONLY with IA Orquestradora, not directly with external CRMs.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CRMTransformer, type CRMRawData } from '../../models/transformers/CRMTransformer';
import type { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import { syncQueue } from './queue';
import type {
  CRMConfig,
  CRMLead,
  LeadUpdate,
  LeadStatus,
  LeadStage,
  LeadSource,
  SyncResult,
  OrchestratorRequest,
  OrchestratorResponse,
} from './types';

/**
 * CRM Service Configuration Defaults
 */
const DEFAULT_CONFIG: Partial<CRMConfig> = {
  retryAttempts: 3,
  retryDelayMs: 1000,
  syncBatchSize: 50,
};

/**
 * CRM Service for integration via IA Orquestradora
 */
export class CRMService {
  private config: CRMConfig;
  private supabase: SupabaseClient;
  private isProcessing = false;

  constructor(config?: Partial<CRMConfig>) {
    // Build configuration
    const orchestratorUrl =
      config?.orchestratorUrl ||
      process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/ia-orquestradora' ||
      '';
    const supabaseUrl = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = config?.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.config = {
      orchestratorUrl,
      supabaseUrl,
      supabaseKey,
      retryAttempts: config?.retryAttempts ?? DEFAULT_CONFIG.retryAttempts!,
      retryDelayMs: config?.retryDelayMs ?? DEFAULT_CONFIG.retryDelayMs!,
      syncBatchSize: config?.syncBatchSize ?? DEFAULT_CONFIG.syncBatchSize!,
    };

    this.supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[CRMService] Initialized', {
      orchestratorUrl: this.config.orchestratorUrl,
      retryAttempts: this.config.retryAttempts,
      syncBatchSize: this.config.syncBatchSize,
    });
  }

  /**
   * Sync leads from CRM via IA Orquestradora
   * 
   * @param tenantId - Tenant ID for multi-tenancy
   * @param crmName - Name of the CRM (e.g., "Salesforce", "HubSpot")
   * @returns Sync result with statistics
   */
  async syncLeads(tenantId: string, crmName: string): Promise<SyncResult> {
    console.log(`[CRMService] Starting lead sync for tenant ${tenantId}, CRM ${crmName}`);

    const result: SyncResult = {
      success: true,
      leadsProcessed: 0,
      leadsCreated: 0,
      leadsUpdated: 0,
      leadsFailed: 0,
      errors: [],
      timestamp: new Date(),
    };

    try {
      // Request leads from IA Orquestradora
      const orchestratorResponse = await this.callOrchestrator({
        action: 'crm.sync',
        tenantId,
        crmName,
      });

      if (!orchestratorResponse.success) {
        throw new Error(orchestratorResponse.error || 'Orchestrator sync failed');
      }

      // Extract leads from response
      const rawLeads = (orchestratorResponse.data as { leads?: CRMRawData[] })?.leads || [];
      console.log(`[CRMService] Received ${rawLeads.length} leads from orchestrator`);

      // Process leads in batches
      const batches = this.createBatches(rawLeads, this.config.syncBatchSize);

      for (const batch of batches) {
        const batchResult = await this.processBatch(batch, tenantId, crmName);
        result.leadsProcessed += batchResult.processed;
        result.leadsCreated += batchResult.created;
        result.leadsUpdated += batchResult.updated;
        result.leadsFailed += batchResult.failed;
        result.errors.push(...batchResult.errors);
      }

      console.log(`[CRMService] Sync completed`, result);
      return result;
    } catch (error) {
      console.error('[CRMService] Sync failed:', error);
      result.success = false;
      result.errors.push({
        leadId: 'sync',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return result;
    }
  }

  /**
   * Update lead via IA Orquestradora
   * 
   * @param update - Lead update data
   * @returns Success status
   */
  async updateLead(update: LeadUpdate): Promise<boolean> {
    console.log(`[CRMService] Updating lead ${update.leadId}`);

    // Add to queue for retry logic
    const operationId = syncQueue.add({
      type: 'update',
      payload: update,
      maxAttempts: this.config.retryAttempts,
    });

    try {
      syncQueue.markProcessing(operationId);

      // Call orchestrator
      const response = await this.callOrchestrator({
        action: 'crm.update',
        tenantId: '', // Will be extracted from lead
        data: update,
      });

      if (!response.success) {
        throw new Error(response.error || 'Update failed');
      }

      // Update in Supabase
      const { error } = await this.supabase
        .from('leads')
        .update({
          stage: update.stage,
          score: update.score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.leadId);

      if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
      }

      syncQueue.markCompleted(operationId);
      console.log(`[CRMService] Lead ${update.leadId} updated successfully`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CRMService] Lead update failed:`, errorMsg);
      syncQueue.markFailed(operationId, errorMsg);
      return false;
    }
  }

  /**
   * Get lead status via IA Orquestradora
   * 
   * @param leadId - Lead ID
   * @param crmId - CRM ID
   * @returns Lead status or null
   */
  async getLeadStatus(leadId: string, crmId: string): Promise<LeadStatus | null> {
    console.log(`[CRMService] Getting status for lead ${leadId}`);

    try {
      const response = await this.callOrchestrator({
        action: 'crm.status',
        tenantId: '', // Will be extracted from lead
        data: { leadId, crmId },
      });

      if (!response.success) {
        throw new Error(response.error || 'Status query failed');
      }

      const data = response.data as LeadStatus | undefined;
      return data || null;
    } catch (error) {
      console.error('[CRMService] Get status failed:', error);
      return null;
    }
  }

  /**
   * Process queue manually (for periodic processing)
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[CRMService] Queue processing already in progress');
      return;
    }

    this.isProcessing = true;
    console.log('[CRMService] Starting queue processing');

    try {
      let operation = syncQueue.getNext();
      while (operation) {
        console.log(`[CRMService] Processing queued operation ${operation.id}`);

        try {
          if (operation.type === 'update') {
            const update = operation.payload as LeadUpdate;
            await this.updateLead(update);
          }
          // Add other operation types as needed
        } catch (error) {
          console.error(`[CRMService] Operation ${operation.id} failed:`, error);
        }

        operation = syncQueue.getNext();
      }

      console.log('[CRMService] Queue processing completed');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return syncQueue.getStats();
  }

  /**
   * Call IA Orquestradora
   */
  private async callOrchestrator(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    console.log('[CRMService] Calling orchestrator:', request.action);

    try {
      const response = await fetch(this.config.orchestratorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.supabaseKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Orchestrator returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[CRMService] Orchestrator call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Process a batch of leads
   */
  private async processBatch(
    batch: CRMRawData[],
    tenantId: string,
    crmName: string
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ leadId: string; error: string }>;
  }> {
    const result = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ leadId: string; error: string }>,
    };

    for (const rawLead of batch) {
      try {
        result.processed += 1;

        // Transform to canonical model
        const property = CRMTransformer.transform(rawLead, tenantId);

        // Check if lead already exists
        const { data: existingLead } = await this.supabase
          .from('leads')
          .select('id')
          .eq('source', `crm_${crmName}_${rawLead.id}`)
          .single();

        if (existingLead) {
          // Update existing lead
          const { error } = await this.supabase
            .from('leads')
            .update({
              stage: rawLead.status || 'new',
              score: rawLead.viewCount || 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLead.id);

          if (error) {
            throw new Error(`Update failed: ${error.message}`);
          }

          result.updated += 1;
        } else {
          // Create new lead
          const { error } = await this.supabase.from('leads').insert({
            source: `crm_${crmName}_${rawLead.id}`,
            stage: rawLead.status || 'new',
            score: rawLead.viewCount || 0,
            profile_id: tenantId,
          });

          if (error) {
            throw new Error(`Insert failed: ${error.message}`);
          }

          result.created += 1;
        }
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          leadId: rawLead.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[CRMService] Failed to process lead ${rawLead.id}:`, error);
      }
    }

    return result;
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

/**
 * Create a CRMService instance
 */
export function createCRMService(config?: Partial<CRMConfig>): CRMService {
  return new CRMService(config);
}
