import { connectDB } from "@/lib/db/connection";
import { Category, Tag, Post } from "@/lib/db/models";
import { TaxonomiesManager } from "@/components/admin/taxonomies/taxonomies-manager";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomiesPage() {
  await connectDB();

  const [rawCategories, rawTags] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Tag.find().sort({ name: 1 }).lean(),
  ]);

  const categories = await Promise.all(
    rawCategories.map(async (c) => ({
      ...c,
      _id: c._id.toString(),
      parent: c.parent ? c.parent.toString() : null,
      postCount: await Post.countDocuments({ category: c._id }),
    }))
  );

  const tags = await Promise.all(
    rawTags.map(async (t) => ({
      ...t,
      _id: t._id.toString(),
      postCount: await Post.countDocuments({ tags: t._id }),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Taxonomies &amp; Pillar Hubs
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Manage topical pillars, parent/child categories, rich SEO hub intro content, and tag consolidations.
        </p>
      </div>

      <TaxonomiesManager
        categories={JSON.parse(JSON.stringify(categories))}
        tags={JSON.parse(JSON.stringify(tags))}
      />
    </div>
  );
}
