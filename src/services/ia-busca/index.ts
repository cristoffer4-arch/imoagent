/**
 * IA-Busca Services
 * 
 * Main exports for the property search module
 */

export {
  DeduplicationService,
  createDeduplicationService,
  type DuplicateGroup,
  type DeduplicationOptions,
} from './DeduplicationService';

export {
  PortalAggregator,
  createPortalAggregator,
  type PortalAggregatorConfig,
} from './PortalAggregator';

export {
  SearchService,
  createSearchService,
  type SearchServiceConfig,
} from './SearchService';

export {
  ScoringService,
  createScoringService,
} from './ScoringService';
