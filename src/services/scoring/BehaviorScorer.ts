/**
 * BehaviorScorer - Calcula score baseado no comportamento do usuário
 * 
 * Score baseado em:
 * - Frequência de visualizações (0-30 pontos): Quantas vezes visualizou
 * - Duração de visualizações (0-30 pontos): Tempo gasto visualizando
 * - Interações (0-40 pontos): Ações realizadas (save, share, contact, etc.)
 */

import { UserBehavior, BehaviorScore } from '../../types/scoring';

export class BehaviorScorer {
  /**
   * Calcula score de comportamento total
   */
  calculate(behavior?: UserBehavior): BehaviorScore {
    // Se não há dados de comportamento, retorna score neutro
    if (!behavior) {
      return {
        total: 50, // Score neutro para propriedades não visualizadas
        breakdown: {
          viewFrequency: 15,
          viewDuration: 15,
          interactions: 20,
        },
        reasons: ['Propriedade ainda não visualizada'],
      };
    }

    const viewFrequencyScore = this.calculateViewFrequencyScore(behavior);
    const viewDurationScore = this.calculateViewDurationScore(behavior);
    const interactionsScore = this.calculateInteractionsScore(behavior);

    const total = viewFrequencyScore + viewDurationScore + interactionsScore;
    const reasons = this.generateReasons(behavior, {
      viewFrequencyScore,
      viewDurationScore,
      interactionsScore,
    });

    return {
      total,
      breakdown: {
        viewFrequency: viewFrequencyScore,
        viewDuration: viewDurationScore,
        interactions: interactionsScore,
      },
      reasons,
    };
  }

  /**
   * Calcula score de frequência de visualizações (0-30 pontos)
   */
  private calculateViewFrequencyScore(behavior: UserBehavior): number {
    const maxScore = 30;
    const { viewCount } = behavior;

    // Curva logarítmica: mais visualizações = maior interesse
    // 1 view = 10 pts, 2 views = 18 pts, 3 views = 23 pts, 5+ views = 30 pts
    if (viewCount === 0) return 0;
    if (viewCount === 1) return 10;
    if (viewCount === 2) return 18;
    if (viewCount === 3) return 23;
    if (viewCount === 4) return 27;
    
    return maxScore;
  }

  /**
   * Calcula score de duração de visualizações (0-30 pontos)
   */
  private calculateViewDurationScore(behavior: UserBehavior): number {
    const maxScore = 30;
    const { averageViewTimeSeconds, totalViewTimeSeconds } = behavior;

    // Tempo médio ideal: 60-180 segundos
    const idealMinTime = 60;
    const idealMaxTime = 180;

    let score = 0;

    // Score baseado no tempo médio (15 pontos)
    if (averageViewTimeSeconds >= idealMinTime && averageViewTimeSeconds <= idealMaxTime) {
      score += 15;
    } else if (averageViewTimeSeconds > idealMaxTime) {
      // Muito tempo pode indicar confusão ou alta consideração
      score += 12;
    } else if (averageViewTimeSeconds >= 30) {
      // Tempo razoável
      score += 10;
    } else if (averageViewTimeSeconds >= 10) {
      // Tempo mínimo
      score += 5;
    }

    // Score baseado no tempo total (15 pontos)
    // Mais tempo total = mais interesse acumulado
    if (totalViewTimeSeconds >= 300) {
      // 5+ minutos
      score += 15;
    } else if (totalViewTimeSeconds >= 180) {
      // 3+ minutos
      score += 12;
    } else if (totalViewTimeSeconds >= 120) {
      // 2+ minutos
      score += 10;
    } else if (totalViewTimeSeconds >= 60) {
      // 1+ minuto
      score += 7;
    } else if (totalViewTimeSeconds >= 30) {
      // 30+ segundos
      score += 5;
    } else {
      // Menos de 30 segundos
      score += 2;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calcula score de interações (0-40 pontos)
   */
  private calculateInteractionsScore(behavior: UserBehavior): number {
    const maxScore = 40;
    const { actions } = behavior;

    let score = 0;

    // Cada ação tem um peso diferente baseado no nível de comprometimento
    if (actions.scheduled) {
      score += 15; // Agendou visita = alto interesse
    }
    if (actions.contacted) {
      score += 12; // Entrou em contato = alto interesse
    }
    if (actions.inquired) {
      score += 10; // Fez pergunta = interesse moderado
    }
    if (actions.saved) {
      score += 8; // Salvou = interesse moderado
    }
    if (actions.shared) {
      score += 5; // Compartilhou = interesse leve
    }

    // Pontos extras por engajamento adicional
    const { imagesViewed, detailsExpanded, mapViewed } = behavior;

    if (imagesViewed && imagesViewed > 5) {
      score += 3; // Viu muitas imagens
    } else if (imagesViewed && imagesViewed > 2) {
      score += 2;
    } else if (imagesViewed && imagesViewed > 0) {
      score += 1;
    }

    if (detailsExpanded) {
      score += 2; // Expandiu detalhes
    }

    if (mapViewed) {
      score += 2; // Visualizou mapa/localização
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calcula recência da última visualização (usado para ajuste temporal)
   * Retorna multiplicador: 1.0 = hoje, 0.8 = 1 semana, 0.5 = 1 mês
   */
  calculateRecencyMultiplier(behavior?: UserBehavior): number {
    if (!behavior) return 1.0;

    const now = new Date();
    const lastView = new Date(behavior.lastViewedAt);
    const daysSinceLastView = (now.getTime() - lastView.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastView <= 1) return 1.0; // Hoje
    if (daysSinceLastView <= 3) return 0.95; // Últimos 3 dias
    if (daysSinceLastView <= 7) return 0.85; // Última semana
    if (daysSinceLastView <= 14) return 0.75; // Últimas 2 semanas
    if (daysSinceLastView <= 30) return 0.6; // Último mês
    if (daysSinceLastView <= 60) return 0.4; // Últimos 2 meses
    
    return 0.2; // Mais de 2 meses = interesse antigo
  }

  /**
   * Gera razões explicativas do score
   */
  private generateReasons(
    behavior: UserBehavior,
    scores: {
      viewFrequencyScore: number;
      viewDurationScore: number;
      interactionsScore: number;
    }
  ): string[] {
    const reasons: string[] = [];

    // Frequência
    if (behavior.viewCount > 4) {
      reasons.push(`Visualizou ${behavior.viewCount} vezes - alto interesse`);
    } else if (behavior.viewCount > 2) {
      reasons.push(`Visualizou múltiplas vezes (${behavior.viewCount}x)`);
    } else if (behavior.viewCount === 1) {
      reasons.push(`Primeira visualização`);
    }

    // Duração
    const totalMinutes = Math.round(behavior.totalViewTimeSeconds / 60);
    const avgSeconds = Math.round(behavior.averageViewTimeSeconds);
    
    if (behavior.totalViewTimeSeconds >= 300) {
      reasons.push(`Tempo total de análise: ${totalMinutes}+ minutos`);
    } else if (behavior.averageViewTimeSeconds >= 120) {
      reasons.push(`Análise detalhada (${avgSeconds}s em média)`);
    } else if (behavior.averageViewTimeSeconds < 30) {
      reasons.push(`Visualização rápida (${avgSeconds}s)`);
    }

    // Interações
    const actionsList: string[] = [];
    if (behavior.actions.scheduled) actionsList.push('agendou visita');
    if (behavior.actions.contacted) actionsList.push('entrou em contato');
    if (behavior.actions.inquired) actionsList.push('fez perguntas');
    if (behavior.actions.saved) actionsList.push('salvou');
    if (behavior.actions.shared) actionsList.push('compartilhou');

    if (actionsList.length > 0) {
      reasons.push(`Ações realizadas: ${actionsList.join(', ')}`);
    }

    // Engajamento
    if (behavior.imagesViewed && behavior.imagesViewed > 5) {
      reasons.push(`Visualizou ${behavior.imagesViewed} imagens`);
    }

    // Recência
    const daysSince = Math.floor(
      (new Date().getTime() - new Date(behavior.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSince === 0) {
      reasons.push(`Visto hoje`);
    } else if (daysSince === 1) {
      reasons.push(`Visto ontem`);
    } else if (daysSince <= 7) {
      reasons.push(`Visto há ${daysSince} dias`);
    } else if (daysSince > 30) {
      reasons.push(`Visto há mais de um mês`);
    }

    return reasons.slice(0, 5); // Limita a 5 razões
  }
}
