"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Building2,
  Users,
  Target,
  Clock,
  Plus,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Filter,
  Save,
  BarChart3,
  LineChart,
  UserCheck,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  ArrowLeft,
  Send,
  Edit3,
  Trash2,
  X,
  Lock,
  Key,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  KeyRound,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import {
  createClient,
  assignEmployeesToClient,
  addServiceToClient,
  updateClientService,
  updateServiceProgress,
  saveClientProgressSheet,
  submitReportToManager,
  updateOneTimeWorkProgress,
  completeClientProgressReport,
  forwardClientDeliverableToSales,
  createClientSprintTask,
  triggerMilestoneReceivable,
  createOrResetClientLogin,
  raiseClientComplaint,
  resolveClientComplaint,
} from "@/actions/clients";
import { OnboardClientModal, OnboardClientFormData } from "@/components/OnboardClientModal";

interface ReportsClientProps {
  reports: any;
  clientReports?: any[];
  initialClients?: any[];
  employees?: any[];
  userRole?: string;
  currentEmployeeId?: string;
  user?: any;
}

export function ReportsClient({
  reports,
  clientReports = [],
  initialClients = [],
  employees = [],
  userRole = "EMPLOYEE",
  currentEmployeeId,
  user,
}: ReportsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "CLIENTS" | "CUSTOM_SHEET" | "TEAM_AUDIT"
  >("CLIENTS");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [clients, setClients] = useState<any[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<any | null>(initialClients[0] || null);

  // Sync state whenever initialClients from server re-fetch/refresh
  useEffect(() => {
    setClients(initialClients);
    if (selectedClient) {
      const refreshed = initialClients.find((c) => c.id === selectedClient.id);
      if (refreshed) {
        setSelectedClient(refreshed);
      }
    } else if (initialClients.length > 0) {
      setSelectedClient(initialClients[0]);
    }
  }, [initialClients]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // New Client Modal state
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    departmentType: "DIGITAL_MARKETING" as "DIGITAL_MARKETING" | "TECHNICAL",
    billingType: "MONTHLY" as "MONTHLY" | "ONE_TIME",
    amount: 50000,
    notes: "",
    assignedEmployeeIds: [] as string[],
    initialServiceName: "Social Media Reels & Graphics",
    initialCategory: "MARKETING",
    initialTargetCount: 20,
    initialMilestoneAmount: 0,
  });

  // Edit Service Deliverable Modal state
  const [editingService, setEditingService] = useState<{
    id: string;
    serviceName: string;
    target: string;
    notes: string;
  } | null>(null);

  // Add Service Modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    serviceName: "",
    category: "MARKETING",
    target: "15 Reels",
    targetCount: 15,
    billingCycle: "MONTHLY",
    milestoneAmount: 0,
    notes: "",
  });

  // Assign Team Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Forward to Sales Modal state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardData, setForwardData] = useState({
    amount: 50000,
    notes: "",
    deliverableSummary: "",
  });

  // Client Detail View Mode (true = detailed client page, false = directory list)
  const isClientRole = userRole === "CLIENT";
  const [isDetailView, setIsDetailView] = useState(isClientRole);

  // Client Login Generation Modal
  const [showClientLoginModal, setShowClientLoginModal] = useState(false);
  const [clientLoginForm, setClientLoginForm] = useState({
    email: "",
    password: "client123",
  });
  const [createdLoginCreds, setCreatedLoginCreds] = useState<{ email: string; password: string } | null>(null);

  // Client Raise Complaint Modal
  const [showRaiseComplaintModal, setShowRaiseComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState<{
    subject: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: string;
  }>({
    subject: "",
    description: "",
    priority: "HIGH",
    category: "DELIVERABLE_DELAY",
  });

  // Staff / Admin Resolve Complaint Modal
  const [selectedComplaintForResolve, setSelectedComplaintForResolve] = useState<any | null>(null);
  const [resolutionResponse, setResolutionResponse] = useState("");

  // Milestone Trigger Modal state (For ONE_TIME clients)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    milestoneTitle: "",
    amount: 0,
    percentage: 50,
    isCustomAmount: false,
    notes: "",
    markClientCompleted: false,
  });

  // Client Sprint Task Modal state (Estimated hours removed)
  const [showClientTaskModal, setShowClientTaskModal] = useState(false);
  const [clientTaskForm, setClientTaskForm] = useState({
    title: "",
    description: "",
    assignedToId: currentEmployeeId || "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
  });

  // Dynamic Custom Sheet State
  const [sheetMonth, setSheetMonth] = useState<number>(new Date().getMonth() + 1);
  const [sheetYear, setSheetYear] = useState<number>(new Date().getFullYear());
  const [oneTimeProgressPct, setOneTimeProgressPct] = useState<number>(0);
  const [customColumns, setCustomColumns] = useState<string[]>([
    "Item / Deliverable",
    "Monthly Target",
    "Completed Count",
    "Remaining",
    "Status",
    "Notes & Links",
  ]);
  const [sheetRows, setSheetRows] = useState<any[]>([]);

  // Calculate available months for selectedClient based on onboardingDate (starting from onboarded month up to current or future months)
  const getAvailableBillingMonths = (client: any) => {
    if (!client) return [];
    const onboardDate = client.onboardingDate ? new Date(client.onboardingDate) : new Date();
    const startYear = onboardDate.getFullYear();
    const startMonth = onboardDate.getMonth() + 1; // 1-12

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthsList: { month: number; year: number; label: string }[] = [];

    // Range from startYear to max(currentYear + 1, startYear)
    const endYear = Math.max(currentYear + 1, startYear);
    for (let y = startYear; y <= endYear; y++) {
      const mStart = y === startYear ? startMonth : 1;
      const mEnd = y === endYear ? 12 : 12;
      for (let m = mStart; m <= mEnd; m++) {
        monthsList.push({
          month: m,
          year: y,
          label: `${monthNames[m - 1]} ${y}`,
        });
      }
    }
    return monthsList;
  };

  // Ensure sheetMonth and sheetYear start on or after onboardingDate when switching client
  useEffect(() => {
    if (!selectedClient) return;
    if (selectedClient.billingType === "ONE_TIME") {
      // Find one-time report (month 0, year 0) or latest
      const oneTimeRpt = selectedClient.reports?.find((r: any) => r.month === 0) || selectedClient.reports?.[0];
      if (oneTimeRpt?.notes && oneTimeRpt.notes.includes("[Work Completed:")) {
        const match = oneTimeRpt.notes.match(/\[Work Completed:\s*(\d+)%\]/);
        if (match) setOneTimeProgressPct(Number(match[1]));
        else setOneTimeProgressPct(0);
      } else {
        setOneTimeProgressPct(0);
      }
      return;
    }

    const available = getAvailableBillingMonths(selectedClient);
    if (available.length > 0) {
      const isCurrentInRange = available.some((a) => a.month === sheetMonth && a.year === sheetYear);
      if (!isCurrentInRange) {
        // Default to the first available month (onboarding month) or current month if in range
        const now = new Date();
        const curMatch = available.find((a) => a.month === now.getMonth() + 1 && a.year === now.getFullYear());
        if (curMatch) {
          setSheetMonth(curMatch.month);
          setSheetYear(curMatch.year);
        } else {
          setSheetMonth(available[0].month);
          setSheetYear(available[0].year);
        }
      }
    }
  }, [selectedClient?.id]);

  // Automatically load saved progress sheet for selectedClient & month
  useEffect(() => {
    if (!selectedClient) return;

    // Check if this is a ONE_TIME client
    const isOneTime = selectedClient.billingType === "ONE_TIME";

    const targetReport = isOneTime
      ? selectedClient.reports?.find((r: any) => r.month === 0) || selectedClient.reports?.[0]
      : selectedClient.reports?.find((r: any) => r.month === sheetMonth && r.year === sheetYear);

    if (targetReport?.columnsJson) {
      try {
        const parsed = JSON.parse(targetReport.columnsJson);
        if (parsed.columns && Array.isArray(parsed.columns)) {
          setCustomColumns(parsed.columns);
        }
        if (parsed.rows && Array.isArray(parsed.rows)) {
          setSheetRows(parsed.rows);
        }
        return;
      } catch (e) {
        console.error("Error parsing saved progress sheet", e);
      }
    }

    // If report does not exist for this month yet, check if there was a previous month's report to inherit structure from!
    // As requested: "it will get repeated but it can be changed anytime any month"
    const priorReport = selectedClient.reports?.find((r: any) => {
      if (isOneTime) return false;
      return (r.year < sheetYear) || (r.year === sheetYear && r.month < sheetMonth);
    });

    if (priorReport?.columnsJson) {
      try {
        const parsedPrior = JSON.parse(priorReport.columnsJson);
        if (parsedPrior.columns && Array.isArray(parsedPrior.columns)) {
          setCustomColumns(parsedPrior.columns);
        }
        if (parsedPrior.rows && Array.isArray(parsedPrior.rows)) {
          // Carry over the rows/deliverables structure, but reset Completed Count to 0 for fresh month
          const carryOverRows = parsedPrior.rows.map((row: any, rIdx: number) => {
            const rowCopy = { ...row, id: String(Date.now() + rIdx) };
            if (rowCopy["Completed Count"] !== undefined) rowCopy["Completed Count"] = "0";
            if (rowCopy["Remaining"] !== undefined && rowCopy["Monthly Target"] !== undefined) {
              rowCopy["Remaining"] = rowCopy["Monthly Target"];
            }
            if (rowCopy["Status"] !== undefined) rowCopy["Status"] = "IN_PROGRESS";
            return rowCopy;
          });
          setSheetRows(carryOverRows);
          return;
        }
      } catch (e) {
        console.error("Error parsing prior progress report", e);
      }
    }

    // Fallback: Build initial deliverable rows from client's onboarded services
    if (selectedClient.services && selectedClient.services.length > 0) {
      const dynamicRows = selectedClient.services.map((srv: any, idx: number) => {
        let targetDisplay = "1";
        if (srv.target) targetDisplay = String(srv.target);
        else if (srv.notes && srv.notes.includes("[Target:")) {
          const match = srv.notes.match(/\[Target:\s*([^\]]+)\]/);
          if (match) targetDisplay = match[1].trim();
        } else if (srv.targetCount > 0) {
          targetDisplay = String(srv.targetCount);
        } else {
          const n = (srv.serviceName || "").toLowerCase();
          if (n.includes("reel")) targetDisplay = "15";
          else if (n.includes("graphic") || n.includes("carousel")) targetDisplay = "25";
          else if (n.includes("seo")) targetDisplay = "8";
          else if (n.includes("ad")) targetDisplay = "2";
        }

        const targetNum = parseInt(targetDisplay, 10) || srv.targetCount || 0;
        const completedNum = isOneTime ? srv.completedCount || 0 : 0;
        const rem = Math.max(0, targetNum - completedNum);

        return {
          id: String(idx + 1),
          "Item / Deliverable": srv.serviceName,
          [isOneTime ? "Target Scope" : "Monthly Target"]: targetDisplay,
          "Completed Count": String(completedNum),
          Remaining: String(rem),
          Status: srv.status || "IN_PROGRESS",
          "Notes & Links": srv.notes ? srv.notes.replace(/\[Target:\s*[^\]]+\]\s*/g, "").trim() : "Active deliverable",
        };
      });
      setSheetRows(dynamicRows);
      setCustomColumns([
        "Item / Deliverable",
        isOneTime ? "Target Scope" : "Monthly Target",
        "Completed Count",
        "Remaining",
        "Status",
        "Notes & Links",
      ]);
    } else {
      setSheetRows([
        {
          id: "1",
          "Item / Deliverable": isOneTime ? "Project Milestone 1" : "Instagram Reels",
          [isOneTime ? "Target Scope" : "Monthly Target"]: isOneTime ? "Full Launch" : "15",
          "Completed Count": "0",
          Remaining: isOneTime ? "1" : "15",
          Status: "IN_PROGRESS",
          "Notes & Links": "Delivery scope active",
        },
      ]);
      setCustomColumns([
        "Item / Deliverable",
        isOneTime ? "Target Scope" : "Monthly Target",
        "Completed Count",
        "Remaining",
        "Status",
        "Notes & Links",
      ]);
    }
  }, [selectedClient?.id, sheetMonth, sheetYear]);

  const [newColName, setNewColName] = useState("");
  const [newRowTitle, setNewRowTitle] = useState("");

  const userDept = ((user as any)?.department || "").toLowerCase();
  const isSalesManager = userRole === "MANAGER" && userDept.includes("sales");
  const isSalesUser = userDept.includes("sales");
  const isManagerOrAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isEmployee = userRole === "EMPLOYEE";

  // Delivery department roles (Marketing, Tech, Operations, etc. — NOT Sales)
  // Department Managers (or Admin) can directly approve and forward to Sales
  const isDeliveryManagerOrAdmin = (userRole === "ADMIN" || (userRole === "MANAGER" && !isSalesUser));
  // Delivery Employees are the staff who fill in the report and submit to their department manager
  const isDeliveryEmployee = userRole === "EMPLOYEE" && !isSalesUser;

  // Filter clients by department
  const filteredClients = clients.filter((c) => {
    if (departmentFilter === "ALL") return true;
    return c.departmentType === departmentFilter;
  });

  // Restrict Onboard Client button to ONLY Admin and Sales Manager
  const canOnboardClient = userRole === "ADMIN" || isSalesManager;

  // Handlers
  const handleCreateClient = async (formData: OnboardClientFormData) => {
    setLoading(true);
    try {
      const created = await createClient({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        departmentType: formData.departmentType,
        billingType: formData.billingType,
        amount: Number(formData.amount) || 0,
        notes: formData.notes,
        assignedEmployeeIds: formData.assignedEmployeeIds,
        initialServices: formData.services.map((s) => ({
          serviceName: s.serviceName,
          category: s.category,
          target: s.target,
          targetCount: s.targetCount,
          billingCycle: s.billingCycle || formData.billingType,
          milestoneAmount: Number(s.milestoneAmount) || 0,
          notes: s.notes,
        })),
      });
      setClients([created, ...clients]);
      setSelectedClient(created);
      setShowNewClientModal(false);
      alert(`✓ Client ${created.name} onboarded successfully!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      const srv = await addServiceToClient({
        clientId: selectedClient.id,
        serviceName: newServiceData.serviceName,
        category: newServiceData.category,
        target: newServiceData.target,
        targetCount: Number(newServiceData.targetCount) || 0,
        billingCycle: newServiceData.billingCycle,
        milestoneAmount: Number(newServiceData.milestoneAmount) || 0,
        notes: newServiceData.notes,
      });
      const updatedClient = {
        ...selectedClient,
        services: [...(selectedClient.services || []), srv],
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      setShowAddServiceModal(false);
      setNewServiceData({
        serviceName: "",
        category: "MARKETING",
        target: "15 Reels",
        targetCount: 15,
        billingCycle: "MONTHLY",
        milestoneAmount: 0,
        notes: "",
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !editingService) return;
    setLoading(true);
    try {
      const updated = await updateClientService({
        serviceId: editingService.id,
        serviceName: editingService.serviceName,
        target: editingService.target,
        notes: editingService.notes,
      });
      const updatedServices = (selectedClient.services || []).map((s: any) =>
        s.id === updated.id ? { ...s, ...updated, target: editingService.target } : s
      );
      const updatedClient = {
        ...selectedClient,
        services: updatedServices,
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      setEditingService(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliverableProgress = async (serviceId: string, delta: number, markDone = false) => {
    try {
      const updated = await updateServiceProgress({
        serviceId,
        deltaCount: delta,
        markCompleted: markDone,
      });
      const updatedServices = selectedClient.services.map((s: any) =>
        s.id === serviceId ? { ...s, ...updated } : s
      );
      const updatedClient = { ...selectedClient, services: updatedServices };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      if (markDone) {
        alert("Deliverable marked completed! Receivable automatically generated for the sales ledger.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      await assignEmployeesToClient(selectedClient.id, selectedAssignees);
      const updatedClient = {
        ...selectedClient,
        assignments: selectedAssignees.map((id) => {
          const emp = employees.find((e) => e.id === id);
          return { employeeId: id, employee: emp, role: "MEMBER" };
        }),
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      setShowAssignModal(false);
      alert("Team assignments updated!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToSales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      await forwardClientDeliverableToSales(selectedClient.id, {
        amount: Number(forwardData.amount) || selectedClient.amount || 50000,
        notes: forwardData.notes,
        deliverableSummary: forwardData.deliverableSummary,
      });
      setShowForwardModal(false);
      alert(`✓ Deliverables for ${selectedClient.name} successfully forwarded to Sales! Payment collection receivable created.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClientTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      const newTask = await createClientSprintTask({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        title: clientTaskForm.title,
        description: clientTaskForm.description,
        assignedToId: isEmployee ? currentEmployeeId! : clientTaskForm.assignedToId,
        priority: clientTaskForm.priority,
        dueDate: clientTaskForm.dueDate,
      });

      // Update local client task state
      const updatedClientTasks = [newTask, ...(selectedClient.clientTasks || [])];
      const updatedClient = { ...selectedClient, clientTasks: updatedClientTasks };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);

      setShowClientTaskModal(false);
      setClientTaskForm({
        title: "",
        description: "",
        assignedToId: currentEmployeeId || "",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
      });
      alert(`✓ Sprint task created for ${selectedClient.name}! Synced to Sprint Tasks board.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      const milestoneAmount = milestoneForm.isCustomAmount
        ? Number(milestoneForm.amount) || 0
        : Math.round(((selectedClient.amount || 0) * (milestoneForm.percentage || 0)) / 100);

      const createdOrder = await triggerMilestoneReceivable({
        clientId: selectedClient.id,
        milestoneTitle: milestoneForm.milestoneTitle || `${milestoneForm.percentage}% Milestone Completion`,
        amount: milestoneAmount,
        percentage: milestoneForm.isCustomAmount ? undefined : milestoneForm.percentage,
        notes: milestoneForm.notes,
        markClientCompleted: milestoneForm.markClientCompleted,
      });

      const updatedOrders = [createdOrder, ...(selectedClient.orders || [])];
      const updatedClient = {
        ...selectedClient,
        status: milestoneForm.markClientCompleted ? "COMPLETED" : selectedClient.status,
        orders: updatedOrders,
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);

      setShowMilestoneModal(false);
      setMilestoneForm({
        milestoneTitle: "",
        amount: 0,
        percentage: 50,
        isCustomAmount: false,
        notes: "",
        markClientCompleted: false,
      });

      alert(
        `✓ Milestone Receivable Triggered!\n\nOrder (${createdOrder.orderCode}) for ₹${milestoneAmount.toLocaleString()} has been generated and sent to the Sales module.\n${
          milestoneForm.markClientCompleted
            ? "Client project marked as COMPLETED and archived from delivery roster."
            : ""
        }`
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    if (customColumns.includes(newColName.trim())) {
      alert("Column already exists");
      return;
    }
    setCustomColumns([...customColumns, newColName.trim()]);
    setNewColName("");
  };

  const handleAddRow = () => {
    if (!newRowTitle.trim()) return;
    const newRow: any = { id: String(Date.now()), "Item / Deliverable": newRowTitle.trim() };
    customColumns.forEach((c) => {
      if (c !== "Item / Deliverable") newRow[c] = "-";
    });
    setSheetRows([...sheetRows, newRow]);
    setNewRowTitle("");
  };

  const handleSaveSheet = async () => {
    if (!selectedClient) return;
    const isOneTime = selectedClient.billingType === "ONE_TIME";
    const targetMonth = isOneTime ? 0 : sheetMonth;
    const targetYear = isOneTime ? 0 : sheetYear;

    setLoading(true);
    try {
      const savedReport = await saveClientProgressSheet({
        clientId: selectedClient.id,
        month: targetMonth,
        year: targetYear,
        columnsJson: JSON.stringify({ columns: customColumns, rows: sheetRows }),
        notes: isOneTime
          ? `[Work Completed: ${oneTimeProgressPct}%] Project progress sheet draft`
          : `Progress report for month ${sheetMonth}/${sheetYear}`,
      });
      // Update local client report state
      const existingReports = selectedClient.reports || [];
      const updatedReports = existingReports.some((r: any) => r.id === savedReport.id || (r.month === targetMonth && r.year === targetYear))
        ? existingReports.map((r: any) => (r.id === savedReport.id || (r.month === targetMonth && r.year === targetYear)) ? savedReport : r)
        : [savedReport, ...existingReports];
      const updatedClient = { ...selectedClient, reports: updatedReports };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      router.refresh();
      alert("✓ Progress Sheet saved as Draft!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Employee action: Submit finished report to department manager for review
  const handleSubmitToManager = async () => {
    if (!selectedClient) return;
    const isOneTime = selectedClient.billingType === "ONE_TIME";
    const targetMonth = isOneTime ? 0 : sheetMonth;
    const targetYear = isOneTime ? 0 : sheetYear;

    if (!confirm(`Submit progress report for ${selectedClient.name} to Department Manager for verification?`)) {
      return;
    }

    setLoading(true);
    try {
      const submittedReport = await submitReportToManager({
        clientId: selectedClient.id,
        month: targetMonth,
        year: targetYear,
        columnsJson: JSON.stringify({ columns: customColumns, rows: sheetRows }),
        notes: isOneTime
          ? `[Work Completed: ${oneTimeProgressPct}%] Submitted by staff for review`
          : `Deliverables submitted for manager review (${sheetMonth}/${sheetYear})`,
      });

      const existingReports = selectedClient.reports || [];
      const updatedReports = existingReports.some((r: any) => r.id === submittedReport.id || (r.month === targetMonth && r.year === targetYear))
        ? existingReports.map((r: any) => (r.id === submittedReport.id || (r.month === targetMonth && r.year === targetYear)) ? submittedReport : r)
        : [submittedReport, ...existingReports];
      const updatedClient = { ...selectedClient, reports: updatedReports };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      router.refresh();
      alert(`✓ Report successfully submitted to Department Manager for review!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // One-time Project: Manager updates work progress % & sends to Sales
  const handleUpdateOneTimeProgress = async (markComplete = false) => {
    if (!selectedClient) return;
    const pct = markComplete ? 100 : oneTimeProgressPct;
    const confirmMsg = markComplete
      ? `Mark ${selectedClient.name} as 100% COMPLETED?\n\nThis will mark the project done and notify Sales of complete delivery with any final remaining balance receivable.`
      : `Submit ${pct}% completion progress for ${selectedClient.name} to Sales?\n\nSales team will see verified progress and can choose to collect any milestone payments accordingly.`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await updateOneTimeWorkProgress({
        clientId: selectedClient.id,
        completionPercentage: pct,
        columnsJson: JSON.stringify({ columns: customColumns, rows: sheetRows }),
        markCompleted: markComplete,
      });

      const existingReports = selectedClient.reports || [];
      const updatedReports = existingReports.some((r: any) => r.id === res.report.id || r.month === 0)
        ? existingReports.map((r: any) => (r.id === res.report.id || r.month === 0) ? res.report : r)
        : [res.report, ...existingReports];
      const updatedClient = {
        ...selectedClient,
        status: markComplete || pct >= 100 ? "COMPLETED" : selectedClient.status,
        reports: updatedReports,
        orders: res.order ? [res.order, ...(selectedClient.orders || [])] : selectedClient.orders,
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      router.refresh();

      alert(
        markComplete || pct >= 100
          ? `✓ Project marked as 100% COMPLETED!\n\nSales notified. ${res.order ? `Final balance order (${res.order.orderCode}) for ₹${res.order.totalAmount?.toLocaleString()} sent to Sales.` : "All payments already settled."}`
          : `✓ Work Progress (${pct}%) submitted to Sales module!\n\nSales team can now inspect verified work and decide any payment collection.`
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manager action for monthly retainers: Approve and forward to Sales
  const handleCompleteReport = async () => {
    if (!selectedClient) return;
    const confirmMsg = `Approve progress report for ${selectedClient.name} (${sheetMonth}/${sheetYear}) and submit to Sales?\n\nThis will automatically push the monthly retainer amount (₹${selectedClient.amount?.toLocaleString()}) to Sales as a Pending Receivable ready for collection.`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await completeClientProgressReport({
        clientId: selectedClient.id,
        month: sheetMonth,
        year: sheetYear,
        columnsJson: JSON.stringify({ columns: customColumns, rows: sheetRows }),
        notes: `Completed deliverables progress report for ${sheetMonth}/${sheetYear}. Approved by manager for Sales.`,
      });

      // Update local client report state
      const existingReports = selectedClient.reports || [];
      const updatedReports = existingReports.some((r: any) => r.id === res.report.id || (r.month === sheetMonth && r.year === sheetYear))
        ? existingReports.map((r: any) => (r.id === res.report.id || (r.month === sheetMonth && r.year === sheetYear)) ? res.report : r)
        : [res.report, ...existingReports];
      const updatedClient = {
        ...selectedClient,
        reports: updatedReports,
        orders: res.order ? [res.order, ...(selectedClient.orders || [])] : selectedClient.orders,
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      router.refresh();

      alert(`✓ Progress Report APPROVED for Sales!\n\nSales Receivable Order (${res.order?.orderCode}) for ₹${res.order?.totalAmount?.toLocaleString()} has been automatically generated and sent to the Sales ledger for payment collection.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Provision Client Login
  const handleProvisionClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      const res = await createOrResetClientLogin({
        clientId: selectedClient.id,
        email: clientLoginForm.email,
        password: clientLoginForm.password,
      });
      setCreatedLoginCreds({ email: res.email, password: res.password });
      const updatedClient = { ...selectedClient, user: res.client.user, email: res.email };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      router.refresh();
      alert(`Client login created/updated successfully for ${selectedClient.name}!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Raise Client Complaint
  const handleRaiseClientComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      const cmp = await raiseClientComplaint({
        clientId: selectedClient.id,
        subject: complaintForm.subject,
        description: complaintForm.description,
        priority: complaintForm.priority,
        category: complaintForm.category,
      });

      const updatedQueries = [cmp, ...(selectedClient.queries || [])];
      const updatedClient = { ...selectedClient, queries: updatedQueries };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      setShowRaiseComplaintModal(false);
      setComplaintForm({
        subject: "",
        description: "",
        priority: "HIGH",
        category: "DELIVERABLE_DELAY",
      });
      router.refresh();
      alert(`Complaint ticket ${cmp.queryCode} registered successfully! Assigned team and Admin have been notified.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Resolve Client Complaint
  const handleResolveComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForResolve || !selectedClient) return;
    setLoading(true);
    try {
      const updated = await resolveClientComplaint(
        selectedComplaintForResolve.id,
        resolutionResponse,
        "RESOLVED"
      );
      const updatedQueries = (selectedClient.queries || []).map((q: any) =>
        q.id === updated.id ? updated : q
      );
      const updatedClient = { ...selectedClient, queries: updatedQueries };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      setSelectedComplaintForResolve(null);
      setResolutionResponse("");
      router.refresh();
      alert(`Complaint ticket ${updated.queryCode} marked as RESOLVED.`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };


  const categories = [
    { id: "CLIENTS", label: "Client Workspace", icon: Building2, count: clients.length, color: "text-blue-600" },
    { id: "CUSTOM_SHEET", label: "Client Progress Reports", icon: FileSpreadsheet, color: "text-emerald-600" },
    /* Staff Performance Badges (temporarily disabled/commented out):
    ...(isManagerOrAdmin
      ? [
          { id: "TEAM_AUDIT", label: "Staff Performance Badges", icon: Users, color: "text-indigo-600" },
        ]
      : []),
    */
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar Navigation */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 select-none shadow-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Clients Hub</h2>
                  <p className="text-[10px] text-slate-500 truncate">Deliverables & Progress</p>
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

          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Operations & Tracking
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {categories.map((cat) => {
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
                      <span className="truncate">{cat.label}</span>
                    </div>
                    {cat.count !== undefined && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ml-2",
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
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

          {/* Department Quick Filter */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Filter Department
            </div>
            <div className="grid grid-cols-3 gap-1">
              {["ALL", "DIGITAL_MARKETING", "TECHNICAL"].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all text-center truncate",
                    departmentFilter === dept
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {dept === "ALL" ? "All" : dept === "DIGITAL_MARKETING" ? "Marketing" : "Tech"}
                </button>
              ))}
            </div>
          </div>
        </aside>
      ) : (
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
        {/* Header Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {activeTab === "CLIENTS" && "Active Client Accounts & Overview"}
              {activeTab === "CUSTOM_SHEET" && "Client-Wise Custom Progress Reports"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Digital Marketing & Technical project management, deliverables logging, and client progress tracking
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {canOnboardClient && (
              <button
                onClick={() => setShowNewClientModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard Client</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: CLIENTS WORKSPACE */}
        {activeTab === "CLIENTS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Active Clients"
                value={filteredClients.length}
                trend="+2 this month"
                isPositive={true}
                icon={Building2}
              />
              <KpiCard
                title="Monthly Retainers"
                value={formatCurrency(
                  filteredClients
                    .filter((c) => c.billingType === "MONTHLY")
                    .reduce((sum, c) => sum + (c.amount || 0), 0)
                )}
                comparisonText="Recurring revenue"
                icon={TrendingUp}
              />
              <KpiCard
                title="Marketing Clients"
                value={filteredClients.filter((c) => c.departmentType === "DIGITAL_MARKETING").length}
                comparisonText="Reels, Ads, Graphics"
                icon={Target}
              />
              <KpiCard
                title="Technical / Dev"
                value={filteredClients.filter((c) => c.departmentType === "TECHNICAL").length}
                comparisonText="Websites, Apps, ERPs"
                icon={Layers}
              />
            </div>

            {/* VIEW MODE A: FULL-WIDTH CLIENT DIRECTORY */}
            {!isDetailView ? (
              <div className="space-y-4">
                {/* Department & Status Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase font-mono text-slate-500">Department:</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[
                        { id: "ALL", label: "All Clients" },
                        { id: "DIGITAL_MARKETING", label: "Marketing" },
                        { id: "TECHNICAL", label: "Technical" },
                      ].map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => setDepartmentFilter(dept.id)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            departmentFilter === dept.id
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          {dept.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-900">{filteredClients.length}</span> clients • Click any client to view their detailed project workspace
                  </div>
                </div>

                {/* Full-Width Clients Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map((client) => {
                    const isCompleted = client.status === "COMPLETED";
                    const isMonthly = client.billingType === "MONTHLY";
                    const totalMilestonesBilled = (client.orders || [])
                      .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                    const remainingBalance = Math.max(0, (client.amount || 0) - totalMilestonesBilled);

                    return (
                      <div
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          setIsDetailView(true);
                        }}
                        className={cn(
                          "bg-white border rounded-2xl p-5 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative",
                          isCompleted ? "border-slate-200 bg-slate-50/40" : "border-slate-200"
                        )}
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {client.name}
                              </h3>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {client.company || client.email || "Client Account"}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase shrink-0",
                                client.departmentType === "DIGITAL_MARKETING"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {client.departmentType === "DIGITAL_MARKETING" ? "Marketing" : "Technical"}
                            </span>
                          </div>

                          {/* Financial Badge */}
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">
                                {isMonthly ? "Monthly Retainer" : "Contract Value"}
                              </span>
                              <span className="font-mono font-black text-slate-900 text-sm">
                                {formatCurrency(client.amount)}
                              </span>
                            </div>
                            {!isMonthly && (
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                                <span>Triggered: {formatCurrency(totalMilestonesBilled)}</span>
                                <span className="text-indigo-600 font-bold">Pending: {formatCurrency(remainingBalance)}</span>
                              </div>
                            )}
                          </div>

                          {/* Services Preview */}
                          {client.services && client.services.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Deliverables ({client.services.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {client.services.slice(0, 3).map((s: any) => (
                                  <span
                                    key={s.id}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md truncate max-w-[180px]"
                                  >
                                    {s.serviceName}
                                  </span>
                                ))}
                                {client.services.length > 3 && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md">
                                    +{client.services.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">
                              {client.assignments?.length || 0} staff assigned
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                            <span>Open Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredClients.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">No Clients Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      There are no clients in this department view yet. Use the Onboard Client button to register a new account.
                    </p>
                  </div>
                )}
              </div>
            ) : selectedClient && (
              /* VIEW MODE B: FULL-PAGE DEDICATED CLIENT DETAIL VIEW */
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Top Return Banner */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDetailView(false)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Clients Roster</span>
                    </button>
                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900">{selectedClient.name}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {selectedClient.clientCode}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                            selectedClient.departmentType === "DIGITAL_MARKETING"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {selectedClient.departmentType === "DIGITAL_MARKETING" ? "Digital Marketing" : "Technical / Dev"}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                            selectedClient.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          )}
                        >
                          {selectedClient.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedClient.company || selectedClient.email || "Client Organization"} • Phone: {selectedClient.phone || "N/A"} • Onboarded: {formatDate(selectedClient.onboardingDate)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => {
                          setSelectedAssignees(selectedClient.assignments?.map((a: any) => a.employeeId) || []);
                          setShowAssignModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Manage Team</span>
                      </button>
                    )}

                    {/* For ONE_TIME clients: Trigger Milestone Payment */}
                    {selectedClient.billingType === "ONE_TIME" && isManagerOrAdmin && selectedClient.status !== "COMPLETED" && (
                      <button
                        onClick={() => {
                          const billedSoFar = (selectedClient.orders || []).reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
                          const rem = Math.max(0, (selectedClient.amount || 0) - billedSoFar);
                          setMilestoneForm({
                            milestoneTitle: "Project Milestone Phase",
                            amount: rem > 0 ? rem : Math.round((selectedClient.amount || 0) * 0.5),
                            percentage: 50,
                            isCustomAmount: false,
                            notes: "",
                            markClientCompleted: false,
                          });
                          setShowMilestoneModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Trigger Milestone Payment</span>
                      </button>
                    )}

                    {/* Client Login Management (Admin & Manager) */}
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => {
                          setClientLoginForm({
                            email: selectedClient.user?.email || selectedClient.email || `${selectedClient.clientCode.toLowerCase()}@client.com`,
                            password: "client123",
                          });
                          setCreatedLoginCreds(null);
                          setShowClientLoginModal(true);
                        }}
                        className={cn(
                          "px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all",
                          selectedClient.user
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                        )}
                        title="Give or reset client portal login credentials"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>{selectedClient.user ? "Client Login Active ✓" : "Give Client Login"}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab("CUSTOM_SHEET")}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Open Progress Report Sheet ↗</span>
                    </button>
                  </div>
                </div>

                {/* Section 1: Financial & Commercial Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      {selectedClient.billingType === "MONTHLY" ? "Monthly Retainer Amount" : "Total Contract Value"}
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono block">
                      {formatCurrency(selectedClient.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {selectedClient.billingType === "MONTHLY" ? "Recurring every monthly cycle" : "Fixed scope milestone contract"}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      {selectedClient.billingType === "MONTHLY" ? "Billing Cycle" : "Milestones Invoiced"}
                    </span>
                    <span className="text-xl font-black text-emerald-600 font-mono block">
                      {selectedClient.billingType === "MONTHLY"
                        ? "Month-to-Month"
                        : formatCurrency(
                            (selectedClient.orders || []).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
                          )}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {selectedClient.billingType === "MONTHLY" ? "Invoiced on report completion" : `${selectedClient.orders?.length || 0} payment milestones logged`}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      {selectedClient.billingType === "MONTHLY" ? "Progress Reports" : "Remaining Receivable"}
                    </span>
                    <span className="text-xl font-black text-indigo-600 font-mono block">
                      {selectedClient.billingType === "MONTHLY"
                        ? `${selectedClient.reports?.length || 0} Cycles Logged`
                        : formatCurrency(
                            Math.max(
                              0,
                              (selectedClient.amount || 0) -
                                (selectedClient.orders || []).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
                            )
                          )}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {selectedClient.billingType === "MONTHLY" ? "Tracked month by month" : "Outstanding project balance"}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      Allocated Team
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono block">
                      {selectedClient.assignments?.length || 0} Staff
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Assigned to deliverables
                    </span>
                  </div>
                </div>

                {/* Client Operational Instructions / Onboarding Notes */}
                {selectedClient.notes && (
                  <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider font-mono">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Client Instructions & Onboarding Notes</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-5.5">
                      {selectedClient.notes}
                    </p>
                  </div>
                )}

                {/* Section 2: Agreed Deliverable Services & Onboarding Targets */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                        Agreed Services & Deliverable Scope ({selectedClient.services?.length || 0})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Deliverable specifications configured during client onboarding
                      </p>
                    </div>
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => {
                          setNewServiceData({
                            serviceName: "",
                            category: "MARKETING",
                            target: "15 Reels",
                            targetCount: 15,
                            billingCycle: selectedClient.billingType || "MONTHLY",
                            milestoneAmount: 0,
                            notes: "",
                          });
                          setShowAddServiceModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Deliverable</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedClient.services && selectedClient.services.length > 0 ? (
                      selectedClient.services.map((srv: any, idx: number) => {
                        const targetVal = (() => {
                          if (srv.target) return srv.target;
                          if (srv.notes && srv.notes.includes("[Target:")) {
                            const match = srv.notes.match(/\[Target:\s*([^\]]+)\]/);
                            if (match) return match[1].trim();
                          }
                          if (srv.targetCount && srv.targetCount > 0) {
                            const name = (srv.serviceName || "").toLowerCase();
                            if (name.includes("reel")) return `${srv.targetCount} Reels`;
                            if (name.includes("graphic") || name.includes("post") || name.includes("carousel")) return `${srv.targetCount} Posts`;
                            if (name.includes("seo") || name.includes("article")) return `${srv.targetCount} Articles`;
                            if (name.includes("ad") || name.includes("campaign")) return `${srv.targetCount} Campaigns`;
                            return `${srv.targetCount} deliverables`;
                          }
                          const name = (srv.serviceName || "").toLowerCase();
                          if (name.includes("reel")) return "15 Reels";
                          if (name.includes("graphic") || name.includes("carousel")) return "25 Posts";
                          if (name.includes("seo")) return "8 Articles";
                          if (name.includes("ad")) return "2 Campaigns";
                          if (name.includes("web") || name.includes("site")) return "Complete Launch";
                          return "Configured";
                        })();

                        const cleanNotes = srv.notes ? srv.notes.replace(/\[Target:\s*[^\]]+\]\s*/g, "").trim() : "";

                        return (
                          <div
                            key={srv.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 flex flex-col justify-between group hover:border-slate-300 transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <h4 className="font-bold text-xs text-slate-900 truncate">{srv.serviceName}</h4>
                                </div>
                                {isManagerOrAdmin && (
                                  <button
                                    onClick={() => {
                                      setEditingService({
                                        id: srv.id,
                                        serviceName: srv.serviceName,
                                        target: targetVal !== "Configured" ? targetVal : "",
                                        notes: cleanNotes,
                                      });
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title="Edit deliverable & target"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-mono">Target:</span>
                                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px] truncate max-w-[180px]">
                                  {targetVal}
                                </span>
                              </div>
                              {cleanNotes && (
                                <p className="text-[11px] text-slate-500 mt-2 bg-white p-2 rounded-xl border border-slate-200/60 leading-relaxed">
                                  {cleanNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No service deliverables configured for this client.
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Allocated Staff Members */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                        Allocated Staff Members ({selectedClient.assignments?.length || 0})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Team members responsible for executing client deliverables
                      </p>
                    </div>
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => {
                          setSelectedAssignees(selectedClient.assignments?.map((a: any) => a.employeeId) || []);
                          setShowAssignModal(true);
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        + Modify Allocations
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {selectedClient.assignments && selectedClient.assignments.length > 0 ? (
                      selectedClient.assignments.map((asgn: any) => (
                        <div
                          key={asgn.id || asgn.employeeId}
                          className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs shadow-2xs"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {asgn.employee?.user?.name || asgn.employee?.employeeCode || "Employee"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {asgn.employee?.designation?.name || "Team Member"} • {asgn.employee?.department?.name || "Dept"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                        <span>No team members allocated to this client yet.</span>
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAssignees([]);
                              setShowAssignModal(true);
                            }}
                            className="font-bold underline cursor-pointer"
                          >
                            Allocate Staff Now
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Monthly Progress Reports & Invoicing History */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                        Progress Reports & Invoicing Ledger
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedClient.billingType === "MONTHLY"
                          ? "Monthly progress reports track deliverables and trigger monthly receivable invoices upon completion"
                          : "Milestone invoices and receivables generated for this one-time project"}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("CUSTOM_SHEET")}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Open Full Progress Report Sheet ↗</span>
                    </button>
                  </div>

                  {/* Progress Reports List */}
                  <div className="space-y-2">
                    {selectedClient.billingType === "ONE_TIME" ? (
                      (() => {
                        const oneTimeReport = selectedClient.reports?.find((r: any) => r.month === 0) || selectedClient.reports?.[0];
                        const isDone = selectedClient.status === "COMPLETED" || oneTimeReport?.status === "COMPLETED";

                        return oneTimeReport ? (
                          <div
                            key={oneTimeReport.id}
                            className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">
                                  One-Time Project Progress Sheet
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                                    isDone
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {isDone ? "100% COMPLETED" : `${oneTimeProgressPct}% COMPLETED`}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-1">
                                Last updated by: <span className="font-semibold text-slate-800">{oneTimeReport.submittedBy || "Team"}</span> • {oneTimeReport.notes || "Progress sheet active"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveTab("CUSTOM_SHEET")}
                                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-amber-300 shadow-2xs cursor-pointer flex items-center gap-1.5"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                                <span>Edit / View Sheet</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
                            <span>No progress updates logged yet. Work Progress is currently 0%.</span>
                            <button
                              onClick={() => setActiveTab("CUSTOM_SHEET")}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
                            >
                              Open Progress Sheet (0% Progress)
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const monthlyReports = (selectedClient.reports || []).filter((r: any) => r.month > 0);
                        const monthNames = [
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ];

                        return monthlyReports.length > 0 ? (
                          monthlyReports.map((rpt: any) => {
                            const isDone = rpt.status === "COMPLETED";

                            return (
                              <div
                                key={rpt.id}
                                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900">
                                      {monthNames[rpt.month - 1] || `Month ${rpt.month}`} {rpt.year} Progress Report
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                                        isDone
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-blue-100 text-blue-700"
                                      )}
                                    >
                                      {isDone ? "COMPLETED • INVOICED" : "DRAFT / IN REVIEW"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Last updated by: {rpt.submittedBy || "Team"} • {rpt.notes || "Progress report logged"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSheetMonth(rpt.month);
                                      setSheetYear(rpt.year);
                                      setActiveTab("CUSTOM_SHEET");
                                    }}
                                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                                  >
                                    View Sheet
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-400 py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                            No monthly progress reports logged yet. Open the Progress Report Sheet to track deliverables and trigger the monthly receivable invoice.
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* One-Time Milestone Receivables List (For ONE_TIME clients) */}
                  {selectedClient.billingType === "ONE_TIME" && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-xs font-bold text-slate-700 font-mono uppercase block">
                        Milestone Orders & Invoices Sent to Sales ({selectedClient.orders?.length || 0})
                      </span>
                      <div className="space-y-2">
                        {selectedClient.orders && selectedClient.orders.length > 0 ? (
                          selectedClient.orders.map((ord: any) => (
                            <div
                              key={ord.id}
                              className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block">{ord.orderCode}</span>
                                <span className="text-[11px] text-slate-500 block">{ord.notes}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-indigo-700 block text-sm">
                                  {formatCurrency(ord.totalAmount)}
                                </span>
                                <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 block">
                                  {ord.paymentStatus}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 py-3 text-center">
                            No milestone invoices triggered yet. Use "Trigger Milestone Payment" above to request collection.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 5: Client Sprint Tasks (Estimated hours removed) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                        Client Sprint Tasks & Deadlines
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sprint goals and deliverable tasks linked directly to {selectedClient.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setClientTaskForm({
                          title: "",
                          description: "",
                          assignedToId: currentEmployeeId || selectedClient.assignments?.[0]?.employeeId || employees[0]?.id || "",
                          priority: "MEDIUM",
                          dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
                        });
                        setShowClientTaskModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Allot Client Task</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedClient.clientTasks && selectedClient.clientTasks.length > 0 ? (
                      selectedClient.clientTasks.map((tsk: any) => (
                        <div
                          key={tsk.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{tsk.title}</span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              Assigned: {tsk.assignedTo?.user?.name || "Staff"} • Due: {formatDate(tsk.dueDate)}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                              tsk.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {tsk.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                        No sprint tasks allotted yet. Click &quot;Allot Client Task&quot; to assign tasks to the delivery team.
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 6: Client Complaints & Support Tickets */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                          Complaints & Support Tickets
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                          {selectedClient.queries?.length || 0} Total
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Official issues and support requests raised by {selectedClient.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedClient.queries && selectedClient.queries.length > 0 ? (
                      selectedClient.queries.map((q: any) => {
                        const isResolved = q.status === "RESOLVED";
                        return (
                          <div
                            key={q.id}
                            className={cn(
                              "p-4 rounded-xl border text-xs space-y-2 transition-all",
                              isResolved
                                ? "bg-slate-50/70 border-slate-200 text-slate-700"
                                : "bg-rose-50/40 border-rose-200/80 text-slate-900"
                            )}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                                    isResolved
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-rose-100 text-rose-800 border border-rose-200"
                                  )}
                                >
                                  {q.status}
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                                    q.priority === "URGENT" || q.priority === "HIGH"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-600"
                                  )}
                                >
                                  {q.priority} PRIORITY
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {q.subject}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {formatDate(q.createdAt)}
                                </span>
                                {userRole !== "CLIENT" && !isResolved && (
                                  <button
                                    onClick={() => {
                                      setSelectedComplaintForResolve(q);
                                      setResolutionResponse("");
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Resolve</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-100">
                              {q.description}
                            </p>

                            {q.response && (
                              <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                                <span className="font-bold text-[11px] uppercase tracking-wider block mb-0.5">
                                  Team Resolution Notes:
                                </span>
                                <p className="text-xs whitespace-pre-wrap">{q.response}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                        No complaints logged for this client. Everything is running smoothly!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLIENT CUSTOM PROGRESS REPORT */}
        {activeTab === "CUSTOM_SHEET" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">
                      Progress Report: {selectedClient?.name || "Client"}
                    </h3>
                    {selectedClient && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                          selectedClient.billingType === "MONTHLY"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {selectedClient.billingType === "MONTHLY" ? "Monthly Retainer" : "One-Time Project"}
                      </span>
                    )}
                    {(() => {
                      if (!selectedClient) return null;
                      const isOneTime = selectedClient.billingType === "ONE_TIME";
                      const currentReport = isOneTime
                        ? selectedClient.reports?.find((r: any) => r.month === 0) || selectedClient.reports?.[0]
                        : selectedClient.reports?.find((r: any) => r.month === sheetMonth && r.year === sheetYear);

                      if (currentReport?.status === "COMPLETED") {
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            {isOneTime ? "100% COMPLETED • SENT TO SALES" : "APPROVED BY MANAGER • SENT TO SALES"}
                          </span>
                        );
                      }
                      if (currentReport?.status === "SUBMITTED_TO_MANAGER") {
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SUBMITTED TO MANAGER (AWAITING APPROVAL)
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">
                          DRAFT / IN PROGRESS
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedClient?.billingType === "MONTHLY"
                      ? "Monthly Retainer Progress Sheet: Reporting starts from onboarding month. Fully customizable columns & rows each month. Submit to Manager, then Manager approves for Sales collection."
                      : "One-Time Project Progress Sheet: Track deliverable milestones and work completion percentage. Manager verifies and pushes progress percentage to Sales."}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Client Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase font-mono px-1.5 text-slate-500">Client:</span>
                    <select
                      value={selectedClient?.id || ""}
                      onChange={(e) => {
                        const found = clients.find((c) => c.id === e.target.value);
                        if (found) setSelectedClient(found);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    >
                      {filteredClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.billingType === "MONTHLY" ? "Monthly" : "One-Time"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monthly Retainer: Cycle Selector (Starts from Onboarding Month) */}
                  {selectedClient?.billingType === "MONTHLY" && (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase font-mono px-1.5 text-slate-500">Month:</span>
                      <select
                        value={`${sheetMonth}-${sheetYear}`}
                        onChange={(e) => {
                          const [m, y] = e.target.value.split("-").map(Number);
                          setSheetMonth(m);
                          setSheetYear(y);
                        }}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {getAvailableBillingMonths(selectedClient).map((opt) => (
                          <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Action 1: Save Draft (Delivery Employees and Delivery Managers/Admin) */}
                  {!isSalesUser && (
                    <button
                      onClick={handleSaveSheet}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>{loading ? "Saving..." : "Save Draft"}</span>
                    </button>
                  )}

                  {/* Action 2: Delivery Staff / Employee Submit to Department Manager ONLY */}
                  {isDeliveryEmployee && (
                    <button
                      onClick={handleSubmitToManager}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit to Manager</span>
                    </button>
                  )}

                  {/* Action 3: Department Manager / Admin directly Approves and Forwards to Sales */}
                  {selectedClient?.billingType === "MONTHLY" && isDeliveryManagerOrAdmin && (
                    <button
                      onClick={handleCompleteReport}
                      disabled={loading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Forward to Sales</span>
                    </button>
                  )}

                  {/* For Sales Department Users: Read-only Indicator */}
                  {isSalesUser && (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-mono font-medium rounded-xl border border-slate-200">
                      View-Only Mode (Sales)
                    </span>
                  )}
                </div>
              </div>

              {/* ONE-TIME CLIENT: Project Progress Percentage & Manager Push to Sales */}
              {selectedClient?.billingType === "ONE_TIME" && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-900 font-mono uppercase tracking-wider block">
                      One-Time Project Work Progress Status
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Department work is strictly to report deliverables and completion %. The Sales team determines milestone payment collections independently.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">Work Done:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={isSalesUser}
                        value={oneTimeProgressPct}
                        onChange={(e) => setOneTimeProgressPct(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-center font-mono font-bold text-xs text-amber-900 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                      <span className="text-xs font-bold text-slate-700">%</span>
                    </div>

                    {isDeliveryEmployee && (
                      <button
                        type="button"
                        onClick={handleSubmitToManager}
                        disabled={loading}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Progress to Manager</span>
                      </button>
                    )}

                    {isDeliveryManagerOrAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateOneTimeProgress(false)}
                          disabled={loading}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Push {oneTimeProgressPct}% Progress to Sales</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateOneTimeProgress(true)}
                          disabled={loading}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark 100% Completed</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Column Adder & Row Adder Tools (Hidden for Sales users) */}
              {!isSalesUser && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      placeholder="New custom column name..."
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleAddColumn}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      + Add Column
                    </button>
                  </div>

                  <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRowTitle}
                      onChange={(e) => setNewRowTitle(e.target.value)}
                      placeholder="New deliverable item / row..."
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleAddRow}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Table (Read-only for Sales) */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase font-mono text-[10px]">
                      {customColumns.map((col, idx) => (
                        <th key={idx} className="p-3 border-r border-slate-200 last:border-r-0 min-w-[140px]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{col}</span>
                            {!isSalesUser && idx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove column "${col}"?`)) {
                                    setCustomColumns(customColumns.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove Column"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      {!isSalesUser && <th className="p-3 w-12 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.map((row, rIdx) => (
                      <tr key={row.id || rIdx} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                        {customColumns.map((col, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">
                            {isSalesUser ? (
                              <div className="px-2 py-1 text-xs text-slate-900 font-medium">
                                {row[col] ?? "-"}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={row[col] ?? ""}
                                onChange={(e) => {
                                  const updated = [...sheetRows];
                                  updated[rIdx][col] = e.target.value;
                                  setSheetRows(updated);
                                }}
                                className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded text-xs text-slate-900 font-medium"
                              />
                            )}
                          </td>
                        ))}
                        {!isSalesUser && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSheetRows(sheetRows.filter((_, idx) => idx !== rIdx));
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Staff Performance Badges (temporarily disabled/commented out):
        {activeTab === "TEAM_AUDIT" && isManagerOrAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Employee Performance Rating (Green / Yellow / Red)</h3>
                  <p className="text-xs text-slate-500">
                    Track staff productivity, tasks completed, lead closures, and overall performance rating
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase font-mono text-[10px]">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3 text-center">Tasks Done</th>
                      <th className="p-3 text-center">Leads Handled</th>
                      <th className="p-3 text-center">Performance Badge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      return (
                        <tr key={emp.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">
                            {emp.user?.name || emp.employeeCode}
                            <span className="block text-[10px] text-slate-400 font-normal">{emp.user?.email}</span>
                          </td>
                          <td className="p-3 text-slate-600">{emp.department?.name || "General"}</td>
                          <td className="p-3 text-slate-600">{emp.designation?.name || "Member"}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {emp.assignedTasks?.length || 0}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {emp.leads?.length || 0}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              GREEN (High)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        */}
      </div>

      {/* MODAL 1: ONBOARD NEW CLIENT (UNIFIED COMPONENT) */}
      {showNewClientModal && (
        <OnboardClientModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
          onSubmit={handleCreateClient}
          title="Onboard New Client & Account"
          subtitle="Direct client onboarding from Active Clients module. Allocate to department and setup services."
          submitButtonText="Confirm & Onboard Client"
        />
      )}



      {/* MODAL 3: ASSIGN TEAM */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Allocate Staff to {selectedClient?.name}</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>
            {/* Quick Action Selection Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const deptEmployees = employees
                    .filter((e) => !selectedClient?.departmentType ||
                      (selectedClient.departmentType === "DIGITAL_MARKETING"
                        ? e.department?.name?.toLowerCase().includes("marketing")
                        : e.department?.name?.toLowerCase().includes("tech")))
                    .map((e) => e.id);
                  setSelectedAssignees(deptEmployees.length > 0 ? deptEmployees : employees.map((e) => e.id));
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200 hover:bg-blue-100 cursor-pointer"
              >
                Entire Department Team
              </button>
              {currentEmployeeId && (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedAssignees.includes(currentEmployeeId)) {
                      setSelectedAssignees([...selectedAssignees, currentEmployeeId]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200 hover:bg-purple-100 cursor-pointer"
                >
                  + Include Myself
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedAssignees([])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {employees.map((emp) => {
                const isSelected = selectedAssignees.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                      isSelected ? "bg-blue-50 border-blue-400" : "bg-slate-50 border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedAssignees(selectedAssignees.filter((id) => id !== emp.id));
                          } else {
                            setSelectedAssignees([...selectedAssignees, emp.id]);
                          }
                        }}
                      />
                      <span className="font-semibold text-slate-900">{emp.user?.name || emp.employeeCode}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{emp.department?.name || "Member"}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
              >
                {loading ? "Saving..." : "Save Allocations"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN TEAM */}

      {/* MODAL 5: FORWARD DELIVERABLES TO SALES */}
      {showForwardModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Forward to Sales</h3>
                  <p className="text-[11px] text-slate-500">Collect payment for completed deliverables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForwardModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForwardToSales} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-emerald-900">
                  <span>Client Account:</span>
                  <span>{selectedClient.name}</span>
                </div>
                <div className="flex justify-between text-emerald-700 text-[11px]">
                  <span>Billing Model:</span>
                  <span>{selectedClient.billingType}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice / Collection Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={forwardData.amount}
                  onChange={(e) => setForwardData({ ...forwardData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deliverables Shipped Summary *</label>
                <input
                  type="text"
                  required
                  value={forwardData.deliverableSummary}
                  onChange={(e) => setForwardData({ ...forwardData, deliverableSummary: e.target.value })}
                  placeholder="e.g. 15 Reels + 20 Static Posts Published (100% Target Met)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes for Sales Collection Team</label>
                <textarea
                  rows={2}
                  value={forwardData.notes}
                  onChange={(e) => setForwardData({ ...forwardData, notes: e.target.value })}
                  placeholder="Any specific invoice instructions or client payment contact..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForwardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {loading ? "Forwarding..." : "Confirm & Send to Sales"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ALLOT CLIENT TASK */}
      {showClientTaskModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Allot Client Task</h3>
                  <p className="text-[11px] text-slate-500">{selectedClient.name} • Agile Sprint</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClientTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClientTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design 5 Festive Carousels or Fix Auth API"
                  value={clientTaskForm.title}
                  onChange={(e) => setClientTaskForm({ ...clientTaskForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Deliverable Specs</label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements or assets needed..."
                  value={clientTaskForm.description}
                  onChange={(e) => setClientTaskForm({ ...clientTaskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {!isEmployee && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assign To Employee *</label>
                  <select
                    value={clientTaskForm.assignedToId}
                    onChange={(e) => setClientTaskForm({ ...clientTaskForm, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name} ({emp.employeeCode}) {emp.designation?.name ? `• ${emp.designation.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                <select
                  value={clientTaskForm.priority}
                  onChange={(e) => setClientTaskForm({ ...clientTaskForm, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deadline / Due Date *</label>
                <input
                  type="date"
                  required
                  value={clientTaskForm.dueDate}
                  onChange={(e) => setClientTaskForm({ ...clientTaskForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClientTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {loading ? "Creating..." : "Save Sprint Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: TRIGGER ONE-TIME MILESTONE RECEIVABLE */}
      {showMilestoneModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Trigger Milestone Receivable</h3>
                  <p className="text-[11px] text-slate-500">{selectedClient.name} • One-Time Project Billing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTriggerMilestoneSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Total Project Contract:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedClient.amount)}</span>
                </div>
                {(() => {
                  const billedSoFar = (selectedClient.orders || [])
                    .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                  const remaining = Math.max(0, (selectedClient.amount || 0) - billedSoFar);
                  return (
                    <>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Already Invoiced / Triggered:</span>
                        <span className="font-mono font-semibold text-emerald-600">{formatCurrency(billedSoFar)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-1 font-bold">
                        <span>Remaining Balance:</span>
                        <span className="font-mono text-indigo-600">{formatCurrency(remaining)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Milestone Description / Phase *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% Milestone - Backend API & Database Complete"
                  value={milestoneForm.milestoneTitle}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Percentage Presets or Custom Amount */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold">Milestone Amount Calculation</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setMilestoneForm({
                          ...milestoneForm,
                          percentage: pct,
                          isCustomAmount: false,
                          amount: Math.round(((selectedClient.amount || 0) * pct) / 100),
                        })
                      }
                      className={cn(
                        "py-1.5 px-2 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer",
                        !milestoneForm.isCustomAmount && milestoneForm.percentage === pct
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Receivable Amount (₹) *</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={milestoneForm.isCustomAmount}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          isCustomAmount: e.target.checked,
                          amount: milestoneForm.amount || Math.round(((selectedClient.amount || 0) * (milestoneForm.percentage || 50)) / 100),
                        })
                      }
                    />
                    <span>Custom Amount</span>
                  </label>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  value={
                    milestoneForm.isCustomAmount
                      ? milestoneForm.amount
                      : Math.round(((selectedClient.amount || 0) * (milestoneForm.percentage || 50)) / 100)
                  }
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      isCustomAmount: true,
                      amount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Billing Notes for Sales Team</label>
                <textarea
                  rows={2}
                  value={milestoneForm.notes}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                  placeholder="Optional notes or milestone deliverables summary..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={milestoneForm.markClientCompleted}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, markClientCompleted: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">Mark Project as 100% Completed</span>
                    <span className="text-[10px] text-slate-500 block">
                      Check this if this is the final milestone. The client will be archived as Completed and removed from active roster.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Sending..." : "Trigger Receivable & Invoice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT DELIVERABLE SERVICE */}
      {showAddServiceModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Service Deliverable</h3>
                  <p className="text-[11px] text-slate-500">{selectedClient.name} • Scope Definition</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deliverable / Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instagram Reels, Tech Sprint, Meta Ads"
                  value={newServiceData.serviceName}
                  onChange={(e) => setNewServiceData({ ...newServiceData, serviceName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Target (Any numbers or custom text) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 Reels, Complete Launch, 25 Posts, MVP"
                  value={newServiceData.target}
                  onChange={(e) => setNewServiceData({ ...newServiceData, target: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  You can enter numeric quantities (15) or descriptive milestone targets (e.g. &quot;Full Deployment&quot;).
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deliverable Notes / Guidelines</label>
                <textarea
                  rows={2}
                  value={newServiceData.notes}
                  onChange={(e) => setNewServiceData({ ...newServiceData, notes: e.target.value })}
                  placeholder="Optional deliverables notes or guidelines for the team..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loading ? "Adding..." : "Add Deliverable"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SERVICE DELIVERABLE & TARGET */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Deliverable & Target</h3>
                  <p className="text-[11px] text-slate-500">Customize deliverable name and target freely</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateServiceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deliverable / Service Name *</label>
                <input
                  type="text"
                  required
                  value={editingService.serviceName}
                  onChange={(e) => setEditingService({ ...editingService, serviceName: e.target.value })}
                  placeholder="e.g. Instagram Reels, Tech Sprint, Meta Ads"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Target (Any numbers or custom text) *
                </label>
                <input
                  type="text"
                  required
                  value={editingService.target}
                  onChange={(e) => setEditingService({ ...editingService, target: e.target.value })}
                  placeholder="e.g. 15 Reels, 20 Posts, MVP Launch, 3 Sprints"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Accepts numbers, text, or combinations (e.g. &quot;15 Reels&quot;, &quot;Complete Launch&quot;).
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deliverable Notes / Details</label>
                <textarea
                  rows={2}
                  value={editingService.notes}
                  onChange={(e) => setEditingService({ ...editingService, notes: e.target.value })}
                  placeholder="Optional deliverables notes or guidelines..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? "Saving..." : "Save Deliverable"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: GIVE / RESET CLIENT LOGIN */}
      {showClientLoginModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Provision Client Login</h3>
                  <p className="text-xs text-slate-500">{selectedClient.name} ({selectedClient.clientCode})</p>
                </div>
              </div>
              <button
                onClick={() => setShowClientLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
              When given login credentials, this client can securely log into their own portal, view live project deliverable reports, and raise complaints directly to your team.
            </div>

            <form onSubmit={handleProvisionClientLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client Login Email</label>
                <input
                  type="email"
                  required
                  value={clientLoginForm.email}
                  onChange={(e) => setClientLoginForm({ ...clientLoginForm, email: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = "Cli@" + Math.random().toString(36).substring(2, 7) + "!";
                      setClientLoginForm({ ...clientLoginForm, password: generated });
                    }}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer font-bold"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={clientLoginForm.password}
                  onChange={(e) => setClientLoginForm({ ...clientLoginForm, password: e.target.value })}
                  placeholder="Enter strong password (min 6 characters)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              {selectedClient.user?.email && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 flex items-center justify-between text-[11px]">
                  <span>Active Login: <b className="font-mono text-slate-900">{selectedClient.user.email}</b></span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClientLoginModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? "Saving Credentials..." : "Save & Grant Access"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RAISE COMPLAINT / SUPPORT TICKET */}
      {showRaiseComplaintModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Raise Complaint / Support Ticket</h3>
                  <p className="text-xs text-slate-500">{selectedClient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRaiseComplaintModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This ticket will be dispatched immediately to the assigned delivery staff and the Admin dashboard.
            </p>

            <form onSubmit={handleRaiseClientComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Complaint Subject / Title</label>
                <input
                  type="text"
                  required
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                  placeholder="e.g. Delay in social media deliverables or bug in project"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Issue Category</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="DELIVERABLE_DELAY">Deliverable Delay</option>
                    <option value="QUALITY_ISSUE">Deliverable Quality Issue</option>
                    <option value="COMMUNICATION">Team Communication</option>
                    <option value="TECHNICAL_BUG">Technical Bug / Issue</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={complaintForm.priority}
                    onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Immediate Attention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Please describe the issue or deliverable concern in detail..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRaiseComplaintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{loading ? "Submitting..." : "Submit Complaint"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESOLVE COMPLAINT (FOR STAFF / ADMIN) */}
      {selectedComplaintForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Resolve Complaint</h3>
                  <p className="text-xs text-slate-500">Ticket #{selectedComplaintForResolve.id?.substring(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaintForResolve(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedComplaintForResolve.subject}</div>
              <div className="text-slate-600">{selectedComplaintForResolve.description}</div>
            </div>

            <form onSubmit={handleResolveComplaintSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resolution Response / Notes</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionResponse}
                  onChange={(e) => setResolutionResponse(e.target.value)}
                  placeholder="Explain the steps taken to fix the issue or update provided to client..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaintForResolve(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loading ? "Resolving..." : "Mark as Resolved"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

