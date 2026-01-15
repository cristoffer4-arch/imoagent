# Casafari API Integration

Integração completa com a API Casafari para busca e obtenção de propriedades imobiliárias em Portugal.

## 📋 Visão Geral

O **CasafariService** fornece uma interface TypeScript type-safe para a API Casafari, com:

- ✅ **Autenticação via API Key**
- ✅ **Cache em memória** (5 minutos TTL)
- ✅ **Transformação automática** para `PropertyCanonicalModel`
- ✅ **Tratamento de erros** personalizado
- ✅ **Suporte a paginação e filtros avançados**
- ✅ **100% testado** (25 testes unitários)

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
| `minBathrooms` | `number` | Número mínimo de casas de banho |
| `page` | `number` | Página (default: 1) |
| `limit` | `number` | Itens por página (default: 10) |
| `sortBy` | `string` | Campo de ordenação |
| `sortOrder` | `'asc' \| 'desc'` | Direção da ordenação |

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
