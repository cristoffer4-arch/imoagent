/**
 * CRM Service Module
 * Exports all CRM service components
 */

export { CRMService } from './CRMService';
export type { CRMServiceConfig } from './CRMService';

export {
  LeadStatus,
  LeadSource,
  SyncStatus,
} from './types';

export type {
  CanonicalLead,
  CRMOrchestratorResponse,
  SyncQueueItem,
  SyncResult,
  UpdateLeadRequest,
  LeadStatusResponse,
} from './types';

export { SyncQueue } from './queue';
export { logger, LogLevel } from './logger';
export type { LogEntry } from './logger';

export {
  withRetry,
  calculateBackoffDelay,
  sleep,
  DEFAULT_RETRY_CONFIG,
} from './retry';
export type { RetryConfig } from './retry';
