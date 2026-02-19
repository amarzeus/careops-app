import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const SECRET = JWT_SECRET || "dev-only-careops-secret-change-me";

/**
 * Cryptographically-secure token encoding using HMAC-SHA256.
 * Format: base64url(payload).hmac_signature
 * @param payload
 */
function encodeToken(payload: Record<string, unknown>): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;

    const expectedSig = createHmac("sha256", SECRET).update(encoded).digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Hashes a password using bcrypt.
 * @param password - The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifies a password against a hash.
 * @param password - The plain text password
 * @param hash - The stored hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a JWT token for a user.
 * @param userId - The user ID
 * @param workspaceId - The workspace ID
 * @param role - The user role
 * @returns The signed JWT token
 */
export function createToken(userId: string, workspaceId: string | null, role: string): string {
  return encodeToken({ userId, workspaceId, role });
}

/**
 * Sets the authentication cookie.
 * @param token - The JWT token
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Retrieves the authentication cookie value.
 * @returns The token string or null
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value || null;
}

/**
 * Removes the authentication cookie.
 */
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

/**
 * Gets the current authenticated user.
 * @returns The user object or null
 */
export async function getCurrentUser() {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    include: { workspace: true },
  });

  return user;
}

/**
 * Verifies and decodes a JWT token.
 * @param token - The JWT token
 * @returns The decoded payload or null
 */
export function verifyToken(token: string) {
  return decodeToken(token);
}
