# RasoiMitra

RasoiMitra is a Hindi/English voice-and-text assistant for recipes, cooking, and general nutrition tips.

## Run & Operate

- Click **Run** to start the web app and shared API workflow.
- Add `GROQ_API_KEY` through Replit Secrets to enable AI answers.
- Use `pnpm --filter @workspace/rasoi-mitra run typecheck` to check the web app.
- Use `pnpm --filter @workspace/api-server run typecheck` to check the API.
- Use `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Stack

- pnpm workspace, TypeScript, React, Vite
- Express API server with OpenAPI-generated request/response schemas and client hooks
- Groq chat completions on the server through the OpenAI-compatible Node SDK; the key is never included in frontend code
- Browser Speech Recognition for Hindi/English voice input
- Browser SpeechSynthesis for Hindi/English voice replies

## Where things live

- `artifacts/rasoi-mitra/` — chat and favorites web app
- `artifacts/api-server/src/routes/rasoi-mitra.ts` — AI answer endpoint
- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/api-client-react/` and `lib/api-zod/` — generated API hooks and validation schemas
- `README.md` — run and publish steps

## Architecture decisions

- Browser localStorage stores favorites and app preferences. Current chat messages stay in memory only; there is no saved-history list.
- The Groq key is read only by the API server; requests from the browser never include it.
- Speech recognition and speech synthesis run in the browser, so voice playback does not need a separate provider key.

## User preferences

- Do not persist or display past chat history; do not add chat history back. Keep recipe favorites saved.

## Product

- Hindi/English chat about recipes, cooking, food, and general nutrition
- Recipe preferences for diet, meal type, servings, and leftovers
- Voice input, browser speech playback, saved recipes, and light/dark themes