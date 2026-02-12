import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerAutomation } from "@/lib/automation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log(`[API] Fetching bookings for workspace: ${user.workspaceId}`);
  const bookings = await prisma.booking.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      service: true,
      contact: true,
      _count: { select: { formSubmissions: true } },
    },
    orderBy: { date: "desc" },
  });

  console.log(`[API] Found ${bookings.length} bookings`);
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId, contactId, date, notes } = await req.json();
  if (!serviceId || !contactId || !date)
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service)
    return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact)
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const startDate = new Date(date);
  const endTime = new Date(startDate.getTime() + service.duration * 60000);

  const booking = await prisma.booking.create({
    data: {
      date: startDate,
      endTime,
      serviceId,
      contactId,
      workspaceId: user.workspaceId,
      notes,
      status: "CONFIRMED",
    },
    include: { service: true, contact: true },
  });

  await triggerAutomation(user.workspaceId, "BOOKING_CREATED", {
    booking,
    contact,
    service,
  });

  return NextResponse.json({ booking }, { status: 201 });
}
