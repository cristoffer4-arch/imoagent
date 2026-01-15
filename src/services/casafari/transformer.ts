/**
 * Data transformation utilities for Casafari API
 * Converts Casafari property format to canonical system format
 */

import type { CasafariProperty, CanonicalProperty } from './types';

/**
 * Maps Casafari property type to canonical type
 */
function mapPropertyType(casafariType: string): "house" | "apartment" | "land" | "commercial" {
  const typeMap: Record<string, "house" | "apartment" | "land" | "commercial"> = {
    apartment: "apartment",
    flat: "apartment",
    house: "house",
    villa: "house",
    townhouse: "house",
    land: "land",
    plot: "land",
    commercial: "commercial",
    office: "commercial",
    retail: "commercial",
  };

  const normalizedType = casafariType.toLowerCase().trim();
  return typeMap[normalizedType] || "apartment";
}

/**
 * Determines property status based on operation and availability
 */
function determineStatus(
  operation: "sale" | "rent"
): "available" | "sold" | "rented" | "pending" {
  // By default, properties from API are available
  // This could be enhanced with additional data from the API
  return "available";
}

/**
 * Transforms a single Casafari property to canonical format
 */
export function transformCasafariProperty(
  casafariProp: CasafariProperty
): CanonicalProperty {
  return {
    id: `casafari-${casafariProp.id}`,
    source: "casafari",
    sourceId: casafariProp.id,
    sourceUrl: casafariProp.url,
    title: casafariProp.title,
    description: casafariProp.description,
    type: mapPropertyType(casafariProp.type),
    status: determineStatus(casafariProp.operation),
    operation: casafariProp.operation,
    price: casafariProp.price,
    area: casafariProp.area,
    bedrooms: casafariProp.bedrooms,
    bathrooms: casafariProp.bathrooms,
    address: casafariProp.location.address,
    city: casafariProp.location.city,
    district: casafariProp.location.district,
    country: casafariProp.location.country,
    latitude: casafariProp.location.coordinates?.latitude,
    longitude: casafariProp.location.coordinates?.longitude,
    images: casafariProp.images || [],
    features: casafariProp.features,
    energyRating: casafariProp.energyRating,
    publishedAt: casafariProp.publishedAt ? new Date(casafariProp.publishedAt) : undefined,
    updatedAt: casafariProp.updatedAt ? new Date(casafariProp.updatedAt) : undefined,
    agentInfo: casafariProp.agent ? {
      name: casafariProp.agent.name,
      phone: casafariProp.agent.phone,
      email: casafariProp.agent.email,
    } : undefined,
    metadata: {
      reference: casafariProp.reference,
      currency: casafariProp.currency,
    },
  };
}

/**
 * Transforms an array of Casafari properties to canonical format
 */
export function transformCasafariProperties(
  casafariProps: CasafariProperty[]
): CanonicalProperty[] {
  return casafariProps.map(transformCasafariProperty);
}

/**
 * Validates that a Casafari property has required fields
 */
export function validateCasafariProperty(prop: Partial<CasafariProperty>): boolean {
  return !!(
    prop.id &&
    prop.title &&
    prop.price &&
    prop.area &&
    prop.location?.city
  );
}
