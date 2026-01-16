/**
 * Usage Example - IA-Busca Services
 * 
 * This file demonstrates how to use the DeduplicationService,
 * PortalAggregator, and SearchService together.
 */

import { SearchMode, SearchSortBy } from '../../types/search';
import type { SearchQuery, SearchOptions } from '../../types/search';
import { CasafariService } from '../casafari/CasafariService';
import { CRMService } from '../crm/CRMService';
import { GeocodingService } from '../GeocodingService';
import {
  DeduplicationService,
  PortalAggregator,
  SearchService,
  ScoringService,
} from './';

/**
 * Example 1: Basic Property Search
 */
async function basicSearch() {
  // 1. Configure services
  const casafariService = new CasafariService({
    apiKey: process.env.CASAFARI_API_KEY || '',
  });

  const crmService = new CRMService({
    orchestratorUrl: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/ia-orquestradora',
    tenantId: 'tenant_123',
  });

  const portalAggregator = new PortalAggregator({
    casafariService,
    crmService,
  });

  const searchService = new SearchService({
    portalAggregator,
  });

  // 2. Build search query
  const query: SearchQuery = {
    mode: SearchMode.ANGARIACAO,
    filters: {
      propertyType: ['APARTMENT'],
      distrito: 'Lisboa',
      concelho: 'Lisboa',
      minPrice: 200000,
      maxPrice: 500000,
      bedrooms: 2,
    },
    sortBy: SearchSortBy.SCORE,
    page: 1,
    perPage: 20,
    tenantId: 'tenant_123',
  };

  // 3. Execute search
  const results = await searchService.search(query);

  // 4. Use results
  console.log(`Found ${results.total} properties`);
  console.log(`Average price: €${results.stats.avgPrice}`);
  console.log(`Top property score: ${results.items[0]?.score}`);

  return results;
}

/**
 * Example 2: Advanced Search with All Options
 */
async function advancedSearch() {
  const casafariService = new CasafariService({
    apiKey: process.env.CASAFARI_API_KEY || '',
  });

  const crmService = new CRMService({
    orchestratorUrl: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/ia-orquestradora',
    tenantId: 'tenant_123',
  });

  const deduplicationService = new DeduplicationService({
    threshold: 0.90, // Higher threshold = stricter duplicate matching
    priceTolerancePercent: 5, // Only 5% price difference allowed
    enableImageHashing: true,
  });

  const portalAggregator = new PortalAggregator({
    casafariService,
    crmService,
    deduplicationService,
  });

  const scoringService = new ScoringService(true, 600); // Cache enabled, 10min TTL

  const searchService = new SearchService({
    portalAggregator,
    scoringService,
    geocodingService: GeocodingService,
  });

  const query: SearchQuery = {
    mode: SearchMode.VENDA,
    filters: {
      propertyType: ['APARTMENT', 'HOUSE'],
      distrito: 'Porto',
      minPrice: 150000,
      maxPrice: 400000,
      minArea: 80,
      bedrooms: 3,
      features: ['elevator', 'balcony'],
      condition: ['GOOD', 'RENOVATED'],
      minVendaScore: 70, // Only show high-scoring properties
    },
    sortBy: SearchSortBy.SCORE,
    page: 1,
    perPage: 50,
    tenantId: 'tenant_123',
    teamId: 'team_456',
    userId: 'user_789',
  };

  const options: SearchOptions = {
    enableCasafari: true,
    enablePortals: true,
    enableCRM: true,
    enableDeduplication: true,
    deduplicationThreshold: 0.90,
    enrichWithGeoData: true, // Add coordinates to properties
    calculateScores: true,
    timeout: 45000, // 45 seconds
    maxResults: 200, // Per source
  };

  const results = await searchService.search(query, options);

  // Detailed results analysis
  console.log('=== Search Results ===');
  console.log(`Total properties: ${results.total}`);
  console.log(`Total pages: ${results.totalPages}`);
  console.log(`Average score: ${results.stats.avgScore}`);
  console.log(`Price range: €${results.stats.minPrice} - €${results.stats.maxPrice}`);
  console.log('\n=== Top 5 Properties ===');
  results.items.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.property.title}`);
    console.log(`   Score: ${item.score}, Price: €${item.property.price.value}`);
    console.log(`   Portals: ${item.portalsFound.join(', ')}`);
    console.log(`   Reasons: ${item.matchReasons.join(', ')}`);
  });

  console.log('\n=== Facets ===');
  console.log('Property Types:', results.facets?.propertyTypes);
  console.log('Top Distritos:', results.facets?.distritos.slice(0, 5));
  console.log('Portal Coverage:', results.facets?.portals);

  return results;
}

/**
 * Example 3: Standalone Deduplication
 */
async function deduplicateProperties() {
  const deduplicationService = new DeduplicationService({
    threshold: 0.85,
    priceTolerancePercent: 10,
    areaTolerancePercent: 10,
  });

  // Assume we have properties from multiple sources
  const properties = [
    // ... PropertyCanonicalModel instances
  ];

  // Find duplicate groups
  const duplicateGroups = deduplicationService.findDuplicates(properties);

  console.log(`Found ${duplicateGroups.length} duplicate groups`);

  duplicateGroups.forEach((group, index) => {
    console.log(`\nGroup ${index + 1}:`);
    console.log(`  Primary: ${group.primary.title}`);
    console.log(`  Duplicates: ${group.duplicates.length}`);
    console.log(`  Confidence: ${(group.confidence * 100).toFixed(1)}%`);
    console.log(`  Portals: ${group.portals.join(', ')}`);
    console.log(`  Match reasons: ${group.matchReasons.join(', ')}`);
  });

  // Get unique properties
  const uniqueProperties = duplicateGroups.map(g => g.primary);
  console.log(`\nUnique properties after deduplication: ${uniqueProperties.length}`);

  return uniqueProperties;
}

/**
 * Example 4: Direct Portal Aggregation
 */
async function aggregateFromPortals() {
  const casafariService = new CasafariService({
    apiKey: process.env.CASAFARI_API_KEY || '',
  });

  const crmService = new CRMService({
    orchestratorUrl: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/ia-orquestradora',
    tenantId: 'tenant_123',
  });

  const portalAggregator = new PortalAggregator({
    casafariService,
    crmService,
  });

  const query: SearchQuery = {
    mode: SearchMode.ANGARIACAO,
    filters: {
      distrito: 'Faro',
      minPrice: 100000,
      maxPrice: 300000,
    },
    sortBy: SearchSortBy.RECENT,
    page: 1,
    perPage: 100,
    tenantId: 'tenant_123',
  };

  const options: SearchOptions = {
    enableCasafari: true,
    enablePortals: true,
    enableCRM: false, // Disable CRM for this search
    enableDeduplication: true,
    timeout: 30000,
  };

  const aggregationResult = await portalAggregator.aggregate(query, options);

  console.log('=== Aggregation Results ===');
  console.log(`Total properties: ${aggregationResult.totalProperties}`);
  console.log(`Unique properties: ${aggregationResult.totalUnique}`);
  console.log(`Duplicates removed: ${aggregationResult.totalDuplicates}`);
  console.log(`Execution time: ${aggregationResult.executionTimeMs}ms`);
  console.log(`Sources queried: ${aggregationResult.sourcesQueried.join(', ')}`);
  console.log(`Sources succeeded: ${aggregationResult.sourcesSucceeded.join(', ')}`);
  
  if (aggregationResult.sourcesFailed.length > 0) {
    console.log(`Sources failed: ${aggregationResult.sourcesFailed.join(', ')}`);
  }

  // Source-specific results
  if (aggregationResult.casafari) {
    console.log(`\nCasafari: ${aggregationResult.casafari.count} properties`);
  }

  if (aggregationResult.portals?.idealista) {
    console.log(`Idealista: ${aggregationResult.portals.idealista.count} properties`);
  }

  if (aggregationResult.portals?.olx) {
    console.log(`OLX: ${aggregationResult.portals.olx.count} properties`);
  }

  return aggregationResult;
}

/**
 * Example 5: Using Factory Functions (Recommended)
 */
async function factoryPatternExample() {
  const { createSearchService, createPortalAggregator } = await import('./');

  const portalAggregator = createPortalAggregator({
    orchestratorUrl: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/ia-orquestradora',
  });

  const searchService = createSearchService({
    portalAggregator,
  });

  const query: SearchQuery = {
    mode: SearchMode.ANGARIACAO,
    filters: {
      propertyType: ['APARTMENT'],
      distrito: 'Setúbal',
      minPrice: 150000,
      maxPrice: 350000,
    },
    sortBy: SearchSortBy.SCORE,
    page: 1,
    perPage: 20,
    tenantId: 'tenant_123',
  };

  const results = await searchService.search(query);

  return results;
}

// Export examples
export {
  basicSearch,
  advancedSearch,
  deduplicateProperties,
  aggregateFromPortals,
  factoryPatternExample,
};
