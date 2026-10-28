"use client";

import { useState } from "react";
import {
  Mail,
  MailOpen,
  Trash2,
  CheckCircle2,
  Archive,
  Clock,
  Send,
  MessageSquare,
} from "lucide-react";
import { updateContactMessageStatusAction, deleteContactMessageAction } from "@/actions/contact";
import { formatDate } from "@/lib/utils";

interface ContactMessageItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  createdAt: string;
}

export function MessagesManager({ initialMessages }: { initialMessages: ContactMessageItem[] }) {
  const [messages, setMessages] = useState<ContactMessageItem[]>(initialMessages);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "replied" | "archived">("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(
    initialMessages[0] || null
  );

  const filtered = messages.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  const handleStatusChange = async (
    id: string,
    newStatus: "unread" | "read" | "replied" | "archived"
  ) => {
    const res = await updateContactMessageStatusAction(id, newStatus);
    if (res.success) {
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: newStatus } : m))
      );
      if (selectedMessage?._id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    const res = await deleteContactMessageAction(id);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selectedMessage?._id === id) {
        setSelectedMessage(null);
      }
    }
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Inquiries ({messages.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === "unread"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("replied")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === "replied"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Replied
          </button>
          <button
            onClick={() => setFilter("archived")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === "archived"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Two Column Layout: Message List + Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-white divide-y divide-[var(--border)] overflow-hidden shadow-2xs max-h-[700px] overflow-y-auto">
          {filtered.map((msg) => {
            const isSelected = selectedMessage?._id === msg._id;
            return (
              <div
                key={msg._id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (msg.status === "unread") {
                    handleStatusChange(msg._id, "read");
                  }
                }}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-indigo-50/70 border-l-4 border-indigo-600"
                    : msg.status === "unread"
                    ? "bg-white font-bold"
                    : "bg-slate-50/30 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[var(--foreground)] truncate max-w-[180px]">
                    {msg.name}
                  </span>
                  <span className="text-[10px] text-[var(--foreground-muted)]">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                  {msg.subject}
                </h4>
                <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-2 mt-1">
                  {msg.message}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      msg.status === "unread"
                        ? "bg-amber-100 text-amber-800"
                        : msg.status === "replied"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-12 text-center text-xs text-[var(--foreground-muted)]">
              No inquiries match this filter.
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs">
          {selectedMessage ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {selectedMessage.subject}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {selectedMessage.name}
                    </span>
                    <span>&lt;{selectedMessage.email}&gt;</span>
                    <span>•</span>
                    <span>{formatDate(selectedMessage.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedMessage._id,
                        selectedMessage.status === "replied" ? "read" : "replied"
                      )
                    }
                    className="p-2 rounded-xl border border-[var(--border)] hover:bg-slate-50 text-xs text-emerald-600 transition-colors"
                    title="Toggle Replied"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedMessage._id,
                        selectedMessage.status === "archived" ? "read" : "archived"
                      )
                    }
                    className="p-2 rounded-xl border border-[var(--border)] hover:bg-slate-50 text-xs text-slate-600 transition-colors"
                    title="Archive Message"
                  >
                    <Archive className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs text-rose-600 transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="prose prose-sm text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap bg-[var(--background-secondary)] p-6 rounded-2xl border border-[var(--border)]">
                {selectedMessage.message}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  onClick={() => handleStatusChange(selectedMessage._id, "replied")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" /> Reply via Email Client
                </a>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-[var(--foreground-muted)] space-y-2">
              <MailOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-semibold">No message selected</p>
              <p>Select an inquiry from the inbox list to read full context.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
