# Quick Start Guide - Imoagent Test Suite

## What Was Created

4 comprehensive test files with **314+ test cases** covering the core search and scoring functionality:

1. **ScoringService.test.ts** (76 tests) - Property scoring algorithms
2. **DeduplicationService.test.ts** (61 tests) - Duplicate detection
3. **SearchService.test.ts** (111 tests) - Advanced search engine
4. **PortalAggregator.test.ts** (66 tests) - Multi-source aggregation

## Test Features

### ScoringService
- ✅ ANGARIACAO mode (property acquisition scoring)
- ✅ VENDA mode (lead matching)
- ✅ 3-component scoring: Compatibility + Behavior + Temporal
- ✅ Batch operations & caching
- ✅ Confidence calculation

### DeduplicationService
- ✅ Exact address matching
- ✅ Geohash proximity (coordinates)
- ✅ Price similarity (±10%)
- ✅ Area similarity (±10%)
- ✅ Multi-signal detection
- ✅ Primary property selection

### SearchService
- ✅ 8 filter types (type, location, price, area, bedrooms, features)
- ✅ 4 sort options (score, price, area, recency)
- ✅ Pagination with statistics
- ✅ Facets generation
- ✅ Multi-source integration

### PortalAggregator
- ✅ Casafari, Idealista, OLX, Imovirtual, CRM
- ✅ Parallel querying
- ✅ Timeout handling
- ✅ Partial failure tolerance
- ✅ Deduplication integration

## Running Tests

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- ScoringService.test.ts

# Run in watch mode
npm test -- --watch

# Run specific test case
npm test -- -t "should calculate score for angariação mode"
```

## Expected Test Status

⚠️ **Tests will initially FAIL** because the services don't exist yet.

You need to implement:
1. `src/services/ScoringService.ts`
2. `src/services/DeduplicationService.ts`
3. `src/services/SearchService.ts`
4. `src/services/PortalAggregator.ts`

And define types in `src/types/`:
- `PropertyCanonicalModel`
- `ScoringContext`, `PropertyScore`
- `SearchParams`, `SearchResult`
- `AggregationResult`, `DuplicateGroup`

## Implementation Steps

### Step 1: Define Types
Create `src/types/index.ts`:
```typescript
export interface PropertyCanonicalModel {
  id: string;
  source: 'casafari' | 'idealista' | 'olx' | 'imovirtual' | 'crm';
  type: 'apartamento' | 'moradia' | 'terreno';
  operation: 'venda' | 'arrendamento';
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    distrito?: string;
    concelho?: string;
    freguesia?: string;
    address?: string;
    coordinates?: { lat: number; lon: number };
  };
  features?: string[];
  images?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface ScoringContext {
  mode: 'ANGARIACAO' | 'VENDA';
  userPreferences?: {
    propertyTypes?: string[];
    locations?: string[];
    priceRange?: { min: number; max: number };
    areaRange?: { min: number; max: number };
  };
  leadProfile?: {
    type?: string;
    location?: string;
    priceRange?: { min: number; max: number };
    areaRange?: { min: number; max: number };
    bedrooms?: number;
    urgency?: 'low' | 'medium' | 'high';
  };
  marketData?: {
    averagePricePerSqm?: number;
    medianPrice?: number;
  };
  seasonalFactors?: Record<string, number>;
}

export interface PropertyScore {
  propertyId: string;
  finalScore: number;
  components: {
    compatibility: number;
    behavior: number;
    temporal: number;
  };
  topReasons: string[];
  confidence: number;
}

// Add more types as needed...
```

### Step 2: Implement ScoringService
Create `src/services/ScoringService.ts`:
```typescript
import type { PropertyCanonicalModel, ScoringContext, PropertyScore } from '../types';

export class ScoringService {
  private cache: Map<string, PropertyScore> = new Map();

  calculateScore(property: PropertyCanonicalModel, context: ScoringContext): PropertyScore {
    const cacheKey = `${property.id}-${context.mode}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const compatibility = this.calculateCompatibilityScore(property, context);
    const behavior = this.calculateBehaviorScore(property, context);
    const temporal = this.calculateTemporalScore(property, context);

    const finalScore = 
      compatibility * 0.4 +
      behavior * 0.3 +
      temporal * 0.3;

    const score: PropertyScore = {
      propertyId: property.id,
      finalScore: Math.round(finalScore),
      components: { compatibility, behavior, temporal },
      topReasons: this.extractTopReasons(property, context),
      confidence: this.calculateConfidence(property)
    };

    this.cache.set(cacheKey, score);
    return score;
  }

  // Implement other methods based on test expectations...
  private calculateCompatibilityScore(property: PropertyCanonicalModel, context: ScoringContext): number {
    // Implementation...
    return 75;
  }

  // ... more methods
}
```

### Step 3: Implement Other Services
Follow similar patterns for:
- `DeduplicationService.ts`
- `SearchService.ts`
- `PortalAggregator.ts`

### Step 4: Run Tests
```bash
npm test -- --coverage
```

### Step 5: Iterate
- Fix failing tests
- Adjust implementations
- Check coverage report
- Repeat until all tests pass

## Test Examples

### Running Specific Test Groups
```bash
# Run all scoring tests
npm test -- -t "ScoringService"

# Run ANGARIACAO mode tests only
npm test -- -t "ANGARIACAO"

# Run deduplication location tests
npm test -- -t "findDuplicates - exact location"

# Run search filter tests
npm test -- -t "filter by"
```

## Coverage Report

After running tests with coverage:
```bash
npm test -- --coverage
```

You'll see a report like:
```
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
ScoringService.ts       |   85.3  |   78.4   |   90.2  |   84.7  |
DeduplicationService.ts |   88.1  |   82.3   |   92.5  |   87.6  |
SearchService.ts        |   91.2  |   85.7   |   94.3  |   90.8  |
PortalAggregator.ts     |   86.5  |   80.2   |   88.9  |   85.9  |
```

## Troubleshooting

### Tests not found
```bash
# Check Jest config
cat jest.config.js

# Ensure testMatch includes *.test.ts
testMatch: ['**/__tests__/**/*.test.ts']
```

### Import errors
```bash
# Check tsconfig.json paths
# Ensure src/ is in include array
```

### Mock errors
```bash
# Ensure mock files exist or create them
# Mock services are declared at top of test files
```

## Documentation

- **README.md** - Complete test suite guide
- **TEST_COVERAGE_SUMMARY.md** - Detailed test breakdown
- **This file** - Quick start guide

## Support

For questions or issues with tests:
1. Check test file comments
2. Review README.md
3. Check Jest documentation: https://jestjs.io/
4. Check ts-jest docs: https://kulshekhar.github.io/ts-jest/

---

**Ready to start?** 
1. Implement the services
2. Run `npm test`
3. Fix failures
4. Achieve 80%+ coverage ✅
