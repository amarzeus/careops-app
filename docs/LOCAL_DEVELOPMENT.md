# Local Development Setup with PostgreSQL

This guide helps you set up a local PostgreSQL database for development and testing.

## Quick Start

### 1. Run the Setup Script

```bash
./scripts/setup-local-db.sh
```

This will:
- Start a PostgreSQL container with Docker
- Create the database and user
- Verify the connection

### 2. Update Your .env File

```env
DATABASE_URL="postgresql://careops:careops@localhost:5432/careops?schema=public"
```

### 3. Install Dependencies & Push Schema

```bash
npm install
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

## Manual Setup

If you prefer manual setup or the script doesn't work:

### Start PostgreSQL with Docker Compose

```bash
docker-compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with:
- **Database**: `careops`
- **Username**: `careops`
- **Password**: `careops`

### Database Admin (Optional)

Access the database with a web UI:

```bash
docker-compose up -d adminer
```

Then visit: http://localhost:8080
- **System**: PostgreSQL
- **Server**: postgres
- **Username**: careops
- **Password**: careops
- **Database**: careops

## Common Commands

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# Stop and remove all data (⚠️ destructive)
docker-compose down -v

# View PostgreSQL logs
docker-compose logs postgres

# Connect with psql
docker exec -it careops-postgres psql -U careops -d careops

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d postgres
npx prisma db push
```

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Create a migration
npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Port Already in Use

If port 5432 is already in use:

```bash
# Find what's using port 5432
lsof -i :5432

# Or use a different port in docker-compose.yml
# Change "5432:5432" to "5433:5432" and update DATABASE_URL accordingly
```

### Connection Refused

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep careops-postgres
   ```

2. Check logs:
   ```bash
   docker-compose logs postgres
   ```

3. Wait a bit longer for PostgreSQL to start up

### Prisma Connection Issues

1. Verify DATABASE_URL format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
   ```

2. Test connection:
   ```bash
   npx prisma db pull
   ```

### Permission Denied

If you get permission errors:

```bash
# Fix permissions on the setup script
chmod +x ./scripts/setup-local-db.sh

# Or run with bash explicitly
bash ./scripts/setup-local-db.sh
```

## Switching Between SQLite and PostgreSQL

### To PostgreSQL (Recommended)

```env
DATABASE_URL="postgresql://careops:careops@localhost:5432/careops?schema=public"
```

Then run:
```bash
npx prisma db push
```

### To SQLite (Fallback)

```env
DATABASE_URL="file:./dev.db"
```

Then run:
```bash
npx prisma db push
```

## Render Deployment Notes

For Render deployment, use the provided PostgreSQL database:

```env
DATABASE_URL="postgresql://username:password@host.render.com:5432/database?sslmode=require"
```

The Render configuration is in `render.yaml`.

## Environment Variables Summary

| Variable | Local Dev | Production (Render) |
|----------|-----------|---------------------|
| DATABASE_URL | `postgresql://careops:careops@localhost:5432/careops` | From Render dashboard |
| NEXT_PUBLIC_APP_URL | `http://localhost:5000` | `https://your-app.onrender.com` |
| JWT_SECRET | Any string | Generate strong secret |
| EMAIL_PASS | Resend API key | Resend API key |
| All other secrets | Your dev keys | Production keys |
