# RasoiMitra

**Aapka roz ka rasoi companion.** Hindi/English me recipe, cooking aur general nutrition advice — type karo ya bol kar poochho, aur jawab bhi suna suna kar suno.

Live hai: **https://rasoi-mitra-recipe.onrender.com**

---

## Kya karta hai

| Feature | Detail |
|---|---|
| **Chat** | Recipes, cooking tricks aur general nutrition tips — 5 quick prompts se shuru karein |
| **Voice input** | Browser ka Web Speech API. Selected language (हिंदी / English) me sunta hai |
| **Voice output** | Har jawab ka 🔊 button use karke suna suna kar sun sakte hain |
| **Language toggle** | पूरा UI हिंदी / English me badal jaata hai. Jawab bhi aapki message ki language me aata hai |
| **Recipe preferences** | Vegetarian, low oil, high protein, weight loss + meal type, servings, leftover |
| **Saved recipes** | ⭐ dabate hi recipe save ho jaati hai, `/favorites` page me milti hai |
| **Theme** | Light / dark toggle |
| **Health safety** | Har nutrition advice ke saath disclaimer aata hai — doctor ki jagah nahi |

**Chat history save nahi hoti** — messages sirf current browser session me rehti hain. Favorites aur preferences `localStorage` me save hote hain.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui |
| **Routing** | wouter (`/`, `/favorites`) |
| **Backend** | Express 5 + Zod validation + pino logging, esbuild se bundle |
| **AI** | Groq (`openai/gpt-oss-20b`) — OpenAI-compatible Node SDK |
| **API contract** | OpenAPI spec → orval se generated React hooks + Zod schemas |
| **Monorepo** | pnpm workspace |
| **Hosting** | Render (free tier) |

Voice input/output browser ka Web Speech API use karte hain — isliye koi alag TTS/STT key nahi chahiye. Sirf AI ke liye Groq key zaruri hai.

---

## Setup (local)

### Zaruri cheezein

- **Node.js 22** (ya usse zyada)
- **pnpm 10** — `corepack enable` se activate ho jata hai
- **Groq API key** — [console.groq.com](https://console.groq.com/) se free milti hai (API Keys → Create). Credit card nahi lagta.

### Install aur chalao

```sh
pnpm install
```

API server ko `GROQ_API_KEY` chahiye. Replit/Replit-style secrets use karne ke bajaye, ek `.env` bana lo `artifacts/api-server/` ke andar — ya terminal me export kar do. (Code me `process.env.GROQ_API_KEY` padha jaata hai.)

Do terminals me chalao:

```sh
# Terminal 1 — API server (port 3000)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — web app (port 5173)
pnpm --filter @workspace/rasoi-mitra run dev
```

Browser me `http://localhost:5173` kholo.

---

## Repo layout

```
artifacts/
  rasoi-mitra/      # React frontend (chat + favorites)
  api-server/       # Express backend (AI endpoint + /healthz)
lib/
  api-spec/         # openapi.yaml — API ka source of truth
  api-zod/          # Generated Zod schemas
  api-client-react/ # Generated React Query hooks
  db/               # Drizzle config (abhi use nahi ho raha)
scripts/            # Post-merge helpers
render.yaml         # Render deployment blueprint
```

---

## API

Base path: `/api`

| Method | Path | Kaam |
|---|---|---|
| `GET` | `/api/healthz` | Server status. `{"status":"ok"}` ya `{"status":"needs_api_key"}` |
| `POST` | `/api/rasoi-mitra/chat` | Recipe/nutrition question ka jawab |

`POST /api/rasoi-mitra/chat` body:

```json
{
  "message": "2 logo ke liye veg dinner",
  "history": [{ "role": "user", "content": "..." }],
  "languageHint": "hi-IN",
  "preferences": {
    "dietaryFilters": ["vegetarian", "low_oil"],
    "mealType": "dinner",
    "servings": 2,
    "useLeftovers": false
  }
}
```

Jawab `{ "reply": "..." }` me aata hai.

---

## Deploy (Render)

`render.yaml` blueprint already repo me hai.

1. GitHub se repo import karo: [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Ye env variables set karo:

   | Key | Value |
   |---|---|
   | `NODE_VERSION` | `22` |
   | `BASE_PATH` | `/` |
   | `GROQ_API_KEY` | aapki key (Render me type karein, commit nahi hoga) |

3. **Build command:**
   ```sh
   pnpm install --frozen-lockfile && pnpm --filter @workspace/rasoi-mitra run build && pnpm --filter @workspace/api-server run build
   ```
4. **Start command:**
   ```sh
   pnpm --filter @workspace/api-server run start
   ```
5. **Root Directory** khaali chhodna (repo root se chalna hai)
6. **Deploy** — pehli build 4-6 minute legi

---

## Important limitations

- **Free Render tier** — 15 min idle ke baad site sleep ho jati hai. Phir se kholne me 30-60 sec lag sakte hain.
- **Voice input Chrome/Edge me best** hai. Firefox/Safari me Web Speech API support kamzor hai.
- **Groq free tier** me rate limits hote hain — bahut zyada bhejoge to thoda ruk sakta hai.

---

## Security

- `GROQ_API_KEY` sirf server side rehta hai — browser ko kabhi nahi jata.
- Repo me koi `.env` ya secret commit nahi hai.
- Public repo hai, isliye kabhi bhi API key code me hardcode mat karein.

---

## Useful checks

```sh
pnpm --filter @workspace/rasoi-mitra run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-spec run codegen   # openapi.yaml badalne ke baad
```