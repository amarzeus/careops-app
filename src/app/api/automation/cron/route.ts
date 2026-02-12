import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { addHours, isWithinInterval } from "date-fns";

/** GET /api/automation/cron
 *  Scheduled automation runner — queries and executes time-based automations:
 *  1. BEFORE_BOOKING reminders (bookings happening in the next 24 hours)
 *  2. FORM_PENDING reminders (forms pending for > 48 hours)
 *
 *  Should be called by an external cron service (e.g., every hour).
 *  Secured by CRON_SECRET header.
 */
export async function GET(req: Request) {
    // Simple security: verify cron secret
    const cronSecret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: { type: string; workspaceId: string; status: string; details: string }[] = [];

    try {
        // 1. BEFORE_BOOKING reminders
        const now = new Date();
        const in24Hours = addHours(now, 24);

        const beforeBookingRules = await prisma.automationRule.findMany({
            where: { trigger: "BEFORE_BOOKING", isActive: true },
            include: { workspace: true },
        });

        for (const rule of beforeBookingRules) {
            const upcomingBookings = await prisma.booking.findMany({
                where: {
                    workspaceId: rule.workspaceId,
                    status: { in: ["PENDING", "CONFIRMED"] },
                    date: { gte: now, lte: in24Hours },
                },
                include: { contact: true, service: true },
            });

            for (const booking of upcomingBookings) {
                // Check if reminder already sent (avoid duplicates)
                const alreadySent = await prisma.automationLog.findFirst({
                    where: {
                        ruleId: rule.id,
                        trigger: "BEFORE_BOOKING",
                        details: { contains: booking.id },
                        createdAt: { gte: addHours(now, -25) }, // Within last 25 hours
                    },
                });

                if (alreadySent) continue;

                const appointmentTime = new Date(booking.date).toLocaleString([], {
                    weekday: "long", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                });

                const emailSent = await sendEmail({
                    to: booking.contact.email,
                    subject: `Reminder: Your appointment tomorrow — ${rule.workspace.name}`,
                    html: buildEmailTemplate(
                        "Appointment Reminder",
                        `<p>Hi ${booking.contact.name},</p>
             <p>This is a friendly reminder about your upcoming appointment:</p>
             <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 16px 0;">
               <p style="margin: 0; font-weight: bold; color: #1e40af;">📅 ${appointmentTime}</p>
               <p style="margin: 4px 0 0; color: #1e40af;">Service: ${booking.service.name}</p>
               ${booking.service.location ? `<p style="margin: 4px 0 0; color: #1e40af;">📍 ${booking.service.location}</p>` : ""}
             </div>
             ${rule.messageTemplate || "<p>We look forward to seeing you!</p>"}
             <p style="color: #6b7280; font-size: 12px;">— ${rule.workspace.name}</p>`
                    ),
                });

                await prisma.automationLog.create({
                    data: {
                        ruleId: rule.id,
                        trigger: "BEFORE_BOOKING",
                        status: emailSent ? "SUCCESS" : "FAILED",
                        details: JSON.stringify({ bookingId: booking.id, contactName: booking.contact.name }),
                        recipient: booking.contact.email,
                    },
                });

                results.push({
                    type: "BEFORE_BOOKING",
                    workspaceId: rule.workspaceId,
                    status: emailSent ? "SUCCESS" : "FAILED",
                    details: `Reminder to ${booking.contact.name} for ${booking.service.name}`,
                });
            }
        }

        // 2. FORM_PENDING reminders (forms pending > 48h)
        const formRules = await prisma.automationRule.findMany({
            where: { trigger: "FORM_PENDING", isActive: true },
            include: { workspace: true },
        });

        for (const rule of formRules) {
            const pendingForms = await prisma.formSubmission.findMany({
                where: {
                    workspaceId: rule.workspaceId,
                    status: { in: ["PENDING", "SENT"] },
                    createdAt: { lte: addHours(now, -48) },
                },
                include: { contact: true, intakeForm: true },
            });

            for (const form of pendingForms) {
                // Check if reminder already sent for this form recently
                const alreadySent = await prisma.automationLog.findFirst({
                    where: {
                        ruleId: rule.id,
                        trigger: "FORM_PENDING",
                        details: { contains: form.id },
                        createdAt: { gte: addHours(now, -72) },
                    },
                });

                if (alreadySent) continue;

                const formName = form.intakeForm?.name || "your form";
                const emailSent = await sendEmail({
                    to: form.contact.email,
                    subject: `Reminder: Please complete ${formName} — ${rule.workspace.name}`,
                    html: buildEmailTemplate(
                        "Form Reminder",
                        `<p>Hi ${form.contact.name},</p>
             <p>We noticed that <strong>${formName}</strong> hasn't been completed yet. Please take a moment to fill it out.</p>
             ${rule.messageTemplate || "<p>If you have any questions, feel free to reach out to us.</p>"}
             <p style="color: #6b7280; font-size: 12px;">— ${rule.workspace.name}</p>`
                    ),
                });

                await prisma.automationLog.create({
                    data: {
                        ruleId: rule.id,
                        trigger: "FORM_PENDING",
                        status: emailSent ? "SUCCESS" : "FAILED",
                        details: JSON.stringify({ formId: form.id, contactName: form.contact.name }),
                        recipient: form.contact.email,
                    },
                });

                results.push({
                    type: "FORM_PENDING",
                    workspaceId: rule.workspaceId,
                    status: emailSent ? "SUCCESS" : "FAILED",
                    details: `Form reminder to ${form.contact.name}`,
                });
            }
        }

        return NextResponse.json({
            processed: results.length,
            results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("Cron automation error:", error);
        return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
    }
}
