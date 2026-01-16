/**
 * ScoringService - Serviço de cálculo de scores de propriedades
 * 
 * Implementa a fórmula:
 * ScoreFinal = (0.4 * ScoreCompatibilidade) + (0.3 * ScoreComportamento) + (0.3 * ScoreTemporal)
 */

import {
  PropertyScore,
  AngariacaoScore,
  VendaScore,
  ScoringContext,
  ScoringWeights,
  ScoringInput,
  ScoringOutput,
  BatchScoringResult,
  CompatibilityScoreComponents,
  BehaviorScoreComponents,
  TemporalScoreComponents,
} from '../../types/scoring';
import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';

/**
 * Pesos padrão para scoring
 */
const DEFAULT_WEIGHTS: ScoringWeights = {
  compatibility: 0.4,
  behavior: 0.3,
  temporal: 0.3,
};

/**
 * Serviço de Scoring
 */
export class ScoringService {
  private cache: Map<string, PropertyScore>;
  private cacheEnabled: boolean;
  private cacheTTL: number;

  constructor(cacheEnabled: boolean = true, cacheTTLSeconds: number = 300) {
    this.cache = new Map();
    this.cacheEnabled = cacheEnabled;
    this.cacheTTL = cacheTTLSeconds * 1000; // Convert to ms
  }

  /**
   * Calcula score de uma propriedade
   */
  calculateScore(
    property: PropertyCanonicalModel,
    context: ScoringContext
  ): PropertyScore | AngariacaoScore | VendaScore {
    // Verifica cache
    const cacheKey = this.getCacheKey(property.id, context);
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Calcula score baseado no modo
    const score = context.mode === 'ANGARIACAO'
      ? this.calculateAngariacaoScore(property, context)
      : this.calculateVendaScore(property, context);

    // Armazena no cache
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, score);
      // Remove do cache após TTL
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
    }

    return score;
  }

  /**
   * Calcula score em lote
   */
  async calculateBatch(inputs: ScoringInput[]): Promise<BatchScoringResult> {
    const startTime = Date.now();
    const scores = new Map<string, PropertyScore>();
    let totalFailed = 0;
    let totalScore = 0;

    for (const input of inputs) {
      try {
        const score = this.calculateScore(input.property, input.context);
        scores.set(input.property.id, score);
        totalScore += score.finalScore;
      } catch (error) {
        console.error(`Failed to score property ${input.property.id}:`, error);
        totalFailed++;
      }
    }

    const totalProcessed = scores.size;
    const averageScore = totalProcessed > 0 ? totalScore / totalProcessed : 0;
    const executionTimeMs = Date.now() - startTime;

    return {
      scores,
      totalProcessed,
      totalFailed,
      averageScore,
      executionTimeMs,
    };
  }

  /**
   * Calcula score de Angariação
   */
  private calculateAngariacaoScore(
    property: PropertyCanonicalModel,
    context: ScoringContext
  ): AngariacaoScore {
    // Pesos (podem ser customizados)
    const weights = context.weights || DEFAULT_WEIGHTS;

    // Calcula componentes
    const compatibility = this.calculateCompatibilityScore(property, context);
    const behavior = this.calculateBehaviorScore(property, context);
    const temporal = this.calculateTemporalScore(property, context);

    // Calcula score final
    const finalScore = Math.min(
      100,
      Math.max(
        0,
        weights.compatibility * compatibility.subtotal +
        weights.behavior * behavior.subtotal +
        weights.temporal * temporal.subtotal
      )
    );

    // Componentes específicos de angariação
    const portalCount = property.metadata.portalCount || 1;
    const priceDivergence = property.price.priceRange?.divergencePercentage || 0;

    const angariacao = {
      // Recência (0-40 pts) - Imóveis recém-publicados
      recencyScore: this.calculateRecencyScore(property, 40),
      
      // Multi-portal (0-30 pts)
      multiPortalScore: Math.min(30, (portalCount - 1) * 10), // +10 pts por portal adicional
      portalCount,
      
      // Divergência de preço (0-30 pts)
      priceDivergenceScore: Math.min(30, priceDivergence * 3), // Até 10% divergência = 30 pts
      priceDivergencePercentage: priceDivergence,
    };

    // Razões principais
    const topReasons = this.extractTopReasons(compatibility, behavior, temporal, context);

    return {
      finalScore,
      compatibilityScore: compatibility.subtotal,
      behaviorScore: behavior.subtotal,
      temporalScore: temporal.subtotal,
      components: { compatibility, behavior, temporal },
      topReasons,
      confidence: this.calculateConfidence(property),
      calculatedAt: new Date(),
      version: '1.0',
      angariacao,
    };
  }

  /**
   * Calcula score de Venda
   */
  private calculateVendaScore(
    property: PropertyCanonicalModel,
    context: ScoringContext
  ): VendaScore {
    const weights = context.weights || DEFAULT_WEIGHTS;

    const compatibility = this.calculateCompatibilityScore(property, context);
    const behavior = this.calculateBehaviorScore(property, context);
    const temporal = this.calculateTemporalScore(property, context);

    const finalScore = Math.min(
      100,
      Math.max(
        0,
        weights.compatibility * compatibility.subtotal +
        weights.behavior * behavior.subtotal +
        weights.temporal * temporal.subtotal
      )
    );

    // Componentes específicos de venda
    const availabilityProbability = property.aiScores?.availabilityProbability || 0.5;
    const portalCount = property.metadata.portalCount || 1;
    const daysSinceUpdate = this.calculateDaysSince(property.updatedAt);

    const venda = {
      // Disponibilidade (0-40 pts)
      availabilityScore: availabilityProbability * 40,
      availabilityProbability,
      
      // Recência de atualização (0-30 pts)
      updateRecencyScore: this.calculateUpdateRecencyScore(daysSinceUpdate, 30),
      daysSinceUpdate,
      
      // Visibilidade (0-30 pts)
      visibilityScore: Math.min(30, portalCount * 10), // +10 pts por portal
      portalCount,
    };

    const topReasons = this.extractTopReasons(compatibility, behavior, temporal, context);

    return {
      finalScore,
      compatibilityScore: compatibility.subtotal,
      behaviorScore: behavior.subtotal,
      temporalScore: temporal.subtotal,
      components: { compatibility, behavior, temporal },
      topReasons,
      confidence: this.calculateConfidence(property),
      calculatedAt: new Date(),
      version: '1.0',
      venda,
    };
  }

  /**
   * Calcula Score de Compatibilidade (0-100)
   */
  private calculateCompatibilityScore(
    property: PropertyCanonicalModel,
    context: ScoringContext
  ): CompatibilityScoreComponents {
    const filters = context.filters || {};

    // Tipo de propriedade (0-25 pts)
    const typeMatch = this.calculateTypeMatch(property, filters.propertyType);
    
    // Localização (0-25 pts)
    const locationMatch = this.calculateLocationMatch(property, filters.location);
    
    // Preço (0-25 pts)
    const priceMatch = this.calculatePriceMatch(property, filters.priceRange);
    
    // Área (0-25 pts)
    const areaMatch = this.calculateAreaMatch(property, filters.areaRange);

    const subtotal = typeMatch.score + locationMatch.score + priceMatch.score + areaMatch.score;

    return {
      typeMatch: typeMatch.score,
      typeMatchReason: typeMatch.reason,
      locationMatch: locationMatch.score,
      locationMatchReason: locationMatch.reason,
      priceMatch: priceMatch.score,
      priceMatchReason: priceMatch.reason,
      areaMatch: areaMatch.score,
      areaMatchReason: areaMatch.reason,
      subtotal,
    };
  }

  /**
   * Calcula Score de Comportamento (0-100)
   */
  private calculateBehaviorScore(
    property: PropertyCanonicalModel,
    context: ScoringContext
  ): BehaviorScoreComponents {
    // Histórico de interações (0-40 pts)
    const interactionHistory = this.calculateInteractionScore(property, context);
    
    // Padrões de busca (0-30 pts)
    const searchPatterns = this.calculateSearchPatternsScore(property, context);
    
    // Preferências do usuário (0-30 pts)
    const userPreferences = this.calculateUserPreferencesScore(property, context);

    const subtotal = interactionHistory.score + searchPatterns.score + userPreferences.score;

    return {
      interactionHistory: interactionHistory.score,
      interactionReason: interactionHistory.reason,
      searchPatterns: searchPatterns.score,
      searchPatternsReason: searchPatterns.reason,
      userPreferences: userPreferences.score,
      userPreferencesReason: userPreferences.reason,
      subtotal,
    };
  }

  /**
   * Calcula Score Temporal (0-100)
   */
  private calculateTemporalScore(
    property: PropertyCanonicalModel,
    context: ScoringContext
  ): TemporalScoreComponents {
    // Recência (0-40 pts)
    const recency = this.calculateRecencyComponent(property);
    
    // Urgência (0-30 pts)
    const urgency = this.calculateUrgencyComponent(property);
    
    // Sazonalidade (0-30 pts)
    const seasonality = this.calculateSeasonalityComponent(property);

    const subtotal = recency.score + urgency.score + seasonality.score;

    return {
      recency: recency.score,
      recencyReason: recency.reason,
      urgency: urgency.score,
      urgencyReason: urgency.reason,
      seasonality: seasonality.score,
      seasonalityReason: seasonality.reason,
      subtotal,
    };
  }

  // ========================================
  // Métodos auxiliares de cálculo
  // ========================================

  private calculateTypeMatch(property: PropertyCanonicalModel, types?: string[]) {
    if (!types || types.length === 0) {
      return { score: 25, reason: 'Sem filtro de tipo' };
    }
    
    const matches = types.includes(property.type);
    return {
      score: matches ? 25 : 0,
      reason: matches ? 'Tipo corresponde' : 'Tipo não corresponde',
    };
  }

  private calculateLocationMatch(property: PropertyCanonicalModel, location?: any) {
    if (!location) {
      return { score: 25, reason: 'Sem filtro de localização' };
    }

    let score = 0;
    const reasons = [];

    if (location.distrito && property.location.address.distrito === location.distrito) {
      score += 10;
      reasons.push('Distrito correto');
    }
    if (location.concelho && property.location.address.concelho === location.concelho) {
      score += 10;
      reasons.push('Concelho correto');
    }
    if (location.freguesia && property.location.address.freguesia === location.freguesia) {
      score += 5;
      reasons.push('Freguesia correta');
    }

    return {
      score: Math.min(25, score),
      reason: reasons.length > 0 ? reasons.join(', ') : 'Localização não corresponde',
    };
  }

  private calculatePriceMatch(property: PropertyCanonicalModel, priceRange?: any) {
    if (!priceRange || (!priceRange.min && !priceRange.max)) {
      return { score: 25, reason: 'Sem filtro de preço' };
    }

    const price = property.price.value;
    const min = priceRange.min || 0;
    const max = priceRange.max || Infinity;

    if (price >= min && price <= max) {
      return { score: 25, reason: 'Preço dentro do intervalo' };
    }

    // Penaliza baseado na distância do intervalo
    const distance = price < min ? min - price : price - max;
    const penalty = Math.min(25, (distance / price) * 100);
    
    return {
      score: Math.max(0, 25 - penalty),
      reason: price < min ? 'Preço abaixo do mínimo' : 'Preço acima do máximo',
    };
  }

  private calculateAreaMatch(property: PropertyCanonicalModel, areaRange?: any) {
    if (!areaRange || (!areaRange.min && !areaRange.max)) {
      return { score: 25, reason: 'Sem filtro de área' };
    }

    const area = property.characteristics.totalArea || 0;
    const min = areaRange.min || 0;
    const max = areaRange.max || Infinity;

    if (area >= min && area <= max) {
      return { score: 25, reason: 'Área dentro do intervalo' };
    }

    const distance = area < min ? min - area : area - max;
    const penalty = Math.min(25, (distance / area) * 100);
    
    return {
      score: Math.max(0, 25 - penalty),
      reason: area < min ? 'Área abaixo do mínimo' : 'Área acima do máximo',
    };
  }

  private calculateInteractionScore(property: PropertyCanonicalModel, context: ScoringContext) {
    // Se não há histórico, retorna score neutro
    if (!context.userHistory || context.userHistory.searches.length === 0) {
      return { score: 20, reason: 'Sem histórico de interações' };
    }

    // Implementação simplificada - em produção, analisar histórico detalhado
    return { score: 20, reason: 'Score baseado em histórico' };
  }

  private calculateSearchPatternsScore(property: PropertyCanonicalModel, context: ScoringContext) {
    // Implementação simplificada
    return { score: 15, reason: 'Score baseado em padrões' };
  }

  private calculateUserPreferencesScore(property: PropertyCanonicalModel, context: ScoringContext) {
    if (!context.userPreferences) {
      return { score: 15, reason: 'Sem preferências do usuário' };
    }

    let score = 0;
    const reasons = [];

    // Verifica distrito favorito
    if (context.userPreferences.favoriteDistritos?.includes(property.location.address.distrito)) {
      score += 10;
      reasons.push('Distrito favorito');
    }

    // Verifica tipo preferido
    if (context.userPreferences.preferredPropertyTypes?.includes(property.type)) {
      score += 5;
      reasons.push('Tipo preferido');
    }

    return {
      score: Math.min(30, score),
      reason: reasons.length > 0 ? reasons.join(', ') : 'Sem match com preferências',
    };
  }

  private calculateRecencyComponent(property: PropertyCanonicalModel) {
    const daysSinceFirst = this.calculateDaysSince(property.metadata.firstSeen);
    const score = this.calculateRecencyScore(property, 40);
    
    return {
      score,
      reason: daysSinceFirst <= 7 ? 'Muito recente' : daysSinceFirst <= 30 ? 'Recente' : 'Antigo',
    };
  }

  private calculateUrgencyComponent(property: PropertyCanonicalModel) {
    // Baseado em eventos de mercado e mudanças
    const hasRecentPriceDrop = property.metadata.sources.some(s => 
      s.type === 'PORTAL' && s.name.includes('drop')
    );
    
    const score = hasRecentPriceDrop ? 30 : 15;
    
    return {
      score,
      reason: hasRecentPriceDrop ? 'Redução de preço recente' : 'Sem urgência especial',
    };
  }

  private calculateSeasonalityComponent(property: PropertyCanonicalModel) {
    const month = new Date().getMonth(); // 0-11
    // Primavera/Verão = alta temporada imobiliária em Portugal
    const isHighSeason = month >= 2 && month <= 8; // Mar-Set
    
    return {
      score: isHighSeason ? 30 : 20,
      reason: isHighSeason ? 'Alta temporada' : 'Baixa temporada',
    };
  }

  private calculateRecencyScore(property: PropertyCanonicalModel, maxPoints: number): number {
    const daysSince = this.calculateDaysSince(property.metadata.firstSeen);
    
    // 0-7 dias = 100%
    // 8-30 dias = 50%
    // 31+ dias = 25%
    if (daysSince <= 7) return maxPoints;
    if (daysSince <= 30) return maxPoints * 0.5;
    return maxPoints * 0.25;
  }

  private calculateUpdateRecencyScore(daysSince: number, maxPoints: number): number {
    if (daysSince <= 7) return maxPoints;
    if (daysSince <= 30) return maxPoints * 0.7;
    if (daysSince <= 90) return maxPoints * 0.4;
    return maxPoints * 0.2;
  }

  private calculateDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private calculateConfidence(property: PropertyCanonicalModel): number {
    // Confiança baseada na qualidade dos dados
    let confidence = 0.5; // Base

    if (property.location.coordinates) confidence += 0.1;
    if (property.metadata.portalCount && property.metadata.portalCount > 1) confidence += 0.1;
    if (property.images && property.images.length > 0) confidence += 0.1;
    if (property.characteristics.totalArea) confidence += 0.1;
    if (property.metadata.dataQuality === 'HIGH') confidence += 0.1;

    return Math.min(1, confidence);
  }

  private extractTopReasons(
    compatibility: CompatibilityScoreComponents,
    behavior: BehaviorScoreComponents,
    temporal: TemporalScoreComponents,
    context: ScoringContext
  ): string[] {
    const reasons = [];

    // Adiciona razões de compatibilidade
    if (compatibility.typeMatch > 20) reasons.push(compatibility.typeMatchReason);
    if (compatibility.locationMatch > 20) reasons.push(compatibility.locationMatchReason);
    if (compatibility.priceMatch > 20) reasons.push(compatibility.priceMatchReason);

    // Adiciona razões temporais
    if (temporal.recency > 30) reasons.push(temporal.recencyReason);
    if (temporal.urgency > 20) reasons.push(temporal.urgencyReason);

    return reasons.slice(0, 3); // Top 3
  }

  private getCacheKey(propertyId: string, context: ScoringContext): string {
    return `${propertyId}-${context.mode}-${context.userId || 'anonymous'}`;
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Factory function para criar instância do serviço
 */
export function createScoringService(
  cacheEnabled: boolean = true,
  cacheTTLSeconds: number = 300
): ScoringService {
  return new ScoringService(cacheEnabled, cacheTTLSeconds);
}
