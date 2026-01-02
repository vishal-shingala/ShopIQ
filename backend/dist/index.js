"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('==== ENV CHECK ====');
console.log('CWD:', process.cwd());
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
console.log('===================');
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
// Explicitly load the backend .env so env vars are available regardless of CWD.
if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing. Set it in OS environment variables.');
}
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const cors_1 = __importDefault(require("cors"));
const ai_1 = require("./lib/ai");
const gemini_1 = require("./lib/gemini");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/analyze-reviews', async (req, res) => {
    try {
        const { productName, price, reviews } = req.body;
        if (!productName || typeof productName !== 'string' || !productName.trim()) {
            return res.status(400).json({ success: false, error: 'Invalid product name' });
        }
        if (typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid price' });
        }
        if (!reviews || typeof reviews !== 'string' || !reviews.trim()) {
            return res.status(400).json({ success: false, error: 'Invalid reviews' });
        }
        const result = await (0, ai_1.analyzeReviews)(productName, price, reviews);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        console.error('Analysis error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
function looksLikeProductPage(urlStr) {
    try {
        const u = new URL(urlStr);
        const path = u.pathname.toLowerCase();
        if (path.length > 1)
            return true;
        if (path.includes('/dp/') || path.includes('/product') || path.includes('/p/'))
            return true;
        if (u.searchParams.has('id'))
            return true;
        return false;
    }
    catch (err) {
        return false;
    }
}
app.post('/analyze-product', async (req, res) => {
    try {
        const { productLink, productName, description } = req.body;
        if (!productLink || typeof productLink !== 'string' || !productLink.trim()) {
            return res.status(400).json({ success: false, error: 'Product link is required' });
        }
        if (!/^https?:\/\//i.test(productLink)) {
            return res.status(400).json({ error: 'Invalid product link. Please provide a product page URL.' });
        }
        if (!looksLikeProductPage(productLink)) {
            return res.status(400).json({ error: 'Invalid product link. Please provide a product page URL.' });
        }
        if (!productName || typeof productName !== 'string' || !productName.trim()) {
            return res.status(400).json({ success: false, error: 'Product name is required' });
        }
        const desc = typeof description === 'string' ? description : '';
        if (!desc.trim()) {
            return res.status(400).json({ success: false, error: 'Product description or reviews are required' });
        }
        const aiResult = await (0, gemini_1.analyzeProduct)(productLink, productName, desc);
        return res.json(aiResult);
    }
    catch (err) {
        console.error('Analyze product error:', err);
        // If it's a config issue about the API key, return a clear message
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('GEMINI_API_KEY')) {
            return res.status(500).json({ success: false, error: 'Server misconfiguration: GEMINI_API_KEY is not configured on the backend' });
        }
        // If it's an error from the Gemini integration, return a safe message and 502
        if (err instanceof gemini_1.GeminiError) {
            return res.status(502).json({ success: false, error: err.safeMessage });
        }
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// Validate critical backend configuration at startup to fail fast and clearly.
function ensureGeminiKeyOrExit() {
    const key = process.env.GEMINI_API_KEY;
    if (!key || typeof key !== 'string' || !key.trim()) {
        console.error('FATAL: GEMINI_API_KEY not set. Please add it to backend/.env or environment variables.');
        process.exit(1);
    }
    const trimmed = key.trim();
    // Detect common placeholder/example values to avoid running with an invalid key
    if (/YOUR_|REPLACE|EXAMPLE|REDACTED|CHANGE_ME/i.test(trimmed) || trimmed.length < 20) {
        console.error('FATAL: GEMINI_API_KEY appears to be a placeholder or invalid value. Please set a valid API key in backend/.env (do NOT commit it).');
        process.exit(1);
    }
}
ensureGeminiKeyOrExit();
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`ShopIQ backend listening on port ${PORT}`);
});
// Simple health endpoint for diagnostics
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Development-only debug endpoint to verify backend-only Gemini key presence (masked)
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug/gemini-config', (_req, res) => {
        const key = process.env.GEMINI_API_KEY;
        if (!key || typeof key !== 'string' || !key.trim()) {
            return res.json({ hasKey: false });
        }
        const trimmed = key.trim();
        const masked = trimmed.length > 8 ? `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}` : `***len:${trimmed.length}`;
        return res.json({ hasKey: true, masked, length: trimmed.length });
    });
}
