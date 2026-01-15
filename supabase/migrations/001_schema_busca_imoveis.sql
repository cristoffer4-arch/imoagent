-- ========================================
-- BUSCA DE IMÓVEIS IA - SCHEMA COMPLETO
-- ========================================
-- Migration: 001_schema_busca_imoveis.sql
-- Description: Complete schema for Property Search AI module
-- Schemas: public (canonical data) + ingestion (raw data)
-- ========================================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ingestion;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- PUBLIC SCHEMA - CANONICAL DATA
-- ========================================

-- PropertyEntity (Imóvel Único - deduplicated)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  
  -- Location
  lat NUMERIC,
  lon NUMERIC,
  geohash VARCHAR(12),
  freguesia VARCHAR(255),
  concelho VARCHAR(255),
  distrito VARCHAR(255),
  
  -- Property characteristics
  typology VARCHAR(50), -- T0, T1, T2, T3, T4, T5+
  area_m2 NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  features JSONB, -- pool, garage, garden, etc
  condition VARCHAR(50), -- new, renovated, to_renovate
  
  -- Pricing (aggregated from sources)
  price_main NUMERIC,
  price_min NUMERIC,
  price_max NUMERIC,
  price_divergence_pct NUMERIC,
  
  -- Sources metadata
  portal_count INTEGER DEFAULT 0,
  sources JSONB, -- array of source references
  
  -- Temporal data
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  derived_recency INTEGER, -- days since last seen
  
  -- AI Scores
  angaria_score NUMERIC, -- 0-100 score for acquisition potential
  venda_score NUMERIC, -- 0-100 score for sale potential
  availability_probability NUMERIC, -- 0-1 probability
  top_reasons JSONB, -- explanations for scores
  
  -- Events tracking
  events JSONB, -- array of event references
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ListingAppearance (each portal listing)
CREATE TABLE IF NOT EXISTS public.listing_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_entity_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  source_type VARCHAR(50) NOT NULL, -- PORTAL, CRM, CASAFARI, MANUAL
  source_name VARCHAR(100) NOT NULL, -- idealista, imovirtual, olx, etc
  source_listing_id VARCHAR(255) NOT NULL,
  url TEXT,
  
  source_price NUMERIC,
  source_agency VARCHAR(255),
  
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  status VARCHAR(50), -- active, inactive, sold
  
  UNIQUE(source_name, source_listing_id)
);

-- Contacts (owners, buyers, agents)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  
  contact_type VARCHAR(50) NOT NULL, -- OWNER, BUYER, AGENT, OTHER
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  external_ids JSONB, -- CRM IDs, etc
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities (angariacao or venda)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  
  type VARCHAR(50) NOT NULL, -- ANGARIACAO, VENDA
  status VARCHAR(50) NOT NULL, -- NEW, CONTACTED, QUALIFIED, IN_NEGOTIATION, WON, LOST
  pipeline_stage VARCHAR(100),
  
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  owner_user_id UUID, -- consultant who owns this opportunity
  
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (actions for opportunities)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'TODO', -- TODO, IN_PROGRESS, DONE, CANCELLED
  priority VARCHAR(50) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
  assigned_to UUID, -- user ID
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ActivityLogs (audit trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  entity_type VARCHAR(100) NOT NULL, -- property, opportunity, task, contact
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- created, updated, deleted, status_changed
  details JSONB,
  
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (user-defined triggers)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  user_id UUID,
  
  alert_type VARCHAR(50) NOT NULL, -- NEW_PROPERTY, PRICE_DROP, MARKET_EVENT, OPPORTUNITY
  filters JSONB, -- criteria for triggering
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACM Reports (Comparative Market Analysis)
CREATE TABLE IF NOT EXISTS public.acm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  report_data JSONB, -- analysis results
  pdf_url TEXT, -- stored report URL
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Events
CREATE TABLE IF NOT EXISTS public.market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL, -- NEW_ON_MARKET, PRICE_DROP, BACK_ON_MARKET, OFF_MARKET
  event_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Embeddings (for similarity search)
CREATE TABLE IF NOT EXISTS public.property_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  text_embedding VECTOR(1536), -- OpenAI/Gemini embeddings
  quality_score NUMERIC,
  sinal_particular TEXT, -- unique identifier/signature
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Image Hashes (perceptual hashing for dedup)
CREATE TABLE IF NOT EXISTS public.image_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_appearance_id UUID REFERENCES public.listing_appearances(id) ON DELETE CASCADE,
  
  image_phash VARCHAR(64), -- perceptual hash
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INGESTION SCHEMA - RAW DATA
-- ========================================

-- Raw Portal Events (from scrapers)
CREATE TABLE IF NOT EXISTS ingestion.raw_portal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(100) NOT NULL,
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw CRM Events (from CRM integrations)
CREATE TABLE IF NOT EXISTS ingestion.raw_crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_name VARCHAR(100) NOT NULL,
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw Casafari Events (from Casafari API)
CREATE TABLE IF NOT EXISTS ingestion.raw_casafari_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Jobs (tracking)
CREATE TABLE IF NOT EXISTS ingestion.integration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, SUCCESS, FAILED
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON public.properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_team ON public.properties(team_id);
CREATE INDEX IF NOT EXISTS idx_properties_geohash ON public.properties(geohash);
CREATE INDEX IF NOT EXISTS idx_properties_concelho ON public.properties(concelho);
CREATE INDEX IF NOT EXISTS idx_properties_distrito ON public.properties(distrito);
CREATE INDEX IF NOT EXISTS idx_properties_angaria_score ON public.properties(angaria_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_venda_score ON public.properties(venda_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_last_seen ON public.properties(last_seen DESC);

-- Listing appearances indexes
CREATE INDEX IF NOT EXISTS idx_listings_property ON public.listing_appearances(property_entity_id);
CREATE INDEX IF NOT EXISTS idx_listings_source ON public.listing_appearances(source_name, source_listing_id);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON public.contacts(contact_type);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON public.opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_property ON public.opportunities(property_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact ON public.opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON public.opportunities(owner_user_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_opportunity ON public.tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON public.alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_tenant ON public.activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_logs(entity_type, entity_id);

-- Market events indexes
CREATE INDEX IF NOT EXISTS idx_events_property ON public.market_events(property_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.market_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.market_events(created_at DESC);

-- Ingestion indexes
CREATE INDEX IF NOT EXISTS idx_raw_portal_processed ON ingestion.raw_portal_events(processed);
CREATE INDEX IF NOT EXISTS idx_raw_crm_processed ON ingestion.raw_crm_events(processed);
CREATE INDEX IF NOT EXISTS idx_raw_casafari_processed ON ingestion.raw_casafari_events(processed);
CREATE INDEX IF NOT EXISTS idx_integration_jobs_status ON ingestion.integration_jobs(status);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acm_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_hashes ENABLE ROW LEVEL SECURITY;

-- Properties policies
DROP POLICY IF EXISTS "properties_tenant_isolation" ON public.properties;
CREATE POLICY "properties_tenant_isolation" ON public.properties
  FOR ALL USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "properties_service_role" ON public.properties;
CREATE POLICY "properties_service_role" ON public.properties
  FOR ALL USING (auth.role() = 'service_role');

-- Listing appearances policies (via property_entity)
DROP POLICY IF EXISTS "listings_via_property" ON public.listing_appearances;
CREATE POLICY "listings_via_property" ON public.listing_appearances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_entity_id AND p.tenant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "listings_service_role" ON public.listing_appearances;
CREATE POLICY "listings_service_role" ON public.listing_appearances
  FOR ALL USING (auth.role() = 'service_role');

-- Contacts policies
DROP POLICY IF EXISTS "contacts_tenant_isolation" ON public.contacts;
CREATE POLICY "contacts_tenant_isolation" ON public.contacts
  FOR ALL USING (tenant_id = auth.uid());

-- Opportunities policies
DROP POLICY IF EXISTS "opportunities_tenant_isolation" ON public.opportunities;
CREATE POLICY "opportunities_tenant_isolation" ON public.opportunities
  FOR ALL USING (tenant_id = auth.uid());

-- Tasks policies
DROP POLICY IF EXISTS "tasks_tenant_isolation" ON public.tasks;
CREATE POLICY "tasks_tenant_isolation" ON public.tasks
  FOR ALL USING (tenant_id = auth.uid());

-- Activity logs policies
DROP POLICY IF EXISTS "activity_tenant_isolation" ON public.activity_logs;
CREATE POLICY "activity_tenant_isolation" ON public.activity_logs
  FOR ALL USING (tenant_id = auth.uid());

-- Alerts policies
DROP POLICY IF EXISTS "alerts_tenant_isolation" ON public.alerts;
CREATE POLICY "alerts_tenant_isolation" ON public.alerts
  FOR ALL USING (tenant_id = auth.uid());

-- ACM reports policies
DROP POLICY IF EXISTS "acm_tenant_isolation" ON public.acm_reports;
CREATE POLICY "acm_tenant_isolation" ON public.acm_reports
  FOR ALL USING (tenant_id = auth.uid());

-- Market events policies (via property)
DROP POLICY IF EXISTS "events_via_property" ON public.market_events;
CREATE POLICY "events_via_property" ON public.market_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_id AND p.tenant_id = auth.uid()
    )
  );

-- Property embeddings policies (via property)
DROP POLICY IF EXISTS "embeddings_via_property" ON public.property_embeddings;
CREATE POLICY "embeddings_via_property" ON public.property_embeddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_id AND p.tenant_id = auth.uid()
    )
  );

-- Image hashes policies (via listing)
DROP POLICY IF EXISTS "hashes_via_listing" ON public.image_hashes;
CREATE POLICY "hashes_via_listing" ON public.image_hashes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listing_appearances la
      JOIN public.properties p ON p.id = la.property_entity_id
      WHERE la.id = listing_appearance_id AND p.tenant_id = auth.uid()
    )
  );

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON public.alerts;
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON SCHEMA ingestion IS 'Raw data from integrations before processing';
COMMENT ON TABLE public.properties IS 'Canonical property entities (deduplicated)';
COMMENT ON TABLE public.listing_appearances IS 'Individual portal/source listings';
COMMENT ON TABLE public.opportunities IS 'Angariação (acquisition) and Venda (sale) opportunities';
COMMENT ON COLUMN public.properties.angaria_score IS 'Score 0-100 for acquisition potential';
COMMENT ON COLUMN public.properties.venda_score IS 'Score 0-100 for sale potential';
COMMENT ON COLUMN public.properties.availability_probability IS 'Probability 0-1 that property is still available';
