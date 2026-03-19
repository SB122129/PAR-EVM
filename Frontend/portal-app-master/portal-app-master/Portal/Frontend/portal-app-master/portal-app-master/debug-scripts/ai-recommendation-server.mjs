import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const PORT = Number.parseInt(process.env.AI_RECOMMENDATION_PORT || '8787', 10);
const HOST = process.env.AI_RECOMMENDATION_HOST || '0.0.0.0';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function json(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

function makeRecommendation() {
  const now = new Date().toISOString();
  return {
    id: `rec_${Date.now()}`,
    rationale:
      'Volatility cooled in last 24h. Keep conservative majority and slightly increase neutral yield allocation.',
    hash: '0x8f1e6a6a7fa16f6b5d6f5d8b8deec3a41f0f38f8a0eebf6c47c7e8a2ab91d3c5',
    createdAtIso: now,
    riskScore: 31,
    confidence: 0.89,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function extractJsonObject(rawText) {
  const trimmed = rawText.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function parseGeminiText(text) {
  const jsonText = extractJsonObject(text);
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const rationale =
      typeof parsed.rationale === 'string' && parsed.rationale.trim().length > 0
        ? parsed.rationale.trim()
        : null;
    const riskScoreRaw = Number(parsed.riskScore);
    const confidenceRaw = Number(parsed.confidence);

    if (!rationale || Number.isNaN(riskScoreRaw) || Number.isNaN(confidenceRaw)) {
      return null;
    }

    return {
      rationale,
      riskScore: clamp(Math.round(riskScoreRaw), 0, 100),
      confidence: clamp(Number(confidenceRaw.toFixed(2)), 0, 1),
    };
  } catch {
    return null;
  }
}

async function generateGeminiRecommendation() {
  const now = new Date().toISOString();

  if (!GEMINI_API_KEY) {
    return makeRecommendation();
  }

  const prompt = [
    'You are generating a DeFi vault recommendation for a mobile app on EVM.',
    'Return strict JSON only with keys: rationale, riskScore, confidence.',
    'Constraints:',
    '- rationale: one short sentence (max 25 words).',
    '- riskScore: integer 0-100.',
    '- confidence: decimal 0-1 with 2 decimals.',
    '- Focus on stablecoin vault and conservative risk posture.',
  ].join('\n');

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      return makeRecommendation();
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof rawText !== 'string') {
      return makeRecommendation();
    }

    const parsed = parseGeminiText(rawText);
    if (!parsed) {
      return makeRecommendation();
    }

    const hashInput = `${parsed.rationale}|${parsed.riskScore}|${parsed.confidence}|${now}`;
    const hash = `0x${createHash('sha256').update(hashInput).digest('hex')}`;

    return {
      id: `rec_${Date.now()}`,
      rationale: parsed.rationale,
      hash,
      createdAtIso: now,
      riskScore: parsed.riskScore,
      confidence: parsed.confidence,
    };
  } catch {
    return makeRecommendation();
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.url === '/health') {
    json(res, 200, {
      ok: true,
      ts: new Date().toISOString(),
      model: GEMINI_MODEL,
      geminiConfigured: Boolean(GEMINI_API_KEY),
    });
    return;
  }

  if (req.url === '/api/recommendation' && req.method === 'GET') {
    const recommendation = await generateGeminiRecommendation();
    json(res, 200, recommendation);
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`AI recommendation server running on http://${HOST}:${PORT}`);
  console.log(`Recommendation endpoint: http://${HOST}:${PORT}/api/recommendation`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
  console.log(`Gemini configured: ${GEMINI_API_KEY ? 'yes' : 'no (fallback mock mode)'}`);
});
