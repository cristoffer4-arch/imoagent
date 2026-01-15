import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient, getTenantIdFromToken } from './utils/supabase';
import { Opportunity, OpportunityType, OpportunityStatus } from './types';

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers.authorization || '';
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const tenant_id = getTenantIdFromToken(authHeader);
    const supabase = createSupabaseClient(authHeader);

    const body = JSON.parse(event.body || '{}');
    const { type, property_id, contact_id, pipeline_stage, metadata } = body;

    // Validate type
    if (!type || !Object.values(OpportunityType).includes(type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid opportunity type. Must be ANGARIACAO or VENDA' }),
      };
    }

    // Validate property exists if provided
    if (property_id) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', property_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!property) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Property not found' }),
        };
      }
    }

    // Validate contact exists if provided
    if (contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contact_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!contact) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Contact not found' }),
        };
      }
    }

    const newOpportunity: Partial<Opportunity> = {
      tenant_id,
      type,
      status: OpportunityStatus.NEW,
      pipeline_stage: pipeline_stage || 'initial',
      property_id,
      contact_id,
      owner_user_id: tenant_id,
      metadata: metadata || {},
    };

    const { data, error } = await supabase
      .from('opportunities')
      .insert(newOpportunity)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create opportunity' }),
      };
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      tenant_id,
      entity_type: 'opportunity',
      entity_id: data.id,
      action: 'created',
      details: { type, property_id, contact_id },
      user_id: tenant_id,
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ opportunity: data }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
