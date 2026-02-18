import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { addHours } from "date-fns";
import { initiateOutboundCall, isVapiConfigured } from "@/lib/vapi";
import { parseVoiceMetadata, serializeVoiceMetadata } from "@/lib/voice-compliance";
import { processWebhookRetries } from "@/lib/webhook-retry";

/** GET /api/automation/cron
 *  Scheduled automation runner — queries and executes time-based automations:
 *  1. FORM_OVERDUE updates (forms past due date)
 *  2. AUTO_RESUME automation (conversations inactive for 24+ hours)
 *  3. WEBHOOK_RETRY processing (failed webhook deliveries)
 *  4. BEFORE_BOOKING reminders (bookings happening in the next 24 hours)
 *  5. FORM_PENDING reminders (forms pending for > 48 hours)
 *
 *  Should be called by an external cron service (e.g., every 5 minutes for webhooks, every hour for others).
 *  Secured by CRON_SECRET header.
 * @param req
 */
export async function GET(req: Request) {
    // Simple security: verify cron secret
    const cronSecret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: { type: string; workspaceId: string; status: string; details: string }[] = [];

    try {
        // 1. Update OVERDUE forms
        const now = new Date();
        
        const overdueForms = await prisma.formSubmission.findMany({
            where: {
                status: { in: ["PENDING", "SENT"] },
                dueDate: { lt: now },
            },
            include: { workspace: true, contact: true, intakeForm: true },
        });

        for (const form of overdueForms) {
            await prisma.formSubmission.update({
                where: { id: form.id },
                data: { status: "OVERDUE" },
            });

            await prisma.alert.create({
                data: {
                    type: "form",
                    title: "Form Overdue",
                    message: `${form.contact.name}'s form "${form.intakeForm?.name || 'Intake Form'}" is overdue`,
                    actionUrl: "/forms/submissions",
                    workspaceId: form.workspaceId,
                },
            });

            results.push({
                type: "FORM_OVERDUE",
                workspaceId: form.workspaceId,
                status: "UPDATED",
                details: `Form ${form.id} marked as overdue`,
            });
        }

        // 2. AUTO-RESUME automation for conversations
        const conversationsToResume = await prisma.conversation.findMany({
            where: {
                isActive: false,
                autoResumeAt: { lte: now }
            },
            include: { workspace: true, contact: true }
        });

        for (const conversation of conversationsToResume) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { 
                    isActive: true,
                    autoResumeAt: null 
                }
            });

            await prisma.alert.create({
                data: {
                    type: "automation",
                    title: "Automation Resumed",
                    message: `Automated messages resumed for conversation with ${conversation.contact.name} after 24-hour inactivity`,
                    actionUrl: "/inbox",
                    workspaceId: conversation.workspaceId,
                    isRead: true,
                },
            });

            results.push({
                type: "AUTO_RESUME",
                workspaceId: conversation.workspaceId,
                status: "SUCCESS",
                details: `Automation resumed for conversation ${conversation.id}`,
            });
        }

        // 3. BEFORE_BOOKING reminders
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
                include: { 
                    contact: {
                        include: { conversation: true }
                    }, 
                    service: true 
                },
            });

            for (const booking of upcomingBookings) {
                // Check if automation is paused for this conversation
                if (booking.contact.conversation && !booking.contact.conversation.isActive) {
                    continue;
                }

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

                if (!booking.contact.email) continue;

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
                    workspaceId: rule.workspaceId,
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

        // 4. Process webhook retries
        const webhookRetryResult = await processWebhookRetries();
        if (webhookRetryResult.processed > 0) {
            results.push({
                type: "WEBHOOK_RETRY",
                workspaceId: "all",
                status: "SUCCESS",
                details: `Processed ${webhookRetryResult.processed} retries: ${webhookRetryResult.succeeded} succeeded, ${webhookRetryResult.failed} failed`,
            });
        }

        // 5. FORM_PENDING reminders (forms pending > 48h)
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
                include: { 
                    contact: {
                        include: { conversation: true }
                    }, 
                    intakeForm: true 
                },
            });

            for (const form of pendingForms) {
                // Check if automation is paused for this conversation
                if (form.contact.conversation && !form.contact.conversation.isActive) {
                    continue;
                }

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

                if (!form.contact.email) continue;

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
                    workspaceId: rule.workspaceId,
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

        // 6. Voice no-answer retry handling
        if (isVapiConfigured()) {
            const retryCandidates = await prisma.voiceCall.findMany({
                where: {
                    direction: "OUTBOUND",
                    status: { in: ["NO_ANSWER", "BUSY"] },
                    endedAt: { lte: addHours(now, -4) },
                },
                include: {
                    contact: true,
                    workspace: { select: { name: true } },
                },
                orderBy: { endedAt: "asc" },
                take: 100,
            });

            for (const call of retryCandidates) {
                const metadata = parseVoiceMetadata(call.metadata);
                const retryHandled = metadata.retryHandled === true;
                const retryCount =
                    typeof metadata.retryCount === "number"
                        ? Math.max(0, Math.floor(metadata.retryCount))
                        : 0;

                const nextRetryAtRaw = metadata.nextRetryAt;
                const nextRetryAt =
                    typeof nextRetryAtRaw === "string" && nextRetryAtRaw
                        ? new Date(nextRetryAtRaw)
                        : null;

                if (retryHandled) continue;
                if (nextRetryAt && nextRetryAt > now) continue;

                const contactPhone =
                    (typeof metadata.contactPhone === "string" ? metadata.contactPhone : null) ||
                    call.contact?.phone ||
                    null;

                if (!contactPhone) {
                    metadata.retryHandled = true;
                    metadata.retrySkippedReason = "missing_contact_phone";

                    await prisma.voiceCall.update({
                        where: { id: call.id },
                        data: {
                            metadata: serializeVoiceMetadata(metadata),
                            outcome: "RETRY_SKIPPED",
                        },
                    });
                    continue;
                }

                if (retryCount >= 2) {
                    const smsSent = await sendSMS({
                        to: contactPhone,
                        body: "We tried calling about your appointment. Please call us back when convenient.",
                        workspaceId: call.workspaceId,
                    });

                    metadata.retryHandled = true;
                    metadata.smsFallbackSent = smsSent;
                    metadata.smsFallbackAt = now.toISOString();

                    await prisma.voiceCall.update({
                        where: { id: call.id },
                        data: {
                            metadata: serializeVoiceMetadata(metadata),
                            outcome: smsSent ? "SMS_FALLBACK_SENT" : "SMS_FALLBACK_FAILED",
                        },
                    });

                    results.push({
                        type: "VOICE_RETRY",
                        workspaceId: call.workspaceId,
                        status: smsSent ? "SUCCESS" : "FAILED",
                        details: `SMS fallback ${smsSent ? "sent" : "failed"} for call ${call.id}`,
                    });
                    continue;
                }

                const retryResult = await initiateOutboundCall({
                    phoneNumber: contactPhone,
                    workspaceId: call.workspaceId,
                    contactId: call.contactId || undefined,
                    contactName:
                        call.contact?.name ||
                        (typeof metadata.contactName === "string" ? metadata.contactName : undefined),
                    assistantId: call.assistantId || undefined,
                    metadata: {
                        ...metadata,
                        retryCount: retryCount + 1,
                        retryOfCallId: call.id,
                        retryAttempt: retryCount + 1,
                        nextRetryAt: null,
                    },
                });

                metadata.retryHandled = true;
                metadata.retryAttemptedAt = now.toISOString();

                await prisma.voiceCall.update({
                    where: { id: call.id },
                    data: {
                        metadata: serializeVoiceMetadata(metadata),
                        outcome: retryResult.success ? "RETRY_TRIGGERED" : "RETRY_FAILED",
                    },
                });

                if (retryResult.success && retryResult.callId) {
                    await prisma.voiceCall.create({
                        data: {
                            callSid: retryResult.callId,
                            direction: "OUTBOUND",
                            status: "INITIATED",
                            contactId: call.contactId || undefined,
                            workspaceId: call.workspaceId,
                            assistantId: call.assistantId,
                            outcome: "RETRY_INITIATED",
                            metadata: serializeVoiceMetadata({
                                ...metadata,
                                retryCount: retryCount + 1,
                                retryOfCallId: call.id,
                            }),
                        },
                    });
                }

                results.push({
                    type: "VOICE_RETRY",
                    workspaceId: call.workspaceId,
                    status: retryResult.success ? "SUCCESS" : "FAILED",
                    details: `Retry ${retryResult.success ? "triggered" : "failed"} for call ${call.id}`,
                });
            }
        }

        // 7. Voice recording retention cleanup (default 90 days)
        const retentionDays = Number.parseInt(process.env.VOICE_RECORDING_RETENTION_DAYS || "90", 10);
        const cutoff = addHours(now, -24 * retentionDays);

        const expiredCount = await prisma.voiceCall.count({
            where: {
                recordingUrl: { not: null },
                endedAt: { lte: cutoff },
            },
        });

        if (expiredCount > 0) {
            await prisma.voiceCall.updateMany({
                where: {
                    recordingUrl: { not: null },
                    endedAt: { lte: cutoff },
                },
                data: {
                    recordingUrl: null,
                },
            });

            results.push({
                type: "VOICE_RETENTION",
                workspaceId: "all",
                status: "SUCCESS",
                details: `Cleared recording URLs for ${expiredCount} calls older than ${retentionDays} days`,
            });
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
