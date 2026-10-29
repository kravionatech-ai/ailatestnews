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
} from "lucide-react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

type EditorMode = "visual" | "code" | "split";
type CalloutType = "info" | "warning" | "success" | "takeaway";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your editorial dispatch, analysis, or news story here...",
  minHeight = "480px",
}: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal dialog states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [calloutType, setCalloutType] = useState<CalloutType>("takeaway");
  const [calloutTitle, setCalloutTitle] = useState("");
  const [calloutBody, setCalloutBody] = useState("");

  // Saved selection range for modal insertions
  const savedRangeRef = useRef<Range | null>(null);

  // References
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);

  // Save selection before modal opens
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore selection when inserting from modal
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

  // Handle content changes from visual editor
  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      isInternalUpdateRef.current = true;
      const html = visualEditorRef.current.innerHTML;
      onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
    }
  }, [onChange]);

  // Execute standard document command
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (mode === "code") return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleVisualInput();
  };

  // Custom insertion at cursor
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

  // Modal Submit Handlers
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    const targetAttr = linkTargetBlank ? ' target="_blank" rel="noopener noreferrer"' : "";
    const textToDisplay = linkText.trim() || linkUrl.trim();
    const html = `<a href="${linkUrl.trim()}"${targetAttr} class="text-indigo-600 underline">${textToDisplay}</a>`;
    insertHtmlAtCursor(html);

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    let html = `<figure class="my-6 text-center"><img src="${imageUrl.trim()}" alt="${imageAlt.trim()}" class="rounded-xl mx-auto max-w-full shadow-2xs border border-slate-200" />`;
    if (imageCaption.trim()) {
      html += `<figcaption class="mt-2 text-xs text-slate-500 font-mono italic">${imageCaption.trim()}</figcaption>`;
    }
    html += `</figure><p></p>`;

    insertHtmlAtCursor(html);
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
  };

  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(15, tableRows));
    const cols = Math.max(1, Math.min(10, tableCols));

    let html = `<table class="w-full border-collapse my-6 text-sm border border-slate-200"><thead><tr class="bg-slate-100">`;
    for (let c = 1; c <= cols; c++) {
      html += `<th class="border border-slate-200 p-2 font-bold text-left text-slate-900">Header ${c}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 1; r <= rows; r++) {
      html += `<tr class="${r % 2 === 0 ? "bg-slate-50/50" : ""}">`;
      for (let c = 1; c <= cols; c++) {
        html += `<td class="border border-slate-200 p-2 text-slate-700">Data ${r}-${c}</td>`;
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

  // Keyboard shortcut listener
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

  // Word & character stats
  const cleanText = (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-2xs transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none flex flex-col" : "relative"
      }`}
    >
      {/* ── Top Header & Mode Bar ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 gap-2">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "visual"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Pilcrow className="h-3.5 w-3.5" />
            <span>Visual</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("code")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "code"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>HTML Source</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("split")}
            className={`hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "split"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Split Preview</span>
          </button>
        </div>

        {/* Right: Fullscreen & Live Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span><strong>{wordCount}</strong> words</span>
            <span>·</span>
            <span><strong>{readingTime}</strong> min read</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Formatting Toolbar (Active in Visual & Split modes) ── */}
      {mode !== "code" && (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-2 text-slate-700">
          {/* History */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("undo")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("redo")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-slate-200 mx-1" />

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
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
          >
            <option value="" disabled>
              Heading Style
            </option>
            <option value="p">Paragraph / Normal</option>
            <option value="h2">Heading 2 (Main Section)</option>
            <option value="h3">Heading 3 (Subsection)</option>
            <option value="h4">Heading 4 (Minor Point)</option>
            <option value="blockquote">Quote Block</option>
            <option value="pre">Code Block</option>
          </select>

          <span className="h-4 w-px bg-slate-200 mx-1" />

          {/* Inline Styles */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("bold")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("italic")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("underline")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("strikeThrough")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
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
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-slate-200 mx-1" />

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("insertUnorderedList")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("insertOrderedList")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<blockquote>")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor("<hr /><p></p>")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Divider Line"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-slate-200 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCmd("justifyLeft")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyCenter")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyRight")}
              className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-slate-200 mx-1" />

          {/* Insert Media / Embeds */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowLinkModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Insert Hyperlink (Ctrl+K)"
            >
              <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />
              <span>Link</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowImageModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Insert Editorial Image"
            >
              <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowTableModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Insert Benchmark Table"
            >
              <TableIcon className="h-3.5 w-3.5 text-indigo-600" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveSelection();
                setShowCalloutModal(true);
              }}
              className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              title="Insert Styled Callout Box"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
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
            className="prose-article prose-slate max-w-none p-6 outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
          />
        )}

        {/* Raw HTML Code Mode */}
        {mode === "code" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            placeholder="Write or paste your raw HTML or markdown code here..."
            className="w-full p-6 font-mono text-xs leading-relaxed text-slate-800 bg-slate-50/50 outline-none resize-y border-none"
          />
        )}

        {/* Split Preview Mode */}
        {mode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ minHeight }}
              placeholder="HTML source code..."
              className="w-full p-5 font-mono text-xs leading-relaxed text-slate-800 bg-slate-50/50 outline-none resize-none"
            />
            <div
              style={{ minHeight }}
              className="prose-article prose-slate max-w-none p-5 overflow-auto bg-white"
              dangerouslySetInnerHTML={{
                __html: value || `<p class="text-slate-400 italic">Live preview will appear here...</p>`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom Editor Status Bar ── */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">
            {wordCount} words · {charCount} chars · ~{readingTime} min read
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
            Shortcuts: <strong>Ctrl+B</strong> Bold · <strong>Ctrl+I</strong> Italic · <strong>Ctrl+K</strong> Link
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-600 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Editor Active</span>
        </div>
      </div>

      {/* ── 1. Insert Link Modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-indigo-600" />
                <span>Insert Hyperlink</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com or /blog/post-slug"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Read whitepaper"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkTargetBlank}
                  onChange={(e) => setLinkTargetBlank(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Open link in new tab (`target=&quot;_blank&quot;`)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Insert Image Modal ── */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                <span>Insert Editorial Image</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL (Cloudinary / Unsplash / Web) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descriptive Alt Text (for SEO & Accessibility)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DeepSeek V3 Multi-Head Latent Attention Architecture diagram"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Editorial Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Source: DeepSeek AI Technical Disclosure Paper, Jan 2026."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Insert Table Modal ── */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-indigo-600" />
                <span>Insert Comparison Table</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertTable} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rows (1 - 15)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value, 10) || 3)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columns (1 - 10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value, 10) || 3)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>Insert Editorial Callout Box</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInsertCallout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Callout Flavor
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCalloutType("takeaway")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                      calloutType === "takeaway"
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-2xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    🚀 Sovereign Takeaway
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalloutType("info")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                      calloutType === "info"
                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-2xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    💡 Editorial Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalloutType("warning")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                      calloutType === "warning"
                        ? "border-amber-600 bg-amber-50 text-amber-900 shadow-2xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ⚠️ Caveat / Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalloutType("success")}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                      calloutType === "success"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ✅ Verified Benchmark
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headline Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10x Lower Token Inference Cost"
                  value={calloutTitle}
                  onChange={(e) => setCalloutTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Body Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. By utilizing MLA (Multi-Head Latent Attention), the KV-cache footprint is reduced from 120GB to 13GB."
                  value={calloutBody}
                  onChange={(e) => setCalloutBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalloutModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
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
