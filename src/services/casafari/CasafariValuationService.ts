/**
 * CasafariValuationService - Service for Casafari Valuation and Comparables API
 * 
 * Documentation: https://docs.api.casafari.com/#tag/api-comparables
 * Documentation: https://docs.api.casafari.com/#tag/api-valuation
 * 
 * This service provides methods for:
 * - Searching comparable properties (v1 and v2)
 * - Getting estimated prices for properties
 * - Getting complete property valuations
 * - Comparing property prices with market data
 * 
 * Features:
 * - API authentication via Bearer token
 * - Comprehensive error handling
 * - Request/response validation
 * - Support for both active and transactional data
 */

import type { CasafariConfig } from './types';
import type {
  CasafariComparablesFilters,
  CasafariComparablesResponse,
  CasafariComparablesV2Response,
  CasafariValuationRequest,
  CasafariValuationResponse,
  CasafariEstimatedPrices,
  CasafariComparableProperty,
} from './types-valuation';
import { CasafariApiError } from './CasafariService';

/**
 * Casafari Valuation Service
 */
export class CasafariValuationService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  /**
   * Constructor
   * 
   * @param config - Service configuration
   */
  constructor(config: CasafariConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.casafari.com';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Search comparable properties (v1)
   * 
   * Searches for properties similar to the specified criteria.
   * Returns only active listings.
   * 
   * @param filters - Search filters for comparables
   * @returns List of comparable properties with statistics
   * 
   * @example
   * ```typescript
   * const comparables = await service.searchComparables({
   *   location: {
   *     center: { latitude: 38.7223, longitude: -9.1393, radius: 1000 }
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   minBedrooms: 2,
   *   maxBedrooms: 3,
   *   minPrice: 200000,
   *   maxPrice: 400000,
   *   limit: 50
   * });
   * ```
   */
  async searchComparables(
    filters: CasafariComparablesFilters
  ): Promise<CasafariComparablesResponse> {
    const url = `${this.baseUrl}/api/v1/comparables/search`;

    try {
      const response = await this.makeRequest<CasafariComparablesResponse>(
        url,
        'POST',
        filters
      );

      return response;
    } catch (error) {
      console.error('[CasafariValuationService] Error searching comparables:', error);
      throw error;
    }
  }

  /**
   * Search comparable properties (v2) - includes transactional data
   * 
   * Enhanced version that includes sold and rented properties in addition
   * to active listings. Provides more comprehensive market data.
   * 
   * @param filters - Search filters for comparables (supports includeTransactional)
   * @returns List of comparable properties with transactional statistics
   * 
   * @example
   * ```typescript
   * const comparablesV2 = await service.searchComparablesV2({
   *   location: {
   *     bbox: [-9.2, 38.7, -9.1, 38.8]
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   includeTransactional: true,
   *   soldAfter: '2024-01-01',
   *   limit: 100
   * });
   * ```
   */
  async searchComparablesV2(
    filters: CasafariComparablesFilters
  ): Promise<CasafariComparablesV2Response> {
    const url = `${this.baseUrl}/api/v2/comparables/search`;

    try {
      const response = await this.makeRequest<CasafariComparablesV2Response>(
        url,
        'POST',
        filters
      );

      return response;
    } catch (error) {
      console.error('[CasafariValuationService] Error searching comparables v2:', error);
      throw error;
    }
  }

  /**
   * Get estimated prices for a property based on comparables
   * 
   * Returns price estimation without full valuation details.
   * Faster than full valuation when you only need price estimates.
   * 
   * @param request - Valuation request with property details
   * @returns Estimated prices and confidence level
   * 
   * @example
   * ```typescript
   * const prices = await service.getEstimatedPrices({
   *   location: {
   *     latitude: 38.7223,
   *     longitude: -9.1393,
   *     municipality: 'Lisboa'
   *   },
   *   propertyType: 'apartment',
   *   transactionType: 'sale',
   *   characteristics: {
   *     netArea: 85,
   *     bedrooms: 2,
   *     bathrooms: 1
   *   }
   * });
   * 
   * console.log(`Estimated price: €${prices.estimatedPrice}`);
   * console.log(`Confidence: ${prices.confidence}%`);
   * ```
   */
  async getEstimatedPrices(
    request: CasafariValuationRequest
  ): Promise<CasafariEstimatedPrices> {
    const url = `${this.baseUrl}/api/v1/valuation/comparables-prices`;

    try {
      const response = await this.makeRequest<{ data: CasafariEstimatedPrices }>(
        url,
        'POST',
        request
      );

      return response.data;
    } catch (error) {
      console.error('[CasafariValuationService] Error getting estimated prices:', error);
      throw error;
    }
  }

  /**
   * Get complete property valuation
   * 
   * Performs full property valuation including price estimation,
   * comparable properties, market insights, and statistics.
   * 
   * @param request - Valuation request with complete property details
   * @returns Complete valuation with comparables and market insights
   * 
   * @example
   * ```typescript
   * const valuation = await service.getPropertyValuation({
   *   location: {
   *     address: 'Rua do Comércio 123, Lisboa',
   *     postalCode: '1100-150',
   *     latitude: 38.7223,
   *     longitude: -9.1393
   *   },
   *   propertyType: 'apartment',
   *   transactionType: 'sale',
   *   characteristics: {
   *     netArea: 85,
   *     grossArea: 95,
   *     bedrooms: 2,
   *     bathrooms: 1,
   *     condition: 'used',
   *     energyCertificate: 'B'
   *   },
   *   features: {
   *     hasElevator: true,
   *     hasBalcony: true
   *   },
   *   searchRadius: 1000,
   *   includeTransactional: true
   * });
   * 
   * console.log('Valuation:', valuation.valuation.estimatedPrice);
   * console.log('Market trend:', valuation.marketInsights?.trend);
   * console.log('Comparables used:', valuation.comparables.length);
   * ```
   */
  async getPropertyValuation(
    request: CasafariValuationRequest
  ): Promise<CasafariValuationResponse> {
    try {
      // Build search filters from valuation request
      const filters = this.buildComparablesFiltersFromRequest(request);

      // Search for comparables (use v2 if transactional data requested)
      const comparablesResponse = request.includeTransactional
        ? await this.searchComparablesV2(filters)
        : await this.searchComparables(filters);

      // Get estimated prices
      const estimatedPrices = await this.getEstimatedPrices(request);

      // Build market insights from comparables data
      const marketInsights = this.buildMarketInsights(
        comparablesResponse,
        request.includeTransactional
      );

      // Build valuation response
      const valuation: CasafariValuationResponse = {
        valuation: estimatedPrices,
        comparables: comparablesResponse.data,
        statistics: comparablesResponse.statistics,
        marketInsights,
        meta: {
          requestId: comparablesResponse.meta?.requestId,
          responseTime: comparablesResponse.meta?.responseTime,
          valuationDate: new Date().toISOString(),
        },
      };

      return valuation;
    } catch (error) {
      console.error('[CasafariValuationService] Error getting property valuation:', error);
      throw error;
    }
  }

  /**
   * Compare property price with market data
   * 
   * Analyzes if a property price is below, at, or above market value.
   * Useful for evaluating listing prices or negotiation strategies.
   * 
   * @param request - Valuation request with asking price
   * @param askingPrice - Property asking price to compare
   * @returns Comparison analysis with recommendations
   * 
   * @example
   * ```typescript
   * const comparison = await service.comparePropertyPrice(
   *   {
   *     location: { latitude: 38.7223, longitude: -9.1393 },
   *     propertyType: 'apartment',
   *     transactionType: 'sale',
   *     characteristics: { netArea: 85, bedrooms: 2 }
   *   },
   *   280000
   * );
   * 
   * console.log('Market position:', comparison.position);
   * console.log('Difference:', comparison.differencePercentage + '%');
   * ```
   */
  async comparePropertyPrice(
    request: CasafariValuationRequest,
    askingPrice: number
  ): Promise<{
    askingPrice: number;
    estimatedPrice: number;
    difference: number;
    differencePercentage: number;
    position: 'below' | 'at' | 'above';
    recommendation: string;
    confidence: number;
  }> {
    try {
      const estimatedPrices = await this.getEstimatedPrices(request);

      const difference = askingPrice - estimatedPrices.estimatedPrice;
      const differencePercentage = (difference / estimatedPrices.estimatedPrice) * 100;

      let position: 'below' | 'at' | 'above';
      let recommendation: string;

      if (differencePercentage < -5) {
        position = 'below';
        recommendation = `Property is priced ${Math.abs(differencePercentage).toFixed(1)}% below market value. Good investment opportunity.`;
      } else if (differencePercentage > 5) {
        position = 'above';
        recommendation = `Property is priced ${differencePercentage.toFixed(1)}% above market value. Consider negotiating.`;
      } else {
        position = 'at';
        recommendation = 'Property is priced at market value. Fair price.';
      }

      return {
        askingPrice,
        estimatedPrice: estimatedPrices.estimatedPrice,
        difference,
        differencePercentage,
        position,
        recommendation,
        confidence: estimatedPrices.confidence,
      };
    } catch (error) {
      console.error('[CasafariValuationService] Error comparing property price:', error);
      throw error;
    }
  }

  /**
   * Build comparables filters from valuation request
   * @private
   */
  private buildComparablesFiltersFromRequest(
    request: CasafariValuationRequest
  ): CasafariComparablesFilters {
    const filters: CasafariComparablesFilters = {
      location: {},
      propertyType: [request.propertyType],
      transactionType: request.transactionType,
      includeTransactional: request.includeTransactional,
      limit: request.maxComparables || 50,
    };

    // Set location boundary
    if (request.location.latitude && request.location.longitude) {
      filters.location.center = {
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        radius: request.searchRadius || 1000,
      };
    }

    // Set area filters (with 20% tolerance)
    if (request.characteristics.netArea) {
      const area = request.characteristics.netArea;
      filters.minArea = Math.floor(area * 0.8);
      filters.maxArea = Math.ceil(area * 1.2);
    }

    // Set bedroom filters (exact match or +/- 1)
    if (request.characteristics.bedrooms) {
      const bedrooms = request.characteristics.bedrooms;
      filters.minBedrooms = Math.max(0, bedrooms - 1);
      filters.maxBedrooms = bedrooms + 1;
    }

    // Set condition filter
    if (request.characteristics.condition) {
      filters.condition = [request.characteristics.condition];
    }

    // Set energy rating filter
    if (request.characteristics.energyCertificate) {
      filters.energyRating = [request.characteristics.energyCertificate];
    }

    return filters;
  }

  /**
   * Build market insights from comparables data
   * @private
   */
  private buildMarketInsights(
    comparablesResponse: CasafariComparablesResponse | CasafariComparablesV2Response,
    includeTransactional?: boolean
  ): CasafariValuationResponse['marketInsights'] {
    const stats = comparablesResponse.statistics;
    const hasV2Data = includeTransactional && 'transactionalStatistics' in comparablesResponse;

    // Determine market trend based on price trends (if available)
    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (hasV2Data) {
      const v2Response = comparablesResponse as CasafariComparablesV2Response;
      const trends = v2Response.transactionalStatistics?.priceTrends;
      if (trends && trends.length >= 2) {
        const firstMonth = trends[0].avgPrice;
        const lastMonth = trends[trends.length - 1].avgPrice;
        const change = ((lastMonth - firstMonth) / firstMonth) * 100;
        
        if (change > 3) trend = 'rising';
        else if (change < -3) trend = 'falling';
      }
    }

    // Determine activity level based on number of properties
    let activityLevel: 'high' | 'medium' | 'low';
    if (stats.totalProperties > 50) activityLevel = 'high';
    else if (stats.totalProperties > 20) activityLevel = 'medium';
    else activityLevel = 'low';

    // Determine supply level
    let supplyLevel: 'high' | 'medium' | 'low';
    if (stats.totalProperties > 100) supplyLevel = 'high';
    else if (stats.totalProperties > 30) supplyLevel = 'medium';
    else supplyLevel = 'low';

    const insights: CasafariValuationResponse['marketInsights'] = {
      trend,
      activityLevel,
      supplyLevel,
    };

    // Add transactional insights if available
    if (hasV2Data) {
      const v2Response = comparablesResponse as CasafariComparablesV2Response;
      insights.avgDaysOnMarket = v2Response.transactionalStatistics?.avgTimeOnMarket;
      
      // Calculate price evolution (last 6 months vs first month)
      const trends = v2Response.transactionalStatistics?.priceTrends;
      if (trends && trends.length >= 2) {
        const firstMonth = trends[0].avgPrice;
        const lastMonth = trends[trends.length - 1].avgPrice;
        insights.priceEvolution = ((lastMonth - firstMonth) / firstMonth) * 100;
      }
    }

    return insights;
  }

  /**
   * Make HTTP request to Casafari API
   * @private
   */
  private async makeRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CasafariApiError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.error?.code,
          errorData.error?.details
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof CasafariApiError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new CasafariApiError('Request timeout', 408);
      }

      throw new CasafariApiError(
        `Network error: ${(error as Error).message}`,
        0
      );
    }
  }
}

/**
 * Factory function to create CasafariValuationService instance
 * 
 * @param config - Service configuration (optional, uses env vars if not provided)
 * @returns CasafariValuationService instance
 * 
 * @example
 * ```typescript
 * // Using environment variable CASAFARI_API_KEY
 * const service = createCasafariValuationService();
 * 
 * // With explicit configuration
 * const service = createCasafariValuationService({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.casafari.com',
 *   timeout: 30000
 * });
 * ```
 */
export function createCasafariValuationService(
  config?: Partial<CasafariConfig>
): CasafariValuationService {
  const apiKey = config?.apiKey || process.env.CASAFARI_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      'Casafari API key is required. Set CASAFARI_API_KEY environment variable or provide in config.'
    );
  }

  return new CasafariValuationService({
    apiKey,
    baseUrl: config?.baseUrl,
    timeout: config?.timeout,
  });
}
