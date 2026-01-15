import { Property } from '@/types/busca-ia';

/**
 * Algoritmos de scoring para modos Angariação e Venda
 */

interface BuyerPreferences {
  typology?: string[];
  location?: { concelho?: string; distrito?: string };
  price_range?: [number, number];
  area_range?: [number, number];
  required_features?: string[];
}

/**
 * Calcula o AngariaScore (0-100)
 * 
 * Indicadores de oportunidade de angariação:
 * - Recência: Imóvel atualizado recentemente
 * - Descida de preço: Teve redução de preço
 * - Baixa exposição: Poucos portais
 * - Divergência de preço: Preços diferentes em portais
 * - Qualidade: Baixa qualidade do anúncio
 * - Disponibilidade: Provável ainda disponível
 * - Sinal de particular: Não é de agência
 */
export function calculateAngariaScore(property: Property): number {
  let totalScore = 0;
  const weights = {
    recency: 0.25,
    priceDrop: 0.20,
    lowExposure: 0.15,
    priceDivergence: 0.10,
    quality: 0.10,
    availability: 0.10,
    particularSignal: 0.10,
  };

  // 1. Recency Score (25%) - quanto mais recente, maior o score
  const recencyScore = calculateRecencyScore(property.derived_recency);
  totalScore += recencyScore * weights.recency;

  // 2. Price Drop Score (20%) - teve descida de preço?
  const priceDropScore = calculatePriceDropScore(property.events);
  totalScore += priceDropScore * weights.priceDrop;

  // 3. Low Exposure Score (15%) - poucos portais = oportunidade
  const lowExposureScore = calculateLowExposureScore(property.portal_count);
  totalScore += lowExposureScore * weights.lowExposure;

  // 4. Price Divergence Score (10%) - preços diferentes = negociação
  const priceDivergenceScore = property.price_divergence_pct * 10; // 0-10 -> 0-100
  totalScore += Math.min(priceDivergenceScore, 100) * weights.priceDivergence;

  // 5. Quality Score (10%) - baixa qualidade = particular/amador
  const qualityScore = calculateQualityIndicator(property);
  totalScore += qualityScore * weights.quality;

  // 6. Availability Score (10%)
  const availabilityScore = property.availability_probability * 100;
  totalScore += availabilityScore * weights.availability;

  // 7. Particular Signal Score (10%)
  const particularScore = calculateParticularSignal(property);
  totalScore += particularScore * weights.particularSignal;

  // Return final score (0-100 scale, rounded to integer)
  return Math.round(totalScore);
}

/**
 * Calcula o VendaScore (0-100)
 * 
 * Match entre propriedade e preferências do comprador:
 * - Fit do comprador: Match com critérios
 * - Disponibilidade: Ainda disponível
 * - Preço vs mercado: Preço competitivo
 * - Motivação do vendedor: Sinais de urgência
 * - Qualidade: Anúncio de qualidade
 * - Logística: Proximidade, acesso
 */
export function calculateVendaScore(
  property: Property,
  buyer?: BuyerPreferences
): number {
  let totalScore = 0;
  const weights = {
    buyerFit: 0.35,
    availability: 0.20,
    priceVsMarket: 0.15,
    sellerMotivation: 0.10,
    quality: 0.10,
    logistics: 0.10,
  };
  
  // Validate weights sum to 1.0
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(weightSum - 1.0) > 0.001) {
    console.warn(`Venda score weights sum to ${weightSum}, expected 1.0`);
  }

  // 1. Buyer Fit Score (35%)
  const buyerFitScore = buyer
    ? calculateBuyerFitScore(property, buyer)
    : 50; // default se não há preferências
  totalScore += buyerFitScore * weights.buyerFit;

  // 2. Availability Score (20%)
  const availabilityScore = property.availability_probability * 100;
  totalScore += availabilityScore * weights.availability;

  // 3. Price vs Market Score (15%)
  const priceScore = calculatePriceVsMarketScore(property);
  totalScore += priceScore * weights.priceVsMarket;

  // 4. Seller Motivation Score (10%)
  const motivationScore = calculateSellerMotivationScore(property.events);
  totalScore += motivationScore * weights.sellerMotivation;

  // 5. Quality Score (10%)
  const qualityScore = 100 - calculateQualityIndicator(property); // inverter: alta qualidade = bom
  totalScore += qualityScore * weights.quality;

  // 6. Logistics Score (10%)
  const logisticsScore = calculateLogisticsScore(property);
  totalScore += logisticsScore * weights.logistics;

  return Math.round(totalScore * 100) / 100;
}

// Helper Functions

function calculateRecencyScore(daysOld: number): number {
  // 0 dias = 100, 30+ dias = 0
  if (daysOld <= 0) return 100;
  if (daysOld >= 30) return 0;
  return 100 - (daysOld / 30) * 100;
}

function calculatePriceDropScore(events: Property['events']): number {
  const hasPriceDrop = events.some((e) => e.type === 'PRICE_DROP');
  if (!hasPriceDrop) return 0;

  // Contar quantas descidas de preço
  const priceDrops = events.filter((e) => e.type === 'PRICE_DROP');
  return Math.min(priceDrops.length * 33, 100); // 1 drop = 33, 2 drops = 66, 3+ = 100
}

function calculateLowExposureScore(portalCount: number): number {
  // 1 portal = 100, 2 portais = 60, 3+ = 20
  if (portalCount <= 1) return 100;
  if (portalCount === 2) return 60;
  if (portalCount === 3) return 30;
  return 10;
}

function calculateQualityIndicator(property: Property): number {
  // Baixa qualidade = alta oportunidade de angariação
  let qualityScore = 100;

  // Deduct for good quality indicators
  if (property.features.length >= 5) qualityScore -= 30;
  if (property.portal_count >= 3) qualityScore -= 20;
  if (property.sources.some((s) => s.source_type === 'crm')) qualityScore -= 30;
  if (property.price_divergence_pct < 2) qualityScore -= 20;

  return Math.max(qualityScore, 0);
}

function calculateParticularSignal(property: Property): number {
  let score = 0;

  // Sinais de particular (não agência)
  if (property.portal_count <= 1) score += 40;
  if (property.sources.every((s) => !s.source_agency)) score += 30;
  if (property.features.length <= 2) score += 30;

  return Math.min(score, 100);
}

function calculateBuyerFitScore(
  property: Property,
  buyer: BuyerPreferences
): number {
  let score = 0;
  let maxScore = 0;

  // Typology match
  if (buyer.typology && buyer.typology.length > 0) {
    maxScore += 30;
    if (buyer.typology.includes(property.typology)) {
      score += 30;
    }
  }

  // Location match
  if (buyer.location) {
    maxScore += 25;
    if (
      buyer.location.concelho &&
      property.concelho.toLowerCase() === buyer.location.concelho.toLowerCase()
    ) {
      score += 25;
    } else if (
      buyer.location.distrito &&
      property.distrito.toLowerCase() === buyer.location.distrito.toLowerCase()
    ) {
      score += 15;
    }
  }

  // Price range match
  if (buyer.price_range) {
    maxScore += 25;
    const [minPrice, maxPrice] = buyer.price_range;
    if (property.price_main >= minPrice && property.price_main <= maxPrice) {
      score += 25;
    } else if (property.price_main < minPrice) {
      const diff = ((minPrice - property.price_main) / minPrice) * 100;
      score += Math.max(25 - diff, 0);
    } else {
      const diff = ((property.price_main - maxPrice) / maxPrice) * 100;
      score += Math.max(25 - diff, 0);
    }
  }

  // Area range match
  if (buyer.area_range) {
    maxScore += 20;
    const [minArea, maxArea] = buyer.area_range;
    if (property.area_m2 >= minArea && property.area_m2 <= maxArea) {
      score += 20;
    }
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

function calculatePriceVsMarketScore(property: Property): number {
  // Mock - em produção comparar com preços de mercado reais
  // Assume preço competitivo se está na média
  return 70; // default
}

function calculateSellerMotivationScore(events: Property['events']): number {
  let score = 0;

  // Sinais de motivação
  const hasPriceDrop = events.some((e) => e.type === 'PRICE_DROP');
  const hasBackOnMarket = events.some((e) => e.type === 'BACK_ON_MARKET');
  const recentUpdates = events.filter(
    (e) =>
      e.type === 'CONTENT_CHANGED' &&
      new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  if (hasPriceDrop) score += 40;
  if (hasBackOnMarket) score += 30;
  if (recentUpdates.length > 0) score += 30;

  return Math.min(score, 100);
}

function calculateLogisticsScore(property: Property): number {
  // Mock - em produção considerar:
  // - Distância do escritório
  // - Acesso (transporte público, estacionamento)
  // - Zona conhecida
  return 75; // default
}

/**
 * Gera lista de razões para o score
 */
export function generateTopReasons(
  property: Property,
  mode: 'angariacao' | 'venda',
  buyer?: BuyerPreferences
): Array<{ reason: string; weight: number }> {
  const reasons: Array<{ reason: string; weight: number }> = [];

  if (mode === 'angariacao') {
    if (property.derived_recency <= 3) {
      reasons.push({ reason: 'Atualizado nos últimos 3 dias', weight: 0.25 });
    }
    if (property.events.some((e) => e.type === 'PRICE_DROP')) {
      reasons.push({ reason: 'Teve descida de preço recente', weight: 0.20 });
    }
    if (property.portal_count <= 1) {
      reasons.push({ reason: 'Baixa exposição (1 portal)', weight: 0.15 });
    }
    if (property.price_divergence_pct > 5) {
      reasons.push({
        reason: `Divergência de preço ${property.price_divergence_pct.toFixed(1)}%`,
        weight: 0.10,
      });
    }
  } else {
    if (property.availability_probability >= 0.8) {
      reasons.push({ reason: 'Alta probabilidade de disponível', weight: 0.20 });
    }
    if (buyer?.typology?.includes(property.typology)) {
      reasons.push({ reason: 'Match perfeito de tipologia', weight: 0.35 });
    }
    if (property.events.some((e) => e.type === 'PRICE_DROP')) {
      reasons.push({ reason: 'Vendedor motivado (descida preço)', weight: 0.10 });
    }
  }

  return reasons.sort((a, b) => b.weight - a.weight).slice(0, 5);
}
