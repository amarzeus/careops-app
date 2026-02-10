import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerAutomation } from "@/lib/automation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace");
  if (!workspaceId)
    return NextResponse.json(
      { error: "Workspace ID required" },
      { status: 400 }
    );

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace || workspace.status !== "ACTIVE")
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );

  const services = await prisma.service.findMany({
    where: { workspaceId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      location: true,
      availableDays: true,
      startTime: true,
      endTime: true,
    },
  });

  return NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      address: workspace.address,
    },
    services,
  });
}

export async function POST(req: Request) {
  try {
    const { serviceId, date, name, email, phone, workspaceId } =
      await req.json();
    if (!serviceId || !date || !name || !workspaceId)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service)
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );

    // Find or create contact
    let contact = email
      ? await prisma.contact.findFirst({
          where: { email, workspaceId },
        })
      : null;

    if (!contact) {
      contact = await prisma.contact.create({
        data: { name, email, phone, source: "booking", workspaceId },
      });
    }

    const startDate = new Date(date);
    const endTime = new Date(startDate.getTime() + service.duration * 60000);

    const booking = await prisma.booking.create({
      data: {
        date: startDate,
        endTime,
        serviceId,
        contactId: contact.id,
        workspaceId,
        status: "CONFIRMED",
      },
      include: { service: true, contact: true },
    });

    // Create conversation if not exists
    const conversation = await prisma.conversation.findUnique({
      where: { contactId: contact.id },
    });
    if (!conversation) {
      await prisma.conversation.create({
        data: {
          contactId: contact.id,
          workspaceId,
          subject: `Booking: ${service.name}`,
        },
      });
    }

    await triggerAutomation(workspaceId, "BOOKING_CREATED", {
      booking,
      contact,
      service,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        date: booking.date,
        service: service.name,
      },
    });
  } catch (error) {
    console.error("Public booking error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
