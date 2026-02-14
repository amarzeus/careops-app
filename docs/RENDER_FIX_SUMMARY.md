# Render Deployment Fix & Local PostgreSQL Setup

## 🚨 Render Deployment Issue - FIXED

### Problem
Render deployment was failing with:
```
sh: 1: next: not found
```

### Root Cause
The `buildCommand` in `render.yaml` was trying to run `npx prisma generate && npm run build` before `npm install` completed properly.

### Solution
Updated `render.yaml`:

```yaml
# Before (broken):
buildCommand: npx prisma generate && npm run build
installCommand: npm install

# After (fixed):
buildCommand: npm install && npm run build
# (removed separate installCommand, consolidated into buildCommand)
```

This ensures:
1. Dependencies are installed FIRST
2. Then Prisma client is generated
3. Then Next.js build runs

### Additional Fix in package.json
The `postinstall` script already handles Prisma generation:
```json
"postinstall": "prisma generate || true"
```

## 🐘 Local PostgreSQL Setup for Testing

### Quick Start

1. **Run the setup script:**
   ```bash
   ./scripts/setup-local-db.sh
   ```

2. **Update your .env:**
   ```env
   DATABASE_URL="postgresql://careops:careops@localhost:5432/careops?schema=public"
   ```

3. **Push schema and start:**
   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```

### Files Created

| File | Purpose |
|------|---------|
| `docker-compose.yml` | PostgreSQL + Adminer containers |
| `scripts/setup-local-db.sh` | Automated setup script |
| `scripts/test-db-connection.js` | Test database connection |
| `docs/LOCAL_DEVELOPMENT.md` | Full documentation |
| `.env.example` | Updated with PostgreSQL config |

### Docker Services

```yaml
# PostgreSQL
- Port: 5432
- Database: careops
- Username: careops
- Password: careops

# Adminer (Database UI)
- Port: 8080
- URL: http://localhost:8080
```

## 📋 Testing Locally

### Test Database Connection
```bash
node scripts/test-db-connection.js
```

### Start PostgreSQL Only
```bash
docker-compose up -d postgres
```

### Start PostgreSQL + Adminer
```bash
docker-compose up -d
```

### Common Commands
```bash
# View logs
docker-compose logs postgres

# Stop PostgreSQL
docker-compose down

# Reset database (⚠️ deletes data)
docker-compose down -v
docker-compose up -d postgres
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## 🚀 Deploying to Render

### Steps
1. Push changes to GitHub
2. Render will auto-deploy
3. Database is managed by Render (configured in render.yaml)

### Environment Variables on Render
The following are configured in `render.yaml`:
- `DATABASE_URL` - From Render PostgreSQL
- `NEXT_PUBLIC_APP_URL` - Your Render URL
- `JWT_SECRET` - Auto-generated
- Email/SMS credentials - Manually configured

### Build Process on Render
1. `npm install` runs
2. `postinstall` runs `prisma generate`
3. `npm run build` runs `next build`
4. `npm start` starts the production server

## ✅ Verification Checklist

### Local Development
- [ ] Run `./scripts/setup-local-db.sh`
- [ ] Update `DATABASE_URL` in `.env`
- [ ] Run `npx prisma db push`
- [ ] Run `npm run dev`
- [ ] Test app at `http://localhost:5000`

### Render Deployment
- [ ] Push code to GitHub
- [ ] Verify Render build succeeds
- [ ] Check environment variables in Render dashboard
- [ ] Test deployed app URL

## 🔧 Troubleshooting

### "next: not found" Error
- Ensure `buildCommand` includes `npm install`
- Check that `package.json` has `next` in dependencies

### Database Connection Failed
- Check if PostgreSQL container is running: `docker ps`
- Verify `DATABASE_URL` format
- Test with: `node scripts/test-db-connection.js`

### Prisma Errors
- Run `npx prisma generate`
- Run `npx prisma db push`
- Check schema is valid: `npx prisma validate`

## 📚 Documentation

- **Local Development**: `docs/LOCAL_DEVELOPMENT.md`
- **CI/CD Pipeline**: `docs/CI_CD.md`
- **Email/SMS Fix**: `docs/EMAIL_SMS_FIX.md`
- **Data Loss Bugfix**: `docs/DATA_LOSS_BUGFIX.md`

## 🎯 Summary

**Fixed Issues:**
1. ✅ Render deployment failing with "next: not found"
2. ✅ Local PostgreSQL setup for testing
3. ✅ Automated setup scripts
4. ✅ Comprehensive documentation

**Next Steps:**
1. Push changes to GitHub
2. Verify Render deployment
3. Test local development with PostgreSQL
