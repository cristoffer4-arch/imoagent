/**
 * PropertyValidator - Validação de dados de propriedades usando Zod
 * 
 * Schemas de validação para garantir a integridade dos dados
 * do modelo canônico de propriedades.
 */

import { z } from 'zod';
import {
  PropertyType,
  TransactionType,
  PropertyCondition,
  DataQuality,
} from '../PropertyCanonicalModel';

/**
 * Schema de validação para coordenadas geográficas
 */
export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
});

/**
 * Schema de validação para endereço português
 */
export const AddressSchema = z.object({
  street: z.string().min(1).max(255).optional(),
  number: z.string().max(50).optional(),
  postalCode: z
    .string()
    .regex(/^\d{4}-\d{3}$/, 'Código postal deve estar no formato XXXX-XXX')
    .optional(),
  freguesia: z.string().max(255).optional(),
  concelho: z.string().min(1).max(255, 'Concelho é obrigatório'),
  distrito: z.string().min(1).max(255, 'Distrito é obrigatório'),
  country: z.string().default('Portugal'),
});

/**
 * Schema de validação para localização
 */
export const LocationSchema = z.object({
  coordinates: CoordinatesSchema.optional(),
  address: AddressSchema,
  geohash: z.string().max(12).optional(),
  formattedAddress: z.string().optional(),
});

/**
 * Schema de validação para range de preços
 */
export const PriceRangeSchema = z.object({
  min: z.number().positive(),
  max: z.number().positive(),
  divergencePercentage: z.number().min(0).max(100),
});

/**
 * Schema de validação para preço
 */
export const PriceSchema = z.object({
  value: z.number().positive('Preço deve ser positivo'),
  currency: z.string().length(3, 'Moeda deve ter 3 caracteres (ex: EUR)').default('EUR'),
  transactionType: z.nativeEnum(TransactionType),
  condominium: z.number().positive().optional(),
  imiTax: z.number().positive().optional(),
  pricePerM2: z.number().positive().optional(),
  priceRange: PriceRangeSchema.optional(),
});

/**
 * Schema de validação para características da propriedade
 */
export const CharacteristicsSchema = z.object({
  totalArea: z.number().positive().optional(),
  usefulArea: z.number().positive().optional(),
  landArea: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  wc: z.number().int().nonnegative().optional(),
  rooms: z.number().int().positive().optional(),
  parkingSpaces: z.number().int().nonnegative().optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  features: z
    .object({
      elevator: z.boolean().optional(),
      balcony: z.boolean().optional(),
      terrace: z.boolean().optional(),
      garden: z.boolean().optional(),
      pool: z.boolean().optional(),
      airConditioning: z.boolean().optional(),
      heating: z.boolean().optional(),
      fireplace: z.boolean().optional(),
      storage: z.boolean().optional(),
      furnished: z.boolean().optional(),
      petsAllowed: z.boolean().optional(),
    })
    .optional(),
  condition: z.nativeEnum(PropertyCondition).optional(),
  energyRating: z
    .string()
    .regex(/^[A-G][+-]?$/, 'Certificado energético inválido (ex: A+, B, C)')
    .optional(),
  typology: z
    .string()
    .regex(/^T[0-9]\+?$/, 'Tipologia deve ser T0, T1, T2, etc.')
    .optional(),
});

/**
 * Schema de validação para fonte de dados
 */
export const SourceSchema = z.object({
  type: z.enum(['PORTAL', 'CRM', 'CASAFARI', 'MANUAL']),
  name: z.string().min(1, 'Nome da fonte é obrigatório'),
  id: z.string().min(1, 'ID da fonte é obrigatório'),
  url: z.string().url().optional().or(z.literal('')),
  agency: z.string().optional(),
});

/**
 * Schema de validação para metadados
 */
export const MetadataSchema = z.object({
  sources: z.array(SourceSchema).min(1, 'Pelo menos uma fonte é obrigatória'),
  firstSeen: z.date(),
  lastSeen: z.date(),
  lastUpdated: z.date(),
  dataQuality: z.nativeEnum(DataQuality),
  qualityScore: z.number().min(0).max(100).optional(),
  validations: z
    .object({
      hasValidAddress: z.boolean(),
      hasValidCoordinates: z.boolean(),
      hasValidPrice: z.boolean(),
      hasMinimumCharacteristics: z.boolean(),
      hasImages: z.boolean(),
    })
    .optional(),
  portalCount: z.number().int().nonnegative().optional(),
  viewCount: z.number().int().nonnegative().optional(),
  duplicateOf: z.string().optional(),
  similarProperties: z.array(z.string()).optional(),
  rawData: z.record(z.any()).optional(),
});

/**
 * Schema de validação para imagens
 */
export const ImageSchema = z.object({
  url: z.string().url('URL da imagem inválida'),
  thumbnail: z.string().url().optional(),
  caption: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  hash: z.string().optional(),
});

/**
 * Schema de validação para scores de IA
 */
export const AIScoresSchema = z.object({
  acquisitionScore: z.number().min(0).max(100).optional(),
  saleScore: z.number().min(0).max(100).optional(),
  availabilityProbability: z.number().min(0).max(1).optional(),
  topReasons: z.array(z.string()).optional(),
});

/**
 * Schema completo de validação para PropertyCanonicalModel
 */
export const PropertyCanonicalSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  tenantId: z.string().min(1, 'Tenant ID é obrigatório'),
  teamId: z.string().optional(),
  type: z.nativeEnum(PropertyType),
  location: LocationSchema,
  price: PriceSchema,
  characteristics: CharacteristicsSchema,
  metadata: MetadataSchema,
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  images: z.array(ImageSchema).optional(),
  aiScores: AIScoresSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Tipo TypeScript inferido do schema Zod
 */
export type ValidatedPropertyCanonical = z.infer<typeof PropertyCanonicalSchema>;

/**
 * Valida um objeto contra o schema de PropertyCanonical
 */
export function validateProperty(data: unknown): {
  success: boolean;
  data?: ValidatedPropertyCanonical;
  errors?: z.ZodError;
} {
  const result = PropertyCanonicalSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Valida dados parciais de propriedade (para criação/atualização)
 */
export const PartialPropertySchema = PropertyCanonicalSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Valida endereço português
 */
export function validatePortugueseAddress(address: unknown): {
  success: boolean;
  data?: z.infer<typeof AddressSchema>;
  errors?: z.ZodError;
} {
  const result = AddressSchema.safeParse(address);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Valida coordenadas geográficas
 */
export function validateCoordinates(coords: unknown): {
  success: boolean;
  data?: z.infer<typeof CoordinatesSchema>;
  errors?: z.ZodError;
} {
  const result = CoordinatesSchema.safeParse(coords);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Normaliza código postal português (adiciona hífen se necessário)
 */
export function normalizePostalCode(postalCode: string): string | null {
  // Remove espaços e hífens
  const cleaned = postalCode.replace(/[\s-]/g, '');
  
  // Verifica se tem 7 dígitos
  if (!/^\d{7}$/.test(cleaned)) {
    return null;
  }
  
  // Adiciona hífen no formato XXXX-XXX
  return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
}

/**
 * Valida e normaliza tipologia portuguesa
 */
export function normalizeTypology(typology: string): string | null {
  const cleaned = typology.toUpperCase().trim();
  
  // Aceita formatos: T0, T1, T2, T3, T4, T5, T5+, etc.
  const match = cleaned.match(/^T(\d+)(\+?)$/);
  if (!match) {
    return null;
  }
  
  return `T${match[1]}${match[2]}`;
}

/**
 * Valida certificado energético português
 */
export function normalizeEnergyRating(rating: string): string | null {
  const cleaned = rating.toUpperCase().trim();
  
  // Aceita: A+, A, B, B-, C, D, E, F, G
  if (/^[A-G][+-]?$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}
