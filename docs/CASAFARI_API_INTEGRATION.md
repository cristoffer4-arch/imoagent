# Casafari API Integration - Phases 2, 3, and 4

This document describes the complete integration with Casafari's advanced APIs for property valuation, alerts, and market analytics.

## 📚 Table of Contents

- [Overview](#overview)
- [Phase 2: Valuation & Comparables](#phase-2-valuation--comparables)
- [Phase 3: Alerts & Real-time](#phase-3-alerts--real-time)
- [Phase 4: Market Analytics](#phase-4-market-analytics)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)

## Overview

Three new service layers have been added to integrate with Casafari's advanced APIs:

1. **CasafariValuationService** - Property valuation and comparable properties
2. **CasafariAlertsService** - Real-time property alerts and feeds
3. **CasafariAnalyticsService** - Market analytics and trends

Additionally, two high-level services provide business logic:

- **AlertNotificationService** - Multi-channel notifications (email, push, webhook, SMS)
- **MarketDashboardService** - Market dashboard with insights and forecasting

## Phase 2: Valuation & Comparables

### Features

- Search for comparable properties (v1 and v2)
- Get estimated property prices
- Complete property valuation with market insights
- Compare property prices with market data

### Quick Start

```typescript
import { createCasafariValuationService } from '@/services/casafari';

const service = createCasafariValuationService({
  apiKey: process.env.CASAFARI_API_KEY
});

// Get property valuation
const valuation = await service.getPropertyValuation({
  location: {
    latitude: 38.7223,
    longitude: -9.1393,
    municipality: 'Lisboa'
  },
  propertyType: 'apartment',
  transactionType: 'sale',
  characteristics: {
    netArea: 85,
    bedrooms: 2,
    bathrooms: 1
  }
});

console.log(`Estimated price: €${valuation.valuation.estimatedPrice}`);
console.log(`Confidence: ${valuation.valuation.confidence}%`);
console.log(`Market trend: ${valuation.marketInsights?.trend}`);
```

### Methods

- `searchComparables(filters)` - Search comparable properties
- `searchComparablesV2(filters)` - Search with transactional data
- `getEstimatedPrices(request)` - Get price estimation
- `getPropertyValuation(request)` - Complete valuation
- `comparePropertyPrice(request, askingPrice)` - Compare with market

## Phase 3: Alerts & Real-time

### Features

- Create and manage alert feeds
- Real-time property alerts
- Multi-channel notifications
- Webhook support
- Alert filtering and search

### Quick Start

```typescript
import { createCasafariAlertsService } from '@/services/casafari';

const service = createCasafariAlertsService({
  apiKey: process.env.CASAFARI_API_KEY
});

// Create alert feed
const feed = await service.createFeed({
  name: 'Apartamentos T2 em Lisboa',
  filters: {
    municipality: ['Lisboa'],
    propertyType: ['apartment'],
    transactionType: 'sale',
    minBedrooms: 2,
    maxBedrooms: 2,
    maxPrice: 300000
  },
  frequency: 'realtime',
  email: 'consultant@example.com'
});

// Get unread alerts
const alerts = await service.getAlertsByFeed(feed.id, 1, 50, 'unread');
console.log(`${alerts.summary?.unreadCount} new properties`);
```

### Notification Service

```typescript
import { AlertNotificationService, NotificationChannel } from '@/services/alerts/AlertNotificationService';

const notificationService = new AlertNotificationService();

await notificationService.processAlert(alert, feed, {
  userId: 'user-123',
  channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
  email: 'consultant@example.com',
  frequency: 'realtime'
});
```

### Methods

- `listFeeds()` - List all alert feeds
- `createFeed(request)` - Create new feed
- `getAlertsByFeed(feedId)` - Get alerts from feed
- `deleteFeed(feedId)` - Delete feed
- `searchAlerts(request)` - Search all alerts
- `updateFeed(feedId, request)` - Update feed
- `pauseFeed(feedId)` / `resumeFeed(feedId)` - Control feed

## Phase 4: Market Analytics

### Features

- Market analysis with statistics
- Price distributions and trends
- Time series analysis with forecasting
- Bedrooms and location distributions
- Market comparisons

### Quick Start

```typescript
import { createCasafariAnalyticsService } from '@/services/casafari';

const service = createCasafariAnalyticsService({
  apiKey: process.env.CASAFARI_API_KEY
});

// Get market analysis
const analysis = await service.getMarketAnalysis({
  location: {
    municipality: ['Lisboa']
  },
  propertyType: ['apartment'],
  transactionType: 'sale',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});

console.log(`Total properties: ${analysis.totalProperties}`);
console.log(`Average price: €${analysis.priceStatistics.mean}`);
console.log(`Market trend: ${analysis.marketIndicators.trend}`);
```

### Market Dashboard

```typescript
import { createMarketDashboardService } from '@/services/analytics';

const dashboard = createMarketDashboardService(analyticsService);

// Get comprehensive overview
const overview = await dashboard.getDashboardOverview(
  { municipality: ['Lisboa'] },
  ['apartment'],
  'sale'
);

// Get price forecast
const forecast = await dashboard.getPriceForecast(
  { municipality: ['Lisboa'] },
  ['apartment'],
  6 // 6 months ahead
);

// Find investment opportunities
const opportunities = await dashboard.getInvestmentOpportunities(
  { district: ['Lisboa'] },
  { minROI: 8, maxPricePerSqm: 6000 }
);
```

### Methods

- `getMarketAnalysis(request)` - Market analysis
- `getPropertiesDistribution(request)` - Distribution by location
- `getPriceDistribution(request)` - Price histogram
- `getBedroomsDistribution(request)` - Distribution by typology
- `getTimeOnMarketDistribution(request)` - Time on market
- `getTimeSeries(request)` - Time series with forecasting
- `compareMarkets(request)` - Multi-market comparison

## Installation

All services are already included in the project. Just ensure you have the Casafari API key:

```bash
# Add to .env.local
CASAFARI_API_KEY=your_api_key_here
```

## Configuration

All services accept the same configuration:

```typescript
interface CasafariConfig {
  apiKey: string;
  baseUrl?: string; // Default: 'https://api.casafari.com'
  timeout?: number;  // Default: 30000 (30 seconds)
}
```

## Usage Examples

### Complete Property Analysis Workflow

```typescript
import {
  createCasafariValuationService,
  createCasafariAlertsService,
  createCasafariAnalyticsService
} from '@/services/casafari';
import { createMarketDashboardService } from '@/services/analytics';

// Initialize services
const valuation = createCasafariValuationService();
const alerts = createCasafariAlertsService();
const analytics = createCasafariAnalyticsService();
const dashboard = createMarketDashboardService(analytics);

// 1. Analyze market
const marketOverview = await dashboard.getDashboardOverview(
  { municipality: ['Lisboa'] },
  ['apartment'],
  'sale'
);

console.log('Market Overview:', marketOverview.summary);

// 2. Get property valuation
const propertyValuation = await valuation.getPropertyValuation({
  location: { municipality: 'Lisboa', latitude: 38.7223, longitude: -9.1393 },
  propertyType: 'apartment',
  transactionType: 'sale',
  characteristics: { netArea: 85, bedrooms: 2, bathrooms: 1 }
});

console.log('Valuation:', propertyValuation.valuation);

// 3. Create alert for similar properties
const feed = await alerts.createFeed({
  name: 'Similar to evaluated property',
  filters: {
    municipality: ['Lisboa'],
    propertyType: ['apartment'],
    transactionType: 'sale',
    minBedrooms: 2,
    maxBedrooms: 2,
    minArea: 75,
    maxArea: 95,
    maxPrice: propertyValuation.valuation.priceRangeHigh
  },
  frequency: 'daily',
  email: 'consultant@example.com'
});

console.log('Alert feed created:', feed.id);
```

## API Reference

### Type Exports

All types are exported from `@/services/casafari`:

```typescript
// Valuation types
import type {
  CasafariComparablesFilters,
  CasafariComparablesResponse,
  CasafariValuationRequest,
  CasafariValuationResponse,
  CasafariEstimatedPrices
} from '@/services/casafari';

// Alerts types
import type {
  CasafariAlertFeed,
  CasafariAlert,
  CasafariAlertFilters,
  CasafariCreateAlertFeedRequest
} from '@/services/casafari';

// Analytics types
import type {
  CasafariMarketAnalysisRequest,
  CasafariMarketAnalysisResponse,
  CasafariTimeSeriesRequest,
  CasafariTimeSeriesResponse
} from '@/services/casafari';
```

### Error Handling

All services throw `CasafariApiError` on failures:

```typescript
import { CasafariApiError } from '@/services/casafari';

try {
  const valuation = await service.getPropertyValuation(request);
} catch (error) {
  if (error instanceof CasafariApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Code:', error.code);
  }
}
```

## Testing

All services have comprehensive unit tests:

- `__tests__/CasafariValuation.test.ts` - 34 tests
- `__tests__/CasafariAlerts.test.ts` - 52 tests
- `__tests__/CasafariAnalytics.test.ts` - 44 tests

Run tests:

```bash
npm test
```

## Documentation

Additional documentation:

- `docs/MARKET_DASHBOARD_SERVICE.md` - Market Dashboard detailed guide
- Casafari API Docs: https://docs.api.casafari.com

## License

Same as main project license.
