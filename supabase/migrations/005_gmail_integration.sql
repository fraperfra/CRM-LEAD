-- Gmail API Integration Database Schema

-- Table: gmail_oauth_tokens
-- Stores OAuth tokens for Gmail API access
CREATE TABLE IF NOT EXISTS gmail_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Gmail account info
    email_address VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: email_sync_log
-- Tracks email synchronization history
CREATE TABLE IF NOT EXISTS email_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sync details
    emails_fetched INTEGER DEFAULT 0,
    emails_processed INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    leads_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- User
    triggered_by UUID REFERENCES auth.users(id),
    sync_type VARCHAR(50) DEFAULT 'manual' -- 'manual', 'automatic', 'cron'
);

-- Table: processed_emails
-- Keeps track of already processed emails to avoid duplicates
CREATE TABLE IF NOT EXISTS processed_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmail_message_id VARCHAR(255) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    
    -- Email metadata
    from_email VARCHAR(255),
    subject TEXT,
    received_date TIMESTAMP WITH TIME ZONE,
    
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_lead BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user ON gmail_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_active ON gmail_oauth_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_email_sync_status ON email_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_email_sync_started ON email_sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_emails_gmail_id ON processed_emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_processed_emails_lead ON processed_emails(lead_id);

-- RLS Policies
ALTER TABLE gmail_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;

-- Gmail OAuth Tokens Policies
CREATE POLICY gmail_tokens_select_policy ON gmail_oauth_tokens
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY gmail_tokens_insert_policy ON gmail_oauth_tokens
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY gmail_tokens_update_policy ON gmail_oauth_tokens
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY gmail_tokens_delete_policy ON gmail_oauth_tokens
    FOR DELETE
    USING (user_id = auth.uid());

-- Email Sync Log Policies
CREATE POLICY email_sync_select_policy ON email_sync_log
    FOR SELECT
    USING (triggered_by = auth.uid());

CREATE POLICY email_sync_insert_policy ON email_sync_log
    FOR INSERT
    WITH CHECK (triggered_by = auth.uid());

-- Processed Emails Policies
CREATE POLICY processed_emails_select_policy ON processed_emails
    FOR SELECT
    USING (true);

CREATE POLICY processed_emails_insert_policy ON processed_emails
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Trigger for updating timestamp
CREATE TRIGGER update_gmail_tokens_timestamp
    BEFORE UPDATE ON gmail_oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE gmail_oauth_tokens IS 'OAuth tokens for Gmail API integration';
COMMENT ON TABLE email_sync_log IS 'History of email synchronization runs';
COMMENT ON TABLE processed_emails IS 'Tracking processed emails to avoid duplicates';
