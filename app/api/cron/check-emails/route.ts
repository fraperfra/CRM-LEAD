import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient, extractEmailBody, extractEmailSubject, extractEmailFrom } from '@/lib/gmail-client';
import { parseLeadEmail, isValidEmail } from '@/lib/email-parser';
import { supabase } from '@/lib/supabase';

// Verifica autenticazione cron
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  try {
    // Security: verifica che sia chiamato da Vercel Cron o con secret corretto
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Controllo nuove email lead...');

    // Inizializza Gmail client
    const gmail = getGmailClient();

    // Query per cercare email non lette con subject specifico
    const searchQuery = [
      'subject:"Nuova Richiesta Valutazione"',
      'is:unread',
      'from:noreply@vercel.app' // Modifica con il sender delle tue email
    ].join(' ');

    // Cerca messaggi
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 20, // Processa max 20 email per volta
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      console.log('✅ Nessuna nuova email da processare');
      return NextResponse.json({
        success: true,
        message: 'No new emails',
        processed: 0
      });
    }

    console.log(`📧 Trovate ${messages.length} email da processare`);

    const results = {
      processed: 0,
      created: 0,
      duplicates: 0,
      errors: 0,
      leads: [] as any[]
    };

    // Processa ogni email
    for (const message of messages) {
      try {
        // Ottieni contenuto completo email
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        // Estrai dati email
        const body = extractEmailBody(fullMessage.data);
        const subject = extractEmailSubject(fullMessage.data);
        const from = extractEmailFrom(fullMessage.data);

        console.log(`\n📨 Processing email from ${from}`);
        console.log(`Subject: ${subject}`);

        // Parsa con AI
        const leadData = await parseLeadEmail(body, subject);

        // Validazioni
        if (!isValidEmail(leadData.email)) {
          console.warn(`⚠️ Email non valida: ${leadData.email}`);
          results.errors++;
          continue;
        }

        // Verifica duplicati (stesso email)
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, email')
          .eq('email', leadData.email)
          .is('deleted_at', null)
          .maybeSingle();

        if (existingLead) {
          console.log(`⚠️ Lead duplicato: ${leadData.email} (ID: ${existingLead.id})`);
          results.duplicates++;

          // Marca email come letta comunque
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id!,
            requestBody: {
              removeLabelIds: ['UNREAD'],
              addLabelIds: ['STARRED'] // Opzionale: aggiungi stella ai duplicati
            }
          });

          continue;
        }

        // Prepara dati per insert
        const leadToInsert = {
          ...leadData,
          assigned_to: 'Francesco Coppola',
          // Calcola next_follow_up_date (sarà overridato da trigger DB, ma mettiamolo lo stesso)
          next_follow_up_date: calculateFollowUpDate(leadData.lead_quality),
          // Metadata
          created_at: new Date().toISOString(),
        };

        // Inserisci lead in Supabase
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert([leadToInsert])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Errore insert lead:', insertError);
          results.errors++;
          continue;
        }

        console.log(`✅ Lead creato: ${newLead.nome} (${newLead.email})`);

        // Crea attività automatica
        await supabase.from('activities').insert({
          lead_id: newLead.id,
          type: 'note',
          subject: 'Lead ricevuto via email',
          content: `Lead automaticamente importato da ${leadData.landing_page_url || 'landing page'}\n\nEmail originale da: ${from}`,
          status: 'completed',
          created_by: 'Sistema Automatico'
        });

        results.created++;
        results.leads.push({
          id: newLead.id,
          nome: newLead.nome,
          email: newLead.email,
          quality: newLead.lead_quality,
          punteggio: newLead.punteggio
        });

        // Marca email come letta e archiviata
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id!,
          requestBody: {
            removeLabelIds: ['UNREAD', 'INBOX'],
            addLabelIds: ['Label_123456'] // Opzionale: aggiungi label custom "Lead Processati"
          }
        });

        results.processed++;

      } catch (emailError: any) {
        console.error(`❌ Errore processing email ${message.id}:`, emailError);
        results.errors++;
      }
    }

    console.log('\n📊 Risultati:');
    console.log(`✅ Processate: ${results.processed}`);
    console.log(`🆕 Create: ${results.created}`);
    console.log(`🔄 Duplicate: ${results.duplicates}`);
    console.log(`❌ Errori: ${results.errors}`);

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error: any) {
    console.error('❌ Errore generale cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper: calcola data follow-up basata su quality
function calculateFollowUpDate(quality: string): string {
  const now = new Date();

  switch (quality) {
    case 'HOT':
      now.setHours(now.getHours() + 2); // Follow-up in 2 ore
      break;
    case 'WARM':
      now.setDate(now.getDate() + 1); // Follow-up domani
      break;
    case 'COLD':
      now.setDate(now.getDate() + 3); // Follow-up tra 3 giorni
      break;
    default:
      now.setDate(now.getDate() + 1);
  }

  return now.toISOString();
}

// Permetti solo GET
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Necessario per googleapis