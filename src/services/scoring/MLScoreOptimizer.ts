/**
 * MLScoreOptimizer - Otimização de pesos de scoring baseado em feedback do usuário
 * 
 * Implementa aprendizado simples para ajustar pesos dinamicamente baseado em:
 * - Feedback positivo/negativo do usuário
 * - Conversões (contatos, agendamentos)
 * - Padrões de comportamento
 */

import {
  UserFeedback,
  ScoringWeights,
  MLConfig,
  ScoringMetrics,
  PropertyScore,
} from '../../types/scoring';

interface WeightAdjustment {
  compatibility: number;
  behavior: number;
  temporal: number;
}

export class MLScoreOptimizer {
  private config: MLConfig;
  private feedbackHistory: UserFeedback[] = [];
  private currentWeights: ScoringWeights;

  constructor(initialWeights?: ScoringWeights, config?: Partial<MLConfig>) {
    this.currentWeights = initialWeights || {
      compatibility: 0.4,
      behavior: 0.3,
      temporal: 0.3,
    };

    this.config = {
      learningRate: 0.05,
      minSamples: 10,
      updateFrequency: 'daily',
      enabled: true,
      ...config,
    };
  }

  /**
   * Adiciona feedback do usuário
   */
  addFeedback(feedback: UserFeedback): void {
    if (!this.config.enabled) return;

    this.feedbackHistory.push(feedback);

    // Se atingiu mínimo de amostras e é tempo real, otimiza
    if (
      this.config.updateFrequency === 'realtime' &&
      this.feedbackHistory.length >= this.config.minSamples
    ) {
      this.optimize();
    }
  }

  /**
   * Adiciona múltiplos feedbacks em batch
   */
  addFeedbackBatch(feedbacks: UserFeedback[]): void {
    if (!this.config.enabled) return;

    this.feedbackHistory.push(...feedbacks);

    if (this.feedbackHistory.length >= this.config.minSamples) {
      this.optimize();
    }
  }

  /**
   * Otimiza pesos baseado no histórico de feedback
   */
  optimize(): ScoringWeights {
    if (this.feedbackHistory.length < this.config.minSamples) {
      console.warn('Amostras insuficientes para otimização');
      return this.currentWeights;
    }

    // Analisa padrões de feedback
    const analysis = this.analyzeFeedback();

    // Calcula ajustes necessários
    const adjustments = this.calculateAdjustments(analysis);

    // Aplica ajustes com learning rate
    this.currentWeights = {
      compatibility:
        this.currentWeights.compatibility +
        adjustments.compatibility * this.config.learningRate,
      behavior:
        this.currentWeights.behavior +
        adjustments.behavior * this.config.learningRate,
      temporal:
        this.currentWeights.temporal +
        adjustments.temporal * this.config.learningRate,
    };

    // Normaliza para somar 1.0
    this.normalizeWeights();

    console.log('Pesos otimizados:', this.currentWeights);

    return this.currentWeights;
  }

  /**
   * Analisa padrões no histórico de feedback
   */
  private analyzeFeedback() {
    const positiveFeedbacks = this.feedbackHistory.filter(
      f => f.feedbackType === 'positive'
    );
    const negativeFeedbacks = this.feedbackHistory.filter(
      f => f.feedbackType === 'negative'
    );

    // Analisa quais ações geram mais feedback positivo
    const actionStats = {
      viewed: { positive: 0, negative: 0, total: 0 },
      saved: { positive: 0, negative: 0, total: 0 },
      contacted: { positive: 0, negative: 0, total: 0 },
      scheduled: { positive: 0, negative: 0, total: 0 },
      ignored: { positive: 0, negative: 0, total: 0 },
      hidden: { positive: 0, negative: 0, total: 0 },
    };

    this.feedbackHistory.forEach(feedback => {
      const action = feedback.action;
      actionStats[action].total++;
      if (feedback.feedbackType === 'positive') {
        actionStats[action].positive++;
      } else if (feedback.feedbackType === 'negative') {
        actionStats[action].negative++;
      }
    });

    return {
      totalFeedbacks: this.feedbackHistory.length,
      positiveFeedbacks: positiveFeedbacks.length,
      negativeFeedbacks: negativeFeedbacks.length,
      positiveRate: positiveFeedbacks.length / this.feedbackHistory.length,
      actionStats,
    };
  }

  /**
   * Calcula ajustes necessários nos pesos
   */
  private calculateAdjustments(analysis: any): WeightAdjustment {
    const adjustments: WeightAdjustment = {
      compatibility: 0,
      behavior: 0,
      temporal: 0,
    };

    // Se taxa de positivos é baixa, aumenta peso de compatibilidade
    if (analysis.positiveRate < 0.3) {
      adjustments.compatibility = 0.1;
      adjustments.behavior = -0.05;
      adjustments.temporal = -0.05;
    }
    // Se taxa de positivos é alta, balanceia mais
    else if (analysis.positiveRate > 0.7) {
      adjustments.behavior = 0.05;
      adjustments.temporal = 0.05;
      adjustments.compatibility = -0.1;
    }

    // Ajusta baseado em ações
    const { actionStats } = analysis;

    // Se muitos contatos/agendamentos, aumenta peso de comportamento
    const highCommitmentActions =
      actionStats.contacted.positive + actionStats.scheduled.positive;
    if (highCommitmentActions > analysis.totalFeedbacks * 0.3) {
      adjustments.behavior += 0.08;
      adjustments.compatibility -= 0.04;
      adjustments.temporal -= 0.04;
    }

    // Se muitos ignores/hidden, aumenta peso temporal (urgência)
    const lowInterestActions =
      actionStats.ignored.total + actionStats.hidden.total;
    if (lowInterestActions > analysis.totalFeedbacks * 0.4) {
      adjustments.temporal += 0.08;
      adjustments.compatibility -= 0.04;
      adjustments.behavior -= 0.04;
    }

    return adjustments;
  }

  /**
   * Normaliza pesos para somarem 1.0
   */
  private normalizeWeights(): void {
    // Garante valores positivos
    this.currentWeights.compatibility = Math.max(0.1, this.currentWeights.compatibility);
    this.currentWeights.behavior = Math.max(0.1, this.currentWeights.behavior);
    this.currentWeights.temporal = Math.max(0.1, this.currentWeights.temporal);

    // Normaliza para somar 1.0
    const total =
      this.currentWeights.compatibility +
      this.currentWeights.behavior +
      this.currentWeights.temporal;

    this.currentWeights.compatibility /= total;
    this.currentWeights.behavior /= total;
    this.currentWeights.temporal /= total;
  }

  /**
   * Retorna pesos otimizados atuais
   */
  getOptimizedWeights(): ScoringWeights {
    return { ...this.currentWeights };
  }

  /**
   * Calcula métricas de performance do scoring
   */
  calculateMetrics(
    userId: string,
    actualScores: PropertyScore[],
    conversions: Set<string>
  ): ScoringMetrics {
    const period = this.getPeriod();

    // Calcula precisão: % de propriedades com score alto que converteram
    const highScoreThreshold = 70;
    const highScoreProperties = actualScores.filter(
      s => s.finalScore >= highScoreThreshold
    );
    const highScoreConversions = highScoreProperties.filter(s =>
      conversions.has(s.propertyId)
    ).length;
    const precision =
      highScoreProperties.length > 0
        ? highScoreConversions / highScoreProperties.length
        : 0;

    // Calcula recall: % de conversões que tinham score alto
    const totalConversions = conversions.size;
    const recall =
      totalConversions > 0 ? highScoreConversions / totalConversions : 0;

    // Calcula accuracy: combinação de precision e recall (F1 score)
    const accuracy =
      precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    // Estatísticas
    const scores = actualScores.map(s => s.finalScore);
    const averageScore =
      scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

    const positiveFeedbacks = this.feedbackHistory.filter(
      f => f.feedbackType === 'positive'
    ).length;
    const negativeFeedbacks = this.feedbackHistory.filter(
      f => f.feedbackType === 'negative'
    ).length;

    return {
      userId,
      period,
      accuracy,
      precision,
      recall,
      totalScores: actualScores.length,
      averageScore,
      positiveFeedbacks,
      negativeFeedbacks,
      optimizedWeights: this.getOptimizedWeights(),
      calculatedAt: new Date(),
    };
  }

  /**
   * Retorna período de análise
   */
  private getPeriod(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (this.config.updateFrequency) {
      case 'hourly':
        start.setHours(start.getHours() - 1);
        break;
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      default:
        start.setDate(start.getDate() - 1);
    }

    return { start, end };
  }

  /**
   * Reseta otimizador para estado inicial
   */
  reset(initialWeights?: ScoringWeights): void {
    this.feedbackHistory = [];
    this.currentWeights = initialWeights || {
      compatibility: 0.4,
      behavior: 0.3,
      temporal: 0.3,
    };
  }

  /**
   * Exporta estado do otimizador
   */
  export(): {
    weights: ScoringWeights;
    feedbackCount: number;
    config: MLConfig;
  } {
    return {
      weights: this.getOptimizedWeights(),
      feedbackCount: this.feedbackHistory.length,
      config: this.config,
    };
  }

  /**
   * Importa estado do otimizador
   */
  import(state: {
    weights: ScoringWeights;
    feedbackCount: number;
    config: MLConfig;
  }): void {
    this.currentWeights = state.weights;
    this.config = state.config;
    // Nota: não importamos feedbackHistory para manter privacidade
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<MLConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  /**
   * Retorna estatísticas do otimizador
   */
  getStats() {
    const analysis = this.analyzeFeedback();
    return {
      currentWeights: this.getOptimizedWeights(),
      feedbackCount: this.feedbackHistory.length,
      positiveRate: analysis.positiveRate,
      config: this.config,
      readyToOptimize: this.feedbackHistory.length >= this.config.minSamples,
    };
  }
}
