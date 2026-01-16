# MarketDashboardService Documentation

## Overview

The `MarketDashboardService` provides a comprehensive, high-level dashboard interface for market analytics. It combines data from `CasafariAnalyticsService` with advanced trend analysis, forecasting, and Portuguese-language market insights.

This service is designed for real estate consultants, strategic planners, and investment analysts who need aggregated market intelligence for informed decision-making.

## Location

```
src/services/analytics/MarketDashboardService.ts
```

## Features

### 1. Dashboard Overview (`getDashboardOverview`)
Get comprehensive market overview with key metrics and insights.

**Parameters:**
- `location: CasafariAnalyticsLocation` - Market location filter
- `propertyType: string[]` - Property types to analyze (e.g., 'apartment', 'house')
- `transactionType: 'sale' | 'rent'` - Transaction type

**Returns:**
```typescript
{
  metrics: DashboardOverviewMetrics
  insights: {
    market: string      // Market condition insights
    supply: string      // Supply level insights
    demand: string      // Demand/activity insights
    opportunity: string // Investment opportunity assessment
  }
  analysisDate: string // ISO date of analysis
}
```

**Example:**
```typescript
const dashboard = createMarketDashboardService(analyticsService);
const overview = await dashboard.getDashboardOverview(
  { municipality: ['Lisboa'] },
  ['apartment'],
  'sale'
);

console.log(`Preço Médio: €${overview.metrics.avgPrice}`);
console.log(`Tendência: ${overview.metrics.trend}`);
console.log(`Insights: ${overview.insights.market}`);
```

### 2. Market Trends (`getMarketTrends`)
Analyze price and market trends over a specified period.

**Parameters:**
- `location: CasafariAnalyticsLocation` - Market location
- `propertyType: string[]` - Property types
- `months: number` - Number of months to analyze (default: 12)

**Returns:**
```typescript
{
  data: TrendDataPoint[]
  trend: 'rising' | 'stable' | 'falling'
  trendStrength: number      // 0-1 scale
  volatility: number         // 0-1 scale
  avgPriceChange: number     // Percentage
  insights: {
    trend: string
    volatility: string
    recommendation: string
  }
}
```

**Example:**
```typescript
const trends = await dashboard.getMarketTrends(
  { municipality: ['Porto'] },
  ['apartment'],
  24 // Analyze last 24 months
);

console.log(`Tendência: ${trends.trend}`);
console.log(`Força: ${(trends.trendStrength * 100).toFixed(1)}%`);
console.log(`Volatilidade: ${(trends.volatility * 100).toFixed(2)}%`);
trends.data.slice(-3).forEach(mes => {
  console.log(`${mes.period}: €${mes.avgPrice}`);
});
```

### 3. Price Forecast (`getPriceForecast`)
Get price predictions with confidence intervals.

**Parameters:**
- `location: CasafariAnalyticsLocation` - Market location
- `propertyType: string[]` - Property types
- `periods: number` - Forecast periods (default: 6 months)

**Returns:**
```typescript
{
  forecast: PriceForecastPoint[]
  currentPrice: number
  summary: {
    direction: 'up' | 'down' | 'stable'
    totalChange: number        // Percentage
    averageMonthlyChange: number
  }
  insights: {
    forecast: string
    risk: string
    recommendation: string
  }
}
```

**Example:**
```typescript
const forecast = await dashboard.getPriceForecast(
  { municipality: ['Braga'] },
  ['apartment'],
  6
);

console.log(`Preço Atual: €${forecast.currentPrice}`);
console.log(`Direção: ${forecast.summary.direction}`);
forecast.forecast.forEach(p => {
  console.log(`${p.period}: €${p.avgPrice} (€${p.lowerBound}-€${p.upperBound})`);
});
```

### 4. Investment Opportunities (`getInvestmentOpportunities`)
Identify promising investment opportunities based on criteria.

**Parameters:**
- `location: CasafariAnalyticsLocation` - Market location
- `criteria: InvestmentCriteria` - Filtering criteria

**Criteria Options:**
```typescript
{
  minROI?: number                                    // Min. expected ROI (%)
  maxPricePerSqm?: number                           // Max price/m²
  minActivityLevel?: 'high' | 'medium' | 'low'     // Min activity
  preferredSupplyLevel?: 'high' | 'medium' | 'low' // Supply preference
  propertyTypes?: string[]                          // Property types
  maxDaysOnMarket?: number                          // Max market time
  minPriceGrowth?: 'strong' | 'moderate' | 'weak'  // Min growth
}
```

**Returns:**
```typescript
{
  opportunities: InvestmentOpportunity[]  // Sorted by score
  insights: {
    topOpportunity: string
    marketContext: string
    riskFactors: string
  }
}
```

**Example:**
```typescript
const opportunities = await dashboard.getInvestmentOpportunities(
  { district: ['Lisboa'] },
  {
    minROI: 8,
    maxPricePerSqm: 6000,
    minActivityLevel: 'medium',
    propertyTypes: ['apartment'],
    minPriceGrowth: 'moderate'
  }
);

opportunities.opportunities.forEach(opp => {
  console.log(`${opp.location}: Score ${opp.score}/100`);
  console.log(`ROI: ${opp.expectedROI.toFixed(2)}%`);
  console.log(`Recomendação: ${opp.recommendation}`);
});
```

### 5. Competitive Analysis (`getCompetitiveAnalysis`)
Compare locations and identify competitive positioning.

**Parameters:**
- `location: CasafariAnalyticsLocation` - Primary location
- `propertyType: string[]` - Property types

**Returns:**
```typescript
{
  primaryLocation: CompetitiveAnalysisLocation
  comparisonLocations: CompetitiveAnalysisLocation[]
  positioning: {
    mostExpensive: string
    mostAffordable: string
    bestActivity: string
    highestSupply: string
  }
  insights: {
    positioning: string
    opportunities: string
    risks: string
  }
}
```

**Example:**
```typescript
const analysis = await dashboard.getCompetitiveAnalysis(
  { municipality: ['Lisboa'] },
  ['apartment']
);

console.log(`Posição: ${analysis.insights.positioning}`);
analysis.comparisonLocations.forEach(loc => {
  console.log(`${loc.name}: Competitividade ${loc.priceCompetitiveness.toFixed(1)}%`);
  console.log(`Maturidade: ${loc.maturityScore}/100`);
});
```

### 6. Market Report (`generateMarketReport`)
Generate comprehensive market report with analysis and recommendations.

**Parameters:**
- `location: CasafariAnalyticsLocation` - Market location
- `propertyType: string[]` - Property types

**Returns:**
```typescript
{
  title: string
  executive_summary: string    // Portuguese summary
  sections: MarketReportSection[]
  recommendations: string[]    // Portuguese recommendations
  risks: string[]             // Risk factors
  generatedAt: string         // ISO date
  scope: {
    location: string
    propertyType: string
    transactionType: string
  }
}
```

**Example:**
```typescript
const report = await dashboard.generateMarketReport(
  { municipality: ['Cascais'] },
  ['apartment']
);

console.log(report.title);
console.log(report.executive_summary);
report.sections.forEach(section => {
  console.log(`## ${section.title}`);
  console.log(section.content);
});
```

## Types

### DashboardOverviewMetrics
```typescript
interface DashboardOverviewMetrics {
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
```

### InvestmentOpportunity
```typescript
interface InvestmentOpportunity {
  location: string;
  propertyType: string;
  score: number;                    // 0-100
  currentPrice: number;
  forecastPrice: number;
  expectedROI: number;              // Percentage
  indicators: {
    priceGrowth: 'strong' | 'moderate' | 'weak';
    demandLevel: 'high' | 'medium' | 'low';
    supplyLevel: 'high' | 'medium' | 'low';
    marketLiquidity: 'high' | 'medium' | 'low';
  };
  recommendation: string;           // Portuguese
}
```

### CompetitiveAnalysisLocation
```typescript
interface CompetitiveAnalysisLocation {
  name: string;
  avgPrice: number;
  trend: 'rising' | 'stable' | 'falling';
  activityLevel: 'high' | 'medium' | 'low';
  supplyLevel: 'high' | 'medium' | 'low';
  pricePerSqm: number;
  avgDaysOnMarket: number;
  priceCompetitiveness: number;     // % vs primary
  maturityScore: number;            // 0-100
}
```

## Usage Patterns

### Real Estate Consultant Decision Support
```typescript
const dashboard = createMarketDashboardService(analyticsService);

// Quick market assessment
const overview = await dashboard.getDashboardOverview(
  { municipality: ['Lisboa'] },
  ['apartment'],
  'sale'
);

// Detailed trend analysis
const trends = await dashboard.getMarketTrends(
  { municipality: ['Lisboa'] },
  ['apartment'],
  24
);

// Investment opportunity hunting
const opportunities = await dashboard.getInvestmentOpportunities(
  { district: ['Lisboa'] },
  { minROI: 5, minActivityLevel: 'high' }
);

// Competitive positioning
const competitive = await dashboard.getCompetitiveAnalysis(
  { municipality: ['Lisboa'] },
  ['apartment']
);
```

### Client Reporting
```typescript
const report = await dashboard.generateMarketReport(
  { municipality: ['Cascais'] },
  ['apartment']
);

// Generate PDF or HTML report
printReport(report);
```

## Portuguese Language Support

All insights and recommendations are provided in Portuguese (pt-PT), including:
- Market condition descriptions
- Trend analysis
- Investment recommendations
- Risk assessments
- Competitive positioning

### Example Insights
```
"Mercado em apreciação com tendência positiva. Oferta em nível médio."
"Atividade elevada indica demanda forte. Propriedades vendem-se rapidamente."
"Excelente oportunidade para compra. Mercado aquecido com preços em subida."
```

## Scoring Methodology

### Opportunity Score (0-100)
- **ROI Component (40 points)**: >10% = 40, >5% = 30, >2% = 20, else = 10
- **Activity Component (30 points)**: high = 30, medium = 20, low = 10
- **Supply Component (20 points)**: low = 20, medium = 15, high = 10
- **Liquidity Component (10 points)**: <60 days = 10, <120 days = 5

### Market Maturity Score (0-100)
- **Base**: 50 points
- **Activity Level**: high = +20, medium = +10
- **Supply Level**: medium = +20, high/low = +10
- **Price Stability**: 30-180 days = +10

## Error Handling

The service handles various error scenarios:
- Empty market data (returns empty/null results)
- API timeouts (propagates to caller)
- Invalid location filters (API validates)
- Insufficient data for forecasting (provides best estimate)

## Performance Considerations

- Caches are managed by underlying CasafariAnalyticsService
- Multiple API calls per method for comprehensive analysis
- Suitable for on-demand queries (not high-frequency operations)
- Async/await based for non-blocking operations

## Integration Example

```typescript
// In your API endpoint or component
import { createMarketDashboardService } from '@/services/analytics';
import { createCasafariAnalyticsService } from '@/services/casafari';

export async function analyzeMarket(location: string) {
  const analyticsService = createCasafariAnalyticsService();
  const dashboard = createMarketDashboardService(analyticsService);
  
  try {
    const overview = await dashboard.getDashboardOverview(
      { municipality: [location] },
      ['apartment'],
      'sale'
    );
    
    return {
      status: 'success',
      data: overview
    };
  } catch (error) {
    console.error('Market analysis failed:', error);
    return {
      status: 'error',
      message: 'Unable to analyze market'
    };
  }
}
```

## Dependencies

- `CasafariAnalyticsService`: Provides underlying market data APIs
- `types-analytics`: Type definitions from Casafari

## Testing

Run tests:
```bash
npm run test -- src/services/analytics/MarketDashboardService.test.ts
```

## Future Enhancements

Potential additions:
- Machine learning-based opportunity scoring
- Multi-language support
- Real-time market alerts
- Historical comparison analysis
- Neighborhood-level segmentation
- Seasonal trend analysis
- Predictive maintenance indicators
