"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Receipt, MessageSquare, Settings, ChevronLeft, Menu, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { label: "AI Assistant", href: "/ai", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user: { name: string; email: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className={cn(
        "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )} onClick={() => setCollapsed(true)} />

      <aside className={cn(
        "fixed lg:relative z-50 h-screen bg-surface border-r border-white/5 flex flex-col transition-all duration-300",
        collapsed ? "w-0 lg:w-16 overflow-hidden" : "w-64"
      )}>
        {/* Ideatech Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="leading-tight">
                <span className="font-bold text-sm">
                  <span className="text-brand-green">Fit</span><span className="text-brand-blue">Stack</span>
                </span>
                <span className="block text-[9px] text-gray-500 -mt-0.5">by Ideatech</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 transition hidden lg:block"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-green/10 text-brand-green"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {!collapsed && (
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-green/20 to-brand-blue/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-brand-green">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-surface rounded-lg border border-white/10"
      >
        <Menu className="w-5 h-5 text-gray-400" />
      </button>
    </>
  );
}
