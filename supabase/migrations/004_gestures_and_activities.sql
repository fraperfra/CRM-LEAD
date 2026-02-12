-- Phase 4: Mobile Gestures, Bulk Actions & Data Management

-- Table: activities
-- Stores all interactions and activities for leads
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Activity details
    type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'whatsapp', 'status_change'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Metadata
    outcome VARCHAR(100), -- 'successful', 'no_answer', 'scheduled', 'cancelled'
    duration_minutes INTEGER, -- For calls and meetings
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Additional data (emails, notes, etc.)
    metadata JSONB
);

-- Table: notification_preferences
-- User notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email notifications
    email_new_lead BOOLEAN DEFAULT true,
    email_hot_lead BOOLEAN DEFAULT true,
    email_follow_up_due BOOLEAN DEFAULT true,
    email_automation_failed BOOLEAN DEFAULT true,
    email_daily_summary BOOLEAN DEFAULT false,
    
    -- In-app notifications
    app_new_lead BOOLEAN DEFAULT true,
    app_hot_lead BOOLEAN DEFAULT true,
    app_follow_up_due BOOLEAN DEFAULT true,
    
    -- Notification delivery
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: data_imports
-- Track CSV imports and their status
CREATE TABLE IF NOT EXISTS data_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Import details
    filename VARCHAR(255),
    total_rows INTEGER,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Results
    error_log JSONB,
    duplicate_count INTEGER DEFAULT 0,
    
    -- Metadata
    imported_by UUID REFERENCES auth.users(id),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table: notifications
-- Improved notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- 'new_lead', 'hot_lead', 'follow_up', 'automation'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Link and metadata
    link VARCHAR(255),
    icon VARCHAR(50),
    metadata JSONB,
    
    -- Status
    read BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_data_imports_status ON data_imports(status);
CREATE INDEX IF NOT EXISTS idx_data_imports_imported_by ON data_imports(imported_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Activities Policies
CREATE POLICY activities_select_policy ON activities
    FOR SELECT
    USING (true);

CREATE POLICY activities_insert_policy ON activities
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY activities_update_policy ON activities
    FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY activities_delete_policy ON activities
    FOR DELETE
    USING (created_by = auth.uid());

-- Notification Preferences Policies
CREATE POLICY notification_preferences_select_policy ON notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notification_preferences_insert_policy ON notification_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_update_policy ON notification_preferences
    FOR UPDATE
    USING (user_id = auth.uid());

-- Data Imports Policies
CREATE POLICY data_imports_select_policy ON data_imports
    FOR SELECT
    USING (imported_by = auth.uid());

CREATE POLICY data_imports_insert_policy ON data_imports
    FOR INSERT
    WITH CHECK (imported_by = auth.uid());

-- Notifications Policies
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notifications_insert_policy ON notifications
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY notifications_delete_policy ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION log_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-log status changes
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        INSERT INTO activities (lead_id, type, title, description, completed_at, metadata)
        VALUES (
            NEW.id,
            'status_change',
            'Status cambiato',
            'Status cambiato da "' || OLD.status || '" a "' || NEW.status || '"',
            NOW(),
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    
    -- Auto-log quality changes
    IF (TG_OP = 'UPDATE' AND OLD.lead_quality != NEW.lead_quality) THEN
        INSERT INTO activities (lead_id, type, title, description, completed_at, metadata)
        VALUES (
            NEW.id,
            'status_change',
            'Quality modificata',
            'Quality cambiata da "' || OLD.lead_quality || '" a "' || NEW.lead_quality || '"',
            NOW(),
            jsonb_build_object('old_quality', OLD.lead_quality, 'new_quality', NEW.lead_quality)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-log lead changes
CREATE TRIGGER log_lead_activity_trigger
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_activity();

-- Update timestamp trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE activities IS 'All lead interactions and activities';
COMMENT ON TABLE notification_preferences IS 'User notification settings and preferences';
COMMENT ON TABLE data_imports IS 'CSV import tracking and error logs';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
