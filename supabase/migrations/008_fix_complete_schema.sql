-- COMPLETE FIX: Ensure all tables exist before modifying them

-- 1. Automation Rules (Safe Create)
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_condition JSONB,
    actions JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    executions_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Automation Logs (Safe Create)
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) NOT NULL,
    result JSONB,
    error_message TEXT,
    execution_time_ms INTEGER
);

-- 3. Notifications (Safe Create)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    link VARCHAR(255),
    metadata JSONB
);

-- 4. Apply Fixes (Column additions)
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE;

-- 5. Enable RLS and Realtime
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist (Simple "do nothing if exists" block for policies is hard in pure SQL without DO block)
-- We'll drop and recreate simple policies to be safe and ensure access
DROP POLICY IF EXISTS "Enable read access for all users" ON automation_rules;
CREATE POLICY "Enable read access for all users" ON automation_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true); -- Simplified for demo

-- Enable Realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- 6. Insert Default Rules (Idempotent)
INSERT INTO automation_rules (name, description, trigger_type, trigger_condition, actions, active)
SELECT 
    'FOLLOW-UP REMINDER',
    'Invia una notifica quando un follow-up è scaduto o in scadenza oggi',
    'follow_up_due',
    '{}'::jsonb,
    '[{"type": "notification", "notification_type": "follow_up", "title": "Follow-up in scadenza", "message": "{{lead_name}} richiede un follow-up oggi!", "priority": "high"}]'::jsonb,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM automation_rules WHERE name = 'FOLLOW-UP REMINDER'
);
