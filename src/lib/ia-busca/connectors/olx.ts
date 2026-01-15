import { PortalConnector, PropertyListing, ConnectorConfig } from './base';

/**
 * Connector para OLX
 * 
 * URL pattern: https://www.olx.pt/imoveis/apartamentos-casas-venda/
 * 
 * NOTA: Este é um stub para MVP. Em produção, implementar scraping real
 * ou integração com API do OLX.
 */
export class OLXConnector extends PortalConnector {
  constructor(config?: Partial<ConnectorConfig>) {
    super('olx', {
      enabled: config?.enabled ?? true,
      baseUrl: 'https://www.olx.pt',
      rateLimit: 20, // 20 requests per minute
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      ...config,
    });
  }

  async search(params: {
    location?: string;
    typology?: string;
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    page?: number;
  }): Promise<PropertyListing[]> {
    // MVP: Retornar dados mock
    // Em produção: Implementar scraping ou API call
    console.log(`[OLX] Search with params:`, params);

    return this.getMockListings(params.page || 1);
  }

  async getById(id: string): Promise<PropertyListing | null> {
    // MVP: Retornar dados mock
    console.log(`[OLX] Get property ${id}`);

    const mockListings = this.getMockListings(1);
    return mockListings.find((l) => l.external_id === id) || null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // MVP: Sempre retornar true
      // Em produção: Fazer request real ao portal
      return true;
    } catch (error) {
      console.error('[OLX] Health check failed:', error);
      return false;
    }
  }

  protected normalize(rawData: any): PropertyListing {
    // Normalização de dados do OLX para formato padrão
    return {
      external_id: rawData.id || rawData.ad_id,
      url: rawData.url || `https://www.olx.pt/d/anuncio/${rawData.id}`,
      title: rawData.title,
      description: rawData.description || '',
      price: parseFloat(rawData.params?.price?.value) || 0,
      typology: this.extractTypology(rawData.title || rawData.description),
      area_m2:
        parseFloat(
          rawData.params?.area?.value || rawData.params?.size?.value
        ) || 0,
      bedrooms: parseInt(rawData.params?.rooms?.value) || 0,
      bathrooms: 1, // OLX nem sempre tem esta info
      address:
        rawData.location?.city?.name ||
        rawData.location?.region?.name ||
        '',
      images: rawData.photos?.map((p: any) => p.link) || [],
      agency: undefined, // OLX é maioritariamente particulares
      published_at: rawData.created_time || new Date().toISOString(),
      updated_at: rawData.last_refresh_time || new Date().toISOString(),
      raw_data: rawData,
    };
  }

  private extractTypology(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('t0') || lower.includes('studio')) return 'T0';
    if (lower.includes('t1')) return 'T1';
    if (lower.includes('t2')) return 'T2';
    if (lower.includes('t3')) return 'T3';
    if (lower.includes('t4')) return 'T4';
    if (lower.includes('t5') || lower.includes('t6')) return 'T5+';
    return 'T2'; // default
  }

  /**
   * Gera listagens mock para MVP
   */
  private getMockListings(page: number): PropertyListing[] {
    const listings: PropertyListing[] = [];
    const perPage = 10;
    const start = (page - 1) * perPage;

    for (let i = 0; i < perPage; i++) {
      const id = `olx-${start + i + 1}`;
      const typology = `T${Math.floor(Math.random() * 4) + 1}`;
      listings.push({
        external_id: id,
        url: `https://www.olx.pt/d/anuncio/${id}`,
        title: `${typology} para venda em Lisboa`,
        description:
          'Bom apartamento, bem localizado. Contacte para mais informações.',
        price: Math.floor(Math.random() * 350000) + 120000,
        typology,
        area_m2: Math.floor(Math.random() * 90) + 40,
        bedrooms: parseInt(typology[1]),
        bathrooms: 1,
        address: 'Lisboa, Portugal',
        images: [`https://via.placeholder.com/800x600?text=OLX+${id}`],
        agency: undefined, // Maioria são particulares
        published_at: new Date(
          Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
        raw_data: { source: 'olx-mock' },
      });
    }

    return listings;
  }
}
