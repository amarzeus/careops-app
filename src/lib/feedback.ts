import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

/**
 * Initializes a feedback record and sends an SMS/Email to the contact.
 */
export async function sendFeedbackRequest(bookingId: string, workspaceId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, workspaceId },
    include: {
      contact: true,
      service: true,
      workspace: true,
    },
  });

  if (!booking || !booking.contact.phone) return;

  // Check if feedback already exists
  const existing = await prisma.feedback.findUnique({
    where: { bookingId },
  });

  if (existing) return;

  // Create empty feedback record (with unique token)
  const feedback = await prisma.feedback.create({
    data: {
      bookingId,
      contactId: booking.contactId,
      workspaceId,
      rating: 0, // 0 = unrated
    },
  });

  // Construct short feedback link
  const feedbackLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feedback/${feedback.token}`;

  const message = `Hi ${booking.contact.name}, thanks for visiting ${booking.workspace.name} for your ${booking.service.name}! Could you take 30 seconds to review us? ${feedbackLink}`;

  await sendSMS({
    to: booking.contact.phone,
    body: message,
    workspaceId,
  });
}
