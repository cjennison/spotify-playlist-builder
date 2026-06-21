# Spotify Playlist Builder

Blend the music tastes of two or more **identities** into a single AI-curated
Spotify playlist. Each identity is a set of seed artists you type in. OpenAI mixes
songs by artists they already love (**known**) with **discovery** picks chosen using
music-theory reasoning (e.g. a fan of *Cake* might also enjoy *Flobots*), keeping the
playlist evenly balanced across everyone and ratioed between known vs. discovery.

Built with **Next.js (App Router)**, deployable to **Vercel**.

## Features

- Add 2+ identities, each with their own list of liked artists.
- Control playlist size and the **known vs. discovery** ratio.
- OpenAI generates a balanced, real-song blend (JSON-schema structured output).
- Suggestions are resolved to real Spotify tracks before saving.
- One click to create the playlist in **your** Spotify account.
- Google SSO + email whitelist; user data in MongoDB.

## How it works

1. Sign in with **Google** (must be on the `AUTH_WHITELIST`).
2. **Connect Spotify** (links your Spotify account for search + playlist creation).
3. Define identities and seed artists, pick size + ratio, **Generate**.
4. Review the matched tracks, then **Save to Spotify**.

## Tech stack

- Next.js 14 + TypeScript + Tailwind CSS
- Auth.js (NextAuth v5) -- Google + Spotify providers, MongoDB adapter
- MongoDB (users, accounts, sessions)
- OpenAI (`gpt-4o-mini` by default)
- Spotify Web API

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
| --- | --- |
| `NEXTAUTH_URL` | Base URL (e.g. `http://localhost:3000` or your Vercel URL) |
| `AUTH_SECRET` | Session secret -- `openssl rand -base64 32` |
| `AUTH_WHITELIST` | Comma-separated Google emails allowed to sign in (empty = nobody) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify app credentials |
| `MONGODB_URI` / `MONGODB_DB` | MongoDB connection + database name |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o-mini` |

### OAuth redirect URIs

- Google: `{NEXTAUTH_URL}/api/auth/callback/google`
- Spotify: `{NEXTAUTH_URL}/api/auth/callback/spotify`

Spotify requires the `user-read-email`, `playlist-modify-public`, and
`playlist-modify-private` scopes (configured automatically).

## Local development

```bash
cp .env.example .env   # then fill in values
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add all env vars from `.env.example` in **Project Settings -> Environment Variables**.
   Set `NEXTAUTH_URL` to your production URL.
3. Add the production OAuth redirect URIs (above) to Google and Spotify.
4. Deploy.

## Notes

- The whitelist is enforced on the Google login. Spotify is only used to **link**
  a Spotify account to an already-authenticated user.
- AI suggestions that can't be found on Spotify are silently dropped, so the final
  playlist may be slightly shorter than the requested size.
