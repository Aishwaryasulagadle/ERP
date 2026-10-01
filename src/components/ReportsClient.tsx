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

interface ReportsClientProps {
  reports: any;
  clientReports?: any[];
  userRole?: string;
  user?: any;
}

export function ReportsClient({
  reports,
  clientReports = [],
  userRole = "EMPLOYEE",
  user,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "SALES" | "CRM" | "EMPLOYEES" | "TASKS" | "CLIENT_REPORTS"
  >("SALES");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reportsList, setReportsList] = useState<any[]>(clientReports);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Client Report Submission Form State
  const [formData, setFormData] = useState({
    customerName: "",
    projectTitle: "",
    status: "IN_PROGRESS",
    summary: "",
    deliverables: "",
    nextWeekPlan: "",
  });

  const handleExport = (format: "CSV" | "PDF") => {
    alert(`Exporting verified ${activeTab} enterprise report in ${format} format.`);
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
          customerName: formData.customerName,
          projectTitle: formData.projectTitle,
          status: formData.status,
          summary: formData.summary,
          deliverables: formData.deliverables,
          nextWeekPlan: formData.nextWeekPlan,
          createdAt: new Date().toISOString(),
        },
        ...reportsList,
      ]);
      setShowSubmitModal(false);
      setFormData({
        customerName: "",
        projectTitle: "",
        status: "IN_PROGRESS",
        summary: "",
        deliverables: "",
        nextWeekPlan: "",
      });
      alert("Client report submitted successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
    { id: "CLIENT_REPORTS", label: "Client Reporting", icon: FileText, desc: "Weekly project tracking", count: reportsList.length, color: "text-sky-500" },
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
                  <h2 className="font-bold text-xs text-slate-900 truncate">Reports Hub</h2>
                  <p className="text-[10px] text-slate-500 truncate">Analytics & Client Reporting</p>
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
              Audit & Reports Modules
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
                      "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : cat.color)} />
                      <div className="min-w-0">
                        <span className="truncate block">{cat.label}</span>
                      </div>
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

      {/* Main Content Workspace */}
      <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {activeTab === "SALES" && "Sales & Revenue Analytics"}
              {activeTab === "CRM" && "CRM Conversion & Pipeline Funnel"}
              {activeTab === "CLIENT_REPORTS" && "Client Progress Reporting"}
              {activeTab === "EMPLOYEES" && "Staff Performance Audit"}
              {activeTab === "TASKS" && "Sprint Velocity & Deliverables"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise Data Intelligence, Audit Logs, and Client Reports Tracker
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {activeTab === "CLIENT_REPORTS" && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Client Report</span>
              </button>
            )}
            <button
              onClick={() => handleExport("CSV")}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport("PDF")}
              className="px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>PDF Summary</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sales Analytics */}
        {activeTab === "SALES" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="TOTAL REVENUE"
                value="₹5,65,000"
                trend="↑ 12.4%"
                comparisonText="vs previous month"
                isPositive={true}
                icon={TrendingUp}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />
              <KpiCard
                title="PAID INVOICES"
                value="94.2%"
                trend="↑ 2.1%"
                comparisonText="collection rate"
                isPositive={true}
                icon={CheckCircle}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Weekly Revenue Inflow</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradient)" />
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
              <h3 className="text-base font-bold text-slate-900">Channel Acquisition & Closure</h3>
              <div className="h-72">
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

        {/* Tab 3: Client Reporting (Team Submission & Admin Oversight) */}
        {activeTab === "CLIENT_REPORTS" && (
          <div className="space-y-6">
            {/* Overview Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Client Milestone & Progress Reports
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  Employees submit weekly progress updates; Admin tracks deliverables and client satisfaction.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                + New Client Report
              </button>
            </div>

            {/* Reports Feed */}
            <div className="space-y-4">
              {reportsList.length > 0 ? (
                reportsList.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{rep.projectTitle}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {rep.customerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Submitted by <span className="font-bold text-slate-700">{rep.submittedBy}</span> • {formatDate(rep.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={rep.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Executive Summary</span>
                        <p className="text-slate-600 leading-relaxed">{rep.summary || "No summary provided."}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                        <span className="font-bold text-emerald-800 block mb-1">Key Deliverables</span>
                        <p className="text-slate-600 leading-relaxed">{rep.deliverables || "Standard weekly milestones completed."}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
                        <span className="font-bold text-indigo-800 block mb-1">Next Week Roadmap</span>
                        <p className="text-slate-600 leading-relaxed">{rep.nextWeekPlan || "Sprint planning aligned with client."}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No client reports filed yet</p>
                  <p className="text-xs">Click &quot;Submit Client Report&quot; to log your team&apos;s weekly deliverables.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Employee Performance & Matrix */}
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

        {/* Tab 5: Tasks Velocity */}
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

      {/* Modal: Submit Client Report */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Submit Client Progress Report</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClientReportSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Global Industries"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Project Milestone Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phase 2 Architecture Review"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Milestone Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ACTION_NEEDED">ACTION NEEDED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Executive Summary</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of deliverables achieved this sprint..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Key Deliverables & Proof</label>
                <textarea
                  rows={2}
                  placeholder="Tasks, deployments, or artifacts handed over..."
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Next Week Roadmap</label>
                <textarea
                  rows={2}
                  placeholder="What is planned for the client next week..."
                  value={formData.nextWeekPlan}
                  onChange={(e) => setFormData({ ...formData, nextWeekPlan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
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
