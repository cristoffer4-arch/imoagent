/**
 * IA Busca - CRM Integration Example
 * Shows how to integrate CRMService with the IA Busca module
 */

import { CRMService, LeadStatus, LeadSource, type CanonicalLead } from '@/services/crm';

/**
 * Initialize CRM Service for IA Busca module
 */
export function initializeCRMService() {
  const orchestratorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ia-orquestradora`
    : 'http://localhost:54321/functions/v1/ia-orquestradora';

  return new CRMService({
    orchestratorUrl,
    enableQueue: true,
    autoProcessQueue: true,
    queueProcessIntervalMs: 10000, // Process every 10 seconds
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
    },
  });
}

/**
 * Transform property search result to CRM lead
 */
export function propertySearchResultToLead(searchResult: {
  portal: string;
  property_id: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  property_location?: string;
  property_typology?: string;
  property_price?: number;
  timestamp: string;
}): CanonicalLead {
  const leadId = `${searchResult.portal.toLowerCase()}-${searchResult.property_id}-${Date.now()}`;
  
  return {
    id: leadId,
    name: searchResult.contact_name || 'Unknown',
    email: searchResult.contact_email,
    phone: searchResult.contact_phone,
    source: LeadSource.PORTAL,
    status: LeadStatus.NEW,
    property_interest: {
      location: searchResult.property_location,
      typology: searchResult.property_typology,
      price_range: searchResult.property_price ? {
        min: searchResult.property_price * 0.9,
        max: searchResult.property_price * 1.1,
      } : undefined,
    },
    metadata: {
      portal: searchResult.portal,
      property_id: searchResult.property_id,
      detected_by: 'ia-busca',
      detected_at: searchResult.timestamp,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Example: Sync leads from IA Busca property search
 */
export async function syncLeadsFromPropertySearch(
  crmService: CRMService,
  searchResults: any[]
) {
  // Transform search results to canonical leads
  const leads = searchResults
    .filter(result => result.contact_name || result.contact_email || result.contact_phone)
    .map(result => propertySearchResultToLead(result));

  if (leads.length === 0) {
    console.log('No leads to sync from search results');
    return { success: true, synced_leads: 0, failed_leads: 0, errors: [] };
  }

  // Sync with CRM via IA Orquestradora
  const result = await crmService.syncLeads(leads);
  
  console.log(`[IA Busca → CRM] Synced ${result.synced_leads} leads, ${result.failed_leads} failed`);
  
  if (result.errors.length > 0) {
    console.error('[IA Busca → CRM] Errors:', result.errors);
  }

  return result;
}

/**
 * Example: Update lead when user interacts with property
 */
export async function updateLeadOnPropertyInteraction(
  crmService: CRMService,
  leadId: string,
  interactionType: 'view' | 'contact' | 'visit_scheduled'
) {
  const statusMap = {
    view: LeadStatus.NEW,
    contact: LeadStatus.CONTACTED,
    visit_scheduled: LeadStatus.QUALIFIED,
  };

  const success = await crmService.updateLead({
    lead_id: leadId,
    updates: {
      status: statusMap[interactionType],
      metadata: {
        last_interaction: new Date().toISOString(),
        interaction_type: interactionType,
      },
    },
  });

  console.log(`[IA Busca → CRM] Lead ${leadId} updated (${interactionType}): ${success}`);
  
  return success;
}

/**
 * Example: Get lead status before showing property details
 */
export async function getLeadStatusForProperty(
  crmService: CRMService,
  leadId: string
) {
  const status = await crmService.getLeadStatus(leadId);
  
  if (status) {
    console.log(`[CRM → IA Busca] Lead ${leadId} status: ${status.status}`);
    return {
      exists: true,
      status: status.status,
      last_updated: status.last_updated,
      crm_metadata: status.crm_metadata,
    };
  }

  return { exists: false };
}

/**
 * Example usage in Next.js API route
 */
export async function handlePropertySearchRequest(searchParams: any) {
  // 1. Initialize CRM Service
  const crmService = initializeCRMService();

  try {
    // 2. Perform property search via IA Busca
    const searchResults = await performPropertySearch(searchParams);

    // 3. Sync leads to CRM
    await syncLeadsFromPropertySearch(crmService, searchResults);

    // 4. Return search results
    return {
      success: true,
      properties: searchResults,
      leads_synced: true,
    };
  } catch (error) {
    console.error('[IA Busca] Error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  } finally {
    // 5. Cleanup
    crmService.destroy();
  }
}

/**
 * Mock property search function
 * In production, this would call actual IA Busca logic
 */
async function performPropertySearch(searchParams: any) {
  // Mock implementation - replace with actual IA Busca search logic
  return [
    {
      portal: 'OLX',
      property_id: 'olx-12345',
      contact_name: 'João Silva',
      contact_email: 'joao.silva@example.com',
      contact_phone: '+351912345678',
      property_location: 'Lisboa',
      property_typology: 'T2',
      property_price: 250000,
      timestamp: new Date().toISOString(),
    },
    {
      portal: 'Idealista',
      property_id: 'idealista-67890',
      contact_name: 'Maria Santos',
      contact_email: 'maria.santos@example.com',
      contact_phone: '+351923456789',
      property_location: 'Porto',
      property_typology: 'T3',
      property_price: 200000,
      timestamp: new Date().toISOString(),
    },
  ];
}

/**
 * Export for use in IA Busca module
 */
export const IABuscaCRM = {
  initialize: initializeCRMService,
  syncLeads: syncLeadsFromPropertySearch,
  updateLead: updateLeadOnPropertyInteraction,
  getStatus: getLeadStatusForProperty,
  transformToLead: propertySearchResultToLead,
};
