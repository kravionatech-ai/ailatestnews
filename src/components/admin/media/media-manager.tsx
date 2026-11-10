"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react";
import { deleteMediaAction } from "@/actions/media";

export interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  size?: number;
  alt?: string;
  caption?: string;
  createdAt?: string | Date;
}

interface MediaManagerProps {
  initialItems: MediaItem[];
}

export function MediaManager({ initialItems }: MediaManagerProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy URL with visual confirmation
  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Upload handler for single or multiple files
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "ailatestnews");

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
        return data.media;
      });

      const newUploadedItems = await Promise.all(uploadPromises);
      setItems((prev) => [...newUploadedItems, ...prev]);
    } catch (err: any) {
      console.error("[Upload Error]:", err);
      setUploadError(err.message || "Failed to upload one or more files.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this media asset?")) return;

    setDeletingId(id);
    try {
      const res = await deleteMediaAction(id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item._id !== id));
      } else {
        alert(res.error || "Failed to delete item.");
      }
    } catch {
      alert("Error occurred while deleting asset.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter items
  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.filename.toLowerCase().includes(q) ||
      (item.alt && item.alt.toLowerCase().includes(q)) ||
      (item.format && item.format.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-[var(--color-heading)] tracking-tight flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[var(--accent)]" />
            Media &amp; CDN Asset Library
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1">
            Upload, manage, and copy CDN URLs for your articles, covers, and author photos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all self-start sm:self-auto cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Uploading Asset...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload New Images</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* ── Drag & Drop Upload Zone ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--border)] bg-[var(--color-card-background)] hover:border-[var(--accent)] hover:bg-[var(--color-secondary-surface)]/50 shadow-2xs"
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <p className="text-sm font-bold text-[var(--color-heading)]">
            {isUploading
              ? "Uploading to Cloudinary CDN..."
              : "Click to choose images or drag & drop here"}
          </p>
          <p className="text-xs text-[var(--color-muted-text)]">
            Supports PNG, JPG, WebP, AVIF, GIF, SVG (up to 10MB each)
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-muted-text)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media by filename or format..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] pl-9 pr-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>

        <span className="font-mono text-xs text-[var(--color-muted-text)]">
          Showing <strong className="text-[var(--color-heading)]">{filtered.length}</strong> of {items.length} assets
        </span>
      </div>

      {/* ── Media Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item._id}
            className="group rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-3 shadow-2xs hover:border-[var(--accent)]/60 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="aspect-video w-full rounded-lg bg-[var(--color-secondary-surface)] overflow-hidden relative border border-[var(--border)] mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt || item.filename}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <p className="font-bold text-xs text-[var(--color-heading)] truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted-text)]">
                  <span className="uppercase font-semibold text-[var(--color-body-text)]">
                    {item.format || "IMG"}
                  </span>
                  <span>{Math.round((item.size || 0) / 1024)} KB</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-1">
              {/* Copy URL */}
              <button
                type="button"
                onClick={() => handleCopy(item.url, item._id)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                  copiedId === item._id
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-[var(--color-secondary-surface)] text-[var(--color-heading)] hover:bg-[var(--color-main-background)]"
                }`}
                title="Copy CDN URL to Clipboard"
              >
                {copiedId === item._id ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                {/* View Original */}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-[var(--color-muted-text)] hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] transition-colors"
                  title="Open original image"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                {/* Delete */}
                <button
                  type="button"
                  disabled={deletingId === item._id}
                  onClick={() => handleDelete(item._id)}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete image"
                >
                  {deletingId === item._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--color-muted-text)] bg-[var(--color-card-background)]">
            <ImageIcon className="h-8 w-8 mx-auto text-[var(--color-muted-text)]/50 mb-2" />
            <p className="font-semibold text-[var(--color-heading)] mb-1">No media assets found</p>
            <p className="text-[var(--color-muted-text)]">
              Upload images using the button or dropzone above to start building your CDN library.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
