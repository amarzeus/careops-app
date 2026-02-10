import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.user.findMany({
    where: { workspaceId: user.workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      canAccessInbox: true,
      canAccessBookings: true,
      canAccessForms: true,
      canAccessInventory: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json(
      { error: "Only owners can add staff" },
      { status: 403 }
    );

  const {
    email,
    name,
    password,
    canAccessInbox,
    canAccessBookings,
    canAccessForms,
    canAccessInventory,
  } = await req.json();
  if (!email || !name || !password)
    return NextResponse.json(
      { error: "Email, name, and password are required" },
      { status: 400 }
    );

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );

  const passwordHash = await hashPassword(password);
  const staffUser = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "STAFF",
      workspaceId: user.workspaceId,
      canAccessInbox: canAccessInbox ?? true,
      canAccessBookings: canAccessBookings ?? true,
      canAccessForms: canAccessForms ?? true,
      canAccessInventory: canAccessInventory ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      canAccessInbox: true,
      canAccessBookings: true,
      canAccessForms: true,
      canAccessInventory: true,
    },
  });

  return NextResponse.json({ staff: staffUser }, { status: 201 });
}
