/**
 * Index - Exportações principais do módulo de modelos canônicos
 */

// Modelo canônico
export {
  PropertyCanonicalModel,
  PropertyType,
  TransactionType,
  PropertyCondition,
  DataQuality,
  type PropertyLocation,
  type PropertyPrice,
  type PropertyCharacteristics,
  type PropertyMetadata,
} from './PropertyCanonicalModel';

// Validadores
export {
  validateProperty,
  validatePortugueseAddress,
  validateCoordinates,
  normalizePostalCode,
  normalizeTypology,
  normalizeEnergyRating,
  PropertyCanonicalSchema,
  AddressSchema,
  CoordinatesSchema,
  PriceSchema,
  CharacteristicsSchema,
  MetadataSchema,
  type ValidatedPropertyCanonical,
} from './validators/PropertyValidator';

// Transformers
export {
  CasafariTransformer,
  type CasafariRawData,
} from './transformers/CasafariTransformer';

export {
  CRMTransformer,
  type CRMRawData,
} from './transformers/CRMTransformer';
