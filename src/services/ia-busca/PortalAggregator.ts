/**
 * PortalAggregator - Aggregates properties from multiple sources
 * 
 * Integrates with:
 * - CasafariService (multi-portal aggregator)
 * - Portal connectors (Idealista, OLX, Imovirtual, Facebook)
 * - CRMService (via orchestrator)
 * 
 * Features:
 * - Parallel querying with proper error handling
 * - Transforms all responses to PropertyCanonicalModel
 * - Calls DeduplicationService to merge duplicates
 * - Returns aggregated results with statistics
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import { CasafariService } from '../casafari/CasafariService';
import { CRMService } from '../crm/CRMService';
import { DeduplicationService, DuplicateGroup } from './DeduplicationService';
import type {
  SearchQuery,
  SearchOptions,
  MultiSourceSearchResult,
} from '../../types/search';
import type { CasafariSearchFilters } from '../casafari/types';
import type { SyncLeadsRequest } from '../../types/crm';

/**
 * Configuration for PortalAggregator
 */
export interface PortalAggregatorConfig {
  casafariService?: CasafariService;
  crmService?: CRMService;
  deduplicationService?: DeduplicationService;
  orchestratorUrl?: string;
  timeout?: number;
}

/**
 * Portal-specific connector interface
 */
interface PortalConnector {
  name: string;
  search: (filters: any, tenantId: string, teamId?: string) => Promise<PropertyCanonicalModel[]>;
  enabled: boolean;
}

/**
 * Default search options
 */
const DEFAULT_OPTIONS: Required<SearchOptions> = {
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
 * PortalAggregator Service
 */
export class PortalAggregator {
  private casafariService?: CasafariService;
  private crmService?: CRMService;
  private deduplicationService: DeduplicationService;
  private orchestratorUrl: string;
  private timeout: number;
  private portalConnectors: Map<string, PortalConnector>;

  constructor(config: PortalAggregatorConfig) {
    this.casafariService = config.casafariService;
    this.crmService = config.crmService;
    this.deduplicationService = config.deduplicationService || new DeduplicationService();
    this.orchestratorUrl = config.orchestratorUrl || process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ia-orquestradora`
      : '';
    this.timeout = config.timeout || 30000;
    this.portalConnectors = new Map();

    console.log('[PortalAggregator] Initialized');
  }

  /**
   * Aggregates properties from multiple sources
   * 
   * @param query - Search query with filters
   * @param options - Search options
   * @returns MultiSourceSearchResult with aggregated properties
   */
  async aggregate(
    query: SearchQuery,
    options?: SearchOptions
  ): Promise<MultiSourceSearchResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    console.log(`[PortalAggregator] Starting aggregation for mode: ${query.mode}`);

    const result: MultiSourceSearchResult = {
      totalProperties: 0,
      totalDuplicates: 0,
      totalUnique: 0,
      executionTimeMs: 0,
      sourcesQueried: [],
      sourcesSucceeded: [],
      sourcesFailed: [],
    };

    // Prepare parallel queries
    const queries: Promise<any>[] = [];
    const sources: string[] = [];

    // Query Casafari
    if (opts.enableCasafari && this.casafariService) {
      sources.push('casafari');
      result.sourcesQueried.push('casafari');
      queries.push(
        this.queryCasafari(query, opts)
          .then(data => ({ source: 'casafari', data, error: null }))
          .catch(error => ({ source: 'casafari', data: null, error: error.message }))
      );
    }

    // Query Portals (via orchestrator)
    if (opts.enablePortals) {
      const portalNames = ['idealista', 'olx', 'imovirtual', 'facebook'];
      portalNames.forEach(portal => {
        sources.push(portal);
        result.sourcesQueried.push(portal);
        queries.push(
          this.queryPortal(portal, query, opts)
            .then(data => ({ source: portal, data, error: null }))
            .catch(error => ({ source: portal, data: null, error: error.message }))
        );
      });
    }

    // Query CRM
    if (opts.enableCRM && this.crmService) {
      sources.push('crm');
      result.sourcesQueried.push('crm');
      queries.push(
        this.queryCRM(query, opts)
          .then(data => ({ source: 'crm', data, error: null }))
          .catch(error => ({ source: 'crm', data: null, error: error.message }))
      );
    }

    // Execute all queries in parallel with timeout
    const results = await Promise.all(
      queries.map(query => 
        Promise.race([
          query,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), opts.timeout)
          )
        ]).catch(error => ({ source: 'unknown', data: null, error: error.message }))
      )
    );

    // Process results
    const allProperties: PropertyCanonicalModel[] = [];

    for (const queryResult of results) {
      const { source, data, error } = queryResult as any;

      if (error) {
        console.error(`[PortalAggregator] Error from ${source}:`, error);
        result.sourcesFailed.push(source);
        
        // Set error in result
        if (source === 'casafari') {
          result.casafari = { properties: [], count: 0, error };
        } else if (source === 'crm') {
          result.crm = { properties: [], count: 0, error };
        } else if (['idealista', 'olx', 'imovirtual', 'facebook'].includes(source)) {
          if (!result.portals) result.portals = {};
          result.portals[source as keyof typeof result.portals] = { properties: [], count: 0, error };
        }
        continue;
      }

      result.sourcesSucceeded.push(source);

      if (source === 'casafari' && data) {
        result.casafari = {
          properties: data.properties || [],
          count: data.properties?.length || 0,
        };
        allProperties.push(...(data.properties || []));
      } else if (source === 'crm' && data) {
        result.crm = {
          properties: data.properties || [],
          count: data.properties?.length || 0,
        };
        allProperties.push(...(data.properties || []));
      } else if (['idealista', 'olx', 'imovirtual', 'facebook'].includes(source) && data) {
        if (!result.portals) result.portals = {};
        result.portals[source as keyof typeof result.portals] = {
          properties: data.properties || [],
          count: data.properties?.length || 0,
        };
        allProperties.push(...(data.properties || []));
      }
    }

    result.totalProperties = allProperties.length;

    // Deduplicate if enabled
    if (opts.enableDeduplication && allProperties.length > 0) {
      console.log(`[PortalAggregator] Deduplicating ${allProperties.length} properties`);
      
      const duplicateGroups = this.deduplicationService.findDuplicates(allProperties);
      result.totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0);
      
      // Replace properties with deduplicated ones
      const uniqueProperties = this.extractUniqueProperties(allProperties, duplicateGroups);
      result.totalUnique = uniqueProperties.length;

      // Update source results with deduplicated properties
      this.updateSourcesWithDeduplicated(result, uniqueProperties);
    } else {
      result.totalUnique = result.totalProperties;
    }

    result.executionTimeMs = Date.now() - startTime;
    console.log(`[PortalAggregator] Aggregation completed in ${result.executionTimeMs}ms`);
    console.log(`[PortalAggregator] Total: ${result.totalProperties}, Duplicates: ${result.totalDuplicates}, Unique: ${result.totalUnique}`);

    return result;
  }

  /**
   * Queries Casafari for properties
   */
  private async queryCasafari(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<{ properties: PropertyCanonicalModel[] }> {
    if (!this.casafariService) {
      throw new Error('CasafariService not configured');
    }

    console.log('[PortalAggregator] Querying Casafari...');

    const filters = this.buildCasafariFilters(query);
    const response = await this.casafariService.listProperties(
      filters,
      query.tenantId,
      query.teamId
    );

    // Apply maxResults limit
    const properties = response.properties.slice(0, options.maxResults || 100);

    console.log(`[PortalAggregator] Casafari returned ${properties.length} properties`);
    return { properties };
  }

  /**
   * Queries a specific portal via orchestrator
   */
  private async queryPortal(
    portalName: string,
    query: SearchQuery,
    options: SearchOptions
  ): Promise<{ properties: PropertyCanonicalModel[] }> {
    console.log(`[PortalAggregator] Querying ${portalName}...`);

    if (!this.orchestratorUrl) {
      throw new Error('Orchestrator URL not configured');
    }

    try {
      const payload = {
        action: 'SEARCH_PORTAL',
        portal: portalName,
        tenantId: query.tenantId,
        teamId: query.teamId,
        filters: query.filters,
        maxResults: options.maxResults,
      };

      const response = await fetch(this.orchestratorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(options.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform raw data to PropertyCanonicalModel
      const properties = this.transformPortalResponse(data.properties || [], query.tenantId, query.teamId);

      console.log(`[PortalAggregator] ${portalName} returned ${properties.length} properties`);
      return { properties };
    } catch (error: any) {
      console.error(`[PortalAggregator] Error querying ${portalName}:`, error.message);
      throw error;
    }
  }

  /**
   * Queries CRM for properties/leads
   */
  private async queryCRM(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<{ properties: PropertyCanonicalModel[] }> {
    if (!this.crmService) {
      throw new Error('CRMService not configured');
    }

    console.log('[PortalAggregator] Querying CRM...');

    const filters: SyncLeadsRequest['filters'] = {
      // Only include supported filters
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      limit: options.maxResults || 100,
      offset: 0,
    };

    const response = await this.crmService.syncLeads('default', filters);

    // Transform leads to properties (assume CRMService returns PropertyCanonicalModel)
    const properties = response.leads
      .map(lead => this.transformLeadToProperty(lead, query.tenantId, query.teamId))
      .slice(0, options.maxResults || 100);

    console.log(`[PortalAggregator] CRM returned ${properties.length} properties`);
    return { properties };
  }

  /**
   * Builds Casafari filters from SearchQuery
   */
  private buildCasafariFilters(query: SearchQuery): CasafariSearchFilters {
    const { filters } = query;
    
    // Map transaction type to Casafari format
    let transactionType: 'sale' | 'rent' | undefined;
    if (filters.transactionType) {
      transactionType = filters.transactionType.toLowerCase() as 'sale' | 'rent';
    }

    // Map custom location boundary
    let customLocationBoundary: CasafariSearchFilters['custom_location_boundary'];
    if (filters.customLocationBoundary) {
      if (filters.customLocationBoundary.type === 'circle' && 
          filters.customLocationBoundary.center && 
          filters.customLocationBoundary.radius) {
        customLocationBoundary = {
          type: 'circle',
          center: filters.customLocationBoundary.center,
          radius: filters.customLocationBoundary.radius,
        };
      } else if (filters.customLocationBoundary.type === 'polygon' && 
                 filters.customLocationBoundary.coordinates) {
        customLocationBoundary = {
          type: 'polygon',
          coordinates: filters.customLocationBoundary.coordinates,
        };
      }
    }

    // Map characteristics (must_have/exclude)
    let characteristics: CasafariSearchFilters['characteristics'];
    if (filters.mustHaveFeatures || filters.excludeFeatures) {
      characteristics = {
        must_have: filters.mustHaveFeatures,
        exclude: filters.excludeFeatures,
      };
    }

    // Type guards for validation
    const isValidEnergyRating = (rating: string): rating is 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' => {
      return ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(rating);
    };

    const isValidCondition = (condition: string): condition is 'used' | 'ruin' | 'very-good' | 'new' | 'other' => {
      return ['used', 'ruin', 'very-good', 'new', 'other'].includes(condition);
    };

    const isValidFloor = (floor: string): floor is 'no_floor' | 'ground' | 'middle' | 'top' => {
      return ['no_floor', 'ground', 'middle', 'top'].includes(floor);
    };

    const isValidView = (view: string): view is 'water' | 'landscape' | 'city' | 'golf' | 'park' => {
      return ['water', 'landscape', 'city', 'golf', 'park'].includes(view);
    };

    const isValidDirection = (direction: string): direction is 'north' | 'south' | 'east' | 'west' => {
      return ['north', 'south', 'east', 'west'].includes(direction);
    };

    // Map energy ratings with validation
    let energyRatings: CasafariSearchFilters['energy_ratings'];
    if (filters.energyRatings) {
      energyRatings = filters.energyRatings.filter(isValidEnergyRating);
    }

    // Map conditions with validation
    let conditions: CasafariSearchFilters['conditions'];
    if (filters.condition) {
      conditions = filters.condition.filter(isValidCondition);
    }

    // Map floors with validation
    let floors: CasafariSearchFilters['floors'];
    if (filters.floors) {
      floors = filters.floors.filter(isValidFloor);
    }

    // Map views with validation
    let viewTypes: CasafariSearchFilters['view_types'];
    if (filters.views) {
      viewTypes = filters.views.filter(isValidView);
    }

    // Map directions with validation
    let directions: CasafariSearchFilters['directions'];
    if (filters.directions) {
      directions = filters.directions.filter(isValidDirection);
    }

    // Map orientation with validation
    let orientations: CasafariSearchFilters['orientations'];
    if (filters.orientation && (filters.orientation === 'exterior' || filters.orientation === 'interior')) {
      orientations = filters.orientation;
    }

    // Map dates to ISO strings
    const toISOString = (date?: Date) => date?.toISOString();

    // Map advanced sorting from SearchQuery.sortBy to Casafari format
    let order: CasafariSearchFilters['order'];
    let orderBy: CasafariSearchFilters['order_by'];
    
    if (query.sortBy) {
      // Extract order direction from sortBy (e.g., PRICE_ASC -> asc)
      if (query.sortBy.includes('ASC')) {
        order = 'asc';
      } else if (query.sortBy.includes('DESC')) {
        order = 'desc';
      }
      
      // Map sortBy field to Casafari order_by
      if (query.sortBy.includes('PRICE')) {
        orderBy = 'price';
      } else if (query.sortBy.includes('AREA')) {
        orderBy = 'total_area';
      } else if (query.sortBy === 'RECENT') {
        orderBy = 'last_update';
        order = 'desc';
      }
    }

    return {
      // Basic location filters
      district: filters.distrito,
      municipality: filters.concelho,
      parish: filters.freguesia,
      postalCode: filters.postalCode,
      location_ids: filters.locationIds,
      custom_location_boundary: customLocationBoundary,
      
      // Property type and transaction
      propertyType: filters.propertyType,
      transactionType,
      
      // Price filters
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      price_per_sqm_from: filters.minPricePerSqm,
      price_per_sqm_to: filters.maxPricePerSqm,
      
      // Area filters
      minArea: filters.minArea,
      maxArea: filters.maxArea,
      plot_area_from: filters.minPlotArea,
      plot_area_to: filters.maxPlotArea,
      
      // Bedrooms and bathrooms
      bedrooms: filters.bedrooms,
      minBedrooms: filters.minBedrooms,
      maxBedrooms: filters.maxBedrooms,
      bathrooms_from: filters.minBathrooms,
      bathrooms_to: filters.maxBathrooms,
      
      // Floor information
      floors,
      floor_number: filters.floorNumbers,
      
      // Construction year
      construction_year_from: filters.minConstructionYear,
      construction_year_to: filters.maxConstructionYear,
      
      // Market metrics
      days_on_market_from: filters.minDaysOnMarket,
      days_on_market_to: filters.maxDaysOnMarket,
      gross_yield_from: filters.minGrossYield,
      gross_yield_to: filters.maxGrossYield,
      
      // Views, directions and orientation
      view_types: viewTypes,
      directions,
      orientations,
      
      // Property characteristics
      characteristics,
      energy_ratings: energyRatings,
      conditions,
      
      // Business filters
      private: filters.privateListings,
      auction: filters.auctionOnly,
      bank: filters.bankOwned,
      casafari_connect: filters.casafariConnect,
      exclusive: filters.exclusiveListings,
      with_agencies: filters.withAgencies,
      without_agencies: filters.withoutAgencies,
      listing_agents: filters.listingAgents,
      ref_numbers: filters.refNumbers,
      
      // Date filters (advanced)
      property_date_from: toISOString(filters.propertyDateFrom),
      property_date_to: toISOString(filters.propertyDateTo),
      created_date_from: toISOString(filters.createdDateFrom),
      created_date_to: toISOString(filters.createdDateTo),
      updated_date_from: toISOString(filters.updatedDateFrom),
      updated_date_to: toISOString(filters.updatedDateTo),
      
      // Date filters (legacy - for backward compatibility)
      publishedAfter: toISOString(filters.publishedAfter),
      publishedBefore: toISOString(filters.publishedBefore),
      
      // Pagination
      page: query.page,
      perPage: query.perPage,
      
      // Advanced sorting
      order,
      order_by: orderBy,
    };
  }

  /**
   * Transforms portal response to PropertyCanonicalModel
   */
  private transformPortalResponse(
    rawProperties: any[],
    tenantId: string,
    teamId?: string
  ): PropertyCanonicalModel[] {
    return rawProperties.map(raw => {
      // Basic transformation - in production, use dedicated transformers
      return new PropertyCanonicalModel({
        tenantId,
        teamId,
        ...raw,
      });
    });
  }

  /**
   * Transforms CRM lead to PropertyCanonicalModel
   */
  private transformLeadToProperty(
    lead: any,
    tenantId: string,
    teamId?: string
  ): PropertyCanonicalModel {
    // Basic transformation - adjust based on your Lead model
    return new PropertyCanonicalModel({
      tenantId,
      teamId,
      id: lead.id,
      type: lead.propertyType,
      location: lead.location,
      price: lead.price,
      characteristics: lead.characteristics,
      metadata: {
        sources: [{
          type: 'CRM',
          name: 'Internal CRM',
          id: lead.id,
        }],
        firstSeen: new Date(lead.createdAt),
        lastSeen: new Date(),
        lastUpdated: new Date(lead.updatedAt),
        dataQuality: lead.dataQuality || 'MEDIUM',
      },
    });
  }

  /**
   * Extracts unique properties from duplicate groups
   */
  private extractUniqueProperties(
    allProperties: PropertyCanonicalModel[],
    duplicateGroups: DuplicateGroup[]
  ): PropertyCanonicalModel[] {
    const uniqueProperties: PropertyCanonicalModel[] = [];
    const processedIds = new Set<string>();

    // Add all primary properties from duplicate groups
    for (const group of duplicateGroups) {
      uniqueProperties.push(group.primary);
      processedIds.add(group.primary.id);
      group.duplicates.forEach(dup => processedIds.add(dup.id));
    }

    // Add properties that weren't part of any group
    for (const prop of allProperties) {
      if (!processedIds.has(prop.id)) {
        uniqueProperties.push(prop);
      }
    }

    return uniqueProperties;
  }

  /**
   * Updates source results with deduplicated properties
   */
  private updateSourcesWithDeduplicated(
    result: MultiSourceSearchResult,
    uniqueProperties: PropertyCanonicalModel[]
  ): void {
    // This is a simplified implementation
    // In production, you'd want to maintain source attribution
    
    if (result.casafari) {
      result.casafari.properties = uniqueProperties.filter(p =>
        p.metadata.sources.some(s => s.name.toLowerCase().includes('casafari'))
      );
      result.casafari.count = result.casafari.properties.length;
    }

    if (result.crm) {
      result.crm.properties = uniqueProperties.filter(p =>
        p.metadata.sources.some(s => s.type === 'CRM')
      );
      result.crm.count = result.crm.properties.length;
    }

    if (result.portals) {
      const portalNames = ['idealista', 'olx', 'imovirtual', 'facebook'];
      for (const portal of portalNames) {
        const key = portal as keyof typeof result.portals;
        if (result.portals[key]) {
          result.portals[key]!.properties = uniqueProperties.filter(p =>
            p.metadata.sources.some(s => s.name.toLowerCase().includes(portal))
          );
          result.portals[key]!.count = result.portals[key]!.properties.length;
        }
      }
    }
  }
}

/**
 * Factory function to create PortalAggregator instance
 */
export function createPortalAggregator(config: PortalAggregatorConfig): PortalAggregator {
  return new PortalAggregator(config);
}
