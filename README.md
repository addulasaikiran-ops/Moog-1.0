# Moog 1.0

Moog is a no-login text sharing app. You paste text, create a random share URL, choose its lifetime, optionally protect it with an access key, and optionally make it view once.

## Architecture

- Next.js + TypeScript: web app and API routes
- Prisma: database access
- PostgreSQL: persistent storage (Supabase Postgres works well)
- GitHub Actions: scheduled cleanup every 15 minutes
- Deployment: any Node-compatible host such as Railway, Render, or a VPS

The project does **not** require Vercel.

## Share flow

1. The user submits text.
2. The server generates a 256-bit random token.
3. Only the token's SHA-256 hash is stored in PostgreSQL.
4. The raw token is returned in the share URL.
5. The share is readable until \`expiresAt\`.
6. Reads enforce expiration immediately, even before cleanup runs.
7. GitHub Actions calls the protected cleanup endpoint every 15 minutes to physically delete expired rows.

## Local development

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Create \`.env\` from the template:

\`\`\`bash
cp .env.example .env
\`\`\`

Set \`DATABASE_URL\` to a PostgreSQL database, then:

\`\`\`bash
npx prisma migrate dev
npm run dev
\`\`\`

Open http://localhost:3000.

## Deployment

Configure your Node host with:

- \`DATABASE_URL\`
- \`NEXT_PUBLIC_APP_URL\`
- \`CRON_SECRET\`

Use:

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

For GitHub Actions cleanup, add repository secrets:

- \`MOOG_APP_URL\`: your deployed app URL, for example \`https://moog.example.com\`
- \`MOOG_CRON_SECRET\`: the same value as \`CRON_SECRET\`

The workflow also supports manual execution from the GitHub Actions tab.

## Security notes

Raw share tokens, revoke tokens, and receive codes are never stored. Share and revoke tokens use SHA-256 digests; receive codes use HMAC-SHA256 with `CODE_HASH_SECRET`.

The share page checks the expiration timestamp on every request, so an expired link returns the 404 page even when the database cleanup job has not run yet.

The current implementation limits text to 100,000 characters. Protected links use a short-lived, HttpOnly, path-scoped access cookie instead of placing the password in the URL. Share creation and password attempts are rate-limited per client. Security headers are applied globally.

## Railway migrations

Set the Railway service pre-deploy command to `npx prisma migrate deploy`. Do not use `prisma db push` in production. Configure the required server-only secrets before deploying.
