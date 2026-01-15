/**
 * RankingService - Serviço para ordenação e ranking de propriedades baseado em scores
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import {
  UserPreferences,
  UserBehavior,
  ScoredProperty,
  RankingOptions,
  RankingResult,
  PropertyScore,
} from '../../types/scoring';
import { ScoringEngine } from './ScoringEngine';

export class RankingService {
  private scoringEngine: ScoringEngine;

  constructor() {
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Rankeia propriedades baseado em preferências do usuário
   */
  async rankProperties(
    properties: PropertyCanonicalModel[],
    preferences: UserPreferences,
    behaviors?: Map<string, UserBehavior>,
    options?: RankingOptions
  ): Promise<RankingResult> {
    // Calcula scores para todas as propriedades
    const scores = await this.scoringEngine.calculateBatchScores(
      properties,
      preferences,
      behaviors,
      options?.weights
    );

    // Cria pares propriedade-score
    let scoredProperties: ScoredProperty[] = properties.map((property, index) => ({
      property,
      score: scores[index],
    }));

    // Aplica filtro de score mínimo
    if (options?.minScore !== undefined) {
      scoredProperties = scoredProperties.filter(
        sp => sp.score.finalScore >= options.minScore!
      );
    }

    // Ordena baseado na opção de ordenação
    const sortBy = options?.sortBy || 'score';
    const sortDirection = options?.sortDirection || 'desc';

    scoredProperties.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'score':
          compareValue = a.score.finalScore - b.score.finalScore;
          break;
        case 'price':
          compareValue = a.property.price.value - b.property.price.value;
          break;
        case 'recency':
          compareValue =
            new Date(a.property.metadata.firstSeen).getTime() -
            new Date(b.property.metadata.firstSeen).getTime();
          break;
        case 'popularity':
          const aViews = a.property.metadata.viewCount || 0;
          const bViews = b.property.metadata.viewCount || 0;
          compareValue = aViews - bViews;
          break;
        default:
          compareValue = a.score.finalScore - b.score.finalScore;
      }

      return sortDirection === 'desc' ? -compareValue : compareValue;
    });

    // Adiciona ranks
    scoredProperties.forEach((sp, index) => {
      sp.rank = index + 1;
    });

    // Limita resultados se especificado
    if (options?.maxResults) {
      scoredProperties = scoredProperties.slice(0, options.maxResults);
    }

    // Agrupa se especificado
    if (options?.groupBy) {
      scoredProperties = this.groupProperties(scoredProperties, options.groupBy);
    }

    // Calcula metadados
    const metadata = this.calculateMetadata(
      scoredProperties,
      preferences,
      properties.length
    );

    return {
      properties: scoredProperties,
      metadata,
    };
  }

  /**
   * Rankeia propriedades com score rápido (sem histórico de comportamento)
   */
  async quickRank(
    properties: PropertyCanonicalModel[],
    preferences: UserPreferences,
    options?: RankingOptions
  ): Promise<RankingResult> {
    const scores: PropertyScore[] = properties.map(property =>
      this.scoringEngine.calculateQuickScore(property, preferences, options?.weights)
    );

    let scoredProperties: ScoredProperty[] = properties.map((property, index) => ({
      property,
      score: scores[index],
    }));

    // Aplica filtro de score mínimo
    if (options?.minScore !== undefined) {
      scoredProperties = scoredProperties.filter(
        sp => sp.score.finalScore >= options.minScore!
      );
    }

    // Ordena por score (sempre descendente para quick rank)
    scoredProperties.sort((a, b) => b.score.finalScore - a.score.finalScore);

    // Adiciona ranks
    scoredProperties.forEach((sp, index) => {
      sp.rank = index + 1;
    });

    // Limita resultados
    if (options?.maxResults) {
      scoredProperties = scoredProperties.slice(0, options.maxResults);
    }

    const metadata = this.calculateMetadata(
      scoredProperties,
      preferences,
      properties.length
    );

    return {
      properties: scoredProperties,
      metadata,
    };
  }

  /**
   * Reranking incremental - ajusta ranking baseado em nova interação
   */
  async rerank(
    currentRanking: RankingResult,
    newBehavior: UserBehavior,
    preferences: UserPreferences
  ): Promise<RankingResult> {
    // Encontra a propriedade afetada
    const affectedIndex = currentRanking.properties.findIndex(
      sp => sp.property.id === newBehavior.propertyId
    );

    if (affectedIndex === -1) {
      return currentRanking; // Propriedade não está no ranking
    }

    // Recalcula score da propriedade afetada
    const affectedProperty = currentRanking.properties[affectedIndex];
    const newScore = this.scoringEngine.calculateScore(
      affectedProperty.property,
      preferences,
      newBehavior
    );

    // Atualiza score
    currentRanking.properties[affectedIndex].score = newScore;

    // Reordena
    currentRanking.properties.sort(
      (a, b) => b.score.finalScore - a.score.finalScore
    );

    // Atualiza ranks
    currentRanking.properties.forEach((sp, index) => {
      sp.rank = index + 1;
    });

    // Atualiza metadados
    currentRanking.metadata = this.calculateMetadata(
      currentRanking.properties,
      preferences,
      currentRanking.metadata.totalProperties
    );

    return currentRanking;
  }

  /**
   * Agrupa propriedades por critério
   */
  private groupProperties(
    properties: ScoredProperty[],
    groupBy: 'concelho' | 'distrito' | 'type' | 'priceRange'
  ): ScoredProperty[] {
    const grouped = new Map<string, ScoredProperty[]>();

    properties.forEach(sp => {
      let key: string;

      switch (groupBy) {
        case 'concelho':
          key = sp.property.location.address.concelho;
          break;
        case 'distrito':
          key = sp.property.location.address.distrito;
          break;
        case 'type':
          key = sp.property.type;
          break;
        case 'priceRange':
          key = this.getPriceRangeKey(sp.property.price.value);
          break;
        default:
          key = 'default';
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(sp);
    });

    // Ordena grupos por score médio e retorna top de cada grupo
    const result: ScoredProperty[] = [];
    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
      const avgA = a[1].reduce((sum, sp) => sum + sp.score.finalScore, 0) / a[1].length;
      const avgB = b[1].reduce((sum, sp) => sum + sp.score.finalScore, 0) / b[1].length;
      return avgB - avgA;
    });

    // Pega top 2 de cada grupo alternadamente
    const maxPerGroup = 2;
    let hasMore = true;
    let index = 0;

    while (hasMore && result.length < properties.length) {
      hasMore = false;
      for (const [, groupItems] of sortedGroups) {
        if (index < groupItems.length && index < maxPerGroup) {
          result.push(groupItems[index]);
          hasMore = true;
        }
      }
      index++;
    }

    return result;
  }

  /**
   * Determina faixa de preço
   */
  private getPriceRangeKey(price: number): string {
    if (price < 100000) return '0-100k';
    if (price < 200000) return '100k-200k';
    if (price < 300000) return '200k-300k';
    if (price < 500000) return '300k-500k';
    if (price < 750000) return '500k-750k';
    if (price < 1000000) return '750k-1M';
    return '1M+';
  }

  /**
   * Calcula metadados do ranking
   */
  private calculateMetadata(
    properties: ScoredProperty[],
    preferences: UserPreferences,
    totalCount: number
  ) {
    const scores = properties.map(sp => sp.score.finalScore);

    return {
      totalProperties: totalCount,
      averageScore: scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0,
      topScore: scores.length > 0 ? Math.max(...scores) : 0,
      bottomScore: scores.length > 0 ? Math.min(...scores) : 0,
      calculatedAt: new Date(),
      userId: preferences.userId,
      filters: undefined,
    };
  }

  /**
   * Encontra propriedades similares baseado em score
   */
  async findSimilar(
    targetProperty: PropertyCanonicalModel,
    candidates: PropertyCanonicalModel[],
    preferences: UserPreferences,
    maxResults: number = 5
  ): Promise<ScoredProperty[]> {
    // Calcula score do target
    const targetScore = this.scoringEngine.calculateQuickScore(
      targetProperty,
      preferences
    );

    // Calcula scores dos candidatos
    const scores = candidates.map(prop =>
      this.scoringEngine.calculateQuickScore(prop, preferences)
    );

    // Cria pares e calcula similaridade com o target
    const scoredWithSimilarity = candidates.map((property, index) => {
      // Similaridade baseada na diferença de scores parciais
      const similarity = this.calculateScoreSimilarity(
        targetScore,
        scores[index]
      );

      return {
        property,
        score: scores[index],
        similarity,
      };
    });

    // Ordena por similaridade e retorna top N
    scoredWithSimilarity.sort((a, b) => b.similarity - a.similarity);

    return scoredWithSimilarity
      .slice(0, maxResults)
      .map(({ property, score }, index) => ({
        property,
        score,
        rank: index + 1,
      }));
  }

  /**
   * Calcula similaridade entre dois scores (0-1)
   */
  private calculateScoreSimilarity(score1: PropertyScore, score2: PropertyScore): number {
    // Calcula diferença normalizada em cada componente
    const compatDiff = Math.abs(score1.compatibility.total - score2.compatibility.total) / 100;
    const behaviorDiff = Math.abs(score1.behavior.total - score2.behavior.total) / 100;
    const temporalDiff = Math.abs(score1.temporal.total - score2.temporal.total) / 100;

    // Média das diferenças
    const avgDiff = (compatDiff + behaviorDiff + temporalDiff) / 3;

    // Converte diferença em similaridade (1 - diff)
    return 1 - avgDiff;
  }
}
