# ShopIQ Backend

This backend exposes an analysis endpoint that calls Google Gemini (Generative Language) API.

Environment
- `GEMINI_API_KEY` - required API key for Google Generative Language API.
 - `GEMINI_API_KEY` - required API key for Google Generative Language API.
Notes about model:
- This backend is configured to call the Gemini 2.5 model (`gemini-2.5`). Ensure your Google project has access and billing enabled for the Generative Language API.
- `PORT` - optional, defaults to 4000.

Local env file
- Copy `.env.example` to `.env` and set your `GEMINI_API_KEY` there. The backend loads environment variables from `.env` when available.

Endpoints
- `POST /analyze-product` - expects JSON body `{ productLink, productName, description }` and returns structured JSON:
  ```json
  {
    "success": true,
    "data": {
      "pros": ["string"],
      "cons": ["string"],
      "fake_review_probability": 0,
      "final_verdict": "string",
      "best_alternative": { "product_name": "string", "reason": "string" }
    }
  }
  ```

Run

```bash
# from backend/
npm install
# set GEMINI_API_KEY in env then
npm run dev
```

Notes
- This project uses only the Gemini/Generative Language API; no database or authentication is added.
- Make sure `NEXT_PUBLIC_API_URL` in the frontend points to this backend (e.g. `http://localhost:4000`).
