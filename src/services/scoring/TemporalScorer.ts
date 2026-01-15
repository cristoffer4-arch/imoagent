/**
 * TemporalScorer - Calcula score baseado em fatores temporais
 * 
 * Score baseado em:
 * - Urgência (0-40 pontos): Quão recente é o imóvel
 * - Disponibilidade (0-35 pontos): Probabilidade de estar disponível
 * - Tendência de mercado (0-25 pontos): Movimentos de preço e demanda
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import { TemporalScore } from '../../types/scoring';

export class TemporalScorer {
  /**
   * Calcula score temporal total
   */
  calculate(property: PropertyCanonicalModel): TemporalScore {
    const urgencyScore = this.calculateUrgencyScore(property);
    const availabilityScore = this.calculateAvailabilityScore(property);
    const marketTrendScore = this.calculateMarketTrendScore(property);

    const total = urgencyScore + availabilityScore + marketTrendScore;
    const reasons = this.generateReasons(property, {
      urgencyScore,
      availabilityScore,
      marketTrendScore,
    });

    return {
      total,
      breakdown: {
        urgency: urgencyScore,
        availability: availabilityScore,
        marketTrend: marketTrendScore,
      },
      reasons,
    };
  }

  /**
   * Calcula score de urgência (0-40 pontos)
   * Baseado na recência do anúncio
   */
  private calculateUrgencyScore(property: PropertyCanonicalModel): number {
    const maxScore = 40;
    const now = new Date();
    const firstSeen = new Date(property.metadata.firstSeen);
    const lastUpdated = new Date(property.metadata.lastUpdated);

    // Dias desde primeira aparição
    const daysSinceFirstSeen =
      (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24);

    // Dias desde última atualização
    const daysSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    let score = 0;

    // Score baseado em recência da primeira aparição (25 pontos)
    if (daysSinceFirstSeen <= 1) {
      score += 25; // Novo hoje
    } else if (daysSinceFirstSeen <= 3) {
      score += 22; // Últimos 3 dias
    } else if (daysSinceFirstSeen <= 7) {
      score += 18; // Última semana
    } else if (daysSinceFirstSeen <= 14) {
      score += 14; // Últimas 2 semanas
    } else if (daysSinceFirstSeen <= 30) {
      score += 10; // Último mês
    } else if (daysSinceFirstSeen <= 60) {
      score += 5; // Últimos 2 meses
    } else {
      score += 2; // Mais antigo
    }

    // Score baseado em atualizações recentes (15 pontos)
    if (daysSinceUpdate <= 1) {
      score += 15; // Atualizado hoje
    } else if (daysSinceUpdate <= 3) {
      score += 12; // Atualizado nos últimos 3 dias
    } else if (daysSinceUpdate <= 7) {
      score += 9; // Atualizado na última semana
    } else if (daysSinceUpdate <= 14) {
      score += 6; // Atualizado nas últimas 2 semanas
    } else if (daysSinceUpdate <= 30) {
      score += 3; // Atualizado no último mês
    } else {
      score += 1; // Não atualizado recentemente
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calcula score de disponibilidade (0-35 pontos)
   * Baseado em sinais de que a propriedade ainda está disponível
   */
  private calculateAvailabilityScore(property: PropertyCanonicalModel): number {
    const maxScore = 35;
    let score = 0;

    // Se há score de disponibilidade da IA, usa diretamente (20 pontos)
    if (property.aiScores?.availabilityProbability !== undefined) {
      score += property.aiScores.availabilityProbability * 20;
    } else {
      // Senão, estima baseado em heurísticas
      const now = new Date();
      const lastSeen = new Date(property.metadata.lastSeen);
      const daysSinceLastSeen =
        (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastSeen <= 1) {
        score += 20; // Visto hoje = provavelmente disponível
      } else if (daysSinceLastSeen <= 3) {
        score += 17;
      } else if (daysSinceLastSeen <= 7) {
        score += 14;
      } else if (daysSinceLastSeen <= 14) {
        score += 10;
      } else if (daysSinceLastSeen <= 30) {
        score += 6;
      } else {
        score += 2; // Não visto há muito tempo
      }
    }

    // Número de portais onde aparece (10 pontos)
    const portalCount = property.metadata.portalCount || 1;
    if (portalCount >= 5) {
      score += 10; // Múltiplos portais = alta disponibilidade
    } else if (portalCount >= 3) {
      score += 7;
    } else if (portalCount >= 2) {
      score += 5;
    } else {
      score += 3;
    }

    // Qualidade dos dados (5 pontos)
    // Dados completos indicam anúncio ativo e bem mantido
    const quality = property.metadata.dataQuality;
    if (quality === 'HIGH') {
      score += 5;
    } else if (quality === 'MEDIUM') {
      score += 3;
    } else if (quality === 'LOW') {
      score += 1;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calcula score de tendência de mercado (0-25 pontos)
   * Baseado em movimentos de preço e demanda aparente
   */
  private calculateMarketTrendScore(property: PropertyCanonicalModel): number {
    const maxScore = 25;
    let score = 0;

    // Divergência de preços entre portais (10 pontos)
    if (property.price.priceRange) {
      const divergence = property.price.priceRange.divergencePercentage;

      if (divergence > 0 && divergence <= 5) {
        score += 10; // Baixa divergência = preço estável
      } else if (divergence <= 10) {
        score += 7; // Divergência moderada
      } else if (divergence <= 20) {
        score += 4; // Alta divergência
      } else {
        score += 2; // Divergência muito alta = incerteza
      }
    } else {
      score += 5; // Score neutro se não há dados
    }

    // Preço por m² competitivo (10 pontos)
    if (property.price.pricePerM2) {
      // Heurística: preços entre 1500-3500 €/m² em Lisboa são típicos
      // Ajustar conforme região
      const pricePerM2 = property.price.pricePerM2;

      if (pricePerM2 >= 1500 && pricePerM2 <= 3500) {
        score += 10; // Faixa de preço normal
      } else if (pricePerM2 < 1500) {
        score += 12; // Preço abaixo da média = oportunidade
      } else if (pricePerM2 <= 5000) {
        score += 7; // Preço acima da média
      } else {
        score += 4; // Preço muito alto
      }
    } else {
      score += 5; // Score neutro
    }

    // Número de visualizações (5 pontos)
    // Propriedades populares podem indicar boa oportunidade
    if (property.metadata.viewCount) {
      if (property.metadata.viewCount >= 100) {
        score += 5; // Alta demanda
      } else if (property.metadata.viewCount >= 50) {
        score += 4;
      } else if (property.metadata.viewCount >= 20) {
        score += 3;
      } else if (property.metadata.viewCount >= 10) {
        score += 2;
      } else {
        score += 1; // Baixa demanda ou nova
      }
    } else {
      score += 2.5; // Score neutro
    }

    return Math.min(score, maxScore);
  }

  /**
   * Gera razões explicativas do score
   */
  private generateReasons(
    property: PropertyCanonicalModel,
    scores: {
      urgencyScore: number;
      availabilityScore: number;
      marketTrendScore: number;
    }
  ): string[] {
    const reasons: string[] = [];
    const now = new Date();

    // Urgência
    const firstSeen = new Date(property.metadata.firstSeen);
    const daysSinceFirstSeen = Math.floor(
      (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceFirstSeen === 0) {
      reasons.push('Novo no mercado hoje! Alta urgência');
    } else if (daysSinceFirstSeen === 1) {
      reasons.push('Publicado ontem - muito recente');
    } else if (daysSinceFirstSeen <= 7) {
      reasons.push(`Publicado há ${daysSinceFirstSeen} dias`);
    } else if (daysSinceFirstSeen <= 30) {
      reasons.push(`No mercado há ${daysSinceFirstSeen} dias`);
    } else {
      const weeks = Math.floor(daysSinceFirstSeen / 7);
      reasons.push(`No mercado há ${weeks} semanas`);
    }

    // Disponibilidade
    const lastSeen = new Date(property.metadata.lastSeen);
    const daysSinceLastSeen = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSeen <= 1) {
      reasons.push('Confirmado disponível hoje');
    } else if (daysSinceLastSeen <= 7) {
      reasons.push(`Última confirmação há ${daysSinceLastSeen} dias`);
    }

    const portalCount = property.metadata.portalCount || 1;
    if (portalCount >= 3) {
      reasons.push(`Visível em ${portalCount} portais - alta disponibilidade`);
    } else if (portalCount === 1) {
      reasons.push('Disponível em apenas um portal');
    }

    // Tendência de mercado
    if (property.price.priceRange?.divergencePercentage) {
      const divergence = property.price.priceRange.divergencePercentage;
      if (divergence > 15) {
        reasons.push(`Alta variação de preço (${divergence.toFixed(1)}%)`);
      }
    }

    if (property.price.pricePerM2) {
      const pricePerM2 = property.price.pricePerM2;
      if (pricePerM2 < 2000) {
        reasons.push(`Preço competitivo: €${pricePerM2}/m²`);
      }
    }

    if (property.metadata.viewCount && property.metadata.viewCount >= 50) {
      reasons.push(`Alta demanda: ${property.metadata.viewCount} visualizações`);
    }

    return reasons.slice(0, 5); // Limita a 5 razões
  }
}
