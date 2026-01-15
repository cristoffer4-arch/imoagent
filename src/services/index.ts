/**
 * Index - Exportações de serviços
 */

export {
  GeocodingService,
  type GeocodingResult,
  type ReverseGeocodingResult,
} from './GeocodingService';

export {
  CasafariService,
  CasafariApiError,
  createCasafariService,
  type CasafariConfig,
  type CasafariSearchFilters,
  type CasafariListResponse,
  type CasafariDetailResponse,
  type CasafariProperty,
} from './casafari';
