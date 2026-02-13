import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Use Admin client for Cron jobs to bypass RLS if needed
// import { sendEmail } from '@/lib/email'; // Placeholder
// import { sendWhatsApp } from '@/lib/whatsapp'; // Placeholder

// ... (previous imports)

export async function GET() {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase Admin not configured (missing service role key)' }, { status: 500 });
    }

    try {
        const results = [];

        // 1. CHECK FOR DUE FOLLOW-UPS (Legacy Feature Ported to V2)
        // Find leads with next_follow_up_date <= NOW and NO open notification for today
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: dueLeads, error: dueLeadsError } = await supabaseAdmin
            .from('leads')
            .select('id, nome, assigned_to, next_follow_up_date')
            .lte('next_follow_up_date', new Date().toISOString())
            .is('deleted_at', null)
            .neq('status', 'vinto')
            .neq('status', 'perso')
            .neq('status', 'non_interessato')
            .limit(20);

        if (!dueLeadsError && dueLeads && dueLeads.length > 0) {
            for (const lead of dueLeads) {
                // Check if we already notified *today* to avoid spam
                // effective check: we look for a notification created today for this lead
                // This acts as a rate limit.
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                const { count } = await supabaseAdmin
                    .from('notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('lead_id', lead.id)
                    .eq('type', 'follow_up')
                    .gte('created_at', startOfDay.toISOString());

                if (count === 0) {
                    // Create Notification
                    await supabaseAdmin.from('notifications').insert({
                        user_id: lead.assigned_to, // Notify the assigned agent
                        lead_id: lead.id,
                        type: 'follow_up',
                        title: 'Follow-up Scaduto',
                        message: `È necessario contattare ${lead.nome}.`,
                        read: false
                    });
                    results.push({ type: 'follow_up_notification', lead_id: lead.id, success: true });
                }
            }
        }

        // 2. PROCESS AUTOMATION ENROLLMENTS (V2 System)
        // Fetch enrollments due for action
        const { data: enrollments, error } = await supabaseAdmin
            .from('automation_enrollments')
            .select(`
        *,
        automation_sequences (
            steps,
            name
        ),
        leads (
            email,
            phone,
            first_name,
            last_name
        )
      `)
            .eq('status', 'active')
            .lte('next_action_at', new Date().toISOString())
            .limit(50);

        if (error) throw error;

        if (enrollments && enrollments.length > 0) {
            for (const enrollment of enrollments) {
                const sequence = enrollment.automation_sequences;
                const lead = enrollment.leads;
                const steps = sequence.steps || [];
                const currentIndex = enrollment.current_step_index || 0;

                // Check if sequence is finished
                if (currentIndex >= steps.length) {
                    await supabaseAdmin
                        .from('automation_enrollments')
                        .update({ status: 'completed' })
                        .eq('id', enrollment.id);
                    results.push({ id: enrollment.id, status: 'completed' });
                    continue;
                }

                const currentStep = steps[currentIndex];
                let nextIndex = currentIndex;
                let nextActionAt = new Date().toISOString(); // Default to now (immediate next step unless delay)

                try {
                    // EXECUTE STEP LOGIC
                    switch (currentStep.type) {
                        case 'delay':
                            const hours = currentStep.config?.hours || 24;
                            const delayDate = new Date();
                            delayDate.setHours(delayDate.getHours() + hours);
                            nextActionAt = delayDate.toISOString();
                            nextIndex++; // Move to next step, but it won't execute until next_action_at
                            break;

                        case 'email':
                            // Send Email Logic
                            console.log(`Sending email to ${lead.email} using template ${currentStep.config?.template_id}`);
                            // await sendEmail(...)
                            // Record activity
                            await supabaseAdmin.from('activities').insert({
                                lead_id: enrollment.lead_id,
                                type: 'email',
                                description: `Automazione: Inviata email (Step ${currentIndex + 1}) - Template ${currentStep.config?.template_id || 'N/A'}`
                            });
                            nextIndex++;
                            break;

                        case 'whatsapp':
                            // Send WhatsApp Logic (MANUAL TRIGGER)
                            console.log(`Creating manual WA task for ${lead.phone}`);

                            // 1. Create a Task for the agent
                            await supabaseAdmin.from('tasks').insert({
                                lead_id: enrollment.lead_id,
                                title: `💬 Invia WhatsApp: ${currentStep.config?.template_id ? 'Template Selezionato' : 'Messaggio Manuale'}`,
                                description: `Automazione "${sequence.name}": È richiesto un tuo intervento per inviare un messaggio WhatsApp a ${lead.first_name} ${lead.last_name}.`,
                                due_date: new Date().toISOString(), // Due now
                                completed: false,
                                assigned_to: lead.assigned_to // Ensure lead has assigned_to or handle null
                            });

                            // 2. Create a Notification
                            if (lead.assigned_to) {
                                await supabaseAdmin.from('notifications').insert({
                                    user_id: lead.assigned_to,
                                    lead_id: lead.id,
                                    type: 'task', // notification type
                                    title: '💬 Azione Richiesta: WhatsApp',
                                    message: `L'automazione richiede di inviare un messaggio a ${lead.first_name}. Clicca per eseguire.`,
                                    read: false
                                });
                            }

                            // 3. Log Activity (as 'pending' or similar, or just 'system_note')
                            await supabaseAdmin.from('activities').insert({
                                lead_id: enrollment.lead_id,
                                type: 'note',
                                description: `Automazione: Generato task per invio WhatsApp manuale (Step ${currentIndex + 1})`
                            });

                            nextIndex++;
                            break;

                        case 'task':
                            // Create Task
                            await supabaseAdmin.from('tasks').insert({
                                lead_id: enrollment.lead_id,
                                title: currentStep.config?.title || 'Task Automatica',
                                description: `Generato da automazione: ${sequence.name}`,
                                due_date: new Date().toISOString(), // Due today
                                completed: false
                            });
                            nextIndex++;
                            break;

                        default:
                            console.warn('Unknown step type', currentStep.type);
                            nextIndex++;
                    }

                    // Update Enrollment
                    if (nextIndex >= steps.length) {
                        await supabaseAdmin
                            .from('automation_enrollments')
                            .update({
                                status: 'completed',
                                current_step_index: nextIndex,
                                last_action_at: new Date().toISOString()
                            })
                            .eq('id', enrollment.id);
                    } else {
                        await supabaseAdmin
                            .from('automation_enrollments')
                            .update({
                                current_step_index: nextIndex,
                                next_action_at: nextActionAt,
                                last_action_at: new Date().toISOString()
                            })
                            .eq('id', enrollment.id);
                    }

                    results.push({ id: enrollment.id, action: currentStep.type, success: true });

                } catch (err) {
                    console.error(`Error processing enrollment ${enrollment.id}`, err);
                    results.push({ id: enrollment.id, success: false, error: err });
                }
            }
        }

        return NextResponse.json({ processed: results.length, details: results });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
