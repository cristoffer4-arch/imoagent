type OrquestraPayload = { 
  event?: string;
  module?: string;
  action?: string;
  payload?: any;
  timestamp?: string;
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as OrquestraPayload;

  // Handle CRM routing for IA Busca module
  if (payload.module === 'ia-busca' && payload.action?.startsWith('crm_')) {
    const crmAction = payload.action.replace('crm_', '');
    
    // Mock CRM response - in production, this would route to actual CRM systems
    const crmResponse = {
      success: true,
      action: crmAction,
      data: handleCRMAction(crmAction, payload.payload),
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(crmResponse), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = {
    function: "ia-orquestradora",
    status: "ok",
    event: payload.event ?? "heartbeat",
    routes: [
      "ia-busca",
      "ia-coaching",
      "ia-gamificacao",
      "ia-anuncios-idealista",
      "ia-assistente-legal",
      "ia-leads-comissoes",
    ],
    alerts: true,
    crm_integration: true,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}

function handleCRMAction(action: string, payload: any): any {
  switch (action) {
    case 'sync_lead':
      return {
        lead_id: payload.lead?.id,
        synced: true,
        crm_id: `crm_${Date.now()}`,
      };
    
    case 'update_lead':
      return {
        lead_id: payload.lead_id,
        updated: true,
        timestamp: new Date().toISOString(),
      };
    
    case 'get_lead_status':
      return {
        lead_id: payload.lead_id,
        status: 'CONTACTED',
        last_updated: new Date().toISOString(),
        metadata: {
          source: 'CRM',
          last_contact: new Date().toISOString(),
        },
      };
    
    default:
      return { error: `Unknown CRM action: ${action}` };
  }
}
