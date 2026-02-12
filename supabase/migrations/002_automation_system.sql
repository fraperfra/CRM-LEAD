-- Phase 2: Automation System Database Schema

-- Table: automation_rules
-- Stores automation rules with triggers and actions
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    trigger_type VARCHAR(50) NOT NULL, -- 'new_lead', 'status_change', 'no_activity_x_days', 'quality_change'
    trigger_condition JSONB, -- e.g., {"quality": "HOT", "status": "nuovo"}
    
    -- Actions to execute
    actions JSONB NOT NULL, -- Array of actions: [{"type": "email", "template_id": "xxx", "delay_hours": 0}]
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Statistics
    executions_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table: automation_logs
-- Stores execution logs for automation rules
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Execution details
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'pending'
    
    -- Result
    result JSONB, -- {"email_sent": true, "whatsapp_sent": false, "error": "..."}
    error_message TEXT,
    
    -- Metadata
    execution_time_ms INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_lead_id ON automation_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON automation_logs(executed_at DESC);

-- RLS Policies (Row Level Security)
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all automation rules
CREATE POLICY automation_rules_select_policy ON automation_rules
    FOR SELECT
    USING (true);

-- Policy: Users can create automation rules (authenticated users only)
CREATE POLICY automation_rules_insert_policy ON automation_rules
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update automation rules
CREATE POLICY automation_rules_update_policy ON automation_rules
    FOR UPDATE
    USING (true);

-- Policy: Users can view all automation logs
CREATE POLICY automation_logs_select_policy ON automation_logs
    FOR SELECT
    USING (true);

-- Policy: Service role can insert automation logs (for background jobs)
CREATE POLICY automation_logs_insert_policy ON automation_logs
    FOR INSERT
    WITH CHECK (true);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at field
CREATE TRIGGER automation_rules_updated_at_trigger
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_rules_updated_at();

-- Insert predefined automation rules
INSERT INTO automation_rules (name, description, trigger_type, trigger_condition, actions, active) VALUES
(
    'AUTO-FOLLOW-UP WARM',
    'Segue automaticamente i lead WARM con email e WhatsApp',
    'new_lead',
    '{"quality": "WARM", "status": "nuovo"}',
    '[
        {"type": "email", "template": "welcome_warm", "delay_hours": 0},
        {"type": "whatsapp", "template": "followup", "delay_hours": 2},
        {"type": "email", "template": "reminder", "delay_hours": 72}
    ]',
    true
),
(
    'AUTO-NURTURE COLD',
    'Drip campaign per lead COLD con 7 email in 2 settimane',
    'new_lead',
    '{"quality": "COLD"}',
    '[
        {"type": "email", "template": "intro", "delay_hours": 0},
        {"type": "email", "template": "value_prop", "delay_hours": 48},
        {"type": "email", "template": "case_study", "delay_hours": 96},
        {"type": "email", "template": "testimonials", "delay_hours": 168},
        {"type": "email", "template": "offer", "delay_hours": 240},
        {"type": "email", "template": "urgency", "delay_hours": 312}
    ]',
    true
),
(
    'AUTO-ALERT HOT',
    'Notifica urgente per lead HOT non contattati da 24h',
    'no_activity_x_days',
    '{"quality": "HOT", "days": 1}',
    '[
        {"type": "notification", "message": "Lead HOT non contattato da 24h!", "urgent": true}
    ]',
    true
);

COMMENT ON TABLE automation_rules IS 'Automation rules with triggers and actions for lead management';
COMMENT ON TABLE automation_logs IS 'Execution logs for automation rules';
