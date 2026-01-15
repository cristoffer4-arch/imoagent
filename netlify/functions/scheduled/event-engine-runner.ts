import { Handler } from '@netlify/functions';
import { createServiceClient } from '../utils/supabase';
import { detectEvents } from '../utils/orchestrator';
import { PropertyEntity, EventType } from '../types';

/**
 * Event Engine Runner
 * Runs every 30 minutes to detect market events
 * Types: NEW_ON_MARKET, PRICE_DROP, BACK_ON_MARKET, OFF_MARKET
 */
export const handler: Handler = async (event, context) => {
  console.log('Starting event engine runner...');
  
  try {
    const supabase = createServiceClient();

    // Fetch properties updated in last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .gte('updated_at', thirtyMinsAgo)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error' }),
      };
    }

    if (!properties || properties.length === 0) {
      console.log('No properties to process');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No properties to process' }),
      };
    }

    console.log(`Processing ${properties.length} properties for events...`);

    let eventsDetected = 0;

    for (const property of properties) {
      // Fetch previous state (last snapshot before current update)
      const { data: history } = await supabase
        .from('properties')
        .select('*')
        .eq('id', property.id)
        .order('updated_at', { ascending: false })
        .limit(2);

      const previousState = history && history.length > 1 ? history[1] : null;

      // Detect events
      const events = await detectEvents(
        property as PropertyEntity,
        previousState as PropertyEntity | undefined
      );

      // Save events to database
      for (const evt of events) {
        const { error: insertError } = await supabase
          .from('market_events')
          .insert(evt);

        if (!insertError) {
          eventsDetected++;
          
          // Trigger alerts for price drops and new properties
          if (
            evt.event_type === EventType.PRICE_DROP ||
            evt.event_type === EventType.NEW_ON_MARKET
          ) {
            // Find matching alerts
            const { data: alerts } = await supabase
              .from('alerts')
              .select('*')
              .eq('is_active', true)
              .eq('alert_type', 
                evt.event_type === EventType.PRICE_DROP 
                  ? 'PRICE_DROP' 
                  : 'NEW_PROPERTY'
              );

            // Send notifications (in production, use notification service)
            if (alerts && alerts.length > 0) {
              console.log(`Triggering ${alerts.length} alerts for event ${evt.id}`);
              
              for (const alert of alerts) {
                await supabase
                  .from('alerts')
                  .update({ last_triggered: new Date().toISOString() })
                  .eq('id', alert.id);
              }
            }
          }
        } else {
          console.error('Event insert error:', insertError);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Event detection completed',
        properties_processed: properties.length,
        events_detected: eventsDetected,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Event engine error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
