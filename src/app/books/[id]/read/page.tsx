import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { BookReader } from "@/components/books/BookReader";

export const dynamic = "force-dynamic";

type ReadBookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReadBookPage({ params }: ReadBookPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const book = await getBookDetail(id, user);

  if (!book) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <p className="text-sm font-semibold text-gold">Baca online</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{book.title}</h1>
        </div>
        <BookReader bookId={book.id} title={book.title} />
      </section>
    </main>
  );
}
