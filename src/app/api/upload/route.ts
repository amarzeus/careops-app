import { NextResponse } from "next/server";
import { writeFile, mkdir, access, readdir, unlink } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".csv",
  ".doc",
  ".docx",
];

/**
 * POST /api/upload
 * Upload a file to local storage
 * - Requires OWNER role
 * - Validates file type and size
 * - Organizes files by workspace
 * - Uses secure filename generation
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!user.workspaceId) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type.toLowerCase();
    const fileExtension = path.extname(file.name).toLowerCase();

    if (!ALLOWED_TYPES.includes(fileType) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed types: jpg, png, webp, gif, pdf, csv, doc, docx" },
        { status: 400 }
      );
    }

    // Generate secure filename: {timestamp}-{uuid}{extension}
    const timestamp = Date.now();
    const uuid = crypto.randomUUID().slice(0, 8);
    const safeFilename = `${timestamp}-${uuid}${fileExtension}`;

    // Workspace-based directory for isolation
    const uploadDir = path.join(process.cwd(), "public/uploads", user.workspaceId);

    // Create workspace directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    // Return public URL
    const url = `/uploads/${user.workspaceId}/${safeFilename}`;

    // Log upload to database for audit trail
    try {
      await prisma.integrationLog.create({
        data: {
          type: "FILE_UPLOAD",
          status: "SUCCESS",
          message: `Uploaded: ${file.name} -> ${safeFilename}`,
          workspaceId: user.workspaceId,
        },
      });
    } catch {
      // Don't fail upload if logging fails
    }

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/upload
 * Clean up old test files (admin only)
 * Could be called periodically to remove test uploads
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const daysOld = parseInt(searchParams.get("days") || "7", 10);
    const workspaceId = searchParams.get("workspace");

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    const targetDir = workspaceId ? path.join(uploadsDir, workspaceId) : uploadsDir;

    let deletedCount = 0;
    let deletedSize = 0;

    try {
      await access(targetDir);
      const files = await readdir(targetDir);
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(targetDir, file);
        const stats = await import("fs/promises").then((fs) => fs.stat(filePath));

        // Delete files older than cutoff that look like test files
        if (stats.mtimeMs < cutoffTime && file.includes("test")) {
          await unlink(filePath);
          deletedCount++;
          deletedSize += stats.size;
        }
      }
    } catch {
      // Directory doesn't exist, nothing to clean
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      deletedSize: `${(deletedSize / 1024).toFixed(2)} KB`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
