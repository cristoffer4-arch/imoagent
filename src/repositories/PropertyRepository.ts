/**
 * PropertyRepository - Repositório para operações CRUD de propriedades
 * 
 * Gerencia a persistência de PropertyCanonicalModel no Supabase,
 * com suporte para busca, deduplicação e índices otimizados.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  DataQuality,
} from '../models/PropertyCanonicalModel';
import { validateProperty } from '../models/validators/PropertyValidator';

/**
 * Filtros para busca de propriedades
 */
export interface PropertyFilters {
  tenantId?: string;
  teamId?: string;
  type?: string[];
  concelho?: string[];
  distrito?: string[];
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  areaMin?: number;
  areaMax?: number;
  transactionType?: string[];
  dataQuality?: string[];
  sources?: string[];
  hasCoordinates?: boolean;
  hasImages?: boolean;
  // Busca geográfica
  nearLatitude?: number;
  nearLongitude?: number;
  radiusKm?: number;
  // Scores de IA
  minAcquisitionScore?: number;
  minSaleScore?: number;
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Repositório de Propriedades
 */
export class PropertyRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Cria uma nova propriedade
   */
  async create(property: PropertyCanonicalModel): Promise<PropertyCanonicalModel | null> {
    // Valida dados
    const validation = validateProperty(property.toJSON());
    if (!validation.success) {
      console.error('Validation errors:', validation.errors);
      throw new Error('Invalid property data');
    }

    // Converte para formato do banco de dados
    const dbData = this.toDatabase(property);

    const { data, error } = await this.supabase
      .from('properties')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return null;
    }

    return this.fromDatabase(data);
  }

  /**
   * Busca propriedade por ID
   */
  async findById(id: string): Promise<PropertyCanonicalModel | null> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.fromDatabase(data);
  }

  /**
   * Busca propriedades por tenant
   */
  async findByTenant(
    tenantId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PropertyCanonicalModel>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (pagination?.orderBy) {
      query = query.order(pagination.orderBy, {
        ascending: pagination.orderDirection === 'asc',
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error || !data) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    return {
      data: data.map(item => this.fromDatabase(item)),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Busca propriedades com filtros
   */
  async search(
    filters: PropertyFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PropertyCanonicalModel>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase.from('properties').select('*', { count: 'exact' });

    // Aplica filtros
    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }
    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId);
    }
    if (filters.type && filters.type.length > 0) {
      query = query.in('typology', filters.type);
    }
    if (filters.concelho && filters.concelho.length > 0) {
      query = query.in('concelho', filters.concelho);
    }
    if (filters.distrito && filters.distrito.length > 0) {
      query = query.in('distrito', filters.distrito);
    }
    if (filters.priceMin !== undefined) {
      query = query.gte('price_main', filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      query = query.lte('price_main', filters.priceMax);
    }
    if (filters.bedroomsMin !== undefined) {
      query = query.gte('bedrooms', filters.bedroomsMin);
    }
    if (filters.bedroomsMax !== undefined) {
      query = query.lte('bedrooms', filters.bedroomsMax);
    }
    if (filters.areaMin !== undefined) {
      query = query.gte('area_m2', filters.areaMin);
    }
    if (filters.areaMax !== undefined) {
      query = query.lte('area_m2', filters.areaMax);
    }
    if (filters.hasCoordinates) {
      query = query.not('lat', 'is', null).not('lon', 'is', null);
    }
    if (filters.minAcquisitionScore !== undefined) {
      query = query.gte('angaria_score', filters.minAcquisitionScore);
    }
    if (filters.minSaleScore !== undefined) {
      query = query.gte('venda_score', filters.minSaleScore);
    }

    // Ordenação
    if (pagination?.orderBy) {
      query = query.order(pagination.orderBy, {
        ascending: pagination.orderDirection === 'asc',
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error || !data) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    return {
      data: data.map(item => this.fromDatabase(item)),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Busca propriedades próximas (busca geográfica)
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: Omit<PropertyFilters, 'nearLatitude' | 'nearLongitude' | 'radiusKm'>,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PropertyCanonicalModel>> {
    // Nota: Para busca geográfica eficiente, você deve usar PostGIS no Supabase
    // Esta é uma implementação simplificada
    
    const allProperties = await this.search(filters || {}, {
      page: 1,
      pageSize: 1000, // Busca mais propriedades para filtrar
    });

    // Filtra por distância
    const nearbyProperties = allProperties.data.filter(prop => {
      if (!prop.location.coordinates) return false;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        prop.location.coordinates.latitude,
        prop.location.coordinates.longitude
      );

      return distance <= radiusKm * 1000; // Converte km para metros
    });

    // Ordena por distância
    nearbyProperties.sort((a, b) => {
      const distA = this.calculateDistance(
        latitude,
        longitude,
        a.location.coordinates!.latitude,
        a.location.coordinates!.longitude
      );
      const distB = this.calculateDistance(
        latitude,
        longitude,
        b.location.coordinates!.latitude,
        b.location.coordinates!.longitude
      );
      return distA - distB;
    });

    // Pagina resultados
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;
    const paginatedData = nearbyProperties.slice(offset, offset + pageSize);

    return {
      data: paginatedData,
      total: nearbyProperties.length,
      page,
      pageSize,
      totalPages: Math.ceil(nearbyProperties.length / pageSize),
    };
  }

  /**
   * Atualiza uma propriedade
   */
  async update(
    id: string,
    property: Partial<PropertyCanonicalModel>
  ): Promise<PropertyCanonicalModel | null> {
    const dbData = this.toDatabase(property as PropertyCanonicalModel);

    const { data, error } = await this.supabase
      .from('properties')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating property:', error);
      return null;
    }

    return this.fromDatabase(data);
  }

  /**
   * Deleta uma propriedade
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('properties').delete().eq('id', id);

    return !error;
  }

  /**
   * Busca propriedades duplicadas baseado em localização e características
   */
  async findDuplicates(
    property: PropertyCanonicalModel,
    threshold: number = 100
  ): Promise<PropertyCanonicalModel[]> {
    if (!property.location.coordinates) {
      return [];
    }

    // Busca propriedades próximas
    const nearby = await this.searchNearby(
      property.location.coordinates.latitude,
      property.location.coordinates.longitude,
      0.5, // 500 metros
      {
        tenantId: property.tenantId,
        bedroomsMin: property.characteristics.bedrooms
          ? property.characteristics.bedrooms - 1
          : undefined,
        bedroomsMax: property.characteristics.bedrooms
          ? property.characteristics.bedrooms + 1
          : undefined,
      }
    );

    // Filtra duplicados com base em similaridade
    return nearby.data.filter(
      other =>
        other.id !== property.id &&
        this.calculateSimilarity(property, other) >= threshold
    );
  }

  /**
   * Calcula similaridade entre duas propriedades (0-100)
   */
  private calculateSimilarity(
    prop1: PropertyCanonicalModel,
    prop2: PropertyCanonicalModel
  ): number {
    let score = 0;
    let maxScore = 0;

    // Tipo (20 pontos)
    maxScore += 20;
    if (prop1.type === prop2.type) {
      score += 20;
    }

    // Quartos (20 pontos)
    maxScore += 20;
    if (
      prop1.characteristics.bedrooms !== undefined &&
      prop2.characteristics.bedrooms !== undefined
    ) {
      const diff = Math.abs(
        prop1.characteristics.bedrooms - prop2.characteristics.bedrooms
      );
      score += Math.max(0, 20 - diff * 10);
    }

    // Área (20 pontos)
    maxScore += 20;
    if (
      prop1.characteristics.totalArea !== undefined &&
      prop2.characteristics.totalArea !== undefined
    ) {
      const diff =
        Math.abs(prop1.characteristics.totalArea - prop2.characteristics.totalArea) /
        prop1.characteristics.totalArea;
      score += Math.max(0, 20 - diff * 100);
    }

    // Preço (20 pontos)
    maxScore += 20;
    if (prop1.price.value > 0 && prop2.price.value > 0) {
      const diff = Math.abs(prop1.price.value - prop2.price.value) / prop1.price.value;
      score += Math.max(0, 20 - diff * 100);
    }

    // Distância (20 pontos)
    maxScore += 20;
    if (prop1.location.coordinates && prop2.location.coordinates) {
      const distance = this.calculateDistance(
        prop1.location.coordinates.latitude,
        prop1.location.coordinates.longitude,
        prop2.location.coordinates.latitude,
        prop2.location.coordinates.longitude
      );
      score += Math.max(0, 20 - distance / 10);
    }

    return (score / maxScore) * 100;
  }

  /**
   * Calcula distância entre coordenadas (em metros)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Converte PropertyCanonicalModel para formato do banco de dados
   */
  private toDatabase(property: PropertyCanonicalModel): any {
    return {
      id: property.id,
      tenant_id: property.tenantId,
      team_id: property.teamId,
      lat: property.location.coordinates?.latitude,
      lon: property.location.coordinates?.longitude,
      geohash: property.location.geohash,
      freguesia: property.location.address.freguesia,
      concelho: property.location.address.concelho,
      distrito: property.location.address.distrito,
      typology: property.characteristics.typology,
      area_m2: property.characteristics.totalArea,
      bedrooms: property.characteristics.bedrooms,
      bathrooms: property.characteristics.bathrooms,
      features: property.characteristics.features,
      condition: property.characteristics.condition,
      price_main: property.price.value,
      price_min: property.price.priceRange?.min,
      price_max: property.price.priceRange?.max,
      price_divergence_pct: property.price.priceRange?.divergencePercentage,
      portal_count: property.metadata.portalCount,
      sources: property.metadata.sources,
      first_seen: property.metadata.firstSeen.toISOString(),
      last_seen: property.metadata.lastSeen.toISOString(),
      angaria_score: property.aiScores?.acquisitionScore,
      venda_score: property.aiScores?.saleScore,
      availability_probability: property.aiScores?.availabilityProbability,
      top_reasons: property.aiScores?.topReasons,
      created_at: property.createdAt.toISOString(),
      updated_at: property.updatedAt.toISOString(),
    };
  }

  /**
   * Converte dados do banco para PropertyCanonicalModel
   */
  private fromDatabase(data: any): PropertyCanonicalModel {
    return new PropertyCanonicalModel({
      id: data.id,
      tenantId: data.tenant_id,
      teamId: data.team_id,
      type: data.typology || PropertyType.OTHER,
      location: {
        coordinates: data.lat && data.lon ? {
          latitude: data.lat,
          longitude: data.lon,
        } : undefined,
        address: {
          freguesia: data.freguesia,
          concelho: data.concelho,
          distrito: data.distrito,
          country: 'Portugal',
        },
        geohash: data.geohash,
      },
      price: {
        value: data.price_main || 0,
        currency: 'EUR',
        transactionType: TransactionType.SALE,
        priceRange: data.price_min && data.price_max ? {
          min: data.price_min,
          max: data.price_max,
          divergencePercentage: data.price_divergence_pct || 0,
        } : undefined,
      },
      characteristics: {
        typology: data.typology,
        totalArea: data.area_m2,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        features: data.features,
        condition: data.condition,
      },
      metadata: {
        sources: data.sources || [],
        firstSeen: new Date(data.first_seen),
        lastSeen: new Date(data.last_seen),
        lastUpdated: new Date(data.updated_at),
        dataQuality: DataQuality.MEDIUM,
        portalCount: data.portal_count,
      },
      aiScores: {
        acquisitionScore: data.angaria_score,
        saleScore: data.venda_score,
        availabilityProbability: data.availability_probability,
        topReasons: data.top_reasons,
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
