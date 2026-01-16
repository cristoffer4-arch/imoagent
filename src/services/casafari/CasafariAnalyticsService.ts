/**
 * CasafariAnalyticsService - Service for Casafari Market Analytics API
 * 
 * Documentation: https://docs.api.casafari.com/#tag/market-analytics-api-analysis
 * 
 * This service provides methods for:
 * - Market analysis by location and property characteristics
 * - Property distribution analysis (by location, price, bedrooms, time on market)
 * - Price and market trends over time
 * - Market comparison between different regions
 * 
 * Features:
 * - API authentication via Bearer token
 * - Comprehensive error handling
 * - Request/response validation
 * - Support for various location filters and property criteria
 */

import type { CasafariConfig } from './types';
import type {
  CasafariMarketAnalysisRequest,
  CasafariMarketAnalysisResponse,
  CasafariDistributionRequest,
  CasafariPropertiesDistribution,
  CasafariPriceDistribution,
  CasafariBedroomsDistribution,
  CasafariTimeOnMarketDistribution,
  CasafariTimeSeriesRequest,
  CasafariTimeSeriesResponse,
  CasafariMarketComparisonRequest,
  CasafariMarketComparisonResponse,
} from './types-analytics';
import { CasafariApiError } from './CasafariService';

/**
 * Casafari Analytics Service
 */
export class CasafariAnalyticsService {
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
   * Get market analysis for a specific location
   * 
   * Analyzes the real estate market for a given location including price statistics,
   * market trends, supply/demand indicators, and activity metrics.
   * 
   * @param request - Market analysis request with location and filters
   * @returns Market analysis with comprehensive statistics
   * 
   * @example
   * ```typescript
   * // Português: Consultor imobiliário analisando o mercado
   * const analise = await service.getMarketAnalysis({
   *   location: {
   *     municipality: ['Lisboa'],
   *     district: ['Arroios']
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   minBedrooms: 2,
   *   maxBedrooms: 3,
   *   minPrice: 250000,
   *   maxPrice: 500000,
   *   includeTransactional: true
   * });
   * 
   * console.log(`Preço médio: €${analise.priceStatistics.mean}`);
   * console.log(`Tendência do mercado: ${analise.marketIndicators.trend}`);
   * console.log(`Dias no mercado: ${analise.marketIndicators.avgDaysOnMarket}`);
   * console.log(`Total de propriedades: ${analise.totalProperties}`);
   * ```
   */
  async getMarketAnalysis(
    request: CasafariMarketAnalysisRequest
  ): Promise<CasafariMarketAnalysisResponse> {
    const url = `${this.baseUrl}/market-analytics-api/analysis`;

    try {
      const response = await this.makeRequest<CasafariMarketAnalysisResponse>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error getting market analysis:', error);
      throw error;
    }
  }

  /**
   * Get properties distribution by location
   * 
   * Returns the distribution of properties across different geographic subdivisions
   * (districts, municipalities, parishes). Useful for understanding market concentration.
   * 
   * @param request - Distribution request with location and filters
   * @returns Properties distribution across locations
   * 
   * @example
   * ```typescript
   * // Português: Analista de mercado verificando concentração por zona
   * const distribuicao = await service.getPropertiesDistribution({
   *   location: {
   *     district: ['Lisboa']
   *   },
   *   propertyType: ['apartment', 'house'],
   *   transactionType: 'sale',
   *   includeTransactional: true
   * });
   * 
   * distribuicao.data.forEach(zona => {
   *   console.log(`${zona.location}: ${zona.count} imóveis (${zona.percentage.toFixed(1)}%)`);
   *   console.log(`  Preço médio: €${zona.avgPrice}`);
   * });
   * ```
   */
  async getPropertiesDistribution(
    request: CasafariDistributionRequest
  ): Promise<CasafariPropertiesDistribution> {
    const url = `${this.baseUrl}/market-analytics-api/distributions/properties`;

    try {
      const response = await this.makeRequest<CasafariPropertiesDistribution>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error getting properties distribution:', error);
      throw error;
    }
  }

  /**
   * Get price distribution (histogram)
   * 
   * Returns the distribution of properties across price ranges (bins).
   * Useful for understanding price segmentation and market composition.
   * 
   * @param request - Distribution request with location and filters
   * @returns Price distribution histogram with statistics
   * 
   * @example
   * ```typescript
   * // Português: Consultor avaliando segmentação de preços
   * const distribuicaoPrecos = await service.getPriceDistribution({
   *   location: {
   *     municipality: ['Porto'],
   *     parish: ['Miragaia']
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   bins: 10 // Divide em 10 faixas de preço
   * });
   * 
   * console.log(`Total de imóveis: ${distribuicaoPrecos.total}`);
   * console.log(`Preço médio: €${distribuicaoPrecos.statistics.mean}`);
   * 
   * distribuicaoPrecos.data.forEach(faixa => {
   *   const percentual = (faixa.percentage * 100).toFixed(1);
   *   console.log(`€${faixa.min} - €${faixa.max}: ${faixa.count} imóveis (${percentual}%)`);
   * });
   * ```
   */
  async getPriceDistribution(
    request: CasafariDistributionRequest
  ): Promise<CasafariPriceDistribution> {
    const url = `${this.baseUrl}/market-analytics-api/distributions/prices`;

    try {
      const response = await this.makeRequest<CasafariPriceDistribution>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error getting price distribution:', error);
      throw error;
    }
  }

  /**
   * Get bedrooms distribution
   * 
   * Returns the distribution of properties by number of bedrooms (typology).
   * Useful for understanding the market composition by property size.
   * 
   * @param request - Distribution request with location and filters
   * @returns Bedrooms distribution with average prices per typology
   * 
   * @example
   * ```typescript
   * // Português: Assessor imobiliário analisando tipologia de mercado
   * const distribuicaoQuartos = await service.getBedroomsDistribution({
   *   location: {
   *     municipality: ['Covilhã'],
   *     bbox: [-7.5, 40.2, -7.4, 40.3]
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale'
   * });
   * 
   * distribuicaoQuartos.data.forEach(tipologia => {
   *   console.log(`${tipologia.typology} (${tipologia.bedrooms} quartos):`);
   *   console.log(`  Quantidade: ${tipologia.count} (${tipologia.percentage.toFixed(1)}%)`);
   *   console.log(`  Preço médio: €${tipologia.avgPrice.toLocaleString('pt-PT')}`);
   *   console.log(`  €/m²: €${tipologia.avgPricePerSqm?.toFixed(2)}`);
   * });
   * ```
   */
  async getBedroomsDistribution(
    request: CasafariDistributionRequest
  ): Promise<CasafariBedroomsDistribution> {
    const url = `${this.baseUrl}/market-analytics-api/distributions/bedrooms`;

    try {
      const response = await this.makeRequest<CasafariBedroomsDistribution>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error getting bedrooms distribution:', error);
      throw error;
    }
  }

  /**
   * Get time on market distribution
   * 
   * Returns how quickly properties sell/rent in different timeframes.
   * Useful for assessing market liquidity and absorption rates.
   * 
   * @param request - Distribution request with location and filters
   * @returns Time on market distribution with statistics
   * 
   * @example
   * ```typescript
   * // Português: Agente vendendo avaliando velocidade do mercado
   * const tempoNoMercado = await service.getTimeOnMarketDistribution({
   *   location: {
   *     municipality: ['Braga']
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   includeTransactional: true
   * });
   * 
   * console.log(`Tempo médio no mercado: ${tempoNoMercado.statistics.mean} dias`);
   * console.log(`Mediana: ${tempoNoMercado.statistics.median} dias`);
   * console.log(`Desvio padrão: ${tempoNoMercado.statistics.stdDev} dias`);
   * 
   * tempoNoMercado.data.forEach(faixa => {
   *   console.log(`${faixa.label}: ${faixa.count} imóveis (${(faixa.percentage * 100).toFixed(1)}%)`);
   * });
   * ```
   */
  async getTimeOnMarketDistribution(
    request: CasafariDistributionRequest
  ): Promise<CasafariTimeOnMarketDistribution> {
    const url = `${this.baseUrl}/market-analytics-api/distributions/time-on-market`;

    try {
      const response = await this.makeRequest<CasafariTimeOnMarketDistribution>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error getting time on market distribution:', error);
      throw error;
    }
  }

  /**
   * Get time series data for market trends
   * 
   * Returns market metrics over time with optional forecasting.
   * Useful for trend analysis and forecasting future market movements.
   * 
   * @param request - Time series request with date range and metrics
   * @returns Time series data with trends and optional forecasts
   * 
   * @example
   * ```typescript
   * // Português: Analista de mercado observando tendências históricas
   * const tendencias = await service.getTimeSeries({
   *   location: {
   *     municipality: ['Cascais']
   *   },
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   dateFrom: '2023-01-01',
   *   dateTo: '2024-12-31',
   *   interval: 'month',
   *   metrics: ['price', 'pricePerSqm', 'count', 'sold', 'daysOnMarket'],
   *   includeForecast: true,
   *   forecastPeriods: 6
   * });
   * 
   * console.log(`Tendência: ${tendencias.summary.trend}`);
   * console.log(`Força da tendência: ${(tendencias.summary.trendStrength * 100).toFixed(1)}%`);
   * console.log(`Volatilidade: ${(tendencias.summary.volatility * 100).toFixed(2)}%`);
   * 
   * tendencias.data.slice(0, 3).forEach(periodo => {
   *   console.log(`${periodo.period}: €${periodo.avgPrice} (${periodo.count} imóveis)`);
   * });
   * 
   * if (tendencias.forecast) {
   *   console.log('\\nPrevisões:');
   *   tendencias.forecast.forEach(p => {
   *     console.log(`${p.period}: €${p.avgPrice} (€${p.lowerBound}-€${p.upperBound})`);
   *   });
   * }
   * ```
   */
  async getTimeSeries(
    request: CasafariTimeSeriesRequest
  ): Promise<CasafariTimeSeriesResponse> {
    const url = `${this.baseUrl}/market-analytics-api/time-series`;

    try {
      const response = await this.makeRequest<CasafariTimeSeriesResponse>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error getting time series:', error);
      throw error;
    }
  }

  /**
   * Compare markets across multiple locations
   * 
   * Compares market characteristics between a primary market and comparison markets.
   * Useful for identifying market opportunities and competitive positioning.
   * 
   * @param request - Market comparison request with primary and comparison markets
   * @returns Comparison analysis with relative differences
   * 
   * @example
   * ```typescript
   * // Português: Decisor estratégico comparando mercados para expansão
   * const comparacao = await service.compareMarkets({
   *   primaryMarket: {
   *     municipality: ['Lisboa'],
   *     parish: ['Arroios']
   *   },
   *   comparisonMarkets: [
   *     { municipality: ['Porto'], parish: ['Miragaia'] },
   *     { municipality: ['Covilhã'] },
   *     { municipality: ['Braga'] }
   *   ],
   *   propertyType: ['apartment'],
   *   transactionType: 'sale',
   *   dateFrom: '2024-01-01',
   *   dateTo: '2024-12-31'
   * });
   * 
   * console.log(`Mercado Principal: ${comparacao.primaryMarket.location}`);
   * console.log(`Preço médio: €${comparacao.primaryMarket.analysis.priceStatistics.mean}`);
   * console.log(`Total de imóveis: ${comparacao.primaryMarket.analysis.totalProperties}\\n`);
   * 
   * comparacao.comparisonMarkets.forEach(mercado => {
   *   console.log(`Comparação com ${mercado.location}:`);
   *   console.log(`  Diferença de preço: ${mercado.relativeDifference.pricePercentage.toFixed(1)}%`);
   *   console.log(`  Diferença €/m²: ${mercado.relativeDifference.pricePerSqmPercentage.toFixed(1)}%`);
   *   console.log(`  Diferença de oferta: ${mercado.relativeDifference.supplyPercentage.toFixed(1)}%`);
   * });
   * ```
   */
  async compareMarkets(
    request: CasafariMarketComparisonRequest
  ): Promise<CasafariMarketComparisonResponse> {
    const url = `${this.baseUrl}/market-analytics-api/compare`;

    try {
      const response = await this.makeRequest<CasafariMarketComparisonResponse>(
        url,
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('[CasafariAnalyticsService] Error comparing markets:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request to Casafari API
   * @private
   */
  private async makeRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
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
 * Factory function to create CasafariAnalyticsService instance
 * 
 * @param config - Service configuration (optional, uses env vars if not provided)
 * @returns CasafariAnalyticsService instance
 * 
 * @example
 * ```typescript
 * // Using environment variable CASAFARI_API_KEY
 * const service = createCasafariAnalyticsService();
 * 
 * // With explicit configuration
 * const service = createCasafariAnalyticsService({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.casafari.com',
 *   timeout: 30000
 * });
 * ```
 */
export function createCasafariAnalyticsService(
  config?: Partial<CasafariConfig>
): CasafariAnalyticsService {
  const apiKey = config?.apiKey || process.env.CASAFARI_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      'Casafari API key is required. Set CASAFARI_API_KEY environment variable or provide in config.'
    );
  }

  return new CasafariAnalyticsService({
    apiKey,
    baseUrl: config?.baseUrl,
    timeout: config?.timeout,
  });
}
