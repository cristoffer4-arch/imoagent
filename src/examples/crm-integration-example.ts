/**
 * CRM Integration Example
 * 
 * Este arquivo demonstra como usar o CRMService para integrar
 * com CRMs via IA Orquestradora.
 */

import { createCRMService } from '../services/crm';
import { LeadStatus, Lead } from '../types/crm';

/**
 * Exemplo 1: Criar instância do serviço
 */
async function example1_createService() {
  console.log('=== Exemplo 1: Criar Serviço CRM ===\n');

  // Criar serviço usando factory function
  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
    teamId: 'my-team-id', // opcional
    timeout: 30000, // 30 segundos
    maxRetries: 3,
    retryDelay: 1000,
    queueConcurrency: 3,
  });

  console.log('CRMService criado com sucesso!');
  console.log('Estatísticas da fila:', crmService.getQueueStats());
  
  return crmService;
}

/**
 * Exemplo 2: Sincronizar leads do CRM
 */
async function example2_syncLeads() {
  console.log('\n=== Exemplo 2: Sincronizar Leads ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
  });

  try {
    // Sincronizar todos os leads
    const result = await crmService.syncLeads('Salesforce');

    if (result.success) {
      console.log(`✓ Sincronizados ${result.leads.length} leads`);
      console.log('Metadados:', result.syncMetadata);
      
      // Processar leads
      result.leads.forEach((lead: Lead) => {
        console.log(`  - ${lead.name} (${lead.email})`);
        console.log(`    Status: ${lead.status}`);
        console.log(`    Score: ${lead.score || 'N/A'}`);
      });
    } else {
      console.error('✗ Erro ao sincronizar:', result.error);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

/**
 * Exemplo 3: Sincronizar leads com filtros
 */
async function example3_syncLeadsWithFilters() {
  console.log('\n=== Exemplo 3: Sincronizar com Filtros ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
  });

  try {
    // Sincronizar apenas leads novos e contatados dos últimos 7 dias
    const result = await crmService.syncLeads('HubSpot', {
      status: [LeadStatus.NEW, LeadStatus.CONTACTED],
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      limit: 50,
    });

    if (result.success) {
      console.log(`✓ Encontrados ${result.leads.length} leads`);
      
      // Agrupar por status
      const byStatus = result.leads.reduce((acc: Record<string, number>, lead: Lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Por status:', byStatus);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

/**
 * Exemplo 4: Atualizar um lead
 */
async function example4_updateLead() {
  console.log('\n=== Exemplo 4: Atualizar Lead ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
  });

  try {
    // Atualizar status e adicionar nota
    const result = await crmService.updateLead(
      'lead-12345',
      'Pipedrive',
      {
        status: LeadStatus.QUALIFIED,
        score: 85,
        notes: 'Cliente demonstrou interesse em imóvel T3 em Lisboa',
        agentId: 'agent-456',
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // daqui 2 dias
      }
    );

    if (result.success && result.lead) {
      console.log('✓ Lead atualizado com sucesso!');
      console.log(`  Nome: ${result.lead.name}`);
      console.log(`  Novo status: ${result.lead.status}`);
      console.log(`  Score: ${result.lead.score}`);
    } else {
      console.error('✗ Erro ao atualizar:', result.error);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

/**
 * Exemplo 5: Obter status de um lead
 */
async function example5_getLeadStatus() {
  console.log('\n=== Exemplo 5: Obter Status do Lead ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
  });

  try {
    const result = await crmService.getLeadStatus('lead-12345', 'Salesforce');

    if (result.success) {
      console.log('✓ Status obtido com sucesso!');
      console.log(`  Lead: ${result.lead?.name}`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Última atualização: ${result.lastUpdated}`);
    } else {
      console.error('✗ Erro ao obter status:', result.error);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

/**
 * Exemplo 6: Monitorar fila de processamento
 */
async function example6_monitorQueue() {
  console.log('\n=== Exemplo 6: Monitorar Fila ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
    queueConcurrency: 2,
  });

  // Adicionar múltiplas operações
  const operations = [
    crmService.syncLeads('Salesforce'),
    crmService.syncLeads('HubSpot'),
    crmService.syncLeads('Pipedrive'),
  ];

  // Monitorar progresso
  const monitorInterval = setInterval(() => {
    const stats = crmService.getQueueStats();
    console.log('Estatísticas da fila:');
    console.log(`  Pendente: ${stats.pending}`);
    console.log(`  Processando: ${stats.processing}`);
    console.log(`  Completado: ${stats.completed}`);
    console.log(`  Falho: ${stats.failed}`);
    console.log(`  Total: ${stats.total}`);
    console.log('');

    // Parar quando tudo estiver processado
    if (stats.processing === 0 && stats.pending === 0) {
      clearInterval(monitorInterval);
      console.log('✓ Processamento concluído!');
    }
  }, 1000);

  // Aguardar conclusão
  await Promise.all(operations);
  clearInterval(monitorInterval);
}

/**
 * Exemplo 7: Transformar dados brutos de CRM
 */
async function example7_transformData() {
  console.log('\n=== Exemplo 7: Transformar Dados ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
  });

  // Dados brutos do CRM (formato genérico)
  const crmRawData = {
    id: 'crm-lead-789',
    crmName: 'Salesforce',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@example.com',
    phone: '+351912345678',
    status: 'qualified',
    source: 'website',
    score: 90,
    interest: 'buy',
    concelho: 'Porto',
    distrito: 'Porto',
    minBudget: 150000,
    maxBudget: 250000,
    message: 'Procuro apartamento T2 no centro',
  };

  // Transformar para modelo canônico
  const lead = crmService.transformLead(crmRawData);

  console.log('Lead transformado:');
  console.log(`  ID: ${lead.id}`);
  console.log(`  Nome: ${lead.name}`);
  console.log(`  Email: ${lead.email}`);
  console.log(`  Status: ${lead.status}`);
  console.log(`  Interesse: ${lead.interestType}`);
  console.log(`  Localização: ${lead.locationInterest?.concelho}`);
  console.log(`  Orçamento: €${lead.budget?.min} - €${lead.budget?.max}`);
}

/**
 * Exemplo 8: Limpeza e manutenção
 */
async function example8_cleanup() {
  console.log('\n=== Exemplo 8: Limpeza e Manutenção ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
  });

  // Limpar itens completados há mais de 1 hora
  const cleaned = crmService.cleanupQueue(60 * 60 * 1000);
  console.log(`✓ Removidos ${cleaned} itens antigos da fila`);

  // Ver estatísticas atuais
  const stats = crmService.getQueueStats();
  console.log('Estatísticas após limpeza:', stats);

  // Limpar toda a fila (se necessário)
  // crmService.clearQueue();
  // console.log('Fila completamente limpa');
}

/**
 * Exemplo 9: Tratamento de erros
 */
async function example9_errorHandling() {
  console.log('\n=== Exemplo 9: Tratamento de Erros ===\n');

  const crmService = createCRMService({
    tenantId: 'my-tenant-id',
    maxRetries: 3,
    retryDelay: 1000,
  });

  try {
    // Tentar sincronizar com CRM inválido
    const result = await crmService.syncLeads('InvalidCRM');

    if (!result.success) {
      console.log('✗ Sincronização falhou (esperado)');
      console.log(`  Erro: ${result.error}`);
      console.log(`  Total processado: ${result.syncMetadata.totalProcessed}`);
      console.log(`  Sucessos: ${result.syncMetadata.totalSuccess}`);
      console.log(`  Falhas: ${result.syncMetadata.totalFailed}`);
    }

    // A fila tentará automaticamente fazer retry
    console.log('\nA fila fará até 3 tentativas automaticamente...');
    
    // Verificar estatísticas
    const stats = crmService.getQueueStats();
    console.log('Itens com falha:', stats.failed);
  } catch (error) {
    console.error('Erro não tratado:', error);
  }
}

/**
 * Executar todos os exemplos
 */
async function runAllExamples() {
  try {
    await example1_createService();
    // await example2_syncLeads(); // Requer orquestrador ativo
    // await example3_syncLeadsWithFilters(); // Requer orquestrador ativo
    // await example4_updateLead(); // Requer orquestrador ativo
    // await example5_getLeadStatus(); // Requer orquestrador ativo
    // await example6_monitorQueue(); // Requer orquestrador ativo
    await example7_transformData();
    await example8_cleanup();
    // await example9_errorHandling(); // Requer orquestrador ativo

    console.log('\n✓ Exemplos concluídos!');
  } catch (error) {
    console.error('\n✗ Erro ao executar exemplos:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllExamples();
}

export {
  example1_createService,
  example2_syncLeads,
  example3_syncLeadsWithFilters,
  example4_updateLead,
  example5_getLeadStatus,
  example6_monitorQueue,
  example7_transformData,
  example8_cleanup,
  example9_errorHandling,
};
