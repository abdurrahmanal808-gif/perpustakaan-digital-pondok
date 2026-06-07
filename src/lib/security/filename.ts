export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sanitizeFileName(fileName: string) {
  const parts = fileName.split(".");
  const extension =
    parts.length > 1 ? `.${parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const base = slugify(parts.join(".") || "file") || "file";

  return `${base}${extension}`;
}

export function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}
