import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { PageEditor } from "@/components/admin/pages/page-editor";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditAdminPage({ params }: EditPageProps) {
  const { id } = await params;
  await connectDB();

  const page = await Page.findById(id).lean();
  if (!page) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = page as any;

  const initialData = {
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || "",
    contentHtml: p.contentHtml || "",
    blocks: p.blocks || [],
    template: p.template || "default",
    status: p.status || "published",
    showInMenu: Boolean(p.showInMenu),
    showInFooter: Boolean(p.showInFooter),
    order: p.order || 0,
    seo: p.seo || {
      metaTitle: p.title,
      metaDescription: p.excerpt,
      schemaType: "WebPage",
    },
  };

  return <PageEditor initialData={initialData} />;
}
