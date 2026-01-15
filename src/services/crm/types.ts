/**
 * CRM Service Types
 * Types for CRM integration via IA Orquestradora
 */

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export enum LeadSource {
  PORTAL = 'PORTAL',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  MANUAL = 'MANUAL',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

/**
 * Canonical Lead Model
 * Standard format for lead data across all CRMs
 */
export interface CanonicalLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  property_interest?: {
    typology?: string;
    location?: string;
    price_range?: {
      min?: number;
      max?: number;
    };
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * CRM API Response from IA Orquestradora
 */
export interface CRMOrchestratorResponse {
  success: boolean;
  action: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Sync Queue Item
 */
export interface SyncQueueItem {
  id: string;
  action: 'sync' | 'update' | 'get_status';
  lead_data: CanonicalLead | Partial<CanonicalLead>;
  status: SyncStatus;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

/**
 * Sync Result
 */
export interface SyncResult {
  success: boolean;
  synced_leads: number;
  failed_leads: number;
  errors: Array<{
    lead_id: string;
    error: string;
  }>;
}

/**
 * Update Lead Request
 */
export interface UpdateLeadRequest {
  lead_id: string;
  updates: Partial<CanonicalLead>;
}

/**
 * Lead Status Response
 */
export interface LeadStatusResponse {
  lead_id: string;
  status: LeadStatus;
  last_updated: string;
  crm_metadata?: Record<string, any>;
}
