"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Grid3X3, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { buttonClassName, Button } from "@/components/ui/Button";

type SignedFile = {
  id: string;
  fileKind: string;
  pageNumber: number | null;
  originalName: string;
  mimeType: string;
  url: string;
};

type ReaderResponse = {
  bookType: "pdf" | "scan";
  coverUrl: string;
  files: SignedFile[];
  error?: string;
};

type BookReaderProps = {
  bookId: string;
  title: string;
};

export function BookReader({ bookId, title }: BookReaderProps) {
  const [data, setData] = useState<ReaderResponse | null>(null);
  const [error, setError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadReader() {
      const response = await fetch(`/api/books/${bookId}/read-url`);
      const body = (await response.json().catch(() => null)) as ReaderResponse | null;

      if (!mounted) {
        return;
      }

      if (!response.ok || !body) {
        setError(body?.error || "Buku tidak bisa dibuka.");
        return;
      }

      setData(body);
    }

    loadReader();

    return () => {
      mounted = false;
    };
  }, [bookId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const progress =
      data.bookType === "scan" && data.files.length > 0
        ? Math.round(((pageIndex + 1) / data.files.length) * 100)
        : 0;

    fetch(`/api/books/${bookId}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lastPage: pageIndex + 1,
        progress
      })
    }).catch(() => undefined);
  }, [bookId, data, pageIndex]);

  const currentFile = data?.files[pageIndex];
  const canPrevious = pageIndex > 0;
  const canNext = !!data && pageIndex < data.files.length - 1;

  const pageButtons = useMemo(() => {
    return data?.files.map((file, index) => ({
      id: file.id,
      label: file.pageNumber || index + 1,
      index
    }));
  }, [data]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-lg border border-gold/20 bg-bone text-slate-600">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Memuat buku...
      </div>
    );
  }

  if (data.bookType === "pdf") {
    const pdfFile = data.files[0];

    return (
      <section className="space-y-3">
        <div className="flex justify-end">
          <a
            className={buttonClassName("secondary")}
            href={`/api/books/${bookId}/download`}
          >
            <Download size={17} />
            <span>Download</span>
          </a>
        </div>
        <iframe
          className="h-[74vh] w-full rounded-lg border border-gold/20 bg-white"
          src={pdfFile?.url}
          title={`PDF ${title}`}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            disabled={!canPrevious}
            icon={<ChevronLeft size={18} />}
            onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
            variant="secondary"
          >
            Sebelumnya
          </Button>
          <Button
            disabled={!canNext}
            icon={<ChevronRight size={18} />}
            onClick={() =>
              setPageIndex((value) =>
                data ? Math.min(data.files.length - 1, value + 1) : value
              )
            }
            variant="secondary"
          >
            Berikutnya
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            icon={<Grid3X3 size={18} />}
            onClick={() => setShowGrid((value) => !value)}
            variant="secondary"
          >
            Grid
          </Button>
          <Button
            icon={<ZoomOut size={18} />}
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
            variant="secondary"
          >
            Kecil
          </Button>
          <Button
            icon={<ZoomIn size={18} />}
            onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))}
            variant="secondary"
          >
            Besar
          </Button>
        </div>
      </div>

      {showGrid ? (
        <div className="grid grid-cols-4 gap-2 rounded-lg border border-gold/20 bg-bone p-3 sm:grid-cols-8 md:grid-cols-12">
          {pageButtons?.map((page) => (
            <button
              className="rounded-md border border-gold/30 bg-white px-2 py-2 text-sm font-semibold text-ink hover:bg-cream"
              key={page.id}
              onClick={() => setPageIndex(page.index)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-auto rounded-lg border border-gold/20 bg-white p-3">
        {currentFile ? (
          <img
            alt={`${title} halaman ${pageIndex + 1}`}
            className="mx-auto max-w-none transition"
            src={currentFile.url}
            style={{
              width: `${Math.round(100 * zoom)}%`
            }}
          />
        ) : null}
      </div>

      {currentFile ? (
        <div className="flex justify-end">
          <a
            className={buttonClassName("secondary")}
            href={`/api/books/${bookId}/files/${currentFile.id}?download=1`}
          >
            <Download size={17} />
            <span>Download halaman</span>
          </a>
        </div>
      ) : null}
    </section>
  );
}
