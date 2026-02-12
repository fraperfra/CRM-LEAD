const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');

// Carica credentials OAuth
const credentials = JSON.parse(fs.readFileSync('oauth-credentials.json'));
const { client_id, client_secret } = credentials.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost:3000/api/auth/google/callback'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Genera URL di autorizzazione
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('Apri questo URL nel browser:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nIncolla il codice di autorizzazione qui: ', async (code) => {
  rl.close();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Token ottenuto!');
    console.log('\nAggiungi queste variabili al tuo .env.local:\n');
    console.log(`GMAIL_CLIENT_ID=${client_id}`);
    console.log(`GMAIL_CLIENT_SECRET=${client_secret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    
    // Salva in file (opzionale)
    fs.writeFileSync('gmail-tokens.json', JSON.stringify(tokens, null, 2));
    console.log('\n✅ Token salvato in gmail-tokens.json');
  } catch (error) {
    console.error('Errore:', error);
  }
});