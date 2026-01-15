# CRM Service - Integração através da IA Orquestradora

## Visão Geral

O CRMService é um módulo que integra sistemas CRM externos **exclusivamente através da IA Orquestradora**, seguindo a arquitetura do Imoagent. Nunca conecta diretamente aos APIs dos CRMs.

## Arquitetura

```
┌─────────────────┐
│  IA Busca       │
│  Module         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  CRMService     │────▶│ IA Orquestradora│
│  (src/services/ │     │  (Supabase Edge │
│   crm/)         │     │   Function)     │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  CRM Systems    │
                        │  (Salesforce,   │
                        │   HubSpot, etc) │
                        └─────────────────┘
```

## Funcionalidades

### 1. Sincronização de Leads (`syncLeads`)
- Sincroniza leads de qualquer CRM através da IA Orquestradora
- Transforma dados para modelo canônico
- Suporta processamento em lote
- Retorna estatísticas de sucesso/falha

### 2. Atualização de Lead (`updateLead`)
- Atualiza status e dados de lead
- Comunica via IA Orquestradora
- Suporta atualizações parciais

### 3. Consulta de Status (`getLeadStatus`)
- Obtém status atual do lead no CRM
- Retorna metadados do CRM
- Tracking de última atualização

### 4. Fila de Sincronização
- Processamento assíncrono opcional
- Suporta modo manual ou automático
- Estatísticas em tempo real

### 5. Retry Logic
- Retry automático com exponential backoff
- Configurável (max retries, delays)
- Jitter para evitar thundering herd

### 6. Logging e Monitoring
- Logs estruturados por nível (DEBUG, INFO, WARN, ERROR)
- Histórico de operações
- Métricas de performance

## Instalação

```bash
# Já incluído no projeto Imoagent
# Não requer instalação adicional
```

## Configuração

```typescript
import { CRMService } from '@/services/crm';

const crmService = new CRMService({
  // URL da IA Orquestradora (Supabase Edge Function)
  orchestratorUrl: 'https://ieponcrmmetksukwvmtv.supabase.co/functions/v1/ia-orquestradora',
  
  // Configuração de retry (opcional)
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
  
  // Habilitar fila de sincronização (opcional, default: true)
  enableQueue: true,
  
  // Processar fila automaticamente (opcional, default: false)
  autoProcessQueue: false,
  
  // Intervalo de processamento da fila em ms (opcional, default: 5000)
  queueProcessIntervalMs: 5000,
});
```

## Uso Básico

### Sincronizar Leads

```typescript
const leads = [
  {
    id: 'lead-1',
    name: 'João Silva',
    email: 'joao.silva@example.com',
    phone: '+351912345678',
    source: LeadSource.PORTAL,
    status: LeadStatus.NEW,
  },
  {
    id: 'lead-2',
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '+351923456789',
    source: LeadSource.WEBSITE,
    status: LeadStatus.NEW,
  },
];

const result = await crmService.syncLeads(leads);

console.log(`Sincronizados: ${result.synced_leads}`);
console.log(`Falhas: ${result.failed_leads}`);

if (result.errors.length > 0) {
  console.error('Erros:', result.errors);
}
```

### Atualizar Lead

```typescript
const success = await crmService.updateLead({
  lead_id: 'lead-1',
  updates: {
    status: LeadStatus.CONTACTED,
    metadata: {
      last_contact_date: new Date().toISOString(),
      notes: 'Cliente interessado em apartamento T2',
    },
  },
});

if (success) {
  console.log('Lead atualizado com sucesso');
}
```

### Consultar Status

```typescript
const status = await crmService.getLeadStatus('lead-1');

if (status) {
  console.log(`Status: ${status.status}`);
  console.log(`Última atualização: ${status.last_updated}`);
  console.log('Metadata CRM:', status.crm_metadata);
}
```

### Processar Fila Manualmente

```typescript
// Com fila habilitada e autoProcessQueue: false
await crmService.syncLeads(leads); // Adiciona à fila

// Processar quando apropriado
await crmService.processQueue();

// Verificar estatísticas
const stats = crmService.getQueueStats();
console.log('Fila:', stats);
// { total: 10, pending: 2, in_progress: 1, success: 6, failed: 1, retry: 0 }
```

## Modelo de Dados Canônico

### CanonicalLead

```typescript
interface CanonicalLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  property_interest?: {
    typology?: string;
    location?: string;
    price_range?: {
      min?: number;
      max?: number;
    };
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### LeadStatus (Enum)

```typescript
enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}
```

### LeadSource (Enum)

```typescript
enum LeadSource {
  PORTAL = 'PORTAL',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  MANUAL = 'MANUAL',
}
```

## Transformação de Dados

O CRMService automaticamente transforma dados de diferentes formatos CRM para o modelo canônico:

```typescript
// Exemplo: Dados do Salesforce
const salesforceLead = {
  Id: 'SF-12345',
  FirstName: 'João',
  LastName: 'Silva',
  Email: 'joao@example.com',
  Phone: '+351912345678',
  LeadSource: 'Web',
  Status: 'Open - Not Contacted',
};

// É transformado automaticamente para:
const canonicalLead = {
  id: 'SF-12345',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '+351912345678',
  source: LeadSource.WEBSITE,
  status: LeadStatus.NEW,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};
```

## Monitoramento e Logs

### Acessar Logs

```typescript
import { logger, LogLevel } from '@/services/crm';

// Ver todos os logs
const allLogs = logger.getLogs();

// Ver apenas erros
const errors = logger.getLogs(LogLevel.ERROR);

// Ver últimos 5 erros
const recentErrors = logger.getRecentErrors(5);

console.log(recentErrors);
```

### Estatísticas da Fila

```typescript
const stats = crmService.getQueueStats();

console.log(`Total de itens: ${stats.total}`);
console.log(`Pendentes: ${stats.pending}`);
console.log(`Em processamento: ${stats.in_progress}`);
console.log(`Sucesso: ${stats.success}`);
console.log(`Falhas: ${stats.failed}`);
console.log(`Aguardando retry: ${stats.retry}`);
```

## Tratamento de Erros

### Retry Automático

O serviço retenta automaticamente operações que falham:

```typescript
// Configuração de retry
const crmService = new CRMService({
  orchestratorUrl: 'https://...',
  retryConfig: {
    maxRetries: 3,        // Máximo de tentativas
    initialDelayMs: 1000, // Delay inicial (1s)
    maxDelayMs: 30000,    // Delay máximo (30s)
    backoffMultiplier: 2, // Multiplicador (exponencial)
  },
});

// Tentativa 1: Falha - aguarda 1s
// Tentativa 2: Falha - aguarda 2s
// Tentativa 3: Falha - aguarda 4s
// Tentativa 4 (final): Sucesso ou erro definitivo
```

### Tratamento em Fila

Items que falham são automaticamente re-enfileirados:

```typescript
// Item falha
queue.updateStatus(itemId, SyncStatus.FAILED, 'Connection timeout');

// Se retry_count < max_retries, status vira RETRY
// Item será processado novamente na próxima iteração

// Se retry_count >= max_retries, status permanece FAILED
// Item não será mais processado automaticamente
```

## Testes

### Executar Testes

```bash
# Todos os testes do CRM service
npm test -- __tests__/services/crm

# Teste específico
npm test -- __tests__/services/crm/CRMService.test.ts
```

### Cobertura de Testes

- ✅ Sincronização de leads (sucesso e falha)
- ✅ Atualização de leads
- ✅ Consulta de status
- ✅ Gestão de fila
- ✅ Retry logic com exponential backoff
- ✅ Transformação de dados para modelo canônico
- ✅ Estatísticas e monitoring

## Integração com IA Orquestradora

### Protocolo de Comunicação

```typescript
// Request para IA Orquestradora
POST https://[supabase-url]/functions/v1/ia-orquestradora
{
  "module": "ia-busca",
  "action": "crm_sync_lead",
  "payload": {
    "lead": {
      "id": "lead-1",
      "name": "João Silva",
      // ... outros campos
    }
  },
  "timestamp": "2026-01-15T10:00:00Z"
}

// Response da IA Orquestradora
{
  "success": true,
  "action": "sync_lead",
  "data": {
    "lead_id": "lead-1",
    "synced": true,
    "crm_id": "crm_1705315200000"
  },
  "timestamp": "2026-01-15T10:00:00Z"
}
```

### Ações Suportadas

- `crm_sync_lead` - Sincronizar novo lead
- `crm_update_lead` - Atualizar lead existente
- `crm_get_lead_status` - Consultar status do lead

## Boas Práticas

### 1. Use Fila para Operações em Lote

```typescript
const crmService = new CRMService({
  orchestratorUrl: '...',
  enableQueue: true,
  autoProcessQueue: true,
  queueProcessIntervalMs: 10000, // Processa a cada 10s
});

// Adiciona leads à fila ao longo do tempo
await crmService.syncLeads([lead1]);
await crmService.syncLeads([lead2]);
await crmService.syncLeads([lead3]);

// Fila processa automaticamente em background
```

### 2. Configure Retry Apropriadamente

```typescript
// Para operações críticas: mais retries
const crmService = new CRMService({
  orchestratorUrl: '...',
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  },
});
```

### 3. Monitore Logs e Estatísticas

```typescript
// Verificar periodicamente
setInterval(() => {
  const stats = crmService.getQueueStats();
  const errors = logger.getRecentErrors(10);
  
  if (stats.failed > 10) {
    console.warn('Muitas falhas na fila CRM:', stats);
  }
  
  if (errors.length > 0) {
    console.error('Erros recentes:', errors);
  }
}, 60000); // A cada minuto
```

### 4. Cleanup Periódico

```typescript
// Limpar items antigos da fila
setInterval(() => {
  crmService.processQueue(); // Processa pendentes
  
  // Cleanup automático remove items com sucesso > 24h
}, 3600000); // A cada hora
```

## Limitações e Considerações

1. **Dependência da IA Orquestradora**: O serviço requer que a IA Orquestradora esteja deployed e acessível
2. **Rate Limiting**: Respeite os limites dos CRMs externos (configurado na IA Orquestradora)
3. **Dados Sensíveis**: Nunca logue ou armazene dados sensíveis dos clientes
4. **Idempotência**: Operações de sync devem ser idempotentes (mesmo lead pode ser sincronizado múltiplas vezes)

## Troubleshooting

### Erro: "Orchestrator returned 500"

```typescript
// Verificar se IA Orquestradora está deployed
// Verificar credenciais Supabase
// Verificar logs da Edge Function
```

### Leads não sincronizam

```typescript
// Verificar status da fila
const stats = crmService.getQueueStats();
console.log(stats);

// Verificar erros
const errors = logger.getRecentErrors(10);
console.log(errors);

// Processar fila manualmente
await crmService.processQueue();
```

### Retry loops infinitos

```typescript
// Verificar configuração de maxRetries
// Verificar se erros são transientes ou permanentes
// Limpar items problemáticos da fila

// Para item específico:
queue.remove(itemId);
```

## Roadmap

- [ ] Suporte para webhooks de CRMs
- [ ] Sincronização bidirecional (CRM → Imoagent)
- [ ] Dashboard de monitoring
- [ ] Métricas de performance (Prometheus/Grafana)
- [ ] Bulk operations otimizadas
- [ ] Cache de dados do CRM

## Suporte

Para dúvidas ou issues:
- Documentação: `docs/CRM_INTEGRATION.md`
- Issues: GitHub Issues
- Email: suporte@imoagent.com

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026  
**Autor**: Imoagent Team
