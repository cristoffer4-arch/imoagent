/**
 * Index - Exportações de serviços
 */

export {
  GeocodingService,
  type GeocodingResult,
  type ReverseGeocodingResult,
} from './GeocodingService';

export {
  CRMService,
  createCRMService,
  syncQueue,
  LeadStage,
  LeadSource,
  type CRMConfig,
  type CRMLead,
  type LeadUpdate,
  type LeadStatus,
  type SyncResult,
  type SyncOperation,
  type OrchestratorRequest,
  type OrchestratorResponse,
} from './crm';
