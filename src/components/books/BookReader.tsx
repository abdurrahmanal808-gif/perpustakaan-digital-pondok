"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Grid3X3,
  Loader2,
  RefreshCcw,
  ZoomIn,
  ZoomOut
} from "lucide-react";
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

function ReaderSkeleton({ label }: { label: string }) {
  return (
    <div className="min-h-80 rounded-lg border border-gold/20 bg-bone p-4">
      <div className="mx-auto flex h-full min-h-72 max-w-3xl animate-pulse flex-col justify-center gap-4">
        <div className="h-5 w-40 rounded bg-gold/20" />
        <div className="h-8 w-3/4 rounded bg-pondok/10" />
        <div className="grid gap-3">
          <div className="h-20 rounded bg-white/70" />
          <div className="h-20 rounded bg-white/70" />
          <div className="h-20 rounded bg-white/70" />
        </div>
        <div className="flex items-center text-sm font-semibold text-slate-500">
          <Loader2 className="mr-2 animate-spin" size={20} />
          {label}
        </div>
      </div>
    </div>
  );
}

function ReaderError({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-semibold">{message}</p>
      {onRetry ? (
        <Button
          className="mt-4"
          icon={<RefreshCcw size={17} />}
          onClick={onRetry}
          variant="secondary"
        >
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}

export function BookReader({ bookId, title }: BookReaderProps) {
  const [data, setData] = useState<ReaderResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  async function loadReader() {
    setIsLoading(true);
    setError("");
    setPdfLoaded(false);
    setPdfFailed(false);

    const response = await fetch(`/api/books/${bookId}/read-url`, {
      cache: "no-store"
    });
    const body = (await response.json().catch(() => null)) as ReaderResponse | null;

    if (!response.ok || !body) {
      setData(null);
      setError(body?.error || "Buku tidak bisa dibuka.");
      setIsLoading(false);
      return;
    }

    if (body.files.length === 0) {
      setData(null);
      setError("File buku tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    setData(body);
    setPageIndex(0);
    setIsLoading(false);
  }

  useEffect(() => {
    loadReader().catch(() => {
      setError("Buku tidak bisa dibuka.");
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [pageIndex]);

  useEffect(() => {
    if (!data || data.bookType !== "pdf" || pdfLoaded || pdfFailed) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPdfFailed(true);
    }, 20000);

    return () => window.clearTimeout(timeout);
  }, [data, pdfFailed, pdfLoaded]);

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

  if (isLoading) {
    return <ReaderSkeleton label="Menyiapkan file baca..." />;
  }

  if (error) {
    return <ReaderError message={error} onRetry={loadReader} />;
  }

  if (!data) {
    return <ReaderError message="Buku tidak bisa dibuka." onRetry={loadReader} />;
  }

  if (data.bookType === "pdf") {
    const pdfFile = data.files[0];

    if (!pdfFile) {
      return <ReaderError message="File PDF tidak ditemukan." onRetry={loadReader} />;
    }

    return (
      <section className="space-y-3">
        <div className="flex flex-wrap justify-end gap-2">
          <a
            className={buttonClassName("secondary")}
            href={pdfFile.url}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={17} />
            <span>Buka di tab baru</span>
          </a>
        </div>

        <div className="relative min-h-[75dvh] overflow-hidden rounded-lg border border-gold/20 bg-white shadow-lg shadow-pondok/10 sm:min-h-[78dvh]">
          {!pdfLoaded && !pdfFailed ? (
            <div className="absolute inset-0 z-10">
              <ReaderSkeleton label="Memuat PDF..." />
            </div>
          ) : null}

          {pdfFailed ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white p-4">
              <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                <p className="text-base font-bold">PDF gagal dimuat.</p>
                <p className="mt-2 leading-6">
                  Viewer browser mungkin tidak mendukung file ini. Gunakan tombol
                  fallback di bawah.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    icon={<RefreshCcw size={17} />}
                    onClick={() => {
                      setPdfFailed(false);
                      setPdfLoaded(false);
                      loadReader();
                    }}
                    variant="secondary"
                  >
                    Coba lagi
                  </Button>
                  <a
                    className={buttonClassName("secondary")}
                    href={pdfFile.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={17} />
                    <span>Buka di tab baru</span>
                  </a>
                  <a
                    className={buttonClassName("secondary")}
                    href={`/api/books/${bookId}/download`}
                  >
                    <Download size={17} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          <iframe
            className="h-[75dvh] min-h-[430px] w-full bg-white sm:h-[78dvh]"
            onError={() => setPdfFailed(true)}
            onLoad={() => setPdfLoaded(true)}
            src={`${pdfFile.url}#toolbar=1&navpanes=0&view=FitH`}
            title={`PDF ${title}`}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="sticky top-2 z-20 rounded-lg border border-gold/20 bg-bone/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
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

          <p className="text-sm font-semibold text-slate-700">
            Halaman {pageIndex + 1} dari {data.files.length} · Zoom{" "}
            {Math.round(zoom * 100)}%
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              icon={<Grid3X3 size={18} />}
              onClick={() => setShowGrid((value) => !value)}
              variant="secondary"
            >
              Grid
            </Button>
            <Button
              icon={<ZoomOut size={18} />}
              onClick={() => setZoom((value) => Math.max(0.75, value - 0.1))}
              variant="secondary"
            >
              Kecil
            </Button>
            <Button
              icon={<ZoomIn size={18} />}
              onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}
              variant="secondary"
            >
              Besar
            </Button>
          </div>
        </div>
      </div>

      {showGrid ? (
        <div className="grid grid-cols-4 gap-2 rounded-lg border border-gold/20 bg-bone p-3 sm:grid-cols-8 md:grid-cols-12">
          {pageButtons?.map((page) => (
            <button
              className={`rounded-md border px-2 py-2 text-sm font-semibold hover:bg-cream ${
                page.index === pageIndex
                  ? "border-pondok bg-pondok text-white"
                  : "border-gold/30 bg-white text-ink"
              }`}
              key={page.id}
              onClick={() => setPageIndex(page.index)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative min-h-[60dvh] overflow-auto rounded-lg border border-gold/20 bg-white p-3">
        {!imageLoaded && !imageFailed ? (
          <div className="absolute inset-3">
            <ReaderSkeleton label="Memuat halaman..." />
          </div>
        ) : null}

        {imageFailed ? (
          <ReaderError message="Gambar halaman gagal dimuat." onRetry={loadReader} />
        ) : null}

        {currentFile ? (
          <img
            alt={`${title} halaman ${pageIndex + 1}`}
            className="mx-auto max-w-none transition"
            onError={() => {
              setImageFailed(true);
              setImageLoaded(true);
            }}
            onLoad={() => setImageLoaded(true)}
            src={currentFile.url}
            style={{
              width: `${Math.round(100 * zoom)}%`
            }}
          />
        ) : null}
      </div>

      {currentFile ? (
        <div className="flex flex-wrap justify-end gap-2">
          <a
            className={buttonClassName("secondary")}
            href={currentFile.url}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={17} />
            <span>Buka di tab baru</span>
          </a>
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
