-- Migration: Create Templates table for communication scripts

-- 1. Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'whatsapp', 'sms', 'email', 'call_script'
    category VARCHAR(50), -- 'intro', 'followup', 'closing', etc.
    subject VARCHAR(255), -- Only for email
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names e.g. ["nome", "indirizzo"]
    
    active BOOLEAN DEFAULT true,
    times_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow read access to all authenticated users
CREATE POLICY "Enable read access for all users" ON templates
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow insert access to authenticated users
CREATE POLICY "Enable insert access for all users" ON templates
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow update access to authenticated users
CREATE POLICY "Enable update access for all users" ON templates
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Allow delete access to authenticated users
CREATE POLICY "Enable delete access for all users" ON templates
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- 4. Auto-update updated_at
CREATE TRIGGER templates_updated_at_trigger
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_rules_updated_at(); -- Reusing existing function

-- 5. Insert Default Templates
INSERT INTO templates (name, type, category, body, variables, created_by)
SELECT 
    'Primo contatto WhatsApp',
    'whatsapp',
    'intro',
    'Ciao {{nome}}, sono Francesco di ValutaCasa. Ho ricevuto la tua richiesta per l''immobile via {{indirizzo}}. Quando possiamo sentirci per due minuti?',
    '["nome", "indirizzo"]'::jsonb,
    auth.uid()
FROM auth.users LIMIT 1;

INSERT INTO templates (name, type, category, body, variables, created_by)
SELECT 
    'Script Chiamata Qualifica',
    'call_script',
    'qualifica',
    'Buongiorno {{nome}}, la chiamo in merito alla sua richiesta su ValutaCasa per l''immobile in {{indirizzo}}. Volevo chiederle: sta cercando per investimento o come prima casa?',
    '["nome", "indirizzo"]'::jsonb,
    auth.uid()
FROM auth.users LIMIT 1;
