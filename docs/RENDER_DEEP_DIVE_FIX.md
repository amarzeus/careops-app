# 🔧 Deep Dive Fix: Render Deployment "next: not found"

## Root Cause Analysis

The issue was multi-faceted:

1. **No package-lock.json** - Render uses lock files for dependency caching. Without it, dependency installation can be inconsistent.
2. **Build command structure** - The build command wasn't properly chaining npm install with the build step
3. **Missing installCommand** - Render's auto-detection wasn't working properly

## Changes Made

### 1. Updated render.yaml

```yaml
# Key changes:
- Changed from 'env: node' to 'runtime: node' (explicit)
- Added proper multi-line buildCommand with set -e (fail on error)
- Removed separate installCommand (now part of buildCommand)
- Added package-lock.json generation
- Fixed database configuration
```

### 2. Created package-lock.json

```bash
npm install --package-lock-only
```

This file MUST be committed to git for Render to cache dependencies properly.

### 3. Created render-build.sh (backup script)

A robust build script that:
- Sets -e (exit on error)
- Verifies Node/npm versions
- Explicitly checks for Next.js binary
- Runs each step with verification

## Deployment Checklist

Before pushing to GitHub:

- [ ] package-lock.json is committed
- [ ] render.yaml is valid
- [ ] All environment variables are set in Render dashboard
- [ ] Database is created on Render

### Critical Files to Commit

```bash
git add package-lock.json render.yaml
```

## Testing Locally with Render Config

### 1. Test Build Process

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Generate Prisma
npx prisma generate

# Build
npm run build
```

### 2. Validate render.yaml

Install Render CLI:
```bash
# Already installed at: ~/.local/bin/render
export PATH="$HOME/.local/bin:$PATH"

# Login (if needed)
render login

# Validate blueprint
render blueprints validate
```

## Environment Variables Required on Render

### Auto-set by Render:
- `DATABASE_URL` - From PostgreSQL addon
- `JWT_SECRET` - Auto-generated

### Must be manually configured:
- `VAPI_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `EMAIL_PASS` (Resend API key)
- `EMAIL_FROM`

## Build Process on Render

With the new configuration:

1. Render clones repo
2. Installs Node.js 20
3. Runs buildCommand:
   ```
   npm ci              # Install from lock file
   npx prisma generate # Generate Prisma client
   npm run build       # Build Next.js
   ```
4. Starts with: `npm start`
5. Health check on `/`

## Troubleshooting Commands

### View Build Logs
```bash
render logs --service careops-app --type build
```

### View Runtime Logs
```bash
render logs --service careops-app
```

### Trigger Manual Deploy
```bash
render deploy --service careops-app
```

### Check Service Status
```bash
render services list
```

## Success Indicators

When deployment works, you'll see:

```
✅ Build successful
📦 Dependencies installed
🗄️  Prisma client generated
🔨 Next.js build completed
🚀 Service started on port 5000
✅ Health check passed
```

## Next Steps

1. **Commit all changes:**
   ```bash
   git add -A
   git commit -m "Fix Render deployment configuration"
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to Render Dashboard
   - Watch build logs
   - Wait for "Build successful"

3. **Verify deployment:**
   - Visit your Render URL
   - Check `/api/health` endpoint
   - Test core functionality

## Common Issues & Solutions

### Issue: "next: not found"
**Solution:** Ensure package-lock.json is committed and buildCommand runs npm install first

### Issue: "prisma: not found"
**Solution:** Add explicit `npx prisma generate` after npm install

### Issue: Build succeeds but app won't start
**Solution:** Check startCommand and healthCheckPath in render.yaml

### Issue: Database connection failed
**Solution:** Verify DATABASE_URL env var is set and database is created

## Rollback Plan

If the deployment fails:

1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy"
4. Choose "Deploy previous commit"

Or via CLI:
```bash
render deploy --service careops-app --commit <previous-commit-sha>
```
