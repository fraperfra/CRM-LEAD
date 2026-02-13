-- Phase 3: Notifications System & Fixes

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: if notifications are user-specific
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'follow_up', 'new_lead', 'hot_lead', 'no_response', 'assign_lead', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    link VARCHAR(255), -- URL to redirect when clicked
    metadata JSONB -- Extra data
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL); -- Allow viewing global notifications if user_id is null

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Enable Realtime (Safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Fixes for Automation Rules (ensure triggering works)
-- Add 'last_executed_at' to automation_rules if missing (it was in my assumed types but maybe not sql)
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE;
