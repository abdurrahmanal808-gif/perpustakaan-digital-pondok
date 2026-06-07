export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function publicName(user?: { username: string; full_name?: string | null } | null) {
  if (!user) {
    return "Pengguna";
  }

  return user.full_name || user.username;
}

export function formatDisplayTitle(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Tanpa Judul";
  }

  const hasLower = /[a-z]/.test(normalized);
  const hasUpper = /[A-Z]/.test(normalized);

  if (hasLower && hasUpper) {
    return normalized;
  }

  const smallWords = new Set(["dan", "di", "ke", "dari", "yang", "untuk", "atau"]);

  return normalized
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
