"use client";

import { useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  User,
  AlertCircle,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List,
  PanelLeftClose,
  PanelLeft,
  Layers,
  Sparkles,
  Timer,
  FileEdit,
  TrendingUp,
  MessageSquare,
  Check,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { createTask, updateTaskStatus, logTaskHourlyProgress } from "@/actions/tasks";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";

interface TasksClientProps {
  tasks: any[];
  employees: any[];
  userRole: string;
}

export function TasksClient({ tasks: initialTasks, employees, userRole }: TasksClientProps) {
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Hourly Progress Logging Modal State
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<any | null>(null);
  const [progressHours, setProgressHours] = useState<number>(1);
  const [progressStatus, setProgressStatus] = useState<string>("IN_PROGRESS");
  const [progressNote, setProgressNote] = useState<string>("");
  const [logLoading, setLogLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: employees[0]?.id || "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
    estimatedHours: 8,
  });

  const [loading, setLoading] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTask = await createTask(formData);
      setTasks([newTask, ...tasks]);
      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        assignedToId: employees[0]?.id || "",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedHours: 8,
      });
      alert(`Daily Task ${newTask.taskCode} created and assigned!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status, completedDate: updated.completedDate } : t)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openLogProgressModal = (task: any) => {
    setSelectedTaskForProgress(task);
    setProgressHours(1);
    setProgressStatus(task.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS");
    setProgressNote("");
  };

  const handleLogProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForProgress) return;
    setLogLoading(true);
    try {
      const updated = await logTaskHourlyProgress({
        taskId: selectedTaskForProgress.id,
        hoursSpent: progressHours,
        progressNote,
        newStatus: progressStatus,
      });
      setTasks(tasks.map((t) => (t.id === selectedTaskForProgress.id ? { ...t, ...updated } : t)));
      alert(`Progress logged! Added ${progressHours} hr(s) to ${selectedTaskForProgress.taskCode}`);
      setSelectedTaskForProgress(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLogLoading(false);
    }
  };

  // Quick 1-click +1h logger
  const handleQuickAddHour = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await logTaskHourlyProgress({
        taskId: task.id,
        hoursSpent: 1,
        progressNote: "1 hour completed on task",
        newStatus: task.status === "PENDING" ? "IN_PROGRESS" : task.status,
      });
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesTab = activeTab === "ALL" || t.status === activeTab;
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.taskCode?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const boardColumns = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const compCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter((t) => t.status === "OVERDUE").length;

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);

  const taskCategories = [
    { key: "ALL", label: "All Sprint Tasks", icon: Layers, count: tasks.length, color: "text-blue-500" },
    { key: "PENDING", label: "Pending Backlog", icon: Clock, count: pendingCount, color: "text-amber-500" },
    { key: "IN_PROGRESS", label: "In Development", icon: CheckSquare, count: inProgCount, color: "text-indigo-500" },
    { key: "COMPLETED", label: "Delivered & Done", icon: CheckCircle2, count: compCount, color: "text-emerald-500" },
    { key: "OVERDUE", label: "Overdue Resolution", icon: AlertTriangle, count: overdueCount, color: "text-rose-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Tasks Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          {/* Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Daily Tasks & Sprints</h2>
                  <p className="text-[10px] text-slate-500 truncate">Hourly Completion & Progress</p>
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

          {/* Sprint Status Navigation */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Sprint Stages
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {taskCategories.map((cat) => {
                const isActive = activeTab === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveTab(cat.key)}
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
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Daily Work Completion Widget in Sidebar */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-blue-950">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-700" />
                <span>Daily Logged Hours</span>
              </div>
              <span className="font-mono text-[11px] text-blue-800">
                {totalActualHours} / {totalEstimatedHours}h
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0
                  )}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-blue-800 leading-tight">
              Report your completed hours (1h, 2h, etc.) on each assigned daily task to track sprint completion.
            </p>
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
              Daily Tasks & Sprint Deliverables
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily Task Assignment, Hourly Progress Logging (1h, 2h, etc.) & Agile Work Tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Board vs List */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button
                onClick={() => setViewMode("BOARD")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "BOARD" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewMode("LIST")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "LIST" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {["ADMIN", "MANAGER"].includes(userRole) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Daily Task</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="PENDING BACKLOG"
            value={pendingCount}
            comparisonText="queued for today"
            isPositive={true}
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 border-amber-200"
          />

          <KpiCard
            title="IN DEVELOPMENT"
            value={inProgCount}
            comparisonText="actively being worked on"
            isPositive={true}
            icon={CheckSquare}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />

          <KpiCard
            title="HOURLY TIME LOGGED"
            value={`${totalActualHours}h / ${totalEstimatedHours}h`}
            trend={`${totalEstimatedHours > 0 ? Math.round((totalActualHours / totalEstimatedHours) * 100) : 0}% logged`}
            comparisonText="progress rate"
            isPositive={true}
            icon={Timer}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
          />

          <KpiCard
            title="DELIVERED & DONE"
            value={compCount}
            trend={`${tasks.length > 0 ? Math.round((compCount / tasks.length) * 100) : 0}% rate`}
            comparisonText="completed deliverables"
            isPositive={true}
            icon={CheckCircle2}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks by title, code or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Showing {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Task Board View */}
        {viewMode === "BOARD" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {boardColumns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col);
              return (
                <div key={col} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 font-mono">{col.replace("_", " ")}</span>
                    <span className="w-5 h-5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold flex items-center justify-center text-slate-700">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => {
                      const est = Number(task.estimatedHours) || 1;
                      const act = Number(task.actualHours) || 0;
                      const pct = Math.min(100, Math.round((act / est) * 100));

                      return (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-white space-y-2.5 transition-all shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">{task.title}</span>
                            <StatusBadge status={task.priority} size="sm" />
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-2">{task.description}</p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono">{task.assignedTo?.user?.name || "Unassigned"}</span>
                            <span className="font-mono text-blue-600 font-medium">Due: {formatDate(task.dueDate)}</span>
                          </div>

                          {/* Hourly Progress Bar */}
                          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Timer className="w-3 h-3 text-blue-600" />
                                <span>Progress: {act}h / {est}h</span>
                              </span>
                              <span className="font-mono font-bold text-blue-700">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full transition-all duration-300",
                                  pct >= 100 ? "bg-emerald-500" : pct > 50 ? "bg-blue-600" : "bg-amber-500"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Buttons: Log Hours & Status Change */}
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="py-1 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 focus:outline-none focus:border-blue-500"
                            >
                              {boardColumns.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1.5">
                              {/* Quick +1 Hour Button */}
                              <button
                                type="button"
                                onClick={(e) => handleQuickAddHour(task, e)}
                                title="Quickly add 1 hour completed"
                                className="px-1.5 py-1 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer"
                              >
                                +1h
                              </button>

                              {/* Detailed Hourly Report Button */}
                              <button
                                type="button"
                                onClick={() => openLogProgressModal(task)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <FileEdit className="w-3 h-3" />
                                <span>Report</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                        No tasks in {col.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Task Code</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4 text-center">Hours (Actual / Est)</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((t) => {
                    const est = Number(t.estimatedHours) || 1;
                    const act = Number(t.actualHours) || 0;
                    const pct = Math.min(100, Math.round((act / est) * 100));

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{t.taskCode}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{t.title}</div>
                          {t.description && <p className="text-[11px] text-slate-500 truncate max-w-xs">{t.description}</p>}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{t.assignedTo?.user?.name || "Unassigned"}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="font-mono font-bold text-slate-900">
                            {act}h / {est}h <span className="text-blue-600 text-[10px]">({pct}%)</span>
                          </div>
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={t.priority} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleQuickAddHour(t, e)}
                              className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                            >
                              +1h
                            </button>
                            <button
                              type="button"
                              onClick={() => openLogProgressModal(t)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Report Progress</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No tasks match the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal 1: Hourly Progress & Task Completion Report */}
        {selectedTaskForProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Log Hourly Progress</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{selectedTaskForProgress.taskCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskForProgress(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Summary Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">{selectedTaskForProgress.title}</div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Assigned To: <strong>{selectedTaskForProgress.assignedTo?.user?.name || "Unassigned"}</strong></span>
                  <span>Estimated: <strong>{selectedTaskForProgress.estimatedHours || 0} hrs</strong></span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Already Logged: <strong className="text-blue-600">{selectedTaskForProgress.actualHours || 0} hrs</strong></span>
                  <span>Due: <strong>{formatDate(selectedTaskForProgress.dueDate)}</strong></span>
                </div>
              </div>

              <form onSubmit={handleLogProgressSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Hours Worked / Completed in this session *
                  </label>
                  {/* Quick Pill Buttons */}
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 8].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setProgressHours(h)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          progressHours === h
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        +{h} {h === 1 ? "hr" : "hrs"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.25}
                      step={0.25}
                      required
                      value={progressHours}
                      onChange={(e) => setProgressHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-500 font-mono shrink-0">Hours</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    New Total will become: <strong>{(Number(selectedTaskForProgress.actualHours) || 0) + Number(progressHours)} hrs</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Update Task Status</label>
                  <select
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="IN_PROGRESS">IN PROGRESS (Work Ongoing)</option>
                    <option value="COMPLETED">COMPLETED (Delivered & Done)</option>
                    <option value="PENDING">PENDING (On Hold / Paused)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Progress Description / Work Done Note (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Completed wireframes in 2 hours, now setting up database integration..."
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskForProgress(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{logLoading ? "Logging..." : "Submit Progress"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Create / Assign Daily Task */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Assign Daily Task</h3>
                    <p className="text-[11px] text-slate-500">Agile Sprint & Daily Deliverables</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design Landing Page or Fix Auth Bug"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Task Description & Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific milestones or acceptance criteria..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assign to Employee *</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name} ({emp.employeeCode}) {emp.designation?.name ? `• ${emp.designation.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? "Creating..." : "Assign Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
