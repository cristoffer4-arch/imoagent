import { NextRequest, NextResponse } from 'next/server';
import { Alert } from '@/types/busca-ia';

/**
 * API Route: POST /api/ia-busca/alerts
 * 
 * Cria um novo alerta de busca
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.mode || !body.filters) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'mode and filters are required',
        },
        { status: 400 }
      );
    }

    // In production, save to database
    // For MVP, return mock response
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      tenant_id: body.tenant_id || 'demo-tenant-123',
      user_id: body.user_id || 'demo-user-123',
      mode: body.mode,
      filters: body.filters,
      notification_channels: body.notification_channels || ['email'],
      active: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Alert created successfully',
      alert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: GET /api/ia-busca/alerts
 * 
 * Lista todos os alertas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user-123';

    // In production, query from database
    // For MVP, return mock alerts
    const mockAlerts: Alert[] = [
      {
        id: 'alert-1',
        tenant_id: 'demo-tenant-123',
        user_id: userId,
        mode: 'angariacao',
        filters: {
          mode: 'angariacao',
          location: { concelho: 'Lisboa' },
          typology: ['T2', 'T3'],
          min_score: 70,
        },
        notification_channels: ['email'],
        active: true,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-2',
        tenant_id: 'demo-tenant-123',
        user_id: userId,
        mode: 'venda',
        filters: {
          mode: 'venda',
          location: { concelho: 'Cascais' },
          price_range: [300000, 600000],
          min_score: 60,
        },
        notification_channels: ['email', 'push'],
        active: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      count: mockAlerts.length,
      alerts: mockAlerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
