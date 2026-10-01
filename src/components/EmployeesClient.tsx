"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Building,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  X,
  CheckCircle2,
  DollarSign,
  UserCheck,
  TrendingUp,
  Award,
  Activity,
  PanelLeftClose,
  PanelLeft,
  UserX,
  Layers,
  Clock,
  CheckSquare,
  Play,
  Square,
  Coffee,
  AlertTriangle,
  LayoutGrid,
  List,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime, cn } from "@/lib/utils";
import { createEmployee } from "@/actions/employees";
import { clockIn, clockOut, toggleBreak } from "@/actions/attendance";
import { createTask, updateTaskStatus } from "@/actions/tasks";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";

interface EmployeesClientProps {
  employees: any[];
  departments: any[];
  designations: any[];
  todayAttendance?: any;
  allAttendances?: any[];
  tasks?: any[];
  userRole: string;
}

export function EmployeesClient({
  employees: initialEmployees,
  departments,
  designations,
  todayAttendance: initialToday,
  allAttendances: initialAll = [],
  tasks: initialTasks = [],
  userRole,
}: EmployeesClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "DIRECTORY";

  // Tab State: "DIRECTORY" | "ATTENDANCE" | "TASKS"
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "ATTENDANCE" | "TASKS">(
    initialTab === "ATTENDANCE" || initialTab === "TASKS" ? initialTab : "DIRECTORY"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "ATTENDANCE" || tab === "TASKS" || tab === "DIRECTORY") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // General state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // 1. DIRECTORY STATE
  const [employees, setEmployees] = useState<any[]>(initialEmployees);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const [employeeFormData, setEmployeeFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: departments[0]?.id || "",
    designationId: designations[0]?.id || "",
    salary: 75000,
    role: "EMPLOYEE",
    address: "",
    emergencyContact: "",
  });

  // 2. ATTENDANCE STATE
  const [todayAttendance, setTodayAttendance] = useState<any | null>(initialToday);
  const [allAttendances, setAllAttendances] = useState<any[]>(initialAll);
  const [attendanceFilter, setAttendanceFilter] = useState("ALL");

  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);
  const ongoingBreak = todayAttendance?.breaks?.find((b: any) => !b.endTime);

  // 3. TASKS STATE
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [taskStageFilter, setTaskStageFilter] = useState("ALL");
  const [taskViewMode, setTaskViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [taskSearch, setTaskSearch] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignedToId: employees[0]?.id || "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
    estimatedHours: 8,
  });

  // Handlers - Employees
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEmp = await createEmployee(employeeFormData);
      setEmployees([...employees, newEmp]);
      setShowAddEmployeeModal(false);
      setEmployeeFormData({
        name: "",
        email: "",
        phone: "",
        departmentId: departments[0]?.id || "",
        designationId: designations[0]?.id || "",
        salary: 75000,
        role: "EMPLOYEE",
        address: "",
        emergencyContact: "",
      });
      alert(`Employee ${newEmp.employeeCode} created successfully!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Attendance
  const handleClockIn = async () => {
    setLoading(true);
    try {
      const res = await clockIn();
      setTodayAttendance(res);
      alert("Clocked in successfully!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const res = await clockOut();
      setTodayAttendance(res);
      alert("Clocked out successfully!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    setLoading(true);
    try {
      await toggleBreak();
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Tasks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTask = await createTask(taskFormData);
      setTasks([newTask, ...tasks]);
      setShowCreateTaskModal(false);
      setTaskFormData({
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

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTaskStatus(taskId, status);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtered lists
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDept === "ALL" || emp.departmentId === selectedDept;
    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    const matchesSearch =
      emp.user?.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.user?.email?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.designation?.name?.toLowerCase().includes(employeeSearch.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  const presentCount = allAttendances.filter((a) => a.status === "PRESENT").length;
  const lateCount = allAttendances.filter((a) => a.status === "LATE").length;
  const absentCount = allAttendances.filter((a) => a.status === "ABSENT").length;
  const leaveCount = allAttendances.filter((a) => a.status === "LEAVE").length;

  const filteredAttendances = allAttendances.filter((a) => {
    if (attendanceFilter === "ALL") return true;
    return a.status === attendanceFilter;
  });

  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgTasksCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const compTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueTasksCount = tasks.filter((t) => t.status === "OVERDUE").length;

  const filteredTasks = tasks.filter((t) => {
    const matchesTab = taskStageFilter === "ALL" || t.status === taskStageFilter;
    const matchesSearch =
      t.title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.taskCode?.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.assignedTo?.user?.name?.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const boardColumns = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

  // Sidebar main section tabs
  const mainSections = [
    { key: "DIRECTORY", label: "Staff Directory", icon: Users, count: employees.length, color: "text-blue-500" },
    { key: "ATTENDANCE", label: "Attendance & Shifts", icon: Clock, count: presentCount || allAttendances.length, color: "text-emerald-500" },
    { key: "TASKS", label: "Sprint Tasks", icon: CheckSquare, count: tasks.length, color: "text-indigo-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* People Operations Unified Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-4 transition-all select-none shadow-xs">
          {/* Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Workforce Hub</h2>
                  <p className="text-[10px] text-slate-500 truncate">Staff, Attendance & Tasks</p>
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

          {/* Module View Switcher */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Workforce Modules
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {mainSections.map((sec) => {
                const isActive = activeTab === sec.key;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setActiveTab(sec.key as any)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : sec.color)} />
                      <span className="truncate">{sec.label}</span>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ml-2",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      )}
                    >
                      {sec.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contextual Sub-filters according to the Active Tab */}
          {activeTab === "DIRECTORY" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              {/* Departments */}
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Departments
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedDept("ALL")}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                      selectedDept === "ALL"
                        ? "bg-slate-200/70 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <span>All Departments</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{employees.length}</span>
                  </button>
                  {departments.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDept(d.id)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        selectedDept === d.id
                          ? "bg-slate-200/70 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {employees.filter((e) => e.departmentId === d.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Staff Status
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Statuses", count: employees.length },
                    { key: "ACTIVE", label: "Active Staff", count: employees.filter((e) => e.status === "ACTIVE").length },
                    { key: "ON_LEAVE", label: "On Leave", count: employees.filter((e) => e.status === "ON_LEAVE").length },
                  ].map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setStatusFilter(st.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        statusFilter === st.key
                          ? "bg-slate-200/70 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{st.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{st.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ATTENDANCE" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Shift Filters
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Records", count: allAttendances.length },
                    { key: "PRESENT", label: "Present Today", count: presentCount },
                    { key: "LATE", label: "Late Arrivals", count: lateCount },
                    { key: "ABSENT", label: "Absent", count: absentCount },
                    { key: "LEAVE", label: "On Leave", count: leaveCount },
                  ].map((af) => (
                    <button
                      key={af.key}
                      onClick={() => setAttendanceFilter(af.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        attendanceFilter === af.key
                          ? "bg-slate-200/70 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{af.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{af.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>HQ Geofence Active</span>
                </div>
                <p className="text-[10px] text-slate-500">Auto-validates IP and coordinates for punches.</p>
              </div>
            </div>
          )}

          {activeTab === "TASKS" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Task Status
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Sprint Tasks", count: tasks.length },
                    { key: "PENDING", label: "Pending Backlog", count: pendingTasksCount },
                    { key: "IN_PROGRESS", label: "In Development", count: inProgTasksCount },
                    { key: "COMPLETED", label: "Delivered & Done", count: compTasksCount },
                    { key: "OVERDUE", label: "Overdue", count: overdueTasksCount },
                  ].map((ts) => (
                    <button
                      key={ts.key}
                      onClick={() => setTaskStageFilter(ts.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        taskStageFilter === ts.key
                          ? "bg-slate-200/70 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{ts.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{ts.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      {/* Main Workspace Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0">
        {/* ======================= TAB 1: EMPLOYEE DIRECTORY ======================= */}
        {activeTab === "DIRECTORY" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Employee Directory
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workforce Management, Attendance Records & Compensation
                </p>
              </div>

              {["ADMIN", "MANAGER"].includes(userRole) && (
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </button>
              )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="TOTAL HEADCOUNT"
                value={employees.length}
                trend="+3 this quarter"
                comparisonText="active staff"
                isPositive={true}
                icon={Users}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />

              <KpiCard
                title="DEPARTMENTS"
                value={departments.length}
                comparisonText="Sales, Tech, HR, Ops"
                isPositive={true}
                icon={Building}
                iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
              />

              <KpiCard
                title="ON-TIME ATTENDANCE"
                value="94.2%"
                trend="↑ 2.1%"
                comparisonText="monthly average"
                isPositive={true}
                icon={UserCheck}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />

              <KpiCard
                title="AVG PERFORMANCE"
                value="88.5%"
                trend="+5.4%"
                comparisonText="task & deal targets"
                isPositive={true}
                icon={Award}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedDept("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDept === "ALL"
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  All Departments ({employees.length})
                </button>
                {departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDept(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedDept === d.id
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {d.name} ({employees.filter((e) => e.departmentId === d.id).length})
                  </button>
                ))}
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Employee Directory Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Leads Managed</th>
                      <th className="py-3 px-4 text-center">Sprint Tasks</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold font-mono">
                              {emp.user?.name?.charAt(0) || "E"}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{emp.user?.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{emp.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{emp.designation?.name || "Executive"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-700">
                            {emp.department?.name || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={emp.status} />
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                          {emp.leads?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                          {emp.assignedTasks?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                          >
                            View 360° Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: ATTENDANCE & SHIFTS ======================= */}
        {activeTab === "ATTENDANCE" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Attendance & Shift Logs
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Punch Terminal, Shift Logs, Working Hours & Break Auditing
                </p>
              </div>
            </div>

            {/* Punch Terminal */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    09:42:15 AM
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>GPS Geofence: Office HQ (Verified)</span>
                    <span>•</span>
                    <span>IST (UTC+5:30)</span>
                  </div>
                </div>
              </div>

              {/* Punch Buttons */}
              <div className="flex items-center gap-3">
                {!isCheckedIn ? (
                  <button
                    onClick={handleClockIn}
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>PUNCH CLOCK IN</span>
                  </button>
                ) : !isCheckedOut ? (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleToggleBreak}
                      disabled={loading}
                      className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>{ongoingBreak ? "End Break" : "Start Break"}</span>
                    </button>
                    <button
                      onClick={handleClockOut}
                      disabled={loading}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>PUNCH CLOCK OUT</span>
                    </button>
                  </div>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                    ✓ Shift Completed (8h 15m logged)
                  </span>
                )}
              </div>
            </div>

            {/* Attendance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="PRESENT TODAY"
                value={presentCount || 29}
                trend="↑ 90.6%"
                comparisonText="on floor"
                isPositive={true}
                icon={UserCheck}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />

              <KpiCard
                title="LATE ARRIVALS"
                value={lateCount || 2}
                comparisonText="after 09:30 AM"
                isPositive={false}
                icon={AlertTriangle}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />

              <KpiCard
                title="ABSENT"
                value={absentCount || 1}
                comparisonText="unplanned"
                isPositive={false}
                icon={UserX}
                iconColor="text-rose-600 bg-rose-50 border-rose-200"
              />

              <KpiCard
                title="ON LEAVE"
                value={leaveCount || 2}
                comparisonText="approved requests"
                isPositive={true}
                icon={Calendar}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />
            </div>

            {/* Attendance Logs Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Today&apos;s Attendance Logs</h3>
                  <p className="text-xs text-slate-500">Timesheet punch logs and working hours</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Live Timesheet
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Check-in</th>
                      <th className="py-3 px-4">Check-out</th>
                      <th className="py-3 px-4 text-center">Working Hours</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{att.employee?.user?.name || "Staff Member"}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{att.employee?.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 font-medium">
                          {att.checkIn ? formatTime(att.checkIn) : "-"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {att.checkOut ? formatTime(att.checkOut) : "Active"}
                        </td>
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
            </div>
          </div>
        )}

        {/* ======================= TAB 3: SPRINT TASKS ======================= */}
        {activeTab === "TASKS" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Sprint Tasks & Deliverables
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agile Sprint Deliverables, Status Board & Work Assignments
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <button
                    onClick={() => setTaskViewMode("BOARD")}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      taskViewMode === "BOARD" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => setTaskViewMode("LIST")}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      taskViewMode === "LIST" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            </div>

            {/* Task KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="PENDING"
                value={pendingTasksCount}
                comparisonText="in backlog queue"
                isPositive={true}
                icon={Clock}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />

              <KpiCard
                title="IN PROGRESS"
                value={inProgTasksCount}
                comparisonText="active development"
                isPositive={true}
                icon={CheckSquare}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />

              <KpiCard
                title="COMPLETED"
                value={compTasksCount}
                trend={`${tasks.length > 0 ? Math.round((compTasksCount / tasks.length) * 100) : 0}% rate`}
                comparisonText="sprint deliveries"
                isPositive={true}
                icon={CheckCircle2}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />

              <KpiCard
                title="OVERDUE"
                value={overdueTasksCount}
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
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Task Board / List View */}
            {taskViewMode === "BOARD" ? (
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
                                onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
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
          </div>
        )}
      </div>

      {/* Employee Details Modal Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base font-bold shadow-xs">
                    {selectedEmployee.user?.name?.charAt(0) || "E"}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{selectedEmployee.user?.name}</h3>
                    <p className="text-xs text-blue-600 font-mono">{selectedEmployee.employeeCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Ribbon */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Leads</span>
                  <p className="text-lg font-bold text-blue-600 font-mono mt-0.5">
                    {selectedEmployee.leads?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Tasks</span>
                  <p className="text-lg font-bold text-indigo-600 font-mono mt-0.5">
                    {selectedEmployee.assignedTasks?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedEmployee.status} />
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-slate-900 font-medium">{selectedEmployee.department?.name || "General"}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Designation:</span>
                  <span className="text-slate-900 font-medium">{selectedEmployee.designation?.name || "Executive"}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-900">{selectedEmployee.user?.email}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-900 font-mono">{selectedEmployee.phone || "Not listed"}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Joining Date:</span>
                  <span className="font-mono text-slate-700">{formatDate(selectedEmployee.joiningDate)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Department</label>
                  <select
                    value={employeeFormData.departmentId}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Designation</label>
                  <select
                    value={employeeFormData.designationId}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, designationId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {designations.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? "Creating..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create Sprint Task</h3>
              <button onClick={() => setShowCreateTaskModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned Employee</label>
                <select
                  value={taskFormData.assignedToId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, assignedToId: e.target.value })}
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
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
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
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? "Creating..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
