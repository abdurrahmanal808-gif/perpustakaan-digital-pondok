import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalBooks: number;
  perPage: number;
  searchParams: {
    q?: string;
    category?: string;
    type?: string;
    sort?: string;
  };
};

function buildPageHref(
  page: number,
  params: CatalogPaginationProps["searchParams"]
) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.sort) query.set("sort", params.sort);
  if (page > 1) query.set("page", String(page));

  return `/catalog${query.toString() ? `?${query.toString()}` : ""}`;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  totalBooks,
  perPage,
  searchParams
}: CatalogPaginationProps) {
  if (totalBooks === 0) {
    return null;
  }

  const firstItem = (currentPage - 1) * perPage + 1;
  const lastItem = Math.min(currentPage * perPage, totalBooks);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => {
      const start = Math.min(
        Math.max(currentPage - 2, 1),
        Math.max(totalPages - 4, 1)
      );
      return start + index;
    }
  ).filter((page) => page <= totalPages);

  return (
    <nav
      aria-label="Navigasi halaman katalog"
      className="mt-6 flex flex-col gap-3 rounded-lg border border-gold/20 bg-bone p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-slate-600">
        Menampilkan {firstItem}-{lastItem} dari {totalBooks} buku
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {hasPrevious ? (
          <Link
            className={buttonClassName("secondary")}
            href={buildPageHref(currentPage - 1, searchParams)}
          >
            <ChevronLeft size={17} />
            <span>Sebelumnya</span>
          </Link>
        ) : null}

        {pages.map((page) => (
          <Link
            aria-current={page === currentPage ? "page" : undefined}
            className={buttonClassName(
              page === currentPage ? "primary" : "secondary",
              "min-w-10 px-3"
            )}
            href={buildPageHref(page, searchParams)}
            key={page}
          >
            {page}
          </Link>
        ))}

        {hasNext ? (
          <Link
            className={buttonClassName("secondary")}
            href={buildPageHref(currentPage + 1, searchParams)}
          >
            <span>Berikutnya</span>
            <ChevronRight size={17} />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
