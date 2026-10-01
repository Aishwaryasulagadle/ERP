"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Target,
  Users,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeft,
  Layers,
  LineChart,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

interface ReportsClientProps {
  reports: any;
}

export function ReportsClient({ reports }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"SALES" | "CRM" | "EMPLOYEES" | "TASKS">("SALES");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleExport = (format: "CSV" | "PDF") => {
    alert(`Exporting verified ${activeTab} enterprise report in ${format} format.`);
  };

  const salesTrend = [
    { name: "Mon", sales: 45000, revenue: 53100 },
    { name: "Tue", sales: 120000, revenue: 141600 },
    { name: "Wed", sales: 85000, revenue: 100300 },
    { name: "Thu", sales: 265000, revenue: 312700 },
    { name: "Fri", sales: 180000, revenue: 212400 },
    { name: "Sat", sales: 65000, revenue: 76700 },
  ];

  const crmConversionData = [
    { name: "Website", leads: 64, converted: 22 },
    { name: "Referral", leads: 32, converted: 14 },
    { name: "LinkedIn", leads: 18, converted: 5 },
    { name: "Cold Call", leads: 12, converted: 2 },
  ];

  const reportCategories = [
    { id: "SALES", label: "Sales Analytics", icon: TrendingUp, desc: "Revenue velocity", color: "text-blue-500" },
    { id: "CRM", label: "CRM Conversion", icon: Target, desc: "Lead funnel attribution", color: "text-indigo-500" },
    { id: "EMPLOYEES", label: "Employee Audits", icon: Users, desc: "Staff performance", color: "text-emerald-500" },
    { id: "TASKS", label: "Task Velocity", icon: Clock, desc: "Sprint burn-down", color: "text-amber-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Reports Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          {/* Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Intelligence Hub</h2>
                  <p className="text-[10px] text-slate-500 truncate">Reports & Data Analytics</p>
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

          {/* Report Categories Navigation */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Audit Modules
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {reportCategories.map((cat) => {
                const isActive = activeTab === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id as any)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : cat.color)} />
                      <div className="min-w-0">
                        <p className="truncate leading-none">{cat.label}</p>
                        <p className={cn("text-[10px] font-normal truncate mt-0.5", isActive ? "text-blue-100" : "text-slate-400")}>
                          {cat.desc}
                        </p>
                      </div>
                    </div>
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
        {/* Header & Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Reports & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-functional Operational Audits, Financials & Conversion Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("CSV")}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport("PDF")}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

      {/* Tab 1: Sales Analytics */}
      {activeTab === "SALES" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="GROSS SALES"
              value="₹5,65,000"
              trend="↑ 12.4%"
              comparisonText="quarterly target"
              isPositive={true}
              icon={TrendingUp}
              iconColor="text-blue-600 bg-blue-50 border-blue-200"
            />
            <KpiCard
              title="AVG ORDER VALUE"
              value="₹4,484"
              trend="+₹320"
              comparisonText="per transaction"
              isPositive={true}
              icon={BarChart3}
              iconColor="text-blue-600 bg-blue-50 border-blue-200"
            />
            <KpiCard
              title="ORDERS REALIZED"
              value="126"
              comparisonText="100% fulfilled"
              isPositive={true}
              icon={CheckCircle}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            />
            <KpiCard
              title="COLLECTION RATIO"
              value="96.2%"
              trend="↑ 1.8%"
              comparisonText="invoices settled"
              isPositive={true}
              icon={Clock}
              iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
            />
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Weekly Sales Velocity</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="repSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                    formatter={(v: any) => [formatCurrency(Number(v)), "Amount"]}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#repSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CRM Conversion */}
      {activeTab === "CRM" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lead Source Attribution & Conversion</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crmConversionData}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                  <Bar dataKey="leads" fill="#2563EB" radius={[4, 4, 0, 0]} name="Inbound Leads" />
                  <Bar dataKey="converted" fill="#10B981" radius={[4, 4, 0, 0]} name="Converted Deals" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Employee Performance & Matrix */}
      {activeTab === "EMPLOYEES" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Employee Performance Audit</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 text-center">Leads Closed</th>
                  <th className="py-3 px-4 text-right">Sales Closed</th>
                  <th className="py-3 px-4 text-center">Tasks Completion</th>
                  <th className="py-3 px-4 text-center">Hours Worked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: "Rahul Sharma", leads: 10, sales: 240000, tasks: "90%", hours: "168h" },
                  { name: "Priya Sharma", leads: 8, sales: 180000, tasks: "83%", hours: "164h" },
                  { name: "Amit Patel", leads: 7, sales: 120000, tasks: "85%", hours: "172h" },
                  { name: "Sneha Reddy", leads: 6, sales: 95000, tasks: "93%", hours: "160h" },
                ].map((emp, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">{emp.leads}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">{formatCurrency(emp.sales)}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">{emp.tasks}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{emp.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Tasks Velocity */}
      {activeTab === "TASKS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="SPRINT COMPLETION"
            value="82%"
            trend="+6.2%"
            comparisonText="current milestone"
            isPositive={true}
            icon={CheckCircle}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
          <KpiCard
            title="AVG CYCLE TIME"
            value="3.2 Days"
            trend="-0.5 days"
            comparisonText="from backlog to complete"
            isPositive={true}
            icon={Clock}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />
        </div>
      )}
      </div>
    </div>
  );
}
