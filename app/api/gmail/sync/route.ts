import { NextRequest, NextResponse } from 'next/server';
import { getGmailService, parse FormEmail, determineLeadQuality } from '@/lib/gmail';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Get user ID from auth (TODO: implement proper auth)
        const userId = 'current-user-id';

        // Create sync log entry
        const { data: syncLog, error: syncLogError } = await supabase
            .from('email_sync_log')
            .insert({
                triggered_by: userId,
                sync_type: 'manual',
                status: 'running',
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (syncLogError) {
            return NextResponse.json({ error: 'Failed to create sync log' }, { status: 500 });
        }

        const syncId = syncLog.id;
        const startTime = Date.now();

        try {
            // Get stored tokens
            const { data: tokenData, error: tokenError } = await supabase
                .from('gmail_oauth_tokens')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (tokenError || !tokenData) {
                throw new Error('No Gmail account connected');
            }

            // Initialize Gmail service with stored tokens
            const gmailService = getGmailService();

            // Check if token expired and refresh if needed
            const now = new Date();
            const expiresAt = new Date(tokenData.expires_at);

            if (expiresAt < now) {
                // Refresh token
                const newTokens = await gmailService.refreshAccessToken(tokenData.refresh_token);

                // Update database
                await supabase
                    .from('gmail_oauth_tokens')
                    .update({
                        access_token: newTokens.access_token,
                        expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
                    })
                    .eq('id', tokenData.id);

                gmailService.setCredentials(newTokens);
            } else {
                gmailService.setCredentials({
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expiry_date: expiresAt.getTime(),
                });
            }

            // Fetch unread emails
            const emails = await gmailService.fetchUnreadEmails(50);

            let processed = 0;
            let leadsCreated = 0;
            let leadsUpdated = 0;
            let errors = 0;

            // Process each email
            for (const email of emails) {
                try {
                    // Check if already processed
                    const { data: existingProcess } = await supabase
                        .from('processed_emails')
                        .select('id')
                        .eq('gmail_message_id', email.id)
                        .single();

                    if (existingProcess) {
                        console.log(`Email ${email.id} already processed, skipping`);
                        continue;
                    }

                    // Parse email body for form data
                    const formData = parseFormEmail(email.body);

                    // Validate that we have at least email or phone
                    if (!formData.email && !formData.telefono) {
                        console.log(`Email ${email.id} does not contain valid form data`);
                        errors++;
                        continue;
                    }

                    // Determine lead quality
                    const quality = determineLeadQuality(formData, email.body);

                    // Check if lead exists
                    let leadId: string;
                    let wasCreated = false;

                    if (formData.email) {
                        const { data: existingLead } = await supabase
                            .from('leads')
                            .select('id')
                            .eq('email', formData.email)
                            .single();

                        if (existingLead) {
                            // Update existing lead
                            await supabase
                                .from('leads')
                                .update({
                                    last_contact_date: new Date().toISOString(),
                                    // Update other fields if they're empty
                                    nome: existingLead.nome || formData.nome,
                                    telefono: existingLead.telefono || formData.telefono,
                                })
                                .eq('id', existingLead.id);

                            leadId = existingLead.id;
                            leadsUpdated++;
                        } else {
                            // Create new lead
                            const { data: newLead, error: createError } = await supabase
                                .from('leads')
                                .insert({
                                    nome: formData.nome || 'Lead da Email',
                                    email: formData.email,
                                    telefono: formData.telefono,
                                    status: 'nuovo',
                                    lead_quality: quality,
                                    fonte: 'form_gmail',
                                    tipologia: formData.tipologia || 'vendita',
                                    valutazione_stimata: formData.valutazione_stimata,
                                    note: formData.messaggio,
                                    last_contact_date: new Date().toISOString(),
                                })
                                .select()
                                .single();

                            if (createError) {
                                console.error('Error creating lead:', createError);
                                errors++;
                                continue;
                            }

                            leadId = newLead.id;
                            leadsCreated++;
                            wasCreated = true;
                        }

                        // Create activity for this email
                        await supabase.from('activities').insert({
                            lead_id: leadId,
                            type: 'email',
                            title: wasCreated ? 'Primo contatto via form Gmail' : 'Email ricevuta via form',
                            description: formData.messaggio || email.snippet,
                            completed_at: new Date(email.date).toISOString(),
                            metadata: {
                                gmail_message_id: email.id,
                                subject: email.subject,
                                from: email.from,
                            },
                        });

                        // Mark email as processed
                        await supabase.from('processed_emails').insert({
                            gmail_message_id: email.id,
                            lead_id: leadId,
                            from_email: formData.email,
                            subject: email.subject,
                            received_date: new Date(email.date).toISOString(),
                            created_lead: wasCreated,
                        });

                        // Mark Gmail email as read
                        await gmailService.markAsRead(email.id);

                        processed++;
                    }
                } catch (emailError) {
                    console.error(`Error processing email ${email.id}:`, emailError);
                    errors++;
                }
            }

            // Update sync log with results
            const duration = Math.floor((Date.now() - startTime) / 1000);

            await supabase
                .from('email_sync_log')
                .update({
                    emails_fetched: emails.length,
                    emails_processed: processed,
                    leads_created: leadsCreated,
                    leads_updated: leadsUpdated,
                    errors_count: errors,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    duration_seconds: duration,
                })
                .eq('id', syncId);

            // Update last_synced_at on tokens
            await supabase
                .from('gmail_oauth_tokens')
                .update({ last_synced_at: new Date().toISOString() })
                .eq('user_id', userId);

            return NextResponse.json({
                success: true,
                summary: {
                    emailsFetched: emails.length,
                    emailsProcessed: processed,
                    leadsCreated,
                    leadsUpdated,
                    errors,
                    duration,
                },
            });
        } catch (error: any) {
            // Update sync log with error
            await supabase
                .from('email_sync_log')
                .update({
                    status: 'failed',
                    error_message: error.message,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', syncId);

            throw error;
        }
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { error: error.message || 'Sync failed' },
            { status: 500 }
        );
    }
}
