"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, File, Download, X, Eye, Loader2 } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface UploadedFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface FileDisplayProps {
  files: UploadedFile[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
}

/**
 *
 */
function getFileIcon(mimeType: string | undefined, fileName: string) {
  if (!mimeType) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
      return ImageIcon;
    }
    if (ext === "pdf") return FileText;
    return File;
  }

  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

/**
 *
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 *
 */
function isImage(mimeType: string | undefined, fileName: string): boolean {
  if (!mimeType) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "");
  }
  return mimeType.startsWith("image/");
}

/**
 *
 */
export function FileDisplay({ files, onRemove, readOnly = false }: FileDisplayProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (files.length === 0) {
    return null;
  }

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  return (
    <>
      <div className="space-y-2">
        {files.map((file, index) => {
          const FileIcon = getFileIcon(file.type, file.name);
          const isImageFile = isImage(file.type, file.name);

          return (
            <div
              key={index}
              className="bg-card text-card-foreground flex items-center justify-between rounded-md border p-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isImageFile ? (
                  <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                    <NextImage
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded">
                    <FileIcon className="text-muted-foreground h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  {file.size && (
                    <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1">
                {isImageFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreview(file.url)}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(file.url, file.name)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!readOnly && onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive h-8 w-8"
                    onClick={() => onRemove(index)}
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm">{previewUrl?.split("/").pop()}</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-[200px] items-center justify-center p-4 pt-0">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin" />}
            {previewUrl && (
              <div className="relative h-[70vh] w-full">
                <NextImage
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact file upload button with inline file list
 */
interface FileUploaderProps {
  files: UploadedFile[];
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (index: number) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

/**
 *
 */
export function FileUploader({
  files,
  onUpload,
  onRemove,
  accept = "image/*,.pdf,.doc,.docx",
  maxSize = 10 * 1024 * 1024,
  disabled = false,
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Validate size
    for (const file of Array.from(fileList)) {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
        return;
      }
    }

    setIsUploading(true);
    try {
      await onUpload(fileList);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            multiple
            disabled={disabled || isUploading}
            className="hidden"
          />
          <span className="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Files"
            )}
          </span>
        </label>
        {files.length > 0 && (
          <span className="text-muted-foreground text-xs">{files.length} file(s)</span>
        )}
      </div>

      <FileDisplay files={files} onRemove={!disabled ? onRemove : undefined} />
    </div>
  );
}
