import { Property } from '@/types/busca-ia';

interface NormalizedAddress {
  freguesia: string;
  concelho: string;
  distrito: string;
  lat: number;
  lon: number;
  geohash: string;
}

/**
 * Serviço de normalização de dados de imóveis
 */
export class NormalizationService {
  /**
   * Normaliza a tipologia do imóvel
   */
  normalizeTypology(text: string): 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5+' {
    const normalized = text.toLowerCase().replace(/\s+/g, '');
    
    if (normalized.includes('t0') || normalized.includes('studio') || normalized.includes('estúdio')) {
      return 'T0';
    }
    if (normalized.includes('t1') || normalized.includes('1quarto')) {
      return 'T1';
    }
    if (normalized.includes('t2') || normalized.includes('2quartos')) {
      return 'T2';
    }
    if (normalized.includes('t3') || normalized.includes('3quartos')) {
      return 'T3';
    }
    if (normalized.includes('t4') || normalized.includes('4quartos')) {
      return 'T4';
    }
    if (normalized.includes('t5') || normalized.includes('t6') || normalized.includes('5quartos')) {
      return 'T5+';
    }
    
    // Fallback: try to extract number
    const match = text.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num === 0) return 'T0';
      if (num === 1) return 'T1';
      if (num === 2) return 'T2';
      if (num === 3) return 'T3';
      if (num === 4) return 'T4';
      if (num >= 5) return 'T5+';
    }
    
    return 'T2'; // default
  }

  /**
   * Normaliza a área em m²
   */
  normalizeArea(value: string | number): number {
    if (typeof value === 'number') return value;
    
    const cleaned = value.replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Extrai características do imóvel da descrição
   */
  normalizeFeatures(description: string): Array<{ type: string; value: boolean | string | number }> {
    const features: Array<{ type: string; value: boolean | string | number }> = [];
    const lowerDesc = description.toLowerCase();

    // Garagem
    if (lowerDesc.includes('garagem') || lowerDesc.includes('parking')) {
      features.push({ type: 'garage', value: true });
    }

    // Elevador
    if (lowerDesc.includes('elevador') || lowerDesc.includes('lift')) {
      features.push({ type: 'elevator', value: true });
    }

    // Varanda
    if (lowerDesc.includes('varanda') || lowerDesc.includes('balcony')) {
      features.push({ type: 'balcony', value: true });
    }

    // Terraço
    if (lowerDesc.includes('terraço') || lowerDesc.includes('terrace')) {
      features.push({ type: 'terrace', value: true });
    }

    // Piscina
    if (lowerDesc.includes('piscina') || lowerDesc.includes('pool')) {
      features.push({ type: 'pool', value: true });
    }

    // Jardim
    if (lowerDesc.includes('jardim') || lowerDesc.includes('garden')) {
      features.push({ type: 'garden', value: true });
    }

    // Ar condicionado
    if (lowerDesc.includes('ar condicionado') || lowerDesc.includes('a/c') || lowerDesc.includes('ac')) {
      features.push({ type: 'air_conditioning', value: true });
    }

    // Aquecimento central
    if (lowerDesc.includes('aquecimento central') || lowerDesc.includes('central heating')) {
      features.push({ type: 'central_heating', value: true });
    }

    return features;
  }

  /**
   * Geocodifica um endereço (mock para MVP)
   */
  geocode(address: string): NormalizedAddress {
    // Mock geocoding - em produção usar API real
    const mockCoordinates: Record<string, { lat: number; lon: number; distrito: string }> = {
      'lisboa': { lat: 38.7223, lon: -9.1393, distrito: 'Lisboa' },
      'porto': { lat: 41.1579, lon: -8.6291, distrito: 'Porto' },
      'cascais': { lat: 38.6979, lon: -9.4215, distrito: 'Lisboa' },
      'sintra': { lat: 38.8029, lon: -9.3817, distrito: 'Lisboa' },
      'oeiras': { lat: 38.6922, lon: -9.3108, distrito: 'Lisboa' },
      'braga': { lat: 41.5454, lon: -8.4265, distrito: 'Braga' },
      'coimbra': { lat: 40.2033, lon: -8.4103, distrito: 'Coimbra' },
      'faro': { lat: 37.0194, lon: -7.9322, distrito: 'Faro' },
    };

    const lowerAddress = address.toLowerCase();
    let coords = mockCoordinates['lisboa']; // default
    let concelho = 'Lisboa';

    for (const [city, data] of Object.entries(mockCoordinates)) {
      if (lowerAddress.includes(city)) {
        coords = data;
        concelho = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    return {
      freguesia: this.extractFreguesia(address) || concelho,
      concelho,
      distrito: coords.distrito,
      lat: coords.lat + (Math.random() - 0.5) * 0.01, // Add slight variation
      lon: coords.lon + (Math.random() - 0.5) * 0.01,
      geohash: this.generateGeohash(coords.lat, coords.lon),
    };
  }

  /**
   * Extrai freguesia do endereço
   */
  private extractFreguesia(address: string): string | null {
    // Mock - em produção usar dados reais de freguesias
    const freguesias = [
      'Alvalade', 'Areeiro', 'Arroios', 'Avenidas Novas', 'Beato',
      'Belém', 'Benfica', 'Campo de Ourique', 'Campolide', 'Carnide',
      'Estrela', 'Lumiar', 'Marvila', 'Misericórdia', 'Olivais',
      'Parque das Nações', 'Penha de França', 'Santa Clara', 'Santa Maria Maior',
      'Santo António', 'São Domingos de Benfica', 'São Vicente'
    ];

    for (const freguesia of freguesias) {
      if (address.toLowerCase().includes(freguesia.toLowerCase())) {
        return freguesia;
      }
    }

    return null;
  }

  /**
   * Gera geohash simplificado
   */
  private generateGeohash(lat: number, lon: number): string {
    // Simplified geohash generation for MVP
    const latStr = Math.floor(lat * 1000).toString(36);
    const lonStr = Math.floor(lon * 1000).toString(36);
    return `${latStr}${lonStr}`.substring(0, 12);
  }

  /**
   * Calcula score de qualidade do anúncio
   */
  calculateQualityScore(property: Partial<Property>): number {
    let score = 0;
    let maxScore = 0;

    // Título e descrição
    maxScore += 20;
    if (property.features && property.features.length > 0) score += 20;

    // Localização
    maxScore += 20;
    if (property.lat && property.lon) score += 20;

    // Preço
    maxScore += 15;
    if (property.price_main && property.price_main > 0) score += 15;

    // Área
    maxScore += 15;
    if (property.area_m2 && property.area_m2 > 0) score += 15;

    // Características
    maxScore += 15;
    if (property.features && property.features.length >= 3) score += 15;
    else if (property.features && property.features.length > 0) score += 7;

    // Multi-fonte
    maxScore += 15;
    if (property.portal_count && property.portal_count >= 2) score += 15;
    else if (property.portal_count && property.portal_count > 0) score += 7;

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Gera embedding mock (em produção usar Gemini Embeddings)
   */
  generateEmbedding(description: string): number[] {
    // Mock embedding - em produção usar API real
    const embedding: number[] = [];
    for (let i = 0; i < 768; i++) {
      embedding.push(Math.random() * 2 - 1);
    }
    return embedding;
  }
}

export const normalizationService = new NormalizationService();
