/**
 * CRM Service - Integração com CRMs via IA Orquestradora
 * 
 * @module services/crm
 */

export { CRMService, CRMServiceError, createCRMService } from './CRMService';
export { QueueManager } from './QueueManager';
export { LeadTransformer } from './LeadTransformer';
export type { CRMLeadRawData } from './LeadTransformer';
