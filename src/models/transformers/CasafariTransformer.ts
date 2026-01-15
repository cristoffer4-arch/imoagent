/**
 * CasafariTransformer - Transforma dados do Casafari para o modelo canônico
 * 
 * Casafari é uma plataforma de dados imobiliários que agrega informações
 * de múltiplos portais. Este transformer converte os dados do formato
 * Casafari para o PropertyCanonicalModel.
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
 * Interface para dados brutos do Casafari
 */
export interface CasafariRawData {
  id: string;
  propertyType?: string;
  transactionType?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    postalCode?: string;
    parish?: string;
    municipality?: string;
    district?: string;
    country?: string;
  };
  price?: {
    value?: number;
    currency?: string;
  };
  characteristics?: {
    grossArea?: number;
    netArea?: number;
    landArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    floor?: number;
    totalFloors?: number;
    condition?: string;
    energyCertificate?: string;
    typology?: string;
  };
  features?: {
    [key: string]: boolean;
  };
  title?: string;
  description?: string;
  images?: Array<{
    url: string;
    order?: number;
  }>;
  source?: {
    portal?: string;
    url?: string;
    agency?: string;
    publishedDate?: string;
    lastUpdated?: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Transformer para dados do Casafari
 */
export class CasafariTransformer {
  /**
   * Transforma dados brutos do Casafari para o modelo canônico
   */
  static transform(
    casafariData: CasafariRawData,
    tenantId: string,
    teamId?: string
  ): PropertyCanonicalModel {
    const propertyData: Partial<PropertyCanonicalModel> = {
      id: `casafari_${casafariData.id}`,
      tenantId,
      teamId,
      type: this.mapPropertyType(casafariData.propertyType),
      location: this.transformLocation(casafariData.location),
      price: this.transformPrice(casafariData),
      characteristics: this.transformCharacteristics(casafariData.characteristics, casafariData.features),
      metadata: this.transformMetadata(casafariData),
      title: casafariData.title,
      description: casafariData.description,
      images: this.transformImages(casafariData.images),
    };

    return new PropertyCanonicalModel(propertyData);
  }

  /**
   * Mapeia tipo de propriedade do Casafari para o enum PropertyType
   */
  private static mapPropertyType(type?: string): PropertyType {
    if (!type) return PropertyType.OTHER;

    const typeMap: Record<string, PropertyType> = {
      apartment: PropertyType.APARTMENT,
      apartamento: PropertyType.APARTMENT,
      house: PropertyType.HOUSE,
      moradia: PropertyType.HOUSE,
      villa: PropertyType.VILLA,
      land: PropertyType.LAND,
      terreno: PropertyType.LAND,
      commercial: PropertyType.COMMERCIAL,
      comercial: PropertyType.COMMERCIAL,
      office: PropertyType.OFFICE,
      escritorio: PropertyType.OFFICE,
      warehouse: PropertyType.WAREHOUSE,
      armazem: PropertyType.WAREHOUSE,
      garage: PropertyType.GARAGE,
      garagem: PropertyType.GARAGE,
    };

    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || PropertyType.OTHER;
  }

  /**
   * Transforma dados de localização
   */
  private static transformLocation(location?: CasafariRawData['location']) {
    if (!location) {
      return {
        address: {
          concelho: '',
          distrito: '',
          country: 'Portugal',
        },
      };
    }

    const postalCode = location.postalCode
      ? normalizePostalCode(location.postalCode)
      : undefined;

    return {
      coordinates:
        location.latitude && location.longitude
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : undefined,
      address: {
        street: this.extractStreet(location.address),
        postalCode: postalCode || undefined,
        freguesia: location.parish,
        concelho: location.municipality || '',
        distrito: location.district || '',
        country: location.country || 'Portugal',
      },
      formattedAddress: location.address,
    };
  }

  /**
   * Extrai nome da rua do endereço completo
   */
  private static extractStreet(address?: string): string | undefined {
    if (!address) return undefined;
    
    // Remove código postal, cidade, etc. do endereço
    const parts = address.split(',');
    return parts[0]?.trim();
  }

  /**
   * Transforma dados de preço
   */
  private static transformPrice(casafariData: CasafariRawData) {
    const price = casafariData.price;
    const transactionType = this.mapTransactionType(casafariData.transactionType);

    return {
      value: price?.value || 0,
      currency: price?.currency || 'EUR',
      transactionType,
      pricePerM2: this.calculatePricePerM2(
        price?.value,
        casafariData.characteristics?.netArea || casafariData.characteristics?.grossArea
      ),
    };
  }

  /**
   * Mapeia tipo de transação
   */
  private static mapTransactionType(type?: string): TransactionType {
    if (!type) return TransactionType.SALE;

    const normalized = type.toLowerCase().trim();
    if (normalized.includes('rent') || normalized.includes('arrendamento')) {
      return TransactionType.RENT;
    }
    if (normalized.includes('sale') || normalized.includes('venda')) {
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
   * Transforma características da propriedade
   */
  private static transformCharacteristics(
    characteristics?: CasafariRawData['characteristics'],
    features?: CasafariRawData['features']
  ) {
    if (!characteristics) return {};

    const typology = characteristics.typology
      ? normalizeTypology(characteristics.typology)
      : undefined;

    const energyRating = characteristics.energyCertificate
      ? normalizeEnergyRating(characteristics.energyCertificate)
      : undefined;

    return {
      totalArea: characteristics.grossArea,
      usefulArea: characteristics.netArea,
      landArea: characteristics.landArea,
      bedrooms: characteristics.bedrooms,
      bathrooms: characteristics.bathrooms,
      parkingSpaces: characteristics.parkingSpaces,
      floor: characteristics.floor,
      totalFloors: characteristics.totalFloors,
      condition: this.mapCondition(characteristics.condition),
      energyRating: energyRating || undefined,
      typology: typology || undefined,
      features: this.mapFeatures(features),
    };
  }

  /**
   * Mapeia condição da propriedade
   */
  private static mapCondition(condition?: string): PropertyCondition | undefined {
    if (!condition) return undefined;

    const conditionMap: Record<string, PropertyCondition> = {
      new: PropertyCondition.NEW,
      novo: PropertyCondition.NEW,
      renovated: PropertyCondition.RENOVATED,
      renovado: PropertyCondition.RENOVATED,
      good: PropertyCondition.GOOD,
      bom: PropertyCondition.GOOD,
      'to renovate': PropertyCondition.TO_RENOVATE,
      'para renovar': PropertyCondition.TO_RENOVATE,
      ruin: PropertyCondition.RUIN,
      ruina: PropertyCondition.RUIN,
    };

    const normalized = condition.toLowerCase().trim();
    return conditionMap[normalized];
  }

  /**
   * Mapeia características booleanas
   */
  private static mapFeatures(features?: CasafariRawData['features']) {
    if (!features) return {};

    const featureMap: Record<string, string> = {
      elevator: 'elevator',
      elevador: 'elevator',
      balcony: 'balcony',
      varanda: 'balcony',
      terrace: 'terrace',
      terraço: 'terrace',
      terraco: 'terrace',
      garden: 'garden',
      jardim: 'garden',
      pool: 'pool',
      piscina: 'pool',
      'air conditioning': 'airConditioning',
      'ar condicionado': 'airConditioning',
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
    };

    const mappedFeatures: Record<string, boolean> = {};
    
    for (const [key, value] of Object.entries(features)) {
      const normalizedKey = key.toLowerCase().trim();
      const mappedKey = featureMap[normalizedKey] || normalizedKey;
      mappedFeatures[mappedKey] = value;
    }

    return mappedFeatures;
  }

  /**
   * Transforma imagens
   */
  private static transformImages(images?: CasafariRawData['images']) {
    if (!images || images.length === 0) return [];

    return images.map((img, index) => ({
      url: img.url,
      order: img.order ?? index,
    }));
  }

  /**
   * Transforma metadados
   */
  private static transformMetadata(casafariData: CasafariRawData) {
    const now = new Date();
    const source = casafariData.source;

    return {
      sources: [
        {
          type: 'CASAFARI' as const,
          name: source?.portal || 'Casafari',
          id: casafariData.id,
          url: source?.url,
          agency: source?.agency,
        },
      ],
      firstSeen: source?.publishedDate ? new Date(source.publishedDate) : now,
      lastSeen: source?.lastUpdated ? new Date(source.lastUpdated) : now,
      lastUpdated: now,
      dataQuality: this.assessDataQuality(casafariData),
      validations: {
        hasValidAddress: !!(casafariData.location?.municipality && casafariData.location?.district),
        hasValidCoordinates: !!(casafariData.location?.latitude && casafariData.location?.longitude),
        hasValidPrice: !!(casafariData.price?.value && casafariData.price.value > 0),
        hasMinimumCharacteristics: !!(
          casafariData.characteristics?.bedrooms !== undefined ||
          casafariData.characteristics?.netArea !== undefined
        ),
        hasImages: !!(casafariData.images && casafariData.images.length > 0),
      },
      portalCount: 1,
      rawData: casafariData.metadata,
    };
  }

  /**
   * Avalia qualidade dos dados
   */
  private static assessDataQuality(casafariData: CasafariRawData): DataQuality {
    let score = 0;

    // Localização completa: +20
    if (casafariData.location?.municipality && casafariData.location?.district) {
      score += 20;
    }

    // Coordenadas: +20
    if (casafariData.location?.latitude && casafariData.location?.longitude) {
      score += 20;
    }

    // Preço válido: +20
    if (casafariData.price?.value && casafariData.price.value > 0) {
      score += 20;
    }

    // Características mínimas: +20
    if (
      casafariData.characteristics?.bedrooms !== undefined ||
      casafariData.characteristics?.netArea !== undefined
    ) {
      score += 20;
    }

    // Imagens: +20
    if (casafariData.images && casafariData.images.length > 0) {
      score += 20;
    }

    if (score >= 80) return DataQuality.HIGH;
    if (score >= 50) return DataQuality.MEDIUM;
    if (score >= 30) return DataQuality.LOW;
    return DataQuality.INVALID;
  }

  /**
   * Transforma múltiplas propriedades do Casafari
   */
  static transformBatch(
    casafariDataArray: CasafariRawData[],
    tenantId: string,
    teamId?: string
  ): PropertyCanonicalModel[] {
    return casafariDataArray.map(data =>
      this.transform(data, tenantId, teamId)
    );
  }
}
