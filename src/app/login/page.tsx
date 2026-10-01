"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password credentials.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background ambient accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">ENTERPRISE ERP</h2>
        <p className="mt-2 text-sm text-slate-500">
          Integrated CRM, Sales Pipeline, Attendance, Task & HR Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white backdrop-blur-xl py-8 px-6 shadow-xl border border-slate-200 rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Authenticating Session..." : "Sign In to ERP"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Role Switcher for instant demonstration */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Quick Role Switcher (1-Click Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@erp.com", "admin123")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-slate-200 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] text-slate-500">admin@erp.com</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("priya@erp.com", "password123")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-slate-200 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-purple-600 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Manager</span>
                </div>
                <div className="text-[11px] text-slate-500">priya@erp.com</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("rahul@erp.com", "password123")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-slate-200 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Rahul (Sales)</span>
                </div>
                <div className="text-[11px] text-slate-500">rahul@erp.com</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("amit@erp.com", "password123")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 border border-slate-200 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Amit (Sales)</span>
                </div>
                <div className="text-[11px] text-slate-500">amit@erp.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
