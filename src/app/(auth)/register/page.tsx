"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName, email, role: "admin" });
    }
    router.push("/"); router.refresh();
  }

  return (
    <form onSubmit={handleRegister} className="bg-surface border border-white/5 rounded-2xl p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-brand-navy-light border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 transition"
            placeholder="Jamil Iqbal" required />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-brand-navy-light border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 transition"
            placeholder="you@company.com" required />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-brand-navy-light border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 transition"
            placeholder="Min 6 characters" minLength={6} required />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full mt-6 bg-gradient-to-r from-brand-green to-brand-blue hover:opacity-90 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
        {loading ? "Creating account..." : "Create Account"}
      </button>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-green hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
