"use client";

import { LogOut } from "lucide-react";
import { logoutUser } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  return (
    <form action={logoutUser}>
      <Button icon={<LogOut size={18} />} type="submit" variant="secondary">
        Keluar
      </Button>
    </form>
  );
}
