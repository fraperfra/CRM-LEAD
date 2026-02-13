import { google } from 'googleapis';
import { supabase } from './supabase';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export interface GmailConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export class GmailService {
    private oauth2Client: any;
    private config: GmailConfig;

    constructor(config: GmailConfig) {
        this.config = config;
        this.oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );
    }

    // Generate OAuth URL for user authentication
    getAuthUrl(userId?: string): string {
        const options: any = {
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force to get refresh token
        };

        if (userId) {
            options.state = userId;
        }

        return this.oauth2Client.generateAuthUrl(options);
    }

    // Exchange authorization code for tokens
    async getTokensFromCode(code: string) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    // Set credentials from stored tokens
    setCredentials(tokens: any) {
        this.oauth2Client.setCredentials(tokens);
    }

    // Refresh access token if expired
    async refreshAccessToken(refreshToken: string) {
        this.oauth2Client.setCredentials({
            refresh_token: refreshToken,
        });

        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials;
    }

    // Fetch unread emails from inbox
    async fetchUnreadEmails(maxResults: number = 10) {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        // List messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread label:inbox', // Only unread emails in inbox
            maxResults: maxResults,
        });

        const messages = response.data.messages || [];

        // Fetch full message details
        const emails = await Promise.all(
            messages.map(async (message) => {
                const msg = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!,
                    format: 'full',
                });

                return this.parseGmailMessage(msg.data);
            })
        );

        return emails;
    }

    // Parse Gmail message to extract useful data
    private parseGmailMessage(message: any) {
        const headers = message.payload.headers;
        const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        // Get email body
        let body = '';
        if (message.payload.body.data) {
            body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
        } else if (message.payload.parts) {
            // Multi-part message
            const textPart = message.payload.parts.find((part: any) =>
                part.mimeType === 'text/plain' || part.mimeType === 'text/html'
            );
            if (textPart && textPart.body.data) {
                body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
        }

        return {
            id: message.id,
            threadId: message.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            body: body,
            snippet: message.snippet,
            labelIds: message.labelIds || [],
        };
    }

    // Mark email as read
    async markAsRead(messageId: string) {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                removeLabelIds: ['UNREAD'],
            },
        });
    }

    // Get user's email address
    async getUserEmail() {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        return profile.data.emailAddress;
    }
}

// Singleton instance
let gmailServiceInstance: GmailService | null = null;

export function getGmailService(): GmailService {
    if (!gmailServiceInstance) {
        gmailServiceInstance = new GmailService({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`,
        });
    }
    return gmailServiceInstance;
}

// Parse form data from email body
export function parseFormEmail(body: string): {
    nome?: string;
    email?: string;
    telefono?: string;
    messaggio?: string;
    valutazione_stimata?: number;
    tipologia?: string;
} {
    const data: any = {};

    // Common patterns for form emails
    const patterns = {
        nome: /(?:nome|name):\s*(.+?)(?:\n|$)/i,
        email: /(?:email|e-mail):\s*([^\s]+@[^\s]+)(?:\n|$)/i,
        telefono: /(?:telefono|phone|tel):\s*(.+?)(?:\n|$)/i,
        messaggio: /(?:messaggio|message|richiesta):\s*([\s\S]+?)(?:\n\n|$)/i,
        valutazione: /(?:valutazione|budget|prezzo):\s*€?\s*([\d,.]+)/i,
        tipologia: /(?:tipologia|tipo|property type):\s*(.+?)(?:\n|$)/i,
    };

    // Extract nome
    const nomeMatch = body.match(patterns.nome);
    if (nomeMatch) data.nome = nomeMatch[1].trim();

    // Extract email
    const emailMatch = body.match(patterns.email);
    if (emailMatch) data.email = emailMatch[1].trim();

    // Extract telefono
    const telefonoMatch = body.match(patterns.telefono);
    if (telefonoMatch) data.telefono = telefonoMatch[1].trim();

    // Extract messaggio
    const messaggioMatch = body.match(patterns.messaggio);
    if (messaggioMatch) data.messaggio = messaggioMatch[1].trim();

    // Extract valutazione
    const valutazioneMatch = body.match(patterns.valutazione);
    if (valutazioneMatch) {
        const value = valutazioneMatch[1].replace(/[,.]/g, '');
        data.valutazione_stimata = parseInt(value);
    }

    // Extract tipologia
    const tipologiaMatch = body.match(patterns.tipologia);
    if (tipologiaMatch) data.tipologia = tipologiaMatch[1].trim().toLowerCase();

    return data;
}

// Determine lead quality based on email content
export function determineLeadQuality(data: any, body: string): 'HOT' | 'WARM' | 'COLD' {
    let score = 0;

    // Has phone number
    if (data.telefono) score += 30;

    // Detailed message
    if (data.messaggio && data.messaggio.length > 100) score += 20;

    // Budget/valuation mentioned
    if (data.valutazione_stimata) score += 25;

    // Hot keywords
    const hotKeywords = ['urgente', 'subito', 'interessato', 'disponibile', 'acquistare', 'vendere'];
    const bodyLower = body.toLowerCase();
    const keywordMatches = hotKeywords.filter(k => bodyLower.includes(k)).length;
    score += keywordMatches * 15;

    // Tipologia specified
    if (data.tipologia) score += 10;

    if (score >= 70) return 'HOT';
    if (score >= 40) return 'WARM';
    return 'COLD';
}
