# IA Busca Components

React components for the intelligent property search module (IA Busca) of Imoagent platform.

## Components Overview

### 1. ModeToggle
Toggle between Angariação (acquisition) and Venda (sale) search modes.

**Usage:**
```tsx
import { ModeToggle } from "@/components/ia-busca";
import { SearchMode } from "@/types/search";

<ModeToggle
  mode={currentMode}
  onChange={(mode) => setCurrentMode(mode)}
/>
```

**Props:**
- `mode: SearchMode` - Current search mode
- `onChange: (mode: SearchMode) => void` - Callback when mode changes

---

### 2. SearchFilters
Advanced property search filters with expandable sections.

**Usage:**
```tsx
import { SearchFilters } from "@/components/ia-busca";
import { SearchFilters as SearchFiltersType } from "@/types/search";

<SearchFilters
  filters={filters}
  onChange={(newFilters) => setFilters(newFilters)}
/>
```

**Props:**
- `filters: SearchFiltersType` - Current filters
- `onChange: (filters: SearchFiltersType) => void` - Callback when filters change

**Filter Categories:**
- **Localização**: distrito, concelho, freguesia
- **Preço**: min/max range in EUR
- **Área**: min/max range in m²
- **Tipo**: APARTMENT, HOUSE, VILLA, LAND, COMMERCIAL, OFFICE
- **Tipologia**: T0, T1, T2, T3, T4, T5+
- **Características**: elevator, balcony, garage, pool, garden, etc.

---

### 3. PropertyCard
Displays a single property with score, portals, and match reasons.

**Usage:**
```tsx
import { PropertyCard } from "@/components/ia-busca";
import { SearchResultItem } from "@/types/search";

<PropertyCard
  property={item.property}
  score={item.score}
  matchReasons={item.matchReasons}
  portals={item.portalsFound}
  onClick={() => navigateToProperty(item.property.id)}
/>
```

**Props:**
- `property: PropertyCanonicalModel` - Property data
- `score: number` - Relevance score (0-100)
- `matchReasons: string[]` - Reasons for the match
- `portals: string[]` - Portals where property was found
- `onClick?: () => void` - Optional click handler

**Score Colors:**
- 🟢 Green (≥80): Excellent match
- 🟡 Yellow (60-79): Good match
- 🔴 Red (<60): Low match

---

### 4. SearchStats
Displays aggregated search statistics.

**Usage:**
```tsx
import { SearchStats } from "@/components/ia-busca";
import { SearchStats as SearchStatsType } from "@/types/search";

<SearchStats stats={results.stats} />
```

**Props:**
- `stats: SearchStatsType` - Statistics object

**Displays:**
- Total properties found
- Average price (EUR)
- Price range (min-max)
- Average area (m²)
- Average score
- Active portals count

---

### 5. PropertyGrid
Grid layout with loading, empty, and error states.

**Usage:**
```tsx
import { PropertyGrid } from "@/components/ia-busca";
import { SearchResultItem } from "@/types/search";

<PropertyGrid
  properties={results.items}
  loading={isLoading}
  error={error}
  onLoadMore={() => loadNextPage()}
  hasMore={hasNextPage}
  loadingMore={isLoadingMore}
/>
```

**Props:**
- `properties: SearchResultItem[]` - Array of property results
- `loading: boolean` - Initial loading state
- `error?: string` - Error message
- `onLoadMore?: () => void` - Callback for pagination
- `hasMore?: boolean` - Whether more results exist
- `loadingMore?: boolean` - Loading more state

**States:**
- **Loading**: Skeleton cards with pulse animation
- **Empty**: Search icon with message
- **Error**: Alert with retry button
- **Success**: Grid of PropertyCard components

---

## Example Integration

Complete example with all components:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  ModeToggle,
  SearchFilters,
  SearchStats,
  PropertyGrid,
} from "@/components/ia-busca";
import {
  SearchMode,
  SearchFilters as SearchFiltersType,
  SearchResults,
} from "@/types/search";

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>(SearchMode.ANGARIACAO);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch results when mode or filters change
  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const res = await fetch("/api/properties/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, filters }),
        });
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [mode, filters]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mode Toggle */}
        <ModeToggle mode={mode} onChange={setMode} />

        {/* Search Filters */}
        <SearchFilters filters={filters} onChange={setFilters} />

        {/* Statistics */}
        {results && <SearchStats stats={results.stats} />}

        {/* Results Grid */}
        <PropertyGrid
          properties={results?.items || []}
          loading={loading}
        />
      </div>
    </div>
  );
}
```

---

## Styling

All components use the Imoagent dark theme:

### Colors
- **Backgrounds**: `bg-slate-900`, `bg-slate-950`, `bg-black`
- **Borders**: `border-slate-800`, `border-slate-700`
- **Text**: `text-slate-50`, `text-slate-300`, `text-slate-400`
- **Accents**: `text-emerald-400`, `text-blue-400`, `bg-emerald-500/10`

### Responsive Breakpoints
- **Mobile**: Default (1 column)
- **Tablet**: `md:` (2 columns)
- **Desktop**: `lg:` (3 columns)

### Animations
- Hover effects: `hover:scale-105`, `hover:shadow-2xl`
- Transitions: `transition-all duration-200`
- Loading: `animate-pulse`

---

## Type Definitions

All type definitions are in `src/types/search.ts`:
- `SearchMode` - ANGARIACAO | VENDA
- `SearchFilters` - Advanced filter options
- `SearchResultItem` - Property with score and metadata
- `SearchResults` - Complete search response
- `SearchStats` - Aggregated statistics

Property model in `src/models/PropertyCanonicalModel.ts`:
- `PropertyCanonicalModel` - Canonical property model
- `PropertyType` - Property types enum
- `PropertyLocation` - Location with coordinates
- `PropertyCharacteristics` - Physical characteristics

---

## Features

✅ **Mobile-First Design**: Responsive on all devices
✅ **Dark Theme**: Consistent with Imoagent branding
✅ **TypeScript**: Fully typed with JSDoc comments
✅ **Accessible**: ARIA attributes and semantic HTML
✅ **Performance**: Optimized renders and lazy loading
✅ **Portuguese**: All labels in European Portuguese
✅ **Icons**: Lucide React icons throughout
✅ **States**: Loading, empty, error states handled

---

## Dependencies

Required packages (already in package.json):
- `react@19.2.3`
- `next@16.1.1`
- `lucide-react@^0.460.0`
- `tailwindcss@^4.x`

---

## Notes

- Components use `"use client"` directive for interactivity
- Images use Next.js `<Image>` component for optimization
- All components follow Next.js 15 App Router conventions
- Currency formatting uses European Portuguese locale (`pt-PT`)
- Empty states encourage filter adjustment
- Score badges use color-coded visual feedback

---

## Related Files

- `/src/app/ia-busca/page.tsx` - Main search page
- `/src/types/search.ts` - Type definitions
- `/src/models/PropertyCanonicalModel.ts` - Property model
- `/supabase/functions/ia-busca/` - Backend Edge Function

---

**Created**: January 2026  
**Version**: 1.0.0  
**License**: Private (Imoagent)
