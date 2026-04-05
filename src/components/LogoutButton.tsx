"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/teacher/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-muted hover:text-danger transition-colors font-bold"
    >
      Sign Out
    </button>
  );
}
