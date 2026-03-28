"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";

interface HeaderProps {
  user: { name: string };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-white/5 bg-surface flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-brand-coral" />
        <span className="text-sm text-gray-400">
          Welcome back, <span className="text-white font-medium">{user.name}</span>
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </header>
  );
}
