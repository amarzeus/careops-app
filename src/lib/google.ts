/**
 *
 */
export function getGoogleAuthURL(): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

/**
 *
 * @param code
 */
export async function getGoogleTokens(code: string) {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    grant_type: "authorization_code",
  };

  console.log("[Google Tokens] Requesting tokens with redirect_uri:", values.redirect_uri);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Google Tokens] Failed:", res.status, errorText);
    throw new Error(`Failed to fetch Google tokens: ${res.status} - ${errorText}`);
  }
  return res.json();
}

/**
 *
 * @param id_token
 * @param access_token
 */
export async function getGoogleUser(id_token: string, access_token: string) {
  const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Google User Info] Failed:", res.status, errorText);
    throw new Error(`Failed to fetch Google user: ${res.status} - ${errorText}`);
  }
  return res.json();
}
