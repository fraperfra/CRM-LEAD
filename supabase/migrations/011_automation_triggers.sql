-- MIGRATION: Automation Triggers
-- Purpose: Automatically enroll leads into sequences based on events

-- Function to handle automation triggers
CREATE OR REPLACE FUNCTION process_automation_triggers()
RETURNS TRIGGER AS $$
DECLARE
    seq RECORD;
BEGIN
    -- 1. NEW LEAD TRIGGER
    IF (TG_OP = 'INSERT') THEN
        FOR seq IN 
            SELECT * FROM automation_sequences 
            WHERE active = true AND trigger_type = 'new_lead'
        LOOP
            INSERT INTO automation_enrollments (lead_id, automation_id, status, next_action_at)
            VALUES (NEW.id, seq.id, 'active', NOW())
            ON CONFLICT (lead_id, automation_id) DO NOTHING;
        END LOOP;
    END IF;

    -- 2. STATUS CHANGE TRIGGER
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        FOR seq IN 
            SELECT * FROM automation_sequences 
            WHERE active = true 
            AND trigger_type = 'status_change'
            AND (trigger_conditions->>'status' = NEW.status OR trigger_conditions->>'status' IS NULL OR trigger_conditions->>'status' = '')
        LOOP
            INSERT INTO automation_enrollments (lead_id, automation_id, status, next_action_at)
            VALUES (NEW.id, seq.id, 'active', NOW())
            ON CONFLICT (lead_id, automation_id) DO NOTHING;
        END LOOP;
    END IF;

    -- 3. LEAD QUALITY TRIGGER
    IF (TG_OP = 'UPDATE' AND OLD.lead_quality IS DISTINCT FROM NEW.lead_quality) THEN
        FOR seq IN 
            SELECT * FROM automation_sequences 
            WHERE active = true 
            AND trigger_type = 'lead_quality'
            AND (trigger_conditions->>'quality' = NEW.lead_quality)
        LOOP
            INSERT INTO automation_enrollments (lead_id, automation_id, status, next_action_at)
            VALUES (NEW.id, seq.id, 'active', NOW())
            ON CONFLICT (lead_id, automation_id) DO NOTHING;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove existing triggers if they exist to avoid duplicates
DROP TRIGGER IF EXISTS trigger_automation_on_insert ON leads;
DROP TRIGGER IF EXISTS trigger_automation_on_update ON leads;

-- Attach triggers to leads table
CREATE TRIGGER trigger_automation_on_insert
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION process_automation_triggers();

CREATE TRIGGER trigger_automation_on_update
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION process_automation_triggers();
