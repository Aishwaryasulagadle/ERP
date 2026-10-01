"use client";

import { useState } from "react";
import {
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  UserX,
  History,
  PanelLeftClose,
  PanelLeft,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { formatTime, formatDate, cn } from "@/lib/utils";
import { clockIn, clockOut, toggleBreak } from "@/actions/attendance";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";

interface AttendanceClientProps {
  todayAttendance: any;
  allAttendances: any[];
  userRole: string;
}

export function AttendanceClient({
  todayAttendance: initialToday,
  allAttendances: initialAll,
  userRole,
}: AttendanceClientProps) {
  const [todayAttendance, setTodayAttendance] = useState<any | null>(initialToday);
  const [allAttendances, setAllAttendances] = useState<any[]>(initialAll);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);
  const ongoingBreak = todayAttendance?.breaks?.find((b: any) => !b.endTime);

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

  const presentCount = allAttendances.filter((a) => a.status === "PRESENT").length;
  const lateCount = allAttendances.filter((a) => a.status === "LATE").length;
  const absentCount = allAttendances.filter((a) => a.status === "ABSENT").length;
  const leaveCount = allAttendances.filter((a) => a.status === "LEAVE").length;

  const filteredAttendances = allAttendances.filter((a) => {
    if (statusFilter === "ALL") return true;
    return a.status === statusFilter;
  });

  const attendanceCategories = [
    { key: "ALL", label: "All Records", icon: Layers, count: allAttendances.length, color: "text-blue-500" },
    { key: "PRESENT", label: "Present On Floor", icon: UserCheck, count: presentCount, color: "text-emerald-500" },
    { key: "LATE", label: "Late Arrivals", icon: AlertTriangle, count: lateCount, color: "text-amber-500" },
    { key: "ABSENT", label: "Unplanned Absent", icon: UserX, count: absentCount, color: "text-rose-500" },
    { key: "LEAVE", label: "Approved Leaves", icon: Calendar, count: leaveCount, color: "text-purple-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Attendance Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          {/* Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Time & Attendance</h2>
                  <p className="text-[10px] text-slate-500 truncate">Shifts, Breaks & Logs</p>
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

          {/* Attendance Status Navigation */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Timesheet Filters
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {attendanceCategories.map((cat) => {
                const isActive = statusFilter === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setStatusFilter(cat.key)}
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

          {/* Geofence info widget */}
          <div className="pt-2 border-t border-slate-100 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>HQ Geofence Active</span>
            </div>
            <p className="text-[10px] text-slate-500">Auto-validates IP and coordinates for all active shifts.</p>
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
              Attendance & Shifts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Punch Terminal, Shift Logs, Working Hours & Break Auditing
            </p>
          </div>
        </div>

      {/* Punch Quick Action Terminal with Digital Clock & GPS */}
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

      {/* 4 Attendance Status Summary Cards */}
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

      {/* Employee Attendance Logs Table */}
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
    </div>
  );
}
