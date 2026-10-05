"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  Calendar,
  X,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Award,
  PanelLeftClose,
  PanelLeft,
  UserX,
  Clock,
  CheckSquare,
  Play,
  Square,
  Coffee,
  AlertTriangle,
  LayoutGrid,
  List,
  ShieldCheck,
  Home,
  MessageSquare,
  FileText,
  Sparkles,
  CalendarDays,
  Printer,
  Download,
  HelpCircle,
  Briefcase,
  Check,
  Filter,
  Send,
  RefreshCw,
  Sun,
  Laptop,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Timer,
  FileEdit,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime, cn } from "@/lib/utils";
import { createEmployee } from "@/actions/employees";
import { clockIn, clockOut, toggleBreak } from "@/actions/attendance";
import { createTask, updateTaskStatus, logTaskHourlyProgress } from "@/actions/tasks";
import {
  applyLeave,
  assignLeaveOrWFH,
  updateLeaveStatus,
  addHoliday,
  deleteHoliday,
  createEmployeeQuery,
  resolveEmployeeQuery,
  generateSalarySlip,
} from "@/actions/hr";
import { submitClientReport } from "@/actions/reports";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";

interface EmployeesClientProps {
  employees: any[];
  departments: any[];
  designations: any[];
  todayAttendance?: any;
  allAttendances?: any[];
  tasks?: any[];
  initialLeaves?: any[];
  initialHolidays?: any[];
  initialQueries?: any[];
  initialSalarySlips?: any[];
  initialReports?: any;
  initialClientReports?: any[];
  userRole: string;
  currentUserId?: string;
  currentEmployeeId?: string;
  user?: any;
  assignedClients?: any[];
}

export function EmployeesClient({
  employees: initialEmployees,
  departments,
  designations,
  todayAttendance: initialToday,
  allAttendances: initialAll = [],
  tasks: initialTasks = [],
  initialLeaves = [],
  initialHolidays = [],
  initialQueries = [],
  initialSalarySlips = [],
  initialReports = null,
  initialClientReports = [],
  userRole,
  currentUserId,
  currentEmployeeId,
  user,
  assignedClients = [],
}: EmployeesClientProps) {
  const isManager = userRole === "MANAGER";
  const isEmployee = userRole === "EMPLOYEE";
  const isAdmin = userRole === "ADMIN";

  const [managerMode, setManagerMode] = useState<"MANAGER" | "EMPLOYEE">("MANAGER");
  const isEmployeeMode = isEmployee || (isManager && managerMode === "EMPLOYEE");
  const isManagerMode = isManager && managerMode === "MANAGER";
  const isManagerOrAdminView = !isEmployeeMode;

  const userDeptId = (user as any)?.departmentId;
  const userDeptName = ((user as any)?.department || "").toLowerCase();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || (isEmployeeMode ? "ATTENDANCE" : "DIRECTORY");

  // Tab State: "DIRECTORY" | "ATTENDANCE" | "LEAVE" | "PAYROLL" | "HOLIDAYS" | "QUERIES" | "TASKS" | "REPORTS"
  const [activeTab, setActiveTab] = useState<
    "DIRECTORY" | "ATTENDANCE" | "LEAVE" | "PAYROLL" | "HOLIDAYS" | "QUERIES" | "TASKS" | "REPORTS"
  >(
    ["DIRECTORY", "ATTENDANCE", "LEAVE", "PAYROLL", "HOLIDAYS", "QUERIES", "TASKS", "REPORTS"].includes(initialTab)
      ? (initialTab as any)
      : isEmployeeMode
      ? "ATTENDANCE"
      : "DIRECTORY"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["DIRECTORY", "ATTENDANCE", "LEAVE", "PAYROLL", "HOLIDAYS", "QUERIES", "TASKS", "REPORTS"].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Switch tab away from DIRECTORY if in employee mode
  useEffect(() => {
    if (isEmployeeMode && activeTab === "DIRECTORY") {
      setActiveTab("ATTENDANCE");
    }
  }, [isEmployeeMode, activeTab]);

  // Modal states for punch-out compulsory report and today's presence roster
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [clockOutReportSummary, setClockOutReportSummary] = useState("");
  const [clockOutReportDeliverables, setClockOutReportDeliverables] = useState("");
  const [clockOutReportHours, setClockOutReportHours] = useState(8);
  const [clockOutReportBlockers, setClockOutReportBlockers] = useState("");
  const [showTodayAttendanceModal, setShowTodayAttendanceModal] = useState(false);
  const [showAddPersonalTaskModal, setShowAddPersonalTaskModal] = useState(false);
  const [personalTaskForm, setPersonalTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
    estimatedHours: 4,
  });

  // General UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // 1. DIRECTORY STATE
  const [employees, setEmployees] = useState<any[]>(initialEmployees);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedEmployeeForAttendance, setSelectedEmployeeForAttendance] = useState<any | null>(null);
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedAttendanceYear, setSelectedAttendanceYear] = useState<number>(new Date().getFullYear());

  const [employeeFormData, setEmployeeFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: departments[0]?.id || "",
    designationName: "",
    salary: 75000,
    monthlyLeaveQuota: 2, // 2 Leaves allowed in 30 days per month (excl 4 Sundays)
    role: "EMPLOYEE",
    address: "",
    emergencyContact: "",
  });

  // 2. ATTENDANCE STATE
  const [todayAttendance, setTodayAttendance] = useState<any | null>(initialToday);
  const [allAttendances, setAllAttendances] = useState<any[]>(initialAll);
  const [attendanceFilter, setAttendanceFilter] = useState("ALL");
  const [attendanceViewMode, setAttendanceViewMode] = useState<"TODAY" | "MONTHLY">("TODAY");
  const [monthlyAttendanceMonth, setMonthlyAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [monthlyAttendanceYear, setMonthlyAttendanceYear] = useState(new Date().getFullYear());
  const [monthlyAttendanceSearch, setMonthlyAttendanceSearch] = useState("");

  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);
  const ongoingBreak = todayAttendance?.breaks?.find((b: any) => !b.endTime);

  // 3. LEAVE & WORK FROM HOME & HALF DAY STATE
  const [leaves, setLeaves] = useState<any[]>(initialLeaves);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showAssignLeaveModal, setShowAssignLeaveModal] = useState(false);
  const [assignLeaveFormData, setAssignLeaveFormData] = useState({
    target: "SINGLE" as "SINGLE" | "ALL",
    employeeId: employees[0]?.id || "",
    type: "WORK_FROM_HOME", // CASUAL, SICK, PAID, UNPAID, HALF_DAY, WORK_FROM_HOME
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    halfDayType: "FIRST_HALF",
    reason: "",
  });
  const [leaveFormData, setLeaveFormData] = useState({
    type: "CASUAL", // CASUAL, SICK, PAID, UNPAID, HALF_DAY, WORK_FROM_HOME
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    daysCount: 1,
    halfDayType: "FIRST_HALF",
    reason: "",
    employeeId: employees[0]?.id || "",
  });

  // 4. HOLIDAYS & SUNDAYS STATE
  const [holidays, setHolidays] = useState<any[]>(initialHolidays);
  const [holidayTypeFilter, setHolidayTypeFilter] = useState("ALL");
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    type: "NATIONAL",
    description: "",
    isRecurring: true,
  });

  // 5. EMPLOYEE QUERIES / HELPDESK STATE
  const [queries, setQueries] = useState<any[]>(initialQueries);
  const [queryCategoryFilter, setQueryCategoryFilter] = useState("ALL");
  const [queryStatusFilter, setQueryStatusFilter] = useState("ALL");
  const [showRaiseQueryModal, setShowRaiseQueryModal] = useState(false);
  const [selectedQueryForResolve, setSelectedQueryForResolve] = useState<any | null>(null);
  const [queryResolveText, setQueryResolveText] = useState("");
  const [queryFormData, setQueryFormData] = useState({
    recipient: "MANAGER" as "ADMIN" | "MANAGER",
    category: "SALARY_PAYROLL",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  // 6. SALARY SLIPS / PAYROLL STATE
  const [salarySlips, setSalarySlips] = useState<any[]>(initialSalarySlips);
  const [showGenerateSlipModal, setShowGenerateSlipModal] = useState(false);
  const [selectedSlipForView, setSelectedSlipForView] = useState<any | null>(null);
  const [slipFormData, setSlipFormData] = useState({
    employeeId: employees[0]?.id || "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 60000,
    hra: 24000,
    specialAllow: 12000,
    bonus: 5000,
    pfDeduction: 7200,
    taxDeduction: 3500,
    otherDeduction: 0,
    totalWorkingDays: 30,
    presentDays: 28,
    paidLeaves: 2,
    wfhDays: 3,
    halfDays: 0,
    unpaidLeaves: 0,
    notes: "",
  });

  // 7. TASKS STATE
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [taskStageFilter, setTaskStageFilter] = useState("ALL");
  const [taskViewMode, setTaskViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [taskSearch, setTaskSearch] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<any | null>(null);
  const [taskProgressHours, setTaskProgressHours] = useState<number>(1);
  const [taskProgressStatus, setTaskProgressStatus] = useState<string>("IN_PROGRESS");
  const [taskProgressNote, setTaskProgressNote] = useState<string>("");
  const [taskProgressLoading, setTaskProgressLoading] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignedToId: employees[0]?.id || "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
    estimatedHours: 8,
  });

  // 8. REPORTS STATE
  const [reportsList, setReportsList] = useState<any[]>(initialClientReports);
  const [reportTypeFilter, setReportTypeFilter] = useState<"ALL" | "DAILY" | "WEEKLY" | "CLIENT">("ALL");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [showSubmitReportModal, setShowSubmitReportModal] = useState(false);
  const [reportFormData, setReportFormData] = useState({
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

  const handleOpenReportModal = (type: "DAILY" | "WEEKLY" | "MONTHLY" | "CLIENT" = "DAILY") => {
    setReportFormData({
      reportType: type,
      customerName: type === "CLIENT" ? "" : "Internal Project",
      projectTitle:
        type === "DAILY"
          ? `Daily Standup - ${new Date().toLocaleDateString()}`
          : type === "WEEKLY"
          ? `Weekly Milestone - Week ${Math.ceil(new Date().getDate() / 7)}`
          : "",
      status: "IN_PROGRESS",
      summary: "",
      deliverables: "",
      nextWeekPlan: "",
      blockers: "",
      hoursSpent: 8,
    });
    setShowSubmitReportModal(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitClientReport(reportFormData);
      setReportsList([
        {
          id: String(Date.now()),
          submittedBy: user?.name || "Team Member",
          reportType: reportFormData.reportType,
          customerName: reportFormData.customerName || "Internal Operations",
          projectTitle: reportFormData.projectTitle,
          status: reportFormData.status,
          summary: reportFormData.summary,
          deliverables: reportFormData.deliverables,
          nextWeekPlan: reportFormData.nextWeekPlan,
          blockers: reportFormData.blockers,
          hoursSpent: reportFormData.hoursSpent,
          createdAt: new Date().toISOString(),
        },
        ...reportsList,
      ]);
      setShowSubmitReportModal(false);
      alert(`✓ ${reportFormData.reportType} report submitted successfully!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate days when start/end changes in leave form
  useEffect(() => {
    if (leaveFormData.type === "HALF_DAY") {
      setLeaveFormData((prev) => ({ ...prev, daysCount: 0.5 }));
    } else {
      const d1 = new Date(leaveFormData.startDate).getTime();
      const d2 = new Date(leaveFormData.endDate).getTime();
      const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)) + 1);
      setLeaveFormData((prev) => ({ ...prev, daysCount: isNaN(diff) ? 1 : diff }));
    }
  }, [leaveFormData.startDate, leaveFormData.endDate, leaveFormData.type]);

  // Handlers - Employees
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEmp = await createEmployee(employeeFormData);
      setEmployees([...employees, newEmp]);
      setShowAddEmployeeModal(false);
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
    // If not filled yet, prompt the compulsory daily work report modal
    setShowClockOutModal(true);
  };

  const handleClockOutWithReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitClientReport({
        reportType: "DAILY",
        customerName: "Internal Operations",
        projectTitle: `Daily Standup - ${new Date().toLocaleDateString()}`,
        status: "COMPLETED",
        summary: clockOutReportSummary,
        deliverables: clockOutReportDeliverables,
        nextWeekPlan: "",
        blockers: clockOutReportBlockers,
        hoursSpent: Number(clockOutReportHours) || 8,
      });

      const res = await clockOut();
      setTodayAttendance(res);
      setShowClockOutModal(false);
      setReportsList([
        {
          id: String(Date.now()),
          submittedBy: user?.name || "Team Member",
          reportType: "DAILY",
          customerName: "Internal Operations",
          projectTitle: `Daily Standup - ${new Date().toLocaleDateString()}`,
          status: "COMPLETED",
          summary: clockOutReportSummary,
          deliverables: clockOutReportDeliverables,
          blockers: clockOutReportBlockers,
          hoursSpent: Number(clockOutReportHours) || 8,
          createdAt: new Date().toISOString(),
        },
        ...reportsList,
      ]);
      alert("✓ Daily standup report filed and Punched Out successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePersonalTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTask = await createTask({
        ...personalTaskForm,
        assignedToId: currentEmployeeId,
      });
      setTasks([newTask, ...tasks]);
      setShowAddPersonalTaskModal(false);
      setPersonalTaskForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedHours: 4,
      });
      alert(`Task "${newTask.title}" added to your sprint board!`);
    } catch (err: any) {
      alert(err.message);
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

  // Handlers - Leave & WFH & Half Day
  const handleAssignLeaveOrWFH = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await assignLeaveOrWFH(assignLeaveFormData);
      setLeaves([...created, ...leaves]);
      setShowAssignLeaveModal(false);
      alert(
        `✓ Successfully assigned ${assignLeaveFormData.type.replace(/_/g, " ")} to ${
          assignLeaveFormData.target === "ALL" ? "All Employees" : "the selected employee"
        }!`
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newLeave = await applyLeave({
        ...leaveFormData,
        employeeId: userRole === "EMPLOYEE" ? currentEmployeeId : leaveFormData.employeeId,
      });
      setLeaves([newLeave, ...leaves]);
      setShowApplyLeaveModal(false);
      alert(`Request for ${leaveFormData.type} submitted successfully!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setLoading(true);
    try {
      const updated = await updateLeaveStatus(leaveId, status);
      setLeaves(leaves.map((l) => (l.id === leaveId ? updated : l)));
      alert(`Leave request marked as ${status}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadSalarySlipPDF = (slp: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download/print the salary slip PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary_Slip_${slp.slipCode}_${slp.employee?.user?.name || "Employee"}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: #fff; }
            .container { max-width: 800px; margin: 0 auto; border: 2px solid #cbd5e1; border-radius: 16px; padding: 32px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .company { font-size: 24px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; color: #64748b; font-family: monospace; text-transform: uppercase; font-weight: bold; }
            .slip-code { font-family: monospace; font-size: 14px; font-weight: bold; color: #2563eb; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 12px; }
            .meta-title { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: monospace; }
            .meta-val { font-weight: bold; color: #0f172a; margin-top: 2px; }
            .tables { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 13px; }
            .section-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .sec-title { font-weight: bold; font-size: 12px; text-transform: uppercase; font-family: monospace; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; }
            .row.total { font-weight: bold; border-top: 2px solid #e2e8f0; border-bottom: none; margin-top: 8px; padding-top: 10px; }
            .net-banner { background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
            .net-title { font-size: 12px; font-weight: bold; color: #065f46; text-transform: uppercase; font-family: monospace; }
            .net-amount { font-size: 28px; font-weight: 900; color: #047857; font-family: monospace; }
            .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; font-family: monospace; border-top: 1px solid #f1f5f9; padding-top: 16px; }
            @media print {
              body { padding: 0; }
              .container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="company">ENTERPRISE ERP WORKFORCE</div>
                <div class="subtitle">Official Verified Payslip & Compensation Statement</div>
              </div>
              <div style="text-align: right;">
                <div class="slip-code">${slp.slipCode}</div>
                <div style="font-size: 12px; color: #64748b; font-family: monospace; margin-top: 4px;">Period: ${slp.month}/${slp.year}</div>
              </div>
            </div>

            <div class="grid">
              <div>
                <div class="meta-title">Employee Name</div>
                <div class="meta-val">${slp.employee?.user?.name || "Employee"}</div>
                <div style="font-size: 11px; color: #64748b; font-family: monospace;">${slp.employee?.employeeCode || ""}</div>
              </div>
              <div>
                <div class="meta-title">Department</div>
                <div class="meta-val">${slp.employee?.department?.name || "General"}</div>
              </div>
              <div>
                <div class="meta-title">Designation</div>
                <div class="meta-val">${slp.employee?.designation?.name || "Staff"}</div>
              </div>
              <div>
                <div class="meta-title">Working Days</div>
                <div class="meta-val" style="font-family: monospace;">${slp.presentDays || 28} / ${slp.totalWorkingDays || 30} Days</div>
              </div>
            </div>

            <div class="tables">
              <div class="section-box">
                <div class="sec-title" style="color: #2563eb;">Earnings (A)</div>
                <div class="row">
                  <span>Basic Salary</span>
                  <span style="font-family: monospace; font-weight: 600;">₹${Number(slp.basicSalary || 0).toLocaleString("en-IN")}</span>
                </div>
                <div class="row">
                  <span>House Rent Allowance (HRA)</span>
                  <span style="font-family: monospace; font-weight: 600;">₹${Number(slp.hra || 0).toLocaleString("en-IN")}</span>
                </div>
                <div class="row">
                  <span>Special Allowance & Bonus</span>
                  <span style="font-family: monospace; font-weight: 600;">₹${Number((slp.specialAllow || 0) + (slp.bonus || 0)).toLocaleString("en-IN")}</span>
                </div>
                <div class="row total">
                  <span>Gross Earnings</span>
                  <span style="font-family: monospace; color: #2563eb;">₹${Number(slp.grossSalary || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div class="section-box">
                <div class="sec-title" style="color: #e11d48;">Deductions (B)</div>
                <div class="row">
                  <span>Provident Fund (PF)</span>
                  <span style="font-family: monospace; font-weight: 600; color: #e11d48;">-₹${Number(slp.pfDeduction || 0).toLocaleString("en-IN")}</span>
                </div>
                <div class="row">
                  <span>Income Tax / TDS</span>
                  <span style="font-family: monospace; font-weight: 600; color: #e11d48;">-₹${Number(slp.taxDeduction || 0).toLocaleString("en-IN")}</span>
                </div>
                <div class="row">
                  <span>Leave / LOP Deduction</span>
                  <span style="font-family: monospace; font-weight: 600; color: #e11d48;">-₹${Number(slp.leaveDeduction || 0).toLocaleString("en-IN")}</span>
                </div>
                <div class="row total">
                  <span style="color: #e11d48;">Total Deductions</span>
                  <span style="font-family: monospace; color: #e11d48;">-₹${Number(slp.totalDeduction || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div class="net-banner">
              <div>
                <div class="net-title">Net Take-Home Salary Payable (A - B)</div>
                <div class="net-amount">₹${Number(slp.netSalary || 0).toLocaleString("en-IN")}</div>
              </div>
              <div style="background: #047857; color: white; padding: 6px 16px; border-radius: 9999px; font-weight: bold; font-size: 12px; font-family: monospace;">
                ${slp.paymentStatus || "PAID"}
              </div>
            </div>

            <div class="footer">
              This is a computer generated salary statement and does not require a physical signature. • Generated on ${new Date().toLocaleDateString()}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Handlers - Holidays & Sundays
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hol = await addHoliday(holidayFormData);
      setHolidays([...holidays, hol].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setShowAddHolidayModal(false);
      alert(`Holiday "${hol.title}" added to calendar!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Are you sure you want to remove this holiday?")) return;
    setLoading(true);
    try {
      await deleteHoliday(id);
      setHolidays(holidays.filter((h) => h.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Queries
  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = await createEmployeeQuery(queryFormData);
      setQueries([q, ...queries]);
      setShowRaiseQueryModal(false);
      setQueryFormData({ recipient: "MANAGER", category: "SALARY_PAYROLL", subject: "", description: "", priority: "MEDIUM" });
      alert(`Helpdesk ticket ${q.queryCode} created! HR will review it.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueryForResolve) return;
    setLoading(true);
    try {
      const updated = await resolveEmployeeQuery(selectedQueryForResolve.id, queryResolveText, "RESOLVED");
      setQueries(queries.map((q) => (q.id === updated.id ? updated : q)));
      setSelectedQueryForResolve(null);
      setQueryResolveText("");
      alert(`Ticket ${updated.queryCode} resolved with response.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Salary Slip
  const handleGenerateSalarySlip = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slip = await generateSalarySlip(slipFormData);
      const existingIdx = salarySlips.findIndex((s) => s.id === slip.id);
      if (existingIdx >= 0) {
        const updatedList = [...salarySlips];
        updatedList[existingIdx] = slip;
        setSalarySlips(updatedList);
      } else {
        setSalarySlips([slip, ...salarySlips]);
      }
      setShowGenerateSlipModal(false);
      alert(`Salary slip ${slip.slipCode} generated successfully!`);
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
        dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedHours: 8,
      });
      alert(`Daily Task ${newTask.taskCode} created!`);
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

  const openTaskProgressModal = (task: any) => {
    setSelectedTaskForProgress(task);
    setTaskProgressHours(1);
    setTaskProgressStatus(task.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS");
    setTaskProgressNote("");
  };

  const handleTaskProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForProgress) return;
    setTaskProgressLoading(true);
    try {
      const updated = await logTaskHourlyProgress({
        taskId: selectedTaskForProgress.id,
        hoursSpent: taskProgressHours,
        progressNote: taskProgressNote,
        newStatus: taskProgressStatus,
      });
      setTasks(tasks.map((t) => (t.id === selectedTaskForProgress.id ? { ...t, ...updated } : t)));
      alert(`Progress logged! Added ${taskProgressHours}h to ${selectedTaskForProgress.taskCode}`);
      setSelectedTaskForProgress(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTaskProgressLoading(false);
    }
  };

  const handleQuickAddHourToTask = async (task: any, e: React.MouseEvent) => {
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
  const wfhCount = allAttendances.filter((a) => a.status === "WORK_FROM_HOME" || a.status === "WFH").length;
  const halfDayCount = allAttendances.filter((a) => a.status === "HALF_DAY").length;

  const filteredAttendances = allAttendances.filter((a) => {
    if (attendanceFilter === "ALL") return true;
    return a.status === attendanceFilter;
  });

  const filteredLeaves = leaves.filter((l) => {
    const matchesType = leaveTypeFilter === "ALL" || l.type === leaveTypeFilter;
    const matchesStatus = leaveStatusFilter === "ALL" || l.status === leaveStatusFilter;
    return matchesType && matchesStatus;
  });

  const filteredQueries = queries.filter((q) => {
    const matchesCat = queryCategoryFilter === "ALL" || q.category === queryCategoryFilter;
    const matchesStat = queryStatusFilter === "ALL" || q.status === queryStatusFilter;
    return matchesCat && matchesStat;
  });

  const filteredHolidays = holidays.filter((h) => {
    if (holidayTypeFilter === "ALL") return true;
    return h.type === holidayTypeFilter;
  });

  // Calculate quick upcoming Sundays for current month
  const getUpcomingSundays = () => {
    const list = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (d.getDay() === 0) {
        list.push(d);
      }
    }
    return list;
  };
  const sundaysThisMonth = getUpcomingSundays();

  const boardColumns = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

  // Department Scoped records
  const scopedEmployees = isManagerMode
    ? employees.filter((e) => e.departmentId === userDeptId || (userDeptName && e.department?.name?.toLowerCase().includes(userDeptName)))
    : employees;

  const scopedAttendances = isManagerMode
    ? allAttendances.filter((a) => a.employee?.departmentId === userDeptId || (userDeptName && a.employee?.department?.name?.toLowerCase().includes(userDeptName)))
    : isEmployeeMode
    ? allAttendances.filter((a) => a.employeeId === currentEmployeeId)
    : allAttendances;

  const scopedLeaves = isManagerMode
    ? leaves.filter((l) => l.employee?.departmentId === userDeptId || (userDeptName && l.employee?.department?.name?.toLowerCase().includes(userDeptName)))
    : isEmployeeMode
    ? leaves.filter((l) => l.employeeId === currentEmployeeId)
    : leaves;

  const scopedSlips = isManagerMode
    ? salarySlips.filter((s) => s.employee?.departmentId === userDeptId || (userDeptName && s.employee?.department?.name?.toLowerCase().includes(userDeptName)))
    : isEmployeeMode
    ? salarySlips.filter((s) => s.employeeId === currentEmployeeId)
    : salarySlips;

  const scopedQueries = isManagerMode
    ? queries.filter((q) => q.employee?.departmentId === userDeptId || (userDeptName && q.employee?.department?.name?.toLowerCase().includes(userDeptName)))
    : isEmployeeMode
    ? queries.filter((q) => q.employeeId === currentEmployeeId)
    : queries;

  const scopedTasks = isManagerMode
    ? tasks.filter((t) => t.assignedTo?.departmentId === userDeptId || (userDeptName && t.assignedTo?.department?.name?.toLowerCase().includes(userDeptName)))
    : isEmployeeMode
    ? tasks.filter((t) => t.assignedToId === currentEmployeeId)
    : tasks;

  const scopedReports = isManagerMode
    ? reportsList.filter((r) => r.departmentId === userDeptId || (userDeptName && r.department?.toLowerCase().includes(userDeptName)))
    : isEmployeeMode
    ? reportsList.filter((r) => r.submittedBy === user?.name || r.employeeId === currentEmployeeId)
    : reportsList;

  const presentStaff = scopedAttendances.filter((a) => {
    const isToday = new Date(a.date).toDateString() === new Date().toDateString();
    return isToday && Boolean(a.checkIn || a.status === "PRESENT");
  });

  const presentEmpIds = new Set(presentStaff.map((a) => a.employeeId));
  const absentStaff = scopedEmployees.filter((e) => !presentEmpIds.has(e.id));

  const userApprovedPaidLeaves = leaves.filter(
    (l) => l.employeeId === currentEmployeeId && l.status === "APPROVED" && (l.type === "PAID" || l.type === "CASUAL" || l.type === "SICK")
  ).length;
  const remainingPaidLeaves = Math.max(0, 12 - userApprovedPaidLeaves);

  // Sidebar navigation sections: hide DIRECTORY in employee mode!
  const allSections = [
    { key: "DIRECTORY", label: "Staff Directory", icon: Users, count: scopedEmployees.length, color: "text-blue-600", showInEmployee: false },
    { key: "ATTENDANCE", label: "Attendance & Shifts", icon: Clock, count: scopedAttendances.length, color: "text-emerald-600", showInEmployee: true },
    { key: "LEAVE", label: "Leave & WFH & Half Day", icon: Calendar, count: scopedLeaves.filter((l) => l.status === "PENDING").length || scopedLeaves.length, color: "text-amber-600", showInEmployee: true },
    { key: "PAYROLL", label: "Salary Slips & Payroll", icon: DollarSign, count: scopedSlips.length, color: "text-indigo-600", showInEmployee: true },
    { key: "HOLIDAYS", label: "Holidays & Sundays", icon: Sparkles, count: holidays.length, color: "text-rose-600", showInEmployee: true },
    { key: "QUERIES", label: "Helpdesk & Queries", icon: MessageSquare, count: scopedQueries.filter((q) => q.status === "OPEN").length || scopedQueries.length, color: "text-purple-600", showInEmployee: true },
    { key: "TASKS", label: "Sprint Tasks", icon: CheckSquare, count: scopedTasks.length, color: "text-cyan-600", showInEmployee: true },
    { key: "REPORTS", label: "Work Reports", icon: BarChart3, count: scopedReports.length, color: "text-violet-600", showInEmployee: true },
  ];

  const mainSections = allSections.filter((s) => (isEmployeeMode ? s.showInEmployee : true));

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
                  <h2 className="font-bold text-xs text-slate-900 truncate">
                    {isAdmin ? "Executive HR & Operations" : isManagerMode ? `${user?.department || "Department"} Manager` : "Employee Self-Service"}
                  </h2>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isAdmin ? "Company Wide Management" : isManagerMode ? "Department Team Operations" : `${user?.name || "Staff Member"}`}
                  </p>
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

          {/* MANAGER MODE SWITCHER TOGGLE */}
          {isManager && (
            <div className="p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setManagerMode("MANAGER");
                  setActiveTab("DIRECTORY");
                }}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer",
                  managerMode === "MANAGER"
                    ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                👔 Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setManagerMode("EMPLOYEE");
                  setActiveTab("ATTENDANCE");
                }}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer",
                  managerMode === "EMPLOYEE"
                    ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                👤 Employee
              </button>
            </div>
          )}

          {/* Module View Switcher */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              HR & Operations
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
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                      )}
                    >
                      {sec.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contextual Sub-filters */}
          {activeTab === "DIRECTORY" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Departments
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedDept("ALL")}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                      selectedDept === "ALL" ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                        selectedDept === d.id ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
            </div>
          )}

          {activeTab === "ATTENDANCE" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Attendance Status
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Logs", count: allAttendances.length },
                    { key: "PRESENT", label: "Present On-Floor", count: presentCount },
                    { key: "WORK_FROM_HOME", label: "Work From Home", count: wfhCount },
                    { key: "HALF_DAY", label: "Half Day", count: halfDayCount },
                    { key: "LATE", label: "Late Arrivals", count: lateCount },
                    { key: "LEAVE", label: "On Leave", count: leaveCount },
                    { key: "ABSENT", label: "Absent", count: absentCount },
                  ].map((af) => (
                    <button
                      key={af.key}
                      onClick={() => setAttendanceFilter(af.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        attendanceFilter === af.key ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{af.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{af.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "LEAVE" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Leave & WFH Types
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Requests" },
                    { key: "CASUAL", label: "Casual Leave" },
                    { key: "SICK", label: "Sick Leave" },
                    { key: "HALF_DAY", label: "Half Day (0.5d)" },
                    { key: "WORK_FROM_HOME", label: "Work From Home (WFH)" },
                    { key: "PAID", label: "Earned / Paid Leave" },
                    { key: "UNPAID", label: "Unpaid / LOP" },
                  ].map((lt) => (
                    <button
                      key={lt.key}
                      onClick={() => setLeaveTypeFilter(lt.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        leaveTypeFilter === lt.key ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{lt.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {lt.key === "ALL" ? leaves.length : leaves.filter((l) => l.type === lt.key).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "HOLIDAYS" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Holiday Classification
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Holidays" },
                    { key: "NATIONAL", label: "National Holidays" },
                    { key: "FESTIVAL", label: "Festival Holidays" },
                    { key: "SUNDAY", label: "Sunday / Weekly Offs" },
                    { key: "OPTIONAL", label: "Optional / Restricted" },
                  ].map((ht) => (
                    <button
                      key={ht.key}
                      onClick={() => setHolidayTypeFilter(ht.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        holidayTypeFilter === ht.key ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{ht.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {ht.key === "ALL" ? holidays.length : holidays.filter((h) => h.type === ht.key).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sunday Rule</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Sundays are standard paid company weekend offs. Any work on Sundays qualifies for compensatory off.
                </p>
              </div>
            </div>
          )}

          {activeTab === "QUERIES" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Query Status
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Tickets" },
                    { key: "OPEN", label: "Open Tickets" },
                    { key: "RESOLVED", label: "Resolved" },
                  ].map((qs) => (
                    <button
                      key={qs.key}
                      onClick={() => setQueryStatusFilter(qs.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        queryStatusFilter === qs.key ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{qs.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {qs.key === "ALL" ? queries.length : queries.filter((q) => q.status === qs.key).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "REPORTS" && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Report Type
                </div>
                <div className="space-y-1">
                  {[
                    { key: "ALL", label: "All Reports", count: reportsList.length },
                    { key: "DAILY", label: "Daily Standups", count: reportsList.filter((r) => r.reportType === "DAILY").length },
                    { key: "WEEKLY", label: "Weekly Milestones", count: reportsList.filter((r) => r.reportType === "WEEKLY").length },
                    { key: "CLIENT", label: "Client Deliverables", count: reportsList.filter((r) => r.reportType === "CLIENT" || r.reportType === "MONTHLY").length },
                  ].map((rt) => (
                    <button
                      key={rt.key}
                      onClick={() => setReportTypeFilter(rt.key as any)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                        reportTypeFilter === rt.key ? "bg-slate-200/70 text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <span>{rt.label}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{rt.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-violet-900">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
                  <span>Report Filing</span>
                </div>
                <p className="text-[11px] text-violet-700 leading-relaxed">
                  Employees can submit daily standups, weekly roadmaps, and client project reports.
                </p>
              </div>
            </div>
          )}
        </aside>
      ) : (
        <div className="hidden md:flex flex-col items-center py-4 px-2 bg-white border-r border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            title="Expand operations sidebar"
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 transition-all shadow-xs cursor-pointer"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Employee Directory
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Staff Profiles, Roles, Designations & Workforce Overview
                </p>
              </div>

              {["ADMIN", "MANAGER"].includes(userRole) && (
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                value="95.4%"
                trend="↑ 2.1%"
                comparisonText="monthly avg"
                isPositive={true}
                icon={UserCheck}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
              <KpiCard
                title="ACTIVE LEAVES & WFH"
                value={leaves.filter((l) => l.status === "APPROVED").length}
                comparisonText="approved requests"
                isPositive={true}
                icon={Calendar}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />
            </div>

            {/* Search and Table */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedDept("ALL")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                    selectedDept === "ALL" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  All ({employees.length})
                </button>
                {departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDept(d.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      selectedDept === d.id ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {d.name} ({employees.filter((e) => e.departmentId === d.id).length})
                  </button>
                ))}
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Contact</th>
                      <th className="py-3 px-4 text-right">Actions</th>
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
                        <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                          {emp.phone || emp.user?.email}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
                          >
                            View Profile
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Attendance & Shift Logs
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shift Attendance Records, Half-Day/WFH Auditing & Live Timesheets
                </p>
              </div>
            </div>

            {/* PUNCH IN / PUNCH OUT TERMINAL CARD (Only for Employee Mode) */}
            {isEmployeeMode && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 border border-white/30 text-white">
                        Daily Biometric Terminal
                      </span>
                      <span className="text-xs text-white/80 font-mono">
                        {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight">
                      {isCheckedIn ? (isCheckedOut ? "Shift Completed for Today" : "Currently Punched In & Working") : "Ready to Start Shift"}
                    </h3>
                    <p className="text-xs text-white/80">
                      {isCheckedIn
                        ? isCheckedOut
                          ? `Shift Logged • Punched in at ${formatTime(todayAttendance?.checkIn)} • Punched out at ${formatTime(todayAttendance?.checkOut)}`
                          : `Punched in at ${formatTime(todayAttendance?.checkIn)}. Remember to submit your daily standup work report upon punch out.`
                        : "Start your working day by clicking Punch In. When leaving, submit your daily report to punch out."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCheckedIn ? (
                      <button
                        type="button"
                        onClick={handleClockIn}
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer transform hover:scale-105"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Punch In</span>
                      </button>
                    ) : !isCheckedOut ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleBreak}
                          disabled={loading}
                          className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Coffee className="w-4 h-4" />
                          <span>{ongoingBreak ? "Resume Work" : "Break"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClockOutModal(true)}
                          disabled={loading}
                          className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transform hover:scale-105"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          <span>Punch Out (Submit Report)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-xs font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Shift Finished</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance KPIs (Visible for Admin and Manager Views) */}
            {isManagerOrAdminView && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="PRESENT TODAY"
                  value={presentStaff.length}
                  trend="View Today's Roster ↗"
                  comparisonText="click to view present & absent list"
                  isPositive={true}
                  icon={UserCheck}
                  iconColor="text-emerald-600 bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20"
                  className="border-emerald-200/80 hover:border-emerald-500 hover:shadow-emerald-100/50 cursor-pointer relative"
                  onClick={() => {
                    setShowTodayAttendanceModal(true);
                  }}
                />
                <KpiCard
                  title="WORK FROM HOME"
                  value={wfhCount}
                  comparisonText="remote active"
                  isPositive={true}
                  icon={Laptop}
                  iconColor="text-blue-600 bg-blue-50 border-blue-200"
                />
                <KpiCard
                  title="HALF DAY"
                  value={halfDayCount}
                  comparisonText="half day shifts"
                  isPositive={true}
                  icon={Clock}
                  iconColor="text-amber-600 bg-amber-50 border-amber-200"
                />
                <KpiCard
                  title="LEAVE / ABSENT"
                  value={leaveCount + absentCount}
                  comparisonText="planned & unannounced"
                  isPositive={false}
                  icon={UserX}
                  iconColor="text-rose-600 bg-rose-50 border-rose-200"
                />
              </div>
            )}

            {/* For Employee Mode: Personal Attendance Overview Cards */}
            {isEmployeeMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">My Present Shifts</span>
                    <p className="text-lg font-bold text-slate-900 font-mono">
                      {scopedAttendances.filter((a) => a.status === "PRESENT" || a.checkIn).length} Days
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Remote / WFH</span>
                    <p className="text-lg font-bold text-slate-900 font-mono">
                      {scopedAttendances.filter((a) => a.status === "WORK_FROM_HOME" || a.status === "WFH").length} Days
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Remaining Paid Leaves</span>
                    <p className="text-lg font-bold text-emerald-600 font-mono">
                      {remainingPaidLeaves} / 12 Days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance View Switcher Buttons & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode("TODAY")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                    attendanceViewMode === "TODAY"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isEmployeeMode ? "My Today's Shift Logs" : "Today's Live Timesheet"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode("MONTHLY")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                    attendanceViewMode === "MONTHLY"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isEmployeeMode ? "My Month-Wise Attendance History" : "Full Month Staff Presence & Leave Audit"}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/20 font-extrabold">
                    {isEmployeeMode ? "Personal" : `${scopedEmployees.length} Staff`}
                  </span>
                </button>
              </div>

              {attendanceViewMode === "MONTHLY" && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <select
                      value={monthlyAttendanceMonth}
                      onChange={(e) => setMonthlyAttendanceMonth(Number(e.target.value))}
                      className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    >
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={monthlyAttendanceYear}
                      onChange={(e) => setMonthlyAttendanceYear(Number(e.target.value))}
                      className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isManagerOrAdminView && (
                    <div className="relative w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search staff in month..."
                        value={monthlyAttendanceSearch}
                        onChange={(e) => setMonthlyAttendanceSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MODE 1: FULL MONTH PRESENCE REGISTER VIEW */}
            {attendanceViewMode === "MONTHLY" ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Comprehensive Full Month Employee Presence Table */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {isEmployeeMode
                          ? `My Monthly Attendance Record (${monthlyAttendanceMonth}/${monthlyAttendanceYear})`
                          : `Monthly Employee Attendance Register (${monthlyAttendanceMonth}/${monthlyAttendanceYear})`}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isEmployeeMode
                          ? "Summary of your total present days, approved leaves, WFH, and attendance percentage."
                          : "Click any employee row to open their detailed daily attendance log and breakdown."}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      30-Day Cycle • 12 Annual Leaves Quota
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                        <tr>
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Department & Designation</th>
                          <th className="py-3 px-4 text-center">Cycle Days</th>
                          <th className="py-3 px-4 text-center font-bold text-emerald-700">Present Days</th>
                          <th className="py-3 px-4 text-center text-blue-700 font-semibold">WFH (Remote)</th>
                          <th className="py-3 px-4 text-center text-amber-700 font-semibold">Half Days</th>
                          <th className="py-3 px-4 text-center text-purple-700 font-semibold">Leaves Taken (Annual 12)</th>
                          <th className="py-3 px-4 text-center text-rose-700 font-semibold">Unpaid Days</th>
                          <th className="py-3 px-4 text-right font-bold">Attendance %</th>
                          {isManagerOrAdminView && <th className="py-3 px-4 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scopedEmployees
                          .filter((emp) => {
                            if (isEmployeeMode) return emp.id === currentEmployeeId;
                            const q = monthlyAttendanceSearch.toLowerCase();
                            return (
                              !q ||
                              emp.user?.name?.toLowerCase().includes(q) ||
                              emp.employeeCode?.toLowerCase().includes(q) ||
                              emp.department?.name?.toLowerCase().includes(q) ||
                              emp.designation?.name?.toLowerCase().includes(q)
                            );
                          })
                          .map((emp) => {
                            const matchingSlip = salarySlips.find(
                              (s) =>
                                s.employeeId === emp.id &&
                                s.month === monthlyAttendanceMonth &&
                                s.year === monthlyAttendanceYear
                            );

                            const totalWorkDays = matchingSlip?.totalWorkingDays || 30;
                            const presentDays = matchingSlip?.presentDays ?? 28;
                            const wfhDays = matchingSlip?.wfhDays ?? 0;
                            const halfDays = matchingSlip?.halfDays ?? 0;
                            const unpaidLeaves = matchingSlip?.unpaidLeaves ?? 0;

                            // Calculate actual leaves taken by this employee in the year (Total Quota = 12)
                            const empApprovedLeavesList = leaves.filter(
                              (l) => l.employeeId === emp.id && l.status === "APPROVED" && ["CASUAL", "SICK", "PAID"].includes(l.type)
                            );
                            const totalAnnualLeavesTaken = empApprovedLeavesList.reduce((acc, l) => acc + (l.daysCount || 1), 0) || (matchingSlip?.paidLeaves ?? 1);
                            const annualQuota = 12;
                            const remainingLeaves = Math.max(0, annualQuota - totalAnnualLeavesTaken);

                            const effectivePresence = presentDays + wfhDays + halfDays * 0.5 + (matchingSlip?.paidLeaves ?? 2);
                            const presencePercentage = Math.min(100, Math.round((effectivePresence / totalWorkDays) * 100));

                            return (
                              <tr
                                key={emp.id}
                                onClick={() => {
                                  setSelectedEmployeeForAttendance(emp);
                                  setSelectedAttendanceMonth(monthlyAttendanceMonth);
                                  setSelectedAttendanceYear(monthlyAttendanceYear);
                                }}
                                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold font-mono group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                      {emp.user?.name?.charAt(0) || "E"}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{emp.user?.name}</div>
                                      <div className="text-[11px] text-slate-500 font-mono">{emp.employeeCode}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">{emp.designation?.name || "Executive"}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">{emp.department?.name || "General"}</div>
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                                  {totalWorkDays} Days
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                                    {presentDays} Days
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-blue-700 font-medium">
                                  {wfhDays > 0 ? `${wfhDays} Days` : "-"}
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-amber-700 font-medium">
                                  {halfDays > 0 ? `${halfDays} Shifts` : "-"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="font-mono font-bold text-slate-900 text-xs">
                                      {totalAnnualLeavesTaken} {totalAnnualLeavesTaken === 1 ? "Leave" : "Leaves"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5">
                                      {remainingLeaves} Remaining ({remainingLeaves}/12)
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-rose-600 font-medium">
                                  {unpaidLeaves > 0 ? `${unpaidLeaves} Days` : "0"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={cn(
                                        "font-mono font-bold text-xs px-2 py-0.5 rounded-md border",
                                        presencePercentage >= 90
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : presencePercentage >= 75
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-rose-50 text-rose-700 border-rose-200"
                                      )}
                                    >
                                      {presencePercentage}%
                                    </span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                      <div
                                        className={cn(
                                          "h-full rounded-full",
                                          presencePercentage >= 90
                                            ? "bg-emerald-500"
                                            : presencePercentage >= 75
                                            ? "bg-amber-500"
                                            : "bg-rose-500"
                                        )}
                                        style={{ width: `${presencePercentage}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                {isManagerOrAdminView && (
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEmployeeForAttendance(emp);
                                        setSelectedAttendanceMonth(monthlyAttendanceMonth);
                                        setSelectedAttendanceYear(monthlyAttendanceYear);
                                      }}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] border border-blue-200 cursor-pointer transition-colors"
                                    >
                                      View Details ↗
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* MODE 2: TODAY'S LIVE TIMESHEET & PUNCH RECORDS */
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {isEmployeeMode ? "My Today's Shift Punch Records" : "Today's Timesheet & Punch Records"}
                    </h3>
                    <p className="text-xs text-slate-500">Live check-in times, punch logs and real-time status</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode("MONTHLY")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Switch to Full Month Register</span>
                  </button>
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
                      {filteredAttendances
                        .filter((att) => (isEmployeeMode ? att.employeeId === currentEmployeeId : true))
                        .map((att) => (
                          <tr
                            key={att.id}
                            onClick={() => {
                              if (att.employee) {
                                setSelectedEmployeeForAttendance(att.employee);
                                setSelectedAttendanceMonth(new Date().getMonth() + 1);
                                setSelectedAttendanceYear(new Date().getFullYear());
                              }
                            }}
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{att.employee?.user?.name || "Staff Member"}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{att.employee?.employeeCode}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-600 font-medium">
                              {att.checkIn ? formatTime(att.checkIn) : "-"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {att.checkOut ? formatTime(att.checkOut) : "Active Shift"}
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
            )}
          </div>
        )}

        {/* ======================= TAB 3: LEAVE, HALF DAY & WFH ======================= */}
        {activeTab === "LEAVE" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Leave & WFH Management
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Casual Leaves, Sick Leaves, Half-Day Approvals & Work From Home Applications
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApplyLeaveModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Apply for Leave / WFH</span>
                </button>
                {isManagerOrAdminView && (
                  <button
                    onClick={() => setShowAssignLeaveModal(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Assign Staff Leave</span>
                  </button>
                )}
              </div>
            </div>

            {/* Remaining Paid Leaves Banner for Employee Mode */}
            {isEmployeeMode && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 font-mono">
                    Annual Paid Leave Balance (Yearly Allowance: 12 Days)
                  </span>
                  <div className="text-2xl font-black font-mono">{remainingPaidLeaves} Days Remaining</div>
                  <p className="text-xs text-white/80">
                    Paid leaves & approved WFH are fully compensated. Half-days are 50% paid.
                  </p>
                </div>
                <button
                  onClick={() => setShowApplyLeaveModal(true)}
                  className="px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 cursor-pointer"
                >
                  Apply Leave
                </button>
              </div>
            )}

            {/* Leave KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="PENDING APPROVALS"
                value={leaves.filter((l) => l.status === "PENDING").length}
                comparisonText="requires manager action"
                isPositive={false}
                icon={Clock}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />
              <KpiCard
                title="HALF DAY REQUESTS"
                value={leaves.filter((l) => l.type === "HALF_DAY").length}
                comparisonText="0.5 day duration"
                isPositive={true}
                icon={Sun}
                iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
              />
              <KpiCard
                title="WFH REQUESTS"
                value={leaves.filter((l) => l.type === "WORK_FROM_HOME").length}
                comparisonText="remote work days"
                isPositive={true}
                icon={Home}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />
              <KpiCard
                title="APPROVED THIS MONTH"
                value={leaves.filter((l) => l.status === "APPROVED").length}
                comparisonText="granted leaves"
                isPositive={true}
                icon={CheckCircle2}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
            </div>

            {/* Leave Requests Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">Applications & Leave History</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={leaveStatusFilter}
                    onChange={(e) => setLeaveStatusFilter(e.target.value)}
                    className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Duration / Date</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      {["ADMIN", "MANAGER"].includes(userRole) && <th className="py-3 px-4 text-right">Review</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeaves.map((lv) => (
                      <tr key={lv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{lv.employee?.user?.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{lv.employee?.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded font-mono text-[10px] font-bold",
                              lv.type === "WORK_FROM_HOME"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : lv.type === "HALF_DAY"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            )}
                          >
                            {lv.type.replace(/_/g, " ")} {lv.halfDayType ? `(${lv.halfDayType})` : ""}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div>
                            {formatDate(lv.startDate)}
                            {lv.startDate !== lv.endDate ? ` → ${formatDate(lv.endDate)}` : ""}
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold">{lv.daysCount} Day(s)</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{lv.reason}</td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={lv.status} />
                        </td>
                        {["ADMIN", "MANAGER"].includes(userRole) && (
                          <td className="py-3 px-4 text-right">
                            {lv.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleReviewLeave(lv.id, "APPROVED")}
                                  disabled={loading}
                                  className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                                  title="Approve"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleReviewLeave(lv.id, "REJECTED")}
                                  disabled={loading}
                                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                  title="Reject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Reviewed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredLeaves.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No leave or WFH records match the filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 4: SALARY SLIP & PAYROLL ======================= */}
        {activeTab === "PAYROLL" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Salary Slips & Payroll
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated Monthly Compensation, Deductions (PF/Tax/Unpaid Leaves) & Instant Payslip PDF Download
                </p>
              </div>
            </div>

            {/* Payroll KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="TOTAL PAYROLL PROCESSED"
                value={formatCurrency(salarySlips.reduce((acc, s) => acc + s.netSalary, 0) || 540000)}
                comparisonText="total disbursement"
                isPositive={true}
                icon={DollarSign}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
              <KpiCard
                title="TOTAL SLIPS ISSUED"
                value={salarySlips.length}
                comparisonText="verified records"
                isPositive={true}
                icon={FileText}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />
              <KpiCard
                title="AVG MONTHLY SALARY"
                value={formatCurrency(
                  salarySlips.length > 0
                    ? Math.round(salarySlips.reduce((acc, s) => acc + s.grossSalary, 0) / salarySlips.length)
                    : 65000
                )}
                comparisonText="per employee"
                isPositive={true}
                icon={Award}
                iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
              />
              <KpiCard
                title="PF & TAX DEDUCTED"
                value={formatCurrency(salarySlips.reduce((acc, s) => acc + s.totalDeduction, 0) || 68000)}
                comparisonText="statutory deductions"
                isPositive={true}
                icon={Briefcase}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />
            </div>

            {/* Slips Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Automated Employee Salary Slips</h3>
                <span className="text-xs text-slate-500 font-mono">100% Automated Auto-Calculated Payroll</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Slip Code</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Period (Month/Year)</th>
                      <th className="py-3 px-4">Gross Salary</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4 font-bold text-emerald-700">Net Take-Home</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salarySlips.map((slp) => (
                      <tr key={slp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{slp.slipCode}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{slp.employee?.user?.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{slp.employee?.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {slp.month}/{slp.year}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-900 font-semibold">{formatCurrency(slp.grossSalary)}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-medium">-{formatCurrency(slp.totalDeduction)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{formatCurrency(slp.netSalary)}</td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={slp.paymentStatus} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSlipForView(slp)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="View full statement breakdown"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadSalarySlipPDF(slp)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                              title="Download official PDF Salary Statement"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {salarySlips.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No salary slips found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 5: HOLIDAYS & SUNDAYS ======================= */}
        {activeTab === "HOLIDAYS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Holiday Calendar & Sunday Configuration
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Company Holidays, Festival Observances & Sunday Weekend Off Rules
                </p>
              </div>

              {["ADMIN", "MANAGER"].includes(userRole) && (
                <button
                  onClick={() => setShowAddHolidayModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mark Holiday</span>
                </button>
              )}
            </div>

            {/* Sundays Card Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Sunday Mandatory Off Policy</h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Every Sunday is designated as a paid rest day across all departments. {sundaysThisMonth.length} Sundays this month.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-mono">
                <span>Sundays this month:</span>
                <span className="font-bold">{sundaysThisMonth.map((s) => s.getDate()).join(", ")}</span>
              </div>
            </div>

            {/* Holiday Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHolidays.map((hol) => (
                <div
                  key={hol.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                          {formatDate(hol.date)}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{hol.title}</h4>
                      </div>
                      <StatusBadge status={hol.type} size="sm" />
                    </div>
                    {hol.description && <p className="text-xs text-slate-500">{hol.description}</p>}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[10px]">{hol.isRecurring ? "Annual Recurring" : "One-Time"}</span>
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => handleDeleteHoliday(hol.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB 6: HELPDESK & QUERIES ======================= */}
        {activeTab === "QUERIES" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  HR & Employee Helpdesk Queries
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  View, raise, and resolve employee salary issues, attendance corrections, and HR inquiries
                </p>
              </div>

              <button
                onClick={() => setShowRaiseQueryModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Raise New Query / Issue</span>
              </button>
            </div>

            {/* Queries KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="OPEN TICKETS"
                value={queries.filter((q) => q.status === "OPEN").length}
                comparisonText="awaiting resolution"
                isPositive={false}
                icon={HelpCircle}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />
              <KpiCard
                title="RESOLVED"
                value={queries.filter((q) => q.status === "RESOLVED").length}
                comparisonText="closed queries"
                isPositive={true}
                icon={CheckCircle2}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
              <KpiCard
                title="SALARY QUERIES"
                value={queries.filter((q) => q.category === "SALARY_PAYROLL").length}
                comparisonText="payroll clarification"
                isPositive={true}
                icon={DollarSign}
                iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
              />
              <KpiCard
                title="AVG RESOLUTION TIME"
                value="< 4 hrs"
                comparisonText="SLA target met"
                isPositive={true}
                icon={Clock}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />
            </div>

            {/* Queries Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Query Tickets Log</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Ticket Code</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Subject & Details</th>
                      <th className="py-3 px-4 text-center">Priority</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueries.map((qry) => (
                      <tr key={qry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{qry.queryCode}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{qry.employee?.user?.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{qry.employee?.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-700">
                            {qry.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-semibold text-slate-900">{qry.subject}</div>
                          <p className="text-[11px] text-slate-500 truncate">{qry.description}</p>
                          {qry.response && (
                            <div className="mt-1 p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                              <strong>HR Response:</strong> {qry.response}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={qry.priority} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={qry.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {["ADMIN", "MANAGER"].includes(userRole) && qry.status === "OPEN" ? (
                            <button
                              onClick={() => {
                                setSelectedQueryForResolve(qry);
                                setQueryResolveText("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {qry.status === "RESOLVED" ? "Resolved" : "Logged"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredQueries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No query tickets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 7: SPRINT TASKS ======================= */}
        {activeTab === "TASKS" && (
          <div className="space-y-6">
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
                <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <button
                    onClick={() => setTaskViewMode("BOARD")}
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                      taskViewMode === "BOARD" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => setTaskViewMode("LIST")}
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                      taskViewMode === "LIST" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>

                <button
                  onClick={() => (isEmployeeMode ? setShowAddPersonalTaskModal(true) : setShowCreateTaskModal(true))}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isEmployeeMode ? "+ Add Personal Task" : "Assign Daily Task"}</span>
                </button>
              </div>
            </div>

            {/* Task Board */}
            {taskViewMode === "BOARD" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {boardColumns.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col);
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

                              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
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

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleQuickAddHourToTask(task, e)}
                                    title="Quickly add 1 hour completed"
                                    className="px-1.5 py-1 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer"
                                  >
                                    +1h
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openTaskProgressModal(task)}
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
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
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
                    {tasks.map((t) => {
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
                                onClick={(e) => handleQuickAddHourToTask(t, e)}
                                className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                              >
                                +1h
                              </button>
                              <button
                                type="button"
                                onClick={() => openTaskProgressModal(t)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Report</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 8: WORK & PROGRESS REPORTS ======================= */}
        {activeTab === "REPORTS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-violet-600" />
                  Employee Work & Activity Reports
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and review employee daily standup logs, weekly sprint updates, and milestone deliverables
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenReportModal("DAILY")}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ File Work Report</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="DAILY STANDUPS"
                value={reportsList.filter((r) => r.reportType === "DAILY").length}
                trend="Logged"
                comparisonText="standup submissions"
                isPositive={true}
                icon={Sun}
                iconColor="text-amber-600 bg-amber-50 border-amber-200"
              />
              <KpiCard
                title="WEEKLY ROADMAPS"
                value={reportsList.filter((r) => r.reportType === "WEEKLY").length}
                comparisonText="sprint reviews"
                isPositive={true}
                icon={CalendarDays}
                iconColor="text-blue-600 bg-blue-50 border-blue-200"
              />
              <KpiCard
                title="CLIENT DELIVERABLES"
                value={reportsList.filter((r) => r.reportType === "CLIENT" || r.reportType === "MONTHLY").length}
                comparisonText="project milestones"
                isPositive={true}
                icon={Briefcase}
                iconColor="text-purple-600 bg-purple-50 border-purple-200"
              />
              <KpiCard
                title="TOTAL REPORTS FILED"
                value={reportsList.length}
                trend="100% compliant"
                comparisonText="records in archive"
                isPositive={true}
                icon={CheckCircle2}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
              />
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search report titles, summaries, blockers..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { key: "ALL", label: "All" },
                  { key: "DAILY", label: "Daily" },
                  { key: "WEEKLY", label: "Weekly" },
                  { key: "CLIENT", label: "Client" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setReportTypeFilter(t.key as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      reportTypeFilter === t.key
                        ? "bg-violet-600 text-white font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {reportsList
                .filter((r) => {
                  const matchesFilter =
                    reportTypeFilter === "ALL" ||
                    (reportTypeFilter === "DAILY" && r.reportType === "DAILY") ||
                    (reportTypeFilter === "WEEKLY" && r.reportType === "WEEKLY") ||
                    (reportTypeFilter === "CLIENT" && (r.reportType === "CLIENT" || r.reportType === "MONTHLY"));

                  const matchesSearch =
                    !reportSearchQuery ||
                    r.projectTitle?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                    r.summary?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                    r.deliverables?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                    r.customerName?.toLowerCase().includes(reportSearchQuery.toLowerCase());

                  return matchesFilter && matchesSearch;
                })
                .map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-violet-300 transition-all space-y-3"
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
                              : "bg-violet-50 text-violet-800 border border-violet-200"
                          )}
                        >
                          {rep.reportType} REPORT
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{rep.projectTitle}</h3>
                        {rep.customerName && (
                          <span className="text-xs text-slate-500 font-mono">• {rep.customerName}</span>
                        )}
                        {rep.submittedBy && (
                          <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                            By: {rep.submittedBy}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {rep.hoursSpent && (
                          <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                            {rep.hoursSpent} hrs
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">{formatDate(rep.createdAt)}</span>
                        <StatusBadge status={rep.status || "COMPLETED"} size="sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          Summary & Accomplishments
                        </span>
                        <p className="text-slate-800 leading-relaxed">{rep.summary || "Daily activities on track."}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">
                          Key Deliverables
                        </span>
                        <p className="text-emerald-950 leading-relaxed">{rep.deliverables || "Completed tasks."}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                        <span className="text-[10px] font-bold text-blue-800 uppercase font-mono">
                          Next Steps & Road Ahead
                        </span>
                        <p className="text-blue-950 leading-relaxed">{rep.nextWeekPlan || "Continuing sprint execution."}</p>
                      </div>
                    </div>

                    {rep.blockers && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Blockers / Impediments:</strong> {rep.blockers}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {reportsList.length === 0 && (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No work reports submitted by employees yet</p>
                  <p className="text-xs text-slate-400">
                    Employee daily standups, weekly updates, and milestone deliverables will appear here once submitted.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* 0. ADMIN ASSIGN LEAVE / WFH / HALF DAY MODAL */}
      {showAssignLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign Leave / WFH / Half Day</h3>
                  <p className="text-xs text-slate-500">Assign for a specific employee or all employees</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignLeaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignLeaveOrWFH} className="space-y-3.5 text-xs">
              {/* Target Selection: Single Employee vs All Employees */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Assignment Target *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignLeaveFormData({ ...assignLeaveFormData, target: "SINGLE" })}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                      assignLeaveFormData.target === "SINGLE"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    <span>Single Employee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignLeaveFormData({ ...assignLeaveFormData, target: "ALL" })}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                      assignLeaveFormData.target === "ALL"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Building className="w-4 h-4" />
                    <span>All Employees ({employees.length})</span>
                  </button>
                </div>
              </div>

              {/* Single Employee Picker */}
              {assignLeaveFormData.target === "SINGLE" && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Employee *</label>
                  <select
                    value={assignLeaveFormData.employeeId}
                    onChange={(e) => setAssignLeaveFormData({ ...assignLeaveFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.user?.name} ({e.employeeCode}) {e.designation?.name ? `• ${e.designation.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave / WFH / Half Day Type */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Leave / Work Type *</label>
                <select
                  value={assignLeaveFormData.type}
                  onChange={(e) => setAssignLeaveFormData({ ...assignLeaveFormData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="WORK_FROM_HOME">Work From Home (WFH - Remote Work)</option>
                  <option value="HALF_DAY">Half Day Leave (0.5 Day)</option>
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="PAID">Earned / Paid Leave (PL)</option>
                  <option value="UNPAID">Unpaid Leave (LOP)</option>
                </select>
              </div>

              {/* Half Day Slot */}
              {assignLeaveFormData.type === "HALF_DAY" && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Half Day Timing Slot</label>
                  <select
                    value={assignLeaveFormData.halfDayType}
                    onChange={(e) => setAssignLeaveFormData({ ...assignLeaveFormData, halfDayType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="FIRST_HALF">First Half (09:00 AM - 01:30 PM)</option>
                    <option value="SECOND_HALF">Second Half (01:30 PM - 06:00 PM)</option>
                  </select>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={assignLeaveFormData.startDate}
                    onChange={(e) => setAssignLeaveFormData({ ...assignLeaveFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    disabled={assignLeaveFormData.type === "HALF_DAY"}
                    value={assignLeaveFormData.type === "HALF_DAY" ? assignLeaveFormData.startDate : assignLeaveFormData.endDate}
                    onChange={(e) => setAssignLeaveFormData({ ...assignLeaveFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason / Directive Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Remote sprint work, weather alert, planned management approved leave..."
                  value={assignLeaveFormData.reason}
                  onChange={(e) => setAssignLeaveFormData({ ...assignLeaveFormData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAssignLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Assigning..." : "Confirm & Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. APPLY LEAVE / WFH / HALF DAY MODAL */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply for Leave / WFH / Half Day</h3>
                <p className="text-xs text-slate-500">Submit an official request to your reporting manager</p>
              </div>
              <button
                onClick={() => setShowApplyLeaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              {["ADMIN", "MANAGER"].includes(userRole) && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Select Employee</label>
                  <select
                    value={leaveFormData.employeeId}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.user?.name} ({e.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Request Type *</label>
                <select
                  value={leaveFormData.type}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="HALF_DAY">Half Day Leave (0.5 Day)</option>
                  <option value="WORK_FROM_HOME">Work From Home (WFH)</option>
                  <option value="PAID">Earned / Paid Leave (PL)</option>
                  <option value="UNPAID">Unpaid Leave / Loss of Pay (LOP)</option>
                </select>
              </div>

              {leaveFormData.type === "HALF_DAY" && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Half Day Timing Slot</label>
                  <select
                    value={leaveFormData.halfDayType}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, halfDayType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="FIRST_HALF">First Half (09:00 AM - 01:30 PM)</option>
                    <option value="SECOND_HALF">Second Half (01:30 PM - 06:00 PM)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.startDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    disabled={leaveFormData.type === "HALF_DAY"}
                    value={leaveFormData.type === "HALF_DAY" ? leaveFormData.startDate : leaveFormData.endDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center justify-between font-mono">
                <span>Calculated Working Days:</span>
                <span className="font-bold text-blue-900 text-xs">{leaveFormData.daysCount} Day(s)</span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason / Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why you require this leave or WFH..."
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MARK HOLIDAY MODAL */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Mark Official Holiday</h3>
              <button
                onClick={() => setShowAddHolidayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Holiday Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali, Christmas, Independence Day"
                  value={holidayFormData.title}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayFormData.date}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={holidayFormData.type}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NATIONAL">National Holiday</option>
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="SUNDAY">Sunday Off</option>
                    <option value="OPTIONAL">Optional / Restricted</option>
                    <option value="COMPANY_OFF">Company Special Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Note</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={holidayFormData.description}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recHol"
                  checked={holidayFormData.isRecurring}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, isRecurring: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="recHol" className="text-slate-700 font-medium">
                  Annual Recurring Holiday
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddHolidayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Adding..." : "Save Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RAISE EMPLOYEE QUERY MODAL */}
      {showRaiseQueryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Raise Helpdesk Query / Issue</h3>
              <button
                onClick={() => setShowRaiseQueryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseQuery} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Route / Send Query To *</label>
                <select
                  value={queryFormData.recipient}
                  onChange={(e) => setQueryFormData({ ...queryFormData, recipient: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="MANAGER">Department Manager</option>
                  <option value="ADMIN">System Administrator / HR Head</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category *</label>
                  <select
                    value={queryFormData.category}
                    onChange={(e) => setQueryFormData({ ...queryFormData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SALARY_PAYROLL">Salary & Payroll</option>
                    <option value="LEAVE_ATTENDANCE">Leave & Attendance</option>
                    <option value="IT_SUPPORT">IT & Systems</option>
                    <option value="WORKPLACE">Workplace & Facility</option>
                    <option value="HR_POLICY">HR Policies</option>
                    <option value="GENERAL">General Query</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Priority</label>
                  <select
                    value={queryFormData.priority}
                    onChange={(e) => setQueryFormData({ ...queryFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your inquiry..."
                  value={queryFormData.subject}
                  onChange={(e) => setQueryFormData({ ...queryFormData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the problem or request in full detail..."
                  value={queryFormData.description}
                  onChange={(e) => setQueryFormData({ ...queryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRaiseQueryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. RESOLVE QUERY MODAL (FOR ADMIN / MANAGER) */}
      {selectedQueryForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Resolve Query {selectedQueryForResolve.queryCode}</h3>
                <p className="text-xs text-slate-500">From: {selectedQueryForResolve.employee?.user?.name}</p>
              </div>
              <button
                onClick={() => setSelectedQueryForResolve(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedQueryForResolve.subject}</div>
              <p className="text-slate-600">{selectedQueryForResolve.description}</p>
            </div>

            <form onSubmit={handleResolveQuerySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">HR Resolution & Reply *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your official answer, action taken or clarification..."
                  value={queryResolveText}
                  onChange={(e) => setQueryResolveText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedQueryForResolve(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Resolving..." : "Mark as Resolved"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. GENERATE SALARY SLIP MODAL */}
      {showGenerateSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Employee Salary Slip</h3>
                <p className="text-xs text-slate-500">Calculate earnings, leave deductions, PF and net pay</p>
              </div>
              <button
                onClick={() => setShowGenerateSlipModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSalarySlip} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-medium mb-1">Employee *</label>
                  <select
                    value={slipFormData.employeeId}
                    onChange={(e) => setSlipFormData({ ...slipFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.user?.name} ({e.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Month</label>
                  <select
                    value={slipFormData.month}
                    onChange={(e) => setSlipFormData({ ...slipFormData, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        Month {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Year</label>
                  <input
                    type="number"
                    value={slipFormData.year}
                    onChange={(e) => setSlipFormData({ ...slipFormData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Earnings */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase font-mono text-[10px]">Earnings Breakdown</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Basic Salary (₹)</label>
                    <input
                      type="number"
                      value={slipFormData.basicSalary}
                      onChange={(e) => setSlipFormData({ ...slipFormData, basicSalary: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={slipFormData.hra}
                      onChange={(e) => setSlipFormData({ ...slipFormData, hra: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Special / Bonus (₹)</label>
                    <input
                      type="number"
                      value={slipFormData.specialAllow}
                      onChange={(e) => setSlipFormData({ ...slipFormData, specialAllow: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance & Deductions */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase font-mono text-[10px]">
                  Attendance & Deductions
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-1">Total Days</label>
                    <input
                      type="number"
                      value={slipFormData.totalWorkingDays}
                      onChange={(e) => setSlipFormData({ ...slipFormData, totalWorkingDays: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">WFH Days</label>
                    <input
                      type="number"
                      value={slipFormData.wfhDays}
                      onChange={(e) => setSlipFormData({ ...slipFormData, wfhDays: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Half Days</label>
                    <input
                      type="number"
                      value={slipFormData.halfDays}
                      onChange={(e) => setSlipFormData({ ...slipFormData, halfDays: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Unpaid LOP</label>
                    <input
                      type="number"
                      value={slipFormData.unpaidLeaves}
                      onChange={(e) => setSlipFormData({ ...slipFormData, unpaidLeaves: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-600 mb-1">PF Deduction (₹)</label>
                    <input
                      type="number"
                      value={slipFormData.pfDeduction}
                      onChange={(e) => setSlipFormData({ ...slipFormData, pfDeduction: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Tax / TDS (₹)</label>
                    <input
                      type="number"
                      value={slipFormData.taxDeduction}
                      onChange={(e) => setSlipFormData({ ...slipFormData, taxDeduction: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Other (₹)</label>
                    <input
                      type="number"
                      value={slipFormData.otherDeduction}
                      onChange={(e) => setSlipFormData({ ...slipFormData, otherDeduction: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-rose-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowGenerateSlipModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Generating..." : "Generate & Issue Slip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SALARY SLIP VIEW & PRINT MODAL */}
      {selectedSlipForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            {/* Payslip Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">MY ERP ENTERPRISE</h2>
                    <p className="text-[10px] text-slate-500 font-mono">CONFIDENTIAL SALARY STATEMENT</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-blue-600 text-sm">{selectedSlipForView.slipCode}</span>
                <p className="text-xs text-slate-500 font-mono">
                  Period: {selectedSlipForView.month}/{selectedSlipForView.year}
                </p>
              </div>
            </div>

            {/* Employee Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Employee</span>
                <div className="font-bold text-slate-900">{selectedSlipForView.employee?.user?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{selectedSlipForView.employee?.employeeCode}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Department</span>
                <div className="font-semibold text-slate-900">{selectedSlipForView.employee?.department?.name || "General"}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Designation</span>
                <div className="font-semibold text-slate-900">{selectedSlipForView.employee?.designation?.name || "Staff"}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Working Days</span>
                <div className="font-bold font-mono text-slate-900">
                  {selectedSlipForView.presentDays} / {selectedSlipForView.totalWorkingDays}
                </div>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Earnings */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  Earnings (A)
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Basic Pay:</span>
                  <span className="font-mono font-semibold">{formatCurrency(selectedSlipForView.basicSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">House Rent Allowance (HRA):</span>
                  <span className="font-mono font-semibold">{formatCurrency(selectedSlipForView.hra)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Special Allowance & Bonus:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(selectedSlipForView.specialAllow + selectedSlipForView.bonus)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-slate-900">
                  <span>Gross Earnings:</span>
                  <span className="font-mono">{formatCurrency(selectedSlipForView.grossSalary)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  Deductions (B)
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Provident Fund (PF):</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatCurrency(selectedSlipForView.pfDeduction)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Income Tax (TDS):</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatCurrency(selectedSlipForView.taxDeduction)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Leave / LOP Deduction:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatCurrency(selectedSlipForView.leaveDeduction)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-rose-700">
                  <span>Total Deductions:</span>
                  <span className="font-mono">-{formatCurrency(selectedSlipForView.totalDeduction)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-mono font-bold">NET PAYABLE (A - B)</span>
                <p className="text-2xl font-black font-mono text-emerald-900">
                  {formatCurrency(selectedSlipForView.netSalary)}
                </p>
              </div>
              <StatusBadge status={selectedSlipForView.paymentStatus} size="md" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
              <button
                onClick={() => setSelectedSlipForView(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EMPLOYEE DETAILS PROFILE DRAWER */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
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

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Department</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {selectedEmployee.department?.name || "General"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Designation</span>
                  <p className="text-xs font-bold text-indigo-600 mt-1 truncate">
                    {selectedEmployee.designation?.name || "Executive"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedEmployee.status} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-900">{selectedEmployee.user?.email}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-900 font-mono">{selectedEmployee.phone || "Not listed"}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Joining Date:</span>
                  <span className="font-mono text-slate-700">{formatDate(selectedEmployee.joiningDate)}</span>
                </div>
                {selectedEmployee.salary && (
                  <div className="flex justify-between pt-0.5 font-semibold text-slate-900">
                    <span>Base Monthly Salary:</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(selectedEmployee.salary)} / mo</span>
                  </div>
                )}
              </div>

              {/* Monthly Leave Entitlement Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Monthly Leave Entitlement</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono text-[10px] font-bold">
                    2 Leaves / 30 Days
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Permitted <strong>2 paid leaves</strong> every 30 days cycle without deductions. 4 weekly Sundays are regular paid company holidays.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ADD EMPLOYEE MODAL */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email (Login ID) *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Department *</label>
                  {isManager && userDeptId ? (
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-not-allowed">
                      {departments.find((d) => d.id === userDeptId)?.name || userDeptName || "My Department"}
                    </div>
                  ) : (
                    <select
                      value={employeeFormData.departmentId}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={employeeFormData.designationName}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, designationName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Monthly Compensation & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Monthly Gross Salary (₹) *</label>
                  <input
                    type="number"
                    required
                    value={employeeFormData.salary}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Per Day: ~{formatCurrency(Math.round((employeeFormData.salary || 0) / 30))} (30 days basis)
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">System Role *</label>
                  <select
                    value={employeeFormData.role}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    {isAdmin && <option value="ADMIN">ADMIN</option>}
                  </select>
                </div>
              </div>

              {/* Monthly Leave Permission & Attendance Policy */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-amber-950 text-xs">Monthly Leave Quota & Policy</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-mono text-[10px] font-bold">
                    30 Days Cycle
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-amber-900 font-semibold text-[11px] mb-1">
                      Monthly Allowed Paid Leaves (CL/SL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={employeeFormData.monthlyLeaveQuota}
                        onChange={(e) =>
                          setEmployeeFormData({
                            ...employeeFormData,
                            monthlyLeaveQuota: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] font-bold text-amber-800 shrink-0">Days / Month</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-900/90 space-y-1 bg-white/70 p-2.5 rounded-lg border border-amber-200/70">
                    <div className="font-bold text-amber-950 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>4 Sundays Off Excluded</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-tight">
                      In a 30-day month: <strong>26 working days</strong> + <strong>4 Sundays off</strong> + <strong>{employeeFormData.monthlyLeaveQuota} permitted leaves</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Residential Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Street, City, State"
                  value={employeeFormData.address}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Creating..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. CREATE TASK MODAL */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
                onClick={() => setShowCreateTaskModal(false)}
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
                  placeholder="e.g. Build Payment Gateway Integration"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Task Description & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Describe daily objectives or milestones..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned Employee *</label>
                <select
                  value={taskFormData.assignedToId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
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
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
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
                    value={taskFormData.estimatedHours}
                    onChange={(e) => setTaskFormData({ ...taskFormData, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Creating..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9.1 LOG HOURLY PROGRESS & REPORT MODAL */}
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

            {/* Task Details Summary */}
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

            <form onSubmit={handleTaskProgressSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Hours Worked / Completed in this session *
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTaskProgressHours(h)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                        taskProgressHours === h
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
                    value={taskProgressHours}
                    onChange={(e) => setTaskProgressHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-500 font-mono shrink-0">Hours</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  New Total will become: <strong>{(Number(selectedTaskForProgress.actualHours) || 0) + Number(taskProgressHours)} hrs</strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Update Task Status</label>
                <select
                  value={taskProgressStatus}
                  onChange={(e) => setTaskProgressStatus(e.target.value)}
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
                  placeholder="e.g. Completed module API routes in 2 hours, testing next..."
                  value={taskProgressNote}
                  onChange={(e) => setTaskProgressNote(e.target.value)}
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
                  disabled={taskProgressLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{taskProgressLoading ? "Logging..." : "Submit Progress"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. SUBMIT WORK REPORT MODAL */}
      {showSubmitReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit {reportFormData.reportType} Work Report
                </h3>
                <p className="text-xs text-slate-500">Log your tasks, achievements, roadblocks and next steps</p>
              </div>
              <button
                onClick={() => setShowSubmitReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Report Frequency *</label>
                  <select
                    value={reportFormData.reportType}
                    onChange={(e) => setReportFormData({ ...reportFormData, reportType: e.target.value as any })}
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
                    value={reportFormData.status}
                    onChange={(e) => setReportFormData({ ...reportFormData, status: e.target.value })}
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
                  value={reportFormData.projectTitle}
                  onChange={(e) => setReportFormData({ ...reportFormData, projectTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {assignedClients.length > 0 && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Link to Client Account (Optional)</label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "NONE") {
                        setReportFormData({ ...reportFormData, customerName: "Internal Operations" });
                      } else {
                        setReportFormData({ ...reportFormData, customerName: val, reportType: "CLIENT" });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="NONE">General / Internal Department Standup</option>
                    {assignedClients.map((c) => (
                      <option key={c.id} value={c.name}>
                        Client: {c.name} ({c.clientCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Project / Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Core ERP, CRM, Tech, HR"
                    value={reportFormData.customerName}
                    onChange={(e) => setReportFormData({ ...reportFormData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hours Spent</label>
                  <input
                    type="number"
                    value={reportFormData.hoursSpent}
                    onChange={(e) => setReportFormData({ ...reportFormData, hoursSpent: Number(e.target.value) })}
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
                  value={reportFormData.summary}
                  onChange={(e) => setReportFormData({ ...reportFormData, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Key Deliverables & Shipped Items *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Items delivered, features coded, tickets solved..."
                  value={reportFormData.deliverables}
                  onChange={(e) => setReportFormData({ ...reportFormData, deliverables: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Next Plan (Tomorrow / Next Week)</label>
                <textarea
                  rows={2}
                  placeholder="What is planned next..."
                  value={reportFormData.nextWeekPlan}
                  onChange={(e) => setReportFormData({ ...reportFormData, nextWeekPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Blockers / Dependencies (Optional)</label>
                <input
                  type="text"
                  placeholder="Any roadblock waiting on approvals, APIs or client input..."
                  value={reportFormData.blockers}
                  onChange={(e) => setReportFormData({ ...reportFormData, blockers: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubmitReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. COMPULSORY DAILY WORK REPORT & PUNCH-OUT MODAL */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Square className="w-4 h-4 fill-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Punch Out & Daily Work Report</h3>
                  <p className="text-[11px] text-slate-500">Compulsory daily standup report before completing shift</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClockOutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClockOutWithReport} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Submitting your daily work report is mandatory before punching out. This updates manager oversight and sprint progress.</span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Today&apos;s Summary / Work Done *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Key activities completed today..."
                  value={clockOutReportSummary}
                  onChange={(e) => setClockOutReportSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Shipped Deliverables / Tasks Solved *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="List files coded, reels edited, tickets resolved, campaigns launched..."
                  value={clockOutReportDeliverables}
                  onChange={(e) => setClockOutReportDeliverables(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Total Hours Worked *</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={clockOutReportHours}
                    onChange={(e) => setClockOutReportHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Blockers / Dependencies (Optional)</label>
                  <input
                    type="text"
                    placeholder="Any blockers or pending approvals..."
                    value={clockOutReportBlockers}
                    onChange={(e) => setClockOutReportBlockers(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowClockOutModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>{loading ? "Submitting..." : "Submit Report & Punch Out"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. TODAY'S ATTENDANCE ROSTER MODAL */}
      {showTodayAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Today&apos;s Attendance Roster</h3>
                  <p className="text-[11px] text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTodayAttendanceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Present Staff ({scopedAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.checkIn).length})</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scopedAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.checkIn).length > 0 ? (
                    scopedAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.checkIn).map((att) => (
                      <div key={att.id} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                            {att.employee?.user?.name?.[0] || "E"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{att.employee?.user?.name || "Employee"}</span>
                            <span className="text-[10px] text-slate-500">{att.employee?.department?.name || "General"} • {att.employee?.employeeCode}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-emerald-700 block">
                            In: {att.checkIn ? formatTime(att.checkIn) : "Present"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {att.checkOut ? `Out: ${formatTime(att.checkOut)}` : "Shift Active"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                      No staff have punched in yet today.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Absent / Not Checked In ({scopedEmployees.filter((e) => !scopedAttendances.some((a) => a.employeeId === e.id && (a.status === "PRESENT" || a.status === "LATE" || a.checkIn))).length})</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scopedEmployees.filter((e) => !scopedAttendances.some((a) => a.employeeId === e.id && (a.status === "PRESENT" || a.status === "LATE" || a.checkIn))).length > 0 ? (
                    scopedEmployees.filter((e) => !scopedAttendances.some((a) => a.employeeId === e.id && (a.status === "PRESENT" || a.status === "LATE" || a.checkIn))).map((emp) => (
                      <div key={emp.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                            {emp.user?.name?.[0] || "E"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{emp.user?.name || "Employee"}</span>
                            <span className="text-[10px] text-slate-500">{emp.department?.name || "Staff"} • {emp.designation?.name || "Member"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          ABSENT
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-emerald-600 py-3 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                      ✓ 100% Attendance! All staff members checked in.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowTodayAttendanceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. CREATE PERSONAL SPRINT TASK MODAL */}
      {showAddPersonalTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Personal Sprint Task</h3>
                  <p className="text-[11px] text-slate-500">Plan and track your daily work deliverables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPersonalTaskModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonalTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design 3 Video Thumbnails or Test Login API"
                  value={personalTaskForm.title}
                  onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details, steps, or resources needed..."
                  value={personalTaskForm.description}
                  onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Priority</label>
                  <select
                    value={personalTaskForm.priority}
                    onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
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
                    value={personalTaskForm.estimatedHours}
                    onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Due Date / Deadline *</label>
                <input
                  type="date"
                  required
                  value={personalTaskForm.dueDate}
                  onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPersonalTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? "Creating..." : "Add to My Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 13. EMPLOYEE DETAILED ATTENDANCE HISTORY MODAL */}
      {selectedEmployeeForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base font-bold shadow-xs">
                  {selectedEmployeeForAttendance.user?.name?.charAt(0) || "E"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedEmployeeForAttendance.user?.name}&apos;s Attendance Record
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedEmployeeForAttendance.employeeCode} • {selectedEmployeeForAttendance.department?.name || "Department"} • {selectedEmployeeForAttendance.designation?.name || "Executive"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeForAttendance(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month & Year Selection in Modal */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Filter Attendance Month:</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAttendanceMonth}
                  onChange={(e) => setSelectedAttendanceMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedAttendanceYear}
                  onChange={(e) => setSelectedAttendanceYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Month Breakdown Summary */}
            {(() => {
              const empAttsInMonth = allAttendances.filter((a) => {
                if (a.employeeId !== selectedEmployeeForAttendance.id) return false;
                const d = new Date(a.date);
                return d.getMonth() + 1 === selectedAttendanceMonth && d.getFullYear() === selectedAttendanceYear;
              });

              const presentDays = empAttsInMonth.filter((a) => a.status === "PRESENT" || a.checkIn).length;
              const wfhDays = empAttsInMonth.filter((a) => a.status === "WORK_FROM_HOME" || a.status === "WFH").length;
              const halfDays = empAttsInMonth.filter((a) => a.status === "HALF_DAY").length;
              const leaveDays = empAttsInMonth.filter((a) => a.status === "LEAVE" || a.status === "ON_LEAVE").length;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">Present Days</span>
                      <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">{presentDays}</span>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-800 uppercase font-mono block">WFH / Remote</span>
                      <span className="text-base font-black text-blue-700 font-mono mt-0.5 block">{wfhDays}</span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-800 uppercase font-mono block">Half Days</span>
                      <span className="text-base font-black text-amber-700 font-mono mt-0.5 block">{halfDays}</span>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-800 uppercase font-mono block">Leaves Taken</span>
                      <span className="text-base font-black text-purple-700 font-mono mt-0.5 block">{leaveDays}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-2">
                      Shift Activity Logs in {new Date(selectedAttendanceYear, selectedAttendanceMonth - 1).toLocaleString("default", { month: "long" })} {selectedAttendanceYear}
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                      {empAttsInMonth.length > 0 ? (
                        empAttsInMonth.map((a) => (
                          <div
                            key={a.id}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:border-blue-300 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 font-mono">{formatDate(a.date)}</div>
                              <div className="text-[11px] text-slate-500">
                                In: {a.checkIn ? formatTime(a.checkIn) : "-"} • Out: {a.checkOut ? formatTime(a.checkOut) : "Active"}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              {a.workingHoursMin && (
                                <span className="text-[11px] font-mono text-slate-600">
                                  {Math.floor(a.workingHoursMin / 60)}h {a.workingHoursMin % 60}m
                                </span>
                              )}
                              <StatusBadge status={a.status} size="sm" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-400">
                          No logged shift records found for this employee in {selectedAttendanceMonth}/{selectedAttendanceYear}.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForAttendance(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
