# Production Deployment Guide: Netlify + Render

This guide explains how to deploy the CareOps platform using **Render** (for the Web Service & Database) and **Netlify** (for the Frontend).

---

## 🚀 Phase 1: Deploying the Backend on Render (Recommended)

Render is the best choice for the full Next.js application because it handles the PostgreSQL database and the Prisma connection seamlessly.

### 1. Link your GitHub Repository
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub account and select the `careops-app` repository.
4. Render will automatically detect the `render.yaml` file.

### 2. Configure Environment Variables
Inside the Render Dashboard for your new Blueprint instance, you must set these variables (marked `sync: false` in `render.yaml`):

| Variable | Source |
|----------|--------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `TWILIO_ACCOUNT_SID` | [Twilio Console](https://www.twilio.com/console) |
| `TWILIO_AUTH_TOKEN` | [Twilio Console](https://www.twilio.com/console) |
| `TWILIO_PHONE_NUMBER` | [Twilio Console](https://www.twilio.com/console) |
| `EMAIL_PASS` | Your SMTP Password (Resend or Gmail) |
| `EMAIL_FROM` | Your verified sender email |

### 3. Deploy
Click **Approve** on the Blueprint. Render will:
1. Spin up a **PostgreSQL** database.
2. Build the Next.js app.
3. Run `prisma generate` and `next build`.
4. Run the web service.

---

## 🎨 Phase 2: Deploying the Frontend on Netlify (Optional)

If you prefer to host the frontend on Netlify, use these steps. Note: Netlify works best for the UI, but it will still need to connect to the Render database.

### 1. Link Repo to Netlify
1. Log in to [app.netlify.com](https://app.netlify.com).
2. Click **Add new site** > **Import an existing project**.
3. Select GitHub and pick the repository.
4. Netlify will detect `netlify.toml` and configure the build settings.

### 2. Set Environment Variables
In **Site configuration** > **Environment variables**, set:
- `DATABASE_URL`: Copy this from your Render PostgreSQL Dashboard (`Internal Database URL`).
- All other variables from the list in Phase 1.
- `NEXT_PUBLIC_APP_URL`: Set to your Netlify URL (e.g., `https://careops.netlify.app`).

---

## 🔑 Phase 3: Update Google OAuth Redirects

After your app is live on `https://your-app.onrender.com`:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Edit your OAuth 2.0 Client ID.
3. **Authorized JavaScript origins**: Add `https://your-app.onrender.com`.
4. **Authorized redirect URIs**:
   - `https://your-app.onrender.com/api/auth/google/callback`
   - `https://your-app.onrender.com/api/integrations/google-calendar/callback`

---

## ✅ Deployment Checklist

- [ ] Is the Render PostgreSQL status "Available"?
- [ ] Did the build logs show `Prisma generated`?
- [ ] Is `NEXT_PUBLIC_APP_URL` matching your live domain?
- [ ] Have you added the live domain to Google OAuth redirects?
