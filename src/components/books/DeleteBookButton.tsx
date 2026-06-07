"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type DeleteBookButtonProps = {
  bookId: string;
  title: string;
};

export function DeleteBookButton({ bookId, title }: DeleteBookButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    const response = await fetch(`/api/books/${bookId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error || "Buku gagal dihapus.");
      setIsDeleting(false);
      return;
    }

    setIsOpen(false);
    setIsDeleting(false);
    router.refresh();
  }

  return (
    <>
      <Button
        icon={<Trash2 size={17} />}
        onClick={() => setIsOpen(true)}
        variant="danger"
      >
        Hapus
      </Button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Hapus buku?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  File buku, cover, dan metadata untuk "{title}" akan dihapus permanen.
                </p>
              </div>
              <button
                aria-label="Tutup dialog"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                variant="secondary"
              >
                Batal
              </Button>
              <Button
                disabled={isDeleting}
                icon={<Trash2 size={17} />}
                onClick={handleDelete}
                variant="danger"
              >
                {isDeleting ? "Menghapus..." : "Ya, hapus"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
