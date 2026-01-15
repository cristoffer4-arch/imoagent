import { PortalConnector, PropertyListing, ConnectorConfig } from './base';

/**
 * Connector para Idealista
 * 
 * URL pattern: https://www.idealista.pt/comprar-casas/lisboa/
 * 
 * NOTA: Este é um stub para MVP. Em produção, implementar scraping real
 * ou integração com API oficial do Idealista.
 */
export class IdealistaConnector extends PortalConnector {
  constructor(config?: Partial<ConnectorConfig>) {
    super('idealista', {
      enabled: config?.enabled ?? true,
      baseUrl: 'https://www.idealista.pt',
      rateLimit: 30, // 30 requests per minute
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
    console.log(`[Idealista] Search with params:`, params);

    return this.getMockListings(params.page || 1);
  }

  async getById(id: string): Promise<PropertyListing | null> {
    // MVP: Retornar dados mock
    console.log(`[Idealista] Get property ${id}`);

    const mockListings = this.getMockListings(1);
    return mockListings.find((l) => l.external_id === id) || null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // MVP: Sempre retornar true
      // Em produção: Fazer request real ao portal
      return true;
    } catch (error) {
      console.error('[Idealista] Health check failed:', error);
      return false;
    }
  }

  protected normalize(rawData: any): PropertyListing {
    // Normalização de dados do Idealista para formato padrão
    return {
      external_id: rawData.id || rawData.propertyCode,
      url: rawData.url || `https://www.idealista.pt/imovel/${rawData.id}`,
      title: rawData.title || rawData.propertyType,
      description: rawData.description || '',
      price: parseFloat(rawData.price) || 0,
      typology: this.normalizeTypology(rawData.rooms || rawData.size),
      area_m2: parseFloat(rawData.size) || 0,
      bedrooms: parseInt(rawData.rooms) || 0,
      bathrooms: parseInt(rawData.bathrooms) || 1,
      address: rawData.address || '',
      images: rawData.multimedia?.images || [],
      agency: rawData.agency?.name,
      published_at: rawData.publishDate || new Date().toISOString(),
      updated_at: rawData.modificationDate || new Date().toISOString(),
      raw_data: rawData,
    };
  }

  private normalizeTypology(value: any): string {
    const num = parseInt(value);
    if (isNaN(num)) return 'T2';
    if (num === 0) return 'T0';
    if (num === 1) return 'T1';
    if (num === 2) return 'T2';
    if (num === 3) return 'T3';
    if (num === 4) return 'T4';
    return 'T5+';
  }

  /**
   * Gera listagens mock para MVP
   */
  private getMockListings(page: number): PropertyListing[] {
    const listings: PropertyListing[] = [];
    const perPage = 10;
    const start = (page - 1) * perPage;

    for (let i = 0; i < perPage; i++) {
      const id = `idealista-${start + i + 1}`;
      listings.push({
        external_id: id,
        url: `https://www.idealista.pt/imovel/${id}`,
        title: `Apartamento T${Math.floor(Math.random() * 4) + 1} em Lisboa`,
        description:
          'Apartamento moderno, com excelente localização. Próximo de transportes e serviços.',
        price: Math.floor(Math.random() * 400000) + 150000,
        typology: `T${Math.floor(Math.random() * 4) + 1}`,
        area_m2: Math.floor(Math.random() * 100) + 50,
        bedrooms: Math.floor(Math.random() * 4) + 1,
        bathrooms: Math.floor(Math.random() * 2) + 1,
        address: 'Lisboa, Portugal',
        images: [
          `https://via.placeholder.com/800x600?text=Idealista+${id}`,
        ],
        agency: Math.random() > 0.5 ? 'RE/MAX' : undefined,
        published_at: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
        raw_data: { source: 'idealista-mock' },
      });
    }

    return listings;
  }
}

// Estrutura para scraping real (futuro)
/*
export class IdealistaScraperReal extends IdealistaConnector {
  async search(params: any): Promise<PropertyListing[]> {
    // 1. Construir URL com filtros
    const url = this.buildSearchUrl(params);
    
    // 2. Fazer request com puppeteer ou cheerio
    const html = await fetch(url, {
      headers: this.config.headers,
    }).then(r => r.text());
    
    // 3. Parse HTML e extrair dados
    const $ = cheerio.load(html);
    const listings: PropertyListing[] = [];
    
    $('.item').each((i, elem) => {
      const rawData = this.extractDataFromElement($, elem);
      listings.push(this.normalize(rawData));
    });
    
    return listings;
  }
  
  private buildSearchUrl(params: any): string {
    // Construir URL do Idealista com parâmetros
    // Exemplo: /comprar-casas/lisboa/com-preco-min_200000,preco-max_500000/
    return `${this.config.baseUrl}/comprar-casas/${params.location || 'lisboa'}/`;
  }
  
  private extractDataFromElement($: CheerioAPI, elem: Element): any {
    // Extrair dados do elemento HTML
    return {
      id: $(elem).attr('data-adid'),
      title: $(elem).find('.item-title').text(),
      price: $(elem).find('.item-price').text(),
      // ... etc
    };
  }
}
*/
