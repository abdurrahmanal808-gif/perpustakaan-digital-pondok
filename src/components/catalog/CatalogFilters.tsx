"use client";

import { useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import type { BookType, Category } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";

type SortValue = "newest" | "popular" | "downloads";

type CatalogFiltersProps = {
  categories: Category[];
  defaultValues: {
    q?: string;
    category?: string;
    type?: BookType | "";
    sort?: SortValue;
  };
};

function FilterFields({
  categories,
  defaultValues
}: CatalogFiltersProps) {
  return (
    <>
      <label className="block md:col-span-4">
        <span className="text-sm font-semibold text-slate-700">Cari buku</span>
        <div className="mt-1 flex min-h-12 items-center gap-2 rounded-md border border-gold/30 bg-white px-3 focus-within:border-pondok focus-within:ring-2 focus-within:ring-pondok/10">
          <Search className="shrink-0 text-slate-500" size={20} />
          <input
            className="w-full bg-transparent py-3 text-base outline-none"
            defaultValue={defaultValues.q}
            name="q"
            placeholder="Judul, penulis, atau deskripsi"
          />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Kategori</span>
        <select
          className="mt-1 min-h-11 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
          defaultValue={defaultValues.category || ""}
          name="category"
        >
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Jenis file</span>
        <select
          className="mt-1 min-h-11 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
          defaultValue={defaultValues.type || ""}
          name="type"
        >
          <option value="">Semua jenis</option>
          <option value="pdf">PDF</option>
          <option value="scan">Scan gambar</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Urutkan</span>
        <select
          className="mt-1 min-h-11 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
          defaultValue={defaultValues.sort || "newest"}
          name="sort"
        >
          <option value="newest">Terbaru</option>
          <option value="popular">Terpopuler</option>
          <option value="downloads">Download terbanyak</option>
        </select>
      </label>
    </>
  );
}

export function CatalogFilters({ categories, defaultValues }: CatalogFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit() {
    setIsLoading(true);
  }

  return (
    <>
      <form
        action="/catalog"
        className="mb-6 hidden rounded-lg border border-gold/20 bg-bone p-4 shadow-sm md:grid md:grid-cols-[1fr_190px_170px_190px_auto] md:items-end md:gap-3"
        onSubmit={handleSubmit}
      >
        <FilterFields categories={categories} defaultValues={defaultValues} />
        <Button
          disabled={isLoading}
          icon={isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          type="submit"
        >
          {isLoading ? "Mencari..." : "Cari"}
        </Button>
      </form>

      <div className="mb-5 md:hidden">
        <button
          className="flex min-h-12 w-full items-center justify-between rounded-lg border border-gold/20 bg-bone px-4 py-3 text-sm font-semibold text-ink shadow-sm"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Cari dan filter buku
          </span>
          <span className="text-slate-500">Buka</span>
        </button>
      </div>

      {mobileOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/50 px-3 py-4 md:hidden"
          role="dialog"
        >
          <div className="mt-auto flex min-h-full items-end">
            <form
              action="/catalog"
              className="w-full rounded-lg bg-bone p-4 shadow-xl"
              onSubmit={handleSubmit}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Filter katalog</h2>
                <button
                  aria-label="Tutup filter"
                  className="rounded-md p-2 text-slate-500 hover:bg-cream"
                  onClick={() => setMobileOpen(false)}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-3">
                <FilterFields categories={categories} defaultValues={defaultValues} />
              </div>

              <Button
                className="mt-4 w-full"
                disabled={isLoading}
                icon={
                  isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Search size={18} />
                  )
                }
                type="submit"
              >
                {isLoading ? "Mencari..." : "Terapkan filter"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
