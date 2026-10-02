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
  FileText,
  Send,
  CheckCircle2,
  Clock3,
  Building2,
  Plus,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Sparkles,
  CalendarDays,
  FileCheck,
  ArrowUpRight,
  Sun,
  Laptop,
  AlertCircle,
  Check,
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
import { submitClientReport } from "@/actions/reports";

interface EmployeeReportsClientProps {
  reports: any;
  clientReports?: any[];
  userRole?: string;
  user?: any;
}

export function EmployeeReportsClient({
  reports,
  clientReports = [],
  userRole = "EMPLOYEE",
  user,
}: EmployeeReportsClientProps) {
  // Navigation tabs: "ALL_REPORTS" | "DAILY" | "WEEKLY" | "CLIENT" | "MY_KPI" | "ATTENDANCE"
  const [activeTab, setActiveTab] = useState<
    "ALL_REPORTS" | "DAILY" | "WEEKLY" | "CLIENT" | "MY_KPI" | "ATTENDANCE"
  >("DAILY");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reportsList, setReportsList] = useState<any[]>(clientReports);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Report Submission Form State
  const [formData, setFormData] = useState({
    reportType: "DAILY" as "DAILY" | "WEEKLY" | "MONTHLY" | "CLIENT" | "INCIDENT",
    customerName: "",
    projectTitle: "",
    status: "IN_PROGRESS",
    summary: "",
    deliverables: "",
    nextWeekPlan: "",
    blockers: "",
    hoursSpent: 8,
  });

  const handleOpenModal = (type: "DAILY" | "WEEKLY" | "MONTHLY" | "CLIENT" = "DAILY") => {
    setFormData((prev) => ({
      ...prev,
      reportType: type,
      customerName: type === "CLIENT" ? "" : "Internal Project",
      projectTitle: type === "DAILY" ? `Daily Standup - ${new Date().toLocaleDateString()}` : type === "WEEKLY" ? `Weekly Milestone - Week ${Math.ceil(new Date().getDate() / 7)}` : prev.projectTitle,
    }));
    setShowSubmitModal(true);
  };

  const handleClientReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitClientReport(formData);
      setReportsList([
        {
          id: String(Date.now()),
          submittedBy: user?.name || "Team Member",
          reportType: formData.reportType,
          customerName: formData.customerName || "Internal Operations",
          projectTitle: formData.projectTitle,
          status: formData.status,
          summary: formData.summary,
          deliverables: formData.deliverables,
          nextWeekPlan: formData.nextWeekPlan,
          blockers: formData.blockers,
          hoursSpent: formData.hoursSpent,
          createdAt: new Date().toISOString(),
        },
        ...reportsList,
      ]);
      setShowSubmitModal(false);
      setFormData({
        reportType: "DAILY",
        customerName: "",
        projectTitle: "",
        status: "IN_PROGRESS",
        summary: "",
        deliverables: "",
        nextWeekPlan: "",
        blockers: "",
        hoursSpent: 8,
      });
      alert(`✓ ${formData.reportType} work report submitted successfully!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const performanceTrend = [
    { period: "Mon", hours: 8.5, tasks: 3 },
    { period: "Tue", hours: 9.0, tasks: 4 },
    { period: "Wed", hours: 8.0, tasks: 2 },
    { period: "Thu", hours: 8.5, tasks: 5 },
    { period: "Fri", hours: 7.5, tasks: 3 },
  ];

  const dailyCount = reportsList.filter((r) => r.reportType === "DAILY").length;
  const weeklyCount = reportsList.filter((r) => r.reportType === "WEEKLY").length;
  const clientCount = reportsList.filter((r) => r.reportType === "CLIENT" || r.reportType === "MONTHLY").length;

  const filteredReports = reportsList.filter((r) => {
    const matchesTab =
      activeTab === "ALL_REPORTS" ||
      (activeTab === "DAILY" && r.reportType === "DAILY") ||
      (activeTab === "WEEKLY" && r.reportType === "WEEKLY") ||
      (activeTab === "CLIENT" && (r.reportType === "CLIENT" || r.reportType === "MONTHLY"));

    const matchesSearch =
      r.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.deliverables?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const sidebarSections = [
    { id: "DAILY", label: "Daily Work Reports", icon: Sun, desc: "Daily standup & task logs", count: dailyCount, color: "text-amber-500" },
    { id: "WEEKLY", label: "Weekly Progress Reports", icon: CalendarDays, desc: "Weekly milestones & roadmaps", count: weeklyCount, color: "text-blue-500" },
    { id: "CLIENT", label: "Client & Milestone Reports", icon: Briefcase, desc: "Client deliverables", count: clientCount, color: "text-purple-500" },
    { id: "ALL_REPORTS", label: "All Logs & History", icon: FileText, desc: "Comprehensive report archive", count: reportsList.length, color: "text-indigo-500" },
    { id: "MY_KPI", label: "My KPI & Analytics", icon: TrendingUp, desc: "Personal productivity scores", color: "text-emerald-500" },
    { id: "ATTENDANCE", label: "Shift Timesheet Summary", icon: Clock, desc: "Logged hours & attendance", color: "text-cyan-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-4 transition-all select-none shadow-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Employee Work Reports</h2>
                  <p className="text-[10px] text-slate-500 truncate">Daily, Weekly & Project Reports</p>
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

          {/* Quick Submit Buttons in Sidebar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOpenModal("DAILY")}
              className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>+ Daily</span>
            </button>
            <button
              onClick={() => handleOpenModal("WEEKLY")}
              className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>+ Weekly</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Report Categories
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {sidebarSections.map((sec) => {
                const isActive = activeTab === sec.id;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveTab(sec.id as any)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : sec.color)} />
                      <div className="min-w-0">
                        <div className="truncate">{sec.label}</div>
                      </div>
                    </div>
                    {sec.count !== undefined && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ml-2",
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                        )}
                      >
                        {sec.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-auto space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manager Notification</span>
            </div>
            <p className="text-[10px] text-slate-500">Daily and weekly reports submitted are instantly visible to reporting leads.</p>
          </div>
        </aside>
      ) : (
        <div className="hidden md:flex flex-col items-center py-4 px-2 bg-white border-r border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            title="Expand sidebar"
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 transition-all shadow-xs cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {activeTab === "DAILY" && "Daily Work Reports"}
              {activeTab === "WEEKLY" && "Weekly Progress Reports"}
              {activeTab === "CLIENT" && "Client & Project Milestone Reports"}
              {activeTab === "ALL_REPORTS" && "All Work Reports Archive"}
              {activeTab === "MY_KPI" && "Personal KPI & Productivity Analytics"}
              {activeTab === "ATTENDANCE" && "Shift Attendance & Working Hours"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit daily standup updates, log weekly achievements, track blockers, and share project milestones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal(activeTab === "WEEKLY" ? "WEEKLY" : activeTab === "CLIENT" ? "CLIENT" : "DAILY")}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit {activeTab === "WEEKLY" ? "Weekly" : activeTab === "CLIENT" ? "Client" : "Daily"} Report</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="DAILY REPORTS FILED"
            value={dailyCount}
            trend="Active streak"
            comparisonText="standup logs"
            isPositive={true}
            icon={Sun}
            iconColor="text-amber-600 bg-amber-50 border-amber-200"
          />
          <KpiCard
            title="WEEKLY ROADMAPS"
            value={weeklyCount}
            comparisonText="sprint reviews"
            isPositive={true}
            icon={CalendarDays}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />
          <KpiCard
            title="CLIENT DELIVERABLES"
            value={clientCount}
            comparisonText="milestone reports"
            isPositive={true}
            icon={Briefcase}
            iconColor="text-purple-600 bg-purple-50 border-purple-200"
          />
          <KpiCard
            title="COMPLIANCE RATING"
            value="100%"
            trend="On-Time"
            comparisonText="reporting consistency"
            isPositive={true}
            icon={CheckCircle2}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
        </div>

        {/* ================= REPORTS LIST VIEW (DAILY, WEEKLY, CLIENT, ALL) ================= */}
        {["DAILY", "WEEKLY", "CLIENT", "ALL_REPORTS"].includes(activeTab) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <input
                type="text"
                placeholder="Search report titles, deliverables or summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs font-mono text-slate-500">
                Showing {filteredReports.length} report(s)
              </span>
            </div>

            <div className="space-y-4">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase",
                          rep.reportType === "DAILY"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : rep.reportType === "WEEKLY"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-purple-50 text-purple-800 border border-purple-200"
                        )}
                      >
                        {rep.reportType} REPORT
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{rep.projectTitle}</h3>
                      {rep.customerName && (
                        <span className="text-xs text-slate-500 font-mono">• {rep.customerName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{formatDate(rep.createdAt)}</span>
                      <StatusBadge status={rep.status} size="sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                        Summary & Progress
                      </span>
                      <p className="text-slate-800 leading-relaxed">{rep.summary || "Tasks on track."}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">
                        Delivered & Shipped
                      </span>
                      <p className="text-emerald-950 leading-relaxed">{rep.deliverables || "Completed assigned tickets."}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold text-blue-800 uppercase font-mono">
                        Next Plan / Road Ahead
                      </span>
                      <p className="text-blue-950 leading-relaxed">{rep.nextWeekPlan || "Proceeding to next sprint phase."}</p>
                    </div>
                  </div>

                  {rep.blockers && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Blockers / Impediments:</strong> {rep.blockers}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No {activeTab.toLowerCase()} reports found</p>
                  <p className="text-[11px] text-slate-400">Click &quot;Submit Report&quot; to file your standup or progress update.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MY KPI TAB ================= */}
        {activeTab === "MY_KPI" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Weekly Task & Productivity Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTrend}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ================= ATTENDANCE TAB ================= */}
        {activeTab === "ATTENDANCE" && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Shift Type</th>
                  <th className="py-3 px-4 text-center">Working Hours</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports?.attendances?.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700">{formatDate(att.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Standard Shift (HQ)</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                      {Math.floor((att.workingHoursMin || 480) / 60)}h {(att.workingHoursMin || 480) % 60}m
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={att.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: SUBMIT REPORT ================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit {formData.reportType} Work Report
                </h3>
                <p className="text-xs text-slate-500">Log your tasks, achievements, roadblocks and next steps</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClientReportSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Report Frequency *</label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="DAILY">Daily Standup Report</option>
                    <option value="WEEKLY">Weekly Progress Report</option>
                    <option value="MONTHLY">Monthly Milestone Report</option>
                    <option value="CLIENT">Client Project Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Status / Health</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="IN_PROGRESS">IN PROGRESS (On Track)</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Report Title / Sprint Goal *</label>
                <input
                  type="text"
                  required
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Project / Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Core ERP, CRM, Tech, HR"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hours Spent</label>
                  <input
                    type="number"
                    value={formData.hoursSpent}
                    onChange={(e) => setFormData({ ...formData, hoursSpent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Executive Summary / What did you work on? *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Key activities carried out during this period..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Key Deliverables & Shipped Items *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Items delivered, features coded, tickets solved..."
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Next Plan (Tomorrow / Next Week)</label>
                <textarea
                  rows={2}
                  placeholder="What is planned next..."
                  value={formData.nextWeekPlan}
                  onChange={(e) => setFormData({ ...formData, nextWeekPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Blockers / Dependencies (Optional)</label>
                <input
                  type="text"
                  placeholder="Any roadblock waiting on approvals, APIs or client input..."
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
