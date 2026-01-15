# Casafari Service

Integração com a API Casafari para buscar propriedades imobiliárias.

## Documentação

API Documentation: https://docs.api.casafari.com

## Instalação

### Configuração da API Key

Adicione sua chave da API Casafari no arquivo `.env`:

```env
CASAFARI_API_KEY=your-casafari-api-key-here
```

Se a chave não estiver configurada, o serviço usará dados mock para desenvolvimento.

## Uso

### Node.js/Next.js (Frontend/Backend)

```typescript
import { createCasafariService } from '@/services/casafari';

// Criar instância do serviço
const casafari = createCasafariService();

// Listar propriedades
const { success, data } = await casafari.listProperties(1, 20);
if (success) {
  console.log('Properties:', data);
}

// Buscar propriedade específica
const property = await casafari.getPropertyDetails('property-id');

// Buscar com filtros
const results = await casafari.searchProperties({
  city: 'Lisboa',
  minPrice: 300000,
  maxPrice: 500000,
  bedrooms: 3,
  operation: 'sale'
});
```

### Supabase Edge Functions (Deno)

```typescript
import { CasafariClient } from "./casafari-client.ts";

// Criar cliente
const client = new CasafariClient();

// Buscar propriedades
const properties = await client.searchProperties({
  city: 'Porto',
  minPrice: 400000
});

// Listar propriedades
const list = await client.listProperties(1, 20);

// Obter detalhes
const property = await client.getPropertyDetails('mock-001');
```

## Funcionalidades

### ✅ Métodos Implementados

- `listProperties(page, perPage)` - Lista propriedades com paginação
- `getPropertyDetails(propertyId)` - Obtém detalhes de uma propriedade
- `searchProperties(params)` - Busca propriedades com filtros

### 🔄 Transformação de Dados

Os dados da API Casafari são automaticamente transformados para o modelo canônico do sistema:

```typescript
interface CanonicalProperty {
  id: string;
  source: "casafari";
  sourceId: string;
  sourceUrl?: string;
  title: string;
  type: "house" | "apartment" | "land" | "commercial";
  operation: "sale" | "rent";
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  features?: string[];
  // ... mais campos
}
```

### 💾 Cache

O serviço inclui cache in-memory para otimizar requisições:

- TTL padrão: 5 minutos (300 segundos)
- Configurável via `cacheTtl` no construtor
- Pode ser desabilitado via `enableCache: false`

```typescript
const service = createCasafariService({
  apiKey: 'your-key',
  enableCache: true,
  cacheTtl: 600 // 10 minutos
});

// Limpar cache
service.clearCache();

// Estatísticas do cache
const stats = service.getCacheStats();
console.log('Cache size:', stats.size);
```

### 🔒 Autenticação

O serviço usa autenticação Bearer Token:

```
Authorization: Bearer YOUR_API_KEY
```

### 🛡️ Tratamento de Erros

- Timeout padrão: 30 segundos
- Fallback automático para mock em caso de erro
- Validação de dados recebidos da API
- Mensagens de erro descritivas

```typescript
const response = await service.searchProperties({ city: 'Lisboa' });

if (!response.success) {
  console.error('Error:', response.error);
} else {
  console.log('Properties:', response.data);
}
```

### 🔄 Mock Mode

Em desenvolvimento sem API key, o serviço retorna dados mock:

```typescript
// Sem API key ou com apiKey: 'mock'
const service = createCasafariService({ apiKey: 'mock' });

// Retorna 2 propriedades mock (Lisboa e Porto)
const properties = await service.listProperties();
```

## Filtros de Busca

```typescript
interface CasafariSearchParams {
  operation?: "sale" | "rent";     // Tipo de operação
  type?: string[];                  // Tipo de imóvel
  minPrice?: number;                // Preço mínimo
  maxPrice?: number;                // Preço máximo
  minArea?: number;                 // Área mínima (m²)
  maxArea?: number;                 // Área máxima (m²)
  bedrooms?: number;                // Número de quartos
  bathrooms?: number;               // Número de casas de banho
  city?: string;                    // Cidade
  district?: string;                // Distrito
  page?: number;                    // Página (paginação)
  perPage?: number;                 // Resultados por página
}
```

## Integração com IA Busca

O serviço está integrado na Edge Function `ia-busca`:

```bash
# Deploy da função
supabase functions deploy ia-busca
```

Payload da requisição:

```json
{
  "query": "apartamentos em Lisboa",
  "portals": ["casafari", "olx", "idealista"],
  "filters": {
    "city": "Lisboa",
    "minPrice": 300000,
    "maxPrice": 500000,
    "bedrooms": 3,
    "operation": "sale"
  }
}
```

## Testes

```bash
npm test -- __tests__/services/casafari/casafari-service.test.ts
```

Testes incluem:
- ✅ Listagem de propriedades
- ✅ Detalhes de propriedade
- ✅ Busca com filtros
- ✅ Sistema de cache
- ✅ Transformação de dados
- ✅ Validação de propriedades
- ✅ Tratamento de erros

## Estrutura de Arquivos

```
src/services/casafari/
├── index.ts          # Serviço principal (Node.js)
├── types.ts          # TypeScript types
├── transformer.ts    # Transformação de dados
├── cache.ts          # Sistema de cache
└── README.md         # Esta documentação

supabase/functions/ia-busca/
└── casafari-client.ts  # Cliente Deno para Edge Functions

__tests__/services/casafari/
└── casafari-service.test.ts  # Testes unitários
```

## Configuração Avançada

```typescript
const service = createCasafariService({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.casafari.com/v1',  // URL base customizada
  timeout: 60000,                           // Timeout em ms
  enableCache: true,                        // Habilitar cache
  cacheTtl: 600                            // TTL do cache em segundos
});
```

## Limitações

- A API Casafari pode ter limites de rate limiting
- Cache é in-memory (perde dados ao reiniciar)
- Mock mode retorna apenas 2 propriedades fixas
- Validação básica de dados (pode precisar de validação adicional)

## Próximos Passos

- [ ] Implementar cache persistente (Redis/Supabase)
- [ ] Adicionar rate limiting
- [ ] Implementar retry logic
- [ ] Adicionar webhooks da Casafari
- [ ] Suporte para propriedades favoritas
- [ ] Integração com outros portais
