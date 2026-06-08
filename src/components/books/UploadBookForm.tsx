"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Upload } from "lucide-react";
import {
  MAX_COVER_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_BYTES
} from "@/lib/constants";
import type { Category } from "@/lib/db/types";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

type UploadResponse = {
  book?: {
    id: string;
  };
  error?: string;
};

type UploadBookFormProps = {
  categories: Category[];
};

const MAX_COVER_EDGE = 1200;
const COVER_QUALITY = 0.82;

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cover gagal dibaca."));
    };
    image.src = url;
  });
}

async function optimizeCoverFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_COVER_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.fillStyle = "#fffaf0";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", COVER_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], `cover-${Date.now()}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

export function UploadBookForm({ categories }: UploadBookFormProps) {
  const router = useRouter();
  const [bookType, setBookType] = useState<"pdf" | "scan">("pdf");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setToast(null);
    setIsUploading(true);

    const formData = new FormData(event.currentTarget);
    const cover = formData.get("cover");

    if (cover instanceof File && cover.size > 0) {
      try {
        const optimizedCover = await optimizeCoverFile(cover);
        formData.set("cover", optimizedCover);
      } catch {
        setError("Cover gagal diproses. Coba gunakan gambar lain.");
        setToast({ message: "Cover gagal diproses.", tone: "error" });
        setIsUploading(false);
        return;
      }
    }

    const response = await fetch("/api/books/upload", {
      method: "POST",
      body: formData
    });

    const body = (await response.json().catch(() => ({}))) as UploadResponse;

    if (!response.ok || !body.book) {
      const message = body.error || "Upload gagal.";
      setError(message);
      setToast({ message, tone: "error" });
      setIsUploading(false);
      return;
    }

    setToast({ message: "Upload berhasil. Buku masuk antrean moderasi.", tone: "success" });
    window.setTimeout(() => {
      router.push(`/books/${body.book?.id}`);
      router.refresh();
    }, 600);
  }

  return (
    <>
      <Toast message={toast?.message || ""} tone={toast?.tone} />
      {categories.length === 0 ? (
        <div className="rounded-lg border border-gold/20 bg-bone p-6 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-ink">Belum ada kategori aktif.</p>
          <p className="mt-2">Hubungi admin sebelum mengupload buku.</p>
        </div>
      ) : null}
      <form
        className={`rounded-lg border border-gold/20 bg-bone p-5 shadow-sm ${
          categories.length === 0 ? "mt-4 opacity-60" : ""
        }`}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Judul buku</span>
          <input
            className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            maxLength={180}
            name="title"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Penulis</span>
          <input
            className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            maxLength={140}
            name="author"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Kategori</span>
          <select
            className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            name="categoryId"
            required
            disabled={categories.length === 0}
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Jenis buku</span>
          <select
            className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            name="bookType"
            onChange={(event) => setBookType(event.target.value as "pdf" | "scan")}
            value={bookType}
          >
            <option value="pdf">PDF</option>
            <option value="scan">Scan gambar</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Cover buku <span className="text-slate-500">(opsional)</span>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="mt-1 w-full rounded-md border border-dashed border-gold/40 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-pondok file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            name="cover"
            type="file"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Jika dikosongkan, sistem akan memakai cover default. Cover akan
            dikompres otomatis, maksimal {formatBytes(MAX_COVER_UPLOAD_SIZE_BYTES)}.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">File buku</span>
          <input
            accept={
              bookType === "pdf"
                ? "application/pdf,.pdf"
                : "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            }
            className="mt-1 w-full rounded-md border border-dashed border-gold/40 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-pondok file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            multiple={bookType === "scan"}
            name="bookFiles"
            required
            type="file"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Total maksimal {formatBytes(MAX_UPLOAD_SIZE_BYTES)}
          </span>
        </label>
        </div>

        <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700">Deskripsi</span>
        <textarea
          className="mt-1 min-h-32 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
          maxLength={1600}
          name="description"
        />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-md bg-cream p-3 text-sm text-slate-700">
          <input className="mt-1" name="rightsConfirmed" required type="checkbox" />
          <span>
            Saya menyatakan memiliki hak atau izin untuk membagikan file ini.{" "}
            <Link className="font-semibold text-pondok hover:text-leaf" href="/aturan-upload">
              Baca aturan upload
            </Link>
          </span>
        </label>

        <p className="mt-3 text-sm text-slate-600">
          Status awal buku adalah menunggu moderasi.
        </p>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button
            disabled={isUploading || categories.length === 0}
            icon={<Upload size={18} />}
            type="submit"
          >
            {isUploading ? "Mengupload..." : "Upload buku"}
          </Button>
        </div>
      </form>
    </>
  );
}
