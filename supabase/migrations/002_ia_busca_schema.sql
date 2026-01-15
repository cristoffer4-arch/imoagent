-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Schema ingestion para dados brutos
CREATE SCHEMA IF NOT EXISTS ingestion;

-- PropertyEntity (Imóvel Único) - Tabela principal estendida
CREATE TABLE IF NOT EXISTS property_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  -- Localização
  lat DECIMAL(10, 8),
  lon DECIMAL(11, 8),
  geohash VARCHAR(12),
  freguesia VARCHAR(255),
  concelho VARCHAR(255),
  distrito VARCHAR(255),
  -- Dados
  typology VARCHAR(50), -- T0, T1, T2, T3, T4, T5+
  area_m2 DECIMAL(10, 2),
  bedrooms INT,
  bathrooms INT,
  features JSONB DEFAULT '[]', -- [{type: 'garage', value: true}, ...]
  condition VARCHAR(50),
  price_main DECIMAL(12, 2),
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  price_divergence_pct DECIMAL(5, 2),
  -- Multi-fonte
  portal_count INT DEFAULT 0,
  sources JSONB DEFAULT '[]', -- [{source_type, source_name, last_seen}, ...]
  -- Temporal
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  derived_recency INT DEFAULT 0, -- dias desde última atualização
  -- IA Scores
  angaria_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  venda_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  availability_probability DECIMAL(3, 2) DEFAULT 1, -- 0-1
  top_reasons JSONB DEFAULT '[]', -- [{reason, weight}, ...]
  -- Histórico
  events JSONB DEFAULT '[]', -- [{type, timestamp, data}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_property_entities_tenant ON property_entities(tenant_id);
CREATE INDEX idx_property_entities_geohash ON property_entities(geohash);
CREATE INDEX idx_property_entities_angaria_score ON property_entities(angaria_score DESC);
CREATE INDEX idx_property_entities_venda_score ON property_entities(venda_score DESC);
CREATE INDEX idx_property_entities_concelho ON property_entities(concelho);
CREATE INDEX idx_property_entities_typology ON property_entities(typology);

-- Publicações em cada fonte
CREATE TABLE IF NOT EXISTS listing_appearances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_entity_id UUID REFERENCES property_entities(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- portal, crm, casafari
  source_name VARCHAR(100) NOT NULL, -- olx, idealista, facebook, etc
  source_listing_id VARCHAR(255),
  url TEXT,
  source_price DECIMAL(12, 2),
  source_agency VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_listing_property ON listing_appearances(property_entity_id);
CREATE INDEX idx_listing_source ON listing_appearances(source_type, source_name);

-- Embeddings para IA (pgvector)
CREATE TABLE IF NOT EXISTS property_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES property_entities(id) ON DELETE CASCADE,
  text_embedding vector(768),
  quality_score DECIMAL(5, 2) DEFAULT 0,
  sinal_particular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image hashes para dedup visual
CREATE TABLE IF NOT EXISTS image_hashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_appearance_id UUID REFERENCES listing_appearances(id) ON DELETE CASCADE,
  image_url TEXT,
  image_phash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eventos de mercado
CREATE TABLE IF NOT EXISTS market_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES property_entities(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- NEW_ON_MARKET, PRICE_DROP, PRICE_RISE, BACK_ON_MARKET, OFF_MARKET, etc
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_market_events_property ON market_events(property_id);
CREATE INDEX idx_market_events_type ON market_events(event_type);

-- Contatos (proprietários, compradores, investidores)
CREATE TABLE IF NOT EXISTS ia_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  contact_type VARCHAR(50), -- owner, buyer, investor
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  external_ids JSONB DEFAULT '{}', -- {crm_name: crm_id}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Oportunidades (angariação ou venda)
CREATE TABLE IF NOT EXISTS ia_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  type VARCHAR(50) NOT NULL, -- ANGARIACAO, VENDA
  status VARCHAR(50) DEFAULT 'new',
  pipeline_stage VARCHAR(100),
  property_id UUID REFERENCES property_entities(id),
  contact_id UUID REFERENCES ia_contacts(id),
  owner_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks e atividades
CREATE TABLE IF NOT EXISTS ia_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  team_id UUID,
  opportunity_id UUID REFERENCES ia_opportunities(id),
  assigned_to UUID,
  task_type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ia_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  opportunity_id UUID REFERENCES ia_opportunities(id),
  user_id UUID,
  activity_type VARCHAR(100), -- call, email, whatsapp, visit, note
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alertas de busca
CREATE TABLE IF NOT EXISTS ia_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  mode VARCHAR(50), -- angariacao, venda
  filters JSONB,
  notification_channels JSONB DEFAULT '["email"]', -- [email, push, sms]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relatórios ACM
CREATE TABLE IF NOT EXISTS acm_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  property_id UUID REFERENCES property_entities(id),
  report_data JSONB,
  pdf_path TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schema ingestion
CREATE TABLE IF NOT EXISTS ingestion.raw_portal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name VARCHAR(100),
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.raw_crm_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crm_name VARCHAR(100),
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.raw_casafari_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.integration_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(100),
  source VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  attempts INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE property_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE acm_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view properties" ON property_entities FOR SELECT USING (true);
CREATE POLICY "Users can view their opportunities" ON ia_opportunities FOR SELECT USING (auth.uid()::text = owner_user_id::text OR auth.uid()::text = tenant_id::text);
CREATE POLICY "Users can create opportunities" ON ia_opportunities FOR INSERT WITH CHECK (auth.uid()::text = tenant_id::text);
CREATE POLICY "Users can manage their alerts" ON ia_alerts FOR ALL USING (auth.uid()::text = user_id::text);
