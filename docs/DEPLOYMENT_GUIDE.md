# Production Deployment Guide: Unified Full-Stack (Render)

Because CareOps is a **unified full-stack Next.js app**, you don't need separate frontend and backend directories. The entire project is hosted as a single service.

---

## 🚀 Recommended: Single-Platform Hosting on Render

Render is ideal for this project because it handles the **Next.js app**, the **Prisma database**, and the **VAPI/Automation background tasks** all in one place.

### 1. Link your GitHub Repository
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub account and select the `careops-app` repository.
4. Render will automatically detect the `render.yaml` file and set up both the **Database** and the **Web Service**.

### 2. Configure Environment Variables
In the Render Blueprint setup, you will need to provide these critical values:

| Category | Variable | Source |
|----------|----------|--------|
| **App** | `NEXT_PUBLIC_APP_URL` | Your final `.onrender.com` URL |
| **Auth** | `JWT_SECRET` | Any random long string |
| **Google** | `GOOGLE_CLIENT_ID` | Google Cloud Console |
| **Twilio** | `TWILIO_ACCOUNT_SID` | Twilio Console |
| **Voice AI** | `VAPI_API_KEY` | [Vapi Dashboard](https://dashboard.vapi.ai) |

### 3. Deploy
Click **Approve**. Render will build the unified app and link it to the newly created PostgreSQL database.

---

## 🎨 Why not Netlify?
While Netlify is great for static frontends, a full-stack app with **Prisma and real-time automations** (like your new **Voice Call/VAPI** features) performs much more reliably on a dedicated Web Service like Render.

---

## ✅ Post-Deployment
- [ ] Update your Google OAuth redirect URIs to use your new `.onrender.com` domain.
- [ ] Run a test Voice Call to ensure the VAPI webhook reaches your live URL.

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
