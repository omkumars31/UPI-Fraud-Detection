const https = require('https');
const { query } = require('../../config/db');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

// Rate limiter — max 1 Gemini call per 60 seconds on free tier
let lastCallTime = 0;
const MIN_INTERVAL_MS = 60000;

function buildPrompt(transaction, scoring) {
  return `You are a senior fraud analyst at a UPI payments company in India.
A transaction has been flagged by our automated risk engine with a score of ${scoring.score}/100.

Transaction details:
- Sender: ${transaction.sender_upi_id}
- Receiver: ${transaction.receiver_upi_id}
- Amount: Rs.${transaction.amount}
- Location: ${transaction.location}
- Time: ${new Date(transaction.timestamp).toLocaleString('en-IN')}
- Risk Tier: ${scoring.tier.label}

Signals that triggered:
${scoring.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Write a 3-line professional fraud alert explanation for this transaction.
Be specific about the exact signals. Use precise numbers from the data.
Format: exactly 3 lines, no bullet points, no headers, no markdown.
Sound like a human analyst writing an urgent alert, not a chatbot.`;
}

function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
      },
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(GEMINI_URL, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.error) {
            reject(new Error(`Gemini API error: ${parsed.error.message}`));
            return;
          }

          const text =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ||
            parsed?.candidates?.[0]?.output                    ||
            parsed?.text                                        ||
            null;

          if (text) resolve(text.trim());
          else reject(new Error('No text in response: ' + JSON.stringify(parsed).substring(0, 200)));

        } catch (err) {
          reject(new Error('Failed to parse Gemini response: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateAlertExplanation(alertId, transaction, scoring) {
  if (!GEMINI_API_KEY) {
    console.warn('[AlertService] No GEMINI_API_KEY in .env — skipping AI explanation');
    return null;
  }

  // Rate limit check — skip Gemini if called too recently
  const now = Date.now();
  if (now - lastCallTime < MIN_INTERVAL_MS) {
    console.log('[AlertService] Rate limited — using fallback explanation');
    const fallback =
      `Risk score ${scoring.score}/100 triggered by: ${scoring.reasons[0]}. ` +
      `Transaction flagged for manual review. ` +
      `Signals: ${scoring.triggeredFlags.join(', ')}.`;
    await query('UPDATE alerts SET ai_explanation = $1 WHERE id = $2', [fallback, alertId]);
    return fallback;
  }

  lastCallTime = now;

  try {
    const prompt = buildPrompt(transaction, scoring);
    const explanation = await callGeminiAPI(prompt);

    await query(
      'UPDATE alerts SET ai_explanation = $1 WHERE id = $2',
      [explanation, alertId]
    );

    console.log(`[AlertService] AI explanation generated for alert ${alertId}`);
    return explanation;

  } catch (err) {
    console.error('[AlertService] Gemini API error:', err.message);

    const fallback =
      `Risk score ${scoring.score}/100 triggered by: ${scoring.reasons[0]}. ` +
      `Transaction flagged for manual review. ` +
      `Signals: ${scoring.triggeredFlags.join(', ')}.`;

    await query(
      'UPDATE alerts SET ai_explanation = $1 WHERE id = $2',
      [fallback, alertId]
    );

    return fallback;
  }
}

module.exports = { generateAlertExplanation };