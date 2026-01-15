# CRM Service Integration

Integração completa com CRMs via IA Orquestradora, seguindo o modelo canônico do Imoagent.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Uso Básico](#uso-básico)
- [API Reference](#api-reference)
- [Modelo Canônico](#modelo-canônico)
- [Fila e Retry Logic](#fila-e-retry-logic)
- [Exemplos](#exemplos)
- [Testes](#testes)

## 🎯 Visão Geral

O **CRMService** é um serviço de integração que permite sincronizar e gerenciar leads de múltiplos CRMs (Salesforce, HubSpot, Pipedrive, etc.) comunicando-se APENAS com a IA Orquestradora.

### Características Principais

- ✅ **Comunicação via IA Orquestradora**: Todo o tráfego passa pela IA Orquestradora
- ✅ **Modelo Canônico**: Transformação automática para formato padronizado
- ✅ **Fila com Retry**: Gestão automática de falhas com exponential backoff
- ✅ **Controle de Concorrência**: Limite configurável de operações simultâneas
- ✅ **Logs Detalhados**: Rastreamento completo de todas as operações
- ✅ **Type-Safe**: TypeScript com tipos completos
- ✅ **Testado**: Cobertura completa de testes unitários

## 🏗️ Arquitetura

```
┌─────────────┐
│ CRMService  │
└──────┬──────┘
       │
       │ HTTP POST
       ▼
┌──────────────────┐
│ IA Orquestradora │
└──────┬───────────┘
       │
       │ Routing
       ▼
┌─────────────────────┐
│ ia-leads-comissoes  │
└──────┬──────────────┘
       │
       │ API Calls
       ▼
┌────────────────┐
│  CRM APIs      │
│ (Salesforce,   │
│  HubSpot, etc) │
└────────────────┘
```

### Componentes

#### 1. **CRMService** (`src/services/crm/CRMService.ts`)
Serviço principal que gerencia comunicação com CRMs via orquestrador.

**Métodos:**
- `syncLeads(crmName, filters?)`: Sincroniza leads do CRM
- `updateLead(leadId, crmName, updates)`: Atualiza lead no CRM
- `getLeadStatus(leadId, crmName)`: Obtém status de um lead
- `transformLead(crmData)`: Transforma dados brutos para modelo canônico
- `getQueueStats()`: Obtém estatísticas da fila

#### 2. **QueueManager** (`src/services/crm/QueueManager.ts`)
Gerenciador de fila com retry logic e controle de concorrência.

**Características:**
- Exponential backoff (1s, 2s, 4s, 8s...)
- Controle de concorrência (default: 3 operações simultâneas)
- Limpeza automática de itens antigos
- Estatísticas em tempo real

#### 3. **LeadTransformer** (`src/services/crm/LeadTransformer.ts`)
Transformador bidirecional entre dados de CRM e modelo canônico.

**Suporte:**
- Normalização de campos em português e inglês
- Mapeamento inteligente de status, fontes e tipos de interesse
- Conversão de ratings qualitativos para scores numéricos
- Validação e limpeza de dados

## 📦 Instalação

O serviço já está integrado no projeto. Para usar:

```typescript
import { createCRMService } from '@/services/crm';
```

### Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_TENANT_ID=your-tenant-id
```

## 🚀 Uso Básico

### Criar Instância

```typescript
import { createCRMService } from '@/services/crm';

const crmService = createCRMService({
  tenantId: 'my-tenant-id',
  teamId: 'my-team-id', // opcional
  timeout: 30000, // 30 segundos
  maxRetries: 3,
  retryDelay: 1000,
  queueConcurrency: 3,
});
```

### Sincronizar Leads

```typescript
// Sincronizar todos os leads
const result = await crmService.syncLeads('Salesforce');

if (result.success) {
  console.log(`Sincronizados ${result.leads.length} leads`);
  result.leads.forEach(lead => {
    console.log(`${lead.name}: ${lead.status}`);
  });
}
```

### Sincronizar com Filtros

```typescript
const result = await crmService.syncLeads('HubSpot', {
  status: ['new', 'contacted'],
  dateFrom: '2024-01-01',
  limit: 50,
});
```

### Atualizar Lead

```typescript
const result = await crmService.updateLead(
  'lead-12345',
  'Pipedrive',
  {
    status: 'qualified',
    score: 85,
    notes: 'Cliente interessado',
    agentId: 'agent-456',
  }
);
```

### Obter Status

```typescript
const result = await crmService.getLeadStatus('lead-12345', 'Salesforce');

if (result.success) {
  console.log(`Status: ${result.status}`);
}
```

## 📚 API Reference

### CRMService

#### `syncLeads(crmName: string, filters?: SyncLeadsFilters): Promise<SyncLeadsResponse>`

Sincroniza leads do CRM especificado.

**Parâmetros:**
- `crmName`: Nome do CRM (ex: "Salesforce", "HubSpot")
- `filters`: Filtros opcionais
  - `status`: Array de status para filtrar
  - `dateFrom`: Data inicial (ISO string)
  - `dateTo`: Data final (ISO string)
  - `limit`: Número máximo de leads
  - `offset`: Offset para paginação

**Retorno:**
```typescript
{
  success: boolean;
  leads: Lead[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  syncMetadata: {
    syncedAt: Date;
    source: string;
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
  };
  error?: string;
}
```

#### `updateLead(leadId: string, crmName: string, updates: UpdateLeadData): Promise<UpdateLeadResponse>`

Atualiza um lead no CRM.

**Parâmetros:**
- `leadId`: ID do lead
- `crmName`: Nome do CRM
- `updates`: Dados para atualização
  - `status`: Novo status
  - `score`: Novo score (0-100)
  - `notes`: Notas adicionais
  - `agentId`: ID do agente responsável
  - `nextFollowUpDate`: Data do próximo follow-up

**Retorno:**
```typescript
{
  success: boolean;
  lead?: Lead;
  error?: string;
}
```

#### `getLeadStatus(leadId: string, crmName: string): Promise<GetLeadStatusResponse>`

Obtém o status atual de um lead.

**Retorno:**
```typescript
{
  success: boolean;
  lead?: Lead;
  status?: LeadStatus;
  lastUpdated?: Date;
  error?: string;
}
```

### LeadTransformer

#### `transform(crmData: CRMLeadRawData, tenantId: string, teamId?: string): Lead`

Transforma dados brutos de CRM para modelo canônico.

#### `transformBatch(crmDataArray: CRMLeadRawData[], tenantId: string, teamId?: string): Lead[]`

Transforma múltiplos leads de uma vez.

#### `toUpdatePayload(lead: Lead): Record<string, any>`

Converte Lead canônico para formato de atualização de CRM.

### QueueManager

#### `enqueue(item: QueueItemData): string`

Adiciona item à fila. Retorna ID do item.

#### `complete(itemId: string): void`

Marca item como completado.

#### `fail(itemId: string, error: Error): Promise<void>`

Marca item como falho. Tenta retry automaticamente se possível.

#### `getStats(): QueueStats`

Retorna estatísticas da fila.

```typescript
{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}
```

## 🗂️ Modelo Canônico

### Lead

```typescript
interface Lead {
  id: string;
  tenantId: string;
  teamId?: string;
  
  // Informações básicas
  name: string;
  email?: string;
  phone?: string;
  
  // Status e classificação
  status: LeadStatus; // 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  source: LeadSource; // 'website' | 'portal' | 'referral' | 'social_media' | 'campaign' | 'other'
  score?: number; // 0-100
  
  // Interesse
  interestType: LeadInterestType; // 'buy' | 'sell' | 'rent' | 'rent_out'
  propertyId?: string;
  
  // Localização de interesse
  locationInterest?: {
    concelho?: string;
    distrito?: string;
    freguesia?: string;
  };
  
  // Orçamento
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  
  // Informações adicionais
  message?: string;
  notes?: string;
  
  // Metadados
  metadata: {
    sources: Array<{
      type: 'CRM' | 'MANUAL' | 'IMPORT';
      name: string;
      id: string;
      url?: string;
    }>;
    agentId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### Mapeamento de Status

| CRM Status (PT) | CRM Status (EN) | Lead Status |
|-----------------|-----------------|-------------|
| novo, aberto | new, open | NEW |
| contatado, em contato | contacted, in contact | CONTACTED |
| qualificado, em negociação | qualified, working | QUALIFIED |
| convertido, ganho | converted, won | CONVERTED |
| perdido, morto | lost, dead | LOST |

### Mapeamento de Fontes

| Fonte | LeadSource |
|-------|------------|
| website, site, web form | WEBSITE |
| portal, idealista, imovirtual, olx, casa sapo | PORTAL |
| referral, referência, indicação | REFERRAL |
| social, facebook, instagram, linkedin | SOCIAL_MEDIA |
| campaign, campanha, email, ads | CAMPAIGN |

## ⚙️ Fila e Retry Logic

### Funcionamento

1. **Enqueue**: Operação é adicionada à fila com status `pending`
2. **Processing**: QueueManager processa até atingir limite de concorrência
3. **Success**: Item marcado como `completed`
4. **Failure**: Item é re-enfileirado com retry após delay exponencial
5. **Max Retries**: Após esgotar tentativas, item é marcado como `failed`

### Exponential Backoff

```
Attempt 1: delay * 2^0 = 1s
Attempt 2: delay * 2^1 = 2s
Attempt 3: delay * 2^2 = 4s
```

### Configuração

```typescript
const crmService = createCRMService({
  tenantId: 'my-tenant-id',
  maxRetries: 3, // Máximo de tentativas
  retryDelay: 1000, // Delay base em ms
  queueConcurrency: 3, // Operações simultâneas
});
```

## 💡 Exemplos

Veja exemplos completos em `src/examples/crm-integration-example.ts`:

- Criação de serviço
- Sincronização de leads
- Sincronização com filtros
- Atualização de leads
- Obtenção de status
- Monitoramento de fila
- Transformação de dados
- Limpeza e manutenção
- Tratamento de erros

Para executar:

```bash
npm run ts-node src/examples/crm-integration-example.ts
```

## 🧪 Testes

O projeto inclui testes completos para todos os componentes.

### Executar Testes

```bash
# Todos os testes CRM
npm test -- --testNamePattern="(QueueManager|LeadTransformer|CRMService)"

# Apenas QueueManager
npm test -- QueueManager

# Apenas LeadTransformer
npm test -- LeadTransformer

# Apenas CRMService
npm test -- CRMService
```

### Cobertura

- **QueueManager**: 16 testes
- **LeadTransformer**: 18 testes
- **CRMService**: 20 testes

**Total: 54 testes, 100% de cobertura**

## 🔧 Troubleshooting

### Erro: "Tenant ID is required"

Configure a variável de ambiente:

```bash
NEXT_PUBLIC_TENANT_ID=your-tenant-id
```

Ou passe diretamente:

```typescript
const crmService = createCRMService({
  tenantId: 'your-tenant-id',
});
```

### Timeout nas requisições

Aumente o timeout:

```typescript
const crmService = createCRMService({
  tenantId: 'your-tenant-id',
  timeout: 60000, // 60 segundos
});
```

### Muitas falhas na fila

Aumente o número de retries:

```typescript
const crmService = createCRMService({
  tenantId: 'your-tenant-id',
  maxRetries: 5,
  retryDelay: 2000, // 2 segundos
});
```

### Limpeza de memória

Execute limpeza periódica:

```typescript
// A cada hora
setInterval(() => {
  crmService.cleanupQueue(3600000); // Remove itens de 1h atrás
}, 3600000);
```

## 📝 Notas

- ✅ Todas as operações são assíncronas
- ✅ Erros são tratados graciosamente
- ✅ Logs detalhados para debugging
- ✅ Type-safe com TypeScript
- ✅ Compatível com todos os CRMs que seguem padrão REST

## 🔗 Links

- [PropertyCanonicalModel](../models/PropertyCanonicalModel.ts)
- [CasafariService](../services/casafari/)
- [IA Orquestradora](../../supabase/functions/ia-orquestradora/)
