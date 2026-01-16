/**
 * Casafari Market Analytics API Types
 * 
 * Type definitions for Casafari Market Analytics API
 * Documentation: https://docs.api.casafari.com/#tag/market-analytics-api-analysis
 */

/**
 * Location filter for market analytics
 */
export interface CasafariAnalyticsLocation {
  /** Country code (e.g., PT, ES) */
  country?: string;
  
  /** District names */
  district?: string[];
  
  /** Municipality names */
  municipality?: string[];
  
  /** Parish names */
  parish?: string[];
  
  /** Postal codes */
  postalCode?: string[];
  
  /** Bounding box [minLng, minLat, maxLng, maxLat] */
  bbox?: [number, number, number, number];
  
  /** Polygon coordinates */
  polygon?: Array<[number, number]>;
}

/**
 * Market analysis request
 */
export interface CasafariMarketAnalysisRequest {
  /** Location filters (required) */
  location: CasafariAnalyticsLocation;
  
  /** Property type filters */
  propertyType?: string[];
  
  /** Transaction type */
  transactionType?: 'sale' | 'rent';
  
  /** Price range */
  minPrice?: number;
  maxPrice?: number;
  
  /** Area range (m²) */
  minArea?: number;
  maxArea?: number;
  
  /** Bedrooms range */
  minBedrooms?: number;
  maxBedrooms?: number;
  
  /** Date range for analysis */
  dateFrom?: string; // ISO date
  dateTo?: string;   // ISO date
  
  /** Include inactive listings */
  includeInactive?: boolean;
  
  /** Include sold/rented properties */
  includeTransactional?: boolean;
}

/**
 * Price statistics for market analysis
 */
export interface CasafariPriceStatistics {
  /** Minimum price */
  min: number;
  
  /** Maximum price */
  max: number;
  
  /** Mean (average) price */
  mean: number;
  
  /** Median price */
  median: number;
  
  /** Standard deviation */
  stdDev?: number;
  
  /** First quartile (25th percentile) */
  q1?: number;
  
  /** Third quartile (75th percentile) */
  q3?: number;
  
  /** Currency */
  currency: string;
  
  /** Price per square meter statistics */
  pricePerSqm?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev?: number;
  };
}

/**
 * Price estimation with confidence interval
 */
export interface CasafariPriceEstimation {
  /** Estimated price */
  estimate: number;
  
  /** Lower bound of confidence interval */
  lowerBound: number;
  
  /** Upper bound of confidence interval */
  upperBound: number;
  
  /** Confidence level (e.g., 0.95 for 95%) */
  confidenceLevel: number;
  
  /** Currency */
  currency: string;
}

/**
 * Price evolution over time
 */
export interface CasafariPriceEvolution {
  /** Time period (month) */
  period: string; // YYYY-MM
  
  /** Average price for period */
  avgPrice: number;
  
  /** Median price for period */
  medianPrice?: number;
  
  /** Average price per square meter */
  avgPricePerSqm?: number;
  
  /** Number of properties */
  count: number;
  
  /** Percentage change from previous period */
  changePercentage?: number;
}

/**
 * Market analysis response
 */
export interface CasafariMarketAnalysisResponse {
  /** Total properties analyzed */
  totalProperties: number;
  
  /** Active properties count */
  activeProperties?: number;
  
  /** Sold/rented properties count */
  transactionalProperties?: number;
  
  /** Price statistics */
  priceStatistics: CasafariPriceStatistics;
  
  /** Price estimation */
  priceEstimation?: CasafariPriceEstimation;
  
  /** Price evolution (time series) */
  priceEvolution?: CasafariPriceEvolution[];
  
  /** Area statistics (m²) */
  areaStatistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev?: number;
  };
  
  /** Supply and demand indicators */
  marketIndicators: {
    /** Supply level (high, medium, low) */
    supplyLevel: 'high' | 'medium' | 'low';
    
    /** Market trend (rising, stable, falling) */
    trend: 'rising' | 'stable' | 'falling';
    
    /** Market activity (high, medium, low) */
    activityLevel: 'high' | 'medium' | 'low';
    
    /** Average days on market */
    avgDaysOnMarket?: number;
    
    /** Absorption rate (properties sold per month) */
    absorptionRate?: number;
    
    /** Months of inventory */
    monthsOfInventory?: number;
  };
  
  /** Distribution by property type */
  propertyTypeDistribution?: {
    [propertyType: string]: {
      count: number;
      percentage: number;
      avgPrice: number;
    };
  };
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
    analysisDate: string; // ISO date
  };
}

/**
 * Distribution request base
 */
export interface CasafariDistributionRequest {
  /** Location filters (required) */
  location: CasafariAnalyticsLocation;
  
  /** Property type filters */
  propertyType?: string[];
  
  /** Transaction type */
  transactionType?: 'sale' | 'rent';
  
  /** Date range */
  dateFrom?: string; // ISO date
  dateTo?: string;   // ISO date
  
  /** Number of bins/buckets for distribution */
  bins?: number;
  
  /** Include inactive listings */
  includeInactive?: boolean;
  
  /** Include sold/rented properties */
  includeTransactional?: boolean;
}

/**
 * Properties distribution by location
 */
export interface CasafariPropertiesDistribution {
  /** Distribution data */
  data: Array<{
    /** Location identifier (municipality, district, etc.) */
    location: string;
    
    /** Number of properties */
    count: number;
    
    /** Percentage of total */
    percentage: number;
    
    /** Average price */
    avgPrice: number;
    
    /** Average price per sqm */
    avgPricePerSqm?: number;
  }>;
  
  /** Total properties */
  total: number;
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Price distribution (histogram)
 */
export interface CasafariPriceDistribution {
  /** Distribution bins */
  data: Array<{
    /** Bin range start */
    min: number;
    
    /** Bin range end */
    max: number;
    
    /** Number of properties in bin */
    count: number;
    
    /** Percentage of total */
    percentage: number;
    
    /** Bin midpoint */
    midpoint: number;
  }>;
  
  /** Total properties */
  total: number;
  
  /** Statistics */
  statistics: CasafariPriceStatistics;
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Bedrooms distribution
 */
export interface CasafariBedroomsDistribution {
  /** Distribution data */
  data: Array<{
    /** Number of bedrooms (T0, T1, T2, etc.) */
    bedrooms: number;
    
    /** Typology label (e.g., "T2") */
    typology: string;
    
    /** Number of properties */
    count: number;
    
    /** Percentage of total */
    percentage: number;
    
    /** Average price */
    avgPrice: number;
    
    /** Average price per sqm */
    avgPricePerSqm?: number;
  }>;
  
  /** Total properties */
  total: number;
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Time on market distribution
 */
export interface CasafariTimeOnMarketDistribution {
  /** Distribution bins */
  data: Array<{
    /** Bin range start (days) */
    min: number;
    
    /** Bin range end (days) */
    max: number;
    
    /** Number of properties in bin */
    count: number;
    
    /** Percentage of total */
    percentage: number;
    
    /** Bin label (e.g., "0-30 days") */
    label: string;
  }>;
  
  /** Total properties */
  total: number;
  
  /** Statistics */
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev?: number;
  };
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Time series request
 */
export interface CasafariTimeSeriesRequest {
  /** Location filters (required) */
  location: CasafariAnalyticsLocation;
  
  /** Property type filters */
  propertyType?: string[];
  
  /** Transaction type */
  transactionType?: 'sale' | 'rent';
  
  /** Date range (required) */
  dateFrom: string; // ISO date
  dateTo: string;   // ISO date
  
  /** Time interval (month, quarter, year) */
  interval?: 'month' | 'quarter' | 'year';
  
  /** Metrics to include */
  metrics?: Array<
    | 'price'
    | 'pricePerSqm'
    | 'count'
    | 'newListings'
    | 'sold'
    | 'daysOnMarket'
    | 'priceChange'
  >;
  
  /** Include forecast */
  includeForecast?: boolean;
  
  /** Forecast periods */
  forecastPeriods?: number;
  
  /** Area range */
  minArea?: number;
  maxArea?: number;
  
  /** Bedrooms range */
  minBedrooms?: number;
  maxBedrooms?: number;
}

/**
 * Time series data point
 */
export interface CasafariTimeSeriesDataPoint {
  /** Time period */
  period: string; // ISO date or YYYY-MM
  
  /** Timestamp */
  timestamp: number;
  
  /** Metrics */
  avgPrice?: number;
  medianPrice?: number;
  avgPricePerSqm?: number;
  medianPricePerSqm?: number;
  count?: number;
  newListings?: number;
  sold?: number;
  avgDaysOnMarket?: number;
  priceChangePercentage?: number;
  
  /** Confidence interval (for forecasts) */
  lowerBound?: number;
  upperBound?: number;
  
  /** Is forecast */
  isForecast?: boolean;
}

/**
 * Time series response
 */
export interface CasafariTimeSeriesResponse {
  /** Time series data */
  data: CasafariTimeSeriesDataPoint[];
  
  /** Interval used */
  interval: 'month' | 'quarter' | 'year';
  
  /** Date range */
  dateRange: {
    from: string;
    to: string;
  };
  
  /** Summary statistics */
  summary: {
    /** Overall trend (rising, stable, falling) */
    trend: 'rising' | 'stable' | 'falling';
    
    /** Total properties analyzed */
    totalProperties: number;
    
    /** Average price change percentage */
    avgPriceChange?: number;
    
    /** Volatility (coefficient of variation) */
    volatility?: number;
    
    /** Correlation with time (for trend strength) */
    trendStrength?: number;
  };
  
  /** Forecast data (if requested) */
  forecast?: CasafariTimeSeriesDataPoint[];
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
    analysisDate: string;
  };
}

/**
 * Market comparison request
 */
export interface CasafariMarketComparisonRequest {
  /** Primary market location */
  primaryMarket: CasafariAnalyticsLocation;
  
  /** Comparison markets */
  comparisonMarkets: CasafariAnalyticsLocation[];
  
  /** Property type filters */
  propertyType?: string[];
  
  /** Transaction type */
  transactionType?: 'sale' | 'rent';
  
  /** Date range */
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Market comparison response
 */
export interface CasafariMarketComparisonResponse {
  /** Primary market data */
  primaryMarket: {
    location: string;
    analysis: CasafariMarketAnalysisResponse;
  };
  
  /** Comparison markets data */
  comparisonMarkets: Array<{
    location: string;
    analysis: CasafariMarketAnalysisResponse;
    relativeDifference: {
      pricePercentage: number;
      pricePerSqmPercentage: number;
      supplyPercentage: number;
    };
  }>;
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}
