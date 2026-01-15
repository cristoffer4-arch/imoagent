import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient, getTenantIdFromToken } from './utils/supabase';

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
    const { crm_name, sync_type } = body;

    if (!crm_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'crm_name is required' }),
      };
    }

    // Create integration job
    const { data: job, error: jobError } = await supabase
      .from('integration_jobs')
      .insert({
        connector_type: 'CRM_GENERIC',
        status: 'PENDING',
        metadata: { crm_name, sync_type: sync_type || 'full', tenant_id },
      })
      .select()
      .single();

    if (jobError) {
      console.error('Database error:', jobError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create sync job' }),
      };
    }

    // In production, this would trigger a background job
    // For now, return job ID for polling
    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({
        message: 'CRM sync initiated',
        job_id: job.id,
        status: 'PENDING',
      }),
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
