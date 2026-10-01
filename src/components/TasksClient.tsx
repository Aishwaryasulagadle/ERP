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
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { createTask, updateTaskStatus } from "@/actions/tasks";
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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: employees[0]?.id || "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
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
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedHours: 8,
      });
      alert(`Task ${newTask.taskCode} created!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesTab = activeTab === "ALL" || t.status === activeTab;
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.taskCode?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.user?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const boardColumns = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const compCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter((t) => t.status === "OVERDUE").length;

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
                  <h2 className="font-bold text-xs text-slate-900 truncate">Tasks & Sprints</h2>
                  <p className="text-[10px] text-slate-500 truncate">Agile Board & Backlog</p>
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
              Task Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Agile Sprint Deliverables, Status Board & Work Assignments
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Board vs List */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button
                onClick={() => setViewMode("BOARD")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === "BOARD" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewMode("LIST")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === "LIST" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="PENDING"
          value={pendingCount}
          comparisonText="in backlog queue"
          isPositive={true}
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50 border-amber-200"
        />

        <KpiCard
          title="IN PROGRESS"
          value={inProgCount}
          comparisonText="active development"
          isPositive={true}
          icon={CheckSquare}
          iconColor="text-blue-600 bg-blue-50 border-blue-200"
        />

        <KpiCard
          title="COMPLETED"
          value={compCount}
          trend={`${tasks.length > 0 ? Math.round((compCount / tasks.length) * 100) : 0}% rate`}
          comparisonText="sprint deliveries"
          isPositive={true}
          icon={CheckCircle2}
          iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
        />

        <KpiCard
          title="OVERDUE"
          value={overdueCount}
          comparisonText="urgent resolution"
          isPositive={false}
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50 border-rose-200"
        />
      </div>

      {/* Search Bar */}
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
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-white space-y-2.5 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-snug">{task.title}</span>
                        <StatusBadge status={task.priority} size="sm" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono">{task.assignedTo?.user?.name || "Unassigned"}</span>
                        <span className="font-mono text-blue-600 font-medium">Due: {formatDate(task.dueDate)}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
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
                        <span className="text-[10px] font-mono text-slate-500">{task.taskCode}</span>
                      </div>
                    </div>
                  ))}

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
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{t.taskCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.title}</td>
                    <td className="py-3 px-4 text-slate-700">{t.assignedTo?.user?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={t.priority} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create Sprint Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned Employee</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name} ({emp.employeeCode})
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
                  <label className="block text-slate-700 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {loading ? "Creating..." : "Save Task"}
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
