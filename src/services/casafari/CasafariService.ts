/**
 * CasafariService - Serviço de integração com Casafari API
 * 
 * Documentação: https://docs.api.casafari.com
 * 
 * Este serviço fornece métodos para:
 * - Listar propriedades (listProperties)
 * - Obter detalhes de uma propriedade (getPropertyDetails)
 * - Buscar propriedades com filtros (searchProperties)
 * 
 * Recursos:
 * - Autenticação via API Key
 * - Cache em memória para reduzir chamadas à API
 * - Transformação automática para PropertyCanonicalModel
 */

import { PropertyCanonicalModel } from '../../models/PropertyCanonicalModel';
import { CasafariTransformer } from '../../models/transformers/CasafariTransformer';
import type {
  CasafariConfig,
  CasafariSearchFilters,
  CasafariListResponse,
  CasafariDetailResponse,
  CasafariProperty,
  CasafariErrorResponse,
  CacheEntry,
} from './types';

/**
 * Serviço Casafari
 */
export class CasafariService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private cache: Map<string, CacheEntry<any>>;
  private defaultCacheTTL: number = 5 * 60 * 1000; // 5 minutos

  /**
   * Construtor
   */
  constructor(config: CasafariConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.casafari.com/v1';
    this.timeout = config.timeout || 30000;
    this.cache = new Map();
  }

  /**
   * Lista propriedades com paginação
   * 
   * @param filters - Filtros opcionais de busca
   * @param tenantId - ID do tenant para modelo canônico
   * @param teamId - ID do time (opcional)
   * @returns Lista de propriedades no formato canônico
   */
  async listProperties(
    filters?: CasafariSearchFilters,
    tenantId?: string,
    teamId?: string
  ): Promise<{
    properties: PropertyCanonicalModel[];
    pagination: CasafariListResponse['pagination'];
  }> {
    const cacheKey = this.getCacheKey('list', filters);
    
    // Verifica cache
    const cached = this.getFromCache<CasafariListResponse>(cacheKey);
    if (cached) {
      console.log('[CasafariService] Returning cached list results');
      return {
        properties: tenantId 
          ? CasafariTransformer.transformBatch(cached.data, tenantId, teamId)
          : [],
        pagination: cached.pagination,
      };
    }

    // Monta URL com parâmetros
    const url = this.buildUrl('/properties', filters);
    
    try {
      const response = await this.makeRequest<CasafariListResponse>(url);
      
      // Armazena no cache
      this.setCache(cacheKey, response);
      
      // Transforma para modelo canônico se tenantId fornecido
      const properties = tenantId
        ? CasafariTransformer.transformBatch(response.data, tenantId, teamId)
        : [];
      
      return {
        properties,
        pagination: response.pagination,
      };
    } catch (error) {
      console.error('[CasafariService] Error listing properties:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma propriedade específica
   * 
   * @param propertyId - ID da propriedade no Casafari
   * @param tenantId - ID do tenant para modelo canônico
   * @param teamId - ID do time (opcional)
   * @returns Propriedade no formato canônico
   */
  async getPropertyDetails(
    propertyId: string,
    tenantId?: string,
    teamId?: string
  ): Promise<PropertyCanonicalModel | null> {
    const cacheKey = this.getCacheKey('detail', { id: propertyId });
    
    // Verifica cache
    const cached = this.getFromCache<CasafariProperty>(cacheKey);
    if (cached) {
      console.log('[CasafariService] Returning cached property details');
      return tenantId 
        ? CasafariTransformer.transform(cached, tenantId, teamId)
        : null;
    }

    const url = `${this.baseUrl}/properties/${propertyId}`;
    
    try {
      const response = await this.makeRequest<CasafariDetailResponse>(url);
      
      // Armazena no cache
      this.setCache(cacheKey, response.data);
      
      // Transforma para modelo canônico se tenantId fornecido
      return tenantId
        ? CasafariTransformer.transform(response.data, tenantId, teamId)
        : null;
    } catch (error) {
      console.error('[CasafariService] Error getting property details:', error);
      throw error;
    }
  }

  /**
   * Busca propriedades com filtros avançados
   * 
   * @param filters - Filtros de busca
   * @param tenantId - ID do tenant para modelo canônico
   * @param teamId - ID do time (opcional)
   * @returns Lista de propriedades filtradas no formato canônico
   */
  async searchProperties(
    filters: CasafariSearchFilters,
    tenantId?: string,
    teamId?: string
  ): Promise<{
    properties: PropertyCanonicalModel[];
    pagination: CasafariListResponse['pagination'];
  }> {
    const cacheKey = this.getCacheKey('search', filters);
    
    // Verifica cache
    const cached = this.getFromCache<CasafariListResponse>(cacheKey);
    if (cached) {
      console.log('[CasafariService] Returning cached search results');
      return {
        properties: tenantId
          ? CasafariTransformer.transformBatch(cached.data, tenantId, teamId)
          : [],
        pagination: cached.pagination,
      };
    }

    const url = this.buildUrl('/properties/search', filters);
    
    try {
      const response = await this.makeRequest<CasafariListResponse>(url);
      
      // Armazena no cache
      this.setCache(cacheKey, response);
      
      // Transforma para modelo canônico se tenantId fornecido
      const properties = tenantId
        ? CasafariTransformer.transformBatch(response.data, tenantId, teamId)
        : [];
      
      return {
        properties,
        pagination: response.pagination,
      };
    } catch (error) {
      console.error('[CasafariService] Error searching properties:', error);
      throw error;
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[CasafariService] Cache cleared');
  }

  /**
   * Limpa entradas expiradas do cache
   */
  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log(`[CasafariService] Cleared ${cleared} expired cache entries`);
    }
  }

  /**
   * Monta URL com parâmetros de query
   */
  private buildUrl(endpoint: string, filters?: CasafariSearchFilters): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (!filters) {
      return url.toString();
    }

    // Adiciona filtros como query params
    const params = url.searchParams;
    
    if (filters.country) params.set('country', filters.country);
    if (filters.district) params.set('district', filters.district);
    if (filters.municipality) params.set('municipality', filters.municipality);
    if (filters.parish) params.set('parish', filters.parish);
    if (filters.postalCode) params.set('postalCode', filters.postalCode);
    
    if (filters.propertyType) {
      filters.propertyType.forEach(type => params.append('propertyType[]', type));
    }
    if (filters.transactionType) params.set('transactionType', filters.transactionType);
    
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minArea !== undefined) params.set('minArea', filters.minArea.toString());
    if (filters.maxArea !== undefined) params.set('maxArea', filters.maxArea.toString());
    
    if (filters.minBedrooms !== undefined) params.set('minBedrooms', filters.minBedrooms.toString());
    if (filters.maxBedrooms !== undefined) params.set('maxBedrooms', filters.maxBedrooms.toString());
    if (filters.minBathrooms !== undefined) params.set('minBathrooms', filters.minBathrooms.toString());
    
    // Paginação
    if (filters.page !== undefined) params.set('page', filters.page.toString());
    if (filters.limit !== undefined) params.set('limit', filters.limit.toString());
    
    // Ordenação
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    
    return url.toString();
  }

  /**
   * Faz requisição à API Casafari
   */
  private async makeRequest<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as CasafariErrorResponse;
        throw new CasafariApiError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.error?.code,
          errorData.error?.details
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof CasafariApiError) {
        throw error;
      }
      
      if ((error as Error).name === 'AbortError') {
        throw new CasafariApiError('Request timeout', 408);
      }
      
      throw new CasafariApiError(
        `Network error: ${(error as Error).message}`,
        0
      );
    }
  }

  /**
   * Gera chave de cache
   */
  private getCacheKey(operation: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${operation}:${paramsStr}`;
  }

  /**
   * Obtém dados do cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verifica se expirou
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Armazena dados no cache
   */
  private setCache<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const cacheTTL = ttl || this.defaultCacheTTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL,
    });
  }
}

/**
 * Erro customizado para API Casafari
 */
export class CasafariApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CasafariApiError';
  }
}

/**
 * Factory function para criar instância do serviço
 * Usa variável de ambiente CASAFARI_API_KEY se não for fornecida configuração
 */
export function createCasafariService(config?: Partial<CasafariConfig>): CasafariService {
  const apiKey = config?.apiKey || process.env.CASAFARI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('Casafari API key is required. Set CASAFARI_API_KEY environment variable or provide in config.');
  }
  
  return new CasafariService({
    apiKey,
    baseUrl: config?.baseUrl,
    timeout: config?.timeout,
  });
}
