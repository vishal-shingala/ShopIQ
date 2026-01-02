"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiError = void 0;
exports.analyzeProduct = analyzeProduct;
class GeminiError extends Error {
    constructor(message, safeMessage) {
        super(message);
        this.name = 'GeminiError';
        this.safeMessage = safeMessage || 'AI analysis service error';
    }
}
exports.GeminiError = GeminiError;
function buildPrompt(productLink, productName, description) {
    return `You are an expert product-review analyst. Based on the product context below and the provided description or pasted reviews, produce a STRICT JSON object as the ONLY output matching this exact schema:

{
  "summary": "(one short paragraph summarizing overall customer sentiment without inventing reviews)",
  "pros": ["string", "string"],
  "cons": ["string", "string"],
  "fakeReviewProbability": 0, // integer 0-100
  "verdict": "Buy|Consider|Avoid",
  "bestAlternative": { "name": "string", "reason": "string", "priceRange": "string" }
}

Context:
- Product Link: ${productLink}
- Product Name: ${productName}
- Description / Reviews: ${description}

Requirements:
- Do NOT invent or fabricate review text. If the provided text is insufficient, state conclusions conservatively in the summary.
- Aggregate sentiment and list the top 3–5 pros and 3–5 cons observed across the provided text and typical market patterns for similar products.
- Estimate fakeReviewProbability (0-100) using linguistic signals and review sampling; explain nothing — only return the number.
- Provide a single-word verdict: either "Buy", "Consider", or "Avoid".
- Suggest ONE better alternative within a similar price range with a one-sentence reason and a short priceRange string.

Only output the JSON object and nothing else. Ensure valid JSON (no comments, no markdown).`;
}
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function ensureLogDir() {
    const dir = path_1.default.join(__dirname, '..', '..', 'logs');
    try {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    catch (e) {
        // ignore
    }
    return dir;
}
function logToFile(entry) {
    try {
        const dir = ensureLogDir();
        const file = path_1.default.join(dir, 'gemini.log');
        const line = `[${new Date().toISOString()}] ${typeof entry === 'string' ? entry : JSON.stringify(entry)}\n`;
        fs_1.default.appendFileSync(file, line);
    }
    catch (e) {
        console.error('Failed to write gemini log', e);
    }
}
async function analyzeProduct(productLink, productName, description) {
    function getGeminiApiKey() {
        const key = process.env.GEMINI_API_KEY;
        if (!key || typeof key !== 'string' || !key.trim()) {
            logToFile({ event: 'missing_api_key' });
            throw new Error('GEMINI_API_KEY not configured in backend environment');
        }
        return key.trim();
    }
    const apiKey = getGeminiApiKey();
    // log masked apiKey info for debugging (do NOT log full key)
    try {
        const len = apiKey.length;
        const masked = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : `***len:${len}`;
        logToFile({ event: 'api_key_info', masked, length: len });
    }
    catch (e) {
        logToFile({ event: 'api_key_info_error', error: String(e) });
    }
    const prompt = buildPrompt(productLink, productName, description);
    // Use stable v1 Gemini endpoint (chat/message-style) and messages format
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateMessage`;
    // Use the messages shape expected by the v1 generateMessage endpoint.
    // Keep temperature and maxOutputTokens to preserve original behavior.
    const body = {
        messages: [
            {
                author: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt,
                    },
                ],
            },
        ],
        temperature: 0,
        maxOutputTokens: 800,
    };
    try {
        // Log outgoing request prompt
        logToFile({ event: 'request', productLink, productName, prompt: prompt.slice(0, 2000) });
        // Use API key via header; log the request url without exposing the key
        const requestUrl = url;
        logToFile({ event: 'request_url', url: requestUrl });
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(body),
        });
        if (!resp.ok) {
            const errText = await resp.text();
            logToFile({ event: 'http_error', status: resp.status, body: errText.slice(0, 2000) });
            throw new Error(`Gemini HTTP ${resp.status}: ${errText}`);
        }
        const data = await resp.json();
        // Log full response JSON for debugging
        logToFile({ event: 'response_json', data: JSON.stringify(data).slice(0, 20000) });
        // extract text output from possible response shapes
        let text;
        if (data?.candidates && data.candidates[0] && data.candidates[0].content) {
            text = data.candidates[0].content;
        }
        else if (data?.output && Array.isArray(data.output) && data.output[0]?.content) {
            const content = data.output[0].content;
            if (Array.isArray(content)) {
                const piece = content.find((c) => c?.text)?.text;
                text = piece ?? JSON.stringify(content);
            }
            else if (typeof content === 'string') {
                text = content;
            }
        }
        else if (typeof data?.candidates?.[0]?.message === 'string') {
            text = data.candidates[0].message;
        }
        if (!text && typeof data === 'string')
            text = data;
        if (!text)
            throw new GeminiError('No text returned from Gemini', 'No text returned from AI service');
        const cleaned = text.replace(/```json|```/g, '').trim();
        // Log raw response
        logToFile({ event: 'response_raw', raw: text.slice(0, 20000) });
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        }
        catch (parseErr) {
            logToFile({ event: 'json_parse_error', error: String(parseErr), raw: cleaned.slice(0, 2000) });
            throw new GeminiError('Failed to parse Gemini JSON output', 'AI produced invalid output');
        }
        parsed.fakeReviewProbability = Number(parsed.fakeReviewProbability || 0);
        parsed.pros = parsed.pros || [];
        parsed.cons = parsed.cons || [];
        parsed.summary = parsed.summary || parsed.verdict || '';
        parsed.bestAlternative = parsed.bestAlternative || { name: '', reason: '', priceRange: '' };
        // attach raw AI output for debugging/visibility
        parsed.raw = text;
        // Log parsed JSON
        logToFile({ event: 'response_parsed', parsed });
        return parsed;
    }
    catch (err) {
        // Log full details for diagnostics but expose only safe messages to callers.
        try {
            logToFile({ event: 'error', error: String(err) });
        }
        catch (e) {
            console.error('Failed to write gemini error log', e);
        }
        console.error('Gemini call/parse failed', err);
        if (err instanceof GeminiError)
            throw err;
        throw new GeminiError(String(err || 'Unknown error from Gemini'), 'AI analysis failed');
    }
}
