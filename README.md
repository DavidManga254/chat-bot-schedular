# chat-bot-schedular

A chat assistant that books Google Calendar events from plain sentences. You type something like "lunch with sam@example.com next Thursday at 1pm, remind me 30 minutes before" and the backend turns it into a structured event and creates it in your calendar.

The backend is working. The frontend is an early scaffold: routing, i18n and the authenticated layout exist, but the chat screen itself is still a stub.

## How a message becomes an event

1. The user signs in with Google. The backend stores their OAuth tokens, encrypted with AES-256-CBC, plus their timezone.
2. A message goes to `POST /chat`.
3. The backend sends it to the OpenAI API with today's date and the user's timezone in the system prompt. It forces a single function call (`createCalendarEvent`), so the model has to return a typed object instead of free text.
4. The result is title, start time (ISO 8601), duration, end time, attendees, an RFC 5545 recurrence rule, location, description and reminders. Duration defaults to 60 minutes, and all-day events are handled.
5. `POST /user/add-user-event` creates the event through the Google Calendar API using the stored tokens.

Forcing the function call keeps the model's output predictable, and the date and timezone in the prompt are what let relative phrases like "next Thursday" resolve correctly.

## Stack

| Part | Tech |
|---|---|
| API | NestJS 11, TypeScript |
| Database | PostgreSQL 15 with Prisma 6 (migrations in `prisma/migrations`) |
| LLM | OpenAI API (model set with `OPENAI_MODEL`, default `gpt-4.1-mini`) |
| Calendar and auth | Google OAuth 2.0, Google Calendar API v3 |
| Sessions | Signed, httpOnly cookie, 7-day expiry |
| Validation | `class-validator` DTOs |
| Frontend | Next.js 15, React 19, Tailwind 4, MUI, next-intl, next-auth |

## Layout

```
chat-bot-backend/
  prisma/                  schema and migrations
  src/controllers/         chat and user endpoints
  src/services/openai/     intent extraction
  src/services/google-calendar/   OAuth and event creation
  src/services/user/       user records, token storage
  src/lib/crypto.ts        token encryption
  src/middlewares/         cookie auth
chat-bot-frontend/         Next.js app with locale routing
```

## Running it

**Backend**

```bash
cd chat-bot-backend
docker compose up -d          # local Postgres (dev credentials, change them for anything real)
npm install
npx prisma migrate deploy
npm run start:dev
```

Create a `.env` with:

```
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
COOKIE_SECRET=
TOKEN_SECRET_KEY=
PORT=
```

**Frontend**

```bash
cd chat-bot-frontend
npm install
npm run dev
```

## Not done yet

- The chat UI.
- Parsing dates locally with `chrono-node` as a check on the model's output. The dependency is installed but not wired in.
- Refreshing an expired Google access token automatically.
