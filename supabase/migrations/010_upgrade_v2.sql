-- UPGRADE V2: Enterprise Features
-- Automation Workflows, Documents, Advanced Templates, Notes, Scoring

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CLEANUP OLDER ATTEMPTS (If any)
-- ============================================
DROP TABLE IF EXISTS automation_enrollments;
DROP TABLE IF EXISTS automation_sequences;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS saved_filters;
-- Re-create templates to match V2 schema exactly
DROP TABLE IF EXISTS templates; 

-- ============================================
-- TABELLA AUTOMATION_SEQUENCES (workflow)
-- ============================================
CREATE TABLE automation_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Info sequenza
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    
    -- Trigger conditions
    trigger_type VARCHAR(50) CHECK (trigger_type IN (
        'new_lead',
        'status_change',
        'no_activity_days',
        'lead_quality',
        'manual'
    )),
    trigger_conditions JSONB, -- {quality: "HOT", punteggio_min: 80}
    
    -- Steps della sequenza
    steps JSONB NOT NULL,
    
    -- Stats
    total_enrolled INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    
    -- Created by
    created_by VARCHAR(255) DEFAULT 'Francesco Coppola'
);

-- ============================================
-- TABELLA AUTOMATION_ENROLLMENTS (lead in sequenza)
-- ============================================
CREATE TABLE automation_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    automation_id UUID REFERENCES automation_sequences(id) ON DELETE CASCADE,
    
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_step INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active',
        'paused',
        'completed',
        'cancelled'
    )),
    
    next_action_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_lead_automation UNIQUE(lead_id, automation_id)
);

-- ============================================
-- TABELLA TEMPLATES (email e whatsapp)
-- ============================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('email', 'whatsapp', 'sms', 'call_script')),
    category VARCHAR(100), -- "welcome", "followup", "nurture", "closing"
    
    -- Contenuto
    subject VARCHAR(255), -- solo per email
    body TEXT NOT NULL,
    
    -- Variabili disponibili: {{nome}}, {{tipologia}}, {{superficie}}, etc
    variables TEXT[], -- ["nome", "tipologia", "superficie"]
    
    -- Stats
    times_used INTEGER DEFAULT 0,
    avg_open_rate DECIMAL(5,2), -- solo email
    avg_response_rate DECIMAL(5,2),
    
    active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) DEFAULT 'Francesco Coppola'
);

-- ============================================
-- TABELLA DOCUMENTS (PDF, contratti, etc)
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    type VARCHAR(50) CHECK (type IN (
        'preventivo',
        'contratto',
        'visura',
        'planimetria',
        'foto',
        'altro'
    )),
    
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100),
    
    -- Metadata
    description TEXT,
    uploaded_by VARCHAR(255) DEFAULT 'Francesco Coppola',
    
    -- Tracking
    viewed_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TABELLA NOTES (note veloci)
-- ============================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    
    created_by VARCHAR(255) DEFAULT 'Francesco Coppola'
);

-- ============================================
-- TABELLA SAVED_FILTERS (filtri salvati)
-- ============================================
CREATE TABLE saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    filters JSONB NOT NULL,
    
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255) DEFAULT 'Francesco Coppola'
);

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_quality ON leads(lead_quality) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled ON activities(scheduled_at) WHERE status = 'scheduled';

-- Enrollments
CREATE INDEX idx_enrollments_lead ON automation_enrollments(lead_id);
CREATE INDEX idx_enrollments_next_action ON automation_enrollments(next_action_at) WHERE status = 'active';

-- Documents
CREATE INDEX idx_documents_lead ON documents(lead_id);

-- Notes
CREATE INDEX idx_notes_lead ON notes(lead_id, created_at DESC);

-- ============================================
-- FUNCTIONS E TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_sequences_updated_at 
    BEFORE UPDATE ON automation_sequences
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-classify lead quality based on punteggio
CREATE OR REPLACE FUNCTION auto_classify_lead_quality()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.punteggio >= 85 THEN
        NEW.lead_quality = 'HOT';
    ELSIF NEW.punteggio >= 70 THEN
        NEW.lead_quality = 'WARM';
    ELSE
        NEW.lead_quality = 'COLD';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS classify_lead_quality_on_insert ON leads;
CREATE TRIGGER classify_lead_quality_on_insert
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_classify_lead_quality();

DROP TRIGGER IF EXISTS classify_lead_quality_on_update ON leads;
CREATE TRIGGER classify_lead_quality_on_update
    BEFORE UPDATE OF punteggio ON leads
    FOR EACH ROW
    WHEN (OLD.punteggio IS DISTINCT FROM NEW.punteggio)
    EXECUTE FUNCTION auto_classify_lead_quality();

-- Auto-set next_follow_up_date based on quality
CREATE OR REPLACE FUNCTION auto_set_followup_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.next_follow_up_date IS NULL THEN
        CASE NEW.lead_quality
            WHEN 'HOT' THEN
                NEW.next_follow_up_date = NOW() + INTERVAL '4 hours';
            WHEN 'WARM' THEN
                NEW.next_follow_up_date = NOW() + INTERVAL '1 day';
            WHEN 'COLD' THEN
                NEW.next_follow_up_date = NOW() + INTERVAL '3 days';
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_followup_date_on_insert ON leads;
CREATE TRIGGER set_followup_date_on_insert
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_followup_date();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Note: In production you should use auth.uid() checks. 
-- For now we enable all access as requested by the provided schema style (though policies were missing logic)
-- We will use a permissive policy for authenticated users for now to avoid breakage.

CREATE POLICY "Enable all access for authenticated users" ON automation_sequences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON automation_enrollments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON saved_filters FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- VIEWS UTILI
-- ============================================

-- Lead con conteggio attività
DROP VIEW IF EXISTS leads_with_activity_count;
CREATE OR REPLACE VIEW leads_with_activity_count AS
SELECT 
    l.*,
    COUNT(a.id) as total_activities,
    MAX(a.created_at) as last_activity_at
FROM leads l
LEFT JOIN activities a ON l.id = a.lead_id
WHERE l.deleted_at IS NULL
GROUP BY l.id;

-- Lead da followup oggi
DROP VIEW IF EXISTS leads_followup_today;
CREATE OR REPLACE VIEW leads_followup_today AS
SELECT * FROM leads
WHERE next_follow_up_date::date = CURRENT_DATE
  AND status NOT IN ('vinto', 'perso', 'non_interessato')
  AND deleted_at IS NULL
ORDER BY punteggio DESC;

-- Stats dashboard
DROP VIEW IF EXISTS dashboard_stats;
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE lead_quality = 'HOT') as hot_leads,
    COUNT(*) FILTER (WHERE lead_quality = 'WARM') as warm_leads,
    COUNT(*) FILTER (WHERE lead_quality = 'COLD') as cold_leads,
    COUNT(*) FILTER (WHERE status = 'vinto') as won_leads,
    COUNT(*) FILTER (WHERE status = 'perso') as lost_leads,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as leads_last_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as leads_last_month,
    ROUND(AVG(punteggio), 2) as avg_score,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'vinto')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('vinto', 'perso')), 0) * 100,
        2
    ) as conversion_rate
FROM leads
WHERE deleted_at IS NULL;

-- ============================================
-- SEED DATA (template iniziali)
-- ============================================

INSERT INTO templates (name, type, category, subject, body, variables) VALUES
(
    'Welcome - Valutazione Richiesta',
    'email',
    'welcome',
    '🏠 Grazie per aver richiesto la valutazione!',
    'Ciao {{nome}},

Grazie per aver richiesto la valutazione del tuo immobile {{tipologia}} di {{superficie}}mq.

Ho ricevuto la tua richiesta e sono già al lavoro per preparare una valutazione accurata.

Nei prossimi giorni ti contatterò per:
✅ Fissare un appuntamento per la visita
✅ Analizzare insieme le caratteristiche dell''immobile
✅ Fornirti una stima di mercato precisa

Nel frattempo, se hai domande non esitare a contattarmi!

Francesco Coppola
ValutaCasa - Consulenza Immobiliare
📞 {{telefono_agente}}
📧 {{email_agente}}',
    ARRAY['nome', 'tipologia', 'superficie', 'telefono_agente', 'email_agente']
),
(
    'Follow-up 1 - Primo contatto',
    'whatsapp',
    'followup',
    NULL,
    'Ciao {{nome}}! 👋

Ho visto che hai richiesto la valutazione per il tuo {{tipologia}}.

Quando possiamo fare una chiamata veloce per discutere i dettagli?

Sono disponibile oggi pomeriggio o domani mattina.

Francesco - ValutaCasa',
    ARRAY['nome', 'tipologia']
),
(
    'Follow-up 2 - Second touch',
    'email',
    'followup',
    'Non dimenticare la tua valutazione gratuita!',
    'Ciao {{nome}},

Ti scrivo per ricordarti che hai richiesto la valutazione del tuo {{tipologia}} a {{indirizzo}}.

Offro una consulenza completamente gratuita che include:
- Analisi di mercato della zona
- Stima del valore di vendita
- Strategia di vendita ottimale
- Nessun impegno

Posso chiamarti domani per fissare un appuntamento?

A presto,
Francesco',
    ARRAY['nome', 'tipologia', 'indirizzo']
);
