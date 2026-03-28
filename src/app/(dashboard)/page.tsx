import { createServerSupabase } from "@/lib/supabase/server";
import { Users, UserPlus, Mail, Phone } from "lucide-react";
import { StatCard } from "@/components/data/stat-card";
import { AIQueryPanel } from "@/components/ai/query-panel";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stats
  const { count: totalContacts } = await supabase
    .from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user!.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: recentContacts } = await supabase
    .from("contacts").select("*", { count: "exact", head: true })
    .eq("user_id", user!.id).gte("created_at", thirtyDaysAgo.toISOString());

  const { count: withEmail } = await supabase
    .from("contacts").select("*", { count: "exact", head: true })
    .eq("user_id", user!.id).not("email", "is", null);

  const { count: withPhone } = await supabase
    .from("contacts").select("*", { count: "exact", head: true })
    .eq("user_id", user!.id).not("phone", "is", null);

  // Recent contacts for activity feed
  const { data: recentList } = await supabase
    .from("contacts").select("*").eq("user_id", user!.id)
    .order("created_at", { ascending: false }).limit(5);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your operations at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={totalContacts || 0} icon={Users} subtitle="All time" />
        <StatCard title="Added This Month" value={recentContacts || 0} icon={UserPlus}
          trend={recentContacts && recentContacts > 0 ? { value: `${recentContacts} new`, positive: true } : undefined} />
        <StatCard title="With Email" value={withEmail || 0} icon={Mail}
          subtitle={totalContacts ? `${Math.round(((withEmail || 0) / totalContacts) * 100)}% coverage` : "0%"} />
        <StatCard title="With Phone" value={withPhone || 0} icon={Phone}
          subtitle={totalContacts ? `${Math.round(((withPhone || 0) / totalContacts) * 100)}% coverage` : "0%"} />
      </div>

      {/* Two Column: Recent + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts */}
        <div className="bg-surface border border-white/5 rounded-xl">
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Recent Contacts</h3>
          </div>
          <div className="divide-y divide-white/5">
            {(!recentList || recentList.length === 0) ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No contacts yet</p>
                <a href="/contacts" className="text-brand-coral text-sm hover:underline mt-1 inline-block">
                  Add your first contact →
                </a>
              </div>
            ) : (
              recentList.map((contact) => (
                <a key={contact.id} href={`/contacts?view=${contact.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition">
                  <div className="w-9 h-9 bg-brand-navy-light rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-coral">
                      {contact.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{contact.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.company || contact.email || "No details"}</p>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(contact.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>

        {/* AI Panel */}
        <AIQueryPanel />
      </div>
    </div>
  );
}
