import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, buildEmailTemplate } from "@/lib/email";

/**
 *
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const success = await sendEmail({
      to: user.email,
      subject: "Email Connection Test",
      html: buildEmailTemplate(
        "Email Connection Test",
        `<p>Hello ${user.name},</p><p>This is a test email to verify that your CareOps email notification system is correctly configured and working. If you can read this, the test was successful!</p>`,
        "Go to Dashboard",
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      ),
      workspaceId: user.workspaceId
    });

    if (!success) {
      return NextResponse.json(
        { error: "Email delivery failed. Checking your configuration and logs." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json(
      { error: `Email connection failed: ${message}` },
      { status: 500 }
    );
  }
}
