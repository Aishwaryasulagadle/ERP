"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff } from "lucide-react";

import { JdsLogo } from "@/components/ui/JdsLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#1674B9] selection:text-white">
      {/* Background ambient accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1674B9]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#08764D]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 flex flex-col items-center">
        <JdsLogo size="xl" showText={true} subtitle="Enterprise Operating Suite" className="justify-center mb-2" />
        <p className="mt-2 text-xs text-[#64748B] max-w-sm">
          Unified CRM, Sales Pipeline, Attendance, Task Sprints & HR Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-xl sm:px-8">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1.5 font-mono">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-[#1674B9] focus:bg-white transition-colors"
                  placeholder="name@jds.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1.5 font-mono">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-[#1674B9] focus:bg-white transition-colors font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 p-1 text-[#64748B] hover:text-[#1674B9] hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex items-center justify-center"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Authenticating Session..." : "Sign In to JDS ERP"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Role Switcher for instant testing */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ⚡ Quick Test Logins (Click to Autofill)
              </p>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Testing Mode
              </span>
            </div>

            {/* Admin & Managers */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Admin & Department Managers
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("admin@erp.com", "admin123")}
                    className="p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Admin (All Depts)</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">admin@erp.com</div>
                    <div className="text-[10px] text-slate-400">admin123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("salesmanager@erp.com", "manager123")}
                    className="p-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sales Manager</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">salesmanager@erp.com</div>
                    <div className="text-[10px] text-slate-400">manager123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("priya@erp.com", "manager123")}
                    className="p-2 rounded-xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Marketing Manager</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">priya@erp.com</div>
                    <div className="text-[10px] text-slate-400">manager123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("techmanager@erp.com", "manager123")}
                    className="p-2 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Technical Manager</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">techmanager@erp.com</div>
                    <div className="text-[10px] text-slate-400">manager123</div>
                  </button>
                </div>
              </div>

              {/* Department Employees */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Department Staff (2 per Dept)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Sales Staff */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("vikas.sales@erp.com", "password123")}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-blue-700">Vikas (Sales Staff)</div>
                    <div className="text-[11px] text-slate-500 truncate">vikas.sales@erp.com</div>
                    <div className="text-[10px] text-slate-400">password123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("pooja.sales@erp.com", "password123")}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-blue-700">Pooja (Sales Staff)</div>
                    <div className="text-[11px] text-slate-500 truncate">pooja.sales@erp.com</div>
                    <div className="text-[10px] text-slate-400">password123</div>
                  </button>

                  {/* Marketing Staff */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("rahul@erp.com", "password123")}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-purple-700">Rahul (Marketing)</div>
                    <div className="text-[11px] text-slate-500 truncate">rahul@erp.com</div>
                    <div className="text-[10px] text-slate-400">password123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("sneha.mkt@erp.com", "password123")}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-purple-700">Sneha (Marketing)</div>
                    <div className="text-[11px] text-slate-500 truncate">sneha.mkt@erp.com</div>
                    <div className="text-[10px] text-slate-400">password123</div>
                  </button>

                  {/* Tech Staff */}
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("amit@erp.com", "password123")}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-indigo-700">Amit (Tech Dev)</div>
                    <div className="text-[11px] text-slate-500 truncate">amit@erp.com</div>
                    <div className="text-[10px] text-slate-400">password123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("neha.tech@erp.com", "password123")}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-indigo-700">Neha (Tech Dev)</div>
                    <div className="text-[11px] text-slate-500 truncate">neha.tech@erp.com</div>
                    <div className="text-[10px] text-slate-400">password123</div>
                  </button>
                </div>
              </div>

              {/* Client Portal Logins */}
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1.5">
                  Client Portal (Client Access & Complaints)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("client.jayant@erp.com", "client123")}
                    className="p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Jayant (Client)</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">client.jayant@erp.com</div>
                    <div className="text-[10px] text-slate-400">client123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoCredentials("client.globalmartretail@erp.com", "client123")}
                    className="p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Global Mart (Client)</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">client.globalmartretail@erp.com</div>
                    <div className="text-[10px] text-slate-400">client123</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
