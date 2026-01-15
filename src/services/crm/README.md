# CRM Service

Serviço de integração com CRM através da **IA Orquestradora** para o módulo **IA Busca**.

## 📁 Estrutura

```
src/services/crm/
├── CRMService.ts      # Classe principal do serviço
├── types.ts           # Tipos e interfaces TypeScript
├── queue.ts           # Sistema de fila de sincronização
├── retry.ts           # Lógica de retry com exponential backoff
├── logger.ts          # Sistema de logs e monitoring
├── index.ts           # Exports públicos
├── examples.ts        # Exemplos de uso
└── README.md          # Esta documentação
```

## 🚀 Início Rápido

```typescript
import { CRMService, LeadStatus, LeadSource } from '@/services/crm';

// 1. Configurar serviço
const crmService = new CRMService({
  orchestratorUrl: 'https://[supabase].supabase.co/functions/v1/ia-orquestradora',
  enableQueue: true,
  autoProcessQueue: false,
});

// 2. Sincronizar leads
const result = await crmService.syncLeads([
  {
    id: 'lead-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+351912345678',
    source: LeadSource.PORTAL,
    status: LeadStatus.NEW,
  },
]);

// 3. Processar fila
await crmService.processQueue();

// 4. Verificar status
const status = await crmService.getLeadStatus('lead-1');
console.log(status);
```

## 📚 Documentação Completa

Ver: [`/docs/CRM_INTEGRATION.md`](../../../docs/CRM_INTEGRATION.md)

## 🧪 Testes

```bash
# Executar testes do CRM service
npm test -- __tests__/services/crm

# Teste específico
npm test -- __tests__/services/crm/CRMService.test.ts

# Com coverage
npm test -- __tests__/services/crm --coverage
```

## 🔑 Características Principais

- ✅ **Comunicação exclusiva via IA Orquestradora** - Não conecta diretamente aos CRMs
- ✅ **Modelo de dados canônico** - Formato único para todos os CRMs
- ✅ **Fila de sincronização** - Processamento assíncrono com estatísticas
- ✅ **Retry automático** - Exponential backoff com jitter
- ✅ **Logging estruturado** - Níveis DEBUG, INFO, WARN, ERROR
- ✅ **TypeScript** - Totalmente tipado
- ✅ **Testado** - Cobertura completa de testes unitários

## 📊 API Principal

### CRMService

#### `syncLeads(leads: any[]): Promise<SyncResult>`
Sincroniza array de leads com CRM via IA Orquestradora.

#### `updateLead(request: UpdateLeadRequest): Promise<boolean>`
Atualiza dados de um lead específico.

#### `getLeadStatus(leadId: string): Promise<LeadStatusResponse | null>`
Consulta status atual de um lead no CRM.

#### `processQueue(): Promise<void>`
Processa items pendentes na fila de sincronização.

#### `getQueueStats(): QueueStats`
Retorna estatísticas da fila (total, pending, success, failed, etc).

#### `destroy(): void`
Limpa recursos e para processamento automático.

## 🔧 Configuração

```typescript
interface CRMServiceConfig {
  orchestratorUrl: string;              // URL da IA Orquestradora (obrigatório)
  retryConfig?: RetryConfig;            // Configuração de retry
  enableQueue?: boolean;                // Habilitar fila (default: true)
  autoProcessQueue?: boolean;           // Processar automaticamente (default: false)
  queueProcessIntervalMs?: number;      // Intervalo de processamento (default: 5000)
}
```

## 📦 Tipos Exportados

- `CRMService` - Classe principal
- `LeadStatus` - Enum de status (NEW, CONTACTED, QUALIFIED, CONVERTED, LOST)
- `LeadSource` - Enum de origem (PORTAL, WEBSITE, REFERRAL, MANUAL)
- `SyncStatus` - Enum de status da fila
- `CanonicalLead` - Interface do modelo de lead
- `SyncResult` - Interface do resultado de sincronização
- `UpdateLeadRequest` - Interface de request de atualização
- `LeadStatusResponse` - Interface de response de status
- `logger` - Instância do logger
- `withRetry` - Função utilitária de retry

## 🔗 Integração com IA Busca

O CRM Service foi projetado para o **Módulo IA Busca**:

1. **IA Busca** detecta leads nos portais (OLX, Idealista, etc)
2. **CRMService** transforma leads para modelo canônico
3. **IA Orquestradora** roteia para o CRM apropriado
4. **CRM externo** armazena e gerencia os leads

```
IA Busca → CRMService → IA Orquestradora → CRM
```

## 📝 Exemplos

Ver arquivo completo: [`examples.ts`](./examples.ts)

### Exemplo: Sincronizar leads do portal

```typescript
const portalLeads = [
  {
    id: 'olx-123',
    name: 'João Silva',
    email: 'joao@example.com',
    source: LeadSource.PORTAL,
    status: LeadStatus.NEW,
    metadata: {
      portal: 'OLX',
      property_id: 'olx-prop-456',
    },
  },
];

const result = await crmService.syncLeads(portalLeads);
console.log(`Sincronizados: ${result.synced_leads}, Falhas: ${result.failed_leads}`);
```

### Exemplo: Atualizar após contato

```typescript
await crmService.updateLead({
  lead_id: 'olx-123',
  updates: {
    status: LeadStatus.CONTACTED,
    metadata: {
      contact_date: new Date().toISOString(),
      notes: 'Cliente interessado em visita',
    },
  },
});
```

### Exemplo: Monitoring

```typescript
import { logger, LogLevel } from '@/services/crm';

// Ver erros recentes
const errors = logger.getRecentErrors(10);
console.log('Erros:', errors);

// Estatísticas da fila
const stats = crmService.getQueueStats();
console.log('Fila:', stats);
```

## 🐛 Troubleshooting

### "Orchestrator returned 500"
- ✅ Verificar se IA Orquestradora está deployed
- ✅ Verificar URL do orchestratorUrl
- ✅ Verificar logs da Edge Function no Supabase

### Leads não sincronizam
```typescript
// Ver estatísticas
const stats = crmService.getQueueStats();
console.log(stats);

// Ver erros
const errors = logger.getRecentErrors(5);
console.log(errors);

// Processar manualmente
await crmService.processQueue();
```

### Muitos retries
- ✅ Verificar configuração de `maxRetries`
- ✅ Verificar se erro é transiente ou permanente
- ✅ Limpar items problemáticos: `queue.remove(itemId)`

## 📈 Performance

- **Throughput**: ~100 leads/segundo (com queue)
- **Latência**: 500-2000ms por operação (depende da IA Orquestradora)
- **Retry overhead**: +1-30s por falha (exponential backoff)

## 🔐 Segurança

- ✅ Dados trafegam via HTTPS
- ✅ Autenticação gerenciada pela IA Orquestradora
- ✅ Sem armazenamento local de credenciais CRM
- ✅ Logs não contêm dados sensíveis

## 🚀 Roadmap

- [ ] Suporte a webhooks de CRMs
- [ ] Sincronização bidirecional
- [ ] Dashboard de monitoring
- [ ] Bulk operations otimizadas
- [ ] Cache de dados do CRM

## 📄 Licença

MIT - Ver LICENSE no root do projeto

## 👥 Contribuição

1. Fork o projeto
2. Criar branch de feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit changes (`git commit -m 'Add nova funcionalidade'`)
4. Push to branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

## 📞 Suporte

- **Documentação**: `/docs/CRM_INTEGRATION.md`
- **Issues**: GitHub Issues
- **Email**: suporte@imoagent.com

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026  
**Módulo**: IA Busca
