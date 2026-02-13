
import { supabase, Lead, AutomationRule } from './supabase';

// Helper to evaluate a condition against a lead
function evaluateCondition(lead: Lead, condition: any): boolean {
    if (!condition) return true;

    // Simple key-value match
    // e.g. { "quality": "HOT", "status": "nuovo" }
    for (const [key, value] of Object.entries(condition)) {
        if ((lead as any)[key] !== value) {
            // Handle special operators if needed (e.g. "days_since_creation" logic would allow >, <)
            // For now, strict equality is enough for the requested scope
            return false;
        }
    }
    return true;
}

// Execute a single action
async function executeAction(action: any, lead: Lead, rule: AutomationRule) {
    console.log(`Executing action ${action.type} for lead ${lead.id}`);

    try {
        switch (action.type) {
            case 'notification':
                await supabase
                    .from('notifications')
                    .insert({
                        lead_id: lead.id,
                        type: action.notification_type || 'system',
                        title: action.title || `Automazione: ${rule.name}`,
                        message: action.message?.replace('{{lead_name}}', lead.nome) || 'Rilevata azione automatica',
                        link: `/dashboard/leads/${lead.id}`,
                        read: false,
                        created_at: new Date().toISOString()
                    });
                break;

            case 'email':
                // Placeholder for email sending logic (Resend, SendGrid, etc.)
                // In a real app, this would call an internal API or use a library
                console.log(`[SIMULATION] Sending email to ${lead.email}: Template ${action.template}`);

                // Log activity
                await supabase.from('activities').insert({
                    lead_id: lead.id,
                    type: 'email',
                    subject: `Email automatica: ${action.template}`,
                    content: `Inviata email automatica basata su regola "${rule.name}"`,
                    status: 'sent',
                    created_by: 'Automation System'
                });
                break;

            case 'whatsapp':
                console.log(`[SIMULATION] Sending WhatsApp to ${lead.telefono}`);
                break;

            default:
                console.log('Unknown action type:', action.type);
        }
    } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        throw error;
    }
}

// Main entry point for the Cron Job
export async function processAutomations() {
    console.log('🔄 Processing automations...');

    // 1. Fetch active rules
    const { data: rules } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('active', true);

    if (!rules?.length) {
        console.log('No active rules found.');
        return { processed: 0, actions: 0 };
    }

    let processedCount = 0;
    let actionsCount = 0;

    // 2. Process each rule
    for (const rule of rules) {
        // Logic depends on trigger type
        // For "no_activity_x_days", we query leads matching criteria
        // For "new_lead", we might need a flag "automation_processed" or check date

        if (rule.trigger_type === 'no_activity_x_days') {
            const days = rule.trigger_condition?.days || 7;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const cutoffStr = cutoffDate.toISOString();

            // Find leads with no activity since cutoff
            // This is complex query, simplified here: 
            // 1. Get leads updated/contacted before cutoff
            // 2. Check if they were already processed for this rule recently? (To avoid spam)
            // Implementation Simplification: 
            // Checks 'last_contact_date' < cutoff

            const { data: leads } = await supabase
                .from('leads')
                .select('*')
                .lt('last_contact_date', cutoffStr)
                .neq('status', 'vinto')
                .neq('status', 'perso')
                .limit(50); // Batch size

            if (leads) {
                for (const lead of leads) {
                    // Check if we ALREADY executed this rule for this lead recently
                    // We check automation_logs
                    const { data: existingLog } = await supabase
                        .from('automation_logs')
                        .select('id')
                        .eq('rule_id', rule.id)
                        .eq('lead_id', lead.id)
                        .gt('executed_at', cutoffStr) // If executed AFTER cutoff, don't repeat
                        .maybeSingle();

                    if (!existingLog) {
                        // Execute Actions
                        if (rule.actions && Array.isArray(rule.actions)) {
                            for (const action of rule.actions) {
                                await executeAction(action, lead, rule);
                                actionsCount++;
                            }

                            // Log execution
                            await supabase.from('automation_logs').insert({
                                rule_id: rule.id,
                                lead_id: lead.id,
                                status: 'success',
                                executed_at: new Date().toISOString(),
                                details: 'Triggered by no_activity_x_days'
                            });
                            processedCount++;
                        }
                    }
                }
            }
        }

        // AUTO-FOLLOW-UP Logic (Follow Up Due)
        // Special Rule or Trigger Type
        if (rule.trigger_type === 'follow_up_due') {
            const now = new Date().toISOString();
            const { data: leads } = await supabase
                .from('leads')
                .select('*')
                .lte('next_follow_up_date', now)
                .neq('status', 'vinto')
                .neq('status', 'perso');

            if (leads) {
                for (const lead of leads) {
                    // Check overlap to avoid double notification today
                    const todayStart = new Date().toISOString().split('T')[0];

                    const { data: existingLog } = await supabase
                        .from('automation_logs')
                        .select('id')
                        .eq('rule_id', rule.id)
                        .eq('lead_id', lead.id)
                        .gte('executed_at', todayStart) // Already notified today?
                        .maybeSingle();

                    if (!existingLog) {
                        if (rule.actions) {
                            for (const action of rule.actions) {
                                await executeAction(action, lead, rule);
                                actionsCount++;
                            }
                            await supabase.from('automation_logs').insert({
                                rule_id: rule.id,
                                lead_id: lead.id,
                                status: 'success',
                                executed_at: new Date().toISOString(),
                                details: 'Follow-up Reminder'
                            });
                            processedCount++;
                        }
                    }
                }
            }
        }
    }

    return { processed: processedCount, actions: actionsCount };
}
