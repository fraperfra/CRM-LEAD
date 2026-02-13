import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Use Admin client for Cron jobs to bypass RLS if needed
// import { sendEmail } from '@/lib/email'; // Placeholder
// import { sendWhatsApp } from '@/lib/whatsapp'; // Placeholder

export async function GET() {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase Admin not configured (missing service role key)' }, { status: 500 });
    }

    try {
        // 1. Fetch enrollments due for action
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
        if (!enrollments || enrollments.length === 0) {
            return NextResponse.json({ message: 'No automations to process' });
        }

        const results = [];

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
            let stepSuccess = true;

            try {
                // EXECUTE STEP LOGIC
                switch (currentStep.type) {
                    case 'delay':
                        // For delay, we just calculate the next time and don't advance the step yet?
                        // Actually, if we are HERE, it means the previous delay is over (or this is the first step).
                        // Wait, if the CURRENT step is 'delay', we should set next_action_at = now + hours
                        // AND increment the step index so next time we execute the step AFTER the delay?
                        // logic:
                        // If we encounter a delay step, we set the next_action_at to future, increment index, and STOP processing this enrollment for now.
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
                            description: `Automazione: Inviata email (Step ${currentIndex + 1})`
                        });
                        nextIndex++;
                        break;

                    case 'whatsapp':
                        // Send WhatsApp Logic
                        console.log(`Sending WA to ${lead.phone}`);
                        // await sendWhatsApp(...)
                        await supabaseAdmin.from('activities').insert({
                            lead_id: enrollment.lead_id,
                            type: 'call', // or whatsapp type if exists
                            description: `Automazione: Inviato WhatsApp (Step ${currentIndex + 1})`
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
                // Optionally mark as failing or retry later
            }
        }

        return NextResponse.json({ processed: results.length, details: results });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
