"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsStandalone(standalone);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener(
        "load",
        () => {
          navigator.serviceWorker.register("/sw.js").catch(() => undefined);
        },
        { once: true }
      );
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => undefined);
    setInstallPrompt(null);
  };

  if (!installPrompt || isStandalone) {
    return null;
  }

  return (
    <button
      aria-label="Pasang aplikasi"
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-md border border-gold/30 bg-pondok px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-pondok/20 transition hover:bg-leaf focus:outline-none focus:ring-2 focus:ring-gold/40"
      onClick={handleInstall}
      type="button"
    >
      <Download size={18} />
      <span className="hidden sm:inline">Pasang App</span>
    </button>
  );
}
