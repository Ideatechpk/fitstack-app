"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Zap } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green live-dot" />
          <span className="text-[10px] text-gray-500 font-medium">LIVE</span>
        </div>
        <span className="text-sm text-gray-400">
          Welcome, <span className="text-white font-medium">{user.name}</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
          <Zap className="w-3 h-3 text-brand-green" />
          <span>AI Powered</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
