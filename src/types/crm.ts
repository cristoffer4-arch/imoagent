/**
 * CRM Types - Tipos para integração com CRMs via IA Orquestradora
 * 
 * Este arquivo define os tipos para comunicação entre CRMService
 * e a IA Orquestradora, seguindo o modelo canônico do projeto.
 */

/**
 * Status de um lead no CRM
 */
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  LOST = 'lost',
}

/**
 * Origem do lead
 */
export enum LeadSource {
  WEBSITE = 'website',
  PORTAL = 'portal',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  CAMPAIGN = 'campaign',
  OTHER = 'other',
}

/**
 * Tipo de interesse do lead
 */
export enum LeadInterestType {
  BUY = 'buy',
  SELL = 'sell',
  RENT = 'rent',
  RENT_OUT = 'rent_out',
}

/**
 * Lead no formato canônico
 */
export interface Lead {
  id: string;
  tenantId: string;
  teamId?: string;
  
  // Informações do lead
  name: string;
  email?: string;
  phone?: string;
  
  // Status e classificação
  status: LeadStatus;
  source: LeadSource;
  score?: number; // 0-100
  
  // Interesse
  interestType: LeadInterestType;
  propertyId?: string; // ID da propriedade de interesse
  
  // Localização de interesse
  locationInterest?: {
    concelho?: string;
    distrito?: string;
    freguesia?: string;
  };
  
  // Orçamento
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  
  // Informações adicionais
  message?: string;
  notes?: string;
  
  // Metadados
  metadata: {
    sources: Array<{
      type: 'CRM' | 'MANUAL' | 'IMPORT';
      name: string;
      id: string;
      url?: string;
    }>;
    agentId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Requisição para sincronizar leads do CRM
 */
export interface SyncLeadsRequest {
  tenantId: string;
  teamId?: string;
  crmName: string;
  filters?: {
    status?: LeadStatus[];
    dateFrom?: string; // ISO date
    dateTo?: string; // ISO date
    limit?: number;
    offset?: number;
  };
}

/**
 * Resposta da sincronização de leads
 */
export interface SyncLeadsResponse {
  success: boolean;
  leads: Lead[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  syncMetadata: {
    syncedAt: Date;
    source: string;
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
  };
  error?: string;
}

/**
 * Requisição para atualizar um lead
 */
export interface UpdateLeadRequest {
  leadId: string;
  tenantId: string;
  crmName: string;
  updates: {
    status?: LeadStatus;
    score?: number;
    notes?: string;
    agentId?: string;
    nextFollowUpDate?: Date;
    metadata?: Record<string, any>;
  };
}

/**
 * Resposta da atualização de lead
 */
export interface UpdateLeadResponse {
  success: boolean;
  lead?: Lead;
  error?: string;
}

/**
 * Requisição para obter status de um lead
 */
export interface GetLeadStatusRequest {
  leadId: string;
  tenantId: string;
  crmName: string;
}

/**
 * Resposta do status do lead
 */
export interface GetLeadStatusResponse {
  success: boolean;
  lead?: Lead;
  status?: LeadStatus;
  lastUpdated?: Date;
  error?: string;
}

/**
 * Payload para comunicação com IA Orquestradora
 */
export interface OrchestratorCRMPayload {
  target: 'ia-leads-comissoes';
  action: 'sync_leads' | 'update_lead' | 'get_lead_status';
  tenantId: string;
  teamId?: string;
  crmName: string;
  data: SyncLeadsRequest | UpdateLeadRequest | GetLeadStatusRequest;
}

/**
 * Resposta da IA Orquestradora
 */
export interface OrchestratorCRMResponse {
  function: string;
  status: 'ok' | 'error' | 'processing';
  action: string;
  data: SyncLeadsResponse | UpdateLeadResponse | GetLeadStatusResponse;
  error?: string;
  processingTime?: number;
}

/**
 * Item da fila de sincronização
 */
export interface QueueItem {
  id: string;
  type: 'sync_leads' | 'update_lead' | 'get_lead_status';
  payload: OrchestratorCRMPayload;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  lastAttemptAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Configuração do CRMService
 */
export interface CRMServiceConfig {
  orchestratorUrl: string;
  tenantId: string;
  teamId?: string;
  timeout?: number; // milliseconds, default 30000
  maxRetries?: number; // default 3
  retryDelay?: number; // milliseconds, default 1000
  queueConcurrency?: number; // default 3
}

/**
 * Estatísticas da fila
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}
