import {
  PropertyEntity,
  ListingAppearance,
  NormalizedProperty,
  Scores,
  ACMReport,
  MarketEvent,
  EventType,
} from '../types';

/**
 * Normalize raw property data from different sources into canonical format
 * In production, this would call the IA Orquestradora Supabase Edge Function
 */
export async function normalizeProperty(
  rawData: any
): Promise<NormalizedProperty> {
  // Mock normalization - in production, call Supabase Edge Function
  // const response = await fetch(
  //   'https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-orquestradora',
  //   { method: 'POST', body: JSON.stringify({ action: 'normalize', data: rawData }) }
  // );
  
  return {
    lat: rawData.latitude || rawData.lat,
    lon: rawData.longitude || rawData.lon,
    geohash: rawData.geohash,
    freguesia: rawData.freguesia || rawData.parish,
    concelho: rawData.concelho || rawData.municipality,
    distrito: rawData.distrito || rawData.district,
    typology: rawData.typology || rawData.tipo || rawData.type,
    area_m2: rawData.area_m2 || rawData.area || rawData.size,
    bedrooms: rawData.bedrooms || rawData.quartos || rawData.rooms,
    bathrooms: rawData.bathrooms || rawData.casas_banho,
    features: rawData.features || {},
    condition: rawData.condition || rawData.estado,
    price: rawData.price || rawData.preco || rawData.valor,
    source_type: rawData.source_type,
    source_name: rawData.source_name,
    source_listing_id: rawData.source_listing_id,
    url: rawData.url,
  };
}

/**
 * Deduplicate property listings into unique property entities
 * Uses embeddings and image hashes for similarity detection
 * In production, this calls the IA Orquestradora
 */
export async function deduplicateProperties(
  listings: ListingAppearance[]
): Promise<PropertyEntity[]> {
  // Mock deduplication - in production, use embeddings + image hashes
  // Group by approximate location and characteristics
  const groups = new Map<string, ListingAppearance[]>();
  
  listings.forEach((listing) => {
    // Simple grouping key - in production, use embeddings
    const key = `${listing.source_name}-${listing.source_listing_id}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(listing);
  });

  // Convert groups to PropertyEntity objects
  const properties: PropertyEntity[] = [];
  
  groups.forEach((group, key) => {
    const [tenant_id] = key.split('-');
    properties.push({
      id: key,
      tenant_id: tenant_id || 'default',
      portal_count: group.length,
      sources: { listings: group },
      first_seen: group[0].published_at,
      last_seen: group[group.length - 1].last_seen,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return properties;
}

/**
 * Calculate AngariaScore and VendaScore for a property
 * Based on recency, price divergence, portal count, availability
 */
export async function calculateScores(
  property: PropertyEntity
): Promise<Scores> {
  // Scoring logic
  let angaria_score = 0;
  let venda_score = 0;
  let availability_probability = 0.5;

  // Recency factor (0-40 points)
  const daysSinceLastSeen = property.last_seen
    ? Math.floor(
        (Date.now() - new Date(property.last_seen).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 999;
  
  const recency_points = Math.max(0, 40 - daysSinceLastSeen);
  angaria_score += recency_points;
  venda_score += recency_points * 0.5;

  // Portal count factor (0-30 points)
  const portal_points = Math.min(30, (property.portal_count || 1) * 10);
  angaria_score += portal_points;
  venda_score += portal_points * 0.3;

  // Price divergence factor (0-30 points for angariacao, negative for venda)
  const price_div = property.price_divergence_pct || 0;
  if (price_div > 0) {
    angaria_score += Math.min(30, price_div * 3);
    venda_score -= Math.min(20, price_div * 2);
  }

  // Availability probability
  if (daysSinceLastSeen < 7) {
    availability_probability = 0.9;
  } else if (daysSinceLastSeen < 30) {
    availability_probability = 0.7;
  } else if (daysSinceLastSeen < 90) {
    availability_probability = 0.4;
  } else {
    availability_probability = 0.1;
  }

  venda_score += availability_probability * 20;

  // Normalize scores to 0-100
  angaria_score = Math.min(100, Math.max(0, angaria_score));
  venda_score = Math.min(100, Math.max(0, venda_score));

  return {
    angaria_score,
    venda_score,
    availability_probability,
    confidence: 0.85,
  };
}

/**
 * Generate ACM (Análise Comparativa de Mercado) report
 * In production, calls IA Orquestradora for AI-powered analysis
 */
export async function generateACM(propertyId: string): Promise<ACMReport> {
  // Mock ACM generation - in production, call Supabase Edge Function
  const report: ACMReport = {
    id: `acm-${Date.now()}`,
    tenant_id: 'default',
    property_id: propertyId,
    report_data: {
      comparable_properties: [],
      price_range: { min: 0, max: 0, avg: 0 },
      market_trend: 'stable',
      recommendation: 'Market analysis pending',
      generated_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };

  return report;
}

/**
 * Detect market events for a property
 * Types: NEW_ON_MARKET, PRICE_DROP, BACK_ON_MARKET, OFF_MARKET
 */
export async function detectEvents(
  property: PropertyEntity,
  previousState?: PropertyEntity
): Promise<MarketEvent[]> {
  const events: MarketEvent[] = [];

  // New on market
  if (!previousState) {
    events.push({
      id: `event-${Date.now()}-1`,
      property_id: property.id,
      event_type: EventType.NEW_ON_MARKET,
      event_data: {
        first_seen: property.first_seen,
        initial_price: property.price_main,
      },
      created_at: new Date().toISOString(),
    });
  }

  // Price drop
  if (
    previousState &&
    property.price_main &&
    previousState.price_main &&
    property.price_main < previousState.price_main
  ) {
    const drop_pct =
      ((previousState.price_main - property.price_main) /
        previousState.price_main) *
      100;
    
    events.push({
      id: `event-${Date.now()}-2`,
      property_id: property.id,
      event_type: EventType.PRICE_DROP,
      event_data: {
        old_price: previousState.price_main,
        new_price: property.price_main,
        drop_percentage: drop_pct,
      },
      created_at: new Date().toISOString(),
    });
  }

  // Back on market (was offline, now online)
  if (
    previousState &&
    previousState.portal_count === 0 &&
    (property.portal_count || 0) > 0
  ) {
    events.push({
      id: `event-${Date.now()}-3`,
      property_id: property.id,
      event_type: EventType.BACK_ON_MARKET,
      event_data: {
        portal_count: property.portal_count,
      },
      created_at: new Date().toISOString(),
    });
  }

  // Off market
  if (
    previousState &&
    (previousState.portal_count || 0) > 0 &&
    property.portal_count === 0
  ) {
    events.push({
      id: `event-${Date.now()}-4`,
      property_id: property.id,
      event_type: EventType.OFF_MARKET,
      event_data: {
        last_portal_count: previousState.portal_count,
      },
      created_at: new Date().toISOString(),
    });
  }

  return events;
}
