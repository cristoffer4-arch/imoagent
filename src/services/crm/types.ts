/**
 * CRM Service Types
 * 
 * Type definitions for CRM integration via IA Orquestradora
 */

import type { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';

/**
 * Lead stage in CRM pipeline
 */
export enum LeadStage {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

/**
 * Lead source
 */
export enum LeadSource {
  CRM = 'crm',
  PORTAL = 'portal',
  MANUAL = 'manual',
  IMPORT = 'import',
}

/**
 * Lead data from CRM
 */
export interface CRMLead {
  id: string;
  crmId: string;
  crmName: string;
  stage: LeadStage;
  source: LeadSource;
  score?: number;
  propertyData?: Partial<PropertyCanonicalModel>;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lead update payload
 */
export interface LeadUpdate {
  leadId: string;
  crmId: string;
  stage?: LeadStage;
  score?: number;
  notes?: string;
  propertyData?: Partial<PropertyCanonicalModel>;
}

/**
 * Lead status response
 */
export interface LeadStatus {
  leadId: string;
  crmId: string;
  stage: LeadStage;
  score?: number;
  lastActivity?: Date;
  nextFollowUp?: Date;
}

/**
 * Sync operation for queue
 */
export interface SyncOperation {
  id: string;
  type: 'sync' | 'update' | 'status';
  payload: unknown;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * CRM sync result
 */
export interface SyncResult {
  success: boolean;
  leadsProcessed: number;
  leadsCreated: number;
  leadsUpdated: number;
  leadsFailed: number;
  errors: Array<{
    leadId: string;
    error: string;
  }>;
  timestamp: Date;
}

/**
 * Orchestrator request payload
 */
export interface OrchestratorRequest {
  action: 'crm.sync' | 'crm.update' | 'crm.status';
  tenantId: string;
  crmName?: string;
  data?: unknown;
}

/**
 * Orchestrator response
 */
export interface OrchestratorResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: Date;
}

/**
 * CRM configuration
 */
export interface CRMConfig {
  orchestratorUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  retryAttempts: number;
  retryDelayMs: number;
  syncBatchSize: number;
}
