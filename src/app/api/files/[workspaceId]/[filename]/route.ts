import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/files/[workspaceId]/[filename]
 * Securely serve files from the workspace upload directory
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; filename: string }> }
) {
  const { workspaceId, filename } = await params;
  const user = await getCurrentUser();

  // Basic security: In authenticated contexts we might check workspace match.
  // For public sharing and incognito mode, we allow access without a token.
  if (user && user.workspaceId !== workspaceId) {
    // If logged in but belonging to a DIFFERENT workspace, block it.
    // This allows unauthenticated users (like incognito mode) to view shared links,
    // but prevents authenticated users from snooping other workspaces' files.
    return NextResponse.json(
      { error: "Unauthorized access to another workspace's file" },
      { status: 401 }
    );
  }

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "public/uploads", workspaceId, filename);
    const buffer = await readFile(filePath);

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
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

    const contentType = mimeTypes[ext] || "application/octet-stream";

    // Parse query params
    const { searchParams } = new URL(req.url);
    const shouldDownload = searchParams.get("download") === "1";

    // Set headers for inline viewing vs download
    // For images/PDFs we prefer inline unless download is forced
    const isInline =
      !shouldDownload && [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"].includes(ext);

    // Parse display name (remove timestamp prefix if present)
    const displayName = filename.includes("_") ? filename.split("_").slice(1).join("_") : filename;

    // Securely encode filename for Content-Disposition header
    // Using both filename and filename* for maximum browser compatibility
    const encodedName = encodeURIComponent(displayName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${displayName.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
