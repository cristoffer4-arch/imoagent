/**
 * Casafari Service - Exportações
 */

// Base Service
export { CasafariService, CasafariApiError, createCasafariService } from './CasafariService';
export type {
  CasafariConfig,
  CasafariSearchFilters,
  CasafariListResponse,
  CasafariDetailResponse,
  CasafariProperty,
  CasafariErrorResponse,
  CacheEntry,
} from './types';

// Valuation & Comparables Service
export { CasafariValuationService, createCasafariValuationService } from './CasafariValuationService';
export type {
  CasafariComparablesLocationBoundary,
  CasafariComparablesFilters,
  CasafariComparableProperty,
  CasafariComparablesStatistics,
  CasafariEstimatedPrices,
  CasafariComparablesResponse,
  CasafariComparablesV2Response,
  CasafariValuationRequest,
  CasafariValuationResponse,
} from './types-valuation';

// Alerts Service
export { CasafariAlertsService, createCasafariAlertsService } from './CasafariAlertsService';
export type {
  CasafariAlertFeed,
  CasafariAlertFilters,
  CasafariAlert,
  CasafariAlertSubtype,
  CasafariAlertsResponse,
  CasafariAlertFeedsResponse,
  CasafariAlertFeedResponse,
  CasafariCreateAlertFeedRequest,
  CasafariUpdateAlertFeedRequest,
  CasafariSearchAlertsRequest,
  CasafariAlertWebhookPayload,
} from './types-alerts';

// Analytics Service
export { CasafariAnalyticsService, createCasafariAnalyticsService } from './CasafariAnalyticsService';
export type {
  CasafariAnalyticsLocation,
  CasafariMarketAnalysisRequest,
  CasafariMarketAnalysisResponse,
  CasafariPriceStatistics,
  CasafariPriceEstimation,
  CasafariPriceEvolution,
  CasafariDistributionRequest,
  CasafariPropertiesDistribution,
  CasafariPriceDistribution,
  CasafariBedroomsDistribution,
  CasafariTimeOnMarketDistribution,
  CasafariTimeSeriesRequest,
  CasafariTimeSeriesResponse,
  CasafariTimeSeriesDataPoint,
  CasafariMarketComparisonRequest,
  CasafariMarketComparisonResponse,
} from './types-analytics';
