/**
 * CRMService - Serviço de integração com CRMs via IA Orquestradora
 * 
 * Este serviço se comunica APENAS com a IA Orquestradora, que por sua vez
 * se comunica com os módulos específicos de CRM.
 * 
 * Funcionalidades:
 * - syncLeads: Sincroniza leads do CRM
 * - updateLead: Atualiza lead no CRM
 * - getLeadStatus: Obtém status de um lead
 * 
 * Recursos:
 * - Fila com retry logic (exponential backoff)
 * - Transformação automática para modelo canônico
 * - Logs detalhados
 * - Tratamento de erros robusto
 */

import { QueueManager } from './QueueManager';
import { LeadTransformer, CRMLeadRawData } from './LeadTransformer';
import type {
  CRMServiceConfig,
  Lead,
  SyncLeadsRequest,
  SyncLeadsResponse,
  UpdateLeadRequest,
  UpdateLeadResponse,
  GetLeadStatusRequest,
  GetLeadStatusResponse,
  OrchestratorCRMPayload,
  OrchestratorCRMResponse,
  QueueStats,
} from '../../types/crm';

/**
 * Serviço CRM
 */
export class CRMService {
  private orchestratorUrl: string;
  private tenantId: string;
  private teamId?: string;
  private timeout: number;
  private maxRetries: number;
  private queueManager: QueueManager;

  constructor(config: CRMServiceConfig) {
    this.orchestratorUrl = config.orchestratorUrl;
    this.tenantId = config.tenantId;
    this.teamId = config.teamId;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;

    // Inicializa QueueManager
    this.queueManager = new QueueManager(
      config.queueConcurrency || 3,
      config.retryDelay || 1000,
      this.maxRetries
    );

    console.log('[CRMService] Initialized with orchestrator:', this.orchestratorUrl);
  }

  /**
   * Sincroniza leads do CRM
   * 
   * @param crmName - Nome do CRM (ex: "Salesforce", "HubSpot", "Pipedrive")
   * @param filters - Filtros opcionais de busca
   * @returns Promise com leads sincronizados
   */
  async syncLeads(
    crmName: string,
    filters?: SyncLeadsRequest['filters']
  ): Promise<SyncLeadsResponse> {
    console.log(`[CRMService] Syncing leads from ${crmName}`);

    const request: SyncLeadsRequest = {
      tenantId: this.tenantId,
      teamId: this.teamId,
      crmName,
      filters,
    };

    const payload: OrchestratorCRMPayload = {
      target: 'ia-leads-comissoes',
      action: 'sync_leads',
      tenantId: this.tenantId,
      teamId: this.teamId,
      crmName,
      data: request,
    };

    // Adiciona à fila
    const queueItemId = this.queueManager.enqueue({
      type: 'sync_leads',
      payload,
      maxRetries: this.maxRetries,
    });

    try {
      // Executa chamada ao orquestrador
      const response = await this.callOrchestrator<SyncLeadsResponse>(payload);

      // Marca como completado na fila
      this.queueManager.complete(queueItemId);

      // Transforma leads para modelo canônico se necessário
      if (response.success && response.leads) {
        console.log(
          `[CRMService] Successfully synced ${response.leads.length} leads from ${crmName}`
        );
      }

      return response;
    } catch (error) {
      // Marca como falho na fila (com retry automático)
      await this.queueManager.fail(queueItemId, error as Error);
      
      console.error(`[CRMService] Failed to sync leads from ${crmName}:`, error);
      
      return {
        success: false,
        leads: [],
        syncMetadata: {
          syncedAt: new Date(),
          source: crmName,
          totalProcessed: 0,
          totalSuccess: 0,
          totalFailed: 1,
        },
        error: (error as Error).message,
      };
    }
  }

  /**
   * Atualiza um lead no CRM
   * 
   * @param leadId - ID do lead
   * @param crmName - Nome do CRM
   * @param updates - Dados para atualização
   * @returns Promise com resultado da atualização
   */
  async updateLead(
    leadId: string,
    crmName: string,
    updates: UpdateLeadRequest['updates']
  ): Promise<UpdateLeadResponse> {
    console.log(`[CRMService] Updating lead ${leadId} in ${crmName}`);

    const request: UpdateLeadRequest = {
      leadId,
      tenantId: this.tenantId,
      crmName,
      updates,
    };

    const payload: OrchestratorCRMPayload = {
      target: 'ia-leads-comissoes',
      action: 'update_lead',
      tenantId: this.tenantId,
      teamId: this.teamId,
      crmName,
      data: request,
    };

    // Adiciona à fila
    const queueItemId = this.queueManager.enqueue({
      type: 'update_lead',
      payload,
      maxRetries: this.maxRetries,
    });

    try {
      // Executa chamada ao orquestrador
      const response = await this.callOrchestrator<UpdateLeadResponse>(payload);

      // Marca como completado na fila
      this.queueManager.complete(queueItemId);

      if (response.success) {
        console.log(`[CRMService] Successfully updated lead ${leadId} in ${crmName}`);
      }

      return response;
    } catch (error) {
      // Marca como falho na fila (com retry automático)
      await this.queueManager.fail(queueItemId, error as Error);
      
      console.error(`[CRMService] Failed to update lead ${leadId}:`, error);
      
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Obtém status de um lead
   * 
   * @param leadId - ID do lead
   * @param crmName - Nome do CRM
   * @returns Promise com status do lead
   */
  async getLeadStatus(
    leadId: string,
    crmName: string
  ): Promise<GetLeadStatusResponse> {
    console.log(`[CRMService] Getting status for lead ${leadId} from ${crmName}`);

    const request: GetLeadStatusRequest = {
      leadId,
      tenantId: this.tenantId,
      crmName,
    };

    const payload: OrchestratorCRMPayload = {
      target: 'ia-leads-comissoes',
      action: 'get_lead_status',
      tenantId: this.tenantId,
      teamId: this.teamId,
      crmName,
      data: request,
    };

    // Adiciona à fila
    const queueItemId = this.queueManager.enqueue({
      type: 'get_lead_status',
      payload,
      maxRetries: this.maxRetries,
    });

    try {
      // Executa chamada ao orquestrador
      const response = await this.callOrchestrator<GetLeadStatusResponse>(payload);

      // Marca como completado na fila
      this.queueManager.complete(queueItemId);

      if (response.success) {
        console.log(`[CRMService] Got status for lead ${leadId}: ${response.status}`);
      }

      return response;
    } catch (error) {
      // Marca como falho na fila (com retry automático)
      await this.queueManager.fail(queueItemId, error as Error);
      
      console.error(`[CRMService] Failed to get lead status ${leadId}:`, error);
      
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Transforma dados brutos de CRM para Lead canônico
   * Útil para processar respostas do orquestrador
   */
  transformLead(crmData: CRMLeadRawData): Lead {
    return LeadTransformer.transform(crmData, this.tenantId, this.teamId);
  }

  /**
   * Transforma múltiplos leads
   */
  transformLeads(crmDataArray: CRMLeadRawData[]): Lead[] {
    return LeadTransformer.transformBatch(crmDataArray, this.tenantId, this.teamId);
  }

  /**
   * Obtém estatísticas da fila
   */
  getQueueStats(): QueueStats {
    return this.queueManager.getStats();
  }

  /**
   * Limpa fila de itens antigos
   */
  cleanupQueue(olderThanMs?: number): number {
    return this.queueManager.cleanup(olderThanMs);
  }

  /**
   * Limpa toda a fila
   */
  clearQueue(): void {
    this.queueManager.clear();
  }

  /**
   * Chama a IA Orquestradora
   * 
   * @private
   */
  private async callOrchestrator<T>(
    payload: OrchestratorCRMPayload
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log('[CRMService] Calling orchestrator:', {
        url: this.orchestratorUrl,
        action: payload.action,
        target: payload.target,
      });

      const response = await fetch(this.orchestratorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CRMServiceError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'ORCHESTRATOR_ERROR'
        );
      }

      const orchestratorResponse: OrchestratorCRMResponse = await response.json();

      // Verifica se orquestrador retornou erro
      if (orchestratorResponse.status === 'error') {
        throw new CRMServiceError(
          orchestratorResponse.error || 'Unknown orchestrator error',
          500,
          'ORCHESTRATOR_PROCESSING_ERROR'
        );
      }

      console.log('[CRMService] Orchestrator response:', {
        function: orchestratorResponse.function,
        status: orchestratorResponse.status,
        action: orchestratorResponse.action,
        processingTime: orchestratorResponse.processingTime,
      });

      return orchestratorResponse.data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof CRMServiceError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new CRMServiceError('Request timeout', 408, 'TIMEOUT');
      }

      throw new CRMServiceError(
        `Network error: ${(error as Error).message}`,
        0,
        'NETWORK_ERROR'
      );
    }
  }
}

/**
 * Erro customizado para CRMService
 */
export class CRMServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'CRMServiceError';
  }
}

/**
 * Factory function para criar instância do serviço
 */
export function createCRMService(config: Partial<CRMServiceConfig>): CRMService {
  // URL do orquestrador (Edge Function)
  const orchestratorUrl =
    config.orchestratorUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ia-orquestradora`
      : 'https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-orquestradora';

  const tenantId = config.tenantId || process.env.NEXT_PUBLIC_TENANT_ID || '';

  if (!tenantId) {
    throw new Error('Tenant ID is required. Provide in config or set NEXT_PUBLIC_TENANT_ID environment variable.');
  }

  return new CRMService({
    orchestratorUrl,
    tenantId,
    teamId: config.teamId,
    timeout: config.timeout,
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay,
    queueConcurrency: config.queueConcurrency,
  });
}
