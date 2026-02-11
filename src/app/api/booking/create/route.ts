import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISO, addMinutes } from "date-fns";
import { triggerAutomation } from "@/lib/automation";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { serviceId, date, time, contact, notes } = body;

        if (!serviceId || !date || !time || !contact?.email || !contact?.name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch Service details
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        // 2. Validate availability (Race condition check)
        // Construct DateTime from date + time
        const bookingStart = new Date(`${date}T${time}:00`); // Simple ISO construction
        const bookingEnd = addMinutes(bookingStart, service.duration);

        const existingConflict = await prisma.booking.findFirst({
            where: {
                workspaceId: service.workspaceId,
                status: { not: "CANCELLED" },
                // Check for any overlap
                AND: [
                    { date: { lt: bookingEnd } },
                    { endTime: { gt: bookingStart } }
                ]
            }
        });

        if (existingConflict) {
            return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
        }

        // 3. Find or Create Contact
        let dbContact = await prisma.contact.findFirst({
            where: {
                email: contact.email,
                workspaceId: service.workspaceId
            }
        });

        if (dbContact) {
            // Update info if provided
            dbContact = await prisma.contact.update({
                where: { id: dbContact.id },
                data: {
                    name: contact.name,
                    phone: contact.phone || dbContact.phone,
                    notes: notes ? (dbContact.notes ? `${dbContact.notes}\n${notes}` : notes) : dbContact.notes
                }
            });
        } else {
            dbContact = await prisma.contact.create({
                data: {
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    notes: notes,
                    workspaceId: service.workspaceId,
                    source: "booking_page"
                }
            });
        }

        // 4. Create Booking
        const booking = await prisma.booking.create({
            data: {
                date: bookingStart,
                endTime: bookingEnd,
                status: "CONFIRMED", // Auto-confirm for MVP
                notes: notes,
                serviceId: service.id,
                contactId: dbContact.id,
                workspaceId: service.workspaceId
            }
        });

        // 5. Trigger Automation (Async)
        // We don't await this to keep response fast, but for Vercel serverless we might need to await to ensure execution.
        // Let's await for reliability.
        await triggerAutomation(service.workspaceId, "BOOKING_CREATED", { booking, contact: dbContact, service });

        return NextResponse.json({ success: true, bookingId: booking.id });
    } catch (error) {
        console.error("Booking Creation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
