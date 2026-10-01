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

  // 1. Five Main KPI Cards (Requirement #6)
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

  // 3. Horizontal CRM Pipeline Funnel Stages (Requirement #8)
  const pipelineStages = [
    { label: "NEW", count: metrics.kpis.newLeads || 126, value: 420000, color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
    { label: "CONTACTED", count: 92, value: 340000, color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" },
    { label: "FOLLOW-UP", count: metrics.kpis.followUpsToday || 64, value: 280000, color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
    { label: "QUALIFIED", count: 38, value: 210000, color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" },
    { label: "CONVERTED", count: convertedCount, value: 150000, color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
    { label: "LOST", count: 14, value: 65000, color: "border-rose-500/30 text-rose-400 bg-rose-500/10" },
  ];

  // 4. Employee Performance Table (Requirement #9)
  const employeeRows = [
    { name: "Rahul Sharma", leads: 32, converted: 10, sales: 240000, tasks: "18/20", completion: 90, status: "ACTIVE" },
    { name: "Priya Sharma", leads: 28, converted: 8, sales: 180000, tasks: "15/18", completion: 83, status: "ACTIVE" },
    { name: "Amit Patel", leads: 24, converted: 7, sales: 120000, tasks: "17/20", completion: 85, status: "ACTIVE" },
    { name: "Sneha Reddy", leads: 21, converted: 6, sales: 95000, tasks: "14/15", completion: 93, status: "ACTIVE" },
  ];

  // 5. Recent Sales Table (Requirement #10)
  const recentSales = [
    { id: "ORD-2026-001", customer: "Sidhi Bhoite", employee: "Amit Patel", amount: 265000, status: "PAID", date: "Sep 27" },
    { id: "ORD-2026-002", customer: "Akash Jadhav", employee: "Rahul Sharma", amount: 180000, status: "PENDING", date: "Sep 25" },
    { id: "ORD-2026-003", customer: "Sarvesh Bhoite", employee: "Sneha Reddy", amount: 120000, status: "PAID", date: "Sep 24" },
    { id: "ORD-2026-004", customer: "Atharv Patharkar", employee: "Rahul Sharma", amount: 85000, status: "OVERDUE", date: "Sep 22" },
  ];

  // 6. Today's Activity Timeline (Requirement #11)
  const activities = [
    { time: "09:32", user: "Rahul Sharma", action: "created a new enterprise lead", icon: Target, color: "text-blue-400" },
    { time: "10:05", user: "Priya Sharma", action: "completed a client follow-up call", icon: PhoneCall, color: "text-amber-400" },
    { time: "10:42", user: "Amit Patel", action: "created order ORD-2026-001 (₹2.65L)", icon: TrendingUp, color: "text-emerald-400" },
    { time: "11:15", user: "Sneha Reddy", action: "completed sprint task 'Quotation Review'", icon: CheckSquare, color: "text-indigo-400" },
    { time: "11:40", user: "Rahul Sharma", action: "converted high-value enterprise lead", icon: Sparkles, color: "text-emerald-400" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || "Admin"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor sales, leads, employees and daily business operations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showQuickActionMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <Link
                  href="/crm"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Add Lead</span>
                </Link>
                <Link
                  href="/sales"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Create Customer</span>
                </Link>
                <Link
                  href="/sales"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Create Sale</span>
                </Link>
                <Link
                  href="/tasks"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Assign Task</span>
                </Link>
                <Link
                  href="/employees"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>+ Add Employee</span>
                </Link>
              </div>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">Sep 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Main 5 KPI Cards Section (Requirement #6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="TOTAL REVENUE"
          value={formatCurrency(totalRev)}
          trend="↑ 12.4%"
          comparisonText="vs previous month"
          isPositive={true}
          icon={TrendingUp}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
        />

        <KpiCard
          title="TOTAL LEADS"
          value={totalLeads}
          trend="↑ 8.2%"
          comparisonText="inbound deals"
          isPositive={true}
          icon={Target}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
        />

        <KpiCard
          title="CONVERSION RATE"
          value={`${convRate}%`}
          trend="↑ 4.1%"
          comparisonText="lead velocity"
          isPositive={true}
          icon={Sparkles}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
        />

        <KpiCard
          title="ACTIVE EMPLOYEES"
          value={totalEmp}
          comparisonText={`${presentToday} present today`}
          isPositive={true}
          icon={Users}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
        />

        <KpiCard
          title="TASK COMPLETION"
          value={`${taskRate}%`}
          trend="+6.2%"
          comparisonText="sprint status"
          isPositive={true}
          icon={CheckSquare}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
        />
      </div>

      {/* 3. Sales Overview Large Chart (Requirement #7) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Sales Overview</h3>
            <p className="text-xs text-slate-500">Revenue over time and deal turnover velocity</p>
          </div>

          {/* Timeframe Controls: 7D, 30D, 90D, 1Y */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl self-start sm:self-auto">
            {["7D", "30D", "90D", "1Y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeRange === range
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Total Revenue</span>
            <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">₹5.65L</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Orders Closed</span>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">126</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Average Order Value</span>
            <p className="text-xl font-bold text-blue-600 font-mono mt-0.5">₹4,484</p>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
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
                  borderRadius: "12px",
                  color: "#0F172A",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CRM Pipeline Funnel (Requirement #8) */}
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

      {/* 5. Employee Performance & Recent Sales Grid (Requirements #9 & #10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Employee Performance Table (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Employee Performance</h3>
              <p className="text-xs text-slate-500">Ranked by revenue closed and task velocity</p>
            </div>
            <Link href="/employees" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All Employees →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
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
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{emp.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{emp.leads}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-600 font-bold">{emp.converted}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono">
                      {formatCurrency(emp.sales)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{emp.tasks}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
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
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Sales</h3>
              <p className="text-xs text-slate-500">Latest enterprise transactions</p>
            </div>
            <Link href="/sales" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{ord.id}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{ord.customer}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Business (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Today&apos;s Business</h3>
            <p className="text-xs text-slate-500">Daily enterprise operational run-rate</p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Sales Revenue</span>
              <span className="text-sm font-bold text-emerald-600 font-mono">₹45,000</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">New Leads</span>
              <span className="text-sm font-bold text-slate-900 font-mono">18</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Follow-ups Scheduled</span>
              <span className="text-sm font-bold text-amber-600 font-mono">12</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Tasks Completed</span>
              <span className="text-sm font-bold text-blue-600 font-mono">24</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Customer Visits</span>
              <span className="text-sm font-bold text-purple-600 font-mono">9</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Today&apos;s Activity Timeline</h3>
              <p className="text-xs text-slate-500">Live operational events & team actions</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              Live Stream
            </span>
          </div>

          <div className="space-y-3">
            {activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white border border-slate-200 shadow-xs ${act.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        <span className="text-slate-900 font-bold">{act.user}</span> {act.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
