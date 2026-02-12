import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendEmail, buildEmailTemplate } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Return success even if user not found (security: don't reveal user existence)
      return NextResponse.json({ 
        message: "If an account exists with this email, a password reset link has been sent." 
      });
    }

    // Generate a temporary password
    const tempPassword = uuidv4().slice(0, 12);
    const hashedPassword = await hashPassword(tempPassword);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Send reset email with temporary password
    const emailSent = await sendEmail({
      to: email,
      subject: "CareOps Password Reset",
      html: buildEmailTemplate(
        "Password Reset",
        `<p>Hi ${user.name},</p>
         <p>Your password has been reset. Here is your temporary password:</p>
         <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
           <code style="font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px;">${tempPassword}</code>
         </div>
         <p>Please log in with this temporary password and change it immediately from Settings &gt; Security.</p>
         <p style="color: #6b7280; font-size: 12px;">If you did not request this reset, please contact support immediately.</p>`
      ),
    });

    if (!emailSent) {
      console.error("Failed to send password reset email to", email);
    }

    return NextResponse.json({ 
      message: "If an account exists with this email, a password reset link has been sent." 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
