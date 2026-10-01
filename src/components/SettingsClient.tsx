"use client";

import { useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import { ShieldCheck, History, Database, Server, Key, Sliders, Shield, PanelLeftClose, PanelLeft, Settings } from "lucide-react";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";

interface SettingsClientProps {
  logs: any[];
}

export function SettingsClient({ logs }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"AUDIT" | "SECURITY" | "DATABASE">("AUDIT");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const settingCategories = [
    { id: "AUDIT", label: "Audit Trail Logs", icon: History, count: logs.length, color: "text-blue-500" },
    { id: "SECURITY", label: "RBAC Security Policy", icon: Key, color: "text-emerald-500" },
    { id: "DATABASE", label: "Cloud Engine & DB", icon: Database, color: "text-indigo-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Settings Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          {/* Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">System Config</h2>
                  <p className="text-[10px] text-slate-500 truncate">Governance & Security</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse sidebar"
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Setting Categories Navigation */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Configuration Modules
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {settingCategories.map((cat) => {
                const isActive = activeTab === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id as any)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : cat.color)} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    {cat.count !== undefined && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ml-2",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        )}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
      ) : (
        /* Collapsed Sidebar Rail Button */
        <div className="hidden md:flex flex-col items-center py-4 px-2 bg-white border-r border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            title="Expand operations sidebar"
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 transition-all shadow-xs group cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Enterprise Settings & Audit
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Security governance, RBAC policy and immutable system audit trail
            </p>
          </div>
        </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs font-mono">
            <Database className="w-4 h-4" />
            <span>DATABASE TOPOLOGY</span>
          </div>
          <p className="text-sm font-bold text-slate-900">PostgreSQL / Neon Engine</p>
          <p className="text-xs text-slate-500">Prisma ORM 6.4 Client schema sync</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs font-mono">
            <Key className="w-4 h-4" />
            <span>RBAC ACCESS CONTROL</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Server-Enforced Guard</p>
          <p className="text-xs text-slate-500">Admin, Manager, Employee permissions active</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs font-mono">
            <Server className="w-4 h-4" />
            <span>ERP SYSTEM RUNTIME</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Production SaaS v1.0.0</p>
          <p className="text-xs text-slate-500">Next.js 16 App Router + Tailwind CSS</p>
        </div>
      </div>

      {/* Audit Log Table */}
      {activeTab === "AUDIT" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">System Audit Trail</h3>
            <span className="text-xs font-mono text-slate-500">Total events: {logs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.userName || "System"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.recordId || "-"}</td>
                    <td className="py-3 px-4 text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RBAC Security Policies */}
      {activeTab === "SECURITY" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Role-Based Access Control Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-amber-700 text-xs font-mono">ADMIN ROLE</span>
              <p className="text-xs text-slate-600">
                Full system authorization, employee onboarding, compensation, settings and audit viewing.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-indigo-700 text-xs font-mono">MANAGER ROLE</span>
              <p className="text-xs text-slate-600">
                Team management, task assignments, CRM lead routing and departmental report views.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-blue-700 text-xs font-mono">EMPLOYEE ROLE</span>
              <p className="text-xs text-slate-600">
                Personal dashboard, assigned leads, task status reporting and attendance punch terminal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Database Topology */}
      {activeTab === "DATABASE" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">Database Engine & Topology</h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">ORM Provider:</span>
              <span className="font-mono text-blue-600 font-bold">Prisma ORM 6.4.1</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-mono text-emerald-600 font-bold">PostgreSQL / Neon Cloud</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Audit Logging:</span>
              <span className="font-mono text-amber-600 font-bold">Immutable & Active</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-500">Session Security:</span>
              <span className="font-mono text-slate-700">Bcrypt + JWT Session Tokens</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
