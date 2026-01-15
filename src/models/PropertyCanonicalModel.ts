/**
 * PropertyCanonicalModel - Modelo canônico para padronização de propriedades
 * 
 * Este modelo serve como a representação padronizada de uma propriedade imobiliária,
 * independente da fonte de dados (Casafari, CRMs, Portais).
 */

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
  OFFICE = 'OFFICE',
  WAREHOUSE = 'WAREHOUSE',
  GARAGE = 'GARAGE',
  OTHER = 'OTHER',
}

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT',
  SALE_OR_RENT = 'SALE_OR_RENT',
}

export enum PropertyCondition {
  NEW = 'NEW',
  RENOVATED = 'RENOVATED',
  GOOD = 'GOOD',
  TO_RENOVATE = 'TO_RENOVATE',
  RUIN = 'RUIN',
}

export enum DataQuality {
  HIGH = 'HIGH',      // Dados completos e validados
  MEDIUM = 'MEDIUM',  // Dados parciais mas utilizáveis
  LOW = 'LOW',        // Dados mínimos ou não validados
  INVALID = 'INVALID', // Dados incompletos ou inválidos
}

/**
 * Localização com coordenadas geográficas e endereço estruturado
 */
export interface PropertyLocation {
  // Coordenadas geográficas
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number; // Precisão em metros
  };
  
  // Endereço estruturado (Portugal)
  address: {
    street?: string;        // Rua/Avenida
    number?: string;        // Número
    postalCode?: string;    // Código postal (XXXX-XXX)
    freguesia?: string;     // Freguesia
    concelho: string;       // Concelho (obrigatório)
    distrito: string;       // Distrito (obrigatório)
    country: string;        // País (default: "Portugal")
  };
  
  // Dados derivados para busca
  geohash?: string;         // Geohash para busca espacial
  formattedAddress?: string; // Endereço formatado completo
}

/**
 * Informações de preço e condições comerciais
 */
export interface PropertyPrice {
  value: number;              // Valor principal
  currency: string;           // Moeda (default: "EUR")
  transactionType: TransactionType; // Tipo de negociação
  
  // Informações adicionais
  condominium?: number;       // Condomínio mensal (para arrendamento)
  imiTax?: number;            // IMI anual (para venda)
  pricePerM2?: number;        // Preço por m²
  
  // Agregação de múltiplas fontes
  priceRange?: {
    min: number;
    max: number;
    divergencePercentage: number; // % de diferença entre fontes
  };
}

/**
 * Características físicas do imóvel
 */
export interface PropertyCharacteristics {
  // Áreas
  totalArea?: number;         // Área total em m²
  usefulArea?: number;        // Área útil em m²
  landArea?: number;          // Área do terreno em m²
  
  // Divisões
  bedrooms?: number;          // Número de quartos
  bathrooms?: number;         // Número de casas de banho
  wc?: number;                // WC (pode ser diferente de bathrooms)
  rooms?: number;             // Total de divisões
  
  // Extras
  parkingSpaces?: number;     // Vagas de garagem
  floor?: number;             // Andar
  totalFloors?: number;       // Total de andares do edifício
  
  // Características booleanas
  features?: {
    elevator?: boolean;
    balcony?: boolean;
    terrace?: boolean;
    garden?: boolean;
    pool?: boolean;
    airConditioning?: boolean;
    heating?: boolean;
    fireplace?: boolean;
    storage?: boolean;
    furnished?: boolean;
    petsAllowed?: boolean;
  };
  
  // Estado/Condição
  condition?: PropertyCondition;
  
  // Energia
  energyRating?: string;      // Certificado energético (A+, A, B, C, etc.)
  
  // Tipologia (formato português)
  typology?: string;          // T0, T1, T2, T3, T4, T5+
}

/**
 * Metadados sobre a origem e qualidade dos dados
 */
export interface PropertyMetadata {
  // Origem dos dados
  sources: {
    type: 'PORTAL' | 'CRM' | 'CASAFARI' | 'MANUAL';
    name: string;             // Nome da fonte (ex: "Idealista", "Imovirtual")
    id: string;               // ID na fonte original
    url?: string;             // URL do anúncio (se aplicável)
    agency?: string;          // Agência/anunciante
  }[];
  
  // Temporal
  firstSeen: Date;            // Primeira vez que o imóvel foi detectado
  lastSeen: Date;             // Última atualização
  lastUpdated: Date;          // Última modificação dos dados
  
  // Qualidade dos dados
  dataQuality: DataQuality;
  qualityScore?: number;      // Score 0-100
  
  // Validações
  validations?: {
    hasValidAddress: boolean;
    hasValidCoordinates: boolean;
    hasValidPrice: boolean;
    hasMinimumCharacteristics: boolean;
    hasImages: boolean;
  };
  
  // Estatísticas
  portalCount?: number;       // Número de portais onde aparece
  viewCount?: number;         // Número de visualizações
  
  // Deduplicação
  duplicateOf?: string;       // ID do imóvel principal (se for duplicado)
  similarProperties?: string[]; // IDs de imóveis similares
  
  // Dados brutos
  rawData?: Record<string, any>; // Dados originais não estruturados
}

/**
 * Modelo Canônico de Propriedade
 * 
 * Representa uma propriedade imobiliária com todos os dados padronizados,
 * independente da fonte original.
 */
export class PropertyCanonicalModel {
  id: string;
  tenantId: string;           // ID do tenant (multi-tenancy)
  teamId?: string;            // ID da equipe (opcional)
  
  // Dados principais
  type: PropertyType;
  location: PropertyLocation;
  price: PropertyPrice;
  characteristics: PropertyCharacteristics;
  metadata: PropertyMetadata;
  
  // Descrição e mídia
  title?: string;
  description?: string;
  images?: {
    url: string;
    thumbnail?: string;
    caption?: string;
    order?: number;
    hash?: string;            // Hash perceptual para deduplicação
  }[];
  
  // Scores de IA (calculados posteriormente)
  aiScores?: {
    acquisitionScore?: number;  // Score de angariação (0-100)
    saleScore?: number;         // Score de venda (0-100)
    availabilityProbability?: number; // Probabilidade de disponibilidade (0-1)
    topReasons?: string[];      // Principais razões para os scores
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<PropertyCanonicalModel>) {
    this.id = data.id || this.generateId();
    this.tenantId = data.tenantId || '';
    this.teamId = data.teamId;
    this.type = data.type || PropertyType.OTHER;
    this.location = data.location || this.getDefaultLocation();
    this.price = data.price || this.getDefaultPrice();
    this.characteristics = data.characteristics || {};
    this.metadata = data.metadata || this.getDefaultMetadata();
    this.title = data.title;
    this.description = data.description;
    this.images = data.images || [];
    this.aiScores = data.aiScores;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Gera um ID único para a propriedade
   * 
   * NOTA: Em produção, considere usar crypto.randomUUID() ou biblioteca
   * 'uuid' para garantias mais fortes de unicidade em cenários de alta frequência.
   */
  private generateId(): string {
    return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Retorna localização padrão
   */
  private getDefaultLocation(): PropertyLocation {
    return {
      address: {
        concelho: '',
        distrito: '',
        country: 'Portugal',
      },
    };
  }

  /**
   * Retorna preço padrão
   */
  private getDefaultPrice(): PropertyPrice {
    return {
      value: 0,
      currency: 'EUR',
      transactionType: TransactionType.SALE,
    };
  }

  /**
   * Retorna metadados padrão
   */
  private getDefaultMetadata(): PropertyMetadata {
    const now = new Date();
    return {
      sources: [],
      firstSeen: now,
      lastSeen: now,
      lastUpdated: now,
      dataQuality: DataQuality.LOW,
    };
  }

  /**
   * Valida se a propriedade tem dados mínimos necessários
   */
  isValid(): boolean {
    return !!(
      this.tenantId &&
      this.location.address.concelho &&
      this.location.address.distrito &&
      this.price.value > 0 &&
      this.metadata.sources.length > 0
    );
  }

  /**
   * Calcula a qualidade dos dados baseado nas informações disponíveis
   */
  calculateDataQuality(): DataQuality {
    const validations = this.metadata.validations || {
      hasValidAddress: false,
      hasValidCoordinates: false,
      hasValidPrice: false,
      hasMinimumCharacteristics: false,
      hasImages: false,
    };

    const trueCount = Object.values(validations).filter(Boolean).length;
    const percentage = (trueCount / Object.keys(validations).length) * 100;

    if (percentage >= 80) return DataQuality.HIGH;
    if (percentage >= 50) return DataQuality.MEDIUM;
    if (percentage >= 30) return DataQuality.LOW;
    return DataQuality.INVALID;
  }

  /**
   * Atualiza a propriedade com novos dados, mesclando informações
   */
  merge(other: Partial<PropertyCanonicalModel>): void {
    if (other.title && !this.title) this.title = other.title;
    if (other.description && !this.description) this.description = other.description;
    
    // Mescla localização
    if (other.location) {
      if (other.location.coordinates && !this.location.coordinates) {
        this.location.coordinates = other.location.coordinates;
      }
      if (other.location.address) {
        this.location.address = {
          ...this.location.address,
          ...other.location.address,
        };
      }
    }
    
    // Mescla características
    if (other.characteristics) {
      this.characteristics = {
        ...this.characteristics,
        ...other.characteristics,
        features: {
          ...this.characteristics.features,
          ...other.characteristics.features,
        },
      };
    }
    
    // Adiciona novas fontes
    if (other.metadata?.sources) {
      const existingSourceIds = this.metadata.sources.map(s => s.id);
      const newSources = other.metadata.sources.filter(
        s => !existingSourceIds.includes(s.id)
      );
      this.metadata.sources.push(...newSources);
    }
    
    // Adiciona novas imagens
    if (other.images) {
      const existingUrls = this.images?.map(img => img.url) || [];
      const newImages = other.images.filter(img => !existingUrls.includes(img.url));
      this.images = [...(this.images || []), ...newImages];
    }
    
    this.updatedAt = new Date();
    this.metadata.lastUpdated = new Date();
  }

  /**
   * Converte o modelo para um objeto simples (para serialização)
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      teamId: this.teamId,
      type: this.type,
      location: this.location,
      price: this.price,
      characteristics: this.characteristics,
      metadata: {
        ...this.metadata,
        firstSeen: this.metadata.firstSeen.toISOString(),
        lastSeen: this.metadata.lastSeen.toISOString(),
        lastUpdated: this.metadata.lastUpdated.toISOString(),
      },
      title: this.title,
      description: this.description,
      images: this.images,
      aiScores: this.aiScores,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Cria uma instância a partir de um objeto JSON
   */
  static fromJSON(json: any): PropertyCanonicalModel {
    return new PropertyCanonicalModel({
      ...json,
      metadata: {
        ...json.metadata,
        firstSeen: new Date(json.metadata.firstSeen),
        lastSeen: new Date(json.metadata.lastSeen),
        lastUpdated: new Date(json.metadata.lastUpdated),
      },
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    });
  }
}
