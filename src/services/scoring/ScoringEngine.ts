/**
 * ScoringEngine - Motor central de scoring que coordena todos os scorers
 * 
 * Implementa a fórmula:
 * ScoreFinal = (0.4 * ScoreCompatibilidade) + (0.3 * ScoreComportamento) + (0.3 * ScoreTemporal)
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import {
  UserPreferences,
  UserBehavior,
  PropertyScore,
  ScoringWeights,
} from '../../types/scoring';
import { CompatibilityScorer } from './CompatibilityScorer';
import { BehaviorScorer } from './BehaviorScorer';
import { TemporalScorer } from './TemporalScorer';

export class ScoringEngine {
  private compatibilityScorer: CompatibilityScorer;
  private behaviorScorer: BehaviorScorer;
  private temporalScorer: TemporalScorer;

  // Pesos padrão conforme especificação
  private defaultWeights: ScoringWeights = {
    compatibility: 0.4,
    behavior: 0.3,
    temporal: 0.3,
  };

  constructor() {
    this.compatibilityScorer = new CompatibilityScorer();
    this.behaviorScorer = new BehaviorScorer();
    this.temporalScorer = new TemporalScorer();
  }

  /**
   * Calcula score completo para uma propriedade
   */
  calculateScore(
    property: PropertyCanonicalModel,
    preferences: UserPreferences,
    behavior?: UserBehavior,
    customWeights?: Partial<ScoringWeights>
  ): PropertyScore {
    // Mescla pesos customizados com padrão
    const weights: ScoringWeights = {
      ...this.defaultWeights,
      ...customWeights,
    };

    // Valida e normaliza pesos (devem somar 1.0)
    const totalWeight = weights.compatibility + weights.behavior + weights.temporal;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      // Normaliza se não somam 1.0
      weights.compatibility /= totalWeight;
      weights.behavior /= totalWeight;
      weights.temporal /= totalWeight;
    }

    // Calcula scores parciais
    const compatibility = this.compatibilityScorer.calculate(property, preferences);
    const behaviorData = this.behaviorScorer.calculate(behavior);
    const temporal = this.temporalScorer.calculate(property);

    // Aplica ajuste de recência ao comportamento
    let behaviorTotal = behaviorData.total;
    if (behavior) {
      const recencyMultiplier = this.behaviorScorer.calculateRecencyMultiplier(behavior);
      behaviorTotal *= recencyMultiplier;
    }

    // Calcula score final
    const finalScore =
      compatibility.total * weights.compatibility +
      behaviorTotal * weights.behavior +
      temporal.total * weights.temporal;

    // Combina razões mais relevantes
    const topReasons = this.selectTopReasons(
      compatibility.reasons,
      behaviorData.reasons,
      temporal.reasons,
      weights
    );

    return {
      propertyId: property.id,
      userId: preferences.userId,
      compatibility,
      behavior: {
        ...behaviorData,
        total: behaviorTotal,
      },
      temporal,
      finalScore: Math.min(Math.max(finalScore, 0), 100),
      weights,
      topReasons,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calcula scores em batch para múltiplas propriedades
   */
  async calculateBatchScores(
    properties: PropertyCanonicalModel[],
    preferences: UserPreferences,
    behaviors?: Map<string, UserBehavior>,
    customWeights?: Partial<ScoringWeights>
  ): Promise<PropertyScore[]> {
    return properties.map(property => {
      const behavior = behaviors?.get(property.id);
      return this.calculateScore(property, preferences, behavior, customWeights);
    });
  }

  /**
   * Calcula score simplificado (apenas compatibilidade e temporal)
   * Útil para primeiro contato quando não há histórico de comportamento
   */
  calculateQuickScore(
    property: PropertyCanonicalModel,
    preferences: UserPreferences,
    customWeights?: Partial<ScoringWeights>
  ): PropertyScore {
    const adjustedWeights: ScoringWeights = {
      compatibility: 0.6, // Aumenta peso da compatibilidade
      behavior: 0.0,      // Remove comportamento
      temporal: 0.4,      // Aumenta peso temporal
      ...customWeights,
    };

    return this.calculateScore(property, preferences, undefined, adjustedWeights);
  }

  /**
   * Seleciona as razões mais relevantes baseado nos pesos
   */
  private selectTopReasons(
    compatibilityReasons: string[],
    behaviorReasons: string[],
    temporalReasons: string[],
    weights: ScoringWeights
  ): string[] {
    const allReasons: Array<{ reason: string; weight: number }> = [];

    // Adiciona razões de compatibilidade
    compatibilityReasons.forEach(reason => {
      allReasons.push({ reason, weight: weights.compatibility });
    });

    // Adiciona razões de comportamento
    behaviorReasons.forEach(reason => {
      allReasons.push({ reason, weight: weights.behavior });
    });

    // Adiciona razões temporais
    temporalReasons.forEach(reason => {
      allReasons.push({ reason, weight: weights.temporal });
    });

    // Ordena por peso e seleciona top 5
    allReasons.sort((a, b) => b.weight - a.weight);
    
    return allReasons.slice(0, 5).map(item => item.reason);
  }

  /**
   * Atualiza pesos padrão do engine
   * Útil para ajustes baseados em ML
   */
  updateDefaultWeights(newWeights: Partial<ScoringWeights>): void {
    this.defaultWeights = {
      ...this.defaultWeights,
      ...newWeights,
    };

    // Normaliza
    const total =
      this.defaultWeights.compatibility +
      this.defaultWeights.behavior +
      this.defaultWeights.temporal;
    
    this.defaultWeights.compatibility /= total;
    this.defaultWeights.behavior /= total;
    this.defaultWeights.temporal /= total;
  }

  /**
   * Retorna os pesos atuais do engine
   */
  getDefaultWeights(): ScoringWeights {
    return { ...this.defaultWeights };
  }

  /**
   * Calcula score de compatibilidade isolado
   * Útil para análises específicas
   */
  calculateCompatibilityOnly(
    property: PropertyCanonicalModel,
    preferences: UserPreferences
  ) {
    return this.compatibilityScorer.calculate(property, preferences);
  }

  /**
   * Calcula score de comportamento isolado
   * Útil para análises específicas
   */
  calculateBehaviorOnly(behavior: UserBehavior) {
    return this.behaviorScorer.calculate(behavior);
  }

  /**
   * Calcula score temporal isolado
   * Útil para análises específicas
   */
  calculateTemporalOnly(property: PropertyCanonicalModel) {
    return this.temporalScorer.calculate(property);
  }

  /**
   * Explica o score de uma propriedade em formato detalhado
   */
  explainScore(score: PropertyScore): string {
    const lines: string[] = [];
    
    lines.push(`=== Score Final: ${score.finalScore.toFixed(1)}/100 ===`);
    lines.push('');
    
    lines.push(`Compatibilidade: ${score.compatibility.total.toFixed(1)}/100 (peso ${(score.weights.compatibility * 100).toFixed(0)}%)`);
    lines.push(`  - Localização: ${score.compatibility.breakdown.location.toFixed(1)}/30`);
    lines.push(`  - Preço: ${score.compatibility.breakdown.price.toFixed(1)}/25`);
    lines.push(`  - Tipo: ${score.compatibility.breakdown.type.toFixed(1)}/15`);
    lines.push(`  - Características: ${score.compatibility.breakdown.characteristics.toFixed(1)}/30`);
    lines.push('');
    
    lines.push(`Comportamento: ${score.behavior.total.toFixed(1)}/100 (peso ${(score.weights.behavior * 100).toFixed(0)}%)`);
    lines.push(`  - Frequência: ${score.behavior.breakdown.viewFrequency.toFixed(1)}/30`);
    lines.push(`  - Duração: ${score.behavior.breakdown.viewDuration.toFixed(1)}/30`);
    lines.push(`  - Interações: ${score.behavior.breakdown.interactions.toFixed(1)}/40`);
    lines.push('');
    
    lines.push(`Temporal: ${score.temporal.total.toFixed(1)}/100 (peso ${(score.weights.temporal * 100).toFixed(0)}%)`);
    lines.push(`  - Urgência: ${score.temporal.breakdown.urgency.toFixed(1)}/40`);
    lines.push(`  - Disponibilidade: ${score.temporal.breakdown.availability.toFixed(1)}/35`);
    lines.push(`  - Tendência: ${score.temporal.breakdown.marketTrend.toFixed(1)}/25`);
    lines.push('');
    
    lines.push('Principais Razões:');
    score.topReasons.forEach((reason, idx) => {
      lines.push(`  ${idx + 1}. ${reason}`);
    });
    
    return lines.join('\n');
  }
}
