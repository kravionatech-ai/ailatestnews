"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Search,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { MediaItem } from "@/components/admin/media/media-manager";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaItem) => void;
  title?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select or Upload Image",
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media library
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/admin/media?limit=48")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.items) {
            setItems(data.items);
          }
        })
        .catch((err) => console.error("Failed to load media:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Handle direct file upload inside modal
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ailatestnews");

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image.");
      }

      const uploadedMedia: MediaItem = data.media;
      setItems((prev) => [uploadedMedia, ...prev]);
      setSelectedUrl(uploadedMedia.url);
      setSelectedItem(uploadedMedia);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.filename.toLowerCase().includes(q) ||
      (item.alt && item.alt.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-4xl rounded-2xl bg-[var(--color-card-background)] shadow-2xl border border-[var(--border)] flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--color-secondary-surface)]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--color-heading)]">{title}</h3>
              <p className="text-[11px] text-[var(--color-muted-text)]">
                Choose from your Cloudinary library or upload directly from your device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-muted-text)] hover:bg-[var(--color-card-background)] hover:text-[var(--color-heading)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Upload Button + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--color-card-background)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose Image File</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-muted-text)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Area / Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-text)]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mb-2" />
              <p className="text-xs font-medium">Loading media assets...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      setSelectedUrl(item.url);
                      setSelectedItem(item);
                    }}
                    className={`group relative rounded-xl border p-2 text-left transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                      isSelected
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/25 bg-[var(--accent-light)]/40"
                        : "border-[var(--border)] bg-[var(--color-card-background)] hover:border-[var(--color-muted-text)]"
                    }`}
                  >
                    <div>
                      <div className="aspect-video w-full rounded-lg bg-[var(--color-secondary-surface)] overflow-hidden relative border border-[var(--border)] mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.alt || item.filename}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="font-bold text-[11px] text-[var(--color-heading)] truncate" title={item.filename}>
                        {item.filename}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[var(--color-muted-text)]">
                      <span className="uppercase">{item.format || "IMG"}</span>
                      <span>{Math.round((item.size || 0) / 1024)} KB</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-[var(--color-muted-text)]">
              <ImageIcon className="h-8 w-8 mx-auto text-[var(--color-muted-text)]/50 mb-2" />
              <p className="font-semibold text-xs text-[var(--color-heading)]">No images in library</p>
              <p className="text-[11px] text-[var(--color-muted-text)] mt-1">
                Click &ldquo;Choose Image File&rdquo; above to upload your first image.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-[var(--border)] bg-[var(--color-secondary-surface)] px-6 py-3 gap-3">
          <div className="flex-1 min-w-[200px]">
            {selectedUrl ? (
              <p className="font-mono text-xs text-[var(--color-muted-text)] truncate">
                Selected: <span className="font-semibold text-[var(--accent)]">{selectedUrl}</span>
              </p>
            ) : (
              <p className="text-xs text-[var(--color-muted-text)]">Click any image to select</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] hover:bg-[var(--color-card-background)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={() => {
                if (selectedUrl) {
                  onSelect(selectedUrl, selectedItem || undefined);
                  onClose();
                }
              }}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              Apply Selected Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
