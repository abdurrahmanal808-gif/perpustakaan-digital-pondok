import {
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory
} from "@/lib/admin/actions";
import { getAllCategories } from "@/lib/books/queries";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Manajemen Kategori</h1>
      </div>

      <form
        action={adminCreateCategory}
        className="grid gap-3 rounded-lg border border-gold/20 bg-bone p-4 md:grid-cols-[220px_1fr_auto]"
      >
        <input
          className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
          name="name"
          placeholder="Nama kategori"
          required
        />
        <input
          className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
          name="description"
          placeholder="Deskripsi"
        />
        <Button type="submit">Tambah</Button>
      </form>

      <div className="grid gap-4">
        {categories.map((category) => (
          <article
            className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm"
            key={category.id}
          >
            <form
              action={adminUpdateCategory}
              className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto]"
            >
              <input name="categoryId" type="hidden" value={category.id} />
              <input
                className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                defaultValue={category.name}
                name="name"
                required
              />
              <input
                className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                defaultValue={category.description || ""}
                name="description"
              />
              <label className="flex min-h-10 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm">
                <input
                  defaultChecked={category.is_active}
                  name="isActive"
                  type="checkbox"
                />
                Aktif
              </label>
              <Button type="submit" variant="secondary">
                Simpan
              </Button>
            </form>
            <form action={adminDeleteCategory} className="mt-2">
              <input name="categoryId" type="hidden" value={category.id} />
              <Button type="submit" variant="danger">
                Hapus
              </Button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
