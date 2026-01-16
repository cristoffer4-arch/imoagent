/**
 * Casafari Valuation API Types
 * 
 * Type definitions for Casafari Valuation and Comparables API
 * Documentation: https://docs.api.casafari.com/#tag/api-comparables
 * Documentation: https://docs.api.casafari.com/#tag/api-valuation
 */

/**
 * Location boundary for comparables search
 * Can be either a bounding box or a polygon
 */
export interface CasafariComparablesLocationBoundary {
  /** Bounding box coordinates [minLng, minLat, maxLng, maxLat] */
  bbox?: [number, number, number, number];
  /** Polygon coordinates array */
  polygon?: Array<[number, number]>;
  /** Center point with radius in meters */
  center?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

/**
 * Filters for comparables search
 */
export interface CasafariComparablesFilters {
  /** Location boundary (required) */
  location: CasafariComparablesLocationBoundary;
  
  /** Property type (apartment, house, commercial, land, etc.) */
  propertyType?: string[];
  
  /** Transaction type (sale or rent) */
  transactionType?: 'sale' | 'rent';
  
  /** Price range */
  minPrice?: number;
  maxPrice?: number;
  
  /** Area range in m² */
  minArea?: number;
  maxArea?: number;
  
  /** Gross area range in m² */
  minGrossArea?: number;
  maxGrossArea?: number;
  
  /** Land area range in m² */
  minLandArea?: number;
  maxLandArea?: number;
  
  /** Number of bedrooms */
  minBedrooms?: number;
  maxBedrooms?: number;
  
  /** Number of bathrooms */
  minBathrooms?: number;
  maxBathrooms?: number;
  
  /** Energy rating (A+, A, B, C, D, E, F) */
  energyRating?: string[];
  
  /** Property condition (new, used, refurbished) */
  condition?: ('new' | 'used' | 'refurbished')[];
  
  /** Only active listings */
  activeOnly?: boolean;
  
  /** Date range for published properties */
  publishedAfter?: string; // ISO date
  publishedBefore?: string; // ISO date
  
  /** Date range for sold/rented properties (v2 only) */
  soldAfter?: string; // ISO date
  soldBefore?: string; // ISO date
  
  /** Include sold/rented properties (v2 only) */
  includeTransactional?: boolean;
  
  /** Maximum number of results */
  limit?: number;
  
  /** Page number for pagination */
  page?: number;
  
  /** Sort by field */
  sortBy?: 'price' | 'area' | 'pricePerSqm' | 'distance' | 'publishedDate' | 'soldDate';
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Individual comparable property
 */
export interface CasafariComparableProperty {
  /** Unique property identifier */
  id: string;
  
  /** Property type */
  propertyType: string;
  
  /** Transaction type */
  transactionType: 'sale' | 'rent';
  
  /** Property status (active, sold, rented, removed) */
  status?: string;
  
  /** Location information */
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    postalCode?: string;
    parish?: string;
    municipality?: string;
    district?: string;
    country?: string;
  };
  
  /** Price information */
  price: {
    value: number;
    currency: string;
    pricePerSqm?: number;
    condominium?: number;
  };
  
  /** Property characteristics */
  characteristics: {
    netArea?: number;
    grossArea?: number;
    landArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    wc?: number;
    rooms?: number;
    parkingSpaces?: number;
    floor?: number;
    totalFloors?: number;
    condition?: string;
    energyCertificate?: string;
    typology?: string;
  };
  
  /** Distance from reference point (in meters) */
  distance?: number;
  
  /** Match score (0-100) indicating similarity */
  matchScore?: number;
  
  /** Source information */
  source?: {
    portal?: string;
    portalId?: string;
    url?: string;
    agency?: string;
    publishedDate?: string;
    lastUpdated?: string;
    soldDate?: string; // v2 only
  };
  
  /** Property images */
  images?: Array<{
    url: string;
    order?: number;
  }>;
  
  /** Title and description */
  title?: string;
  description?: string;
}

/**
 * Statistics for comparables
 */
export interface CasafariComparablesStatistics {
  /** Total number of comparables found */
  totalProperties: number;
  
  /** Price statistics */
  price: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev?: number;
  };
  
  /** Price per square meter statistics */
  pricePerSqm: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev?: number;
  };
  
  /** Area statistics (m²) */
  area: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  
  /** Days on market statistics (for active listings) */
  daysOnMarket?: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  
  /** Distribution by property type */
  propertyTypeDistribution?: {
    [propertyType: string]: number;
  };
  
  /** Distribution by status (v2 only) */
  statusDistribution?: {
    active?: number;
    sold?: number;
    rented?: number;
    removed?: number;
  };
}

/**
 * Estimated prices for a property
 */
export interface CasafariEstimatedPrices {
  /** Estimated price based on comparables */
  estimatedPrice: number;
  
  /** Confidence level (0-100) */
  confidence: number;
  
  /** Price range (low estimate) */
  priceRangeLow: number;
  
  /** Price range (high estimate) */
  priceRangeHigh: number;
  
  /** Estimated price per square meter */
  estimatedPricePerSqm: number;
  
  /** Number of comparables used for estimation */
  comparablesCount: number;
  
  /** Valuation methodology used */
  methodology?: string;
  
  /** Factors affecting the valuation */
  factors?: {
    location?: number; // -1 to 1 (negative/positive impact)
    condition?: number;
    size?: number;
    amenities?: number;
    market?: number;
  };
}

/**
 * Response for comparables search (v1)
 */
export interface CasafariComparablesResponse {
  /** List of comparable properties */
  data: CasafariComparableProperty[];
  
  /** Statistics for the comparables */
  statistics: CasafariComparablesStatistics;
  
  /** Pagination information */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Response for comparables search (v2) - includes transactional data
 */
export interface CasafariComparablesV2Response extends CasafariComparablesResponse {
  /** Additional statistics for sold/rented properties */
  transactionalStatistics?: {
    /** Average time to sell/rent (days) */
    avgTimeOnMarket: number;
    
    /** Percentage of price reduction */
    avgPriceReduction?: number;
    
    /** Number of sold properties */
    soldCount: number;
    
    /** Number of rented properties */
    rentedCount?: number;
    
    /** Price trends over time */
    priceTrends?: {
      month: string; // YYYY-MM
      avgPrice: number;
      avgPricePerSqm: number;
      count: number;
    }[];
  };
}

/**
 * Request for property valuation
 */
export interface CasafariValuationRequest {
  /** Property location */
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    postalCode?: string;
    municipality?: string;
    district?: string;
    country?: string;
  };
  
  /** Property type */
  propertyType: string;
  
  /** Transaction type */
  transactionType: 'sale' | 'rent';
  
  /** Property characteristics */
  characteristics: {
    netArea?: number;
    grossArea?: number;
    landArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    wc?: number;
    rooms?: number;
    parkingSpaces?: number;
    floor?: number;
    totalFloors?: number;
    condition?: 'new' | 'used' | 'refurbished';
    energyCertificate?: string;
    typology?: string;
  };
  
  /** Features and amenities */
  features?: {
    hasGarden?: boolean;
    hasPool?: boolean;
    hasBalcony?: boolean;
    hasTerrace?: boolean;
    hasGarage?: boolean;
    hasElevator?: boolean;
    hasAirConditioning?: boolean;
    hasParking?: boolean;
  };
  
  /** Search radius for comparables (in meters) */
  searchRadius?: number;
  
  /** Maximum number of comparables to use */
  maxComparables?: number;
  
  /** Include transactional data */
  includeTransactional?: boolean;
}

/**
 * Response for property valuation
 */
export interface CasafariValuationResponse {
  /** Estimated prices */
  valuation: CasafariEstimatedPrices;
  
  /** Comparables used for valuation */
  comparables: CasafariComparableProperty[];
  
  /** Statistics from comparables */
  statistics: CasafariComparablesStatistics;
  
  /** Market insights */
  marketInsights?: {
    /** Market trend (rising, stable, falling) */
    trend: 'rising' | 'stable' | 'falling';
    
    /** Market activity level (high, medium, low) */
    activityLevel: 'high' | 'medium' | 'low';
    
    /** Average days on market for similar properties */
    avgDaysOnMarket?: number;
    
    /** Price evolution percentage (last 6 months) */
    priceEvolution?: number;
    
    /** Supply level (high, medium, low) */
    supplyLevel?: 'high' | 'medium' | 'low';
  };
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
    valuationDate: string; // ISO date
  };
}
