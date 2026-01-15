/**
 * SearchService - Main search orchestration service
 * 
 * Orchestrates the complete search flow:
 * 1. Uses PortalAggregator to get properties from all sources
 * 2. Uses ScoringService to calculate scores based on mode (ANGARIACAO/VENDA)
 * 3. Applies filters, sorting, pagination
 * 4. Returns SearchResults with stats and facets
 * 
 * This is the main entry point for property search functionality.
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import { ScoringService } from './ScoringService';
import { PortalAggregator } from './PortalAggregator';
import { GeocodingService } from '../GeocodingService';
import {
  SearchQuery,
  SearchOptions,
  SearchResults,
  SearchResultItem,
  SearchStats,
  SearchFacets,
  SearchMode,
  SearchSortBy,
  MultiSourceSearchResult,
} from '../../types/search';
import type { PropertyScore, ScoringContext } from '../../types/scoring';

/**
 * SearchService configuration
 */
export interface SearchServiceConfig {
  portalAggregator: PortalAggregator;
  scoringService?: ScoringService;
  geocodingService?: GeocodingService;
}

/**
 * Default search options
 */
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  enableCasafari: true,
  enablePortals: true,
  enableCRM: true,
  enableDeduplication: true,
  deduplicationThreshold: 0.85,
  enrichWithGeoData: false,
  calculateScores: true,
  timeout: 30000,
  maxResults: 100,
};

/**
 * SearchService - Main search orchestration
 */
export class SearchService {
  private portalAggregator: PortalAggregator;
  private scoringService: ScoringService;
  private geocodingService?: GeocodingService;

  constructor(config: SearchServiceConfig) {
    this.portalAggregator = config.portalAggregator;
    this.scoringService = config.scoringService || new ScoringService();
    this.geocodingService = config.geocodingService;

    console.log('[SearchService] Initialized');
  }

  /**
   * Main search method
   * 
   * @param query - Search query with filters and context
   * @param options - Search options
   * @returns SearchResults with scored and filtered properties
   */
  async search(
    query: SearchQuery,
    options?: SearchOptions
  ): Promise<SearchResults> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };

    console.log(`[SearchService] Starting search for mode: ${query.mode}`);
    console.log(`[SearchService] Filters:`, JSON.stringify(query.filters, null, 2));

    try {
      // Step 1: Aggregate properties from all sources
      const aggregationResult = await this.portalAggregator.aggregate(query, opts);
      const allProperties = this.extractAllProperties(aggregationResult);

      console.log(`[SearchService] Aggregated ${allProperties.length} properties`);

      if (allProperties.length === 0) {
        return this.emptyResults(query);
      }

      // Step 2: Enrich with geo data if enabled
      let enrichedProperties = allProperties;
      if (opts.enrichWithGeoData && this.geocodingService) {
        enrichedProperties = await this.enrichWithGeoData(allProperties);
      }

      // Step 3: Apply filters
      const filteredProperties = this.applyFilters(enrichedProperties, query);
      console.log(`[SearchService] ${filteredProperties.length} properties after filters`);

      // Step 4: Calculate scores if enabled
      let scoredItems: SearchResultItem[];
      if (opts.calculateScores) {
        scoredItems = await this.calculateScores(filteredProperties, query);
      } else {
        scoredItems = filteredProperties.map(prop => this.createDefaultResultItem(prop));
      }

      // Step 5: Sort results
      const sortedItems = this.sortResults(scoredItems, query.sortBy, query.mode);

      // Step 6: Calculate statistics
      const stats = this.getStats(filteredProperties);

      // Step 7: Calculate facets
      const facets = this.calculateFacets(filteredProperties);

      // Step 8: Apply pagination
      const paginatedItems = this.paginate(sortedItems, query.page, query.perPage);
      const totalPages = Math.ceil(sortedItems.length / query.perPage);

      const results: SearchResults = {
        items: paginatedItems,
        total: sortedItems.length,
        page: query.page,
        perPage: query.perPage,
        totalPages,
        stats,
        facets,
      };

      const executionTime = Date.now() - startTime;
      console.log(`[SearchService] Search completed in ${executionTime}ms`);
      console.log(`[SearchService] Returning ${paginatedItems.length} items (page ${query.page}/${totalPages})`);

      return results;
    } catch (error: any) {
      console.error('[SearchService] Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get statistics for a list of properties
   * 
   * @param properties - List of properties
   * @returns SearchStats with aggregated data
   */
  getStats(properties: PropertyCanonicalModel[]): SearchStats {
    if (properties.length === 0) {
      return {
        totalFound: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgArea: 0,
        avgScore: 0,
        portalCounts: {},
        typeCounts: {},
        distritoCounts: {},
      };
    }

    // Calculate price stats
    const prices = properties.map(p => p.price.value).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Calculate area stats
    const areas = properties
      .map(p => p.characteristics.totalArea || p.characteristics.usefulArea || 0)
      .filter(a => a > 0);
    const avgArea = areas.length > 0 ? areas.reduce((sum, a) => sum + a, 0) / areas.length : 0;

    // Calculate score stats
    const scores = properties
      .map(p => p.aiScores?.acquisitionScore || p.aiScores?.saleScore || 0)
      .filter(s => s > 0);
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

    // Calculate portal counts
    const portalCounts: Record<string, number> = {};
    properties.forEach(prop => {
      prop.metadata.sources.forEach(source => {
        portalCounts[source.name] = (portalCounts[source.name] || 0) + 1;
      });
    });

    // Calculate type counts
    const typeCounts: Record<string, number> = {};
    properties.forEach(prop => {
      typeCounts[prop.type] = (typeCounts[prop.type] || 0) + 1;
    });

    // Calculate distrito counts
    const distritoCounts: Record<string, number> = {};
    properties.forEach(prop => {
      const distrito = prop.location.address.distrito;
      if (distrito) {
        distritoCounts[distrito] = (distritoCounts[distrito] || 0) + 1;
      }
    });

    return {
      totalFound: properties.length,
      avgPrice: Math.round(avgPrice),
      minPrice,
      maxPrice,
      avgArea: Math.round(avgArea),
      avgScore: Math.round(avgScore),
      portalCounts,
      typeCounts,
      distritoCounts,
    };
  }

  /**
   * Extracts all properties from aggregation result
   */
  private extractAllProperties(result: MultiSourceSearchResult): PropertyCanonicalModel[] {
    const properties: PropertyCanonicalModel[] = [];

    if (result.casafari?.properties) {
      properties.push(...result.casafari.properties);
    }

    if (result.portals) {
      if (result.portals.idealista?.properties) {
        properties.push(...result.portals.idealista.properties);
      }
      if (result.portals.olx?.properties) {
        properties.push(...result.portals.olx.properties);
      }
      if (result.portals.imovirtual?.properties) {
        properties.push(...result.portals.imovirtual.properties);
      }
      if (result.portals.facebook?.properties) {
        properties.push(...result.portals.facebook.properties);
      }
    }

    if (result.crm?.properties) {
      properties.push(...result.crm.properties);
    }

    return properties;
  }

  /**
   * Enriches properties with geocoding data
   */
  private async enrichWithGeoData(
    properties: PropertyCanonicalModel[]
  ): Promise<PropertyCanonicalModel[]> {
    if (!this.geocodingService) return properties;

    console.log('[SearchService] Enriching properties with geo data...');

    const enriched = await Promise.all(
      properties.map(async (prop) => {
        // Skip if already has coordinates
        if (prop.location.coordinates) return prop;

        try {
          // Geocode address - use static method
          const addressString = [
            prop.location.address.freguesia,
            prop.location.address.concelho,
            prop.location.address.distrito,
          ].filter(Boolean).join(', ');

          const result = await GeocodingService.geocode(addressString);

          if (result) {
            prop.location.coordinates = {
              latitude: result.latitude,
              longitude: result.longitude,
              accuracy: result.accuracy,
            };
            prop.location.geohash = result.geohash;
            prop.location.formattedAddress = result.formattedAddress;
          }
        } catch (error) {
          console.error(`[SearchService] Geocoding error for property ${prop.id}:`, error);
        }

        return prop;
      })
    );

    return enriched;
  }

  /**
   * Applies search filters to properties
   */
  private applyFilters(
    properties: PropertyCanonicalModel[],
    query: SearchQuery
  ): PropertyCanonicalModel[] {
    const { filters } = query;

    return properties.filter(prop => {
      // Property type filter
      if (filters.propertyType && filters.propertyType.length > 0) {
        if (!filters.propertyType.includes(prop.type)) return false;
      }

      // Transaction type filter
      if (filters.transactionType) {
        if (prop.price.transactionType !== filters.transactionType) return false;
      }

      // Location filters
      if (filters.distrito && prop.location.address.distrito !== filters.distrito) return false;
      if (filters.concelho && prop.location.address.concelho !== filters.concelho) return false;
      if (filters.freguesia && prop.location.address.freguesia !== filters.freguesia) return false;
      if (filters.postalCode && prop.location.address.postalCode !== filters.postalCode) return false;

      // Price filters
      if (filters.minPrice && prop.price.value < filters.minPrice) return false;
      if (filters.maxPrice && prop.price.value > filters.maxPrice) return false;

      // Area filters
      const area = prop.characteristics.totalArea || prop.characteristics.usefulArea || 0;
      if (filters.minArea && area < filters.minArea) return false;
      if (filters.maxArea && area > filters.maxArea) return false;

      // Bedrooms filters
      const bedrooms = prop.characteristics.bedrooms || 0;
      if (filters.bedrooms && bedrooms !== filters.bedrooms) return false;
      if (filters.minBedrooms && bedrooms < filters.minBedrooms) return false;
      if (filters.maxBedrooms && bedrooms > filters.maxBedrooms) return false;

      // Bathrooms filters
      const bathrooms = prop.characteristics.bathrooms || 0;
      if (filters.bathrooms && bathrooms !== filters.bathrooms) return false;
      if (filters.minBathrooms && bathrooms < filters.minBathrooms) return false;

      // Typology filter
      if (filters.typology && filters.typology.length > 0) {
        if (!prop.characteristics.typology) return false;
        if (!filters.typology.includes(prop.characteristics.typology)) return false;
      }

      // Features filter
      if (filters.features && filters.features.length > 0) {
        if (!prop.characteristics.features) return false;
        const hasAllFeatures = filters.features.every(feature => {
          const featureKey = feature as keyof typeof prop.characteristics.features;
          return prop.characteristics.features?.[featureKey] === true;
        });
        if (!hasAllFeatures) return false;
      }

      // Condition filter
      if (filters.condition && filters.condition.length > 0) {
        if (!prop.characteristics.condition) return false;
        if (!filters.condition.includes(prop.characteristics.condition)) return false;
      }

      // Portals filter
      if (filters.portals && filters.portals.length > 0) {
        const propertyPortals = prop.metadata.sources.map(s => s.name);
        const hasAnyPortal = filters.portals.some(portal =>
          propertyPortals.some(pp => pp.toLowerCase().includes(portal.toLowerCase()))
        );
        if (!hasAnyPortal) return false;
      }

      // Score filters
      if (query.mode === SearchMode.ANGARIACAO && filters.minAngariaScore) {
        const score = prop.aiScores?.acquisitionScore || 0;
        if (score < filters.minAngariaScore) return false;
      }
      if (query.mode === SearchMode.VENDA && filters.minVendaScore) {
        const score = prop.aiScores?.saleScore || 0;
        if (score < filters.minVendaScore) return false;
      }

      // Temporal filters
      if (filters.publishedAfter) {
        if (prop.metadata.firstSeen < filters.publishedAfter) return false;
      }
      if (filters.publishedBefore) {
        if (prop.metadata.firstSeen > filters.publishedBefore) return false;
      }

      return true;
    });
  }

  /**
   * Calculates scores for all properties
   */
  private async calculateScores(
    properties: PropertyCanonicalModel[],
    query: SearchQuery
  ): Promise<SearchResultItem[]> {
    console.log(`[SearchService] Calculating scores for ${properties.length} properties`);

    const context: ScoringContext = {
      mode: query.mode,
      userId: query.userId,
      filters: {
        propertyType: query.filters.propertyType,
        location: {
          distrito: query.filters.distrito,
          concelho: query.filters.concelho,
          freguesia: query.filters.freguesia,
        },
        priceRange: {
          min: query.filters.minPrice,
          max: query.filters.maxPrice,
        },
        areaRange: {
          min: query.filters.minArea,
          max: query.filters.maxArea,
        },
      },
    };

    const items: SearchResultItem[] = await Promise.all(
      properties.map(async (property) => {
        try {
          const score = this.scoringService.calculateScore(property, context);

          // Update property with AI scores
          property.aiScores = {
            acquisitionScore: query.mode === SearchMode.ANGARIACAO ? score.finalScore : undefined,
            saleScore: query.mode === SearchMode.VENDA ? score.finalScore : undefined,
            topReasons: score.topReasons,
          };

          return {
            property,
            score: score.finalScore,
            matchReasons: score.topReasons,
            portalsFound: property.metadata.sources.map(s => s.name),
            duplicateCount: property.metadata.portalCount || 1,
            highlighted: score.finalScore >= 80,
          };
        } catch (error) {
          console.error(`[SearchService] Scoring error for property ${property.id}:`, error);
          return this.createDefaultResultItem(property);
        }
      })
    );

    return items;
  }

  /**
   * Creates a default result item (when scoring fails or is disabled)
   */
  private createDefaultResultItem(property: PropertyCanonicalModel): SearchResultItem {
    return {
      property,
      score: 50, // Default neutral score
      matchReasons: [],
      portalsFound: property.metadata.sources.map(s => s.name),
      duplicateCount: property.metadata.portalCount || 1,
      highlighted: false,
    };
  }

  /**
   * Sorts search results based on sort criteria
   */
  private sortResults(
    items: SearchResultItem[],
    sortBy: SearchSortBy,
    mode: SearchMode
  ): SearchResultItem[] {
    const sorted = [...items];

    switch (sortBy) {
      case SearchSortBy.SCORE:
        sorted.sort((a, b) => b.score - a.score);
        break;

      case SearchSortBy.PRICE_ASC:
        sorted.sort((a, b) => a.property.price.value - b.property.price.value);
        break;

      case SearchSortBy.PRICE_DESC:
        sorted.sort((a, b) => b.property.price.value - a.property.price.value);
        break;

      case SearchSortBy.AREA_ASC:
        sorted.sort((a, b) => {
          const areaA = a.property.characteristics.totalArea || a.property.characteristics.usefulArea || 0;
          const areaB = b.property.characteristics.totalArea || b.property.characteristics.usefulArea || 0;
          return areaA - areaB;
        });
        break;

      case SearchSortBy.AREA_DESC:
        sorted.sort((a, b) => {
          const areaA = a.property.characteristics.totalArea || a.property.characteristics.usefulArea || 0;
          const areaB = b.property.characteristics.totalArea || b.property.characteristics.usefulArea || 0;
          return areaB - areaA;
        });
        break;

      case SearchSortBy.RECENT:
        sorted.sort((a, b) => 
          b.property.metadata.firstSeen.getTime() - a.property.metadata.firstSeen.getTime()
        );
        break;

      case SearchSortBy.PORTAL_COUNT:
        sorted.sort((a, b) => b.duplicateCount - a.duplicateCount);
        break;

      default:
        // Default to score
        sorted.sort((a, b) => b.score - a.score);
    }

    return sorted;
  }

  /**
   * Paginates results
   */
  private paginate(
    items: SearchResultItem[],
    page: number,
    perPage: number
  ): SearchResultItem[] {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return items.slice(start, end);
  }

  /**
   * Calculates facets for search refinement
   */
  private calculateFacets(properties: PropertyCanonicalModel[]): SearchFacets {
    // Property types
    const typeMap = new Map<string, number>();
    properties.forEach(prop => {
      typeMap.set(prop.type, (typeMap.get(prop.type) || 0) + 1);
    });
    const propertyTypes = Array.from(typeMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // Distritos
    const distritoMap = new Map<string, number>();
    properties.forEach(prop => {
      const distrito = prop.location.address.distrito;
      if (distrito) {
        distritoMap.set(distrito, (distritoMap.get(distrito) || 0) + 1);
      }
    });
    const distritos = Array.from(distritoMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // Concelhos
    const concelhoMap = new Map<string, number>();
    properties.forEach(prop => {
      const concelho = prop.location.address.concelho;
      if (concelho) {
        concelhoMap.set(concelho, (concelhoMap.get(concelho) || 0) + 1);
      }
    });
    const concelhos = Array.from(concelhoMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // Typologies
    const typologyMap = new Map<string, number>();
    properties.forEach(prop => {
      const typology = prop.characteristics.typology;
      if (typology) {
        typologyMap.set(typology, (typologyMap.get(typology) || 0) + 1);
      }
    });
    const typologies = Array.from(typologyMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // Portals
    const portalMap = new Map<string, number>();
    properties.forEach(prop => {
      prop.metadata.sources.forEach(source => {
        portalMap.set(source.name, (portalMap.get(source.name) || 0) + 1);
      });
    });
    const portals = Array.from(portalMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // Price ranges
    const priceRanges = this.calculatePriceRanges(properties);

    return {
      propertyTypes,
      distritos,
      concelhos,
      typologies,
      portals,
      priceRanges,
    };
  }

  /**
   * Calculates price range buckets
   */
  private calculatePriceRanges(
    properties: PropertyCanonicalModel[]
  ): Array<{ min: number; max: number; count: number }> {
    const ranges = [
      { min: 0, max: 100000 },
      { min: 100000, max: 200000 },
      { min: 200000, max: 300000 },
      { min: 300000, max: 500000 },
      { min: 500000, max: 750000 },
      { min: 750000, max: 1000000 },
      { min: 1000000, max: Infinity },
    ];

    return ranges.map(range => ({
      ...range,
      count: properties.filter(
        p => p.price.value >= range.min && p.price.value < range.max
      ).length,
    }));
  }

  /**
   * Returns empty results
   */
  private emptyResults(query: SearchQuery): SearchResults {
    return {
      items: [],
      total: 0,
      page: query.page,
      perPage: query.perPage,
      totalPages: 0,
      stats: this.getStats([]),
      facets: {
        propertyTypes: [],
        distritos: [],
        concelhos: [],
        typologies: [],
        portals: [],
        priceRanges: [],
      },
    };
  }
}

/**
 * Factory function to create SearchService instance
 */
export function createSearchService(config: SearchServiceConfig): SearchService {
  return new SearchService(config);
}
