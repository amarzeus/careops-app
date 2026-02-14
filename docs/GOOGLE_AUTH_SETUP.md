# Google Authentication Setup Guide

To enable Google Authentication for your CareOps application on Render, you must configure the Authorized redirect URIs and JavaScript origins in the Google Cloud Console.

## Step-by-Step Configuration

1.  Go to the [Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials).
2.  Select your project.
3.  Find your **OAuth 2.0 Client ID** (typically named "Web client 1") and click the edit icon.
4.  Add the following URLs to the respective sections:

### Authorized JavaScript origins
Click **"ADD URI"** under "Authorized JavaScript origins" and paste:
- `https://careops-app.onrender.com`

### Authorized redirect URIs
Click **"ADD URI"** under "Authorized redirect URIs" and paste:
- `https://careops-app.onrender.com/api/auth/google/callback`
- `https://careops-app.onrender.com/api/integrations/google-calendar/callback`

5.  Click **"SAVE"** at the bottom of the page.

> [!IMPORTANT]
> It may take a few minutes for these changes to propagate across Google's global infrastructure.

## Environment Variables
Ensure your Render environment variables match these values:
- `NEXT_PUBLIC_APP_URL`: `https://careops-app.onrender.com`
- `GOOGLE_CLIENT_ID`: (Your full client ID ending in `.apps.googleusercontent.com`)
- `GOOGLE_CLIENT_SECRET`: (Your full client secret)
