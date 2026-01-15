import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient, getTenantIdFromToken } from './utils/supabase';
import { Task, TaskStatus, TaskPriority } from './types';

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
    const {
      opportunity_id,
      title,
      description,
      due_date,
      priority,
      team_id,
      assigned_to,
    } = body;

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'title is required' }),
      };
    }

    // Validate opportunity if provided
    if (opportunity_id) {
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('id')
        .eq('id', opportunity_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!opportunity) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Opportunity not found' }),
        };
      }
    }

    const newTask: Partial<Task> = {
      tenant_id,
      team_id,
      opportunity_id,
      title,
      description,
      due_date,
      status: TaskStatus.TODO,
      priority: priority || TaskPriority.MEDIUM,
      assigned_to: assigned_to || tenant_id,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create task' }),
      };
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      tenant_id,
      entity_type: 'task',
      entity_id: data.id,
      action: 'created',
      details: { title, opportunity_id },
      user_id: tenant_id,
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ task: data }),
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
