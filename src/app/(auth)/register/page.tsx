import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
