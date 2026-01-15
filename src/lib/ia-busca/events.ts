import { MarketEvent, MarketEventType, Property } from '@/types/busca-ia';

/**
 * Detecção de eventos de mercado
 * 
 * Monitora mudanças nas propriedades e gera eventos:
 * - Novo no mercado
 * - Descida/subida de preço
 * - Volta ao mercado
 * - Saiu do mercado
 * - Nova aparição em portal
 * - Remoção de portal
 * - Mudança de conteúdo
 * - Mudança na divergência de preços
 */

export class EventDetector {
  /**
   * Detecta eventos comparando estado atual com anterior
   */
  detectEvents(
    currentProperty: Property,
    previousProperty?: Property
  ): MarketEvent[] {
    const events: MarketEvent[] = [];

    if (!previousProperty) {
      // Propriedade nova
      events.push(this.createEvent('NEW_ON_MARKET', {
        first_seen: currentProperty.first_seen,
        price: currentProperty.price_main,
        portal_count: currentProperty.portal_count,
      }));
      return events;
    }

    // Detectar mudança de preço
    const priceEvents = this.detectPriceChanges(
      currentProperty,
      previousProperty
    );
    events.push(...priceEvents);

    // Detectar mudança de portais
    const portalEvents = this.detectPortalChanges(
      currentProperty,
      previousProperty
    );
    events.push(...portalEvents);

    // Detectar volta ao mercado
    const backOnMarketEvent = this.detectBackOnMarket(
      currentProperty,
      previousProperty
    );
    if (backOnMarketEvent) events.push(backOnMarketEvent);

    // Detectar saída do mercado
    const offMarketEvent = this.detectOffMarket(currentProperty, previousProperty);
    if (offMarketEvent) events.push(offMarketEvent);

    // Detectar mudança de conteúdo
    const contentChangeEvent = this.detectContentChange(
      currentProperty,
      previousProperty
    );
    if (contentChangeEvent) events.push(contentChangeEvent);

    // Detectar mudança na divergência de preços
    const divergenceEvent = this.detectDivergenceChange(
      currentProperty,
      previousProperty
    );
    if (divergenceEvent) events.push(divergenceEvent);

    return events;
  }

  /**
   * Cria um novo evento
   */
  private createEvent(
    type: MarketEventType,
    data: Record<string, any>
  ): MarketEvent {
    return {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  /**
   * Detecta mudanças de preço
   */
  private detectPriceChanges(
    current: Property,
    previous: Property
  ): MarketEvent[] {
    const events: MarketEvent[] = [];

    const priceDiff = current.price_main - previous.price_main;
    const priceDiffPct = (Math.abs(priceDiff) / previous.price_main) * 100;

    // Ignorar mudanças menores que 1%
    if (priceDiffPct < 1) return events;

    if (priceDiff < 0) {
      // Descida de preço
      events.push(
        this.createEvent('PRICE_DROP', {
          old_price: previous.price_main,
          new_price: current.price_main,
          difference: Math.abs(priceDiff),
          percentage: priceDiffPct.toFixed(2),
        })
      );
    } else {
      // Subida de preço
      events.push(
        this.createEvent('PRICE_RISE', {
          old_price: previous.price_main,
          new_price: current.price_main,
          difference: priceDiff,
          percentage: priceDiffPct.toFixed(2),
        })
      );
    }

    return events;
  }

  /**
   * Detecta mudanças nos portais
   */
  private detectPortalChanges(
    current: Property,
    previous: Property
  ): MarketEvent[] {
    const events: MarketEvent[] = [];

    const currentSources = new Set(
      current.sources.map((s) => `${s.source_type}:${s.source_name}`)
    );
    const previousSources = new Set(
      previous.sources.map((s) => `${s.source_type}:${s.source_name}`)
    );

    // Novos portais
    for (const source of current.sources) {
      const key = `${source.source_type}:${source.source_name}`;
      if (!previousSources.has(key)) {
        events.push(
          this.createEvent('NEW_SOURCE_APPEARANCE', {
            source_type: source.source_type,
            source_name: source.source_name,
            url: source.url,
            price: source.price,
          })
        );
      }
    }

    // Portais removidos
    for (const source of previous.sources) {
      const key = `${source.source_type}:${source.source_name}`;
      if (!currentSources.has(key)) {
        events.push(
          this.createEvent('SOURCE_REMOVED', {
            source_type: source.source_type,
            source_name: source.source_name,
            last_seen: source.last_seen,
          })
        );
      }
    }

    return events;
  }

  /**
   * Detecta volta ao mercado
   */
  private detectBackOnMarket(
    current: Property,
    previous: Property
  ): MarketEvent | null {
    // Se estava fora do mercado (sem portais ativos) e agora tem portais
    const wasOffMarket = previous.portal_count === 0;
    const isOnMarket = current.portal_count > 0;

    if (wasOffMarket && isOnMarket) {
      return this.createEvent('BACK_ON_MARKET', {
        days_off_market: this.calculateDaysOffMarket(previous.last_seen),
        new_portal_count: current.portal_count,
        new_price: current.price_main,
        old_price: previous.price_main,
      });
    }

    return null;
  }

  /**
   * Detecta saída do mercado
   */
  private detectOffMarket(
    current: Property,
    previous: Property
  ): MarketEvent | null {
    // Se tinha portais ativos e agora não tem
    const wasOnMarket = previous.portal_count > 0;
    const isOffMarket = current.portal_count === 0;

    if (wasOnMarket && isOffMarket) {
      return this.createEvent('OFF_MARKET', {
        days_on_market: this.calculateDaysOnMarket(
          previous.first_seen,
          previous.last_seen
        ),
        last_price: previous.price_main,
        last_portal_count: previous.portal_count,
      });
    }

    return null;
  }

  /**
   * Detecta mudança de conteúdo
   */
  private detectContentChange(
    current: Property,
    previous: Property
  ): MarketEvent | null {
    // Verificar mudanças significativas
    const changes: string[] = [];

    if (current.typology !== previous.typology) {
      changes.push(`Tipologia: ${previous.typology} → ${current.typology}`);
    }

    if (Math.abs(current.area_m2 - previous.area_m2) > 5) {
      changes.push(`Área: ${previous.area_m2}m² → ${current.area_m2}m²`);
    }

    if (current.bedrooms !== previous.bedrooms) {
      changes.push(`Quartos: ${previous.bedrooms} → ${current.bedrooms}`);
    }

    if (current.bathrooms !== previous.bathrooms) {
      changes.push(`Casas de banho: ${previous.bathrooms} → ${current.bathrooms}`);
    }

    if (changes.length > 0) {
      return this.createEvent('CONTENT_CHANGED', {
        changes,
      });
    }

    return null;
  }

  /**
   * Detecta mudança na divergência de preços
   */
  private detectDivergenceChange(
    current: Property,
    previous: Property
  ): MarketEvent | null {
    const currentDivergence = current.price_divergence_pct;
    const previousDivergence = previous.price_divergence_pct;

    const divergenceDiff = Math.abs(currentDivergence - previousDivergence);

    // Ignorar mudanças menores que 3%
    if (divergenceDiff < 3) return null;

    return this.createEvent('PRICE_DIVERGENCE_CHANGED', {
      old_divergence: previousDivergence.toFixed(2),
      new_divergence: currentDivergence.toFixed(2),
      price_min: current.price_min,
      price_max: current.price_max,
    });
  }

  /**
   * Calcula dias fora do mercado
   */
  private calculateDaysOffMarket(lastSeen: string): number {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula dias no mercado
   */
  private calculateDaysOnMarket(firstSeen: string, lastSeen: string): number {
    const firstSeenDate = new Date(firstSeen);
    const lastSeenDate = new Date(lastSeen);
    const diffMs = lastSeenDate.getTime() - firstSeenDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}

export const eventDetector = new EventDetector();

/**
 * Calcula recência (dias desde última atualização)
 */
export function calculateRecency(lastSeen: string): number {
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
