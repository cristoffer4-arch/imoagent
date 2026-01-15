/**
 * Casafari API Client for Deno/Supabase Edge Functions
 * Lightweight version adapted for Deno runtime
 */

export interface CasafariProperty {
  id: string;
  title: string;
  type: string;
  operation: "sale" | "rent";
  price: number;
  currency: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    city: string;
    district?: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images?: string[];
  features?: string[];
  energyRating?: string;
  url?: string;
}

export interface CanonicalProperty {
  id: string;
  source: "casafari";
  sourceId: string;
  sourceUrl?: string;
  title: string;
  type: "house" | "apartment" | "land" | "commercial";
  operation: "sale" | "rent";
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  features?: string[];
}

export interface SearchParams {
  operation?: "sale" | "rent";
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

const CASAFARI_BASE_URL = "https://api.casafari.com/v1";
const REQUEST_TIMEOUT = 30000;

/**
 * Transform Casafari property to canonical format
 */
function transformProperty(prop: CasafariProperty): CanonicalProperty {
  const typeMap: Record<string, "house" | "apartment" | "land" | "commercial"> = {
    apartment: "apartment",
    flat: "apartment",
    house: "house",
    villa: "house",
    land: "land",
    commercial: "commercial",
  };

  return {
    id: `casafari-${prop.id}`,
    source: "casafari",
    sourceId: prop.id,
    sourceUrl: prop.url,
    title: prop.title,
    type: typeMap[prop.type.toLowerCase()] || "apartment",
    operation: prop.operation,
    price: prop.price,
    area: prop.area,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    city: prop.location.city,
    district: prop.location.district,
    latitude: prop.location.coordinates?.latitude,
    longitude: prop.location.coordinates?.longitude,
    images: prop.images || [],
    features: prop.features,
  };
}

/**
 * Generate mock properties for development/testing
 */
function getMockProperties(): CasafariProperty[] {
  return [
    {
      id: "mock-001",
      title: "Apartamento T3 em Lisboa - Casafari",
      type: "apartment",
      operation: "sale",
      price: 450000,
      currency: "EUR",
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      location: {
        city: "Lisboa",
        district: "Lisboa",
        country: "Portugal",
        coordinates: {
          latitude: 38.7223,
          longitude: -9.1393,
        },
      },
      images: ["https://via.placeholder.com/800x600?text=Lisboa+T3"],
      features: ["Varanda", "Garagem", "Aquecimento"],
      energyRating: "B",
      url: "https://www.casafari.com/property/mock-001",
    },
    {
      id: "mock-002",
      title: "Moradia T4 no Porto - Casafari",
      type: "house",
      operation: "sale",
      price: 650000,
      currency: "EUR",
      area: 200,
      bedrooms: 4,
      bathrooms: 3,
      location: {
        city: "Porto",
        district: "Porto",
        country: "Portugal",
        coordinates: {
          latitude: 41.1579,
          longitude: -8.6291,
        },
      },
      images: ["https://via.placeholder.com/800x600?text=Porto+T4"],
      features: ["Jardim", "Piscina", "Garagem"],
      energyRating: "A",
      url: "https://www.casafari.com/property/mock-002",
    },
  ];
}

/**
 * Casafari API Client
 */
export class CasafariClient {
  private apiKey: string;
  private useMock: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get("CASAFARI_API_KEY") || "";
    this.useMock = !this.apiKey || this.apiKey === "mock";
  }

  /**
   * Search properties with filters
   */
  async searchProperties(params: SearchParams): Promise<CanonicalProperty[]> {
    if (this.useMock) {
      let mockData = getMockProperties();

      // Apply filters to mock data
      if (params.city) {
        mockData = mockData.filter((p) =>
          p.location.city.toLowerCase().includes(params.city.toLowerCase())
        );
      }
      if (params.minPrice) {
        mockData = mockData.filter((p) => p.price >= params.minPrice);
      }
      if (params.maxPrice) {
        mockData = mockData.filter((p) => p.price <= params.maxPrice);
      }
      if (params.bedrooms) {
        mockData = mockData.filter((p) => p.bedrooms === params.bedrooms);
      }
      if (params.operation) {
        mockData = mockData.filter((p) => p.operation === params.operation);
      }

      return mockData.map(transformProperty);
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(
        `${CASAFARI_BASE_URL}/properties/search?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const properties = data.data || [];

      return properties.map(transformProperty);
    } catch (error) {
      console.error("Casafari API error:", error);
      // Fallback to mock on error
      return getMockProperties().map(transformProperty);
    }
  }

  /**
   * List properties with pagination
   */
  async listProperties(
    page: number = 1,
    perPage: number = 20
  ): Promise<CanonicalProperty[]> {
    if (this.useMock) {
      return getMockProperties().map(transformProperty);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(
        `${CASAFARI_BASE_URL}/properties?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const properties = data.data || [];

      return properties.map(transformProperty);
    } catch (error) {
      console.error("Casafari API error:", error);
      return getMockProperties().map(transformProperty);
    }
  }

  /**
   * Get property details by ID
   */
  async getPropertyDetails(propertyId: string): Promise<CanonicalProperty | null> {
    if (this.useMock) {
      const mockData = getMockProperties().find((p) => p.id === propertyId);
      return mockData ? transformProperty(mockData) : null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(
        `${CASAFARI_BASE_URL}/properties/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const property = await response.json();
      return transformProperty(property);
    } catch (error) {
      console.error("Casafari API error:", error);
      return null;
    }
  }
}
