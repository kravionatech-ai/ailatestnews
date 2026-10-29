"use client";

import { useState } from "react";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Mail,
  Shield,
  FileText,
} from "lucide-react";
import { TwitterIcon, GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { createAuthorAction, updateAuthorAction, deleteAuthorAction } from "@/actions/authors";
import { SeoEditorPanel } from "@/components/admin/seo/seo-editor-panel";
import type { ISeoMetadata } from "@/lib/seo/types";
import { slugify } from "@/lib/utils";

interface AuthorItem {
  _id: string;
  name: string;
  email: string;
  slug: string;
  role: string;
  bio?: string;
  image?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    youtube?: string;
  };
  seo?: ISeoMetadata;
  postCount: number;
}

export function AuthorsManager({ initialAuthors }: { initialAuthors: AuthorItem[] }) {
  const [authors, setAuthors] = useState<AuthorItem[]>(initialAuthors);
  const [editingAuthor, setEditingAuthor] = useState<AuthorItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "seo">("general");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [role, setRole] = useState("author");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [seo, setSeo] = useState<ISeoMetadata>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const openCreate = () => {
    setName("");
    setEmail("");
    setSlug("");
    setRole("author");
    setBio("");
    setImage("");
    setWebsite("");
    setTwitter("");
    setGithub("");
    setLinkedin("");
    setSeo({
      schemaType: "ProfilePage",
      robots: { index: true, follow: true, maxImagePreview: "large" },
      sitemap: { include: true, priority: 0.6, changefreq: "monthly" },
    });
    setEditingAuthor(null);
    setIsCreating(true);
    setActiveTab("general");
    setFeedback(null);
  };

  const openEdit = (author: AuthorItem) => {
    setEditingAuthor(author);
    setName(author.name);
    setEmail(author.email);
    setSlug(author.slug);
    setRole(author.role);
    setBio(author.bio || "");
    setImage(author.image || "");
    setWebsite(author.website || "");
    setTwitter(author.socialLinks?.twitter || "");
    setGithub(author.socialLinks?.github || "");
    setLinkedin(author.socialLinks?.linkedin || "");
    setSeo(
      author.seo || {
        metaTitle: `${author.name} | AI Author`,
        metaDescription: author.bio || "",
        schemaType: "ProfilePage",
        robots: { index: true, follow: true, maxImagePreview: "large" },
        sitemap: { include: true, priority: 0.6, changefreq: "monthly" },
      }
    );
    setIsCreating(false);
    setActiveTab("general");
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("slug", slug || slugify(name));
    fd.append("role", role);
    fd.append("bio", bio);
    fd.append("image", image);
    fd.append("website", website);
    fd.append("twitter", twitter);
    fd.append("github", github);
    fd.append("linkedin", linkedin);
    fd.append("seo", JSON.stringify(seo));

    try {
      if (editingAuthor) {
        const res = await updateAuthorAction(editingAuthor._id, fd);
        if (res.success) {
          setAuthors((prev) =>
            prev.map((a) =>
              a._id === editingAuthor._id ? { ...a, ...res.user, postCount: a.postCount } : a
            )
          );
          setFeedback({ type: "success", text: "Author profile updated successfully!" });
          setTimeout(() => {
            setEditingAuthor(null);
          }, 600);
        } else {
          setFeedback({ type: "error", text: res.error || "Failed to update author" });
        }
      } else {
        const res = await createAuthorAction(fd);
        if (res.success) {
          setAuthors((prev) => [...prev, { ...res.user, postCount: 0 }]);
          setFeedback({ type: "success", text: "Author created successfully!" });
          setTimeout(() => {
            setIsCreating(false);
          }, 600);
        } else {
          setFeedback({ type: "error", text: res.error || "Failed to create author" });
        }
      }
    } catch {
      setFeedback({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this author?")) return;
    const res = await deleteAuthorAction(id);
    if (res.success) {
      setAuthors((prev) => prev.filter((a) => a._id !== id));
    } else {
      alert(res.error || "Failed to delete author");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Active Authors &amp; Editorial Contributors ({authors.length})
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Manage author bios, portraits, credentials, social profiles, and author-page SEO.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" /> Add New Author
        </button>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authors.map((author) => (
          <div
            key={author._id}
            className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {author.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.image}
                      alt={author.name}
                      className="h-12 w-12 rounded-full object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-base">
                      {author.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-[var(--foreground)] truncate max-w-[150px]">
                      {author.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-[var(--foreground-muted)] block truncate max-w-[150px]">
                      {author.email}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    author.role === "admin"
                      ? "bg-purple-50 text-purple-700"
                      : author.role === "editor"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {author.role}
                </span>
              </div>

              <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                {author.bio || "No biography authored yet."}
              </p>

              <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)] pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 font-semibold text-[var(--foreground)]">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  {author.postCount} {author.postCount === 1 ? "article" : "articles"}
                </span>

                <a
                  href={`/author/${author.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[var(--accent)] hover:underline ml-auto"
                >
                  <span>Live Page</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => openEdit(author)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> Edit Profile &amp; SEO
              </button>

              <button
                onClick={() => handleDelete(author._id)}
                className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Author"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Drawer for Create or Edit */}
      {(isCreating || editingAuthor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[var(--border)] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  {editingAuthor ? `Edit Author: ${editingAuthor.name}` : "Add New Author"}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  Update author bio, credentials, links, and dedicated ProfilePage metadata.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingAuthor(null);
                }}
                className="p-1.5 rounded-xl border border-[var(--border)] hover:bg-slate-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-3 flex items-center gap-2 border-b border-[var(--border)] text-xs font-semibold">
              <button
                onClick={() => setActiveTab("general")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "general"
                    ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                General Details
              </button>
              <button
                onClick={() => setActiveTab("seo")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "seo"
                    ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Author Page SEO</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {feedback && (
                <div
                  className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-semibold ${
                    feedback.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                        Author Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!editingAuthor) setSlug(slugify(e.target.value));
                        }}
                        placeholder="Dr. Sarah Connor"
                        className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="author@kraviona.com"
                        className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                        URL Slug (/author/[slug])
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(slugify(e.target.value))}
                        placeholder="sarah-connor"
                        className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                        Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs bg-white"
                      >
                        <option value="author">Author / Staff Writer</option>
                        <option value="editor">Senior Editor</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                      Portrait / Avatar Image URL
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                      Author Biography
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Senior AI researcher covering Indic foundational models..."
                      className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Personal Website / Portfolio
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://sarahconnor.ai"
                        className="w-full rounded-lg border border-[var(--border)] p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Twitter / X Profile URL
                      </label>
                      <input
                        type="url"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://twitter.com/..."
                        className="w-full rounded-lg border border-[var(--border)] p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full rounded-lg border border-[var(--border)] p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full rounded-lg border border-[var(--border)] p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-4">
                  <SeoEditorPanel
                    seo={seo}
                    onChange={setSeo}
                    entityType="author"
                    title={name}
                    slug={`author/${slug}`}
                    excerpt={bio}
                    baseUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com"}
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingAuthor(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{loading ? "Saving Author..." : "Save Profile & SEO"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
