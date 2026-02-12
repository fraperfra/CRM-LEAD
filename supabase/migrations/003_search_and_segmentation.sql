-- Phase 3: Advanced Search & Segmentation Database Schema

-- Table: saved_filters
-- Stores user-defined filter presets
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Filter definition
    filters JSONB NOT NULL, -- {"status": ["nuovo", "contattato"], "quality": ["HOT"], "dateRange": {...}}
    
    -- Metadata
    is_public BOOLEAN DEFAULT false, -- Share with team
    is_favorite BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Table: lead_segments
-- Stores lead segments for grouping and targeting
CREATE TABLE IF NOT EXISTS lead_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50), -- For visual identification
    
    -- Segment type
    segment_type VARCHAR(50) NOT NULL, -- 'smart' (rule-based) or 'manual' (tagged)
    
    -- Rules for smart segments
    rules JSONB, -- Same structure as saved_filters
    
    -- Statistics (auto-calculated)
    lead_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table: lead_segment_members
-- Many-to-many relationship for manual segments
CREATE TABLE IF NOT EXISTS lead_segment_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES lead_segments(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    
    -- Composite unique constraint
    UNIQUE(segment_id, lead_id)
);

-- Table: search_history
-- Tracks user search queries for quick access
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    result_count INTEGER,
    
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_filters_created_by ON saved_filters(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_favorite ON saved_filters(is_favorite);
CREATE INDEX IF NOT EXISTS idx_lead_segments_type ON lead_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_lead_segment_members_segment ON lead_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_lead_segment_members_lead ON lead_segment_members(lead_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

-- RLS Policies
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Saved Filters Policies
CREATE POLICY saved_filters_select_policy ON saved_filters
    FOR SELECT
    USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY saved_filters_insert_policy ON saved_filters
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY saved_filters_update_policy ON saved_filters
    FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY saved_filters_delete_policy ON saved_filters
    FOR DELETE
    USING (created_by = auth.uid());

-- Lead Segments Policies
CREATE POLICY lead_segments_select_policy ON lead_segments
    FOR SELECT
    USING (true);

CREATE POLICY lead_segments_insert_policy ON lead_segments
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY lead_segments_update_policy ON lead_segments
    FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY lead_segments_delete_policy ON lead_segments
    FOR DELETE
    USING (created_by = auth.uid());

-- Segment Members Policies
CREATE POLICY lead_segment_members_select_policy ON lead_segment_members
    FOR SELECT
    USING (true);

CREATE POLICY lead_segment_members_insert_policy ON lead_segment_members
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY lead_segment_members_delete_policy ON lead_segment_members
    FOR DELETE
    USING (true);

-- Search History Policies
CREATE POLICY search_history_select_policy ON search_history
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY search_history_insert_policy ON search_history
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY search_history_delete_policy ON search_history
    FOR DELETE
    USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION update_segment_lead_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lead_segments
        SET lead_count = lead_count + 1
        WHERE id = NEW.segment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lead_segments
        SET lead_count = lead_count - 1
        WHERE id = OLD.segment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update segment lead count
CREATE TRIGGER update_segment_count_trigger
    AFTER INSERT OR DELETE ON lead_segment_members
    FOR EACH ROW
    EXECUTE FUNCTION update_segment_lead_count();

-- Insert predefined segments
INSERT INTO lead_segments (name, description, segment_type, rules, color) VALUES
(
    'HOT Leads - Alta Priorità',
    'Lead HOT creati negli ultimi 7 giorni',
    'smart',
    '{"quality": ["HOT"], "dateRange": {"field": "created_at", "operator": "last_n_days", "value": 7}}',
    'red'
),
(
    'WARM Leads - Follow-up',
    'Lead WARM non contattati da più di 48h',
    'smart',
    '{"quality": ["WARM"], "lastContactDays": {"operator": "greater_than", "value": 2}}',
    'orange'
),
(
    'Lead Alto Valore',
    'Lead con valutazione > €500k',
    'smart',
    '{"valutazione_stimata": {"operator": "greater_than", "value": 500000}}',
    'green'
),
(
    'Lead da Riqualificare',
    'Lead COLD da più di 30 giorni',
    'smart',
    '{"quality": ["COLD"], "dateRange": {"field": "created_at", "operator": "older_than_days", "value": 30}}',
    'gray'
);

COMMENT ON TABLE saved_filters IS 'User-defined filter presets for quick access';
COMMENT ON TABLE lead_segments IS 'Lead segments for grouping and targeting';
COMMENT ON TABLE lead_segment_members IS 'Many-to-many relationship for manual segment membership';
COMMENT ON TABLE search_history IS 'User search query history';
