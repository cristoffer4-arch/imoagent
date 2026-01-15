/**
 * CRMTransformer - Transforma dados de CRMs para o modelo canônico
 * 
 * Este transformer converte dados de sistemas CRM genéricos
 * para o PropertyCanonicalModel padronizado.
 */

import {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  PropertyCondition,
  DataQuality,
} from '../PropertyCanonicalModel';
import {
  normalizePostalCode,
  normalizeTypology,
  normalizeEnergyRating,
} from '../validators/PropertyValidator';

/**
 * Interface para dados brutos de CRM genérico
 */
export interface CRMRawData {
  id: string;
  crmName: string; // Nome do CRM (ex: "Salesforce", "HubSpot", etc.)
  
  // Campos básicos
  propertyType?: string;
  dealType?: string;
  status?: string;
  
  // Localização
  address?: string;
  street?: string;
  number?: string;
  postalCode?: string;
  city?: string;
  municipality?: string;
  district?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  // Preço
  price?: number;
  currency?: string;
  condominium?: number;
  imi?: number;
  
  // Características
  totalArea?: number;
  livingArea?: number;
  plotArea?: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  numberOfWC?: number;
  numberOfRooms?: number;
  parkingSpaces?: number;
  floor?: number;
  totalFloors?: number;
  
  // Estado e certificações
  propertyCondition?: string;
  energyCertificate?: string;
  typology?: string;
  
  // Features (podem vir como objeto ou array de strings)
  features?: Record<string, boolean> | string[];
  amenities?: string[];
  
  // Textos
  title?: string;
  description?: string;
  notes?: string;
  
  // Mídia
  photos?: Array<{
    url: string;
    title?: string;
    position?: number;
  }>;
  
  // Metadados
  owner?: string;
  agent?: string;
  agency?: string;
  createdDate?: string;
  modifiedDate?: string;
  viewCount?: number;
  
  // Dados customizados
  customFields?: Record<string, any>;
}

/**
 * Transformer para dados de CRM
 */
export class CRMTransformer {
  /**
   * Transforma dados brutos de CRM para o modelo canônico
   */
  static transform(
    crmData: CRMRawData,
    tenantId: string,
    teamId?: string
  ): PropertyCanonicalModel {
    const propertyData: Partial<PropertyCanonicalModel> = {
      id: `crm_${crmData.crmName}_${crmData.id}`,
      tenantId,
      teamId,
      type: this.mapPropertyType(crmData.propertyType),
      location: this.transformLocation(crmData),
      price: this.transformPrice(crmData),
      characteristics: this.transformCharacteristics(crmData),
      metadata: this.transformMetadata(crmData),
      title: crmData.title,
      description: this.buildDescription(crmData),
      images: this.transformImages(crmData.photos),
    };

    return new PropertyCanonicalModel(propertyData);
  }

  /**
   * Mapeia tipo de propriedade
   */
  private static mapPropertyType(type?: string): PropertyType {
    if (!type) return PropertyType.OTHER;

    const typeMap: Record<string, PropertyType> = {
      apartment: PropertyType.APARTMENT,
      apartamento: PropertyType.APARTMENT,
      flat: PropertyType.APARTMENT,
      house: PropertyType.HOUSE,
      moradia: PropertyType.HOUSE,
      villa: PropertyType.VILLA,
      land: PropertyType.LAND,
      terreno: PropertyType.LAND,
      plot: PropertyType.LAND,
      commercial: PropertyType.COMMERCIAL,
      comercial: PropertyType.COMMERCIAL,
      retail: PropertyType.COMMERCIAL,
      office: PropertyType.OFFICE,
      escritorio: PropertyType.OFFICE,
      escritório: PropertyType.OFFICE,
      warehouse: PropertyType.WAREHOUSE,
      armazem: PropertyType.WAREHOUSE,
      armazém: PropertyType.WAREHOUSE,
      industrial: PropertyType.WAREHOUSE,
      garage: PropertyType.GARAGE,
      garagem: PropertyType.GARAGE,
      parking: PropertyType.GARAGE,
    };

    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || PropertyType.OTHER;
  }

  /**
   * Transforma dados de localização
   */
  private static transformLocation(crmData: CRMRawData) {
    const postalCode = crmData.postalCode
      ? normalizePostalCode(crmData.postalCode)
      : undefined;

    // Tenta determinar concelho e distrito
    const concelho = crmData.municipality || crmData.city || '';
    const distrito = crmData.district || '';

    return {
      coordinates:
        crmData.latitude && crmData.longitude
          ? {
              latitude: crmData.latitude,
              longitude: crmData.longitude,
            }
          : undefined,
      address: {
        street: crmData.street,
        number: crmData.number,
        postalCode: postalCode || undefined,
        freguesia: undefined, // CRMs geralmente não têm este nível de detalhe
        concelho,
        distrito,
        country: crmData.country || 'Portugal',
      },
      formattedAddress: this.buildFormattedAddress(crmData),
    };
  }

  /**
   * Constrói endereço formatado
   */
  private static buildFormattedAddress(crmData: CRMRawData): string | undefined {
    if (crmData.address) return crmData.address;

    const parts = [];
    if (crmData.street) parts.push(crmData.street);
    if (crmData.number) parts.push(crmData.number);
    if (crmData.postalCode) parts.push(crmData.postalCode);
    if (crmData.city || crmData.municipality) {
      parts.push(crmData.city || crmData.municipality);
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  /**
   * Transforma dados de preço
   */
  private static transformPrice(crmData: CRMRawData) {
    const transactionType = this.mapTransactionType(crmData.dealType);

    return {
      value: crmData.price || 0,
      currency: crmData.currency || 'EUR',
      transactionType,
      condominium: crmData.condominium,
      imiTax: crmData.imi,
      pricePerM2: this.calculatePricePerM2(
        crmData.price,
        crmData.livingArea || crmData.totalArea
      ),
    };
  }

  /**
   * Mapeia tipo de transação
   */
  private static mapTransactionType(dealType?: string): TransactionType {
    if (!dealType) return TransactionType.SALE;

    const normalized = dealType.toLowerCase().trim();
    if (normalized.includes('rent') || normalized.includes('arrendamento') || normalized.includes('aluguer')) {
      return TransactionType.RENT;
    }
    if (normalized.includes('sale') || normalized.includes('venda') || normalized.includes('compra')) {
      return TransactionType.SALE;
    }

    return TransactionType.SALE;
  }

  /**
   * Calcula preço por m²
   */
  private static calculatePricePerM2(
    price?: number,
    area?: number
  ): number | undefined {
    if (!price || !area || area <= 0) return undefined;
    return Math.round((price / area) * 100) / 100;
  }

  /**
   * Transforma características
   */
  private static transformCharacteristics(crmData: CRMRawData) {
    const typology = crmData.typology
      ? normalizeTypology(crmData.typology)
      : this.inferTypology(crmData.numberOfBedrooms);

    const energyRating = crmData.energyCertificate
      ? normalizeEnergyRating(crmData.energyCertificate)
      : undefined;

    return {
      totalArea: crmData.totalArea,
      usefulArea: crmData.livingArea,
      landArea: crmData.plotArea,
      bedrooms: crmData.numberOfBedrooms,
      bathrooms: crmData.numberOfBathrooms,
      wc: crmData.numberOfWC,
      rooms: crmData.numberOfRooms,
      parkingSpaces: crmData.parkingSpaces,
      floor: crmData.floor,
      totalFloors: crmData.totalFloors,
      condition: this.mapCondition(crmData.propertyCondition),
      energyRating: energyRating || undefined,
      typology: typology || undefined,
      features: this.mapFeatures(crmData.features, crmData.amenities),
    };
  }

  /**
   * Infere tipologia a partir do número de quartos
   */
  private static inferTypology(bedrooms?: number): string | undefined {
    if (bedrooms === undefined) return undefined;
    if (bedrooms >= 5) return 'T5+';
    return `T${bedrooms}`;
  }

  /**
   * Mapeia condição da propriedade
   */
  private static mapCondition(condition?: string): PropertyCondition | undefined {
    if (!condition) return undefined;

    const conditionMap: Record<string, PropertyCondition> = {
      new: PropertyCondition.NEW,
      novo: PropertyCondition.NEW,
      'brand new': PropertyCondition.NEW,
      renovated: PropertyCondition.RENOVATED,
      renovado: PropertyCondition.RENOVATED,
      refurbished: PropertyCondition.RENOVATED,
      good: PropertyCondition.GOOD,
      bom: PropertyCondition.GOOD,
      excellent: PropertyCondition.GOOD,
      'to renovate': PropertyCondition.TO_RENOVATE,
      'para renovar': PropertyCondition.TO_RENOVATE,
      'needs renovation': PropertyCondition.TO_RENOVATE,
      ruin: PropertyCondition.RUIN,
      ruina: PropertyCondition.RUIN,
      'to restore': PropertyCondition.RUIN,
    };

    const normalized = condition.toLowerCase().trim();
    return conditionMap[normalized];
  }

  /**
   * Mapeia características e amenidades
   */
  private static mapFeatures(
    features?: Record<string, boolean> | string[],
    amenities?: string[]
  ) {
    const mappedFeatures: Record<string, boolean> = {};

    // Processa features se for objeto
    if (features && typeof features === 'object' && !Array.isArray(features)) {
      for (const [key, value] of Object.entries(features)) {
        const normalizedKey = this.normalizeFeatureKey(key);
        if (normalizedKey) {
          mappedFeatures[normalizedKey] = value;
        }
      }
    }

    // Processa features se for array
    if (features && Array.isArray(features)) {
      for (const feature of features) {
        const normalizedKey = this.normalizeFeatureKey(feature);
        if (normalizedKey) {
          mappedFeatures[normalizedKey] = true;
        }
      }
    }

    // Processa amenities
    if (amenities && Array.isArray(amenities)) {
      for (const amenity of amenities) {
        const normalizedKey = this.normalizeFeatureKey(amenity);
        if (normalizedKey) {
          mappedFeatures[normalizedKey] = true;
        }
      }
    }

    return Object.keys(mappedFeatures).length > 0 ? mappedFeatures : undefined;
  }

  /**
   * Normaliza nome da feature
   */
  private static normalizeFeatureKey(key: string): string | null {
    const featureMap: Record<string, string> = {
      elevator: 'elevator',
      elevador: 'elevator',
      lift: 'elevator',
      balcony: 'balcony',
      varanda: 'balcony',
      terrace: 'terrace',
      terraço: 'terrace',
      terraco: 'terrace',
      garden: 'garden',
      jardim: 'garden',
      pool: 'pool',
      piscina: 'pool',
      'swimming pool': 'pool',
      'air conditioning': 'airConditioning',
      'ar condicionado': 'airConditioning',
      'a/c': 'airConditioning',
      heating: 'heating',
      aquecimento: 'heating',
      fireplace: 'fireplace',
      lareira: 'fireplace',
      storage: 'storage',
      arrumos: 'storage',
      furnished: 'furnished',
      mobilado: 'furnished',
      'pets allowed': 'petsAllowed',
      'animais permitidos': 'petsAllowed',
      pets: 'petsAllowed',
    };

    const normalized = key.toLowerCase().trim();
    return featureMap[normalized] || null;
  }

  /**
   * Constrói descrição completa
   */
  private static buildDescription(crmData: CRMRawData): string | undefined {
    const parts = [];
    
    if (crmData.description) {
      parts.push(crmData.description);
    }
    
    if (crmData.notes) {
      parts.push(`\n\nNotas: ${crmData.notes}`);
    }

    return parts.length > 0 ? parts.join('\n') : undefined;
  }

  /**
   * Transforma imagens
   */
  private static transformImages(photos?: CRMRawData['photos']) {
    if (!photos || photos.length === 0) return [];

    return photos.map((photo, index) => ({
      url: photo.url,
      caption: photo.title,
      order: photo.position ?? index,
    }));
  }

  /**
   * Transforma metadados
   */
  private static transformMetadata(crmData: CRMRawData) {
    const now = new Date();

    return {
      sources: [
        {
          type: 'CRM' as const,
          name: crmData.crmName,
          id: crmData.id,
          agency: crmData.agency,
        },
      ],
      firstSeen: crmData.createdDate ? new Date(crmData.createdDate) : now,
      lastSeen: crmData.modifiedDate ? new Date(crmData.modifiedDate) : now,
      lastUpdated: now,
      dataQuality: this.assessDataQuality(crmData),
      validations: {
        hasValidAddress: !!(
          (crmData.municipality || crmData.city) &&
          crmData.district
        ),
        hasValidCoordinates: !!(crmData.latitude && crmData.longitude),
        hasValidPrice: !!(crmData.price && crmData.price > 0),
        hasMinimumCharacteristics: !!(
          crmData.numberOfBedrooms !== undefined ||
          crmData.totalArea !== undefined ||
          crmData.livingArea !== undefined
        ),
        hasImages: !!(crmData.photos && crmData.photos.length > 0),
      },
      portalCount: 1,
      viewCount: crmData.viewCount,
      rawData: crmData.customFields,
    };
  }

  /**
   * Avalia qualidade dos dados
   */
  private static assessDataQuality(crmData: CRMRawData): DataQuality {
    let score = 0;

    // Localização: +20
    if ((crmData.municipality || crmData.city) && crmData.district) {
      score += 20;
    }

    // Coordenadas: +20
    if (crmData.latitude && crmData.longitude) {
      score += 20;
    }

    // Preço: +20
    if (crmData.price && crmData.price > 0) {
      score += 20;
    }

    // Características: +20
    if (
      crmData.numberOfBedrooms !== undefined ||
      crmData.totalArea !== undefined ||
      crmData.livingArea !== undefined
    ) {
      score += 20;
    }

    // Imagens: +20
    if (crmData.photos && crmData.photos.length > 0) {
      score += 20;
    }

    if (score >= 80) return DataQuality.HIGH;
    if (score >= 50) return DataQuality.MEDIUM;
    if (score >= 30) return DataQuality.LOW;
    return DataQuality.INVALID;
  }

  /**
   * Transforma múltiplas propriedades de CRM
   */
  static transformBatch(
    crmDataArray: CRMRawData[],
    tenantId: string,
    teamId?: string
  ): PropertyCanonicalModel[] {
    return crmDataArray.map(data => this.transform(data, tenantId, teamId));
  }
}
