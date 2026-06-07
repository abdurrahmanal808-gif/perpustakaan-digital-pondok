export default function CatalogLoading() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="h-4 w-28 animate-pulse rounded bg-gold/20" />
          <div className="mt-2 h-9 w-56 animate-pulse rounded bg-pondok/10" />
        </div>
        <div className="mb-6 h-40 animate-pulse rounded-lg border border-gold/20 bg-bone" />
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-56 animate-pulse rounded-lg border border-gold/20 bg-bone"
              key={index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
