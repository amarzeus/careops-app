# CI Pipeline Documentation

## Overview

This project uses **GitHub Actions** for Continuous Integration (CI). Deployment to Render is handled automatically by Render's GitHub integration when you push to the main branch.

## Pipeline Stages

### 1. Code Quality & Type Safety (`lint-and-typecheck`)
- **Trigger**: Every push and pull request
- **Purpose**: Ensures code quality and catches type errors early
- **Steps**:
  - ESLint for code style
  - TypeScript type checking

### 2. Unit Tests (`unit-tests`)
- **Trigger**: After lint/typecheck passes
- **Purpose**: Runs Vitest unit tests
- **Steps**:
  - Install dependencies
  - Run unit tests with coverage
  - Upload coverage to Codecov (main branch only)

### 3. Database Migration Check (`migration-check`)
- **Trigger**: After lint/typecheck passes
- **Purpose**: Validates database migrations work correctly
- **Services**: PostgreSQL 15 container
- **Steps**:
  - Generate Prisma client
  - Run migrations
  - Verify schema sync

### 4. Build Application (`build`)
- **Trigger**: After lint and unit tests pass
- **Purpose**: Builds the Next.js application
- **Steps**:
  - Generate Prisma client
  - Build Next.js app
  - Upload build artifacts

### 5. E2E Tests (`e2e-tests`)
- **Trigger**: After build and migration check pass
- **Purpose**: Runs Playwright E2E tests
- **Services**: PostgreSQL 15 container
- **Steps**:
  - Install Playwright browsers
  - Run database migrations
  - Execute E2E tests
  - Upload Playwright report

### 6. Security Audit (`security-audit`)
- **Trigger**: After lint/typecheck passes
- **Purpose**: Checks for security vulnerabilities
- **Steps**:
  - Run `npm audit`
  - Run Snyk security scan (if token configured)

### 7. Deployment Ready Check (`deployment-ready`)
- **Trigger**: After all tests pass (main branch only)
- **Purpose**: Confirms code is ready for deployment
- **Output**: Success message indicating deployment readiness

### 8. Production Smoke Tests (`smoke-tests`)
- **Trigger**: Manual only (`workflow_dispatch`)
- **Purpose**: Verifies production is working after deployment
- **Steps**:
  - Run smoke tests against production URL

## How Deployment Works

### Automatic Deployment (Free Tier)

Render's free tier automatically deploys when you push to GitHub:

1. **Connect Render to GitHub** (one-time setup):
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Select your service
   - Go to **Settings** → **Build & Deploy**
   - Connect your GitHub repository
   - Set branch to `main`

2. **Deploy on Push**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
   
   Render will automatically:
   - Detect the push
   - Build the application
   - Deploy to production

3. **Monitor Deployment**:
   - Check Render dashboard for build logs
   - Visit your app URL when deployment completes

### Manual Deployment

If you need to deploy manually:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service
3. Click **Manual Deploy** → **Deploy latest commit**

## Branch Protection Rules

Recommended branch protection for `main`:
- Require pull request reviews
- Require status checks to pass:
  - `lint-and-typecheck`
  - `unit-tests`
  - `migration-check`
  - `build`
  - `e2e-tests`
- Require up-to-date branches

## Required Secrets (Optional)

These secrets are optional but enhance the pipeline:

| Secret | Description | Required |
|--------|-------------|----------|
| `SNYK_TOKEN` | Snyk API token for security scans | No |
| `CODECOV_TOKEN` | Codecov token for coverage reports | No |
| `SLACK_WEBHOOK_URL` | Slack notifications | No |

## Local Testing

Run the same checks locally:

```bash
# Lint and type check
npm run lint
npx tsc --noEmit

# Unit tests
npx vitest run

# E2E tests (requires database)
npm run test:e2e

# Security audit
npm audit
```

## Troubleshooting

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check for environment variable issues

### Database Migration Failures
- Ensure migrations are committed to git
- Check database connection string
- Verify migrations are in correct order

### E2E Test Failures
- Check if test database is properly configured
- Verify test data doesn't conflict
- Check for flaky tests

### Render Deployment Issues
- Check Render dashboard logs
- Verify `render.yaml` is valid
- Check database is accessible from Render

## Workflow File

The CI workflow is defined in `.github/workflows/ci.yml`.

### Manual Triggers

You can manually trigger the smoke tests workflow:

1. Go to GitHub Actions tab
2. Select "CI Pipeline"
3. Click "Run workflow"
4. Select the workflow and run it

## Deployment Flow

```
Push to main
    ↓
GitHub Actions runs:
  - Lint & Type Check
  - Unit Tests
  - Database Check
  - Build
  - E2E Tests
  - Security Audit
    ↓
All checks pass
    ↓
Render auto-deploys (connected via GitHub)
    ↓
Production updated
```

## Monitoring After Deployment

- Check Render service logs
- Health check endpoint: `https://your-app.com/api/health`
- Run manual smoke tests from GitHub Actions
- Monitor error rates and performance
