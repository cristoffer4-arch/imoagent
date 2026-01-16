/**
 * MarketDashboardService - High-level market analytics dashboard
 *
 * Provides a comprehensive dashboard interface for market analytics, combining
 * data from CasafariAnalyticsService with trend analysis, forecasting, and insights.
 *
 * @module services/analytics/MarketDashboardService
 */

import type {
  CasafariAnalyticsLocation,
  CasafariMarketAnalysisRequest,
  CasafariTimeSeriesRequest,
  CasafariMarketAnalysisResponse,
} from '../casafari/types-analytics';
import { CasafariAnalyticsService } from '../casafari/CasafariAnalyticsService';

// Dashboard Overview Metrics
export interface DashboardOverviewMetrics {
  totalProperties: number;
  activeProperties: number;
  avgPrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  pricePerSqm: { avg: number; median: number };
  supplyLevel: 'high' | 'medium' | 'low';
  trend: 'rising' | 'stable' | 'falling';
  activityLevel: 'high' | 'medium' | 'low';
  avgDaysOnMarket: number;
  monthsOfInventory: number;
  absorptionRate: number;
}

export interface DashboardOverview {
  metrics: DashboardOverviewMetrics;
  insights: {
    market: string;
    supply: string;
    demand: string;
    opportunity: string;
  };
  analysisDate: string;
}

// Market Trends
export interface TrendDataPoint {
  period: string;
  avgPrice: number;
  medianPrice?: number;
  avgPricePerSqm?: number;
  count: number;
  changePercentage?: number;
  newListings?: number;
  sold?: number;
  avgDaysOnMarket?: number;
}

export interface MarketTrends {
  data: TrendDataPoint[];
  trend: 'rising' | 'stable' | 'falling';
  trendStrength: number;
  volatility: number;
  avgPriceChange: number;
  insights: {
    trend: string;
    volatility: string;
    recommendation: string;
  };
}

// Price Forecast
export interface PriceForecastPoint {
  period: string;
  avgPrice: number;
  lowerBound: number;
  upperBound: number;
  changePercentage: number;
  confidence: number;
}

export interface PriceForecast {
  forecast: PriceForecastPoint[];
  currentPrice: number;
  summary: {
    direction: 'up' | 'down' | 'stable';
    totalChange: number;
    averageMonthlyChange: number;
  };
  insights: {
    forecast: string;
    risk: string;
    recommendation: string;
  };
}

// Investment Opportunity
export interface InvestmentOpportunity {
  location: string;
  propertyType: string;
  score: number;
  currentPrice: number;
  forecastPrice: number;
  expectedROI: number;
  indicators: {
    priceGrowth: 'strong' | 'moderate' | 'weak';
    demandLevel: 'high' | 'medium' | 'low';
    supplyLevel: 'high' | 'medium' | 'low';
    marketLiquidity: 'high' | 'medium' | 'low';
  };
  recommendation: string;
}

export interface InvestmentOpportunitiesResponse {
  opportunities: InvestmentOpportunity[];
  insights: {
    topOpportunity: string;
    marketContext: string;
    riskFactors: string;
  };
}

export interface InvestmentCriteria {
  minROI?: number;
  maxPricePerSqm?: number;
  minActivityLevel?: 'high' | 'medium' | 'low';
  preferredSupplyLevel?: 'high' | 'medium' | 'low';
  propertyTypes?: string[];
  maxDaysOnMarket?: number;
  minPriceGrowth?: 'strong' | 'moderate' | 'weak';
}

// Competitive Analysis
export interface CompetitiveAnalysisLocation {
  name: string;
  avgPrice: number;
  trend: 'rising' | 'stable' | 'falling';
  activityLevel: 'high' | 'medium' | 'low';
  supplyLevel: 'high' | 'medium' | 'low';
  pricePerSqm: number;
  avgDaysOnMarket: number;
  priceCompetitiveness: number;
  maturityScore: number;
}

export interface CompetitiveAnalysis {
  primaryLocation: CompetitiveAnalysisLocation;
  comparisonLocations: CompetitiveAnalysisLocation[];
  positioning: {
    mostExpensive: string;
    mostAffordable: string;
    bestActivity: string;
    highestSupply: string;
  };
  insights: {
    positioning: string;
    opportunities: string;
    risks: string;
  };
}

// Market Report
export interface MarketReportSection {
  title: string;
  content: string;
  metrics?: Record<string, number | string>;
}

export interface MarketReport {
  title: string;
  executive_summary: string;
  sections: MarketReportSection[];
  recommendations: string[];
  risks: string[];
  generatedAt: string;
  scope: {
    location: string;
    propertyType: string;
    transactionType: string;
  };
}

/**
 * MarketDashboardService
 *
 * High-level dashboard service for real estate market analytics. Combines
 * CasafariAnalyticsService data with trend analysis, forecasting, and
 * Portuguese language market insights for strategic decision-making.
 *
 * @example
 * ```typescript
 * const dashboard = new MarketDashboardService(analyticsService);
 * const overview = await dashboard.getDashboardOverview(
 *   { municipality: ['Lisboa'] },
 *   ['apartment'],
 *   'sale'
 * );
 * console.log(`Preço Médio: €${overview.metrics.avgPrice}`);
 * ```
 */
export class MarketDashboardService {
  constructor(private analyticsService: CasafariAnalyticsService) {}

  /**
   * Get dashboard overview with key metrics and insights
   */
  async getDashboardOverview(
    location: CasafariAnalyticsLocation,
    propertyType: string[],
    transactionType: 'sale' | 'rent'
  ): Promise<DashboardOverview> {
    const request: CasafariMarketAnalysisRequest = {
      location,
      propertyType,
      transactionType,
      includeTransactional: true,
    };

    const analysis = await this.analyticsService.getMarketAnalysis(request);

    const metrics: DashboardOverviewMetrics = {
      totalProperties: analysis.totalProperties,
      activeProperties: analysis.activeProperties ?? 0,
      avgPrice: analysis.priceStatistics.mean,
      medianPrice: analysis.priceStatistics.median,
      priceRange: {
        min: analysis.priceStatistics.min,
        max: analysis.priceStatistics.max,
      },
      pricePerSqm: {
        avg: analysis.priceStatistics.pricePerSqm?.mean ?? 0,
        median: analysis.priceStatistics.pricePerSqm?.median ?? 0,
      },
      supplyLevel: analysis.marketIndicators.supplyLevel,
      trend: analysis.marketIndicators.trend,
      activityLevel: analysis.marketIndicators.activityLevel,
      avgDaysOnMarket: analysis.marketIndicators.avgDaysOnMarket ?? 0,
      monthsOfInventory: analysis.marketIndicators.monthsOfInventory ?? 0,
      absorptionRate: analysis.marketIndicators.absorptionRate ?? 0,
    };

    const insights = this.generateOverviewInsights(metrics, transactionType);
    return {
      metrics,
      insights,
      analysisDate: analysis.meta?.analysisDate ?? new Date().toISOString(),
    };
  }

  /**
   * Get market trends over specified period
   */
  async getMarketTrends(
    location: CasafariAnalyticsLocation,
    propertyType: string[],
    months: number = 12
  ): Promise<MarketTrends> {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - months);

    const request: CasafariTimeSeriesRequest = {
      location,
      propertyType,
      transactionType: 'sale',
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      interval: 'month',
      metrics: ['price', 'pricePerSqm', 'count', 'newListings', 'sold', 'daysOnMarket'],
    };

    const timeSeries = await this.analyticsService.getTimeSeries(request);

    const data: TrendDataPoint[] = timeSeries.data.map(point => ({
      period: point.period,
      avgPrice: point.avgPrice ?? 0,
      medianPrice: point.medianPrice,
      avgPricePerSqm: point.avgPricePerSqm,
      count: point.count ?? 0,
      changePercentage: point.priceChangePercentage,
      newListings: point.newListings,
      sold: point.sold,
      avgDaysOnMarket: point.avgDaysOnMarket,
    }));

    const volatility = this.calculateVolatility(data);
    const avgPriceChange = timeSeries.summary.avgPriceChange ?? 0;

    const insights = this.generateTrendInsights(
      timeSeries.summary.trend,
      volatility,
      avgPriceChange,
      data.length > 0 ? data[data.length - 1].avgPrice : 0,
      data.length > 1 ? data[0].avgPrice : 0
    );

    return {
      data,
      trend: timeSeries.summary.trend,
      trendStrength: timeSeries.summary.trendStrength ?? 0,
      volatility,
      avgPriceChange,
      insights,
    };
  }

  /**
   * Get price forecast for future periods
   */
  async getPriceForecast(
    location: CasafariAnalyticsLocation,
    propertyType: string[],
    periods: number = 6
  ): Promise<PriceForecast> {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - 24);

    const request: CasafariTimeSeriesRequest = {
      location,
      propertyType,
      transactionType: 'sale',
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      interval: 'month',
      metrics: ['price', 'pricePerSqm', 'count'],
      includeForecast: true,
      forecastPeriods: periods,
    };

    const timeSeries = await this.analyticsService.getTimeSeries(request);
    const currentPrice =
      timeSeries.data.length > 0 ? timeSeries.data[timeSeries.data.length - 1].avgPrice ?? 0 : 0;

    const forecast: PriceForecastPoint[] = (timeSeries.forecast ?? []).map(point => {
      const changePercentage = point.priceChangePercentage ?? 0;
      return {
        period: point.period,
        avgPrice: point.avgPrice ?? currentPrice,
        lowerBound: point.lowerBound ?? (point.avgPrice ?? 0) * 0.95,
        upperBound: point.upperBound ?? (point.avgPrice ?? 0) * 1.05,
        changePercentage,
        confidence: 0.85,
      };
    });

    const totalChange = forecast.length > 0 ? forecast[forecast.length - 1].changePercentage : 0;
    const averageMonthlyChange = totalChange / (forecast.length || 1);
    const direction = totalChange > 1 ? 'up' : totalChange < -1 ? 'down' : 'stable';

    // Extract final forecast price for clarity and maintainability
    const finalForecastPrice = forecast.length > 0 ? forecast[forecast.length - 1].avgPrice : currentPrice;
    const insights = this.generateForecastInsights(direction, totalChange, currentPrice, finalForecastPrice);

    return { forecast, currentPrice, summary: { direction, totalChange, averageMonthlyChange }, insights };
  }

  /**
   * Find investment opportunities based on criteria
   */
  async getInvestmentOpportunities(
    location: CasafariAnalyticsLocation,
    criteria: InvestmentCriteria
  ): Promise<InvestmentOpportunitiesResponse> {
    const analysis = await this.analyticsService.getMarketAnalysis({
      location,
      propertyType: criteria.propertyTypes ?? ['apartment', 'house'],
      transactionType: 'sale',
      includeTransactional: true,
    });

    const bedroomsDist = await this.analyticsService.getBedroomsDistribution({
      location,
      propertyType: criteria.propertyTypes ?? ['apartment', 'house'],
      transactionType: 'sale',
    });

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - 12);

    const forecast = await this.analyticsService.getTimeSeries({
      location,
      propertyType: criteria.propertyTypes ?? ['apartment', 'house'],
      transactionType: 'sale',
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      interval: 'month',
      includeForecast: true,
      forecastPeriods: 12,
    });

    const opportunities: InvestmentOpportunity[] = bedroomsDist.data
      .map(bedroom => {
        const currentPrice = bedroom.avgPrice;
        const forecastPrice = forecast.forecast && forecast.forecast.length > 0
          ? forecast.forecast[Math.floor(forecast.forecast.length / 2)].avgPrice ?? currentPrice
          : currentPrice;

        const expectedROI = ((forecastPrice - currentPrice) / currentPrice) * 100;

        if (criteria.minROI && expectedROI < criteria.minROI) return null;
        if (criteria.maxPricePerSqm && (bedroom.avgPricePerSqm ?? 0) > criteria.maxPricePerSqm) return null;

        const score = this.calculateOpportunityScore(
          expectedROI,
          analysis.marketIndicators.activityLevel,
          analysis.marketIndicators.supplyLevel,
          analysis.marketIndicators.avgDaysOnMarket ?? 0,
          criteria
        );

        return {
          location: bedroom.typology,
          propertyType: bedroom.typology,
          score,
          currentPrice,
          forecastPrice,
          expectedROI,
          indicators: {
            priceGrowth: expectedROI > 5 ? 'strong' : expectedROI > 2 ? 'moderate' : 'weak',
            demandLevel: analysis.marketIndicators.activityLevel,
            supplyLevel: analysis.marketIndicators.supplyLevel,
            marketLiquidity: (analysis.marketIndicators.avgDaysOnMarket ?? 0) < 60 ? 'high' : (analysis.marketIndicators.avgDaysOnMarket ?? 0) < 120 ? 'medium' : 'low',
          },
          recommendation: this.generateOpportunityRecommendation(score, expectedROI, analysis.marketIndicators),
        };
      })
      .filter((opp): opp is InvestmentOpportunity => opp !== null)
      .sort((a, b) => b.score - a.score);

    const topOpportunity = opportunities.length > 0
      ? `${opportunities[0].location}: Score ${opportunities[0].score}/100, ROI ${opportunities[0].expectedROI.toFixed(1)}%`
      : 'Nenhuma oportunidade com critérios especificados';

    return {
      opportunities,
      insights: {
        topOpportunity,
        marketContext: `Mercado com ${analysis.marketIndicators.supplyLevel} oferta. Tendência: ${analysis.marketIndicators.trend}.`,
        riskFactors: `Dias médios: ${analysis.marketIndicators.avgDaysOnMarket ?? 0}. Meses inventário: ${analysis.marketIndicators.monthsOfInventory ?? 0}.`,
      },
    };
  }

  /**
   * Competitive analysis between locations
   */
  async getCompetitiveAnalysis(
    location: CasafariAnalyticsLocation,
    propertyType: string[]
  ): Promise<CompetitiveAnalysis> {
    const primaryAnalysis = await this.analyticsService.getMarketAnalysis({
      location,
      propertyType,
      transactionType: 'sale',
      includeTransactional: true,
    });

    const comparisonMarkets = [
      { municipality: ['Porto'] },
      { municipality: ['Braga'] },
      { municipality: ['Covilhã'] },
    ];

    const comparisonAnalyses = await Promise.all(
      comparisonMarkets.map(market =>
        this.analyticsService.getMarketAnalysis({
          location: market,
          propertyType,
          transactionType: 'sale',
          includeTransactional: true,
        })
      )
    );

    const primaryLocation: CompetitiveAnalysisLocation = {
      name: 'Localização Principal',
      avgPrice: primaryAnalysis.priceStatistics.mean,
      trend: primaryAnalysis.marketIndicators.trend,
      activityLevel: primaryAnalysis.marketIndicators.activityLevel,
      supplyLevel: primaryAnalysis.marketIndicators.supplyLevel,
      pricePerSqm: primaryAnalysis.priceStatistics.pricePerSqm?.mean ?? 0,
      avgDaysOnMarket: primaryAnalysis.marketIndicators.avgDaysOnMarket ?? 0,
      priceCompetitiveness: 0,
      maturityScore: this.calculateMarketMaturityScore(primaryAnalysis),
    };

    const comparisonLocations = comparisonAnalyses.map((analysis, index) => ({
      name: comparisonMarkets[index].municipality?.[0] ?? `Mercado ${index + 1}`,
      avgPrice: analysis.priceStatistics.mean,
      trend: analysis.marketIndicators.trend,
      activityLevel: analysis.marketIndicators.activityLevel,
      supplyLevel: analysis.marketIndicators.supplyLevel,
      pricePerSqm: analysis.priceStatistics.pricePerSqm?.mean ?? 0,
      avgDaysOnMarket: analysis.marketIndicators.avgDaysOnMarket ?? 0,
      priceCompetitiveness: ((analysis.priceStatistics.mean - primaryAnalysis.priceStatistics.mean) / primaryAnalysis.priceStatistics.mean) * 100,
      maturityScore: this.calculateMarketMaturityScore(analysis),
    }));

    const allLocations = [primaryLocation, ...comparisonLocations];
    const sortedByPrice = [...allLocations].sort((a, b) => a.avgPrice - b.avgPrice);
    
    // Activity level priority mapping for consistent comparison
    const activityPriority: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const supplyPriority: Record<string, number> = { high: 3, medium: 2, low: 1 };
    
    const positioning = {
      mostExpensive: sortedByPrice[sortedByPrice.length - 1].name,
      mostAffordable: sortedByPrice[0].name,
      bestActivity: allLocations.reduce((a, b) =>
        activityPriority[b.activityLevel] > activityPriority[a.activityLevel] ? b : a
      ).name,
      highestSupply: allLocations.reduce((a, b) =>
        supplyPriority[b.supplyLevel] > supplyPriority[a.supplyLevel] ? b : a
      ).name,
    };

    const insights = this.generateCompetitiveInsights(primaryLocation, comparisonLocations, positioning);
    return { primaryLocation, comparisonLocations, positioning, insights };
  }

  /**
   * Generate comprehensive market report
   */
  async generateMarketReport(
    location: CasafariAnalyticsLocation,
    propertyType: string[]
  ): Promise<MarketReport> {
    const overview = await this.getDashboardOverview(location, propertyType, 'sale');
    const trends = await this.getMarketTrends(location, propertyType, 24);
    const forecast = await this.getPriceForecast(location, propertyType, 12);

    const sections: MarketReportSection[] = [
      {
        title: 'Panorama de Mercado',
        content: `Mercado com ${overview.metrics.totalProperties} propriedades. Preço: €${overview.metrics.avgPrice.toLocaleString('pt-PT')}. Oferta: ${overview.metrics.supplyLevel}. Atividade: ${overview.metrics.activityLevel}.`,
        metrics: {
          'Total': overview.metrics.totalProperties,
          'Preço': `€${overview.metrics.avgPrice}`,
          'Tendência': overview.metrics.trend,
        },
      },
      {
        title: 'Análise de Tendências',
        content: `Tendência: ${trends.trend}. Força: ${(trends.trendStrength * 100).toFixed(1)}%. Volatilidade: ${(trends.volatility * 100).toFixed(2)}%.`,
        metrics: { 'Mudança': `${trends.avgPriceChange.toFixed(2)}%` },
      },
    ];

    return {
      title: `Relatório Mercado ${new Date().getFullYear()}`,
      executive_summary: `Análise de ${propertyType.join(', ')}. Tendência: ${overview.metrics.trend}. Previsão: ${forecast.summary.direction}.`,
      sections,
      recommendations: [overview.insights.opportunity, trends.insights.recommendation],
      risks: [`Oferta: ${overview.metrics.supplyLevel}`, `Volatilidade: ${(trends.volatility * 100).toFixed(2)}%`],
      generatedAt: new Date().toISOString(),
      scope: {
        location: location.municipality?.join(', ') ?? 'Múltiplas',
        propertyType: propertyType.join(', '),
        transactionType: 'Venda',
      },
    };
  }

  // Private helper methods
  private calculateVolatility(data: TrendDataPoint[]): number {
    if (data.length < 2) return 0;
    const prices = data.map(d => d.avgPrice);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    return Math.min(stdDev / mean, 1);
  }

  private generateOverviewInsights(metrics: DashboardOverviewMetrics, transactionType: 'sale' | 'rent'): DashboardOverview['insights'] {
    return {
      market: `Mercado ${metrics.trend} com oferta ${metrics.supplyLevel}.`,
      supply: `Oferta: ${metrics.supplyLevel}`,
      demand: `Atividade: ${metrics.activityLevel}`,
      opportunity: `Oportunidade de ${transactionType === 'sale' ? 'compra' : 'aluguel'}.`,
    };
  }

  private generateTrendInsights(trend: string, volatility: number, avgPriceChange: number, currentPrice: number, prevPrice: number): MarketTrends['insights'] {
    return {
      trend: `Tendência ${trend}: ${avgPriceChange.toFixed(2)}%`,
      volatility: `Volatilidade: ${(volatility * 100).toFixed(2)}%`,
      recommendation: 'Recomendação estratégica para mercado.',
    };
  }

  private generateForecastInsights(direction: string, totalChange: number, currentPrice: number, forecastPrice: number): PriceForecast['insights'] {
    return {
      forecast: `Previsão ${direction}: ${totalChange.toFixed(2)}%`,
      risk: 'Risco moderado em mercado.',
      recommendation: 'Considere oportunidade de investimento.',
    };
  }

  private calculateOpportunityScore(expectedROI: number, activityLevel: string, supplyLevel: string, avgDaysOnMarket: number, criteria: InvestmentCriteria): number {
    let score = 0;
    if (expectedROI > 10) score += 40;
    else if (expectedROI > 5) score += 30;
    else if (expectedROI > 2) score += 20;
    else score += 10;
    if (activityLevel === 'high') score += 30;
    else if (activityLevel === 'medium') score += 20;
    else score += 10;
    if (supplyLevel === 'low') score += 20;
    else if (supplyLevel === 'medium') score += 15;
    else score += 10;
    if (avgDaysOnMarket < 60) score += 10;
    else if (avgDaysOnMarket < 120) score += 5;
    return Math.min(score, 100);
  }

  private generateOpportunityRecommendation(score: number, expectedROI: number, marketIndicators: any): string {
    if (score >= 80) return `Excelente: ROI ${expectedROI.toFixed(1)}%`;
    if (score >= 60) return `Boa: ROI ${expectedROI.toFixed(1)}%`;
    if (score >= 40) return `Moderada: ROI ${expectedROI.toFixed(1)}%`;
    return `Limitada: ROI ${expectedROI.toFixed(1)}%`;
  }

  private calculateMarketMaturityScore(analysis: CasafariMarketAnalysisResponse): number {
    let score = 50;
    if (analysis.marketIndicators.activityLevel === 'high') score += 20;
    else if (analysis.marketIndicators.activityLevel === 'medium') score += 10;
    if (analysis.marketIndicators.supplyLevel === 'medium') score += 20;
    else if (analysis.marketIndicators.supplyLevel === 'high' || analysis.marketIndicators.supplyLevel === 'low') score += 10;
    return Math.min(score, 100);
  }

  private generateCompetitiveInsights(primaryLocation: CompetitiveAnalysisLocation, comparisonLocations: CompetitiveAnalysisLocation[], positioning: any): CompetitiveAnalysis['insights'] {
    return {
      positioning: `Posição: ${primaryLocation.priceCompetitiveness > 0 ? 'acima' : 'abaixo'} da média.`,
      opportunities: 'Considere diversificação entre localizações.',
      risks: 'Monitorar tendências regionais e variações de mercado.',
    };
  }
}

export function createMarketDashboardService(analyticsService: CasafariAnalyticsService): MarketDashboardService {
  return new MarketDashboardService(analyticsService);
}
