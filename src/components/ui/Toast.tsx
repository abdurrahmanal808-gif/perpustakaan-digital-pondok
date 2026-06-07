"use client";

import { CheckCircle2, XCircle } from "lucide-react";

type ToastProps = {
  message: string;
  tone?: "success" | "error";
};

export function Toast({ message, tone = "success" }: ToastProps) {
  if (!message) {
    return null;
  }

  const Icon = tone === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role="status"
    >
      <Icon className="mt-0.5 shrink-0" size={18} />
      <span>{message}</span>
    </div>
  );
}
