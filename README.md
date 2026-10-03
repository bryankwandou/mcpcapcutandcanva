# AXIOM — Operator Station

Personal operator station for a Grok-class mind, rebuilt for the browser on Next.js and ready for Vercel.

- **Chat**: streaming replies from the xAI API, 6 personas (Operator, Researcher, Coder, Writer, Strategist, Tutor), slash commands (`/brief`, `/decide`, `/debug`, ...), multiple sessions
- **Megaprompt Studio**: the full 5,000+ line AXIOM megaprompt (`prompts/axiom-megaprompt.md`), searchable by section, copy section / copy all, operator addendum
- **Kernel compiler**: lite / core / full modes, module toggles, live kernel size; the constitution stays locked
- **Memory vault**: notes injected into the kernel on every turn
- **Playbooks**: one-click seeds into megaprompt procedures
- Language pin AUTO / ID / EN, temperature and max-token controls, all persisted in the browser
- **Demo mode**: without `XAI_API_KEY` the station still runs with scripted replies, so a presentation never breaks

## Run locally
```bash
npm install
cp .env.example .env.local   # fill XAI_API_KEY
npm run dev
```

## Deploy to Vercel
1. Import the repo at https://vercel.com/new (Next.js is auto-detected)
2. Add the environment variable `XAI_API_KEY` from https://console.x.ai
3. Deploy

The API key stays server-side (`app/api/chat/route.ts`); the browser never sees it.
