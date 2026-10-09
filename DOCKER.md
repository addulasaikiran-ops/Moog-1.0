# Run Moog with Docker Desktop

These instructions are for local development on Windows with Docker Desktop and PowerShell. They do not change the Railway deployment.

## 1. Prepare the environment file

From the repository root, copy the Docker-specific template:

```powershell
Copy-Item .env.docker.example .env
```

Edit `.env` and replace each `replace-with-a-long-random-secret` value with a different random secret. You can generate one with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run that command separately for each secret. Keep `.env` private and never commit it. Compose supplies the local PostgreSQL connection to the app, so the `DATABASE_URL` in `.env` is overridden with the internal Docker network URL.

## 2. Build the image and start PostgreSQL

```powershell
docker compose up --build -d db
docker compose build app
```

## 3. Create/update the local database schema

The first time you run Moog against the local database, apply the Prisma schema:

```powershell
docker compose run --rm app npm run db:push
```

This command is intended for the disposable local database in this Compose setup. Do not use `db:push` against a production database.

## 4. Start Moog

```powershell
docker compose up -d app
docker compose ps
docker compose logs -f app
```

Open http://localhost:3000.

## Stop and restart

```powershell
docker compose down
```

The database volume is preserved. To stop the containers and permanently delete the local database volume, use `docker compose down -v`.

## Troubleshooting

- Run commands from the folder containing `Dockerfile` and `docker-compose.yml`.
- Confirm Docker Desktop is running with `docker info`.
- If the app cannot connect to PostgreSQL, check `docker compose ps` and `docker compose logs db`.
- If the database schema changes, rerun `docker compose run --rm app npm run db:push` for this local database.
- The Docker image excludes local environment files. Runtime settings are supplied through Compose, not baked into the image.
