/**
 * CRM Service Module
 * 
 * Export CRM service functionality
 */

export { CRMService, createCRMService } from './CRMService';
export { SyncQueue, syncQueue } from './queue';
export type {
  CRMConfig,
  CRMLead,
  LeadUpdate,
  LeadStatus,
  LeadStage,
  LeadSource,
  SyncResult,
  SyncOperation,
  OrchestratorRequest,
  OrchestratorResponse,
} from './types';
export { LeadStage, LeadSource } from './types';
