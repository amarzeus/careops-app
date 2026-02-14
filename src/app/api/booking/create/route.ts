import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";
import { triggerAutomation } from "@/lib/automation";
import { syncBookingToCalendar } from "@/lib/google-calendar";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { serviceId, date, time, contact, notes } = body;

        if (!serviceId || !date || !time || !contact?.email || !contact?.name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch Service details (outside transaction - read-only)
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        // Construct DateTime from date + time
        const bookingStart = new Date(`${date}T${time}:00`);
        const bookingEnd = addMinutes(bookingStart, service.duration);

        // 2. CRITICAL FIX: Use transaction with Serializable isolation to prevent race conditions
        // This ensures conflict check and booking creation are atomic
        const result = await prisma.$transaction(async (tx) => {
            // 2a. Validate availability (within transaction - prevents race conditions)
            const existingConflict = await tx.booking.findFirst({
                where: {
                    workspaceId: service.workspaceId,
                    status: { not: "CANCELLED" },
                    AND: [
                        { date: { lt: bookingEnd } },
                        { endTime: { gt: bookingStart } }
                    ]
                }
            });

            if (existingConflict) {
                throw new Error("CONFLICT: Slot no longer available");
            }

            // 2b. Check inventory availability (within transaction)
            const inventoryLinks = await tx.serviceInventoryLink.findMany({
                where: { serviceId },
                include: { inventory: true }
            });

            for (const link of inventoryLinks) {
                if (link.inventory.quantity < link.quantity) {
                    throw new Error(`INVENTORY:Insufficient inventory for ${link.inventory.name}`);
                }
            }

            // 2c. Find or Create Contact (within transaction)
            let dbContact = await tx.contact.findFirst({
                where: {
                    email: contact.email,
                    workspaceId: service.workspaceId
                }
            });

            if (dbContact) {
                dbContact = await tx.contact.update({
                    where: { id: dbContact.id },
                    data: {
                        name: contact.name,
                        phone: contact.phone || dbContact.phone,
                        notes: notes ? (dbContact.notes ? `${dbContact.notes}\n${notes}` : notes) : dbContact.notes
                    }
                });
            } else {
                dbContact = await tx.contact.create({
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

            // 2d. Create Booking (within transaction - ensures atomicity)
            const booking = await tx.booking.create({
                data: {
                    date: bookingStart,
                    endTime: bookingEnd,
                    status: "CONFIRMED",
                    notes: notes,
                    serviceId: service.id,
                    contactId: dbContact.id,
                    workspaceId: service.workspaceId
                }
            });

            return { booking, dbContact };
        }, {
            isolationLevel: 'Serializable', // Prevents phantom reads and race conditions
            maxWait: 5000, // Maximum time to wait for transaction slot
            timeout: 10000 // Maximum time for transaction to complete
        });

        const { booking, dbContact } = result;

        // 3. Trigger Automation (outside transaction - non-blocking)
        // We don't await to keep response fast
        triggerAutomation(service.workspaceId, "BOOKING_CREATED", { booking, contact: dbContact, service })
            .catch(err => console.error("[Automation] Failed to trigger:", err));

        // 4. Sync to Google Calendar (fire-and-forget, never blocks booking flow)
        syncBookingToCalendar(booking.id, service.workspaceId).catch((err) =>
            console.error("[Google Calendar] Background sync error:", err)
        );

        return NextResponse.json({ success: true, bookingId: booking.id });

    } catch (error: any) {
        console.error("Booking Creation Error:", error);
        
        // Handle specific transaction errors
        if (error.message?.startsWith("CONFLICT:")) {
            return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
        }
        
        if (error.message?.startsWith("INVENTORY:")) {
            return NextResponse.json({ 
                error: "Insufficient inventory",
                details: error.message.replace("INVENTORY:", "")
            }, { status: 409 });
        }
        
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
