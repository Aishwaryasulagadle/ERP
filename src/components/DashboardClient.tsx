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

  // 4. Employee Performance Table (Uses dynamic department staff from backend)
  const employeeRows =
    metrics.employeeRows && metrics.employeeRows.length > 0
      ? metrics.employeeRows
      : [
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || "Admin"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isMarketing
              ? "Digital Marketing Operations • Deliverables, Social Campaigns, Reels & Team Performance."
              : isTech
              ? "Technical & IT Engineering • Code Sprints, Milestones, Deployments & System Status."
              : isSales
              ? "Sales & Deal Operations • Pipeline Velocity, Inbound Leads, and Revenue Solvency."
              : "Global Executive Overview • Synced across Sales, Digital Marketing, and Technical Departments."}
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
              <span>Actions</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showQuickActionMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                {(isSales || isAdmin) && (
                  <>
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
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Sales Ledger</span>
                    </Link>
                  </>
                )}
                <Link
                  href="/employees?tab=TASKS"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Sprint Tasks</span>
                </Link>
                {(isMarketing || isTech || isAdmin) && (
                  <Link
                    href="/reports"
                    onClick={() => setShowQuickActionMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>+ Client Accounts</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">Live Dashboard</span>
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
            iconColor="text-purple-600 bg-purple-50 border-purple-200"
          />
          <KpiCard
            title="REELS & POSTS"
            value={`${metrics.clientStats?.totalCompletedDeliverables || 0}/${metrics.clientStats?.totalTargetDeliverables || 0}`}
            trend="Deliverables"
            comparisonText="this month's targets"
            isPositive={true}
            icon={Target}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />
          <KpiCard
            title="DELIVERY VELOCITY"
            value={`${metrics.clientStats?.deliverableCompletionRate || 0}%`}
            trend="On Track"
            comparisonText="monthly delivery rate"
            isPositive={true}
            icon={Sparkles}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
          <KpiCard
            title="TEAM ATTENDANCE"
            value={`${presentToday}/${totalEmp}`}
            comparisonText="staff present today"
            isPositive={true}
            icon={Users}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
          />
          <KpiCard
            title="SPRINT COMPLETION"
            value={`${taskRate}%`}
            trend="+5.4%"
            comparisonText="tasks resolved"
            isPositive={true}
            icon={CheckSquare}
            iconColor="text-amber-600 bg-amber-50 border-amber-200"
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
            iconColor="text-cyan-600 bg-cyan-50 border-cyan-200"
          />
          <KpiCard
            title="MILESTONES SHIPPED"
            value={`${metrics.clientStats?.totalCompletedDeliverables || 0}/${metrics.clientStats?.totalTargetDeliverables || 0}`}
            trend="Shipped"
            comparisonText="milestones completed"
            isPositive={true}
            icon={Target}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />
          <KpiCard
            title="SPRINT VELOCITY"
            value={`${metrics.clientStats?.deliverableCompletionRate || 0}%`}
            trend="Velocity"
            comparisonText="architecture progress"
            isPositive={true}
            icon={Sparkles}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
          <KpiCard
            title="DEV ATTENDANCE"
            value={`${presentToday}/${totalEmp}`}
            comparisonText="engineers active"
            isPositive={true}
            icon={Users}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
          />
          <KpiCard
            title="SPRINT TASKS"
            value={`${taskRate}%`}
            trend="Done"
            comparisonText="tickets completed"
            isPositive={true}
            icon={CheckSquare}
            iconColor="text-violet-600 bg-violet-50 border-violet-200"
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
            comparisonText="deal velocity"
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
      )}


      {/* 3. Dynamic Department-Tailored Velocity & Production Chart */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {isMarketing
                ? "Content & Campaign Deliverables Output"
                : isTech
                ? "Code Sprints & Milestone Progress"
                : "Sales & Deal Turnover Velocity"}
            </h3>
            <p className="text-xs text-slate-500">
              {isMarketing
                ? "Weekly completed reels, creatives, and ad campaign rollouts"
                : isTech
                ? "Weekly completed engineering tasks, commits, and sprint deliverables"
                : "Revenue over time and deal turnover velocity across pipelines"}
            </p>
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

        {/* Department Tailored Metric Summary Ribbon */}
        {isMarketing ? (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[11px] text-purple-700 font-medium">Monthly Target Deliverables</span>
              <p className="text-xl font-bold text-purple-900 font-mono mt-0.5">
                {metrics.clientStats?.totalTargetDeliverables || 48} Creatives
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 font-medium">Completed & Published</span>
              <p className="text-xl font-bold text-emerald-800 font-mono mt-0.5">
                {metrics.clientStats?.totalCompletedDeliverables || 36} Published
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] text-blue-700 font-medium">On-Track Delivery Rate</span>
              <p className="text-xl font-bold text-blue-800 font-mono mt-0.5">
                {metrics.clientStats?.deliverableCompletionRate || 75}%
              </p>
            </div>
          </div>
        ) : isTech ? (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
              <span className="text-[11px] text-cyan-700 font-medium">Sprint Milestones</span>
              <p className="text-xl font-bold text-cyan-900 font-mono mt-0.5">
                {metrics.clientStats?.totalTargetDeliverables || 32} Modules
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 font-medium">Shipped & Verified</span>
              <p className="text-xl font-bold text-emerald-800 font-mono mt-0.5">
                {metrics.clientStats?.totalCompletedDeliverables || 27} Deployed
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-[11px] text-indigo-700 font-medium">Sprint Completion Rate</span>
              <p className="text-xl font-bold text-indigo-800 font-mono mt-0.5">
                {metrics.clientStats?.deliverableCompletionRate || 84}%
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Total Revenue</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">{formatCurrency(totalRev)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Orders Closed</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{metrics.kpis?.totalOrdersCount || 126}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Average Order Value</span>
              <p className="text-xl font-bold text-blue-600 font-mono mt-0.5">₹4,484</p>
            </div>
          </div>
        )}

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={
                isMarketing
                  ? [
                      { name: "Mon", output: 5, target: 8 },
                      { name: "Tue", output: 8, target: 8 },
                      { name: "Wed", output: 12, target: 10 },
                      { name: "Thu", output: 14, target: 12 },
                      { name: "Fri", output: 11, target: 10 },
                      { name: "Sat", output: 6, target: 6 },
                      { name: "Sun", output: 2, target: 0 },
                    ]
                  : isTech
                  ? [
                      { name: "Sprint 1", output: 18, target: 20 },
                      { name: "Sprint 2", output: 24, target: 25 },
                      { name: "Sprint 3", output: 28, target: 30 },
                      { name: "Sprint 4", output: 31, target: 32 },
                    ]
                  : currentChartData
              }
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isMarketing ? "#9333EA" : isTech ? "#06B6D4" : "#2563EB"}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={isMarketing ? "#9333EA" : isTech ? "#06B6D4" : "#2563EB"}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (isMarketing || isTech ? `${v}` : `₹${v / 1000}k`)}
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
                formatter={(value: any) => [
                  isMarketing ? `${value} Deliverables` : isTech ? `${value} Tasks Completed` : formatCurrency(Number(value)),
                  isMarketing ? "Output" : isTech ? "Shipped" : "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey={isMarketing || isTech ? "output" : "sales"}
                stroke={isMarketing ? "#9333EA" : isTech ? "#06B6D4" : "#2563EB"}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#primaryGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CRM Pipeline Funnel (Only for Sales & Admin) OR Client Accounts & Deliverables (For Marketing & Tech) */}
      {isMarketing || isTech ? (
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
                      <span className="font-bold text-purple-600 font-mono">
                        {c.departmentType === "DIGITAL_MARKETING" ? "Marketing Retainer" : "Tech Retainer"}
                      </span>
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

      {/* 5. Team Velocity & Department Operations Grid (Scoped by Role & Department) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance & Task Velocity (7 Cols) */}
        <div className={isAdmin || isSales ? "lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4" : "lg:col-span-12 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {isMarketing
                  ? "Marketing Team Execution Velocity"
                  : isTech
                  ? "Engineering Sprint & Task Progress"
                  : "Sales Rep Performance & Conversions"}
              </h3>
              <p className="text-xs text-slate-500">
                {isMarketing
                  ? "Deliverables, reels, creatives completed, and task completion percentage"
                  : isTech
                  ? "Architecture deliverables shipped, bugs resolved, and sprint velocity"
                  : "Ranked by revenue closed and deal conversion velocity"}
              </p>
            </div>
            <Link href="/employees" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View Team Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Team Member</th>
                  {isAdmin || isSales ? (
                    <>
                      <th className="py-2.5 px-3 text-center">Leads</th>
                      <th className="py-2.5 px-3 text-center">Converted</th>
                      <th className="py-2.5 px-3 text-right">Sales Closed</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-center">Assigned Projects</th>
                      <th className="py-2.5 px-3 text-center">Role</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-center">Sprint Tasks</th>
                  <th className="py-2.5 px-3 text-center">Completion Rate</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(isMarketing
                  ? [
                      { name: "Priya Sharma", role: "Digital Marketing Manager", projects: "All Clients", tasks: "18/20", completion: 90, status: "ACTIVE" },
                      { name: "Rahul Deshmukh", role: "Content & Reel Creator", projects: "4 Clients", tasks: "15/16", completion: 94, status: "ACTIVE" },
                      { name: "Sneha Patil", role: "Graphic & Ads Specialist", projects: "4 Clients", tasks: "17/18", completion: 94, status: "ACTIVE" },
                    ]
                  : isTech
                  ? [
                      { name: "Amit Kulkarni", role: "Technical Project Manager", projects: "All Tech Contracts", tasks: "19/20", completion: 95, status: "ACTIVE" },
                      { name: "Neha Joshi", role: "Senior Full Stack Dev", projects: "3 Contracts", tasks: "14/15", completion: 93, status: "ACTIVE" },
                      { name: "Vikram Shinde", role: "UI/UX & Mobile Engineer", projects: "3 Contracts", tasks: "16/18", completion: 89, status: "ACTIVE" },
                    ]
                  : employeeRows
                ).map((emp: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{emp.name}</td>
                    {isAdmin || isSales ? (
                      <>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{emp.leads}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-600 font-bold">{emp.converted}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono">
                          {formatCurrency(emp.sales)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{emp.projects}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{emp.role}</td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{emp.tasks}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={isMarketing ? "bg-purple-500 h-full rounded-full" : isTech ? "bg-cyan-500 h-full rounded-full" : "bg-emerald-500 h-full rounded-full"}
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

        {/* Recent Transactions (Visible for Sales & Admin Only) */}
        {(isAdmin || isSales) && (
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Sales Orders</h3>
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
        )}
      </div>

      {/* 6. Today's Department Operations & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Operational Run-Rate (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {isMarketing
                ? "Today's Content Run-Rate"
                : isTech
                ? "Today's Tech Operations"
                : "Today's Business Run-Rate"}
            </h3>
            <p className="text-xs text-slate-500">Live department metrics and milestones for today</p>
          </div>

          <div className="space-y-2.5">
            {isMarketing ? (
              <>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Reels & Videos Scheduled</span>
                  <span className="text-sm font-bold text-purple-700 font-mono">8</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Graphics & Posts Approved</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">14</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Active Ad Campaigns</span>
                  <span className="text-sm font-bold text-blue-600 font-mono">6</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Sprint Tasks Resolved</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">11</span>
                </div>
              </>
            ) : isTech ? (
              <>
                <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Deployments & Code Releases</span>
                  <span className="text-sm font-bold text-cyan-700 font-mono">4 Releases</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Active GitHub PRs Merged</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">9 Merged</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Sprint Tasks Resolved</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">16</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Engineers Punched In</span>
                  <span className="text-sm font-bold text-indigo-600 font-mono">{presentToday} Active</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
            {(isMarketing
              ? [
                  { time: "09:30", user: "Rahul Deshmukh", action: "published client weekly reel on Instagram", icon: Sparkles, color: "text-purple-500" },
                  { time: "10:15", user: "Sneha Patil", action: "uploaded 4 graphics for Meta ad campaign", icon: Briefcase, color: "text-blue-500" },
                  { time: "11:20", user: "Priya Sharma", action: "reviewed and approved client monthly progress report", icon: CheckSquare, color: "text-emerald-500" },
                  { time: "12:05", user: "Sneha Patil", action: "forwarded completed deliverables to sales for billing", icon: CheckCircle2, color: "text-amber-500" },
                ]
              : isTech
              ? [
                  { time: "09:45", user: "Neha Joshi", action: "committed and pushed fix for auth middleware", icon: Sparkles, color: "text-cyan-500" },
                  { time: "10:30", user: "Amit Kulkarni", action: "approved sprint code merge for client workspace", icon: CheckSquare, color: "text-indigo-500" },
                  { time: "11:10", user: "Vikram Shinde", action: "completed UI component for dynamic progress sheet", icon: Briefcase, color: "text-blue-500" },
                  { time: "11:55", user: "Neha Joshi", action: "deployed release to production server", icon: CheckCircle2, color: "text-emerald-500" },
                ]
              : activities
            ).map((act: any, i: number) => {
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
