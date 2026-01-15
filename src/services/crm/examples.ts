/**
 * CRM Service Usage Examples
 * Demonstra como usar o CRMService no módulo IA Busca
 */

import { CRMService, LeadStatus, LeadSource } from '@/services/crm';

// ============================================
// EXEMPLO 1: Configuração Básica
// ============================================

const crmService = new CRMService({
  orchestratorUrl: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/ia-orquestradora',
  enableQueue: true,
  autoProcessQueue: false,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
});

// ============================================
// EXEMPLO 2: Sincronizar Leads de Portal
// ============================================

async function syncPortalLeads() {
  // Leads vindos do IA Busca (portais imobiliários)
  const leadsFromPortals = [
    {
      id: 'olx-lead-1',
      name: 'João Silva',
      email: 'joao.silva@example.com',
      phone: '+351912345678',
      source: LeadSource.PORTAL,
      status: LeadStatus.NEW,
      property_interest: {
        typology: 'T2',
        location: 'Lisboa',
        price_range: {
          min: 200000,
          max: 350000,
        },
      },
      metadata: {
        portal: 'OLX',
        property_id: 'olx-12345',
        viewed_at: new Date().toISOString(),
      },
    },
    {
      id: 'idealista-lead-1',
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      phone: '+351923456789',
      source: LeadSource.PORTAL,
      status: LeadStatus.NEW,
      property_interest: {
        typology: 'T3',
        location: 'Porto',
        price_range: {
          min: 150000,
          max: 250000,
        },
      },
      metadata: {
        portal: 'Idealista',
        property_id: 'idealista-67890',
        contacted_via: 'email',
      },
    },
  ];

  const result = await crmService.syncLeads(leadsFromPortals);
  
  console.log('Sincronização concluída:');
  console.log(`✅ Leads sincronizados: ${result.synced_leads}`);
  console.log(`❌ Falhas: ${result.failed_leads}`);
  
  if (result.errors.length > 0) {
    console.error('Erros encontrados:');
    result.errors.forEach(err => {
      console.error(`- Lead ${err.lead_id}: ${err.error}`);
    });
  }
}

// ============================================
// EXEMPLO 3: Atualizar Status do Lead
// ============================================

async function updateLeadAfterContact(leadId: string) {
  const success = await crmService.updateLead({
    lead_id: leadId,
    updates: {
      status: LeadStatus.CONTACTED,
      metadata: {
        contact_date: new Date().toISOString(),
        contact_method: 'phone',
        notes: 'Cliente interessado, agendar visita',
        next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  });

  if (success) {
    console.log(`✅ Lead ${leadId} atualizado para CONTACTED`);
  } else {
    console.error(`❌ Erro ao atualizar lead ${leadId}`);
  }
}

// ============================================
// EXEMPLO 4: Consultar Status do Lead
// ============================================

async function checkLeadStatus(leadId: string) {
  const status = await crmService.getLeadStatus(leadId);

  if (status) {
    console.log('Status do Lead:', {
      id: status.lead_id,
      status: status.status,
      last_updated: status.last_updated,
      crm_metadata: status.crm_metadata,
    });

    // Decidir ações baseadas no status
    switch (status.status) {
      case LeadStatus.NEW:
        console.log('→ Ação: Iniciar contato');
        break;
      case LeadStatus.CONTACTED:
        console.log('→ Ação: Aguardar resposta');
        break;
      case LeadStatus.QUALIFIED:
        console.log('→ Ação: Agendar visita');
        break;
      case LeadStatus.CONVERTED:
        console.log('→ Ação: Processar comissão');
        break;
      case LeadStatus.LOST:
        console.log('→ Ação: Arquivar');
        break;
    }
  } else {
    console.error(`❌ Lead ${leadId} não encontrado`);
  }
}

// ============================================
// EXEMPLO 5: Processar Fila Manualmente
// ============================================

async function processLeadsQueue() {
  console.log('Iniciando processamento da fila...');
  
  // Verificar estatísticas antes
  const statsBefore = crmService.getQueueStats();
  console.log('Fila antes:', statsBefore);

  // Processar
  await crmService.processQueue();

  // Verificar estatísticas depois
  const statsAfter = crmService.getQueueStats();
  console.log('Fila depois:', statsAfter);
  
  console.log(`Processados: ${statsBefore.pending - statsAfter.pending}`);
}

// ============================================
// EXEMPLO 6: Workflow Completo de Lead
// ============================================

async function completeLeadWorkflow() {
  // 1. Lead chega do portal (IA Busca detecta interesse)
  const newLead = {
    id: 'facebook-lead-1',
    name: 'Pedro Costa',
    email: 'pedro.costa@example.com',
    phone: '+351934567890',
    source: LeadSource.PORTAL,
    status: LeadStatus.NEW,
    property_interest: {
      typology: 'T2',
      location: 'Braga',
      price_range: { min: 180000, max: 280000 },
    },
  };

  // 2. Sincronizar com CRM
  console.log('📥 Sincronizando novo lead...');
  await crmService.syncLeads([newLead]);

  // 3. Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 2000));
  await crmService.processQueue();

  // 4. Verificar status
  console.log('🔍 Verificando status...');
  const status = await crmService.getLeadStatus(newLead.id);
  console.log('Status:', status);

  // 5. Simular contato com cliente
  console.log('📞 Cliente contactado...');
  await updateLeadAfterContact(newLead.id);

  // 6. Aguardar e processar
  await new Promise(resolve => setTimeout(resolve, 1000));
  await crmService.processQueue();

  // 7. Verificar status final
  console.log('✅ Status final:');
  const finalStatus = await crmService.getLeadStatus(newLead.id);
  console.log(finalStatus);
}

// ============================================
// EXEMPLO 7: Integração com IA Busca
// ============================================

async function integrateWithIABusca() {
  // Simulação de dados vindos da IA Busca
  const searchResults = {
    properties: [
      {
        id: 'prop-1',
        portal: 'OLX',
        interested_contacts: [
          {
            name: 'Ana Pereira',
            email: 'ana@example.com',
            phone: '+351945678901',
          },
        ],
      },
      {
        id: 'prop-2',
        portal: 'Idealista',
        interested_contacts: [
          {
            name: 'Carlos Oliveira',
            email: 'carlos@example.com',
            phone: '+351956789012',
          },
        ],
      },
    ],
  };

  // Transformar em leads e sincronizar
  const leads = searchResults.properties.flatMap(prop =>
    prop.interested_contacts.map(contact => ({
      id: `${prop.portal.toLowerCase()}-${prop.id}-${contact.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      source: LeadSource.PORTAL,
      status: LeadStatus.NEW,
      property_interest: {
        location: 'Portugal',
      },
      metadata: {
        portal: prop.portal,
        property_id: prop.id,
        detected_by: 'ia-busca',
        detected_at: new Date().toISOString(),
      },
    }))
  );

  console.log(`📊 Detectados ${leads.length} leads da IA Busca`);
  
  const result = await crmService.syncLeads(leads);
  console.log('Resultado:', result);

  // Processar fila
  await crmService.processQueue();
  
  // Estatísticas
  const stats = crmService.getQueueStats();
  console.log('Estatísticas da fila:', stats);
}

// ============================================
// EXEMPLO 8: Monitoring e Alertas
// ============================================

import { logger, LogLevel } from '@/services/crm';

function setupMonitoring() {
  // Verificar erros a cada minuto
  setInterval(() => {
    const errors = logger.getRecentErrors(5);
    
    if (errors.length > 0) {
      console.warn('⚠️ Erros recentes no CRM Service:');
      errors.forEach(err => {
        console.error(`[${err.timestamp}] ${err.action}: ${err.message}`);
      });
      
      // Aqui você poderia enviar alertas via email, Slack, etc.
      // sendAlert('CRM Service Errors', errors);
    }
  }, 60000);

  // Verificar saúde da fila a cada 5 minutos
  setInterval(() => {
    const stats = crmService.getQueueStats();
    
    if (stats.failed > 10) {
      console.error('🚨 ALERTA: Muitas falhas na fila CRM!');
      console.error('Stats:', stats);
      // sendAlert('High CRM Queue Failure Rate', stats);
    }

    if (stats.pending > 100) {
      console.warn('⚠️ Fila CRM está grande, considerar processar');
      console.warn('Stats:', stats);
    }
  }, 300000);
}

// ============================================
// EXEMPLO 9: Cleanup e Manutenção
// ============================================

async function performMaintenance() {
  console.log('🧹 Iniciando manutenção do CRM Service...');

  // 1. Processar items pendentes
  await crmService.processQueue();

  // 2. Verificar estatísticas
  const stats = crmService.getQueueStats();
  console.log('Estatísticas:', stats);

  // 3. Limpar logs antigos
  const allLogs = logger.getLogs();
  console.log(`Total de logs: ${allLogs.length}`);
  
  if (allLogs.length > 5000) {
    logger.clearLogs();
    console.log('✅ Logs limpos');
  }

  // 4. Relatório de erros
  const errors = logger.getLogs(LogLevel.ERROR);
  console.log(`❌ Total de erros registrados: ${errors.length}`);
  
  // 5. Verificar estatísticas da fila
  const queueStats = crmService.getQueueStats();
  console.log('Estatísticas da fila:', queueStats);

  console.log('✅ Manutenção concluída');
}

// ============================================
// EXECUÇÃO DOS EXEMPLOS
// ============================================

export async function runExamples() {
  try {
    console.log('=== EXEMPLO 1: Configuração Básica ===');
    console.log('✅ CRMService configurado');

    console.log('\n=== EXEMPLO 2: Sincronizar Leads ===');
    await syncPortalLeads();

    console.log('\n=== EXEMPLO 3: Atualizar Lead ===');
    await updateLeadAfterContact('olx-lead-1');

    console.log('\n=== EXEMPLO 4: Consultar Status ===');
    await checkLeadStatus('olx-lead-1');

    console.log('\n=== EXEMPLO 5: Processar Fila ===');
    await processLeadsQueue();

    console.log('\n=== EXEMPLO 6: Workflow Completo ===');
    await completeLeadWorkflow();

    console.log('\n=== EXEMPLO 7: Integração IA Busca ===');
    await integrateWithIABusca();

    console.log('\n=== EXEMPLO 8: Setup Monitoring ===');
    setupMonitoring();
    console.log('✅ Monitoring configurado');

    console.log('\n=== EXEMPLO 9: Manutenção ===');
    await performMaintenance();

    console.log('\n✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  } finally {
    // Cleanup
    crmService.destroy();
    console.log('🧹 CRMService destruído');
  }
}

// Note: Remove this CommonJS check if using ES modules
// To run examples, import and call runExamples() directly
