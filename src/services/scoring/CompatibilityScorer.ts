/**
 * CompatibilityScorer - Calcula score de compatibilidade entre propriedade e preferências do usuário
 * 
 * Score baseado em:
 * - Localização (0-30 pontos): Proximidade com áreas preferidas
 * - Preço (0-25 pontos): Alinhamento com orçamento
 * - Tipo (0-15 pontos): Correspondência com tipo desejado
 * - Características (0-30 pontos): Match de features e especificações
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import { UserPreferences, CompatibilityScore } from '../../types/scoring';

export class CompatibilityScorer {
  /**
   * Calcula score de compatibilidade total
   */
  calculate(
    property: PropertyCanonicalModel,
    preferences: UserPreferences
  ): CompatibilityScore {
    const locationScore = this.calculateLocationScore(property, preferences);
    const priceScore = this.calculatePriceScore(property, preferences);
    const typeScore = this.calculateTypeScore(property, preferences);
    const characteristicsScore = this.calculateCharacteristicsScore(property, preferences);

    const total = locationScore + priceScore + typeScore + characteristicsScore;
    const reasons = this.generateReasons(
      property,
      preferences,
      { locationScore, priceScore, typeScore, characteristicsScore }
    );

    return {
      total,
      breakdown: {
        location: locationScore,
        price: priceScore,
        type: typeScore,
        characteristics: characteristicsScore,
      },
      reasons,
    };
  }

  /**
   * Calcula score de localização (0-30 pontos)
   */
  private calculateLocationScore(
    property: PropertyCanonicalModel,
    preferences: UserPreferences
  ): number {
    let score = 0;
    const maxScore = 30;

    if (!preferences.location) {
      return maxScore * 0.5; // Score neutro se não há preferência
    }

    // Verifica concelho preferido (15 pontos)
    if (preferences.location.preferredConcelhos?.length) {
      if (preferences.location.preferredConcelhos.includes(property.location.address.concelho)) {
        score += 15;
      }
    } else {
      score += 7.5; // Meio score se não há preferência específica
    }

    // Verifica distrito preferido (10 pontos)
    if (preferences.location.preferredDistritos?.length) {
      if (preferences.location.preferredDistritos.includes(property.location.address.distrito)) {
        score += 10;
      }
    } else {
      score += 5; // Meio score se não há preferência específica
    }

    // Verifica distância se houver coordenadas (5 pontos)
    if (
      preferences.location.coordinates &&
      property.location.coordinates &&
      preferences.location.maxDistanceKm
    ) {
      const distance = this.calculateDistance(
        preferences.location.coordinates.latitude,
        preferences.location.coordinates.longitude,
        property.location.coordinates.latitude,
        property.location.coordinates.longitude
      );

      const distanceKm = distance / 1000;
      if (distanceKm <= preferences.location.maxDistanceKm) {
        // Score decrescente com distância
        const distanceScore = 5 * (1 - distanceKm / preferences.location.maxDistanceKm);
        score += distanceScore;
      }
    } else {
      score += 2.5; // Meio score se não há coordenadas
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calcula score de preço (0-25 pontos)
   */
  private calculatePriceScore(
    property: PropertyCanonicalModel,
    preferences: UserPreferences
  ): number {
    let score = 0;
    const maxScore = 25;
    const propertyPrice = property.price.value;

    if (!preferences.price) {
      return maxScore * 0.5; // Score neutro se não há preferência
    }

    const { min, max, ideal } = preferences.price;

    // Se tem preço ideal, usa curva gaussiana centrada no ideal
    if (ideal && ideal > 0) {
      const deviation = Math.abs(propertyPrice - ideal);
      const maxDeviation = ideal * 0.5; // 50% de desvio = score 0
      score = maxScore * Math.exp(-Math.pow(deviation / maxDeviation, 2));
    }
    // Senão, usa range min-max
    else if (min !== undefined || max !== undefined) {
      if (min !== undefined && propertyPrice < min) {
        // Abaixo do mínimo: score decrescente
        const deviation = (min - propertyPrice) / min;
        score = maxScore * Math.max(0, 1 - deviation);
      } else if (max !== undefined && propertyPrice > max) {
        // Acima do máximo: score decrescente
        const deviation = (propertyPrice - max) / max;
        score = maxScore * Math.max(0, 1 - deviation);
      } else {
        // Dentro do range: score máximo
        score = maxScore;
      }
    } else {
      score = maxScore * 0.5; // Score neutro
    }

    return Math.min(Math.max(score, 0), maxScore);
  }

  /**
   * Calcula score de tipo (0-15 pontos)
   */
  private calculateTypeScore(
    property: PropertyCanonicalModel,
    preferences: UserPreferences
  ): number {
    const maxScore = 15;

    if (!preferences.propertyTypes || preferences.propertyTypes.length === 0) {
      return maxScore * 0.5; // Score neutro se não há preferência
    }

    // Match direto de tipo
    if (preferences.propertyTypes.includes(property.type)) {
      return maxScore;
    }

    // Match de tipologia (T0, T1, T2, etc.)
    if (
      property.characteristics.typology &&
      preferences.propertyTypes.includes(property.characteristics.typology)
    ) {
      return maxScore;
    }

    return 0;
  }

  /**
   * Calcula score de características (0-30 pontos)
   */
  private calculateCharacteristicsScore(
    property: PropertyCanonicalModel,
    preferences: UserPreferences
  ): number {
    let score = 0;
    const maxScore = 30;

    if (!preferences.characteristics) {
      return maxScore * 0.5; // Score neutro se não há preferência
    }

    const chars = property.characteristics;
    const prefs = preferences.characteristics;

    // Quartos (8 pontos)
    if (prefs.minBedrooms !== undefined || prefs.maxBedrooms !== undefined) {
      if (chars.bedrooms !== undefined) {
        const meetsMin = !prefs.minBedrooms || chars.bedrooms >= prefs.minBedrooms;
        const meetsMax = !prefs.maxBedrooms || chars.bedrooms <= prefs.maxBedrooms;
        
        if (meetsMin && meetsMax) {
          score += 8;
        } else if (meetsMin || meetsMax) {
          score += 4;
        }
      } else {
        score += 4; // Score neutro se não há informação
      }
    } else {
      score += 4;
    }

    // Casas de banho (5 pontos)
    if (prefs.minBathrooms !== undefined) {
      if (chars.bathrooms !== undefined) {
        if (chars.bathrooms >= prefs.minBathrooms) {
          score += 5;
        } else {
          score += 2;
        }
      } else {
        score += 2.5;
      }
    } else {
      score += 2.5;
    }

    // Área (7 pontos)
    if (prefs.minArea !== undefined || prefs.maxArea !== undefined) {
      const area = chars.totalArea || chars.usefulArea;
      if (area !== undefined) {
        const meetsMin = !prefs.minArea || area >= prefs.minArea;
        const meetsMax = !prefs.maxArea || area <= prefs.maxArea;
        
        if (meetsMin && meetsMax) {
          score += 7;
        } else if (meetsMin || meetsMax) {
          score += 3.5;
        }
      } else {
        score += 3.5;
      }
    } else {
      score += 3.5;
    }

    // Features obrigatórias (10 pontos)
    if (prefs.requiredFeatures && prefs.requiredFeatures.length > 0) {
      const propertyFeatures = chars.features || {};
      const requiredCount = prefs.requiredFeatures.length;
      let matchedCount = 0;

      for (const feature of prefs.requiredFeatures) {
        if (propertyFeatures[feature as keyof typeof propertyFeatures]) {
          matchedCount++;
        }
      }

      score += (matchedCount / requiredCount) * 10;
    } else {
      score += 5;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Gera razões explicativas do score
   */
  private generateReasons(
    property: PropertyCanonicalModel,
    preferences: UserPreferences,
    scores: {
      locationScore: number;
      priceScore: number;
      typeScore: number;
      characteristicsScore: number;
    }
  ): string[] {
    const reasons: string[] = [];

    // Localização
    if (scores.locationScore > 20) {
      reasons.push(`Localização excelente: ${property.location.address.concelho}, ${property.location.address.distrito}`);
    } else if (scores.locationScore > 15) {
      reasons.push(`Boa localização em ${property.location.address.concelho}`);
    } else if (scores.locationScore < 10) {
      reasons.push(`Localização fora das áreas preferidas`);
    }

    // Preço
    if (scores.priceScore > 20) {
      reasons.push(`Preço muito alinhado com seu orçamento (€${property.price.value.toLocaleString('pt-PT')})`);
    } else if (scores.priceScore > 15) {
      reasons.push(`Preço dentro da faixa aceitável`);
    } else if (scores.priceScore < 10) {
      if (preferences.price?.max && property.price.value > preferences.price.max) {
        reasons.push(`Preço acima do orçamento desejado`);
      } else {
        reasons.push(`Preço não alinhado com preferências`);
      }
    }

    // Tipo
    if (scores.typeScore >= 15) {
      reasons.push(`Tipo de imóvel corresponde exatamente ao desejado (${property.type})`);
    } else if (scores.typeScore === 0) {
      reasons.push(`Tipo de imóvel diferente das preferências`);
    }

    // Características
    if (scores.characteristicsScore > 24) {
      reasons.push(`Características ideais: ${property.characteristics.bedrooms || 0} quartos, ${property.characteristics.totalArea || 0}m²`);
    } else if (scores.characteristicsScore > 18) {
      reasons.push(`Boas características gerais`);
    } else if (scores.characteristicsScore < 12) {
      reasons.push(`Algumas características não correspondem às preferências`);
    }

    return reasons.slice(0, 5); // Limita a 5 razões
  }

  /**
   * Calcula distância entre coordenadas (em metros)
   * Fórmula de Haversine
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
