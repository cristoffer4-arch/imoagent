/**
 * Connector Interface para portais imobiliários
 */

export interface PropertyListing {
  external_id: string;
  url: string;
  title: string;
  description: string;
  price: number;
  typology: string;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  images: string[];
  agency?: string;
  published_at: string;
  updated_at: string;
  raw_data: Record<string, any>;
}

export interface ConnectorConfig {
  enabled: boolean;
  baseUrl: string;
  rateLimit?: number; // requests per minute
  headers?: Record<string, string>;
}

export abstract class PortalConnector {
  protected config: ConnectorConfig;
  protected portalName: string;

  constructor(portalName: string, config: ConnectorConfig) {
    this.portalName = portalName;
    this.config = config;
  }

  /**
   * Busca imóveis por critérios
   */
  abstract search(params: {
    location?: string;
    typology?: string;
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    page?: number;
  }): Promise<PropertyListing[]>;

  /**
   * Busca um imóvel específico por ID
   */
  abstract getById(id: string): Promise<PropertyListing | null>;

  /**
   * Valida se o portal está acessível
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Normaliza dados do portal para formato padrão
   */
  protected abstract normalize(rawData: any): PropertyListing;
}
