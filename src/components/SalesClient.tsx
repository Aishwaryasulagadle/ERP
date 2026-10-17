"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Plus,
  Search,
  DollarSign,
  Users,
  CreditCard,
  ShoppingBag,
  PanelLeftClose,
  PanelLeft,
  Receipt,
  CheckCircle2,
  Briefcase,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  createOrder,
  createCustomer,
  recordOrderPayment,
  recordCustomReceivedPayment,
  recordCustomReceivable,
  recordCustomExpense,
  deleteExpense,
  assignCollectionTask,
  markPaymentReceived,
  getSalesData,
} from "@/actions/sales";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";

interface SalesClientProps {
  initialData: any;
  userRole?: string;
  user?: any;
}

export function SalesClient({ initialData, userRole = "EMPLOYEE", user }: SalesClientProps) {
  const router = useRouter();
  const isAdmin = userRole === "ADMIN";
  const isSalesManager = userRole === "MANAGER";
  const isSalesEmployee = userRole === "EMPLOYEE";

  // Month & Year Filter State (Live dynamic switcher)
  const [selectedMonth, setSelectedMonth] = useState<number>(initialData.selectedMonth || 10);
  const [selectedYear, setSelectedYear] = useState<number>(initialData.selectedYear || 2026);

  // Active view default based on role
  const defaultView = isSalesEmployee ? "COLLECTIONS" : "MONTHLY_CLIENTS";
  const [activeView, setActiveView] = useState<
    "MONTHLY_CLIENTS" | "ONE_TIME_ORDERS" | "RECEIVABLES" | "PAYMENTS" | "EXPENSES" | "BALANCE_SHEET" | "COLLECTIONS" | "CUSTOMERS"
  >(defaultView as any);

  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic Data State
  const [salesData, setSalesData] = useState<any>(initialData);

  const orders = salesData.orders || [];
  const monthlyRetainers = salesData.monthlyRetainers || [];
  const oneTimeOrders = salesData.oneTimeOrders || [];
  const customers = salesData.customers || [];
  const payments = salesData.payments || [];
  const monthPayments = salesData.monthPayments || [];
  const expenses = salesData.expenses || [];
  const allExpenses = salesData.allExpenses || [];
  const salesStaff = salesData.salesStaff || [];
  const collectionTasks = salesData.collectionTasks || [];
  const stats = salesData.stats || {};

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedOrderForTask, setSelectedOrderForTask] = useState<any | null>(null);

  const [showCustomPaymentModal, setShowCustomPaymentModal] = useState(false);
  const [showCustomReceivableModal, setShowCustomReceivableModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "OFFICE_RENT",
    title: "",
    amount: 10000,
    paidTo: "",
    paymentMode: "BANK_TRANSFER",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [customPaymentForm, setCustomPaymentForm] = useState({
    customerName: "",
    amount: 25000,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "Direct client settlement voucher",
  });

  const [customReceivableForm, setCustomReceivableForm] = useState({
    customerName: "",
    amount: 50000,
    itemTitle: "Marketing Deliverable Milestone / Technical Scope",
    notes: "Generated from delivery completion",
  });

  const [custForm, setCustForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  const [assignTaskForm, setAssignTaskForm] = useState({
    assignedToId: salesStaff[0]?.id || "",
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
    notes: "Contact client accounts department to clear pending invoice receivable.",
  });

  const [loading, setLoading] = useState(false);

  // Handle Month / Year switch
  const handleMonthYearChange = async (newMonth: number, newYear: number) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setIsRefreshing(true);
    try {
      const freshData = await getSalesData({ month: newMonth, year: newYear });
      setSalesData(freshData);
    } catch (err: any) {
      alert("Error loading monthly data: " + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshCurrentView = async () => {
    setIsRefreshing(true);
    try {
      const freshData = await getSalesData({ month: selectedMonth, year: selectedYear });
      setSalesData(freshData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Collect Payment modal for an order (pre-fills remaining balance)
  const openCollectPaymentModal = (order: any) => {
    setSelectedOrderForPayment(order);
    const paidSoFar = (order.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, order.totalAmount - paidSoFar);
    setPaymentForm({
      amount: remaining,
      paymentMethod: "Bank Transfer",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: remaining < order.totalAmount ? "Partial installment payment" : "Full payment settlement",
    });
    setShowPaymentModal(true);
  };

  // Submit Collect Payment (Full or Partial)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;
    setLoading(true);
    try {
      await recordOrderPayment({
        orderId: selectedOrderForPayment.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes,
      });
      setShowPaymentModal(false);
      alert(`✓ Payment of ${formatCurrency(Number(paymentForm.amount))} successfully recorded!`);
      await refreshCurrentView();
    } catch (err: any) {
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Operational Expense (Admin)
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recordCustomExpense(expenseForm);
      setShowExpenseModal(false);
      setExpenseForm({
        category: "OFFICE_RENT",
        title: "",
        amount: 10000,
        paidTo: "",
        paymentMode: "BANK_TRANSFER",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      alert(`✓ Company expense of ${formatCurrency(expenseForm.amount)} logged!`);
      await refreshCurrentView();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!confirm(`Delete expense "${title}"?`)) return;
    try {
      await deleteExpense(id);
      await refreshCurrentView();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCustomPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recordCustomReceivedPayment(customPaymentForm);
      setShowCustomPaymentModal(false);
      alert(`✓ Direct payment voucher of ${formatCurrency(customPaymentForm.amount)} recorded!`);
      await refreshCurrentView();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomReceivableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recordCustomReceivable(customReceivableForm);
      setShowCustomReceivableModal(false);
      alert(`✓ Custom receivable created!`);
      await refreshCurrentView();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCustomer(custForm);
      setShowCustomerModal(false);
      setCustForm({ name: "", email: "", phone: "", company: "", address: "" });
      alert(`✓ Customer added successfully!`);
      await refreshCurrentView();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForTask) return;
    setLoading(true);
    try {
      await assignCollectionTask({
        orderId: selectedOrderForTask.id,
        assignedToId: assignTaskForm.assignedToId,
        dueDate: assignTaskForm.dueDate,
        notes: assignTaskForm.notes,
      });
      setShowAssignTaskModal(false);
      alert(`✓ Collection task assigned to sales staff!`);
      await refreshCurrentView();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  // Role navigation categories
  const salesCategories = [
    ...(isAdmin
      ? [
          { key: "MONTHLY_CLIENTS", label: "Monthly Retainer Clients", icon: RefreshCw, count: monthlyRetainers.length, color: "text-blue-600" },
          { key: "ONE_TIME_ORDERS", label: "One-Time Projects", icon: ShoppingBag, count: oneTimeOrders.length, color: "text-purple-600" },
          { key: "RECEIVABLES", label: "Pending Receivables", icon: CreditCard, count: orders.filter((o: any) => o.paymentStatus !== "PAID").length, color: "text-amber-600" },
          { key: "EXPENSES", label: "Company Expenses", icon: Wallet, count: expenses.length, color: "text-rose-600" },
          { key: "BALANCE_SHEET", label: "Monthly Balance Sheet (P&L)", icon: FileSpreadsheet, color: "text-emerald-600" },
          { key: "PAYMENTS", label: "Payments Ledger", icon: DollarSign, count: payments.length, color: "text-blue-600" },
          { key: "COLLECTIONS", label: "Collection Tasks", icon: Briefcase, count: collectionTasks.length, color: "text-indigo-600" },
          { key: "CUSTOMERS", label: "Clients Directory", icon: Users, count: customers.length, color: "text-slate-600" },
        ]
      : isSalesManager
      ? [
          { key: "MONTHLY_CLIENTS", label: "Monthly Retainer Clients", icon: RefreshCw, count: monthlyRetainers.length, color: "text-blue-600" },
          { key: "ONE_TIME_ORDERS", label: "One-Time Projects", icon: ShoppingBag, count: oneTimeOrders.length, color: "text-purple-600" },
          { key: "RECEIVABLES", label: "Pending Receivables", icon: CreditCard, count: orders.filter((o: any) => o.paymentStatus !== "PAID").length, color: "text-amber-600" },
          { key: "COLLECTIONS", label: "Allot Staff Tasks", icon: Briefcase, count: collectionTasks.length, color: "text-indigo-600" },
          { key: "PAYMENTS", label: "Collected Receipts", icon: DollarSign, count: payments.length, color: "text-emerald-600" },
          { key: "CUSTOMERS", label: "Clients Directory", icon: Users, count: customers.length, color: "text-slate-600" },
        ]
      : [
          // Sales Employee
          { key: "COLLECTIONS", label: "My Collection Tasks", icon: Briefcase, count: collectionTasks.length, color: "text-purple-600" },
          { key: "MONTHLY_CLIENTS", label: "Monthly Clients", icon: RefreshCw, count: monthlyRetainers.length, color: "text-blue-600" },
          { key: "ONE_TIME_ORDERS", label: "One-Time Projects", icon: ShoppingBag, count: oneTimeOrders.length, color: "text-purple-600" },
          { key: "PAYMENTS", label: "Logged Collections", icon: DollarSign, count: payments.length, color: "text-emerald-600" },
        ]),
  ];

  // Search filter helper
  const matchesSearch = (item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const code = item.orderCode || item.expenseCode || item.paymentCode || item.clientCode || "";
    const name = item.customer?.name || item.client?.name || item.title || item.name || "";
    const company = item.customer?.company || item.client?.company || "";
    const notes = item.notes || "";
    return (
      code.toLowerCase().includes(s) ||
      name.toLowerCase().includes(s) ||
      company.toLowerCase().includes(s) ||
      notes.toLowerCase().includes(s)
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">
                    {isAdmin ? "Sales & Executive P&L" : isSalesManager ? "Sales Receivables Hub" : "My Collections"}
                  </h2>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isAdmin ? "Solvency & Operations" : isSalesManager ? "Billing & Staff Allotment" : "Sales Representative"}
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

          {/* Module Views Navigation */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Sales Ledger Navigation
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {salesCategories.map((cat) => {
                const isActive = activeView === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveView(cat.key as any)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive ? "bg-blue-600 text-white font-bold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

          {/* Quick Info Box */}
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Dynamic Revenue System</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Active monthly clients automatically refresh every month. Cash collections count towards revenue in the month they are received.
              </p>
            </div>
          </div>
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

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0">
        {/* Top Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {isAdmin ? "Company Sales & Financial Solvency" : isSalesManager ? "Sales Receivables & Collections" : "Assigned Receivables"}
              </h1>
              {isRefreshing && (
                <span className="flex items-center gap-1 text-[11px] text-blue-600 font-bold animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? "Full Tracking: Realized Inflow vs Payroll & Operational Outflow, Company Balance Sheet"
                : isSalesManager
                ? "Manage monthly client retainers, collect partial/full payments, and allot staff duties"
                : "Your assigned payment follow-ups and collection updates"}
            </p>
          </div>

          {/* Month & Year Selector + Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dynamic Month-Year Picker */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthYearChange(Number(e.target.value), selectedYear)}
                className="bg-transparent text-xs font-bold text-slate-800 pr-2 focus:outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => handleMonthYearChange(selectedMonth, Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 border-l border-slate-200 pl-2 focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Received Payment Button (All Sales & Admin) */}
            <button
              onClick={() => setShowCustomPaymentModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>+ Record Payment</span>
            </button>

            {/* Custom Receivable Button (Admin or Sales Manager) */}
            {(isAdmin || isSalesManager) && (
              <button
                onClick={() => setShowCustomReceivableModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Receivable</span>
              </button>
            )}

            {/* Log Operational Expense Button (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>+ Log Expense</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI CARDS: 100% REAL LIVE DATA SYNCED FROM DB                             */}
        {/* ========================================================================= */}
        {isAdmin ? (
          /* Admin Sees Full Financial Health for the Selected Month */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              title={`${monthNames[selectedMonth - 1]?.toUpperCase()} REVENUE`}
              value={formatCurrency(stats.monthRevenue || 0)}
              trend="Actual Cash Received"
              isPositive={true}
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            />
            <KpiCard
              title="PENDING RECEIVABLES"
              value={formatCurrency(stats.pendingReceivablesTotal || 0)}
              trend={`${orders.filter((o: any) => o.paymentStatus !== "PAID").length} deals uncollected`}
              isPositive={false}
              icon={CreditCard}
              iconColor="text-amber-600 bg-amber-50 border-amber-200"
            />
            <KpiCard
              title="MONTHLY PAYROLL"
              value={formatCurrency(stats.totalPayroll || 0)}
              trend={`${monthNames[selectedMonth - 1]} Staff Salaries`}
              isPositive={false}
              icon={Users}
              iconColor="text-blue-600 bg-blue-50 border-blue-200"
            />
            <KpiCard
              title="OPERATIONAL EXPENSES"
              value={formatCurrency(stats.totalExpenses || 0)}
              trend="Rent, Utilities, Internet"
              isPositive={false}
              icon={Wallet}
              iconColor="text-rose-600 bg-rose-50 border-rose-200"
            />
            <KpiCard
              title="NET SOLVENCY (P/L)"
              value={formatCurrency(stats.netProfitLoss || 0)}
              trend={(stats.netProfitLoss || 0) >= 0 ? "Solvent Buffer" : "Shortfall"}
              isPositive={(stats.netProfitLoss || 0) >= 0}
              icon={DollarSign}
              iconColor={(stats.netProfitLoss || 0) >= 0 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-rose-600 bg-rose-50 border-rose-200"}
            />
          </div>
        ) : isSalesManager ? (
          /* Sales Manager Sees Sales Metrics Only */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title={`${monthNames[selectedMonth - 1]?.toUpperCase()} COLLECTED REVENUE`}
              value={formatCurrency(stats.monthRevenue || 0)}
              trend="Received Inflow"
              isPositive={true}
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            />
            <KpiCard
              title="PENDING RECEIVABLES"
              value={formatCurrency(stats.pendingReceivablesTotal || 0)}
              trend={`${orders.filter((o: any) => o.paymentStatus !== "PAID").length} deals pending collection`}
              isPositive={false}
              icon={CreditCard}
              iconColor="text-amber-600 bg-amber-50 border-amber-200"
            />
            <KpiCard
              title="MONTHLY RETAINER CLIENTS"
              value={monthlyRetainers.length}
              trend="Active recurring accounts"
              isPositive={true}
              icon={RefreshCw}
              iconColor="text-blue-600 bg-blue-50 border-blue-200"
            />
          </div>
        ) : (
          /* Sales Employee Sees Personal Tasks & Collections */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="MY ASSIGNED COLLECTION TASKS"
              value={collectionTasks.length}
              trend="Tasks to recover"
              isPositive={true}
              icon={Briefcase}
              iconColor="text-purple-600 bg-purple-50 border-purple-200"
            />
            <KpiCard
              title="COLLECTED SETTLEMENTS"
              value={payments.length}
              trend="Receipt vouchers"
              isPositive={true}
              icon={CheckCircle2}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            />
          </div>
        )}

        {/* View Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-1 overflow-x-auto">
            {salesCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveView(cat.key as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeView === cat.key ? "bg-blue-600 text-white font-bold shadow-xs" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {cat.label} {cat.count !== undefined ? `(${cat.count})` : ""}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search client, order, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: MONTHLY RETAINER CLIENTS                                          */}
        {/* ========================================================================= */}
        {activeView === "MONTHLY_CLIENTS" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Monthly Retainer Clients — {currentMonthLabel}</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Recurring Retainers
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Every active monthly client is dynamically displayed here every month with their retainer invoice. When payment is received, mark it paid or record partial payments.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client Name & Details</th>
                    <th className="py-3 px-4">Department Type</th>
                    <th className="py-3 px-4">Order / Invoice ID</th>
                    <th className="py-3 px-4 text-right">Retainer Amount</th>
                    <th className="py-3 px-4 text-right">Collected</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Collection Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyRetainers.filter(matchesSearch).map((ord: any) => {
                    const paid = (ord.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                    const remaining = Math.max(0, ord.totalAmount - paid);
                    const isFullyPaid = ord.paymentStatus === "PAID" || remaining <= 0;
                    const isPartial = ord.paymentStatus === "PARTIAL" || (paid > 0 && remaining > 0);

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ord.client?.name || ord.customer?.name}</div>
                          <div className="text-[11px] text-slate-500">{ord.client?.company || ord.customer?.company || "Monthly Retainer"}</div>
                          <div className="text-[10px] text-blue-600 font-mono mt-0.5">Code: {ord.client?.clientCode || "CLT"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {ord.client?.departmentType || "MARKETING"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {ord.orderCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(paid)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(remaining)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isFullyPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PAID ✓
                            </span>
                          ) : isPartial ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isFullyPaid ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openCollectPaymentModal(ord)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                              >
                                Collect Payment
                              </button>
                              {(isAdmin || isSalesManager) && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForTask(ord);
                                    setShowAssignTaskModal(true);
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200 transition-all cursor-pointer"
                                  title="Allot staff collection follow up"
                                >
                                  Allot
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600">Settled ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {monthlyRetainers.filter(matchesSearch).length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        No monthly retainer clients found for {currentMonthLabel}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ONE-TIME PROJECTS & MILESTONE CONTRACTS                           */}
        {/* ========================================================================= */}
        {activeView === "ONE_TIME_ORDERS" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>One-Time Projects & Contract Orders</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Milestone / Fixed Scope
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Total contract value, amount collected so far, remaining balance, and partial payment collection.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client / Project</th>
                    <th className="py-3 px-4">Order Code</th>
                    <th className="py-3 px-4 text-right">Total Contract</th>
                    <th className="py-3 px-4 text-right">Collected to Date</th>
                    <th className="py-3 px-4 text-right">Pending Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Contract Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {oneTimeOrders.filter(matchesSearch).map((ord: any) => {
                    const paid = (ord.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                    const remaining = Math.max(0, ord.totalAmount - paid);
                    const isFullyPaid = ord.paymentStatus === "PAID" || remaining <= 0;
                    const isPartial = ord.paymentStatus === "PARTIAL" || (paid > 0 && remaining > 0);

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ord.client?.name || ord.customer?.name}</div>
                          <div className="text-[11px] text-slate-500">{ord.notes || ord.customer?.company || "Custom Project Scope"}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-600">
                          {ord.orderCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(paid)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(remaining)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isFullyPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PAID ✓
                            </span>
                          ) : isPartial ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(ord.saleDate)}</td>
                        <td className="py-3 px-4 text-center">
                          {!isFullyPaid ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openCollectPaymentModal(ord)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                              >
                                Collect Payment
                              </button>
                              {(isAdmin || isSalesManager) && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForTask(ord);
                                    setShowAssignTaskModal(true);
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200 transition-all cursor-pointer"
                                  title="Allot staff collection follow up"
                                >
                                  Allot
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600">Settled ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {oneTimeOrders.filter(matchesSearch).length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        No one-time project orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PENDING RECEIVABLES (ALL UNPAID OR PARTIAL)                        */}
        {/* ========================================================================= */}
        {activeView === "RECEIVABLES" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pending Receivables Ledger</h3>
                <p className="text-xs text-slate-500">
                  All active orders and client contracts that still have an unpaid balance. Collect full or partial payments.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order Code</th>
                    <th className="py-3 px-4">Client / Customer</th>
                    <th className="py-3 px-4">Billing Type</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Paid to Date</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders
                    .filter((o: any) => o.paymentStatus !== "PAID")
                    .filter(matchesSearch)
                    .map((ord: any) => {
                      const paid = (ord.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                      const remaining = Math.max(0, ord.totalAmount - paid);

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">{ord.orderCode}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{ord.client?.name || ord.customer?.name}</div>
                            <div className="text-[11px] text-slate-500">{ord.notes || ord.customer?.company || "-"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {ord.client?.billingType || "ORDER"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(paid)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={ord.paymentStatus} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openCollectPaymentModal(ord)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                              >
                                Collect
                              </button>
                              {(isAdmin || isSalesManager) && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForTask(ord);
                                    setShowAssignTaskModal(true);
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200 transition-all cursor-pointer"
                                  title="Allot staff"
                                >
                                  Allot
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {orders.filter((o: any) => o.paymentStatus !== "PAID").filter(matchesSearch).length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        All client receivables have been collected and settled!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: COMPANY EXPENSES (ADMIN ONLY)                                     */}
        {/* ========================================================================= */}
        {isAdmin && activeView === "EXPENSES" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Company Operational Expenses — {currentMonthLabel}</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {formatCurrency(stats.totalExpenses || 0)} Total
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Office rent, electricity & light bills, internet & telecom, server infra, software subscriptions, and ads.
                </p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                + Log Expense
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono font-semibold">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To / Vendor</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Date</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.filter(matchesSearch).map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-600">{exp.expenseCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{exp.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{exp.paidTo || "Vendor"}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{exp.paymentMode}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatCurrency(exp.amount)}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          title="Delete expense"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.filter(matchesSearch).length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        No expenses logged for {currentMonthLabel}. Click "+ Log Expense" above to add office rent, light bills, or utilities.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: MONTHLY BALANCE SHEET / P&L (ADMIN ONLY)                          */}
        {/* ========================================================================= */}
        {isAdmin && activeView === "BALANCE_SHEET" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Company Balance Sheet & Financial Solvency — {currentMonthLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly cash inflow realized from client collections compared against total outflow (Employee Payroll + Operational Expenses).
                </p>
              </div>
            </div>

            {/* Three Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2 relative overflow-hidden">
                <div className="w-1.5 h-full bg-emerald-500 absolute left-0 top-0" />
                <div className="pl-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                      1. Realized Cash Inflow
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      {monthNames[selectedMonth - 1]}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(stats.monthRevenue || 0)}</p>
                  <p className="text-[11px] text-slate-500">
                    Collected payments from client retainers, project installments, and settlements in {monthNames[selectedMonth - 1]}.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2 relative overflow-hidden">
                <div className="w-1.5 h-full bg-rose-500 absolute left-0 top-0" />
                <div className="pl-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                      2. Operational Outflow
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                      Total Costs
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(stats.totalOutflow || 0)}</p>
                  <p className="text-[11px] text-slate-500">
                    Staff Salaries: {formatCurrency(stats.totalPayroll || 0)} • Operational Expenses: {formatCurrency(stats.totalExpenses || 0)}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2 relative overflow-hidden">
                <div className={cn("w-1.5 h-full absolute left-0 top-0", (stats.netProfitLoss || 0) >= 0 ? "bg-blue-600" : "bg-amber-500")} />
                <div className="pl-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                      3. Net Solvency Buffer (P/L)
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                      (stats.netProfitLoss || 0) >= 0 ? "bg-blue-50 text-blue-700 border-blue-200/80" : "bg-amber-50 text-amber-700 border-amber-200/80"
                    )}>
                      {(stats.netProfitLoss || 0) >= 0 ? "Solvent Buffer" : "Deficit"}
                    </span>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold font-mono tracking-tight",
                    (stats.netProfitLoss || 0) >= 0 ? "text-slate-900" : "text-amber-700"
                  )}>
                    {formatCurrency(stats.netProfitLoss || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(stats.netProfitLoss || 0) >= 0
                      ? `✓ Company is fully solvent with a positive buffer of ${formatCurrency(stats.netProfitLoss)}.`
                      : `⚠️ Deficit of ${formatCurrency(Math.abs(stats.netProfitLoss))} — collect pending receivables to balance.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Inflow vs Outflow Breakdown Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Cash Inflow Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>Cash Inflow Vouchers ({monthNames[selectedMonth - 1]})</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(stats.monthRevenue || 0)}</span>
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {monthPayments.map((p: any) => (
                    <div key={p.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{p.order?.client?.name || p.order?.customer?.name || "Direct Receipt"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.paymentCode} • {p.paymentMethod}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 font-mono">{formatCurrency(p.amount)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatDate(p.paymentDate)}</div>
                      </div>
                    </div>
                  ))}
                  {monthPayments.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No payments received in {currentMonthLabel}.
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Outflow Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>Outflow Items ({monthNames[selectedMonth - 1]})</span>
                  <span className="font-mono text-rose-600">{formatCurrency(stats.totalOutflow || 0)}</span>
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* Payroll Row */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">Active Employee Payroll Salaries</div>
                      <div className="text-[11px] text-slate-500">Monthly company staff compensation</div>
                    </div>
                    <div className="font-bold text-rose-600 font-mono">{formatCurrency(stats.totalPayroll || 0)}</div>
                  </div>

                  {/* Expenses Rows */}
                  {expenses.map((exp: any) => (
                    <div key={exp.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{exp.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{exp.category} • {exp.paidTo || "Vendor"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-rose-600 font-mono">{formatCurrency(exp.amount)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatDate(exp.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: PAYMENTS LEDGER                                                   */}
        {/* ========================================================================= */}
        {activeView === "PAYMENTS" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Received Payments Ledger</h3>
                <p className="text-xs text-slate-500">
                  All collection vouchers, transaction receipts, and payment dates recorded in the system.
                </p>
              </div>
              <button
                onClick={() => setShowCustomPaymentModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                + Record Received Amount
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono font-semibold">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Client / Account</th>
                    <th className="py-3 px-4">Order Code</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                    <th className="py-3 px-4 text-right">Received Date</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.filter(matchesSearch).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.paymentCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.order?.client?.name || p.order?.customer?.name || "Direct Payment"}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-600">{p.order?.orderCode || "-"}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || "-"}</td>
                    </tr>
                  ))}
                  {payments.filter(matchesSearch).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                        No payment vouchers recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: COLLECTION TASKS                                                  */}
        {/* ========================================================================= */}
        {activeView === "COLLECTIONS" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Receivable Collection Tasks</h3>
                <p className="text-xs text-slate-500">
                  {isSalesEmployee
                    ? "Your assigned receivable recovery duties. Contact client accounts and collect payment."
                    : "Tasks allotted to sales staff to follow up on pending client receivables."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {collectionTasks.filter(matchesSearch).map((tsk: any) => (
                <div key={tsk.id} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{tsk.title}</span>
                      <StatusBadge status={tsk.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600">{tsk.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                      <span>Assigned to: {tsk.assignedTo?.user?.name || "Sales Rep"}</span>
                      <span>Due: {formatDate(tsk.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tsk.status !== "COMPLETED" ? (
                      <button
                        onClick={() => setShowCustomPaymentModal(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                      >
                        Record Collection
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">Collected ✓</span>
                    )}
                  </div>
                </div>
              ))}
              {collectionTasks.filter(matchesSearch).length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No receivable collection tasks found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8: CLIENTS DIRECTORY                                                 */}
        {/* ========================================================================= */}
        {activeView === "CUSTOMERS" && (
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clients & Accounts Directory</h3>
                <p className="text-xs text-slate-500">List of registered clients and billing configurations.</p>
              </div>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                + Add Customer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono font-semibold">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Total Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.filter(matchesSearch).map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.company || "-"}</td>
                      <td className="py-3 px-4 text-slate-600">{c.email || "-"}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.phone || "-"}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{c.orders?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: COLLECT PAYMENT (FULL OR PARTIAL WITH DYNAMIC REVENUE ATTRIBUTION) */}
      {/* ========================================================================= */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Collect Payment</h3>
                <p className="text-[11px] text-slate-500">Order: {selectedOrderForPayment.orderCode}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order Balance Overview Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Client / Customer:</span>
                <span className="font-bold text-slate-900">
                  {selectedOrderForPayment.client?.name || selectedOrderForPayment.customer?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Contract Value:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedOrderForPayment.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Received:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(
                    (selectedOrderForPayment.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Remaining Balance:</span>
                <span className="font-bold text-rose-600">
                  {formatCurrency(
                    Math.max(
                      0,
                      selectedOrderForPayment.totalAmount -
                        (selectedOrderForPayment.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0)
                    )
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Amount to Collect (₹) *</label>
                  <span className="text-[11px] text-blue-600 font-medium">Full or partial amount</span>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Settlement Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Cleared monthly invoice, 1st installment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-relaxed">
                💡 <strong>Revenue Attribution:</strong> This ₹{Number(paymentForm.amount).toLocaleString()} will be automatically added to the revenue of the selected month ({new Date(paymentForm.paymentDate).toLocaleString("default", { month: "short", year: "numeric" })}).
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Recording..." : "Record & Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG OPERATIONAL EXPENSE (ADMIN ONLY)                                */}
      {/* ========================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Company Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Office Rent, Electricity / Light Bill, Fiber Internet"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="OFFICE_RENT">Office Rent / Lease</option>
                    <option value="UTILITIES">Electricity, Water & Light Bill</option>
                    <option value="SERVER_INFRA">Server & Cloud Infra</option>
                    <option value="SOFTWARE_LICENSES">Software Licenses</option>
                    <option value="MARKETING_ADS">Marketing & Paid Ads</option>
                    <option value="OTHER">Other Operational Cost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Paid To / Vendor</label>
                  <input
                    type="text"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    placeholder="e.g. Landlord, Electricity Board"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="e.g. Transaction UTR # or Bill Receipt"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DIRECT CUSTOM PAYMENT VOUCHER                                      */}
      {/* ========================================================================= */}
      {showCustomPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Received Payment</h3>
              <button onClick={() => setShowCustomPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCustomPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  value={customPaymentForm.customerName}
                  onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, customerName: e.target.value })}
                  placeholder="e.g. Apex Dynamics, TechVanguard"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Received Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={customPaymentForm.amount}
                    onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={customPaymentForm.paymentMethod}
                    onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={customPaymentForm.paymentDate}
                  onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Settlement Notes</label>
                <input
                  type="text"
                  value={customPaymentForm.notes}
                  onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, notes: e.target.value })}
                  placeholder="e.g. Direct wire settlement"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Recording..." : "Save Received Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM RECEIVABLE                                              */}
      {/* ========================================================================= */}
      {showCustomReceivableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Custom Receivable</h3>
              <button onClick={() => setShowCustomReceivableModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCustomReceivableSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={customReceivableForm.customerName}
                  onChange={(e) => setCustomReceivableForm({ ...customReceivableForm, customerName: e.target.value })}
                  placeholder="e.g. Nexus Corp"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Receivable Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={customReceivableForm.amount}
                  onChange={(e) => setCustomReceivableForm({ ...customReceivableForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contract / Deliverable Title</label>
                <input
                  type="text"
                  value={customReceivableForm.itemTitle}
                  onChange={(e) => setCustomReceivableForm({ ...customReceivableForm, itemTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomReceivableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Adding..." : "Add to Receivables"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALLOT COLLECTION TASK TO SALES STAFF                               */}
      {/* ========================================================================= */}
      {showAssignTaskModal && selectedOrderForTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Allot Collection Task to Staff</h3>
              <button onClick={() => setShowAssignTaskModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Target Order:</span>
                <span className="font-bold text-blue-600">{selectedOrderForTask.orderCode}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Receivable Amount:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedOrderForTask.totalAmount)}</span>
              </div>
            </div>
            <form onSubmit={handleAssignTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assign to Sales Representative *</label>
                <select
                  value={assignTaskForm.assignedToId}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {salesStaff.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name || emp.employeeCode} ({emp.designation?.name || "Sales Rep"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recovery Deadline *</label>
                <input
                  type="date"
                  required
                  value={assignTaskForm.dueDate}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Instructions / Follow-up Notes</label>
                <input
                  type="text"
                  value={assignTaskForm.notes}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Assigning..." : "Assign Task to Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOMER                                                       */}
      {/* ========================================================================= */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Customer Account</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={custForm.company}
                  onChange={(e) => setCustForm({ ...custForm, company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={custForm.phone}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  {loading ? "Saving..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
