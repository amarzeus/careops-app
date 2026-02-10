import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "careops-secret";

// Simple token encoding (base64 JSON with HMAC-like signature)
function encodeToken(payload: Record<string, unknown>): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = Buffer.from(JWT_SECRET + encoded).toString("base64url").slice(0, 32);
  return `${encoded}.${signature}`;
}

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const [encoded, signature] = token.split(".");
    const expectedSig = Buffer.from(JWT_SECRET + encoded).toString("base64url").slice(0, 32);
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: string, workspaceId: string | null, role: string): string {
  return encodeToken({ userId, workspaceId, role });
}

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

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value || null;
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

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

export function verifyToken(token: string) {
  return decodeToken(token);
}
