"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  TrendingUp,
  CheckSquare,
  Clock,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PhoneCall,
  LayoutDashboard,
  BarChart3,
  Award,
  Plus,
  Calendar,
  ChevronDown,
  UserPlus,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  FileText,
  CreditCard,
  Building2,
  Activity,
  Layers,
  HelpCircle,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { StatusBadge } from "@/components/ui/Cards";

interface DashboardClientProps {
  metrics: any;
  user: any;
  role: string;
}

export function DashboardClient({ metrics, user, role }: DashboardClientProps) {
  const userDept = (user?.department || "").toLowerCase();

  const isSalesManager = role === "MANAGER" && userDept.includes("sales");
  const isSalesEmployee = role === "EMPLOYEE" && userDept.includes("sales");
  const isSales = isSalesManager || isSalesEmployee || userDept.includes("sales");

  const isTechManager = role === "MANAGER" && (userDept.includes("tech") || userDept.includes("it"));
  const isTechEmployee = role === "EMPLOYEE" && (userDept.includes("tech") || userDept.includes("it"));
  const isTech = isTechManager || isTechEmployee || userDept.includes("tech") || userDept.includes("it");

  const isMarketingManager = role === "MANAGER" && userDept.includes("marketing");
  const isMarketingEmployee = role === "EMPLOYEE" && userDept.includes("marketing");
  const isMarketing = isMarketingManager || isMarketingEmployee || userDept.includes("marketing");

  const isAdmin = role === "ADMIN";

  const kpis = metrics.kpis || {};
  const clientStats = metrics.clientStats || {};
  const topClients = metrics.topClients || [];
  const upcomingRenewals = metrics.upcomingRenewals || [];
  const departmentTaskLoads = metrics.departmentTaskLoads || [];
  const todayImportantTasks = metrics.todayImportantTasks || [];
  const openComplaints = metrics.openComplaints || [];
  const marketingChannels = metrics.marketingChannels || {};
  const financeMonthlyChart = metrics.financeMonthlyChart || [];
  const employeeRows = metrics.employeeRows || [];

  // =========================================================================
  // RENDER 1: ADMIN CUSTOMIZED EXECUTIVE DASHBOARD (100% REAL DATABASE SYNC)
  // =========================================================================
  if (isAdmin) {
    // Lead to Renewal Process Pipeline Items (Computed live from DB)
    const processFlow = [
      { step: "Lead", sub: `${kpis.totalLeads} Total`, icon: Users, color: "bg-blue-50 text-blue-600 border-blue-200", href: "/crm" },
      { step: "Sale", sub: `${kpis.meetingLeads} Meetings`, icon: FileText, color: "bg-emerald-50 text-emerald-600 border-emerald-200", href: "/sales" },
      { step: "Client", sub: `${kpis.activeProjects} Active`, icon: Briefcase, color: "bg-purple-50 text-purple-600 border-purple-200", href: "/reports" },
      { step: "Project", sub: `${kpis.activeProjects} Active`, icon: Layers, color: "bg-amber-50 text-amber-600 border-amber-200", href: "/reports" },
      { step: "Employee", sub: `${kpis.totalEmployees} Members`, icon: UserPlus, color: "bg-indigo-50 text-indigo-600 border-indigo-200", href: "/employees" },
      { step: "Invoice", sub: `${metrics.recentOrders?.length || 0} Orders`, icon: FileSpreadsheet, color: "bg-violet-50 text-violet-600 border-violet-200", href: "/sales" },
      { step: "Payment", sub: `₹${((kpis.outstandingAmount || 0) / 1000).toFixed(0)}k Due`, icon: CreditCard, color: "bg-rose-50 text-rose-600 border-rose-200", href: "/sales" },
      { step: "Support", sub: `${kpis.openComplaintsCount} Open`, icon: HelpCircle, color: "bg-cyan-50 text-cyan-600 border-cyan-200", href: "/employees?tab=QUERIES" },
      { step: "Renewal", sub: `${upcomingRenewals.length} Monthly`, icon: RotateCcw, color: "bg-teal-50 text-teal-600 border-teal-200", href: "/sales" },
    ];

    // Project status pie data (Live from DB counts)
    const onTrackCount = Math.max(0, (kpis.activeProjects || 0) - (kpis.delayedProjects || 0));
    const delayedCount = Math.max(0, kpis.delayedProjects || 0);
    const completedCount = kpis.completedProjects || 0; // Live count from DB
    const projectPieData = [
      { name: "On Track", value: onTrackCount > 0 ? onTrackCount : 0, color: "#0284c7" },
      { name: "Delayed", value: delayedCount, color: "#f43f5e" },
      { name: "Completed", value: completedCount, color: "#10b981" },
    ].filter(item => item.value > 0);
    if (projectPieData.length === 0) {
      projectPieData.push({ name: "No Active Projects", value: 1, color: "#e2e8f0" });
    }

    // Invoice collection donut data (Live from DB collected vs outstanding)
    const totalOrderBilling = (kpis.monthlyRevenue || 0) + (kpis.outstandingAmount || 0);
    const paidPct = totalOrderBilling > 0 ? Math.min(100, Math.round(((kpis.monthlyRevenue || 0) / totalOrderBilling) * 100)) : 100;
    const pendingPct = Math.max(0, 100 - paidPct);
    const invoicePieData = [
      { name: "Paid", value: paidPct > 0 ? paidPct : 1, color: "#10b981" },
      { name: "Pending", value: pendingPct, color: "#e2e8f0" },
    ].filter(item => item.value > 0);

    // HR Attendance donut data (Live from DB today check-ins)
    const attPct = Math.min(100, Math.max(0, kpis.attendancePct || 0));
    const otherAttPct = Math.max(0, 100 - attPct);
    const hrPieData = [
      { name: "Present", value: attPct > 0 ? attPct : 1, color: "#0d9488" }, // Teal 600
      { name: "Other", value: otherAttPct, color: "#e2e8f0" },
    ].filter(item => item.value > 0);

    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-[1700px] mx-auto bg-slate-50/60 min-h-screen">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome CEO 👋
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live Company Executive Pulse • Synced 100% with real ERP database records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatDate(new Date())}</span>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
              Live
            </div>
          </div>
        </div>

        {/* 6 Top Metric Cards - Clean Enterprise Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Monthly Revenue */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Monthly Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                ₹
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                {formatCurrency(kpis.monthlyRevenue || 0)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  Realized Cash
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Outstanding Receivables */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Outstanding</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                {formatCurrency(kpis.outstandingAmount || 0)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                  Pending Collection
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Inbound Leads */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Inbound Leads</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                {kpis.totalLeads || 0}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                  {kpis.newLeads || 0} New Stage
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Active Projects */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Active Clients</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                {kpis.activeProjects || 0}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                  {kpis.delayedProjects || 0} Flagged
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Open Support Queries */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Support Queries</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                {kpis.openComplaintsCount || 0}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                  {kpis.slaRiskCount || 0} High Priority
                </span>
              </div>
            </div>
          </div>

          {/* Card 6: Workforce Attendance */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Workforce Present</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                {kpis.presentToday || 0} / {kpis.totalEmployees || 0}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                  {kpis.onLeaveToday || 0} on Leave
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lead to Renewal Process Pipeline Ribbon (Salesforce Path Chevron Style) */}
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[900px] gap-1">
            {processFlow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex-1 flex items-center">
                  <Link
                    href={item.href}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {item.step}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">{item.sub}</div>
                    </div>
                  </Link>
                  {index < processFlow.length - 1 && (
                    <div className="text-slate-300 px-1 font-bold select-none text-xs">›</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 1: 4 Equal Department Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sales Overview (Funnel) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Sales Overview</h3>
              <Link href="/crm" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                  {formatCurrency(kpis.pipelineValue || 0)}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-0.5">
                  <span>Pipeline Value</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{kpis.totalLeads || 0}</p>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-0.5">
                  <span>Total Leads</span>
                </div>
              </div>
            </div>

            {/* Inverted Trapeze Funnel (Exact Counts from DB) */}
            <div className="space-y-1.5 pt-1">
              {[
                { stage: "New Lead", count: kpis.newLeads || 0, bg: "bg-blue-600", width: "100%" },
                { stage: "Contacted", count: kpis.contactedLeads || 0, bg: "bg-blue-700", width: "88%" },
                { stage: "Qualified", count: kpis.qualifiedLeads || 0, bg: "bg-sky-600", width: "75%" },
                { stage: "Meeting", count: kpis.meetingLeads || 0, bg: "bg-teal-600", width: "62%" },
                { stage: "Proposal", count: kpis.proposalLeads || 0, bg: "bg-emerald-600", width: "50%" },
                { stage: "Negotiation", count: kpis.negotiationLeads || 0, bg: "bg-amber-500", width: "38%" },
                { stage: "Won", count: kpis.convertedLeads || 0, bg: "bg-emerald-700", width: "26%" },
                { stage: "Lost", count: kpis.lostLeads || 0, bg: "bg-slate-400", width: "16%" },
              ].map((item) => (
                <div key={item.stage} className="flex items-center justify-between text-xs font-medium gap-2">
                  <div className="flex-1">
                    <div
                      className={cn(
                        "h-4 rounded flex items-center px-2 transition-all",
                        item.bg
                      )}
                      style={{ width: item.width }}
                    >
                      <span className="text-[10px] font-semibold truncate text-white">
                        {item.stage}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-xs shrink-0 w-6 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Project & Operations (Donut) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Project & Operations</h3>
                <Link href="/reports" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 flex-1">
                  <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-base font-bold text-slate-900 font-mono tracking-tight">{kpis.activeProjects || 0}</span>
                    <span className="text-[10px] text-slate-500 block">Active Clients</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 flex-1">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-base font-bold text-slate-900 font-mono tracking-tight">{kpis.deliverableCompletionRate || 0}%</span>
                    <span className="text-[10px] text-slate-500 block">Deliverables</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut & Legend */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="relative w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectPieData} innerRadius={35} outerRadius={48} paddingAngle={2} dataKey="value" stroke="#ffffff" strokeWidth={1.5}>
                      {projectPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-slate-900 font-mono">{kpis.activeProjects || 0}</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Projects</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] flex-1 pl-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    On Track
                  </span>
                  <span className="font-semibold font-mono text-slate-800">{onTrackCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Delayed
                  </span>
                  <span className="font-semibold font-mono text-rose-600">{kpis.delayedProjects || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                  <span className="font-semibold font-mono text-slate-800">{completedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Invoice & Payments (Donut) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Invoice & Payments</h3>
                <Link href="/sales" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>

              <div className="flex items-baseline justify-between pt-3">
                <div>
                  <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                    {formatCurrency(kpis.invoicedThisMonth || 0)}
                  </p>
                  <span className="text-[10px] text-slate-500">Invoiced (This Month)</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-rose-600 font-mono tracking-tight">
                    {formatCurrency(kpis.outstandingAmount || 0)}
                  </p>
                  <span className="text-[10px] text-slate-500">Outstanding</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="relative w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={invoicePieData} innerRadius={35} outerRadius={48} paddingAngle={2} dataKey="value" stroke="#ffffff" strokeWidth={1.5}>
                      {invoicePieData.map((entry, index) => (
                        <Cell key={`inv-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-slate-900 font-mono">{paidPct}%</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Paid</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] flex-1 pl-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Paid
                  </span>
                  <span className="font-semibold font-mono text-emerald-600">
                    {formatCurrency(kpis.monthlyRevenue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Pending
                  </span>
                  <span className="font-semibold font-mono text-slate-800">
                    {formatCurrency(kpis.outstandingAmount || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Overdue
                  </span>
                  <span className="font-semibold font-mono text-rose-600">
                    {formatCurrency(kpis.overdueAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: HR Overview (Donut) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">HR Overview</h3>
                <Link href="/employees" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>

              <div className="flex items-baseline justify-between pt-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80 border border-slate-200/80 flex-1 mr-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-base font-bold text-slate-900 font-mono tracking-tight">{kpis.totalEmployees || 0}</span>
                    <span className="text-[10px] text-slate-500 block">Total Staff</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80 border border-slate-200/80 flex-1">
                  <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-base font-bold text-slate-900 font-mono tracking-tight">{kpis.presentToday || 0}</span>
                    <span className="text-[10px] text-slate-500 block">Punched In</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="relative w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={hrPieData} innerRadius={35} outerRadius={48} paddingAngle={2} dataKey="value" stroke="#ffffff" strokeWidth={1.5}>
                      {hrPieData.map((entry, index) => (
                        <Cell key={`hr-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-slate-900 font-mono">{attPct}%</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Present</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] flex-1 pl-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Present
                  </span>
                  <span className="font-semibold font-mono text-slate-800">{kpis.presentToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    On Leave
                  </span>
                  <span className="font-semibold font-mono text-slate-800">{kpis.onLeaveToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    WFH
                  </span>
                  <span className="font-semibold font-mono text-slate-800">{kpis.wfhToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Absent
                  </span>
                  <span className="font-semibold font-mono text-rose-600">{kpis.absentToday || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: 3 Operational Modules (Marketing Performance, Complaints/Support, Finance Overview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 1: Marketing Performance */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Marketing Acquisition</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                Live Channels
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Meta Ads */}
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 text-center space-y-1">
                <div className="w-6 h-6 mx-auto rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  f
                </div>
                <span className="text-[11px] font-semibold text-slate-800 block">Meta Ads</span>
                <div className="text-[10px] text-slate-500 font-mono">
                  Leads <strong className="text-slate-900 font-semibold">{marketingChannels.metaAds?.leads || 0}</strong>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  CPL <strong className="text-slate-900 font-semibold">₹{marketingChannels.metaAds?.cpl || 0}</strong>
                </div>
              </div>

              {/* Google Ads */}
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 text-center space-y-1">
                <div className="w-6 h-6 mx-auto rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <span className="text-[11px] font-semibold text-slate-800 block">Google Ads</span>
                <div className="text-[10px] text-slate-500 font-mono">
                  Leads <strong className="text-slate-900 font-semibold">{marketingChannels.googleAds?.leads || 0}</strong>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  CPL <strong className="text-slate-900 font-semibold">₹{marketingChannels.googleAds?.cpl || 0}</strong>
                </div>
              </div>

              {/* SEO */}
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 text-center space-y-1">
                <div className="w-6 h-6 mx-auto rounded bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  🔍
                </div>
                <span className="text-[11px] font-semibold text-slate-800 block">SEO & Web</span>
                <div className="text-[10px] text-slate-500 font-mono">
                  Leads <strong className="text-slate-900 font-semibold">{marketingChannels.seo?.leads || 0}</strong>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Traffic <strong className="text-slate-900 font-semibold">{marketingChannels.seo?.traffic || "0"}</strong>
                </div>
              </div>

              {/* Social Media */}
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 text-center space-y-1">
                <div className="w-6 h-6 mx-auto rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  ▶
                </div>
                <span className="text-[11px] font-semibold text-slate-800 block">Social Media</span>
                <div className="text-[10px] text-slate-500 font-mono">
                  Leads <strong className="text-slate-900 font-semibold">{marketingChannels.socialMedia?.leads || 0}</strong>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Reach <strong className="text-slate-900 font-semibold">{marketingChannels.socialMedia?.reach || "0"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Complaints / Support */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Support & Complaints</h3>
              <Link href="/employees?tab=QUERIES" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-base font-bold text-rose-600 font-mono tracking-tight">{kpis.openComplaintsCount || 0}</span>
                <span className="text-[10px] text-slate-500 block">Open Tickets</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-base font-bold text-amber-600 font-mono tracking-tight">{kpis.slaRiskCount || 0}</span>
                <span className="text-[10px] text-slate-500 block">High Priority</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-base font-bold text-slate-700 font-mono tracking-tight">0</span>
                <span className="text-[10px] text-slate-500 block">Escalated</span>
              </div>
            </div>

            {/* Complaints Mini Table (100% from DB) */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 font-mono uppercase border-b border-slate-200 bg-slate-50/50">
                  <tr>
                    <th className="py-1 px-1.5 font-semibold">ID</th>
                    <th className="py-1 px-1.5 font-semibold">Raised By</th>
                    <th className="py-1 px-1.5 font-semibold">Issue</th>
                    <th className="py-1 px-1.5 font-semibold">Priority</th>
                    <th className="py-1 px-1.5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {openComplaints.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-1.5 font-mono text-blue-600 font-semibold">{c.queryCode}</td>
                      <td className="py-2 px-1.5 font-medium text-slate-800">
                        {c.client ? (
                          <span className="flex items-center gap-1 text-slate-700">
                            <span className="px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-bold">CLIENT</span>
                            <span className="truncate max-w-[70px]">{c.client.name}</span>
                          </span>
                        ) : (
                          c.employee?.user?.name || "Staff"
                        )}
                      </td>
                      <td className="py-2 px-1.5 text-slate-600 truncate max-w-[120px]" title={c.subject}>
                        {c.subject}
                      </td>
                      <td className="py-2 px-1.5 font-semibold text-rose-600">{c.priority}</td>
                      <td className="py-2 px-1.5 text-right">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                  {openComplaints.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                        No open complaints currently.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Finance Overview */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Finance Overview</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                This Month
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <p className="text-base font-bold text-slate-900 font-mono tracking-tight">
                  {formatCurrency(kpis.monthlyRevenue || 0)}
                </p>
                <span className="text-[10px] text-slate-500">Revenue</span>
              </div>
              <div>
                <p className="text-base font-bold text-rose-600 font-mono tracking-tight">
                  {formatCurrency(kpis.totalExpenses || 0)}
                </p>
                <span className="text-[10px] text-slate-500">Expenses</span>
              </div>
              <div>
                <p className="text-base font-bold text-emerald-600 font-mono tracking-tight">
                  {formatCurrency(kpis.grossProfit || 0)}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span>Gross Profit</span>
                </div>
              </div>
            </div>

            {/* Small Monthly Bar Chart */}
            <div className="h-32 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeMonthlyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "11px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "#ffffff" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                    formatter={(val: any) => [formatCurrency(Number(val)), ""]}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: 4 Bottom Action Modules (Today's Important Tasks, Top Clients, Dept Task Load, Upcoming Renewals) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Module 1: Today's Important Tasks */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Today&apos;s High-Priority Tasks</h3>
              <Link href="/employees?tab=TASKS" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="space-y-2 pt-0.5">
              {todayImportantTasks.map((t: any) => (
                <div key={t.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <span className="font-medium text-slate-800 truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                      {t.dept}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                      {t.priority}
                    </span>
                  </div>
                </div>
              ))}
              {todayImportantTasks.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs">No tasks scheduled for today.</div>
              )}
            </div>
          </div>

          {/* Module 2: Top Clients (Revenue) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Top Client Accounts</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                Revenue
              </span>
            </div>

            <div className="space-y-1 pt-0.5">
              {topClients.map((c: any, index: number) => (
                <div key={c.id} className="flex items-center justify-between text-xs py-2 px-1 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono font-semibold text-slate-400 w-4">#{index + 1}</span>
                    <span className="font-medium text-slate-800 truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(c.amount)}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                      c.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
              {topClients.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs">No client accounts yet.</div>
              )}
            </div>
          </div>

          {/* Module 3: Department Wise Task Load */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Department Workload</h3>
              <Link href="/employees?tab=TASKS" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {departmentTaskLoads.map((d: any) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{d.name}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">{d.ratio}</span>
                      <span className="font-semibold text-blue-600">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.max(5, d.pct)}%` }} />
                  </div>
                </div>
              ))}
              {departmentTaskLoads.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs">No department workload yet.</div>
              )}
            </div>
          </div>

          {/* Module 4: Upcoming Renewals */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Upcoming Renewals</h3>
              <Link href="/sales" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="space-y-2 pt-0.5">
              {upcomingRenewals.map((r: any) => (
                <div key={r.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-[10px] text-slate-500">{r.package}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-emerald-600">{formatCurrency(r.amount || 0)}</div>
                    <div className="text-[10px] text-rose-600 font-mono font-semibold">{r.renewalDate}</div>
                  </div>
                </div>
              ))}
              {upcomingRenewals.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs">No upcoming renewals yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: SALES DEPARTMENT (FOR SALES MANAGER & SALES EMPLOYEE)
  // =========================================================================
  if (isSales) {
    const isManager = role === "MANAGER";
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-[1700px] mx-auto bg-slate-50/60 min-h-screen">
        {/* Sales Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono uppercase">
                Sales Department
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-medium text-slate-500 uppercase">
                {isManager ? "Management Console" : "Executive Desk"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Sales {isManager ? "Management Operations" : "Executive Desk"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isManager
                ? "Department-wide inbound lead pipeline, sales quota velocity, and staff collections."
                : "Your personal inbound leads, assigned recovery tasks, and closed deals."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/crm"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </Link>
            <Link
              href="/sales"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Sales Ledger</span>
            </Link>
          </div>
        </div>

        {/* Sales Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Pipeline Deal Value</span>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(kpis.pipelineValue || 0)}</p>
            <span className="text-[10px] text-blue-600 font-semibold">Active Funnel</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Inbound Leads</span>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{kpis.totalLeads || 0}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">{kpis.newLeads || 0} New Today</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Win / Conversion Rate</span>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {kpis.totalLeads > 0 ? `${Math.round(((kpis.convertedLeads || 0) / kpis.totalLeads) * 100)}%` : "0%"}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">{kpis.convertedLeads || 0} Won Deals</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Monthly Cash Collected</span>
            <p className="text-xl font-bold text-emerald-600 font-mono tracking-tight">{formatCurrency(kpis.monthlyRevenue || 0)}</p>
            <span className="text-[10px] text-slate-400 font-medium">Realized Inflow</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Pending Receivables</span>
            <p className="text-xl font-bold text-amber-600 font-mono tracking-tight">{formatCurrency(kpis.outstandingAmount || 0)}</p>
            <span className="text-[10px] text-rose-600 font-semibold">Uncollected</span>
          </div>
        </div>

        {/* Lead Stages Funnel Grid */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Sales CRM Acquisition Stages</h3>
            <Link href="/crm" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Open Pipeline →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "NEW LEADS", count: kpis.newLeads || 0, color: "border-blue-200/80 bg-blue-50/60 text-blue-800" },
              { label: "CONTACTED", count: kpis.contactedLeads || 0, color: "border-slate-200 bg-slate-50/80 text-slate-800" },
              { label: "FOLLOW UP", count: kpis.followUpLeads || 0, color: "border-amber-200/80 bg-amber-50/60 text-amber-800" },
              { label: "CONVERTED / WON", count: kpis.convertedLeads || 0, color: "border-emerald-200/80 bg-emerald-50/60 text-emerald-800" },
              { label: "LOST", count: kpis.lostLeads || 0, color: "border-slate-200 bg-slate-100/60 text-slate-600" },
            ].map((st) => (
              <div key={st.label} className={cn("p-3.5 rounded-lg border flex flex-col justify-between", st.color)}>
                <span className="text-[10px] font-semibold font-mono uppercase tracking-wider">{st.label}</span>
                <span className="text-2xl font-bold font-mono tracking-tight mt-2">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Performance Table */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">
              {isManager ? "Sales Representatives Performance" : "My Closed Deals & Activity"}
            </h3>
            <Link href="/employees" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View Roster →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Sales Executive</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Leads Handled</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Deals Won</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Revenue Closed</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Tasks Completed</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeRows
                  .filter((e: any) => (isManager ? e.department?.includes("Sales") || true : e.name === user?.name))
                  .map((emp: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{emp.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{emp.leads}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-blue-600">{emp.converted}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(emp.sales)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{emp.tasks}</td>
                      <td className="py-2.5 px-3 text-right">
                        <StatusBadge status={emp.status} size="sm" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 3: TECHNICAL & IT DEPARTMENT (TECH MANAGER & TECH EMPLOYEES)
  // =========================================================================
  if (isTech) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-[1700px] mx-auto bg-slate-50/60 min-h-screen">
        {/* Tech Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono uppercase">
                Engineering
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-medium text-slate-500 uppercase">
                Technical Hub
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Technical & Engineering Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Code sprints, client web/app deliverables, production architecture & milestone tracking.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/employees?tab=TASKS"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Sprint Board</span>
            </Link>
            <Link
              href="/reports"
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Tech Contracts</span>
            </Link>
          </div>
        </div>

        {/* Tech KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Tech Contracts</span>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{clientStats.totalClients || 0}</p>
            <span className="text-[10px] text-cyan-600 font-semibold">Active Projects</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Milestones Shipped</span>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {clientStats.totalCompletedDeliverables || 0} / {clientStats.totalTargetDeliverables || 0}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">Target Modules</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Sprint Velocity</span>
            <p className="text-xl font-bold text-emerald-600 font-mono tracking-tight">
              {clientStats.deliverableCompletionRate || 0}%
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">Completion Rate</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Open Bug Tickets</span>
            <p className="text-xl font-bold text-rose-600 font-mono tracking-tight">{kpis.openComplaintsCount || 0}</p>
            <span className="text-[10px] text-rose-600 font-semibold">{kpis.slaRiskCount || 0} Critical</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Engineers Active</span>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {kpis.presentToday || 0} / {kpis.totalEmployees || 0}
            </p>
            <span className="text-[10px] text-blue-600 font-semibold">Punched In</span>
          </div>
        </div>

        {/* Technical Contracts Grid */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Engineering Projects & Sprints</h3>
            <Link href="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Open Workspaces →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clientStats.clients?.map((c: any) => {
              const totalTarget = c.services?.reduce((acc: number, s: any) => acc + (s.targetCount || 0), 0) || 0;
              const totalDone = c.services?.reduce((acc: number, s: any) => acc + (s.completedCount || 0), 0) || 0;
              const pct = totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : 0;
              return (
                <div key={c.id} className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-semibold">
                      {c.clientCode}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                      <span>Milestones: {totalDone}/{totalTarget}</span>
                      <span className="font-semibold text-slate-800 font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 4: DIGITAL MARKETING DEPARTMENT (MARKETING MANAGER & EMPLOYEES)
  // =========================================================================
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-[1700px] mx-auto bg-slate-50/60 min-h-screen">
      {/* Marketing Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-mono uppercase">
              Marketing
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-mono font-medium text-slate-500 uppercase">
              Growth Desk
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Digital Marketing Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverables progress reports, Instagram reels, graphics, Meta ads & social media growth campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/reports"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Progress Sheets</span>
          </Link>
          <Link
            href="/employees?tab=TASKS"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Marketing Tasks</span>
          </Link>
        </div>
      </div>

      {/* Marketing KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Marketing Clients</span>
          <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{clientStats.totalClients || 0}</p>
          <span className="text-[10px] text-purple-600 font-semibold">Active Retainers</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Reels & Posts Delivered</span>
          <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
            {clientStats.totalCompletedDeliverables || 0} / {clientStats.totalTargetDeliverables || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">This Month Target</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Delivery Velocity</span>
          <p className="text-xl font-bold text-emerald-600 font-mono tracking-tight">
            {clientStats.deliverableCompletionRate || 0}%
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">On Schedule</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Ad Campaigns Active</span>
          <p className="text-xl font-bold text-blue-600 font-mono tracking-tight">{marketingChannels.metaAds?.leads + marketingChannels.googleAds?.leads || 0}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Meta & Google Ads</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Team Attendance</span>
          <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
            {kpis.presentToday || 0} / {kpis.totalEmployees || 0}
          </p>
          <span className="text-[10px] text-blue-600 font-semibold">Present Today</span>
        </div>
      </div>

      {/* Marketing Accounts Deliverable Progress Sheets Grid */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">Deliverable Progress Sheets</h3>
          <Link href="/reports" className="text-xs font-semibold text-purple-600 hover:text-purple-700">Open Progress Sheets →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientStats.clients?.map((c: any) => {
            const totalTarget = c.services?.reduce((acc: number, s: any) => acc + (s.targetCount || 0), 0) || 0;
            const totalDone = c.services?.reduce((acc: number, s: any) => acc + (s.completedCount || 0), 0) || 0;
            const pct = totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : 0;
            return (
              <div key={c.id} className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold">
                    {c.clientCode}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span>Reels & Posts: {totalDone}/{totalTarget}</span>
                    <span className="font-semibold text-slate-800 font-mono">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
