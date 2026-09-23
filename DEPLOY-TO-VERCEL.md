# Sanctum v2.5.2 - Vercel deployment

This repository is the web application only. It intentionally contains no Android keystore or native Android project.

## Vercel project settings

- Framework Preset: TanStack Start
- Node.js: 22.x
- Install Command: npm ci
- Build Command: npm run build
- Output Directory: leave unset; Nitro writes the Vercel Build Output API files to .vercel/output.

## Required production environment

Set these in Vercel Project Settings -> Environment Variables for Production, and Preview if desired:

- DATABASE_URL - persistent PostgreSQL or Neon connection string. Without this, serverless instances fall back to temporary in-memory PGLite and user data will not be durable.
- BETTER_AUTH_URL - the exact HTTPS public origin, for example https://your-domain.example with no trailing slash.
- BETTER_AUTH_SECRET - a long random secret used to sign Better Auth sessions.
- VITE_AUTH_ENABLED=true

## Optional environment

- RESEND_API_KEY or SENDGRID_API_KEY - password reset email delivery.
- EMAIL_FROM - for example Sanctum <noreply@your-domain.example>.
- XAI_API_KEY - required for AI companion features that call xAI.
- GROK_AUTH_ISSUER, GROK_AUTH_CLIENT_ID and GROK_AUTH_CLIENT_SECRET - only if you have the Grok federated OAuth credentials and want the Google/X broker buttons to work on this independently deployed domain.

## Domain changes

If the production domain changes, update BETTER_AUTH_URL to match the new HTTPS origin and redeploy.

## Database migrations

npm run build automatically runs SQL migrations when DATABASE_URL is configured. Applied migrations are tracked in the _migrations table.

## Important

Do not copy the Android signing keystore into this repository. Vercel does not need it.
