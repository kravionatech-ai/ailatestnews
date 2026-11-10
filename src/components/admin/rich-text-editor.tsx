"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Eye,
  Code2,
  Columns2,
  Sparkles,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Trash2,
  Upload,
  Loader2,
  FolderOpen,
} from "lucide-react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

type EditorMode = "visual" | "code" | "split";
type CalloutType = "info" | "warning" | "success" | "takeaway";
type ImageTabType = "upload" | "library" | "url";

interface MediaAsset {
  _id: string;
  filename: string;
  url: string;
  format?: string;
  size?: number;
  alt?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your editorial dispatch, analysis, or news story here...",
  minHeight = "480px",
}: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);

  // Image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState<ImageTabType>("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Media Library in Image modal
  const [libraryItems, setLibraryItems] = useState<MediaAsset[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Table modal
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Callout modal
  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [calloutType, setCalloutType] = useState<CalloutType>("takeaway");
  const [calloutTitle, setCalloutTitle] = useState("");
  const [calloutBody, setCalloutBody] = useState("");

  // Saved selection range for modal insertions
  const savedRangeRef = useRef<Range | null>(null);

  // References
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // Synchronize internal value with visual editor
  useEffect(() => {
    if (visualEditorRef.current && !isInternalUpdateRef.current) {
      if (visualEditorRef.current.innerHTML !== value) {
        visualEditorRef.current.innerHTML = value || "";
      }
    }
    isInternalUpdateRef.current = false;
  }, [value]);

  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      isInternalUpdateRef.current = true;
      const html = visualEditorRef.current.innerHTML;
      onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
    }
  }, [onChange]);

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (mode === "code") return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleVisualInput();
  };

  const insertHtmlAtCursor = (html: string) => {
    if (mode === "code") {
      onChange(value + "\n" + html);
      return;
    }

    visualEditorRef.current?.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML += html;
    }
    handleVisualInput();
  };

  // Upload direct file from device
  const handleDirectImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploadingImage(true);
    setImageUploadError("");

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

      setImageUrl(data.url);
      if (!imageAlt) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setImageAlt(cleanName);
      }
    } catch (err: any) {
      console.error("[Image Upload Error]:", err);
      setImageUploadError(err.message || "Failed to upload file.");
    } finally {
      setIsUploadingImage(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  // Fetch library items when opening library tab
  const loadMediaLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const res = await fetch("/api/admin/media?limit=24");
      const data = await res.json();
      if (data.success && data.items) {
        setLibraryItems(data.items);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    const targetAttr = linkTargetBlank ? ' target="_blank" rel="noopener noreferrer"' : "";
    const textToDisplay = linkText.trim() || linkUrl.trim();
    const html = `<a href="${linkUrl.trim()}"${targetAttr} class="text-[var(--accent)] underline">${textToDisplay}</a>`;
    insertHtmlAtCursor(html);

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    let html = `<figure class="my-6 text-center"><img src="${imageUrl.trim()}" alt="${imageAlt.trim()}" class="rounded-xl mx-auto max-w-full shadow-2xs border border-[var(--border)]" />`;
    if (imageCaption.trim()) {
      html += `<figcaption class="mt-2 text-xs text-[var(--color-muted-text)] font-mono italic">${imageCaption.trim()}</figcaption>`;
    }
    html += `</figure><p></p>`;

    insertHtmlAtCursor(html);
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
    setImageUploadError("");
  };

  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(15, tableRows));
    const cols = Math.max(1, Math.min(10, tableCols));

    let html = `<table class="w-full border-collapse my-6 text-sm border border-[var(--border)]"><thead><tr class="bg-[var(--color-secondary-surface)]">`;
    for (let c = 1; c <= cols; c++) {
      html += `<th class="border border-[var(--border)] p-2 font-bold text-left text-[var(--color-heading)]">Header ${c}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 1; r <= rows; r++) {
      html += `<tr class="${r % 2 === 0 ? "bg-[var(--color-secondary-surface)]/40" : ""}">`;
      for (let c = 1; c <= cols; c++) {
        html += `<td class="border border-[var(--border)] p-2 text-[var(--color-body-text)]">Data ${r}-${c}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p></p>`;

    insertHtmlAtCursor(html);
    setShowTableModal(false);
  };

  const handleInsertCallout = (e: React.FormEvent) => {
    e.preventDefault();
    const title = calloutTitle.trim() || "Key Takeaway";
    const body = calloutBody.trim() || "Primary source verified editorial note.";

    let styleClass = "callout-takeaway bg-purple-50 border-purple-200 text-purple-900";
    let iconLabel = "Sovereign Takeaway";

    if (calloutType === "info") {
      styleClass = "callout-info bg-blue-50 border-blue-200 text-blue-900";
      iconLabel = "Editorial Note";
    } else if (calloutType === "warning") {
      styleClass = "callout-warning bg-amber-50 border-amber-200 text-amber-900";
      iconLabel = "Critical Caveat";
    } else if (calloutType === "success") {
      styleClass = "callout-success bg-emerald-50 border-emerald-200 text-emerald-900";
      iconLabel = "Benchmark Verified";
    }

    const html = `<div class="callout-box ${styleClass} p-4 rounded-xl border my-6"><div class="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider mb-1.5"><span class="h-2 w-2 rounded-full bg-current"></span><span>${iconLabel}: ${title}</span></div><p class="text-xs sm:text-sm leading-relaxed">${body}</p></div><p></p>`;

    insertHtmlAtCursor(html);
    setShowCalloutModal(false);
    setCalloutTitle("");
    setCalloutBody("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        execCmd("bold");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        execCmd("italic");
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        execCmd("underline");
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        saveSelection();
        setShowLinkModal(true);
      }
    }
  };

  const cleanText = (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-2xs transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none flex flex-col" : "relative"
      }`}
    >
      {/* ── Top Header & Mode Bar ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--border)] bg-[var(--color-secondary-surface)] px-4 py-2.5 gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              mode === "visual"
                ? "bg-[#101820] dark:bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
            }`}
          >
            <Pilcrow className="h-3.5 w-3.5" />
            <span>Visual</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("code")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              mode === "code"
                ? "bg-[#101820] dark:bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>HTML Source</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("split")}
            className={`hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              mode === "split"
                ? "bg-[#101820] dark:bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Split Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[var(--color-muted-text)]">
            <span><strong className="text-[var(--color-heading)]">{wordCount}</strong> words</span>
            <span>·</span>
            <span><strong className="text-[var(--color-heading)]">{readingTime}</strong> min read</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-lg p-1.5 text-[var(--color-muted-text)] hover:bg-[var(--color-card-background)] hover:text-[var(--color-heading)] transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Formatting Toolbar (Active in Visual & Split modes) ── */}
      {mode !== "code" && (
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-[var(--color-body-text)]">
          {/* History */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("undo")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("redo")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* Heading Dropdown */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                execCmd("formatBlock", `<${val}>`);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-2 py-1 text-xs font-semibold text-[var(--color-heading)] outline-none hover:border-[var(--accent)] cursor-pointer"
          >
            <option value="" disabled>Heading Style</option>
            <option value="p">Paragraph / Normal</option>
            <option value="h2">Heading 2 (Main Section)</option>
            <option value="h3">Heading 3 (Subsection)</option>
            <option value="h4">Heading 4 (Minor Point)</option>
            <option value="blockquote">Quote Block</option>
            <option value="pre">Code Block</option>
          </select>

          <span className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* Inline Styles */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("bold")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("italic")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("underline")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("strikeThrough")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const sel = window.getSelection();
                if (sel && sel.toString()) {
                  insertHtmlAtCursor(`<code>${sel.toString()}</code>`);
                } else {
                  insertHtmlAtCursor(`<code>code</code>`);
                }
              }}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("insertUnorderedList")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("insertOrderedList")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<blockquote>")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor("<hr /><p></p>")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Divider Line"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("justifyLeft")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyCenter")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyRight")}
              className="rounded p-1.5 hover:bg-[var(--color-secondary-surface)] hover:text-[var(--color-heading)] cursor-pointer"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* Insert Media / Embeds */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowLinkModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-[var(--color-secondary-surface)] px-2 py-1 text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-main-background)] border border-[var(--border)] transition-colors cursor-pointer"
              title="Insert Hyperlink (Ctrl+K)"
            >
              <LinkIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Link</span>
            </button>

            {/* DIRECT IMAGE CHOOSER / MODAL */}
            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowImageModal(true);
                setImageTab("upload");
              }}
              className="flex items-center gap-1 rounded-md bg-[var(--accent-light)] px-2.5 py-1 text-xs font-bold text-[var(--accent)] hover:opacity-90 border border-[var(--accent)]/30 transition-colors cursor-pointer shadow-2xs"
              title="Upload or Choose Image"
            >
              <ImageIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>+ Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowTableModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-[var(--color-secondary-surface)] px-2 py-1 text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-main-background)] border border-[var(--border)] transition-colors cursor-pointer"
              title="Insert Comparison Table"
            >
              <TableIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowCalloutModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
              title="Insert Styled Callout Box"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>+ Callout</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Editor Canvas ── */}
      <div className={`relative ${isFullscreen ? "flex-1 overflow-auto" : ""}`}>
        {/* Visual Mode */}
        {mode === "visual" && (
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={handleVisualInput}
            onKeyDown={handleKeyDown}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className="prose-article dark:prose-invert max-w-none p-6 outline-none focus:outline-none text-[var(--color-body-text)] empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--color-muted-text)] empty:before:pointer-events-none"
          />
        )}

        {/* Raw HTML Code Mode */}
        {mode === "code" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            placeholder="Write or paste your raw HTML or markdown code here..."
            className="w-full p-6 font-mono text-xs leading-relaxed text-[var(--color-heading)] bg-[var(--color-main-background)] outline-none resize-y border-none"
          />
        )}

        {/* Split Preview Mode */}
        {mode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ minHeight }}
              placeholder="HTML source code..."
              className="w-full p-5 font-mono text-xs leading-relaxed text-[var(--color-heading)] bg-[var(--color-main-background)] outline-none resize-none"
            />
            <div
              style={{ minHeight }}
              className="prose-article dark:prose-invert max-w-none p-5 overflow-auto bg-[var(--color-card-background)] text-[var(--color-body-text)]"
              dangerouslySetInnerHTML={{
                __html: value || `<p class="text-[var(--color-muted-text)] italic">Live preview will appear here...</p>`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom Editor Status Bar ── */}
      <div className="flex flex-wrap items-center justify-between border-t border-[var(--border)] bg-[var(--color-secondary-surface)] px-4 py-2 text-xs text-[var(--color-muted-text)]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">
            {wordCount} words · {charCount} chars · ~{readingTime} min read
          </span>
          <span className="hidden sm:inline opacity-40">|</span>
          <span className="hidden sm:inline text-[11px] font-mono">
            Shortcuts: <strong>Ctrl+B</strong> Bold · <strong>Ctrl+I</strong> Italic · <strong>Ctrl+K</strong> Link
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Editor Active</span>
        </div>
      </div>

      {/* ── 1. Insert Link Modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-card-background)] p-6 shadow-xl border border-[var(--border)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h4 className="font-display font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[var(--accent)]" />
                <span>Insert Hyperlink</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Destination URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com or /blog/post-slug"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Read whitepaper"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[var(--color-body-text)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkTargetBlank}
                  onChange={(e) => setLinkTargetBlank(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>Open link in new tab (`target=&quot;_blank&quot;`)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] hover:bg-[var(--color-secondary-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--accent-hover)] cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. ADVANCED IMAGE CHOOSER / UPLOADER MODAL ── */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-card-background)] p-6 shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h4 className="font-display font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[var(--accent)]" />
                <span>Insert Editorial Image</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageUploadError("");
                }}
                className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Tabs: Direct Upload vs Library vs URL */}
            <div className="flex items-center gap-1 p-1 bg-[var(--color-secondary-surface)] rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  imageTab === "upload"
                    ? "bg-[var(--color-card-background)] text-[var(--color-heading)] shadow-2xs font-bold"
                    : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                }`}
              >
                Choose File from Device
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageTab("library");
                  loadMediaLibrary();
                }}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  imageTab === "library"
                    ? "bg-[var(--color-card-background)] text-[var(--color-heading)] shadow-2xs font-bold"
                    : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                }`}
              >
                Media Library
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  imageTab === "url"
                    ? "bg-[var(--color-card-background)] text-[var(--color-heading)] shadow-2xs font-bold"
                    : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                }`}
              >
                Paste Image URL
              </button>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-4">
              {/* TAB 1: Direct File Upload */}
              {imageTab === "upload" && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleDirectImageUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => imageFileInputRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                      isDraggingImage
                        ? "border-[var(--accent)] bg-[var(--accent-light)]"
                        : "border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectImageUpload(file);
                      }}
                      className="hidden"
                    />

                    <div className="space-y-2">
                      <div className="mx-auto h-10 w-10 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
                        {isUploadingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-[var(--color-heading)]">
                        {isUploadingImage
                          ? "Uploading to Cloudinary CDN..."
                          : "Click to choose image or drag & drop here"}
                      </p>
                      <p className="text-[10px] text-[var(--color-muted-text)]">
                        PNG, JPG, WebP, GIF, SVG up to 10MB
                      </p>
                    </div>
                  </div>

                  {imageUploadError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{imageUploadError}</p>
                  )}
                </div>
              )}

              {/* TAB 2: Media Library Picker */}
              {imageTab === "library" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-body-text)]">Select previously uploaded asset:</p>
                  {loadingLibrary ? (
                    <div className="flex items-center justify-center py-10 text-[var(--color-muted-text)]">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                    </div>
                  ) : libraryItems.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-[var(--border)] rounded-xl">
                      {libraryItems.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => {
                            setImageUrl(item.url);
                            if (item.alt) setImageAlt(item.alt);
                          }}
                          className={`relative aspect-video rounded-lg overflow-hidden border p-0.5 text-left cursor-pointer transition-all ${
                            imageUrl === item.url
                              ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                              : "border-[var(--border)] hover:border-[var(--color-muted-text)]"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.alt || item.filename}
                            className="w-full h-full object-cover rounded"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[var(--color-muted-text)] border border-dashed border-[var(--border)] rounded-xl">
                      No assets found. Use &ldquo;Choose File from Device&rdquo; tab to upload.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Paste External URL */}
              {imageTab === "url" && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {/* Live Preview of Selected Image */}
              {imageUrl && (
                <div className="p-3 bg-emerald-500/15 rounded-xl border border-emerald-500/30 flex items-center gap-3">
                  <div className="h-14 w-20 rounded-lg overflow-hidden border border-emerald-500/40 bg-[var(--color-card-background)] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Ready to Insert</span>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--color-muted-text)] truncate mt-0.5">{imageUrl}</p>
                  </div>
                </div>
              )}

              {/* Alt Text (SEO Essential) */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Image Alt Text <span className="text-[var(--color-muted-text)] font-normal">(for SEO &amp; screen readers)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DeepSeek-R1 Architecture benchmark chart"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Editorial Caption <span className="text-[var(--color-muted-text)] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Source: DeepSeek AI Technical Disclosure Paper, Jan 2026."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] hover:bg-[var(--color-secondary-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!imageUrl || isUploadingImage}
                  className="rounded-lg bg-[var(--accent)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  Insert Image into Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Insert Table Modal ── */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-card-background)] p-6 shadow-xl border border-[var(--border)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h4 className="font-display font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-[var(--accent)]" />
                <span>Insert Comparison Table</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertTable} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                    Rows (1 - 15)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value, 10) || 3)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                    Columns (1 - 10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value, 10) || 3)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] hover:bg-[var(--color-secondary-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--accent-hover)] cursor-pointer"
                >
                  Insert Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. Insert Callout Modal ── */}
      {showCalloutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-card-background)] p-6 shadow-xl border border-[var(--border)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h4 className="font-display font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span>Insert Editorial Callout Box</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertCallout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Callout Flavor
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCalloutType("takeaway")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      calloutType === "takeaway"
                        ? "border-purple-600 bg-purple-500/15 text-purple-800 dark:text-purple-300 shadow-2xs"
                        : "border-[var(--border)] text-[var(--color-body-text)] hover:bg-[var(--color-secondary-surface)]"
                    }`}
                  >
                    🚀 Sovereign Takeaway
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalloutType("info")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      calloutType === "info"
                        ? "border-blue-600 bg-blue-500/15 text-blue-800 dark:text-blue-300 shadow-2xs"
                        : "border-[var(--border)] text-[var(--color-body-text)] hover:bg-[var(--color-secondary-surface)]"
                    }`}
                  >
                    💡 Editorial Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalloutType("warning")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      calloutType === "warning"
                        ? "border-amber-600 bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-2xs"
                        : "border-[var(--border)] text-[var(--color-body-text)] hover:bg-[var(--color-secondary-surface)]"
                    }`}
                  >
                    ⚠️ Caveat / Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalloutType("success")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      calloutType === "success"
                        ? "border-emerald-600 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                        : "border-[var(--border)] text-[var(--color-body-text)] hover:bg-[var(--color-secondary-surface)]"
                    }`}
                  >
                    ✅ Verified Benchmark
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Headline Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10x Lower Token Inference Cost"
                  value={calloutTitle}
                  onChange={(e) => setCalloutTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-body-text)] mb-1">
                  Body Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. By utilizing MLA (Multi-Head Latent Attention), the KV-cache footprint is reduced from 120GB to 13GB."
                  value={calloutBody}
                  onChange={(e) => setCalloutBody(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalloutModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] hover:bg-[var(--color-secondary-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--accent-hover)] cursor-pointer"
                >
                  Insert Callout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
