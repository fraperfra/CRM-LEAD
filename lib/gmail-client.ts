import { google } from 'googleapis';
import { gmail_v1 } from 'googleapis';

// Supporta sia Service Account che OAuth
export function getGmailClient(): gmail_v1.Gmail {

  // OPZIONE 2: OAuth (Gmail normale)
  if (process.env.GMAIL_REFRESH_TOKEN) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  throw new Error('Gmail credentials not configured');
}

// Estrai body email da oggetto Gmail Message
export function extractEmailBody(message: gmail_v1.Schema$Message): string {
  const parts = message.payload?.parts || [];

  // Cerca parte text/plain
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
  }

  // Cerca parte text/html (fallback)
  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      // Rimuovi tag HTML basic (usa libreria per parsing avanzato se serve)
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Fallback: body diretto
  if (message.payload?.body?.data) {
    return Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  return '';
}

// Estrai subject email
export function extractEmailSubject(message: gmail_v1.Schema$Message): string {
  const headers = message.payload?.headers || [];
  const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
  return subjectHeader?.value || '';
}

// Estrai sender email
export function extractEmailFrom(message: gmail_v1.Schema$Message): string {
  const headers = message.payload?.headers || [];
  const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
  return fromHeader?.value || '';
}