# Agriculture Tube — real API setup

## What you need to provide

For the minimum real application, provide these **four Supabase/Mux values**:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```

Also provide `NEXT_PUBLIC_SUPABASE_ANON_KEY` when browser authentication is connected.

Optional integrations:

```env
YOUTUBE_API_KEY=       # Real YouTube agriculture-video search
OPENWEATHER_API_KEY=   # Live weather card
RESEND_API_KEY=        # Email notifications
```

Do not send secrets in chat, screenshots, or a public repository. Put them in your local `.env.local` file. If a secret is exposed, rotate it in the provider dashboard.

## 1. Install and run

Use Node.js 18.17 or newer:

```bash
npm install
cp .env.example .env.local
# Edit .env.local on your own computer.
npm run dev
```

Open `http://localhost:3000`. With no keys, the app runs in local demo mode. Check configured services at `http://localhost:3000/api/health`.

## 2. Supabase — users and database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. Open **Project Settings → API**.
4. Copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the anon/public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Copy the service-role/secret key into `SUPABASE_SERVICE_ROLE_KEY`.
7. Enable your preferred providers under **Authentication → Providers**.

The public anon key is safe for browser use only when Row Level Security is enabled. Never expose the service-role key to the browser.

## 3. Mux — real video uploads

1. Create an account at [mux.com](https://www.mux.com).
2. Open **Settings → API Access Tokens** and create a token with Mux Video read/write access.
3. Copy the Token ID and Secret Key into `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`.
4. Set `MUX_CORS_ORIGIN` to the exact website origin, such as `http://localhost:3000` or `https://agriculturetube.example`.

The included `POST /api/uploads/mux` route creates a signed direct-upload URL. The front end uploads the selected file directly to Mux. Video processing is asynchronous.

**Still required before public launch:** a verified Mux webhook that marks a video ready and stores its asset/playback IDs. The included metadata route is an integration example, not a complete authenticated publishing system.

## 4. YouTube Data API — optional

1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Create/select a project and enable **YouTube Data API v3**.
3. Open **APIs & Services → Credentials → Create Credentials → API key**.
4. Restrict the key to YouTube Data API v3 and your backend IP where possible.
5. Put the key in `YOUTUBE_API_KEY`.

Test through the backend:

```text
GET /api/youtube/search?q=organic%20farming
```

Uploading directly to a user's YouTube channel additionally requires OAuth 2.0 client credentials and user consent.

## 5. OpenWeather — optional

1. Create an account at [openweathermap.org](https://openweathermap.org).
2. Open **My API Keys** and create/copy a key.
3. Put it in `OPENWEATHER_API_KEY`.
4. Restart the server. The Chennai weather card updates automatically when configured.

Test:

```text
GET /api/weather?city=Chennai
```

## Included API routes

| Route | Purpose |
|---|---|
| `GET /api/health` | Shows which integrations are configured, without revealing values |
| `GET /api/weather?city=Chennai` | Server-side live weather request |
| `GET /api/youtube/search?q=rice` | Safe, embeddable YouTube search |
| `POST /api/uploads/mux` | Creates a secure direct-upload URL |
| `POST /api/videos` | Stores processing-video metadata in Supabase |

## Before accepting real users

- Add Supabase Auth middleware and CSRF protection to mutating routes.
- Derive `creator_id` from the verified session, never from arbitrary client input.
- Verify Mux webhook signatures and use webhooks to update video readiness.
- Add rate limits and per-user upload quotas.
- Add content moderation, reporting, blocking, and account-deletion workflows.
- Serve over HTTPS and configure a restrictive Content Security Policy.
- Store deployment secrets in your hosting provider's encrypted secret manager.
- Review YouTube, Mux, Supabase, and OpenWeather usage quotas and pricing.

## Deployment checklist

Set every required variable in your hosting dashboard, set `APP_ORIGIN` and `MUX_CORS_ORIGIN` to the final HTTPS domain, run `npm run check`, and never deploy `.env.local` as a public static asset.
