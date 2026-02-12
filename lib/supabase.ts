import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (usa service role per bypass RLS)
// Inizializzato solo se la service role key è disponibile (server-side)
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  : null;

// ============================================
// TYPES
// ============================================

export type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  motivazione: string;
  tipologia: string;
  superficie: number;
  locali: number;
  bagni: number;
  piano: number;
  ascensore: boolean;
  condizione: string;
  classe_energetica: string;
  extra: string[];
  punteggio: number;
  lead_quality: 'HOT' | 'WARM' | 'COLD';
  status: 'nuovo' | 'contattato' | 'qualificato' | 'in_trattativa' | 'vinto' | 'perso' | 'non_interessato';
  landing_page_url: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  assigned_to: string;
  valutazione_stimata?: number;
  provvigione_stimata?: number;
  note?: string;
  tags?: string[];
  consenso_privacy: boolean;
  consenso_marketing: boolean;
  deleted_at?: string;
};

export type Activity = {
  id: string;
  lead_id: string;
  created_at: string;
  type: 'email' | 'whatsapp' | 'call' | 'meeting' | 'note' | 'sms' | 'documento';
  subject: string;
  content: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed' | 'completed';
  duration_minutes?: number;
  scheduled_at?: string;
  campaign_id?: string;
  template_used?: string;
  automation_id?: string;
  attachments?: any;
  created_by: string;
};

export type AutomationSequence = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  active: boolean;
  trigger_type: 'new_lead' | 'status_change' | 'no_activity_days' | 'lead_quality' | 'manual';
  trigger_conditions: any;
  steps: any[];
  total_enrolled: number;
  total_completed: number;
  created_by: string;
};

export type Template = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  category: string;
  subject?: string;
  body: string;
  variables: string[];
  times_used: number;
  avg_open_rate?: number;
  avg_response_rate?: number;
  active: boolean;
  created_by: string;
};

export type Document = {
  id: string;
  lead_id: string;
  created_at: string;
  type: 'preventivo' | 'contratto' | 'visura' | 'planimetria' | 'foto' | 'altro';
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by: string;
  viewed_at?: string;
  downloaded_at?: string;
};

export type Note = {
  id: string;
  lead_id: string;
  created_at: string;
  updated_at: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
};

export type DashboardStats = {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  won_leads: number;
  lost_leads: number;
  leads_last_week: number;
  leads_last_month: number;
  avg_score: number;
  conversion_rate: number;
};

export type AutomationRule = {
  id: string;
  active: boolean;
  is_active?: boolean;
  name: string;
  description: string;
  trigger_type: string;
  action_type?: string;
  actions: any[];
  conditions: any;
  created_at: string;
  updated_at?: string;
  last_executed_at?: string;
  executions_count: number;
  success_count: number;
};

export type AutomationLog = {
  id: string;
  rule_id: string;
  lead_id: string;
  status: 'success' | 'failed';
  executed_at: string;
  created_at?: string;
  details: string;
  rule?: AutomationRule;
  lead?: Lead;
};


// ============================================
// HELPERS
// ============================================

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  return data as Lead[];
}

export async function fetchDueLeads() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .is('deleted_at', null)
    .lte('next_follow_up_date', now)
    .neq('status', 'vinto')
    .neq('status', 'perso')
    .neq('status', 'non_interessato')
    .order('next_follow_up_date', { ascending: true });

  if (error) {
    console.error('Error fetching due leads:', error);
    return [];
  }
  return data as Lead[];
}

export async function updateLeadsStatus(ids: string[], status: string) {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .in('id', ids);

  if (error) {
    console.error('Error updating leads status:', error);
    throw error;
  }
}

export async function snoozeLead(id: string, days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const { error } = await supabase
    .from('leads')
    .update({ next_follow_up_date: date.toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error snoozing lead:', error);
    throw error;
  }
}

export async function fetchLeadById(id: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
  return data as Lead;
}

export async function fetchActivities(leadId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
  return data as Activity[];
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

export async function createActivity(activity: Partial<Activity>) {
  const { error } = await supabase
    .from('activities')
    .insert([activity]);

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

export async function fetchAutomationRules() {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Silently return empty array if table doesn't exist yet
    // (automation system not fully implemented - Phase 2)
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return [];
    }
    console.error('Error fetching automation rules:', error);
    return [];
  }

  return (data || []).map((rule: any) => ({
    ...rule,
    is_active: rule.active,
    actions: rule.actions || [],
    executions_count: rule.executions_count || 0,
    success_count: rule.success_count || 0
  })) as AutomationRule[];
}

export async function fetchAutomationLogs() {
  const { data, error } = await supabase
    .from('automation_logs')
    .select('*, rule:automation_rules(*), lead:leads(*)')
    .order('executed_at', { ascending: false });

  if (error) {
    // Silently return empty array if table doesn't exist yet
    // (automation system not fully implemented - Phase 2)
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      return [];
    }
    console.error('Error fetching automation logs:', error);
    return [];
  }

  return (data || []).map((log: any) => ({
    ...log,
    created_at: log.executed_at, // Map executed_at to created_at for frontend compatibility
  })) as AutomationLog[];
}

export async function toggleAutomationRule(id: string, active: boolean) {
  // We assume the DB column is 'active'. We might also need to handle is_active for frontend compatibility if needed.
  const { data, error } = await supabase
    .from('automation_rules')
    .update({ active })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling automation rule:', error);
    throw error;
  }

  // Polyfill for frontend compatibility if needed
  if (data) {
    return { ...data, is_active: data.active };
  }
  return data;
}

export async function fetchAutomationRuleById(id: string) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching automation rule:', error);
    return null;
  }
  // Polyfill for frontend compatibility
  if (data) {
    return {
      ...data,
      is_active: data.active,
      actions: data.actions || [],
      executions_count: data.executions_count || 0,
      success_count: data.success_count || 0
    } as AutomationRule;
  }
  return null;
}

export async function deleteAutomationRule(id: string) {
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting automation rule:', error);
    return false;
  }
  return true;
}

export async function addActionToRule(ruleId: string, action: any) {
  // Fetch current rule to get actions
  const { data: rule, error: fetchError } = await supabase
    .from('automation_rules')
    .select('actions')
    .eq('id', ruleId)
    .single();

  if (fetchError) {
    console.error('Error fetching rule for action add:', fetchError);
    return null;
  }

  const currentActions = Array.isArray(rule.actions) ? rule.actions : [];
  const newActions = [...currentActions, action];

  const { data, error } = await supabase
    .from('automation_rules')
    .update({ actions: newActions })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    console.error('Error adding action to rule:', error);
    return null;
  }
  if (data) {
    return {
      ...data,
      is_active: data.active,
      actions: data.actions || [],
      executions_count: data.executions_count || 0,
      success_count: data.success_count || 0
    } as AutomationRule;
  }
  return null;
}


export async function createAutomationRule(rule: Partial<AutomationRule>) {
  // Map is_active to active for DB
  const dbRule: any = { ...rule };
  if ('is_active' in rule) {
    dbRule.active = rule.is_active;
    delete dbRule.is_active;
  }
  // Remove read-only fields if present
  delete dbRule.executions_count;
  delete dbRule.success_count;
  delete dbRule.last_executed_at;
  delete dbRule.created_at;
  delete dbRule.updated_at;

  const { data, error } = await supabase
    .from('automation_rules')
    .insert([dbRule])
    .select()
    .single();

  if (error) {
    console.error('Error creating automation rule:', error);
    throw error;
  }

  if (data) {
    return {
      ...data,
      is_active: data.active,
      actions: data.actions || [],
      executions_count: data.executions_count || 0,
      success_count: data.success_count || 0
    } as AutomationRule;
  }
  return data as AutomationRule;
}