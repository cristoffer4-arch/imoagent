/**
 * LeadTransformer - Transforma leads entre CRM e modelo canônico
 * 
 * Converte dados de leads entre o formato dos CRMs e o formato canônico
 * do Imoagent, seguindo o padrão do PropertyCanonicalModel.
 */

import {
  Lead,
  LeadStatus,
  LeadSource,
  LeadInterestType,
} from '../../types/crm';

/**
 * Interface para dados brutos de Lead vindo de CRM
 */
export interface CRMLeadRawData {
  id: string;
  crmName: string;
  
  // Informações básicas
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Status
  status?: string;
  stage?: string;
  source?: string;
  leadSource?: string;
  
  // Classificação
  score?: number;
  rating?: string; // Hot, Warm, Cold
  priority?: string;
  
  // Interesse
  interest?: string;
  interestType?: string;
  propertyId?: string;
  propertyReference?: string;
  
  // Localização
  city?: string;
  municipality?: string;
  concelho?: string;
  district?: string;
  distrito?: string;
  parish?: string;
  freguesia?: string;
  
  // Orçamento
  budget?: number;
  minBudget?: number;
  maxBudget?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  
  // Comunicação
  message?: string;
  description?: string;
  notes?: string;
  comments?: string;
  
  // Metadados
  agentId?: string;
  ownerId?: string;
  assignedTo?: string;
  lastContactDate?: string;
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  nextFollowUp?: string;
  createdDate?: string;
  createdAt?: string;
  modifiedDate?: string;
  updatedAt?: string;
  
  // Campos customizados
  customFields?: Record<string, any>;
}

/**
 * Transformer para leads de CRM
 */
export class LeadTransformer {
  /**
   * Transforma dados brutos de CRM para modelo canônico
   */
  static transform(
    crmData: CRMLeadRawData,
    tenantId: string,
    teamId?: string
  ): Lead {
    return {
      id: `lead_${crmData.crmName}_${crmData.id}`,
      tenantId,
      teamId,
      name: this.buildFullName(crmData),
      email: crmData.email,
      phone: crmData.phone || crmData.mobile,
      status: this.mapStatus(crmData.status || crmData.stage),
      source: this.mapSource(crmData.source || crmData.leadSource),
      score: this.mapScore(crmData.score, crmData.rating),
      interestType: this.mapInterestType(crmData.interest || crmData.interestType),
      propertyId: crmData.propertyId || crmData.propertyReference,
      locationInterest: this.transformLocation(crmData),
      budget: this.transformBudget(crmData),
      message: crmData.message || crmData.description,
      notes: this.buildNotes(crmData),
      metadata: this.transformMetadata(crmData),
    };
  }

  /**
   * Constrói nome completo
   */
  private static buildFullName(crmData: CRMLeadRawData): string {
    if (crmData.name) return crmData.name;
    
    const parts = [];
    if (crmData.firstName) parts.push(crmData.firstName);
    if (crmData.lastName) parts.push(crmData.lastName);
    
    return parts.length > 0 ? parts.join(' ') : 'Nome não informado';
  }

  /**
   * Mapeia status do lead
   */
  private static mapStatus(status?: string): LeadStatus {
    if (!status) return LeadStatus.NEW;

    const statusMap: Record<string, LeadStatus> = {
      new: LeadStatus.NEW,
      novo: LeadStatus.NEW,
      open: LeadStatus.NEW,
      aberto: LeadStatus.NEW,
      contacted: LeadStatus.CONTACTED,
      contatado: LeadStatus.CONTACTED,
      'in contact': LeadStatus.CONTACTED,
      'em contato': LeadStatus.CONTACTED,
      qualified: LeadStatus.QUALIFIED,
      qualificado: LeadStatus.QUALIFIED,
      'working': LeadStatus.QUALIFIED,
      'em negociacao': LeadStatus.QUALIFIED,
      'em negociação': LeadStatus.QUALIFIED,
      converted: LeadStatus.CONVERTED,
      convertido: LeadStatus.CONVERTED,
      won: LeadStatus.CONVERTED,
      ganho: LeadStatus.CONVERTED,
      closed: LeadStatus.CONVERTED,
      lost: LeadStatus.LOST,
      perdido: LeadStatus.LOST,
      'closed lost': LeadStatus.LOST,
      dead: LeadStatus.LOST,
      morto: LeadStatus.LOST,
    };

    const normalized = status.toLowerCase().trim();
    return statusMap[normalized] || LeadStatus.NEW;
  }

  /**
   * Mapeia origem do lead
   */
  private static mapSource(source?: string): LeadSource {
    if (!source) return LeadSource.OTHER;

    const sourceMap: Record<string, LeadSource> = {
      website: LeadSource.WEBSITE,
      site: LeadSource.WEBSITE,
      'web form': LeadSource.WEBSITE,
      portal: LeadSource.PORTAL,
      idealista: LeadSource.PORTAL,
      imovirtual: LeadSource.PORTAL,
      olx: LeadSource.PORTAL,
      'casa sapo': LeadSource.PORTAL,
      referral: LeadSource.REFERRAL,
      referencia: LeadSource.REFERRAL,
      'referência': LeadSource.REFERRAL,
      indicacao: LeadSource.REFERRAL,
      'indicação': LeadSource.REFERRAL,
      social: LeadSource.SOCIAL_MEDIA,
      'social media': LeadSource.SOCIAL_MEDIA,
      facebook: LeadSource.SOCIAL_MEDIA,
      instagram: LeadSource.SOCIAL_MEDIA,
      linkedin: LeadSource.SOCIAL_MEDIA,
      campaign: LeadSource.CAMPAIGN,
      campanha: LeadSource.CAMPAIGN,
      email: LeadSource.CAMPAIGN,
      ads: LeadSource.CAMPAIGN,
      anuncio: LeadSource.CAMPAIGN,
      'anúncio': LeadSource.CAMPAIGN,
    };

    const normalized = source.toLowerCase().trim();
    return sourceMap[normalized] || LeadSource.OTHER;
  }

  /**
   * Mapeia e normaliza score do lead
   */
  private static mapScore(score?: number, rating?: string): number | undefined {
    // Se já tem score numérico, usa
    if (score !== undefined) {
      return Math.min(100, Math.max(0, score));
    }

    // Converte rating qualitativo para score
    if (rating) {
      const ratingMap: Record<string, number> = {
        hot: 90,
        quente: 90,
        warm: 60,
        morno: 60,
        cold: 30,
        frio: 30,
        high: 85,
        alto: 85,
        medium: 50,
        medio: 50,
        médio: 50,
        low: 25,
        baixo: 25,
      };

      const normalized = rating.toLowerCase().trim();
      return ratingMap[normalized];
    }

    return undefined;
  }

  /**
   * Mapeia tipo de interesse
   */
  private static mapInterestType(interest?: string): LeadInterestType {
    if (!interest) return LeadInterestType.BUY;

    const interestMap: Record<string, LeadInterestType> = {
      buy: LeadInterestType.BUY,
      comprar: LeadInterestType.BUY,
      compra: LeadInterestType.BUY,
      purchase: LeadInterestType.BUY,
      sell: LeadInterestType.SELL,
      vender: LeadInterestType.SELL,
      venda: LeadInterestType.SELL,
      sale: LeadInterestType.SELL,
      rent: LeadInterestType.RENT,
      alugar: LeadInterestType.RENT,
      arrendar: LeadInterestType.RENT,
      aluguel: LeadInterestType.RENT,
      arrendamento: LeadInterestType.RENT,
      'rent out': LeadInterestType.RENT_OUT,
      'alugar propriedade': LeadInterestType.RENT_OUT,
      'arrendar propriedade': LeadInterestType.RENT_OUT,
    };

    const normalized = interest.toLowerCase().trim();
    return interestMap[normalized] || LeadInterestType.BUY;
  }

  /**
   * Transforma dados de localização
   */
  private static transformLocation(crmData: CRMLeadRawData) {
    const concelho = crmData.concelho || crmData.municipality || crmData.city;
    const distrito = crmData.distrito || crmData.district;
    const freguesia = crmData.freguesia || crmData.parish;

    if (!concelho && !distrito && !freguesia) {
      return undefined;
    }

    return {
      concelho,
      distrito,
      freguesia,
    };
  }

  /**
   * Transforma dados de orçamento
   */
  private static transformBudget(crmData: CRMLeadRawData) {
    const min = crmData.minBudget || crmData.budgetMin;
    const max = crmData.maxBudget || crmData.budgetMax || crmData.budget;

    if (!min && !max) {
      return undefined;
    }

    return {
      min,
      max,
      currency: crmData.currency || 'EUR',
    };
  }

  /**
   * Constrói notas consolidadas
   */
  private static buildNotes(crmData: CRMLeadRawData): string | undefined {
    const parts = [];

    if (crmData.notes) parts.push(crmData.notes);
    if (crmData.comments) parts.push(`Comentários: ${crmData.comments}`);

    return parts.length > 0 ? parts.join('\n\n') : undefined;
  }

  /**
   * Transforma metadados
   */
  private static transformMetadata(crmData: CRMLeadRawData): Lead['metadata'] {
    const now = new Date();

    return {
      sources: [
        {
          type: 'CRM',
          name: crmData.crmName,
          id: crmData.id,
        },
      ],
      agentId: crmData.agentId || crmData.ownerId || crmData.assignedTo,
      lastContactDate: this.parseDate(
        crmData.lastContactDate || crmData.lastContactedAt
      ),
      nextFollowUpDate: this.parseDate(
        crmData.nextFollowUpDate || crmData.nextFollowUp
      ),
      createdAt: this.parseDate(crmData.createdDate || crmData.createdAt) || now,
      updatedAt: this.parseDate(crmData.modifiedDate || crmData.updatedAt) || now,
    };
  }

  /**
   * Parse de data seguro
   */
  private static parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Transforma múltiplos leads de CRM
   */
  static transformBatch(
    crmDataArray: CRMLeadRawData[],
    tenantId: string,
    teamId?: string
  ): Lead[] {
    return crmDataArray.map(data => this.transform(data, tenantId, teamId));
  }

  /**
   * Converte Lead canônico para formato de atualização de CRM
   */
  static toUpdatePayload(lead: Lead): Record<string, any> {
    return {
      id: lead.metadata.sources[0]?.id || lead.id,
      status: lead.status,
      score: lead.score,
      notes: lead.notes,
      agentId: lead.metadata.agentId,
      nextFollowUpDate: lead.metadata.nextFollowUpDate?.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
