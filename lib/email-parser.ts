import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function parseLeadEmail(emailBody: string, emailSubject: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1, // Più deterministico per dati strutturati
    }
  });

  const prompt = `
Sei un assistente che estrae dati strutturati da email di richieste valutazione immobiliare.

SUBJECT: ${emailSubject}

BODY:
${emailBody}

Estrai TUTTI i dati presenti nell'email e rispondi SOLO con un oggetto JSON valido (senza markdown, senza spiegazioni).

Schema richiesto:
{
  "nome": "string",
  "email": "string",
  "telefono": "string",
  "indirizzo": "string",
  "motivazione": "string", // es: "Vendere nei prossimi 6 mesi"
  "tipologia": "string", // es: "Villa indipendente", "Appartamento"
  "superficie": number, // solo numero, senza "mq"
  "locali": number,
  "bagni": number,
  "piano": number,
  "ascensore": boolean,
  "condizione": "string", // es: "Nuova costruzione", "Da ristrutturare"
  "classe_energetica": "string", // es: "A2", "B", "C"
  "extra": ["string"], // array es: ["Balcone/Terrazzo", "Garage"]
  "punteggio": number, // estrai il punteggio se presente (es: "75/100")
  "lead_quality": "HOT" | "WARM" | "COLD", // deriva dal punteggio o dal testo
  "landing_page_url": "string",
  "source": "string"
}

REGOLE IMPORTANTI:
- Se un campo non è presente nell'email, usa null
- Converti "Sì"/"Si"/"Yes" in true, "No" in false
- Estrai solo numeri per superficie, locali, bagni, piano
- Per lead_quality: se punteggio >= 85 → "HOT", >= 70 → "WARM", altrimenti "COLD"
- Per extra: estrai tutte le caratteristiche extra come array
- Normalizza tipologia: "Villa indipendente", "Appartamento", "Attico", etc.

Rispondi SOLO con il JSON, niente altro.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Pulisci il testo da eventuali markdown
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '');
    jsonText = jsonText.replace(/```\n?/g, '');
    jsonText = jsonText.trim();

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validazione base
    if (!parsed.nome || !parsed.email) {
      throw new Error('Dati lead incompleti: mancano nome o email');
    }

    // Auto-classify quality se non presente
    if (!parsed.lead_quality && parsed.punteggio) {
      if (parsed.punteggio >= 85) parsed.lead_quality = 'HOT';
      else if (parsed.punteggio >= 70) parsed.lead_quality = 'WARM';
      else parsed.lead_quality = 'COLD';
    }

    return parsed;
  } catch (error: any) {
    console.error('Errore parsing email con AI:', error);
    throw new Error(`Failed to parse email: ${error.message}`);
  }
}

// Validazione email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validazione telefono italiano
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Rimuovi spazi, trattini, parentesi
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Accetta formati italiani: 3331234567, +393331234567, 00393331234567
  const phoneRegex = /^(\+39|0039)?[0-9]{9,10}$/;
  return phoneRegex.test(cleaned);
}