# Casafari API Integration

Integração completa com a API Casafari para busca e obtenção de propriedades imobiliárias em Portugal.

## 🎉 Fase 1 Implementada - Filtros Avançados

✨ **NOVO**: Suporte completo para todos os 15+ filtros avançados da API Casafari!

Esta implementação inclui:
- 📊 **6 ranges adicionais**: bathrooms, construction_year, plot_area, price_per_sqm, days_on_market, gross_yield
- 🏠 **8 características de imóveis**: floors, floor_number, views, directions, orientation, conditions, energy_ratings, characteristics
- 💼 **9 filtros de negócio**: private, auction, bank, casafari_connect, exclusive, agencies, agents, ref_numbers
- 📍 **Localização avançada**: location_ids, custom_location_boundary (circle/polygon)
- 📅 **6 filtros de data**: property_date, created_date, updated_date (from/to)
- 🔄 **Ordenação avançada**: 7 campos de ordenação (price, price_per_sqm, total_area, bedrooms, construction_year, last_update, time_on_market)

**Cobertura de testes**: 54 testes (23 novos para filtros avançados), 100% de aprovação ✅

## 📋 Visão Geral

O **CasafariService** fornece uma interface TypeScript type-safe para a API Casafari, com:

- ✅ **Autenticação via API Key**
- ✅ **Cache em memória** (5 minutos TTL)
- ✅ **Transformação automática** para `PropertyCanonicalModel`
- ✅ **Tratamento de erros** personalizado
- ✅ **Suporte a paginação e filtros avançados**
- ✅ **100% testado** (54 testes unitários)

## 🚀 Início Rápido

### 1. Configuração

Adicione sua API key do Casafari ao `.env`:

```bash
CASAFARI_API_KEY=your-api-key-here
```

### 2. Uso Básico

```typescript
import { createCasafariService } from '@/services/casafari';

// Cria instância do serviço
const casafari = createCasafariService();

// Lista propriedades
const result = await casafari.listProperties(
  undefined, // Sem filtros
  'tenant-id',
  'team-id' // Opcional
);

console.log(`${result.properties.length} propriedades encontradas`);
```

## 📖 API

### Métodos Principais

#### `listProperties(filters?, tenantId?, teamId?)`

Lista propriedades com paginação opcional.

```typescript
const result = await casafari.listProperties(
  { page: 1, limit: 20 },
  'tenant-123'
);

// Retorna:
// {
//   properties: PropertyCanonicalModel[],
//   pagination: { page, limit, total, totalPages }
// }
```

#### `getPropertyDetails(propertyId, tenantId?, teamId?)`

Obtém detalhes completos de uma propriedade específica.

```typescript
const property = await casafari.getPropertyDetails(
  'casafari-prop-123',
  'tenant-123'
);

console.log(property.title);
console.log(property.price.value);
console.log(property.images.length);
```

#### `searchProperties(filters, tenantId?, teamId?)`

Busca avançada com múltiplos filtros.

```typescript
const result = await casafari.searchProperties(
  {
    // Localização
    district: 'Lisboa',
    municipality: 'Cascais',
    
    // Tipo
    propertyType: ['apartment', 'house'],
    transactionType: 'sale',
    
    // Preço e área
    minPrice: 200000,
    maxPrice: 500000,
    minArea: 80,
    maxArea: 150,
    
    // Características
    minBedrooms: 2,
    minBathrooms: 1,
    
    // Paginação
    page: 1,
    limit: 20,
    
    // Ordenação
    sortBy: 'price',
    sortOrder: 'asc',
  },
  'tenant-123'
);
```

### Filtros Disponíveis

#### Filtros Básicos

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `country` | `string` | País (ex: "Portugal") |
| `district` | `string` | Distrito (ex: "Lisboa") |
| `municipality` | `string` | Concelho (ex: "Cascais") |
| `parish` | `string` | Freguesia |
| `postalCode` | `string` | Código postal |
| `propertyType` | `string[]` | Tipos: `apartment`, `house`, `land`, etc. |
| `transactionType` | `'sale' \| 'rent'` | Tipo de transação |
| `minPrice` / `maxPrice` | `number` | Faixa de preço em EUR |
| `minArea` / `maxArea` | `number` | Faixa de área em m² |
| `minBedrooms` / `maxBedrooms` | `number` | Número de quartos |
| `minBathrooms` / `maxBathrooms` | `number` | Número de casas de banho |
| `page` | `number` | Página (default: 1) |
| `limit` | `number` | Itens por página (default: 10) |
| `sortBy` | `string` | Campo de ordenação |
| `sortOrder` | `'asc' \| 'desc'` | Direção da ordenação |

#### Filtros Avançados (Fase 1 ✨ NEW)

##### Ranges Adicionais
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `bathrooms_from` / `bathrooms_to` | `number` | Faixa de casas de banho |
| `construction_year_from` / `construction_year_to` | `number` | Faixa de ano de construção |
| `plot_area_from` / `plot_area_to` | `number` | Faixa de área de terreno (m²) |
| `price_per_sqm_from` / `price_per_sqm_to` | `number` | Faixa de preço por m² (EUR/m²) |
| `days_on_market_from` / `days_on_market_to` | `number` | Faixa de dias no mercado |
| `gross_yield_from` / `gross_yield_to` | `number` | Faixa de rentabilidade bruta (%) |

##### Características do Imóvel
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `floors` | `Array<'no_floor' \| 'ground' \| 'middle' \| 'top'>` | Posição do andar |
| `floor_number` | `number[]` | Números específicos de andar |
| `views` | `Array<'water' \| 'landscape' \| 'city' \| 'golf' \| 'park'>` | Tipos de vista |
| `directions` | `Array<'north' \| 'south' \| 'east' \| 'west'>` | Orientação solar |
| `orientation` | `'exterior' \| 'interior'` | Orientação do imóvel |
| `characteristics` | `{ must_have?: string[], exclude?: string[] }` | Características obrigatórias/excluídas |
| `conditions` | `Array<'used' \| 'ruin' \| 'very-good' \| 'new' \| 'other'>` | Estado do imóvel |
| `energy_ratings` | `Array<'A+' \| 'A' \| 'B' \| 'C' \| 'D' \| 'E' \| 'F' \| 'G' \| 'H'>` | Certificação energética |

##### Filtros de Negócio
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `private` | `boolean` | Apenas anúncios privados |
| `auction` | `boolean` | Apenas leilões |
| `bank` | `boolean` | Apenas propriedades bancárias |
| `casafari_connect` | `boolean` | Apenas Casafari Connect |
| `exclusive` | `boolean` | Apenas anúncios exclusivos |
| `with_agencies` | `string[]` | Filtrar por agências específicas (IDs) |
| `without_agencies` | `string[]` | Excluir agências específicas (IDs) |
| `listing_agents` | `string[]` | Filtrar por agentes específicos (IDs) |
| `ref_numbers` | `string[]` | Filtrar por números de referência |

##### Localização Avançada
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `location_ids` | `string[]` | IDs específicos de localização |
| `custom_location_boundary` | `CasafariLocationBoundary` | Círculo ou polígono personalizado |

**Exemplo de custom_location_boundary (círculo):**
```typescript
{
  type: 'circle',
  center: { latitude: 38.7223, longitude: -9.1393 },
  radius: 5000 // metros
}
```

**Exemplo de custom_location_boundary (polígono):**
```typescript
{
  type: 'polygon',
  coordinates: [
    { latitude: 38.7223, longitude: -9.1393 },
    { latitude: 38.7323, longitude: -9.1493 },
    { latitude: 38.7423, longitude: -9.1593 }
  ]
}
```

##### Filtros de Data Avançados
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `property_date_from` / `property_date_to` | `string` (ISO) | Faixa de data da propriedade |
| `created_date_from` / `created_date_to` | `string` (ISO) | Faixa de data de criação |
| `updated_date_from` / `updated_date_to` | `string` (ISO) | Faixa de última atualização |

##### Ordenação Avançada
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `order` | `'asc' \| 'desc'` | Ordem de classificação |
| `order_by` | `CasafariSortBy` | Campo de ordenação avançado |

**Valores de order_by:**
- `price` - Preço
- `price_per_sqm` - Preço por m²
- `total_area` - Área total
- `bedrooms` - Número de quartos
- `construction_year` - Ano de construção
- `last_update` - Última atualização
- `time_on_market` - Tempo no mercado

### Exemplos de Uso dos Filtros Avançados

#### Exemplo 1: Busca com Múltiplos Filtros Avançados
```typescript
const result = await casafari.searchProperties(
  {
    // Localização
    district: 'Lisboa',
    location_ids: ['loc-cascais-1', 'loc-oeiras-2'],
    
    // Características
    minBedrooms: 2,
    bathrooms_from: 2,
    bathrooms_to: 3,
    
    // Ano de construção recente
    construction_year_from: 2015,
    construction_year_to: 2023,
    
    // Vista e orientação
    views: ['water', 'city'],
    directions: ['south', 'west'],
    orientation: 'exterior',
    
    // Eficiência energética
    energy_ratings: ['A+', 'A', 'B'],
    
    // Preço por m² competitivo
    price_per_sqm_from: 2500,
    price_per_sqm_to: 4000,
    
    // Ordenação
    order: 'asc',
    order_by: 'price_per_sqm',
    
    // Paginação
    page: 1,
    limit: 20,
  },
  'tenant-123'
);
```

#### Exemplo 2: Busca de Oportunidades de Investimento
```typescript
const result = await casafari.searchProperties(
  {
    // Localização com raio personalizado
    custom_location_boundary: {
      type: 'circle',
      center: { latitude: 38.7223, longitude: -9.1393 },
      radius: 3000, // 3km de raio
    },
    
    // Métricas de investimento
    gross_yield_from: 5.0, // Rentabilidade mínima de 5%
    days_on_market_from: 30, // No mercado há mais de 30 dias
    
    // Filtros de negócio
    bank: true, // Apenas propriedades bancárias
    auction: false, // Excluir leilões
    
    // Ordenar por rentabilidade
    order: 'desc',
    order_by: 'gross_yield',
  },
  'tenant-123'
);
```

#### Exemplo 3: Busca com Características Específicas
```typescript
const result = await casafari.searchProperties(
  {
    // Andar e posição
    floors: ['ground', 'top'], // Apenas rés-do-chão ou último andar
    floor_number: [0, 1, 5, 6], // Andares específicos
    
    // Características obrigatórias e exclusões
    characteristics: {
      must_have: ['pool', 'garage', 'elevator'],
      exclude: ['pet_friendly', 'smoker_friendly'],
    },
    
    // Estado
    conditions: ['new', 'very-good'],
    
    // Área de terreno para jardim
    plot_area_from: 100,
    
    // Propriedades exclusivas
    exclusive: true,
    private: true,
  },
  'tenant-123'
);
```

## 🔄 Cache

O serviço implementa cache automático em memória:

```typescript
// Primeira chamada: faz fetch da API
const result1 = await casafari.listProperties();

// Segunda chamada: retorna do cache (instantâneo)
const result2 = await casafari.listProperties();

// Limpar cache manualmente
casafari.clearCache();

// Limpar apenas entradas expiradas
casafari.clearExpiredCache();
```

**TTL padrão**: 5 minutos

## 🔌 Integração com IA Orquestradora

O CasafariService é automaticamente roteado através da **IA Orquestradora** para o módulo **IA Busca**.

### Chamada via Orquestradora

```typescript
// Payload para IA Orquestradora
const payload = {
  target: 'ia-busca',
  casafariQuery: {
    action: 'search',
    filters: {
      municipality: 'Lisboa',
      minPrice: 200000,
      maxPrice: 400000,
    },
  },
};

// Faz requisição à Edge Function
const response = await fetch(
  'https://[PROJECT].supabase.co/functions/v1/ia-orquestradora',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
);
```

## 📊 Modelo Canônico

Todas as propriedades são automaticamente transformadas para `PropertyCanonicalModel`:

```typescript
{
  id: 'casafari_prop-123',
  tenantId: 'tenant-123',
  type: PropertyType.APARTMENT,
  location: {
    coordinates: { latitude: 38.7223, longitude: -9.1393 },
    address: {
      street: 'Rua do Comércio',
      concelho: 'Lisboa',
      distrito: 'Lisboa',
      country: 'Portugal',
    },
  },
  price: {
    value: 250000,
    currency: 'EUR',
    transactionType: TransactionType.SALE,
  },
  characteristics: {
    usefulArea: 85,
    bedrooms: 2,
    bathrooms: 1,
    typology: 'T2',
    energyRating: 'B',
  },
  metadata: {
    sources: [{ type: 'CASAFARI', name: 'Idealista', id: 'prop-123' }],
    dataQuality: DataQuality.HIGH,
    validations: { ... },
  },
  images: [...],
}
```

## ⚠️ Tratamento de Erros

O serviço usa `CasafariApiError` para erros específicos:

```typescript
import { CasafariApiError } from '@/services/casafari';

try {
  const properties = await casafari.listProperties();
} catch (error) {
  if (error instanceof CasafariApiError) {
    console.error(`Erro ${error.statusCode}: ${error.message}`);
    console.error(`Código: ${error.code}`);
    console.error(`Detalhes:`, error.details);
    
    // Tratamento específico
    switch (error.statusCode) {
      case 401:
        // API key inválida
        break;
      case 404:
        // Recurso não encontrado
        break;
      case 429:
        // Rate limit excedido
        break;
      case 408:
        // Timeout
        break;
    }
  }
}
```

## 🧪 Testes

Execute os testes unitários:

```bash
npm test -- CasafariService.test.ts
```

**Cobertura**: 25 testes, 100% de aprovação

- ✅ Constructor e configuração
- ✅ listProperties (com/sem filtros, cache, erros)
- ✅ getPropertyDetails (cache, 404)
- ✅ searchProperties (filtros múltiplos, ordenação)
- ✅ Gestão de cache
- ✅ Tratamento de erros (network, timeout, malformed JSON)
- ✅ Factory function
- ✅ CasafariApiError

## 📁 Estrutura de Arquivos

```
src/services/casafari/
├── CasafariService.ts    # Serviço principal
├── types.ts              # Tipos TypeScript
└── index.ts              # Exportações

__tests__/
└── CasafariService.test.ts  # Testes unitários

src/examples/
└── casafari-integration-example.ts  # Exemplos de uso
```

## 🔗 Recursos

- **Documentação Casafari API**: https://docs.api.casafari.com
- **PropertyCanonicalModel**: `src/models/PropertyCanonicalModel.ts`
- **CasafariTransformer**: `src/models/transformers/CasafariTransformer.ts`
- **Exemplos completos**: `src/examples/casafari-integration-example.ts`

## 🛠️ Desenvolvimento

### Adicionar novo filtro

1. Adicione o filtro em `types.ts`:
   ```typescript
   export interface CasafariSearchFilters {
     // ...
     newFilter?: string;
   }
   ```

2. Implemente no método `buildUrl` em `CasafariService.ts`:
   ```typescript
   if (filters.newFilter) {
     params.set('newFilter', filters.newFilter);
   }
   ```

3. Adicione testes em `__tests__/CasafariService.test.ts`

### Ajustar TTL do cache

```typescript
const casafari = new CasafariService({
  apiKey: 'your-key',
  timeout: 30000, // 30 segundos
});

// Cache padrão é 5 minutos (300000ms)
// Alterar em CasafariService.ts: defaultCacheTTL
```

## 📝 Notas

- **Multi-tenancy**: Sempre forneça `tenantId` para transformar dados
- **Paginação**: Use `page` e `limit` para controlar resultados
- **Rate limits**: Casafari pode ter limites de requisições - use cache!
- **Ambiente**: Configure `CASAFARI_API_KEY` no `.env` ou `.env.local`

---

**Status**: ✅ Produção  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026
