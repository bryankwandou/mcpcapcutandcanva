# Nova — AI Chat (web)

Web chat app powered by the public [xAI API](https://docs.x.ai). Built with Next.js (App Router), ready for Vercel.

- Real-time streaming responses (Edge runtime)
- Model picker (grok-4, grok-3, grok-3-mini)
- API key stays server-side (`XAI_API_KEY`)
- Markdown + code rendering, local chat history
- **Demo mode**: works without an API key (sample answers) — safe for presentations

## Run locally
```bash
npm install
cp .env.example .env.local   # fill XAI_API_KEY
npm run dev
```

## Deploy to Vercel
1. Import this repo at https://vercel.com/new (framework auto-detected: Next.js)
2. Add env var `XAI_API_KEY` (optional `XAI_MODEL`)
3. Deploy

Independent project; not affiliated with xAI.
