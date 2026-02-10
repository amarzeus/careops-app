import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const form = await prisma.intakeForm.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      fields: true,
      isActive: true,
    },
  });

  if (!form || !form.isActive)
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  return NextResponse.json({ form });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data, submissionId } = await req.json();

    if (submissionId) {
      // Update existing submission
      const submission = await prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          data: JSON.stringify(data),
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, submission });
    }

    // Create new submission
    const form = await prisma.intakeForm.findUnique({ where: { slug } });
    if (!form)
      return NextResponse.json({ error: "Form not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
