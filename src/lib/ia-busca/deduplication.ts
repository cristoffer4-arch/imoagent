import { Property } from '@/types/busca-ia';

/**
 * Motor de deduplicação de imóveis
 * 
 * Identifica imóveis duplicados através de múltiplas técnicas:
 * - Localização geográfica (geohash)
 * - Similaridade de características (tipologia, área, preço)
 * - Hash de imagens (phash)
 * - Embeddings de texto
 */

export class DeduplicationEngine {
  /**
   * Encontra candidatos a duplicação
   */
  findCandidates(property: Property, allProperties: Property[]): Property[] {
    const candidates: Property[] = [];

    for (const candidate of allProperties) {
      if (candidate.id === property.id) continue;

      // Filtro 1: Mesma localização geral (concelho)
      if (candidate.concelho !== property.concelho) continue;

      // Filtro 2: Tipologia similar ou mesma
      if (candidate.typology !== property.typology) continue;

      // Filtro 3: Área similar (±20%)
      const areaDiff = Math.abs(candidate.area_m2 - property.area_m2);
      const areaThreshold = property.area_m2 * 0.2;
      if (areaDiff > areaThreshold) continue;

      // Filtro 4: Preço similar (±30%)
      const priceDiff = Math.abs(candidate.price_main - property.price_main);
      const priceThreshold = property.price_main * 0.3;
      if (priceDiff > priceThreshold) continue;

      candidates.push(candidate);
    }

    return candidates;
  }

  /**
   * Calcula probabilidade de match entre duas propriedades
   */
  calculateMatchProbability(prop1: Property, prop2: Property): number {
    let totalScore = 0;
    let maxScore = 0;

    // 1. Distância geográfica (peso: 30%)
    maxScore += 30;
    const geoScore = this.calculateGeoScore(
      prop1.lat,
      prop1.lon,
      prop2.lat,
      prop2.lon
    );
    totalScore += geoScore * 0.3;

    // 2. Similaridade de características (peso: 25%)
    maxScore += 25;
    const featureScore = this.calculateFeatureScore(prop1, prop2);
    totalScore += featureScore * 0.25;

    // 3. Preço similar (peso: 20%)
    maxScore += 20;
    const priceScore = this.calculatePriceScore(
      prop1.price_main,
      prop2.price_main
    );
    totalScore += priceScore * 0.2;

    // 4. Área similar (peso: 15%)
    maxScore += 15;
    const areaScore = this.calculateAreaScore(prop1.area_m2, prop2.area_m2);
    totalScore += areaScore * 0.15;

    // 5. Tipologia exata (peso: 10%)
    maxScore += 10;
    const typologyScore = prop1.typology === prop2.typology ? 100 : 0;
    totalScore += typologyScore * 0.1;

    // totalScore is already a percentage (0-100), normalize to 0-1
    return Math.min(totalScore / 100, 1);
  }

  /**
   * Decide se deve fazer merge automático, pedir revisão ou não fazer nada
   */
  shouldMerge(probability: number): 'auto' | 'review' | 'no' {
    if (probability >= 0.9) return 'auto'; // Alta confiança
    if (probability >= 0.7) return 'review'; // Média confiança, revisar manualmente
    return 'no'; // Baixa confiança, não merge
  }

  /**
   * Faz merge de duas propriedades em uma única entidade
   */
  mergeProperties(prop1: Property, prop2: Property): Property {
    return {
      ...prop1,
      // Usar o ID mais antigo
      id: prop1.first_seen < prop2.first_seen ? prop1.id : prop2.id,
      // Agregar fontes
      sources: [...prop1.sources, ...prop2.sources],
      portal_count: prop1.portal_count + prop2.portal_count,
      // Usar preço médio ponderado
      price_main: (prop1.price_main + prop2.price_main) / 2,
      price_min: Math.min(prop1.price_min, prop2.price_min),
      price_max: Math.max(prop1.price_max, prop2.price_max),
      price_divergence_pct: this.calculateDivergence(
        Math.min(prop1.price_min, prop2.price_min),
        Math.max(prop1.price_max, prop2.price_max)
      ),
      // Agregar características únicas
      features: this.mergeFeatures(prop1.features, prop2.features),
      // Usar a data mais antiga
      first_seen:
        prop1.first_seen < prop2.first_seen
          ? prop1.first_seen
          : prop2.first_seen,
      // Usar a data mais recente
      last_seen:
        prop1.last_seen > prop2.last_seen ? prop1.last_seen : prop2.last_seen,
      // Agregar eventos
      events: [...prop1.events, ...prop2.events].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      updated_at: new Date().toISOString(),
    };
  }

  // Helper methods

  private calculateGeoScore(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const distance = this.haversineDistance(lat1, lon1, lat2, lon2);
    
    // Menos de 50m = 100%
    // 50-100m = 80%
    // 100-200m = 50%
    // >200m = 0%
    if (distance < 0.05) return 100;
    if (distance < 0.1) return 80;
    if (distance < 0.2) return 50;
    return 0;
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateFeatureScore(prop1: Property, prop2: Property): number {
    const features1 = new Set(prop1.features.map((f) => f.type));
    const features2 = new Set(prop2.features.map((f) => f.type));

    const intersection = new Set(
      [...features1].filter((x) => features2.has(x))
    );
    const union = new Set([...features1, ...features2]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  private calculatePriceScore(price1: number, price2: number): number {
    const diff = Math.abs(price1 - price2);
    const avg = (price1 + price2) / 2;
    const diffPct = (diff / avg) * 100;

    // 0-5% = 100%, 5-10% = 70%, 10-20% = 40%, >20% = 0%
    if (diffPct <= 5) return 100;
    if (diffPct <= 10) return 70;
    if (diffPct <= 20) return 40;
    return 0;
  }

  private calculateAreaScore(area1: number, area2: number): number {
    const diff = Math.abs(area1 - area2);
    const avg = (area1 + area2) / 2;
    const diffPct = (diff / avg) * 100;

    // 0-5% = 100%, 5-10% = 80%, 10-20% = 50%, >20% = 0%
    if (diffPct <= 5) return 100;
    if (diffPct <= 10) return 80;
    if (diffPct <= 20) return 50;
    return 0;
  }

  private calculateDivergence(min: number, max: number): number {
    if (min === 0) return 0;
    return ((max - min) / min) * 100;
  }

  private mergeFeatures(
    features1: Property['features'],
    features2: Property['features']
  ): Property['features'] {
    const featureMap = new Map<string, Property['features'][0]>();

    for (const feature of features1) {
      featureMap.set(feature.type, feature);
    }

    for (const feature of features2) {
      if (!featureMap.has(feature.type)) {
        featureMap.set(feature.type, feature);
      }
    }

    return Array.from(featureMap.values());
  }
}

export const deduplicationEngine = new DeduplicationEngine();
