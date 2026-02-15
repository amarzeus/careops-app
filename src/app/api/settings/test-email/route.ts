import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import nodemailer from "nodemailer";

/**
 *
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    return NextResponse.json({ success: true, message: "Email connection verified" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json(
      { error: `Email connection failed: ${message}` },
      { status: 500 }
    );
  }
}
