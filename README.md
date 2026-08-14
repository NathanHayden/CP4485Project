# St. John's Travel Advisory

A travel site for St. John's, Newfoundland and Labrador. Visitors can browse a
community event calendar, check the local forecast, and generate a day by day
trip itinerary that is built from the site's own events and the real weather
forecast.

Built with Next.js (App Router), TypeScript, Tailwind CSS and MongoDB Atlas.

## Features

- **Event calendar** — full create, read, update and delete. Events are stored
  in MongoDB and shown on a month calendar. Signed-in users may add events, and
  can only edit or delete the ones they submitted.
- **Google sign in** — OAuth 2.0 login. The session is a signed JWT held in an
  HTTP-only cookie.
- **Weather** — current conditions and a 7-day forecast for St. John's and
  nearby communities, from the Open-Meteo API.
- **Trip planner** — pick your dates, interests, travel party and pace, and get
  a structured day by day itinerary back. See below.
- **Light and dark theme** — toggled in the navbar.

## The trip planner

`POST /api/plan` gathers three real inputs before it asks for anything:

1. the events in MongoDB whose dates overlap the trip,
2. the Open-Meteo forecast for those dates, and
3. the signed-in visitor's name, read from the session cookie.

It then calls Groq through the Vercel AI SDK's `generateObject`, which forces
the reply to match a Zod schema (`src/app/plan/schema.ts`) instead of returning
loose text. The reply is checked against the event ids we actually supplied, so
an activity is only labelled as being on our calendar when it links to a real
event page.

The API key is read from `process.env` inside a route handler, so it never
reaches the browser. The client component only ever POSTs to `/api/plan`.

## Environment variables

Create a `.env.local` file in the project root. It is gitignored and must never
be committed.

| Variable | What it is |
| --- | --- |
| `MONGO_USER` | MongoDB Atlas database username |
| `MONGO_PASSWORD` | MongoDB Atlas database password |
| `GOOGLE_CLIENT_ID` | OAuth client id from the Google Cloud console |
| `GOOGLE_SECRET` | OAuth client secret from the Google Cloud console |
| `GOOGLE_REDIRECT` | OAuth redirect URL, e.g. `http://localhost:3000/auth/google/callback` |
| `JWT_SECRET` | Any long random string, used to sign the session cookie |
| `GROQ_API_KEY` | API key from the Groq console, for the trip planner |

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Project layout

```
src/
  app/
    api/          route handlers (events, weather, plan)
    auth/         Google OAuth callback
    events/       calendar, add/edit forms, event detail page
    plan/         trip planner page, form, results and Zod schema
    weather/      forecast page
  components/     shared UI (Card, Button, Field, Navbar, Footer…)
  googleOauthUtils.ts   OAuth client and user upsert
  proxy.ts              route protection for signed-in only pages
```
