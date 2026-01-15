import { Property, MarketEvent } from '@/types/busca-ia';
import { normalizationService } from './normalization';
import { calculateAngariaScore, calculateVendaScore, generateTopReasons } from './scoring';

/**
 * Gerador de dados mock para MVP
 * Cria 50 propriedades realistas em Lisboa, Porto, Cascais, Sintra, Oeiras
 */

const LOCATIONS = [
  {
    concelho: 'Lisboa',
    freguesias: ['Alvalade', 'Areeiro', 'Avenidas Novas', 'Campo de Ourique', 'Estrela', 'Parque das Nações'],
    distrito: 'Lisboa',
    baseCoords: { lat: 38.7223, lon: -9.1393 },
  },
  {
    concelho: 'Porto',
    freguesias: ['Cedofeita', 'Paranhos', 'Bonfim', 'Campanhã', 'Massarelos'],
    distrito: 'Porto',
    baseCoords: { lat: 41.1579, lon: -8.6291 },
  },
  {
    concelho: 'Cascais',
    freguesias: ['Cascais', 'Estoril', 'Parede', 'Carcavelos', 'São Domingos de Rana'],
    distrito: 'Lisboa',
    baseCoords: { lat: 38.6979, lon: -9.4215 },
  },
  {
    concelho: 'Sintra',
    freguesias: ['Sintra', 'Queluz', 'Massamá', 'Agualva-Cacém', 'Rio de Mouro'],
    distrito: 'Lisboa',
    baseCoords: { lat: 38.8029, lon: -9.3817 },
  },
  {
    concelho: 'Oeiras',
    freguesias: ['Oeiras', 'Carnaxide', 'Linda-a-Velha', 'Algés', 'Cruz Quebrada'],
    distrito: 'Lisboa',
    baseCoords: { lat: 38.6922, lon: -9.3108 },
  },
];

const TYPOLOGIES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5+'];

const FEATURES_POOL = [
  { type: 'garage', value: true },
  { type: 'elevator', value: true },
  { type: 'balcony', value: true },
  { type: 'terrace', value: true },
  { type: 'pool', value: true },
  { type: 'garden', value: true },
  { type: 'air_conditioning', value: true },
  { type: 'central_heating', value: true },
  { type: 'storage', value: true },
  { type: 'security', value: true },
];

const CONDITIONS = ['Novo', 'Como Novo', 'Bom Estado', 'Para Renovar', 'Em Construção'];

const PORTALS = [
  { type: 'portal' as const, name: 'idealista' },
  { type: 'portal' as const, name: 'olx' },
  { type: 'portal' as const, name: 'imovirtual' },
  { type: 'portal' as const, name: 'casasapo' },
  { type: 'portal' as const, name: 'bpi' },
  { type: 'portal' as const, name: 'facebook' },
  { type: 'casafari' as const, name: 'casafari' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomSample<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateGeohash(lat: number, lon: number): string {
  const latStr = Math.floor(lat * 1000).toString(36);
  const lonStr = Math.floor(lon * 1000).toString(36);
  return `${latStr}${lonStr}`.substring(0, 12);
}

function generateMarketEvents(daysOld: number, hasPortals: number): MarketEvent[] {
  const events: MarketEvent[] = [];
  
  // Evento inicial
  const firstSeenDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  events.push({
    type: 'NEW_ON_MARKET',
    timestamp: firstSeenDate.toISOString(),
    data: { portal_count: hasPortals },
  });

  // 30% chance de descida de preço
  if (Math.random() < 0.3 && daysOld > 7) {
    const priceDropDate = new Date(Date.now() - randomInt(1, daysOld - 1) * 24 * 60 * 60 * 1000);
    events.push({
      type: 'PRICE_DROP',
      timestamp: priceDropDate.toISOString(),
      data: {
        old_price: randomInt(200000, 500000),
        new_price: randomInt(180000, 450000),
        percentage: randomFloat(5, 15).toFixed(2),
      },
    });
  }

  // 20% chance de nova aparição em portal
  if (Math.random() < 0.2 && hasPortals > 1 && daysOld > 3) {
    const newSourceDate = new Date(Date.now() - randomInt(1, daysOld - 1) * 24 * 60 * 60 * 1000);
    events.push({
      type: 'NEW_SOURCE_APPEARANCE',
      timestamp: newSourceDate.toISOString(),
      data: {
        source_type: 'portal',
        source_name: randomChoice(['olx', 'idealista', 'imovirtual']),
      },
    });
  }

  // 15% chance de mudança de conteúdo
  if (Math.random() < 0.15 && daysOld > 5) {
    const contentChangeDate = new Date(Date.now() - randomInt(1, daysOld - 1) * 24 * 60 * 60 * 1000);
    events.push({
      type: 'CONTENT_CHANGED',
      timestamp: contentChangeDate.toISOString(),
      data: {
        changes: ['Adicionadas novas fotos', 'Descrição atualizada'],
      },
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateMockProperty(index: number): Property {
  const location = randomChoice(LOCATIONS);
  const freguesia = randomChoice(location.freguesias);
  const typology = randomChoice(TYPOLOGIES);
  
  // Área baseada na tipologia
  let areaMin: number, areaMax: number;
  switch (typology) {
    case 'T0':
      areaMin = 25;
      areaMax = 45;
      break;
    case 'T1':
      areaMin = 45;
      areaMax = 75;
      break;
    case 'T2':
      areaMin = 70;
      areaMax = 100;
      break;
    case 'T3':
      areaMin = 90;
      areaMax = 140;
      break;
    case 'T4':
      areaMin = 120;
      areaMax = 180;
      break;
    case 'T5+':
      areaMin = 160;
      areaMax = 250;
      break;
    default:
      areaMin = 50;
      areaMax = 100;
  }
  
  const area_m2 = randomInt(areaMin, areaMax);
  const bedrooms = typology === 'T0' ? 0 : parseInt(typology[1]) || 1;
  const bathrooms = Math.max(1, Math.ceil(bedrooms / 2));
  
  // Preço baseado na localização e tipologia
  const pricePerM2 = location.concelho === 'Lisboa' ? randomInt(3000, 6000) :
                     location.concelho === 'Porto' ? randomInt(2500, 4500) :
                     location.concelho === 'Cascais' ? randomInt(3500, 6500) :
                     randomInt(2000, 4000);
  const basePrice = area_m2 * pricePerM2;
  const priceVariation = randomFloat(0.85, 1.15);
  const price_main = Math.round(basePrice * priceVariation);
  
  // Número de portais (1-4)
  const portal_count = randomInt(1, 4);
  const selectedPortals = randomSample(PORTALS, portal_count);
  
  // Gerar preços variados por portal (para divergência)
  const prices = selectedPortals.map(() => 
    Math.round(price_main * randomFloat(0.95, 1.05))
  );
  const price_min = Math.min(...prices);
  const price_max = Math.max(...prices);
  const price_divergence_pct = price_min > 0 ? ((price_max - price_min) / price_min) * 100 : 0;
  
  // Coordenadas com variação
  const lat = location.baseCoords.lat + randomFloat(-0.05, 0.05);
  const lon = location.baseCoords.lon + randomFloat(-0.05, 0.05);
  
  // Features aleatórias (2-7)
  const featureCount = randomInt(2, 7);
  const features = randomSample(FEATURES_POOL, featureCount);
  
  // Datas
  const daysOld = randomInt(0, 60);
  const first_seen = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  const last_seen = new Date(Date.now() - randomInt(0, Math.min(daysOld, 7)) * 24 * 60 * 60 * 1000).toISOString();
  const derived_recency = Math.floor((Date.now() - new Date(last_seen).getTime()) / (1000 * 60 * 60 * 24));
  
  // Sources
  const sources = selectedPortals.map((portal, idx) => ({
    source_type: portal.type,
    source_name: portal.name,
    last_seen: new Date(Date.now() - randomInt(0, 2) * 24 * 60 * 60 * 1000).toISOString(),
    url: `https://${portal.name}.pt/imovel/${randomInt(100000, 999999)}`,
    price: prices[idx],
  }));
  
  // Events
  const events = generateMarketEvents(daysOld, portal_count);
  
  // Tenant ID (mock)
  const tenant_id = 'demo-tenant-123';
  
  const property: Property = {
    id: `prop-${String(index).padStart(3, '0')}`,
    tenant_id,
    lat,
    lon,
    geohash: generateGeohash(lat, lon),
    freguesia,
    concelho: location.concelho,
    distrito: location.distrito,
    typology,
    area_m2,
    bedrooms,
    bathrooms,
    features,
    condition: randomChoice(CONDITIONS),
    price_main,
    price_min,
    price_max,
    price_divergence_pct,
    portal_count,
    sources,
    first_seen,
    last_seen,
    derived_recency,
    angaria_score: 0, // será calculado abaixo
    venda_score: 0, // será calculado abaixo
    availability_probability: randomFloat(0.6, 1.0),
    top_reasons: [],
    events,
    created_at: first_seen,
    updated_at: last_seen,
  };
  
  // Calcular scores
  property.angaria_score = calculateAngariaScore(property);
  property.venda_score = calculateVendaScore(property);
  property.top_reasons = generateTopReasons(property, 'angariacao');
  
  return property;
}

/**
 * Gera 50 propriedades mock
 */
export function generateMockProperties(): Property[] {
  const properties: Property[] = [];
  
  for (let i = 1; i <= 50; i++) {
    properties.push(generateMockProperty(i));
  }
  
  // Ordenar por angaria_score descendente
  return properties.sort((a, b) => b.angaria_score - a.angaria_score);
}

/**
 * Gera uma única propriedade mock
 */
export function generateSingleMockProperty(): Property {
  // Use Math.random to generate a unique-ish index
  return generateMockProperty(Math.floor(Math.random() * 1000000));
}

/**
 * Filtra propriedades por critérios
 */
export function filterProperties(
  properties: Property[],
  filters: {
    concelho?: string;
    typology?: string[];
    price_range?: [number, number];
    area_range?: [number, number];
    min_score?: number;
    mode?: 'angariacao' | 'venda';
  }
): Property[] {
  return properties.filter((prop) => {
    if (filters.concelho && prop.concelho !== filters.concelho) return false;
    if (filters.typology && !filters.typology.includes(prop.typology)) return false;
    if (filters.price_range) {
      const [min, max] = filters.price_range;
      if (prop.price_main < min || prop.price_main > max) return false;
    }
    if (filters.area_range) {
      const [min, max] = filters.area_range;
      if (prop.area_m2 < min || prop.area_m2 > max) return false;
    }
    if (filters.min_score) {
      const score = filters.mode === 'venda' ? prop.venda_score : prop.angaria_score;
      if (score < filters.min_score) return false;
    }
    return true;
  });
}
