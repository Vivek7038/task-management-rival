"use client";

import { useRef, useState } from "react";
import { Paperclip, Trash2, Upload, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttachmentsQuery, useUploadAttachment, useDeleteAttachment } from "@/lib/hooks/use-task-detail";
import type { Attachment } from "@/lib/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="size-4 shrink-0 text-blue-500" />;
  if (mimeType === "application/pdf") return <FileText className="size-4 shrink-0 text-red-500" />;
  return <File className="size-4 shrink-0 text-muted-foreground" />;
}

function AttachmentRow({
  attachment,
  taskId,
}: {
  attachment: Attachment;
  taskId: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteMutation = useDeleteAttachment(taskId);

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
        <AttachmentIcon mimeType={attachment.mimeType} />
        <a
          href={attachment.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate font-medium hover:underline"
        >
          {attachment.fileName}
        </a>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatBytes(attachment.sizeBytes)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete attachment"
          className="text-destructive hover:text-destructive shrink-0"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete attachment"
        description={`Delete "${attachment.fileName}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          deleteMutation.mutate(attachment.id, {
            onSuccess: () => setConfirmOpen(false),
          });
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

export function AttachmentsPanel({ taskId }: { taskId: string }) {
  const { data: attachments, isLoading } = useAttachmentsQuery(taskId);
  const uploadMutation = useUploadAttachment(taskId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Attachments</h3>
        {attachments && attachments.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{attachments.length} file{attachments.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <AttachmentRow key={att.id} attachment={att} taskId={taskId} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No attachments yet.</p>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center">
          Drag & drop or{" "}
          <button
            type="button"
            className="underline hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">Images, PDF, DOC, DOCX, TXT — max 5 MB</p>
        {uploadMutation.isPending && (
          <p className="text-xs text-primary animate-pulse">Uploading…</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
