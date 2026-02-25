import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface StaffCreatePayload {
  email: string;
  name: string;
  password?: string;
  canAccessInbox?: boolean;
  canAccessBookings?: boolean;
  canAccessForms?: boolean;
  canAccessInventory?: boolean;
}

interface StaffUpdatePayload extends Partial<StaffCreatePayload> {
  id: string;
}

/**
 *
 */
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

/**
 *
 * @param req
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Only owners can add staff" }, { status: 403 });

  const {
    email,
    name,
    password,
    canAccessInbox,
    canAccessBookings,
    canAccessForms,
    canAccessInventory,
  }: StaffCreatePayload = await req.json();

  if (!email || !name || !password)
    return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

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

/**
 *
 * @param req
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const {
    id,
    name,
    email,
    password,
    canAccessInbox,
    canAccessBookings,
    canAccessForms,
    canAccessInventory,
  }: StaffUpdatePayload = await req.json();

  if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser || existingUser.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: any = {
    name,
    email,
    canAccessInbox,
    canAccessBookings,
    canAccessForms,
    canAccessInventory,
  };

  if (password) {
    updateData.passwordHash = await hashPassword(password);
  }

  const staff = await prisma.user.update({
    where: { id },
    data: updateData,
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

  return NextResponse.json({ staff });
}
