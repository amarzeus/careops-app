"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Upload,
  FolderOpen,
  Loader2,
  Eye,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";

interface FileItem {
  name: string;
  displayName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

/**
 *
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 *
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 *
 */
const getFileIcon = (type: string, _name: string) => {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  return File;
};

/**
 *
 */
function isImage(type: string): boolean {
  return type.startsWith("image/");
}

/**
 *
 */
export default function FilesPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;

    setDeleting(filename);
    try {
      const res = await fetch(`/api/files?file=${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFiles(files.filter((f) => f.name !== filename));
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    // Ensure the URL has the download flag and encoding is correct
    link.href = `${url}${url.includes("?") ? "&" : "?"}download=1`;
    link.download = name;
    // Removing target="_blank" as it can sometimes prevent the download attribute from working
    // for same-origin dynamic routes in some browsers
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (file: FileItem) => {
    const fullUrl = `${window.location.origin}${file.url}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Link copied to clipboard",
      description: "Anyone in your workspace can access this file via the link.",
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setUploading(false);
    setUploadDialogOpen(false);

    if (successCount > 0) {
      fetchFiles();
    }

    if (errorCount > 0) {
      alert(`Uploaded ${successCount} files. ${errorCount} failed.`);
    }

    // Reset input
    e.target.value = "";
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Files" subtitle="Manage your uploaded files and documents">
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </Header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {files.filter((f) => f.type.startsWith("image/")).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No files yet</h3>
              <p className="text-muted-foreground mb-4">Upload files to get started</p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type, file.name);
              const isImg = isImage(file.type);

              return (
                <Card key={file.name} className="overflow-hidden">
                  {isImg && (
                    <div className="bg-muted relative flex h-40 items-center justify-center overflow-hidden">
                      <NextImage
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {!isImg && (
                        <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded">
                          <FileIcon className="text-muted-foreground h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" title={file.displayName || file.name}>
                          {file.displayName || file.name}
                        </p>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {isImg && (
                        <Button variant="outline" size="sm" onClick={() => setPreviewFile(file)}>
                          <Eye className="mr-1 h-3 w-3" />
                          Preview
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.url, file.displayName || file.name)}
                      >
                        <Download className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleShare(file)}>
                        <Share2 className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleDelete(file.name)}
                        disabled={deleting === file.name}
                      >
                        {deleting === file.name ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.csv"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="hover:border-primary rounded-lg border-2 border-dashed p-8 text-center transition-colors">
                  {uploading ? (
                    <>
                      <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                      <p>Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                      <p className="font-medium">Click to upload files</p>
                      <p className="text-muted-foreground text-sm">
                        Images, PDFs, Word docs, CSV (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-h-[90vh] max-w-4xl p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="truncate text-sm">{previewFile?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex min-h-[200px] items-center justify-center p-4 pt-0">
              {previewFile && (
                <div className="relative h-[70vh] w-full">
                  <NextImage
                    src={previewFile.url}
                    alt={previewFile.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="p-4 pt-0">
              <Button
                variant="outline"
                onClick={() => previewFile && handleDownload(previewFile.url, previewFile.name)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
