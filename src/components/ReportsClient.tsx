"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import {
  createClient,
  assignEmployeesToClient,
  addServiceToClient,
  updateServiceProgress,
  saveClientProgressSheet,
  completeClientProgressReport,
  addExpense,
  forwardClientDeliverableToSales,
  createClientSprintTask,
} from "@/actions/clients";

interface ReportsClientProps {
  reports: any;
  clientReports?: any[];
  initialClients?: any[];
  employees?: any[];
  financialSummary?: any;
  userRole?: string;
  currentEmployeeId?: string;
  user?: any;
}

export function ReportsClient({
  reports,
  clientReports = [],
  initialClients = [],
  employees = [],
  financialSummary,
  userRole = "EMPLOYEE",
  currentEmployeeId,
  user,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "CLIENTS" | "CUSTOM_SHEET" | "FINANCIALS" | "TEAM_AUDIT"
  >("CLIENTS");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [clients, setClients] = useState<any[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<any | null>(initialClients[0] || null);
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

  // Add Service Modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    serviceName: "",
    category: "MARKETING",
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

  // Client Sprint Task Modal state
  const [showClientTaskModal, setShowClientTaskModal] = useState(false);
  const [clientTaskForm, setClientTaskForm] = useState({
    title: "",
    description: "",
    assignedToId: currentEmployeeId || "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
    estimatedHours: 4,
  });

  // Dynamic Custom Sheet State
  const [sheetMonth, setSheetMonth] = useState<number>(new Date().getMonth() + 1);
  const [sheetYear, setSheetYear] = useState<number>(new Date().getFullYear());
  const [customColumns, setCustomColumns] = useState<string[]>([
    "Item / Deliverable",
    "Monthly Target",
    "Completed Count",
    "Remaining",
    "Status",
    "Notes & Links",
  ]);
  const [sheetRows, setSheetRows] = useState<any[]>([
    {
      id: "1",
      "Item / Deliverable": "Instagram Reels",
      "Monthly Target": "15",
      "Completed Count": "8",
      Remaining: "7",
      Status: "IN_PROGRESS",
      "Notes & Links": "4 published on IG, 4 in review",
    },
    {
      id: "2",
      "Item / Deliverable": "Static Graphics & Carousels",
      "Monthly Target": "25",
      "Completed Count": "18",
      Remaining: "7",
      Status: "IN_PROGRESS",
      "Notes & Links": "Festive batch designed and scheduled",
    },
    {
      id: "3",
      "Item / Deliverable": "Meta Ads Campaign",
      "Monthly Target": "2 Campaigns",
      "Completed Count": "1 Active",
      Remaining: "1 Pending",
      Status: "ACTIVE",
      "Notes & Links": "ROAS 3.8x on Lead Gen set",
    },
  ]);
  // Automatically load saved progress sheet for selectedClient & month
  useEffect(() => {
    if (!selectedClient) return;
    const latestReport = selectedClient.reports?.find(
      (r: any) => r.month === sheetMonth && r.year === sheetYear
    ) || selectedClient.reports?.[0];

    if (latestReport?.columnsJson) {
      try {
        const parsed = JSON.parse(latestReport.columnsJson);
        if (parsed.columns && Array.isArray(parsed.columns)) {
          setCustomColumns(parsed.columns);
        }
        if (parsed.rows && Array.isArray(parsed.rows)) {
          setSheetRows(parsed.rows);
        }
      } catch (e) {
        console.error("Error parsing saved progress sheet", e);
      }
    } else {
      // Default initial deliverable rows for new client
      setSheetRows([
        {
          id: "1",
          "Item / Deliverable": "Instagram Reels",
          "Monthly Target": "15",
          "Completed Count": "0",
          Remaining: "15",
          Status: "IN_PROGRESS",
          "Notes & Links": "Assigned to Reel Specialist",
        },
        {
          id: "2",
          "Item / Deliverable": "Graphics & Carousels",
          "Monthly Target": "20",
          "Completed Count": "0",
          Remaining: "20",
          Status: "IN_PROGRESS",
          "Notes & Links": "Assigned to Graphic Designer",
        },
        {
          id: "3",
          "Item / Deliverable": "Meta / Google Ads",
          "Monthly Target": "2 Campaigns",
          "Completed Count": "0",
          Remaining: "2",
          Status: "PENDING",
          "Notes & Links": "Assigned to Ads Manager",
        },
      ]);
      setCustomColumns([
        "Item / Deliverable",
        "Monthly Target",
        "Completed Count",
        "Remaining",
        "Status",
        "Notes & Links",
      ]);
    }
  }, [selectedClient?.id, sheetMonth, sheetYear]);

  const [newColName, setNewColName] = useState("");
  const [newRowTitle, setNewRowTitle] = useState("");

  // New Expense state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({
    category: "SERVER_INFRA",
    title: "",
    amount: 5000,
    paymentMode: "BANK_TRANSFER",
    paidTo: "",
    notes: "",
  });

  const userDept = ((user as any)?.department || "").toLowerCase();
  const isSalesManager = userRole === "MANAGER" && userDept.includes("sales");
  const isManagerOrAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isEmployee = userRole === "EMPLOYEE";

  // Filter clients by department
  const filteredClients = clients.filter((c) => {
    if (departmentFilter === "ALL") return true;
    return c.departmentType === departmentFilter;
  });

  // Handlers
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createClient({
        name: newClientData.name,
        email: newClientData.email,
        phone: newClientData.phone,
        company: newClientData.company,
        address: newClientData.address,
        departmentType: newClientData.departmentType,
        billingType: newClientData.billingType,
        amount: Number(newClientData.amount) || 0,
        notes: newClientData.notes,
        assignedEmployeeIds: newClientData.assignedEmployeeIds,
        initialServices: [
          {
            serviceName: newClientData.initialServiceName,
            category: newClientData.initialCategory,
            targetCount: Number(newClientData.initialTargetCount) || 0,
            billingCycle: newClientData.billingType,
            milestoneAmount: Number(newClientData.initialMilestoneAmount) || 0,
          },
        ],
      });
      setClients([created, ...clients]);
      setSelectedClient(created);
      setShowNewClientModal(false);
      alert(`Client ${created.name} onboarded successfully!`);
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
      await createClientSprintTask({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        title: clientTaskForm.title,
        description: clientTaskForm.description,
        assignedToId: isEmployee ? currentEmployeeId! : clientTaskForm.assignedToId,
        priority: clientTaskForm.priority,
        dueDate: clientTaskForm.dueDate,
        estimatedHours: Number(clientTaskForm.estimatedHours) || 4,
      });
      setShowClientTaskModal(false);
      setClientTaskForm({
        title: "",
        description: "",
        assignedToId: currentEmployeeId || "",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedHours: 4,
      });
      alert(`✓ Sprint task created for ${selectedClient.name}! Synced to Sprint Tasks board.`);
    } catch (e: any) {
      alert(e.message);
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
    setLoading(true);
    try {
      const savedReport = await saveClientProgressSheet({
        clientId: selectedClient.id,
        month: sheetMonth,
        year: sheetYear,
        columnsJson: JSON.stringify({ columns: customColumns, rows: sheetRows }),
        notes: `Progress report for month ${sheetMonth}/${sheetYear}`,
      });
      // Update local client report state
      const existingReports = selectedClient.reports || [];
      const updatedReports = existingReports.some((r: any) => r.id === savedReport.id || (r.month === sheetMonth && r.year === sheetYear))
        ? existingReports.map((r: any) => (r.id === savedReport.id || (r.month === sheetMonth && r.year === sheetYear)) ? savedReport : r)
        : [savedReport, ...existingReports];
      const updatedClient = { ...selectedClient, reports: updatedReports };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);
      alert("Custom Progress Sheet saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReport = async () => {
    if (!selectedClient) return;
    const isMonthly = selectedClient.billingType === "MONTHLY";
    const confirmMsg = isMonthly
      ? `Mark progress report for ${selectedClient.name} (${sheetMonth}/${sheetYear}) as COMPLETED?\n\nThis will automatically push the monthly retainer amount (₹${selectedClient.amount?.toLocaleString()}) to Sales as a Pending Receivable ready for collection.`
      : `Mark progress report for ${selectedClient.name} as COMPLETED?\n\nThis will mark the one-time project scope complete and create a payment collection receivable of ₹${selectedClient.amount?.toLocaleString()} in Sales.`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await completeClientProgressReport({
        clientId: selectedClient.id,
        month: sheetMonth,
        year: sheetYear,
        columnsJson: JSON.stringify({ columns: customColumns, rows: sheetRows }),
        notes: `Completed deliverables progress report for ${sheetMonth}/${sheetYear}. Auto forwarded to Sales.`,
      });

      // Update local client report state
      const existingReports = selectedClient.reports || [];
      const updatedReports = existingReports.some((r: any) => r.id === res.report.id || (r.month === sheetMonth && r.year === sheetYear))
        ? existingReports.map((r: any) => (r.id === res.report.id || (r.month === sheetMonth && r.year === sheetYear)) ? res.report : r)
        : [res.report, ...existingReports];
      const updatedClient = {
        ...selectedClient,
        status: selectedClient.billingType === "ONE_TIME" ? "COMPLETED" : selectedClient.status,
        reports: updatedReports,
      };
      setClients(clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)));
      setSelectedClient(updatedClient);

      alert(`✓ Progress Report marked as COMPLETED!\n\nSales Receivable Order (${res.order.orderCode}) for ₹${res.order.totalAmount?.toLocaleString()} has been automatically generated and sent to the Sales ledger for payment collection.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addExpense(expenseData);
      alert("Expense logged successfully into Financials!");
      setShowExpenseModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: "CLIENTS", label: "Client Workspace", icon: Building2, count: clients.length, color: "text-blue-600" },
    { id: "CUSTOM_SHEET", label: "Client Progress Reports", icon: FileSpreadsheet, color: "text-emerald-600" },
    ...(isManagerOrAdmin
      ? [
          { id: "FINANCIALS", label: "Financials & Cash Flow", icon: DollarSign, color: "text-amber-600" },
          { id: "TEAM_AUDIT", label: "Staff Performance Badges", icon: Users, color: "text-indigo-600" },
        ]
      : []),
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
              {activeTab === "FINANCIALS" && "Financial Overview & Salary Balancing"}
              {activeTab === "TEAM_AUDIT" && "Staff Performance & Evaluation Badges"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Digital Marketing & Technical project management, dynamic deliverable logging, and cash flow balance
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {isManagerOrAdmin && (
              <button
                onClick={() => setShowNewClientModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard Client</span>
              </button>
            )}
            {activeTab === "FINANCIALS" && isManagerOrAdmin && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
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

            {/* Clients List & Detail Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Clients Directory */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">
                  Client Roster ({filteredClients.length})
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id;
                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={cn(
                          "p-3 rounded-xl border text-left cursor-pointer transition-all",
                          isSelected
                            ? "bg-blue-50/70 border-blue-500 shadow-xs"
                            : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/70"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{client.name}</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              client.departmentType === "DIGITAL_MARKETING"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {client.departmentType === "DIGITAL_MARKETING" ? "Marketing" : "Tech"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>{client.clientCode}</span>
                          <span className="font-mono font-bold text-slate-700">{formatCurrency(client.amount)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>{client.assignments?.length || 0} staff assigned</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">No clients in this category</div>
                  )}
                </div>
              </div>

              {/* Selected Client Workspace */}
              <div className="lg:col-span-2 space-y-4">
                {isSalesManager ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Active Company Clients Directory</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      As Sales Manager, you have visibility into all company clients and their contract values for billing and realization. Client work and deliverable logs are managed by Digital Marketing and Technical department managers.
                    </p>
                    {selectedClient && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left space-y-2 mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Selected Client:</span>
                          <span className="font-bold text-slate-900">{selectedClient.name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Department:</span>
                          <span className="font-mono text-purple-600">{selectedClient.departmentType}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Contract Retainer:</span>
                          <span className="font-mono font-bold text-emerald-600">{formatCurrency(selectedClient.amount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Billing Model:</span>
                          <span className="font-mono text-slate-700">{selectedClient.billingType}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedClient ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-slate-900">{selectedClient.name}</h2>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {selectedClient.clientCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedClient.company || selectedClient.email || "Client Organization"} • Onboarded:{" "}
                          {formatDate(selectedClient.onboardingDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAssignees(selectedClient.assignments?.map((a: any) => a.employeeId) || []);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>Manage Team</span>
                          </button>
                        )}
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setForwardData({
                                amount: selectedClient.amount || 50000,
                                notes: `Deliverables completed for ${selectedClient.name}. Ready for collection.`,
                                deliverableSummary: `${selectedClient.services?.map((s: any) => `${s.serviceName}: ${s.completedCount}/${s.targetCount}`).join(", ") || "Monthly deliverables completed"}`,
                              });
                              setShowForwardModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Forward to Sales</span>
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTab("CUSTOM_SHEET")}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Client Progress Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Department</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                          {selectedClient.departmentType === "DIGITAL_MARKETING" ? "Digital Marketing" : "Technical / Dev"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Billing Model</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                          {selectedClient.billingType === "MONTHLY" ? "Monthly Retainer" : "One-Time Milestone"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Contract Value</span>
                        <span className="text-xs font-bold text-emerald-600 mt-0.5 block font-mono">
                          {formatCurrency(selectedClient.amount)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Status</span>
                        <span className="text-xs font-bold text-blue-600 mt-0.5 block">
                          {selectedClient.status}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Staff Members */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-2">
                        Allocated Team Members ({selectedClient.assignments?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.assignments && selectedClient.assignments.length > 0 ? (
                          selectedClient.assignments.map((asgn: any) => (
                            <div
                              key={asgn.id || asgn.employeeId}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-semibold text-slate-800">
                                {asgn.employee?.user?.name || asgn.employee?.employeeCode || "Employee"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({asgn.employee?.designation?.name || "Team Member"})
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                            No team members allocated yet. Managers can allocate employees to work on this client.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Reports Summary */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                          Client Progress Reports & Monthly Audits
                        </h4>
                        <button
                          onClick={() => setActiveTab("CUSTOM_SHEET")}
                          className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Open Full Progress Report Sheet ↗</span>
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedClient.reports && selectedClient.reports.length > 0 ? (
                          selectedClient.reports.map((rpt: any) => {
                            const monthNames = [
                              "January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"
                            ];
                            const isDone = rpt.status === "COMPLETED";
                            return (
                              <div
                                key={rpt.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900">
                                      {monthNames[rpt.month - 1] || `Month ${rpt.month}`} {rpt.year}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                                        isDone ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                      )}
                                    >
                                      {rpt.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Submitted by: {rpt.submittedBy || "Team"} • {rpt.notes || "Progress report logged"}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSheetMonth(rpt.month);
                                    setSheetYear(rpt.year);
                                    setActiveTab("CUSTOM_SHEET");
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                                >
                                  View Sheet
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-400 py-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                            No progress reports created for this client yet. Click &quot;Open Full Progress Report Sheet&quot; to create one.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client Tasks Section */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                          Client Sprint Tasks & Deadlines
                        </h4>
                        <button
                          onClick={() => {
                            setClientTaskForm({
                              title: "",
                              description: "",
                              assignedToId: currentEmployeeId || selectedClient.assignments?.[0]?.employeeId || employees[0]?.id || "",
                              priority: "MEDIUM",
                              dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
                              estimatedHours: 4,
                            });
                            setShowClientTaskModal(true);
                          }}
                          className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Allot Client Task</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Create client deliverables and sprint goals with deadlines. Synced with the Employee Sprint Tasks board.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                    Select a client from the roster or onboard a new one
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT CUSTOM PROGRESS REPORT */}
        {activeTab === "CUSTOM_SHEET" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
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
                      const currentMonthReport = selectedClient?.reports?.find(
                        (r: any) => r.month === sheetMonth && r.year === sheetYear
                      );
                      const isDone = currentMonthReport?.status === "COMPLETED";
                      return isDone ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          COMPLETED • RECEIVABLE SENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">
                          IN PROGRESS
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Client-specific report: Enter deliverables, custom metric columns, and submit. Marking completed generates a payment collection receivable for the Sales team.
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

                  {/* Month & Year Selectors for Client Reports */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <select
                      value={sheetMonth}
                      onChange={(e) => setSheetMonth(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((mName, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {mName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sheetYear}
                      onChange={(e) => setSheetYear(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {[2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSaveSheet}
                    disabled={loading}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>{loading ? "Saving..." : "Save Draft"}</span>
                  </button>

                  <button
                    onClick={handleCompleteReport}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Done & Add to Receivables</span>
                  </button>
                </div>
              </div>

              {/* Column Adder & Row Adder Tools */}
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

              {/* Editable Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase font-mono text-[10px]">
                      {customColumns.map((col, idx) => (
                        <th key={idx} className="p-3 border-r border-slate-200 last:border-r-0 min-w-[140px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.map((row, rIdx) => (
                      <tr key={row.id || rIdx} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                        {customColumns.map((col, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">
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
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIALS & CASH FLOW BALANCING */}
        {activeTab === "FINANCIALS" && isManagerOrAdmin && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Month's Sales Collected"
                value={formatCurrency(financialSummary?.totalSalesRevenue || 0)}
                comparisonText="Paid orders & retainers"
                icon={TrendingUp}
              />
              <KpiCard
                title="Pending Receivables"
                value={formatCurrency(financialSummary?.totalReceivables || 0)}
                comparisonText="Milestones & completed cycles"
                icon={Clock}
              />
              <KpiCard
                title="Employee Payroll Total"
                value={formatCurrency(financialSummary?.totalPayrollSalaries || 0)}
                comparisonText="Committed staff salaries"
                icon={Users}
              />
              <KpiCard
                title="Net Fund Buffer"
                value={formatCurrency(financialSummary?.netFundBuffer || 0)}
                comparisonText={financialSummary?.netFundBuffer >= 0 ? "Surplus Buffer" : "Deficit / Attention Needed"}
                icon={DollarSign}
              />
            </div>

            {/* Balancing Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase font-mono tracking-wider">
                Monthly Outflow vs Revenue Solvency
              </h3>
              <p className="text-xs text-slate-500">
                Real-time check whether current month sales revenue fulfills employee salaries and operating expenses.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Total Inflow (Collected)</span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {formatCurrency(financialSummary?.totalSalesRevenue || 0)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Total Outflow (Salaries + Expenses)</span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {formatCurrency(financialSummary?.totalOutflow || 0)}
                  </div>
                </div>

                <div
                  className={cn(
                    "p-4 rounded-xl border space-y-1",
                    financialSummary?.netFundBuffer >= 0
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      financialSummary?.netFundBuffer >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}
                  >
                    {financialSummary?.netFundBuffer >= 0
                      ? "Company Funds Solvency: Healthy"
                      : "Deficit Notice: Collections Required"}
                  </span>
                  <div
                    className={cn(
                      "text-lg font-black font-mono",
                      financialSummary?.netFundBuffer >= 0 ? "text-emerald-800" : "text-rose-800"
                    )}
                  >
                    {formatCurrency(financialSummary?.netFundBuffer || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TEAM AUDIT & EVALUATION BADGES */}
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
      </div>

      {/* MODAL 1: ONBOARD NEW CLIENT */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Onboard New Client & Project</h3>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client Name / Business Name *</label>
                <input
                  type="text"
                  required
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  placeholder="e.g. JVM Institute"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <select
                    value={newClientData.departmentType}
                    onChange={(e: any) => setNewClientData({ ...newClientData, departmentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="DIGITAL_MARKETING">Digital Marketing</option>
                    <option value="TECHNICAL">Technical / Dev</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Billing Frequency</label>
                  <select
                    value={newClientData.billingType}
                    onChange={(e: any) => setNewClientData({ ...newClientData, billingType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="MONTHLY">Monthly Retainer</option>
                    <option value="ONE_TIME">One-Time Project</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contract / Retainer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={newClientData.amount}
                  onChange={(e) => setNewClientData({ ...newClientData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Scope / Notes</label>
                <textarea
                  rows={2}
                  value={newClientData.notes}
                  onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                  placeholder="Client objectives, scope of work, deliverables summary..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  {loading ? "Onboarding..." : "Confirm & Onboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
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

      {/* MODAL 4: LOG EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Operational Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expenseData.title}
                  onChange={(e) => setExpenseData({ ...expenseData, title: e.target.value })}
                  placeholder="e.g. AWS Cloud Hosting, Canva Teams"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={expenseData.category}
                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SERVER_INFRA">Servers / Cloud</option>
                    <option value="SOFTWARE_LICENSES">Software Tools</option>
                    <option value="OFFICE_RENT">Office Rent</option>
                    <option value="UTILITIES">Utilities / Internet</option>
                    <option value="MARKETING_ADS">Marketing / Ad spend</option>
                    <option value="OTHER">Other Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  {loading ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-slate-700 font-semibold mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={clientTaskForm.estimatedHours}
                    onChange={(e) => setClientTaskForm({ ...clientTaskForm, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
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
    </div>
  );
}

