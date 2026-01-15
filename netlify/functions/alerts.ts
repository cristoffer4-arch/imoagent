import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient, getTenantIdFromToken } from './utils/supabase';
import { Alert, AlertType } from './types';

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

    // GET - List alerts
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Database error' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ alerts: data || [] }),
      };
    }

    // POST - Create alert
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { alert_type, filters, team_id } = body;

      if (!alert_type || !Object.values(AlertType).includes(alert_type)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid alert_type' }),
        };
      }

      const newAlert: Partial<Alert> = {
        tenant_id,
        team_id,
        user_id: tenant_id,
        alert_type,
        filters: filters || {},
        is_active: true,
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert(newAlert)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create alert' }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ alert: data }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
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
