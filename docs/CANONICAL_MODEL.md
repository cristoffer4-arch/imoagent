# Modelo Canônico de Propriedades - IA Busca

## Visão Geral

Este módulo implementa um **modelo de dados canônico** para padronização de propriedades imobiliárias no sistema Imoagent, especificamente para o módulo IA Busca. O modelo fornece uma representação única e consistente de propriedades, independente da fonte de dados (Casafari, CRMs, Portais).

## Estrutura do Projeto

```
src/
├── models/
│   ├── PropertyCanonicalModel.ts      # Modelo canônico principal
│   ├── transformers/
│   │   ├── CasafariTransformer.ts     # Transformer para dados Casafari
│   │   └── CRMTransformer.ts          # Transformer para dados CRM
│   ├── validators/
│   │   └── PropertyValidator.ts       # Schemas Zod para validação
│   └── index.ts                       # Exportações públicas
├── services/
│   ├── GeocodingService.ts            # Serviço de geocodificação
│   └── index.ts
├── repositories/
│   ├── PropertyRepository.ts          # CRUD e busca de propriedades
│   └── index.ts
└── __tests__/
    ├── PropertyCanonicalModel.test.ts
    ├── PropertyValidator.test.ts
    ├── CasafariTransformer.test.ts
    └── CRMTransformer.test.ts
```

## Características Principais

### 1. Modelo Canônico (PropertyCanonicalModel)

Classe principal que representa uma propriedade com:

- **Identificação**: ID único, tenant ID, team ID
- **Tipo**: Apartamento, Moradia, Terreno, Comercial, etc.
- **Localização**: 
  - Coordenadas geográficas (lat/lon)
  - Endereço estruturado (rua, código postal, freguesia, concelho, distrito)
  - Geohash para busca espacial
- **Preço**:
  - Valor, moeda, tipo de negociação (venda/arrendamento)
  - Condomínio, IMI, preço por m²
  - Agregação de múltiplas fontes com range de preços
- **Características**:
  - Áreas (total, útil, terreno)
  - Divisões (quartos, casas de banho, WC)
  - Extras (vagas, andar, certificação energética)
  - Features (elevador, varanda, piscina, etc.)
- **Metadados**:
  - Fontes de dados (portais, CRMs, Casafari)
  - Timestamps (primeira vista, última atualização)
  - Qualidade dos dados (HIGH, MEDIUM, LOW, INVALID)
  - Validações automáticas
  - Deduplicação e similaridade

### 2. Validação com Zod

Schemas completos para validação de dados:

```typescript
import { validateProperty } from '@/models';

const result = validateProperty(propertyData);
if (result.success) {
  // Dados válidos
  console.log(result.data);
} else {
  // Erros de validação
  console.error(result.errors);
}
```

Validações específicas:
- Endereços portugueses (código postal XXXX-XXX)
- Coordenadas geográficas (latitude -90 a 90, longitude -180 a 180)
- Tipologia (T0, T1, T2, etc.)
- Certificação energética (A+ a G)

### 3. Transformers

#### CasafariTransformer

Converte dados do Casafari para o modelo canônico:

```typescript
import { CasafariTransformer, CasafariRawData } from '@/models';

const casafariData: CasafariRawData = {
  id: 'casafari-123',
  propertyType: 'apartment',
  location: { municipality: 'Lisboa', district: 'Lisboa' },
  price: { value: 250000, currency: 'EUR' },
  // ... outros campos
};

const property = CasafariTransformer.transform(casafariData, 'tenant-id');
```

Funcionalidades:
- Mapeamento de tipos de propriedade (PT/EN)
- Normalização de código postal
- Cálculo de preço por m²
- Mapeamento de características e features
- Avaliação de qualidade dos dados

#### CRMTransformer

Converte dados de CRMs genéricos:

```typescript
import { CRMTransformer, CRMRawData } from '@/models';

const crmData: CRMRawData = {
  id: 'crm-123',
  crmName: 'Salesforce',
  propertyType: 'apartment',
  city: 'Lisboa',
  price: 300000,
  // ... outros campos
};

const property = CRMTransformer.transform(crmData, 'tenant-id');
```

Funcionalidades:
- Suporte para múltiplos CRMs (Salesforce, HubSpot, etc.)
- Inferência de tipologia a partir do número de quartos
- Construção de endereço formatado
- Mapeamento de features e amenidades (objeto ou array)

### 4. Geocodificação

Serviço para normalização de endereços e coordenadas:

```typescript
import { GeocodingService } from '@/services';

// Converter endereço em coordenadas
const result = await GeocodingService.geocode('Rua do Comércio 123, Lisboa');
// { latitude: 38.7223, longitude: -9.1393, ... }

// Converter coordenadas em endereço
const address = await GeocodingService.reverseGeocode(38.7223, -9.1393);
// { formattedAddress: '...', address: { ... } }

// Normalizar localização de propriedade (adiciona dados faltantes)
const normalized = await GeocodingService.normalizeLocation(property.location);

// Calcular distância entre coordenadas
const distance = GeocodingService.calculateDistance(lat1, lon1, lat2, lon2);

// Calcular geohash
const geohash = GeocodingService.calculateGeohash(latitude, longitude);
```

**Nota**: O serviço usa mocks em desenvolvimento. Configure `GEOCODING_API_URL` e `GEOCODING_API_KEY` para usar API real em produção.

### 5. Repositório (PropertyRepository)

CRUD completo com busca avançada:

```typescript
import { PropertyRepository } from '@/repositories';

const repo = new PropertyRepository();

// Criar propriedade
const property = await repo.create(canonicalProperty);

// Buscar por ID
const property = await repo.findById('prop-123');

// Buscar por tenant (com paginação)
const result = await repo.findByTenant('tenant-123', {
  page: 1,
  pageSize: 20,
  orderBy: 'created_at',
  orderDirection: 'desc',
});

// Busca com filtros
const result = await repo.search({
  tenantId: 'tenant-123',
  concelho: ['Lisboa', 'Porto'],
  priceMin: 200000,
  priceMax: 500000,
  bedroomsMin: 2,
  hasCoordinates: true,
});

// Busca geográfica (propriedades próximas)
const nearby = await repo.searchNearby(
  38.7223, // latitude
  -9.1393, // longitude
  5, // raio em km
  { tenantId: 'tenant-123' }
);

// Atualizar propriedade
await repo.update('prop-123', { title: 'Novo título' });

// Deletar propriedade
await repo.delete('prop-123');

// Buscar duplicados
const duplicates = await repo.findDuplicates(property);
```

### 6. Mesclagem de Dados

Quando a mesma propriedade aparece em múltiplas fontes:

```typescript
const property1 = CasafariTransformer.transform(casafariData, 'tenant-123');
const property2 = CRMTransformer.transform(crmData, 'tenant-123');

// Mescla dados de múltiplas fontes
property1.merge(property2);

// Agora property1 contém:
// - Todas as informações únicas de property1
// - Informações complementares de property2
// - Array de fontes combinado
// - Imagens de ambas as fontes
```

## Integração com Banco de Dados

O modelo é compatível com a migração `001_schema_busca_imoveis.sql` que inclui:

### Tabelas Principais

- `public.properties` - Propriedades deduplica das (modelo canônico)
- `public.listing_appearances` - Aparições em cada portal
- `public.contacts` - Proprietários, compradores, agentes
- `public.opportunities` - Oportunidades de angariação/venda
- `ingestion.raw_portal_events` - Dados brutos de portais
- `ingestion.raw_crm_events` - Dados brutos de CRMs
- `ingestion.raw_casafari_events` - Dados brutos do Casafari

### Índices Otimizados

```sql
-- Busca por tenant e team
CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_properties_team ON properties(team_id);

-- Busca geográfica
CREATE INDEX idx_properties_geohash ON properties(geohash);
CREATE INDEX idx_properties_concelho ON properties(concelho);
CREATE INDEX idx_properties_distrito ON properties(distrito);

-- Scores de IA
CREATE INDEX idx_properties_angaria_score ON properties(angaria_score DESC);
CREATE INDEX idx_properties_venda_score ON properties(venda_score DESC);

-- Temporal
CREATE INDEX idx_properties_last_seen ON properties(last_seen DESC);
```

## Testes

Cobertura completa com 43 testes:

```bash
# Executar todos os testes do modelo canônico
npm test -- --testPathPattern="Property|Casafari|CRM"

# Resultados:
# ✓ PropertyCanonicalModel.test.ts (13 tests)
# ✓ PropertyValidator.test.ts (18 tests)
# ✓ CasafariTransformer.test.ts (8 tests)
# ✓ CRMTransformer.test.ts (4 tests)
```

### Casos de Teste

1. **PropertyCanonicalModel**:
   - Criação com dados mínimos e completos
   - Validação de campos obrigatórios
   - Cálculo de qualidade de dados
   - Mesclagem de propriedades
   - Serialização/desserialização JSON

2. **PropertyValidator**:
   - Validação de propriedade completa
   - Validação de endereços portugueses
   - Validação de coordenadas geográficas
   - Normalização de código postal
   - Normalização de tipologia
   - Normalização de certificação energética

3. **CasafariTransformer**:
   - Transformação de dados completos e mínimos
   - Mapeamento de tipos de propriedade PT/EN
   - Cálculo de preço por m²
   - Normalização de código postal
   - Transformação em lote

4. **CRMTransformer**:
   - Transformação de dados completos e mínimos
   - Inferência de tipologia
   - Mapeamento de features (objeto e array)
   - Construção de endereço formatado
   - Transformação em lote

## Uso no Edge Function IA Busca

O Edge Function foi atualizado para informar sobre o modelo canônico:

```bash
# Deploy
supabase functions deploy ia-busca

# Testar
curl -X POST https://[PROJECT].supabase.co/functions/v1/ia-busca \
  -H "Content-Type: application/json" \
  -d '{"query": "T3 em Lisboa", "portals": ["idealista", "casafari"]}'
```

Resposta inclui informações sobre o modelo canônico:
```json
{
  "function": "ia-busca",
  "status": "ok",
  "canonicalModel": {
    "enabled": true,
    "transformers": ["casafari", "crm"],
    "validators": ["address", "coordinates", "price", "characteristics"]
  },
  "repository": {
    "available": true,
    "operations": ["create", "read", "update", "delete", "search", "nearby"]
  }
}
```

## Exemplo de Fluxo Completo

```typescript
import {
  CasafariTransformer,
  CRMTransformer,
  validateProperty,
  PropertyCanonicalModel,
} from '@/models';
import { GeocodingService } from '@/services';
import { PropertyRepository } from '@/repositories';

async function processProperty(rawData: any, source: 'casafari' | 'crm') {
  // 1. Transformar dados da fonte
  let property: PropertyCanonicalModel;
  if (source === 'casafari') {
    property = CasafariTransformer.transform(rawData, 'tenant-123');
  } else {
    property = CRMTransformer.transform(rawData, 'tenant-123');
  }

  // 2. Normalizar localização (adiciona coordenadas ou endereço)
  property.location = await GeocodingService.normalizeLocation(property.location);

  // 3. Validar dados
  const validation = validateProperty(property.toJSON());
  if (!validation.success) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // 4. Verificar duplicados
  const repo = new PropertyRepository();
  const duplicates = await repo.findDuplicates(property);

  if (duplicates.length > 0) {
    // Mesclar com propriedade existente
    const existing = duplicates[0];
    existing.merge(property);
    await repo.update(existing.id, existing);
  } else {
    // Criar nova propriedade
    await repo.create(property);
  }

  // 5. Calcular qualidade dos dados
  const quality = property.calculateDataQuality();
  console.log(`Property ${property.id} - Quality: ${quality}`);

  return property;
}
```

## Próximos Passos

1. ✅ Modelo canônico implementado
2. ✅ Validators com Zod
3. ✅ Transformers (Casafari + CRM)
4. ✅ Geocoding service
5. ✅ PropertyRepository com CRUD
6. ✅ Testes completos (43 testes passando)
7. ✅ Documentação completa
8. 🔄 Deploy Edge Function (pendente)
9. 🔄 Integração com frontend
10. 🔄 Implementar deduplicação automática
11. 🔄 Adicionar mais transformers (Idealista, OLX, etc.)

## Variáveis de Ambiente

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Geocoding (opcional - usa mocks se não configurado)
GEOCODING_API_URL=https://maps.googleapis.com/maps/api
GEOCODING_API_KEY=your-geocoding-api-key
```

## Contribuindo

Para adicionar um novo transformer:

1. Criar arquivo em `src/models/transformers/[Source]Transformer.ts`
2. Implementar interface `[Source]RawData`
3. Criar classe `[Source]Transformer` com método `static transform()`
4. Adicionar testes em `__tests__/[Source]Transformer.test.ts`
5. Exportar em `src/models/index.ts`

## Licença

Parte do projeto Imoagent - Ver LICENSE na raiz do projeto.
