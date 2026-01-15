type OrquestraPayload = {
  event?: string;
  action?: string;
  tenantId?: string;
  crmName?: string;
  data?: unknown;
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as OrquestraPayload;

  // Handle CRM-specific actions
  if (payload.action?.startsWith('crm.')) {
    return handleCRMAction(payload);
  }

  // Default heartbeat/status response
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
    crmIntegration: {
      enabled: true,
      actions: ["crm.sync", "crm.update", "crm.status"],
      supportedCRMs: ["Salesforce", "HubSpot", "Generic"],
    },
    alerts: true,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Handle CRM-specific actions
 */
function handleCRMAction(payload: OrquestraPayload): Response {
  const { action, tenantId, crmName, data } = payload;

  console.log(`[Orchestrator] Handling CRM action: ${action}`);

  // Mock implementation - in production, this would route to actual CRM APIs
  switch (action) {
    case 'crm.sync':
      return handleCRMSync(tenantId!, crmName!);
    
    case 'crm.update':
      return handleCRMUpdate(data);
    
    case 'crm.status':
      return handleCRMStatus(data);
    
    default:
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unknown CRM action: ${action}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
  }
}

/**
 * Handle CRM sync action
 */
function handleCRMSync(tenantId: string, crmName: string): Response {
  console.log(`[Orchestrator] Syncing leads from ${crmName} for tenant ${tenantId}`);

  // Mock lead data - in production, this would fetch from actual CRM API
  const mockLeads = [
    {
      id: 'crm-lead-001',
      crmName,
      propertyType: 'apartment',
      dealType: 'sale',
      city: 'Lisboa',
      district: 'Lisboa',
      price: 350000,
      numberOfBedrooms: 2,
      totalArea: 85,
      status: 'new',
      viewCount: 15,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    },
    {
      id: 'crm-lead-002',
      crmName,
      propertyType: 'house',
      dealType: 'sale',
      city: 'Porto',
      district: 'Porto',
      price: 450000,
      numberOfBedrooms: 3,
      totalArea: 150,
      status: 'contacted',
      viewCount: 32,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    },
  ];

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        leads: mockLeads,
        count: mockLeads.length,
        crmName,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle CRM update action
 */
function handleCRMUpdate(data: unknown): Response {
  console.log('[Orchestrator] Updating CRM lead:', data);

  // Mock update - in production, this would update the actual CRM API
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        updated: true,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle CRM status action
 */
function handleCRMStatus(data: unknown): Response {
  console.log('[Orchestrator] Getting CRM lead status:', data);

  const { leadId, crmId } = data as { leadId?: string; crmId?: string };

  // Mock status - in production, this would query the actual CRM API
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        leadId,
        crmId,
        stage: 'qualified',
        score: 75,
        lastActivity: new Date().toISOString(),
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
