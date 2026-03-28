import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: profile?.full_name || user.email || "User", email: user.email || "" }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={{ name: profile?.full_name || "User" }} />
        <main className="flex-1 overflow-y-auto p-6 bg-brand-navy">
          {children}
        </main>
      </div>
    </div>
  );
}
