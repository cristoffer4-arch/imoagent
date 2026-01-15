import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient, getTenantIdFromToken } from './utils/supabase';
import { generateACM } from './utils/orchestrator';

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
    const { property_id } = body;

    if (!property_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'property_id is required' }),
      };
    }

    // Verify property exists and belongs to tenant
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', property_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (propError || !property) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Property not found' }),
      };
    }

    // Generate ACM report using orchestrator
    const report = await generateACM(property_id);
    report.tenant_id = tenant_id;

    // Save report to database
    const { data, error } = await supabase
      .from('acm_reports')
      .insert(report)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save report' }),
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ report: data }),
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
