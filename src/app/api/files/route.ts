import { NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/files
 * List all uploaded files for the workspace
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const uploadDir = path.join(process.cwd(), "public/uploads", user.workspaceId);

    let files: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
      uploadedAt: string;
    }> = [];

    try {
      const fileList = await readdir(uploadDir);

      for (const filename of fileList) {
        // Skip non-files
        if (filename.startsWith(".")) continue;

        const filePath = path.join(uploadDir, filename);
        const stats = await stat(filePath);

        if (stats.isFile()) {
          // Determine type from extension
          const ext = path.extname(filename).toLowerCase();
          let type = "application/octet-stream";

          const mimeTypes: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".csv": "text/csv",
          };

          if (ext in mimeTypes) {
            type = mimeTypes[ext];
          } else if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
            type = "image/" + ext.slice(1);
          }

          // Determine display name (strip timestamp prefix)
          const displayName = filename.includes("_")
            ? filename.split("_").slice(1).join("_")
            : filename;

          files.push({
            name: filename,
            displayName: displayName,
            url: `/api/files/${user.workspaceId}/${filename}`,
            size: stats.size,
            type,
            uploadedAt: stats.mtime.toISOString(),
          });
        }
      }
    } catch {
      // Directory doesn't exist - no files yet
      files = [];
    }

    // Sort by upload date, newest first
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

/**
 * DELETE /api/files
 * Delete a specific file
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public/uploads", user.workspaceId, filename);

    try {
      await unlink(filePath);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
