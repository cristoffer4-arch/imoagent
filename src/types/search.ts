/**
 * Search Types - Tipos para o módulo de busca de imóveis
 */

import { PropertyCanonicalModel } from '../models/PropertyCanonicalModel';

/**
 * Modo de busca: Angariação ou Venda
 */
export enum SearchMode {
  ANGARIACAO = 'ANGARIACAO', // Busca imóveis para angariar
  VENDA = 'VENDA',           // Busca imóveis para vender
}

/**
 * Filtros de busca avançados
 */
export interface SearchFilters {
  // Tipo e transação
  propertyType?: string[];       // ['APARTMENT', 'HOUSE', ...]
  transactionType?: string;      // 'SALE' | 'RENT'
  
  // Localização
  distrito?: string;
  concelho?: string;
  freguesia?: string;
  postalCode?: string;
  locationIds?: string[];        // Advanced: IDs específicos de localização
  customLocationBoundary?: {     // Advanced: círculo ou polígono personalizado
    type: 'circle' | 'polygon';
    center?: { latitude: number; longitude: number };
    radius?: number;
    coordinates?: Array<{ latitude: number; longitude: number }>;
  };
  
  // Preço
  minPrice?: number;
  maxPrice?: number;
  minPricePerSqm?: number;       // Advanced: preço mínimo por m²
  maxPricePerSqm?: number;       // Advanced: preço máximo por m²
  
  // Área
  minArea?: number;
  maxArea?: number;
  minPlotArea?: number;          // Advanced: área mínima do terreno
  maxPlotArea?: number;          // Advanced: área máxima do terreno
  
  // Características - Quartos e Casas de Banho
  bedrooms?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  bathrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;         // Advanced: máximo de casas de banho
  
  // Andar
  floors?: string[];             // Advanced: posição do andar ['ground', 'middle', 'top']
  floorNumbers?: number[];       // Advanced: números específicos de andar
  
  // Ano de construção
  minConstructionYear?: number;  // Advanced: ano mínimo de construção
  maxConstructionYear?: number;  // Advanced: ano máximo de construção
  
  // Métricas de mercado
  minDaysOnMarket?: number;      // Advanced: mínimo de dias no mercado
  maxDaysOnMarket?: number;      // Advanced: máximo de dias no mercado
  minGrossYield?: number;        // Advanced: rentabilidade bruta mínima (%)
  maxGrossYield?: number;        // Advanced: rentabilidade bruta máxima (%)
  
  // Vistas e orientação
  views?: string[];              // Advanced: ['water', 'landscape', 'city', 'golf', 'park']
  directions?: string[];         // Advanced: direções cardinais ['north', 'south', 'east', 'west']
  orientation?: string;          // Advanced: 'exterior' | 'interior'
  
  // Tipologia (formato português)
  typology?: string[];           // ['T0', 'T1', 'T2', 'T3', 'T4', 'T5+']
  
  // Características booleanas
  features?: string[];           // ['elevator', 'balcony', 'garage', ...]
  mustHaveFeatures?: string[];   // Advanced: características obrigatórias
  excludeFeatures?: string[];    // Advanced: características a excluir
  
  // Condição
  condition?: string[];          // ['NEW', 'RENOVATED', 'GOOD', ...] ou ['new', 'used', 'ruin', 'very-good', 'other']
  energyRatings?: string[];      // Advanced: certificação energética ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  
  // Filtros de negócio
  privateListings?: boolean;     // Advanced: apenas anúncios privados
  auctionOnly?: boolean;         // Advanced: apenas leilões
  bankOwned?: boolean;           // Advanced: apenas propriedades bancárias
  casafariConnect?: boolean;     // Advanced: apenas Casafari Connect
  exclusiveListings?: boolean;   // Advanced: apenas anúncios exclusivos
  withAgencies?: string[];       // Advanced: filtrar por agências específicas
  withoutAgencies?: string[];    // Advanced: excluir agências específicas
  listingAgents?: string[];      // Advanced: filtrar por agentes específicos
  refNumbers?: string[];         // Advanced: filtrar por números de referência
  
  // Portais/Fontes
  portals?: string[];            // ['Idealista', 'OLX', 'Casafari', ...]
  
  // Scores mínimos
  minAngariaScore?: number;      // 0-100
  minVendaScore?: number;        // 0-100
  
  // Temporal
  publishedAfter?: Date;         // Publicado após esta data
  publishedBefore?: Date;        // Publicado antes desta data
  propertyDateFrom?: Date;       // Advanced: data da propriedade desde
  propertyDateTo?: Date;         // Advanced: data da propriedade até
  createdDateFrom?: Date;        // Advanced: data de criação desde
  createdDateTo?: Date;          // Advanced: data de criação até
  updatedDateFrom?: Date;        // Advanced: última atualização desde
  updatedDateTo?: Date;          // Advanced: última atualização até
}

/**
 * Ordenação dos resultados
 */
export enum SearchSortBy {
  SCORE = 'SCORE',               // Por score (angariação ou venda, dependendo do modo)
  PRICE_ASC = 'PRICE_ASC',       // Preço crescente
  PRICE_DESC = 'PRICE_DESC',     // Preço decrescente
  AREA_ASC = 'AREA_ASC',         // Área crescente
  AREA_DESC = 'AREA_DESC',       // Área decrescente
  RECENT = 'RECENT',             // Mais recentes primeiro
  PORTAL_COUNT = 'PORTAL_COUNT', // Mais portais primeiro
}

/**
 * Query de busca completa
 */
export interface SearchQuery {
  mode: SearchMode;
  filters: SearchFilters;
  sortBy: SearchSortBy;
  page: number;
  perPage: number;
  
  // Dados do tenant/usuário
  tenantId: string;
  teamId?: string;
  userId?: string;
}

/**
 * Resultado de busca individual com metadados
 */
export interface SearchResultItem {
  property: PropertyCanonicalModel;
  score: number;                 // Score relevante para o modo (angariação ou venda)
  matchReasons: string[];        // Razões para o match/score
  portalsFound: string[];        // Portais onde foi encontrado
  duplicateCount: number;        // Número de duplicatas encontradas
  highlighted: boolean;          // Se deve ser destacado (score muito alto)
}

/**
 * Resultados de busca completos
 */
export interface SearchResults {
  items: SearchResultItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  
  // Estatísticas
  stats: SearchStats;
  
  // Agregações por facetas
  facets?: SearchFacets;
}

/**
 * Estatísticas da busca
 */
export interface SearchStats {
  totalFound: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgArea: number;
  avgScore: number;
  
  // Por portal
  portalCounts: Record<string, number>;
  
  // Por tipo
  typeCounts: Record<string, number>;
  
  // Por distrito
  distritoCounts: Record<string, number>;
}

/**
 * Facetas para refinamento de busca
 */
export interface SearchFacets {
  propertyTypes: Array<{ value: string; count: number }>;
  distritos: Array<{ value: string; count: number }>;
  concelhos: Array<{ value: string; count: number }>;
  typologies: Array<{ value: string; count: number }>;
  portals: Array<{ value: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
}

/**
 * Opções de busca
 */
export interface SearchOptions {
  // Agregação de múltiplas fontes
  enableCasafari?: boolean;      // Buscar no Casafari
  enablePortals?: boolean;       // Buscar nos portais
  enableCRM?: boolean;           // Buscar no CRM
  
  // Deduplicação
  enableDeduplication?: boolean; // Ativar deduplicação
  deduplicationThreshold?: number; // Threshold de similaridade (0-1)
  
  // Enriquecimento
  enrichWithGeoData?: boolean;   // Enriquecer com dados geográficos
  calculateScores?: boolean;     // Calcular scores
  
  // Performance
  timeout?: number;              // Timeout em ms
  maxResults?: number;           // Máximo de resultados por fonte
}

/**
 * Contexto de busca para o usuário
 */
export interface SearchContext {
  tenantId: string;
  teamId?: string;
  userId?: string;
  
  // Preferências do usuário
  preferences?: {
    defaultMode?: SearchMode;
    defaultSortBy?: SearchSortBy;
    favoriteLocations?: string[];
    savedFilters?: SearchFilters[];
  };
  
  // Histórico de busca (para scoring comportamental)
  searchHistory?: Array<{
    query: SearchQuery;
    timestamp: Date;
    resultsViewed: string[];     // IDs das propriedades visualizadas
  }>;
}

/**
 * Resposta de agregação multi-fonte
 */
export interface MultiSourceSearchResult {
  casafari?: {
    properties: PropertyCanonicalModel[];
    count: number;
    error?: string;
  };
  portals?: {
    idealista?: { properties: PropertyCanonicalModel[]; count: number; error?: string };
    olx?: { properties: PropertyCanonicalModel[]; count: number; error?: string };
    imovirtual?: { properties: PropertyCanonicalModel[]; count: number; error?: string };
    facebook?: { properties: PropertyCanonicalModel[]; count: number; error?: string };
  };
  crm?: {
    properties: PropertyCanonicalModel[];
    count: number;
    error?: string;
  };
  
  // Totais
  totalProperties: number;
  totalDuplicates: number;
  totalUnique: number;
  
  // Performance
  executionTimeMs: number;
  sourcesQueried: string[];
  sourcesSucceeded: string[];
  sourcesFailed: string[];
}
