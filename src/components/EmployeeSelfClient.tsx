"use client";

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  FileText,
  Calendar,
  Hourglass,
  HelpCircle,
  CalendarDays,
  User,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  X,
  Edit,
  Trash2,
  Paperclip,
  CheckCircle,
  XCircle,
  Building,
  Phone,
  Mail,
  Shield,
  UploadCloud,
  Send,
  Sparkles,
  Info,
  Award,
  ChevronRight,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime, cn } from "@/lib/utils";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import { clockIn, clockOut, toggleBreak } from "@/actions/attendance";
import { logTaskHourlyProgress, addTaskComment } from "@/actions/tasks";
import { applyLeave, createEmployeeQuery } from "@/actions/hr";
import {
  updateOwnProfile,
  submitAttendanceCorrection,
  cancelAttendanceCorrection,
  createWorkLog,
  updateWorkLog,
  submitOvertimeRequest,
  cancelOvertimeRequest,
  updateOwnPendingLeave,
  cancelOwnLeaveRequest,
  closeOwnQuery,
} from "@/actions/employeeSelf";

interface EmployeeSelfClientProps {
  user: any;
  employeeData: any;
  todayAttendance: any;
  myAttendances: any[];
  myTasks: any[];
  myLeaves: any[];
  myQueries: any[];
  myCorrections: any[];
  myWorkLogs: any[];
  myOvertime: any[];
  holidays: any[];
}

export function EmployeeSelfClient({
  user,
  employeeData,
  todayAttendance: initialToday,
  myAttendances: initialAttendances,
  myTasks: initialTasks,
  myLeaves: initialLeaves,
  myQueries: initialQueries,
  myCorrections: initialCorrections,
  myWorkLogs: initialWorkLogs,
  myOvertime: initialOvertime,
  holidays,
}: EmployeeSelfClientProps) {
  // Navigation View: 9 Employee-specific Views
  const [activeTab, setActiveTab] = useState<
    | "DASHBOARD"
    | "ATTENDANCE"
    | "TASKS"
    | "WORK_LOG"
    | "LEAVE"
    | "OVERTIME"
    | "HELPDESK"
    | "HOLIDAYS"
    | "PROFILE"
  >("DASHBOARD");

  // Local state for interactive UI
  const [todayAttendance, setTodayAttendance] = useState<any | null>(initialToday);
  const [attendances, setAttendances] = useState<any[]>(initialAttendances);
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [leaves, setLeaves] = useState<any[]>(initialLeaves);
  const [queries, setQueries] = useState<any[]>(initialQueries);
  const [corrections, setCorrections] = useState<any[]>(initialCorrections);
  const [workLogs, setWorkLogs] = useState<any[]>(initialWorkLogs);
  const [overtime, setOvertime] = useState<any[]>(initialOvertime);
  const [employeeProfile, setEmployeeProfile] = useState<any>(employeeData.employee);
  const [leaveBalance, setLeaveBalance] = useState<any>(employeeData.leaveBalance);

  // Filter states
  const [workLogFilter, setWorkLogFilter] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL">("ALL");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("ALL");
  const [leaveFilter, setLeaveFilter] = useState<string>("ALL");
  const [attendanceMonth, setAttendanceMonth] = useState<number>(new Date().getMonth());

  // Modals
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<any | null>(null);
  const [selectedLeaveForEdit, setSelectedLeaveForEdit] = useState<any | null>(null);

  // Form states
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    requestedCheckIn: "09:30",
    requestedCheckOut: "18:30",
    reason: "",
  });

  const [leaveForm, setLeaveForm] = useState({
    type: "CASUAL",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    daysCount: 1,
    reason: "",
  });

  const [workLogForm, setWorkLogForm] = useState({
    taskId: "",
    taskTitle: "Daily Business Operations",
    date: new Date().toISOString().split("T")[0],
    description: "",
    startTime: "09:30",
    endTime: "13:30",
    hoursSpent: 4,
    progressPct: 100,
    notes: "",
  });

  const [overtimeForm, setOvertimeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "18:30",
    endTime: "21:30",
    totalHours: 3,
    reason: "",
  });

  const [queryForm, setQueryForm] = useState({
    category: "HR_POLICY",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const [profileForm, setProfileForm] = useState({
    phone: employeeProfile?.phone || "",
    address: employeeProfile?.address || "",
    emergencyContact: employeeProfile?.emergencyContact || "",
    profilePhoto: employeeProfile?.profilePhoto || "",
  });

  const [taskProgressForm, setTaskProgressForm] = useState({
    hours: 1,
    status: "IN_PROGRESS",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  // Attendance Status
  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);
  const ongoingBreak = todayAttendance?.breaks?.find((b: any) => !b.endTime);

  // Working Hours calculation
  const getWorkingHoursStr = () => {
    if (!todayAttendance?.checkIn) return "0h 0m";
    const min = todayAttendance.workingHoursMin || 0;
    const hrs = Math.floor(min / 60);
    const remMin = min % 60;
    return `${hrs}h ${remMin}m`;
  };

  // Clock Actions
  const handleClockIn = async () => {
    setLoading(true);
    try {
      const res = await clockIn();
      setTodayAttendance(res);
      setAttendances([res, ...attendances.filter((a) => a.id !== res.id)]);
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
      setAttendances(attendances.map((a) => (a.id === res.id ? res : a)));
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

  // Correction Submission
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitAttendanceCorrection(correctionForm);
      setCorrections([res, ...corrections]);
      setShowCorrectionModal(false);
      setCorrectionForm({
        date: new Date().toISOString().split("T")[0],
        requestedCheckIn: "09:30",
        requestedCheckOut: "18:30",
        reason: "",
      });
      alert("Attendance correction request submitted!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCorrection = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this correction request?")) return;
    try {
      await cancelAttendanceCorrection(id);
      setCorrections(corrections.map((c) => (c.id === id ? { ...c, status: "CANCELLED" } : c)));
      alert("Correction request cancelled.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Leave Actions
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedLeaveForEdit) {
        const updated = await updateOwnPendingLeave(selectedLeaveForEdit.id, leaveForm);
        setLeaves(leaves.map((l) => (l.id === updated.id ? updated : l)));
        setSelectedLeaveForEdit(null);
        alert("Leave request updated successfully!");
      } else {
        const newL = await applyLeave(leaveForm);
        setLeaves([newL, ...leaves]);
        alert("Leave request submitted for review!");
      }
      setShowLeaveModal(false);
      setLeaveForm({
        type: "CASUAL",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        daysCount: 1,
        reason: "",
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm("Cancel this pending leave request?")) return;
    try {
      await cancelOwnLeaveRequest(id);
      setLeaves(leaves.map((l) => (l.id === id ? { ...l, status: "CANCELLED" } : l)));
      alert("Leave request cancelled.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Work Log Submission
  const handleCreateWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createWorkLog(workLogForm);
      setWorkLogs([res, ...workLogs]);
      setShowWorkLogModal(false);
      setWorkLogForm({
        taskId: "",
        taskTitle: "Daily Business Operations",
        date: new Date().toISOString().split("T")[0],
        description: "",
        startTime: "09:30",
        endTime: "13:30",
        hoursSpent: 4,
        progressPct: 100,
        notes: "",
      });
      alert("Daily work log saved!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Overtime Submission
  const handleCreateOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitOvertimeRequest(overtimeForm);
      setOvertime([res, ...overtime]);
      setShowOvertimeModal(false);
      setOvertimeForm({
        date: new Date().toISOString().split("T")[0],
        startTime: "18:30",
        endTime: "21:30",
        totalHours: 3,
        reason: "",
      });
      alert("Overtime request submitted!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOvertime = async (id: string) => {
    if (!confirm("Cancel pending overtime request?")) return;
    try {
      await cancelOvertimeRequest(id);
      setOvertime(overtime.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o)));
      alert("Overtime request cancelled.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Task Progress Update
  const handleUpdateTaskProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForProgress) return;
    setLoading(true);
    try {
      const updated = await logTaskHourlyProgress({
        taskId: selectedTaskForProgress.id,
        hoursSpent: Number(taskProgressForm.hours),
        newStatus: taskProgressForm.status,
        progressNote: taskProgressForm.note,
      });
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTaskForProgress(null);
      alert("Task progress logged successfully!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Query / Helpdesk Creation
  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createEmployeeQuery(queryForm);
      setQueries([res, ...queries]);
      setShowQueryModal(false);
      setQueryForm({
        category: "HR_POLICY",
        subject: "",
        description: "",
        priority: "MEDIUM",
      });
      alert(`Helpdesk ticket ${res.queryCode} created!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQuery = async (id: string) => {
    if (!confirm("Close this query?")) return;
    try {
      await closeOwnQuery(id);
      setQueries(queries.map((q) => (q.id === id ? { ...q, status: "CLOSED" } : q)));
      alert("Query closed.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateOwnProfile(profileForm);
      setEmployeeProfile({
        ...employeeProfile,
        phone: profileForm.phone,
        address: profileForm.address,
        emergencyContact: profileForm.emergencyContact,
        profilePhoto: profileForm.profilePhoto,
      });
      alert("Profile details updated successfully!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Task counts
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;

  // Filtered Work logs
  const filteredWorkLogs = workLogs.filter((w) => {
    if (workLogFilter === "ALL") return true;
    const logD = new Date(w.date);
    const now = new Date();
    if (workLogFilter === "TODAY") {
      return logD.toDateString() === now.toDateString();
    }
    if (workLogFilter === "THIS_WEEK") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      return logD >= startOfWeek;
    }
    if (workLogFilter === "THIS_MONTH") {
      return logD.getMonth() === new Date().getMonth() && logD.getFullYear() === new Date().getFullYear();
    }
    return true;
  });

  const totalWorkLogHours = filteredWorkLogs.reduce((sum, w) => sum + (w.hoursSpent || 0), 0);

  // Navigation Items (Requirement #13)
  const navItems = [
    { key: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
    { key: "ATTENDANCE", label: "My Attendance", icon: Clock },
    { key: "TASKS", label: "My Tasks", icon: CheckSquare, badge: pendingTasksCount },
    { key: "WORK_LOG", label: "My Work Log", icon: FileText },
    { key: "LEAVE", label: "Leave", icon: Calendar },
    { key: "OVERTIME", label: "Overtime", icon: Hourglass },
    { key: "HELPDESK", label: "Helpdesk", icon: HelpCircle },
    { key: "HOLIDAYS", label: "Holidays", icon: CalendarDays },
    { key: "PROFILE", label: "My Profile", icon: User },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Employee Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 select-none shadow-xs">
        {/* Employee Profile Header Card */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "EM"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-xs text-slate-900 truncate">{user?.name || "Staff Member"}</h2>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                {employeeProfile?.employeeCode || "EMP-SELF"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Self-Service Hub
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key as any)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ml-2",
                        isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Employee Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0 overflow-y-auto">
        {/* =========================================================================
            SECTION 1: EMPLOYEE DASHBOARD
        ========================================================================= */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Welcome, {user?.name || "Employee"} 👋
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {employeeProfile?.designation?.name || "Staff Member"} • {employeeProfile?.department?.name || "Operations"}
                </p>
              </div>

              {/* Quick Clock Punch Buttons */}
              <div className="flex items-center gap-2">
                {!isCheckedIn ? (
                  <button
                    onClick={handleClockIn}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Check In</span>
                  </button>
                ) : !isCheckedOut ? (
                  <>
                    <button
                      onClick={handleToggleBreak}
                      disabled={loading}
                      className={cn(
                        "px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs",
                        ongoingBreak
                          ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{ongoingBreak ? "End Break" : "Start Break"}</span>
                    </button>
                    <button
                      onClick={handleClockOut}
                      disabled={loading}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Check Out</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                    Shift Ended ({todayAttendance?.workingHoursMin || 0}m logged)
                  </span>
                )}
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today's Attendance Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Today's Attendance
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Check In:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : "--:--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500">Check Out:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : "--:--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500">Working Hours:</span>
                    <span className="font-mono font-bold text-blue-600">{getWorkingHoursStr()}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Status:</span>
                  <StatusBadge status={isCheckedIn ? "PRESENT" : "ABSENT"} />
                </div>
              </div>

              {/* Today's Assigned Tasks Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    My Tasks
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {tasks.length} <span className="text-xs font-normal text-slate-500">Assigned</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-emerald-600">
                    <span>Completed:</span>
                    <span className="font-mono font-bold">{completedTasksCount}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Pending:</span>
                    <span className="font-mono font-bold">{pendingTasksCount}</span>
                  </div>
                </div>
              </div>

              {/* Leave Balance Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Leave Balance
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Casual Leave:</span>
                    <span className="font-mono font-bold text-slate-900">{leaveBalance?.casual?.remaining ?? 8} left</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sick Leave:</span>
                    <span className="font-mono font-bold text-slate-900">{leaveBalance?.sick?.remaining ?? 5} left</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Paid Leave:</span>
                    <span className="font-mono font-bold text-slate-900">{leaveBalance?.paid?.remaining ?? 10} left</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Pending Requests:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {leaves.filter((l) => l.status === "PENDING").length}
                  </span>
                </div>
              </div>

              {/* Upcoming Holidays Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Upcoming Holidays
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {holidays.slice(0, 2).map((h, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-semibold text-slate-900 truncate">{h.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{formatDate(h.date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dashboard 2-Column: Recent Tasks & Work Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assigned Tasks Summary */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Current Assigned Tasks</h3>
                  <button
                    onClick={() => setActiveTab("TASKS")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {tasks.slice(0, 4).map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Due: {formatDate(t.dueDate)} • {t.actualHours || 0}h / {t.estimatedHours || 0}h logged
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Work Logs Summary */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Recent Work Logs</h3>
                  <button
                    onClick={() => setActiveTab("WORK_LOG")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Log Work</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {workLogs.slice(0, 4).map((w) => (
                    <div key={w.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{w.taskTitle || "Work Log"}</div>
                        <div className="text-[11px] text-slate-500 truncate">{w.description}</div>
                      </div>
                      <span className="font-mono font-bold text-blue-600 shrink-0">
                        {w.hoursSpent} hrs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: MY ATTENDANCE & CORRECTION REQUESTS
        ========================================================================= */}
        {activeTab === "ATTENDANCE" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  My Attendance History & Corrections
                </h3>
                <p className="text-xs text-slate-500">
                  Track your check-in, check-out, break duration, and request corrections if missed.
                </p>
              </div>
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Correction</span>
              </button>
            </div>

            {/* Today's Status Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-500">Today's Check-In:</span>
                <span className="font-bold font-mono text-slate-900 ml-1.5">
                  {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : "Not Checked In"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Check-Out:</span>
                <span className="font-bold font-mono text-slate-900 ml-1.5">
                  {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : "Active Shift"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Break Duration:</span>
                <span className="font-bold font-mono text-slate-900 ml-1.5">
                  {todayAttendance?.breakDurationMin || 0} mins
                </span>
              </div>
              <div>
                <span className="text-slate-500">Working Hours:</span>
                <span className="font-bold font-mono text-blue-600 ml-1.5">{getWorkingHoursStr()}</span>
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                My Attendance Logs
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4 text-center">Break</th>
                      <th className="py-3 px-4 text-center">Working Hours</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {formatDate(att.date)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {att.checkIn ? formatTime(att.checkIn) : "--"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {att.checkOut ? formatTime(att.checkOut) : "--"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {att.breakDurationMin || 0}m
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                          {Math.floor((att.workingHoursMin || 0) / 60)}h {(att.workingHoursMin || 0) % 60}m
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={att.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Correction Requests Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                My Attendance Correction Requests
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Target Date</th>
                      <th className="py-3 px-4">Req Check-In</th>
                      <th className="py-3 px-4">Req Check-Out</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {corrections.map((cor) => (
                      <tr key={cor.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {formatDate(cor.date)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {cor.requestedCheckIn ? formatTime(cor.requestedCheckIn) : "--"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {cor.requestedCheckOut ? formatTime(cor.requestedCheckOut) : "--"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={cor.reason}>
                          {cor.reason}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={cor.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {cor.status === "PENDING" && (
                            <button
                              onClick={() => handleCancelCorrection(cor.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: MY TASKS
        ========================================================================= */}
        {activeTab === "TASKS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  My Assigned Tasks
                </h3>
                <p className="text-xs text-slate-500">
                  View assigned sprint items, log time spent, add progress notes, and mark tasks as completed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks
                .filter((t) => taskStatusFilter === "ALL" || t.status === taskStatusFilter)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{task.taskCode}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Deadline: {formatDate(task.dueDate)}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {task.actualHours || 0}h / {task.estimatedHours || 0}h
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Assigned By: {task.createdBy?.user?.name || "Manager"}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTaskForProgress(task);
                            setTaskProgressForm({
                              hours: 1,
                              status: task.status,
                              note: "",
                            });
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Log Progress / Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: MY DAILY WORK LOG
        ========================================================================= */}
        {activeTab === "WORK_LOG" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  My Daily Work Logs
                </h3>
                <p className="text-xs text-slate-500">
                  Log your daily activity, hours invested, and progress on tasks.
                </p>
              </div>
              <button
                onClick={() => setShowWorkLogModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Work Log</span>
              </button>
            </div>

            {/* Filter Tabs (Today, This Week, This Month, All) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-1">
                {[
                  { id: "ALL", label: "All Logs" },
                  { id: "TODAY", label: "Today's Work" },
                  { id: "THIS_WEEK", label: "This Week" },
                  { id: "THIS_MONTH", label: "This Month" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setWorkLogFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      workLogFilter === f.id
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="text-xs font-mono font-bold text-slate-700">
                Total Logged: <span className="text-blue-600">{totalWorkLogHours} hrs</span>
              </div>
            </div>

            {/* Work Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Task / Project</th>
                    <th className="py-3 px-4">Work Description</th>
                    <th className="py-3 px-4 text-center">Time Window</th>
                    <th className="py-3 px-4 text-right">Hours</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {formatDate(log.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">{log.taskTitle || "General Work"}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-[280px]">{log.description}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {log.startTime ? formatTime(log.startTime) : "--"} -{" "}
                        {log.endTime ? formatTime(log.endTime) : "--"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {log.hoursSpent}h
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          {log.progressPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 5: LEAVE REQUEST & LEAVE BALANCE
        ========================================================================= */}
        {activeTab === "LEAVE" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Leave Management & Balance
                </h3>
                <p className="text-xs text-slate-500">
                  Apply for leave, track approval status, and view your remaining quotas.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedLeaveForEdit(null);
                  setShowLeaveModal(true);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply for Leave</span>
              </button>
            </div>

            {/* Leave Balance Quota Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  CASUAL LEAVE
                </span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                  {leaveBalance?.casual?.remaining ?? 8}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    / {leaveBalance?.casual?.total ?? 12} Total
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Used: {leaveBalance?.casual?.used ?? 4} • Pending: {leaveBalance?.casual?.pending ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  SICK LEAVE
                </span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                  {leaveBalance?.sick?.remaining ?? 5}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    / {leaveBalance?.sick?.total ?? 10} Total
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Used: {leaveBalance?.sick?.used ?? 5} • Pending: {leaveBalance?.sick?.pending ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  PAID LEAVE
                </span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                  {leaveBalance?.paid?.remaining ?? 10}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    / {leaveBalance?.paid?.total ?? 15} Total
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Used: {leaveBalance?.paid?.used ?? 5} • Pending: {leaveBalance?.paid?.pending ?? 0}
                </span>
              </div>
            </div>

            {/* My Leave Requests Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                My Leave History
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">From</th>
                      <th className="py-3 px-4">To</th>
                      <th className="py-3 px-4 text-center">Days</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{l.type}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{formatDate(l.startDate)}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{formatDate(l.endDate)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                          {l.daysCount}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={l.reason}>
                          {l.reason}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {l.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLeaveForEdit(l);
                                  setLeaveForm({
                                    type: l.type,
                                    startDate: new Date(l.startDate).toISOString().split("T")[0],
                                    endDate: new Date(l.endDate).toISOString().split("T")[0],
                                    daysCount: l.daysCount,
                                    reason: l.reason,
                                  });
                                  setShowLeaveModal(true);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancelLeave(l.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 6: OVERTIME REQUESTS
        ========================================================================= */}
        {activeTab === "OVERTIME" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-600" />
                  Overtime Requests
                </h3>
                <p className="text-xs text-slate-500">
                  Submit additional work hours for management approval.
                </p>
              </div>
              <button
                onClick={() => setShowOvertimeModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Overtime</span>
              </button>
            </div>

            {/* Overtime Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">End Time</th>
                    <th className="py-3 px-4 text-center">Total Hours</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overtime.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {formatDate(ot.date)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{formatTime(ot.startTime)}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{formatTime(ot.endTime)}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                        {ot.totalHours} hrs
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={ot.reason}>
                        {ot.reason}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={ot.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ot.status === "PENDING" && (
                          <button
                            onClick={() => handleCancelOvertime(ot.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 7: HELPDESK / QUERIES
        ========================================================================= */}
        {activeTab === "HELPDESK" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  My Workplace Helpdesk & Queries
                </h3>
                <p className="text-xs text-slate-500">
                  Raise HR, IT support, payroll, or workplace policy inquiries.
                </p>
              </div>
              <button
                onClick={() => setShowQueryModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Raise Query</span>
              </button>
            </div>

            <div className="space-y-4">
              {queries.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600">{q.queryCode}</span>
                      <span className="text-xs text-slate-500 font-semibold">• {q.category}</span>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{q.subject}</h4>
                  <p className="text-xs text-slate-600">{q.description}</p>

                  {q.response && (
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-blue-900 flex items-center gap-1">
                        <span>HR Response from {q.resolvedBy || "HR Desk"}:</span>
                      </div>
                      <p className="text-blue-800">{q.response}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Created: {formatDate(q.createdAt)}</span>
                    {q.status === "RESOLVED" && (
                      <button
                        onClick={() => handleCloseQuery(q.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Acknowledge & Close
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 8: COMPANY HOLIDAYS
        ========================================================================= */}
        {activeTab === "HOLIDAYS" && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-rose-600" />
                Company Holiday Calendar
              </h3>
              <p className="text-xs text-slate-500">
                Official observed national, festival, and corporate holidays for the current year.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((h, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{formatDate(h.date)}</span>
                      <StatusBadge status={h.type} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{h.title}</h4>
                    {h.description && <p className="text-xs text-slate-500 mt-1">{h.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 9: MY PROFILE
        ========================================================================= */}
        {activeTab === "PROFILE" && (
          <div className="space-y-6 max-w-3xl">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                My Employee Profile
              </h3>
              <p className="text-xs text-slate-500">
                View your employment credentials and update your personal contact information.
              </p>
            </div>

            {/* Read-only Official Credentials */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Official Employment Details (Read Only)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Employee Code:</span>
                  <div className="font-mono font-bold text-slate-900">
                    {employeeProfile?.employeeCode || "EMP-SELF"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>
                  <div className="font-semibold text-slate-900">
                    {employeeProfile?.department?.name || "General"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Designation:</span>
                  <div className="font-semibold text-slate-900">
                    {employeeProfile?.designation?.name || "Staff Member"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Joining Date:</span>
                  <div className="font-mono text-slate-900">
                    {formatDate(employeeProfile?.joiningDate || new Date())}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Reporting Manager:</span>
                  <div className="font-semibold text-slate-900">
                    {employeeProfile?.manager?.user?.name || "Direct HR"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Role & Access:</span>
                  <div className="font-mono font-bold text-blue-600">EMPLOYEE (Self-Service)</div>
                </div>
              </div>
            </div>

            {/* Editable Profile Information Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Editable Personal Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    placeholder="Name: +91 98765 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Street Address, City, State, PIN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  value={profileForm.profilePhoto}
                  onChange={(e) => setProfileForm({ ...profileForm, profilePhoto: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================= */}

      {/* 1. Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Attendance Correction Request</h3>
              <button onClick={() => setShowCorrectionModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={correctionForm.date}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Requested Check-In</label>
                  <input
                    type="time"
                    value={correctionForm.requestedCheckIn}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Requested Check-Out</label>
                  <input
                    type="time"
                    value={correctionForm.requestedCheckOut}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Reason for Correction *</label>
                <textarea
                  rows={2}
                  required
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="e.g. Forgot clock-in due to urgent on-site customer meeting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Submit Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {selectedLeaveForEdit ? "Edit Leave Request" : "Apply for Leave"}
              </h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Leave Type *</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="PAID">Paid Leave</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="WORK_FROM_HOME">Work From Home</option>
                  <option value="UNPAID">Other / Unpaid</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Provide reason for leave..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  {selectedLeaveForEdit ? "Update Leave" : "Submit Leave Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Work Log Modal */}
      {showWorkLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Daily Work Log</h3>
              <button onClick={() => setShowWorkLogModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={workLogForm.date}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Task / Subject</label>
                <input
                  type="text"
                  required
                  value={workLogForm.taskTitle}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, taskTitle: e.target.value })}
                  placeholder="Task or project title"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Work Description *</label>
                <textarea
                  rows={2}
                  required
                  value={workLogForm.description}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, description: e.target.value })}
                  placeholder="Detail activities performed..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Hours Spent *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={workLogForm.hoursSpent}
                    onChange={(e) => setWorkLogForm({ ...workLogForm, hoursSpent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Progress %</label>
                  <input
                    type="number"
                    value={workLogForm.progressPct}
                    onChange={(e) => setWorkLogForm({ ...workLogForm, progressPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWorkLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Overtime Modal */}
      {showOvertimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Request Overtime Hours</h3>
              <button onClick={() => setShowOvertimeModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOvertime} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={overtimeForm.date}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={overtimeForm.startTime}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={overtimeForm.endTime}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Total Overtime Hours</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={overtimeForm.totalHours}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, totalHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={overtimeForm.reason}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })}
                  placeholder="Reason for overtime work..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOvertimeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Submit Overtime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Query / Helpdesk Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Raise Workplace Query</h3>
              <button onClick={() => setShowQueryModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuery} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Category *</label>
                <select
                  value={queryForm.category}
                  onChange={(e) => setQueryForm({ ...queryForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="HR_POLICY">HR & Company Policy</option>
                  <option value="SALARY_PAYROLL">Salary & Payroll</option>
                  <option value="LEAVE_ATTENDANCE">Leave & Attendance</option>
                  <option value="IT_SUPPORT">IT & Hardware Support</option>
                  <option value="WORKPLACE">Workplace Facilities</option>
                  <option value="GENERAL">General Query</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={queryForm.subject}
                  onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                  placeholder="Brief summary of query..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={queryForm.description}
                  onChange={(e) => setQueryForm({ ...queryForm, description: e.target.value })}
                  placeholder="Detailed description..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQueryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Submit Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Task Progress Modal */}
      {selectedTaskForProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Task Progress</h3>
              <button
                onClick={() => setSelectedTaskForProgress(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTaskProgress} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900">{selectedTaskForProgress.title}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Logged: {selectedTaskForProgress.actualHours || 0}h / Est:{" "}
                  {selectedTaskForProgress.estimatedHours || 0}h
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Hours to Add *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={taskProgressForm.hours}
                    onChange={(e) => setTaskProgressForm({ ...taskProgressForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Update Status</label>
                  <select
                    value={taskProgressForm.status}
                    onChange={(e) => setTaskProgressForm({ ...taskProgressForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Mark as Completed</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Work Description / Progress Notes</label>
                <textarea
                  rows={2}
                  value={taskProgressForm.note}
                  onChange={(e) => setTaskProgressForm({ ...taskProgressForm, note: e.target.value })}
                  placeholder="What did you complete?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForProgress(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Log Work Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
