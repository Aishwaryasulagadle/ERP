"use client";

import { useState } from "react";
import {
  Users,
  Target,
  TrendingUp,
  CheckSquare,
  Clock,
  Briefcase,
  ArrowUpRight,
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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { KpiCard, StatusBadge } from "@/components/ui/Cards";

interface DashboardClientProps {
  metrics: any;
  user: any;
  role: string;
}

export function DashboardClient({ metrics, user, role }: DashboardClientProps) {
  const [timeRange, setTimeRange] = useState("30D");
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);

  const userDept = (user?.department || "").toLowerCase();
  const userEmail = (user?.email || "").toLowerCase();

  const isMarketing =
    userDept.includes("marketing") ||
    userEmail.includes("priya") ||
    userEmail.includes("rahul") ||
    userEmail.includes("sneha");

  const isTech =
    userDept.includes("technical") ||
    userDept.includes("tech") ||
    userDept.includes("it") ||
    userEmail.includes("tech") ||
    userEmail.includes("amit") ||
    userEmail.includes("neha");

  const isSales =
    userDept.includes("sales") ||
    userEmail.includes("sales") ||
    userEmail.includes("vikas") ||
    userEmail.includes("pooja");

  const isAdmin = role === "ADMIN";

  // 1. KPI Values
  const totalRev = metrics.kpis.totalSalesRevenue || 565000;
  const totalLeads = metrics.kpis.totalLeads || 126;
  const convertedCount = metrics.kpis.convertedLeads || 31;
  const convRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "24.5";
  const totalEmp = metrics.kpis.totalEmployees || 32;
  const presentToday = metrics.kpis.presentToday || 29;
  const taskRate = metrics.taskStats?.completionRate || 82;

  // 2. Sales Overview Chart Data for controls 7D / 30D / 90D / 1Y
  const chartDataMap: Record<string, any[]> = {
    "7D": [
      { name: "Mon", sales: 45000, orders: 12 },
      { name: "Tue", sales: 120000, orders: 28 },
      { name: "Wed", sales: 85000, orders: 19 },
      { name: "Thu", sales: 265000, orders: 42 },
      { name: "Fri", sales: 180000, orders: 34 },
      { name: "Sat", sales: 65000, orders: 15 },
      { name: "Sun", sales: 30000, orders: 6 },
    ],
    "30D": [
      { name: "Week 1", sales: 110000, orders: 24 },
      { name: "Week 2", sales: 145000, orders: 32 },
      { name: "Week 3", sales: 195000, orders: 45 },
      { name: "Week 4", sales: 215000, orders: 51 },
    ],
    "90D": [
      { name: "Jul", sales: 420000, orders: 98 },
      { name: "Aug", sales: 510000, orders: 118 },
      { name: "Sep", sales: 565000, orders: 126 },
    ],
    "1Y": [
      { name: "Q1", sales: 1200000, orders: 280 },
      { name: "Q2", sales: 1450000, orders: 340 },
      { name: "Q3", sales: 1720000, orders: 410 },
      { name: "Q4", sales: 1980000, orders: 490 },
    ],
  };

  const currentChartData = chartDataMap[timeRange] || chartDataMap["30D"];

  // 3. Horizontal CRM Pipeline Funnel Stages
  const pipelineStages = [
    { label: "NEW", count: metrics.kpis.newLeads || 126, value: 420000, color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
    { label: "CONTACTED", count: 92, value: 340000, color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" },
    { label: "FOLLOW-UP", count: metrics.kpis.followUpsToday || 64, value: 280000, color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
    { label: "QUALIFIED", count: 38, value: 210000, color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" },
    { label: "CONVERTED", count: convertedCount, value: 150000, color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
    { label: "LOST", count: 14, value: 65000, color: "border-rose-500/30 text-rose-400 bg-rose-500/10" },
  ];

  // 4. Employee Performance Table
  const employeeRows = [
    { name: "Rahul Sharma", leads: 32, converted: 10, sales: 240000, tasks: "18/20", completion: 90, status: "ACTIVE" },
    { name: "Priya Sharma", leads: 28, converted: 8, sales: 180000, tasks: "15/18", completion: 83, status: "ACTIVE" },
    { name: "Amit Patel", leads: 24, converted: 7, sales: 120000, tasks: "17/20", completion: 85, status: "ACTIVE" },
    { name: "Sneha Reddy", leads: 21, converted: 6, sales: 95000, tasks: "14/15", completion: 93, status: "ACTIVE" },
  ];

  // 5. Recent Sales Table
  const recentSales = [
    { id: "ORD-2026-001", customer: "Sidhi Bhoite", employee: "Amit Patel", amount: 265000, status: "PAID", date: "Sep 27" },
    { id: "ORD-2026-002", customer: "Akash Jadhav", employee: "Rahul Sharma", amount: 180000, status: "PENDING", date: "Sep 25" },
    { id: "ORD-2026-003", customer: "Sarvesh Bhoite", employee: "Sneha Reddy", amount: 120000, status: "PAID", date: "Sep 24" },
    { id: "ORD-2026-004", customer: "Atharv Patharkar", employee: "Rahul Sharma", amount: 85000, status: "OVERDUE", date: "Sep 22" },
  ];

  // 6. Today's Activity Timeline
  const activities = [
    { time: "09:32", user: "Rahul Sharma", action: "created a new enterprise lead", icon: Target, color: "text-blue-400" },
    { time: "10:05", user: "Priya Sharma", action: "completed a client follow-up call", icon: PhoneCall, color: "text-amber-400" },
    { time: "10:42", user: "Amit Patel", action: "created order ORD-2026-001 (₹2.65L)", icon: TrendingUp, color: "text-emerald-400" },
    { time: "11:15", user: "Sneha Reddy", action: "completed sprint task 'Quotation Review'", icon: CheckSquare, color: "text-indigo-400" },
    { time: "11:40", user: "Rahul Sharma", action: "converted high-value enterprise lead", icon: Sparkles, color: "text-emerald-400" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || "Admin"}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1674B9]/10 text-[#14558A] border border-[#1674B9]/20">
              {role}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            {isMarketing
              ? "Digital Marketing Operations • Deliverables, Social Campaigns & Team Velocity."
              : isTech
              ? "Technical & IT Engineering • Code Sprints, Milestones & System Status."
              : isSales
              ? "Sales & Deal Operations • Pipeline Velocity, Inbound Leads & Revenue."
              : "Enterprise Operating Overview • Synchronized across Sales, Workforce, and Operations."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
              className="btn-primary px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Actions</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showQuickActionMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95">
                {(isSales || isAdmin) && (
                  <>
                    <Link
                      href="/crm"
                      onClick={() => setShowQuickActionMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <Target className="w-3.5 h-3.5 text-[#1674B9]" />
                      <span>Add Lead</span>
                    </Link>
                    <Link
                      href="/sales"
                      onClick={() => setShowQuickActionMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-[#08764D]" />
                      <span>Sales Ledger</span>
                    </Link>
                  </>
                )}
                <Link
                  href="/employees?tab=TASKS"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#F28C16]" />
                  <span>Sprint Tasks</span>
                </Link>
                {(isMarketing || isTech || isAdmin) && (
                  <Link
                    href="/reports"
                    onClick={() => setShowQuickActionMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#14558A]" />
                    <span>Client Accounts</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Date Range Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#1674B9]" />
            <span className="font-medium font-mono text-[11px] text-slate-600">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main 5 KPI Cards Section */}
      {isMarketing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="ACTIVE CLIENTS"
            value={metrics.clientStats?.totalClients || 0}
            trend="Marketing"
            comparisonText="active accounts"
            isPositive={true}
            icon={Briefcase}
            iconColor="text-[#14558A] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="REELS & POSTS"
            value={`${metrics.clientStats?.totalCompletedDeliverables || 0}/${metrics.clientStats?.totalTargetDeliverables || 0}`}
            trend="Deliverables"
            comparisonText="this month's targets"
            isPositive={true}
            icon={Target}
            iconColor="text-[#1674B9] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="DELIVERY VELOCITY"
            value={`${metrics.clientStats?.deliverableCompletionRate || 0}%`}
            trend="On Track"
            comparisonText="monthly delivery rate"
            isPositive={true}
            icon={Sparkles}
            iconColor="text-[#08764D] bg-[#08764D]/10 border-[#08764D]/20"
          />
          <KpiCard
            title="TEAM ATTENDANCE"
            value={`${presentToday}/${totalEmp}`}
            comparisonText="staff present today"
            isPositive={true}
            icon={Users}
            iconColor="text-[#14558A] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="SPRINT COMPLETION"
            value={`${taskRate}%`}
            trend="+5.4%"
            comparisonText="tasks resolved"
            isPositive={true}
            icon={CheckSquare}
            iconColor="text-[#F28C16] bg-[#F28C16]/10 border-[#F28C16]/20"
          />
        </div>
      ) : isTech ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="DEV CLIENTS"
            value={metrics.clientStats?.totalClients || 0}
            trend="Web & Apps"
            comparisonText="active engineering contracts"
            isPositive={true}
            icon={Briefcase}
            iconColor="text-[#14558A] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="MILESTONES SHIPPED"
            value={`${metrics.clientStats?.totalCompletedDeliverables || 0}/${metrics.clientStats?.totalTargetDeliverables || 0}`}
            trend="Shipped"
            comparisonText="milestones completed"
            isPositive={true}
            icon={Target}
            iconColor="text-[#1674B9] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="SPRINT VELOCITY"
            value={`${metrics.clientStats?.deliverableCompletionRate || 0}%`}
            trend="Velocity"
            comparisonText="architecture progress"
            isPositive={true}
            icon={Sparkles}
            iconColor="text-[#08764D] bg-[#08764D]/10 border-[#08764D]/20"
          />
          <KpiCard
            title="DEV ATTENDANCE"
            value={`${presentToday}/${totalEmp}`}
            comparisonText="engineers active"
            isPositive={true}
            icon={Users}
            iconColor="text-[#14558A] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="SPRINT TASKS"
            value={`${taskRate}%`}
            trend="Done"
            comparisonText="tickets completed"
            isPositive={true}
            icon={CheckSquare}
            iconColor="text-[#F28C16] bg-[#F28C16]/10 border-[#F28C16]/20"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="TOTAL REVENUE"
            value={formatCurrency(totalRev)}
            trend="↑ 12.4%"
            comparisonText="vs previous month"
            isPositive={true}
            icon={TrendingUp}
            iconColor="text-[#08764D] bg-[#08764D]/10 border-[#08764D]/20"
          />
          <KpiCard
            title="TOTAL LEADS"
            value={totalLeads}
            trend="↑ 8.2%"
            comparisonText="inbound deals"
            isPositive={true}
            icon={Target}
            iconColor="text-[#1674B9] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="CONVERSION RATE"
            value={`${convRate}%`}
            trend="↑ 4.1%"
            comparisonText="deal velocity"
            isPositive={true}
            icon={Sparkles}
            iconColor="text-[#14558A] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="ACTIVE EMPLOYEES"
            value={totalEmp}
            comparisonText={`${presentToday} present today`}
            isPositive={true}
            icon={Users}
            iconColor="text-[#1674B9] bg-[#1674B9]/10 border-[#1674B9]/20"
          />
          <KpiCard
            title="TASK COMPLETION"
            value={`${taskRate}%`}
            trend="+6.2%"
            comparisonText="sprint status"
            isPositive={true}
            icon={CheckSquare}
            iconColor="text-[#F28C16] bg-[#F28C16]/10 border-[#F28C16]/20"
          />
        </div>
      )}


      {/* 3. Sales Overview Large Chart (Requirement #7) */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Sales Overview</h3>
            <p className="text-xs text-[#64748B]">Revenue over time and deal turnover velocity</p>
          </div>

          {/* Timeframe Controls: 7D, 30D, 90D, 1Y */}
          <div className="flex items-center gap-1 p-1 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg self-start sm:self-auto">
            {["7D", "30D", "90D", "1Y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  timeRange === range
                    ? "bg-[#1674B9] text-white font-bold shadow-xs"
                    : "text-[#64748B] hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] font-medium font-mono uppercase">Total Revenue</span>
            <p className="text-lg font-bold text-[#08764D] font-mono mt-0.5">₹5.65L</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] font-medium font-mono uppercase">Orders Closed</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">126</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] font-medium font-mono uppercase">Average Deal Value</span>
            <p className="text-lg font-bold text-[#1674B9] font-mono mt-0.5">₹4,484</p>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1674B9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1674B9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  color: "#1E293B",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.08)",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#1674B9" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CRM Pipeline Funnel or Department Client Deliverables */}
      {(isMarketing || isTech) ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {isMarketing ? "Marketing Accounts & Campaign Deliverables" : "Engineering Projects & Architecture Milestones"}
              </h3>
              <p className="text-xs text-slate-500">Live deliverable tracker for client retainers</p>
            </div>
            <Link href="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View All Client Workspaces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.clientStats?.clients && metrics.clientStats.clients.length > 0 ? (
              metrics.clientStats.clients.map((c: any) => {
                const totalTarget = c.services?.reduce((acc: number, s: any) => acc + (s.targetCount || 0), 0) || 0;
                const totalDone = c.services?.reduce((acc: number, s: any) => acc + (s.completedCount || 0), 0) || 0;
                const pct = totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : 0;
                return (
                  <Link
                    key={c.id}
                    href="/reports"
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">{c.name}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {c.clientCode}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Deliverables: {totalDone}/{totalTarget}</span>
                        <span className="font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>{c.billingType}</span>
                      <span className="font-bold text-emerald-600 font-mono">{formatCurrency(c.amount)}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                No active clients found in this department.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">CRM Pipeline</h3>
              <p className="text-xs text-slate-500">Deal velocity across sales acquisition stages</p>
            </div>
            <Link href="/crm" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>Open Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineStages.map((stage) => (
              <Link
                key={stage.label}
                href={`/crm?tab=${stage.label}`}
                className={`p-3.5 rounded-xl border flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer ${stage.color}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">{stage.label}</span>
                <div className="mt-3">
                  <p className="text-xl font-bold font-mono text-slate-900">{stage.count}</p>
                  <p className="text-[11px] font-mono mt-0.5 opacity-90">{formatCurrency(stage.value)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* 5. Employee Performance & Recent Sales Grid (Requirements #9 & #10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Employee Performance Table (7 Cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Employee Performance</h3>
              <p className="text-xs text-[#64748B]">Ranked by revenue closed and task velocity</p>
            </div>
            <Link href="/employees" className="text-xs font-semibold text-[#1674B9] hover:text-[#14558A] transition-colors">
              View All Staff →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] font-mono">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-center">Leads</th>
                  <th className="py-2.5 px-3 text-center">Converted</th>
                  <th className="py-2.5 px-3 text-right">Sales</th>
                  <th className="py-2.5 px-3 text-center">Tasks</th>
                  <th className="py-2.5 px-3 text-center">Completion</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeRows.map((emp, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{emp.leads}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#1674B9] font-bold">{emp.converted}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08764D] font-mono">
                      {formatCurrency(emp.sales)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{emp.tasks}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#08764D] h-full rounded-full"
                            style={{ width: `${emp.completion}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">{emp.completion}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <StatusBadge status={emp.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales Table (5 Cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Recent Sales</h3>
              <p className="text-xs text-[#64748B]">Latest enterprise transactions</p>
            </div>
            <Link href="/sales" className="text-xs font-semibold text-[#1674B9] hover:text-[#14558A] transition-colors">
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] font-mono">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1674B9]">{ord.id}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{ord.customer}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08764D] font-mono">
                      {formatCurrency(ord.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <StatusBadge status={ord.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. Today's Business & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Business (4 Cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Today&apos;s Run-Rate</h3>
            <p className="text-xs text-[#64748B]">Real-time operational summary</p>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">Sales Closed</span>
              <span className="text-sm font-bold text-[#08764D] font-mono">₹45,000</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">Inbound Leads</span>
              <span className="text-sm font-bold text-slate-900 font-mono">18</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">Follow-ups Scheduled</span>
              <span className="text-sm font-bold text-[#F28C16] font-mono">12</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">Tasks Resolved</span>
              <span className="text-sm font-bold text-[#1674B9] font-mono">24</span>
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">Customer Meetings</span>
              <span className="text-sm font-bold text-slate-800 font-mono">9</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline (8 Cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Today&apos;s Activity Timeline</h3>
              <p className="text-xs text-[#64748B]">Live operational events & team actions</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1674B9]/10 text-[#14558A] border border-[#1674B9]/20 font-bold">
              Live Stream
            </span>
          </div>

          <div className="space-y-2.5">
            {activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#1674B9] shadow-2xs shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-slate-700 truncate">
                      <span className="text-slate-900 font-bold">{act.user}</span> {act.action}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B] shrink-0 ml-2">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

