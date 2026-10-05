"use client";

import { useState } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  FileText,
  DollarSign,
  Users,
  CreditCard,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  Download,
  Calendar,
  X,
  Filter,
  PanelLeftClose,
  PanelLeft,
  Receipt,
  Layers,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
  Send,
  ArrowDownRight,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  createOrder,
  createCustomer,
  markPaymentReceived,
  recordCustomReceivedPayment,
  recordCustomReceivable,
  recordCustomExpense,
  assignCollectionTask,
} from "@/actions/sales";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface SalesClientProps {
  initialData: any;
  userRole?: string;
  user?: any;
}

export function SalesClient({ initialData, userRole = "EMPLOYEE", user }: SalesClientProps) {
  const isAdmin = userRole === "ADMIN";
  const isSalesManager = userRole === "MANAGER";
  const isSalesEmployee = userRole === "EMPLOYEE";

  // Active view default based on role
  const defaultView = isSalesEmployee ? "COLLECTIONS" : "ORDERS";
  const [activeView, setActiveView] = useState<
    "ORDERS" | "RECEIVABLES" | "COLLECTIONS" | "CUSTOMERS" | "INVOICES" | "PAYMENTS" | "EXPENSES" | "PROFIT_LOSS"
  >(defaultView as any);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [orders, setOrders] = useState<any[]>(initialData.orders || []);
  const [customers, setCustomers] = useState<any[]>(initialData.customers || []);
  const [invoices, setInvoices] = useState<any[]>(initialData.invoices || []);
  const [payments, setPayments] = useState<any[]>(initialData.payments || []);
  const [expenses, setExpenses] = useState<any[]>(initialData.expenses || []);
  const [salesStaff] = useState<any[]>(initialData.salesStaff || []);
  const [collectionTasks, setCollectionTasks] = useState<any[]>(initialData.collectionTasks || []);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomPaymentModal, setShowCustomPaymentModal] = useState(false);
  const [showCustomReceivableModal, setShowCustomReceivableModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedOrderForTask, setSelectedOrderForTask] = useState<any | null>(null);

  // Form states
  const [orderForm, setOrderForm] = useState({
    customerId: customers[0]?.id || "",
    itemTitle: "Enterprise ERP Cloud Suite (Annual)",
    unitPrice: 180000,
    quantity: 1,
    discount: 0,
    paymentStatus: "PENDING",
    notes: "",
  });

  const [custForm, setCustForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  const [customPaymentForm, setCustomPaymentForm] = useState({
    customerName: "",
    amount: 25000,
    paymentMethod: "Bank Transfer",
    notes: "Direct client wire settlement",
  });

  const [customReceivableForm, setCustomReceivableForm] = useState({
    customerName: "",
    amount: 50000,
    itemTitle: "Marketing Deliverable Milestone / Technical Scope",
    notes: "Generated from delivery completion",
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "SERVER_INFRA",
    title: "",
    amount: 15000,
    paidTo: "",
    paymentMode: "BANK_TRANSFER",
    notes: "",
  });

  const [assignTaskForm, setAssignTaskForm] = useState({
    assignedToId: salesStaff[0]?.id || "",
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
    notes: "Contact client accounts department to clear pending invoice receivable.",
  });

  const [loading, setLoading] = useState(false);

  // Derived financial computations
  const totalRevenue = orders.filter((o) => o.paymentStatus === "PAID").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingPayments = orders.filter((o) => o.paymentStatus !== "PAID").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPayroll = initialData.stats?.totalPayroll || 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOutflow = totalPayroll + totalExpenses;
  const netProfitLoss = totalRevenue - totalOutflow;

  // Filtered views
  const filteredOrders = orders.filter((o) => {
    const matchesPayment = paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
    const matchesSearch =
      o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.company?.toLowerCase().includes(search.toLowerCase());
    return matchesPayment && matchesSearch;
  });

  const pendingReceivables = orders.filter((o) => o.paymentStatus !== "PAID");

  // Handlers
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newOrder = await createOrder(orderForm);
      setOrders([newOrder, ...orders]);
      setShowOrderModal(false);
      alert(`Sale order created successfully: ${newOrder.orderCode}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newCust = await createCustomer(custForm);
      setCustomers([newCust, ...customers]);
      setShowCustomerModal(false);
      setCustForm({ name: "", email: "", phone: "", company: "", address: "" });
      alert(`Customer ${newCust.name} added successfully!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await recordCustomReceivedPayment(customPaymentForm);
      setPayments([p, ...payments]);
      setShowCustomPaymentModal(false);
      alert(`Custom payment of ${formatCurrency(customPaymentForm.amount)} recorded!`);
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
      const rec = await recordCustomReceivable(customReceivableForm);
      setOrders([rec, ...orders]);
      setShowCustomReceivableModal(false);
      alert(`Custom receivable ${rec.orderCode} recorded in ledger!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const exp = await recordCustomExpense(expenseForm);
      setExpenses([exp, ...expenses]);
      setShowExpenseModal(false);
      alert(`Operational expense of ${formatCurrency(expenseForm.amount)} logged!`);
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
      const tsk = await assignCollectionTask({
        orderId: selectedOrderForTask.id,
        assignedToId: assignTaskForm.assignedToId,
        dueDate: assignTaskForm.dueDate,
        notes: assignTaskForm.notes,
      });
      setCollectionTasks([tsk, ...collectionTasks]);
      setShowAssignTaskModal(false);
      alert(`Collection task assigned to sales representative!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build categories according to permissions
  const salesCategories = [
    ...(isAdmin
      ? [
          { key: "ORDERS", label: "All Sales Orders", icon: ShoppingBag, count: orders.length, color: "text-blue-600" },
          { key: "RECEIVABLES", label: "Pending Receivables", icon: CreditCard, count: pendingReceivables.length, color: "text-amber-600" },
          { key: "EXPENSES", label: "Company Expenses", icon: Wallet, count: expenses.length, color: "text-rose-600" },
          { key: "PROFIT_LOSS", label: "P&L Solvency Buffer", icon: TrendingUp, color: "text-emerald-600" },
          { key: "COLLECTIONS", label: "Collection Tasks", icon: Briefcase, count: collectionTasks.length, color: "text-purple-600" },
          { key: "CUSTOMERS", label: "Client Accounts", icon: Users, count: customers.length, color: "text-indigo-600" },
          { key: "INVOICES", label: "Invoices Ledger", icon: Receipt, count: invoices.length, color: "text-emerald-600" },
          { key: "PAYMENTS", label: "Payments Received", icon: DollarSign, count: payments.length, color: "text-blue-600" },
        ]
      : isSalesManager
      ? [
          { key: "RECEIVABLES", label: "Receivables to Collect", icon: CreditCard, count: pendingReceivables.length, color: "text-amber-600" },
          { key: "ORDERS", label: "Forwarded Client Orders", icon: ShoppingBag, count: orders.length, color: "text-blue-600" },
          { key: "COLLECTIONS", label: "Allot Collection Tasks", icon: Briefcase, count: collectionTasks.length, color: "text-purple-600" },
          { key: "CUSTOMERS", label: "Clients Roster", icon: Users, count: customers.length, color: "text-indigo-600" },
          { key: "PAYMENTS", label: "Collected Payments", icon: DollarSign, count: payments.length, color: "text-emerald-600" },
        ]
      : [
          // Sales Employee
          { key: "COLLECTIONS", label: "My Collection Tasks", icon: Briefcase, count: collectionTasks.length, color: "text-purple-600" },
          { key: "PAYMENTS", label: "Logged Collections", icon: DollarSign, count: payments.length, color: "text-emerald-600" },
        ]),
  ];

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

          {/* Module Views */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Ledger Navigation
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
                <span>Receivables Pipeline</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                When digital marketing & tech complete deliverables, receivables appear here for collection.
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
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {isAdmin ? "Company Sales & Financial Solvency" : isSalesManager ? "Sales Receivables & Collections" : "Assigned Receivables"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? "Full Tracking: Revenue vs Payroll & Expenses, Company P&L Solvency"
                : isSalesManager
                ? "Collect client receivables, allot staff collection tasks, log received payments"
                : "Your assigned payment follow-ups and collection updates"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Received Payment Button (All Sales & Admin) */}
            <button
              onClick={() => setShowCustomPaymentModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>+ Record Received Amount</span>
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
        {/* KPI CARDS: ROLE SPECIFIC                                                  */}
        {/* ========================================================================= */}
        {isAdmin ? (
          /* Admin Sees Full Financial Solvency (Income vs Expenses + Payroll) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              title="COLLECTED REVENUE"
              value={formatCurrency(totalRevenue)}
              trend="Realized Cash"
              isPositive={true}
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            />
            <KpiCard
              title="PENDING RECEIVABLES"
              value={formatCurrency(pendingPayments)}
              trend={`${pendingReceivables.length} unpaid`}
              isPositive={false}
              icon={CreditCard}
              iconColor="text-amber-600 bg-amber-50 border-amber-200"
            />
            <KpiCard
              title="PAYROLL SALARIES"
              value={formatCurrency(totalPayroll)}
              trend="Monthly staff payroll"
              isPositive={false}
              icon={Users}
              iconColor="text-blue-600 bg-blue-50 border-blue-200"
            />
            <KpiCard
              title="OPERATIONAL EXPENSES"
              value={formatCurrency(totalExpenses)}
              trend="Server, office, software"
              isPositive={false}
              icon={Wallet}
              iconColor="text-rose-600 bg-rose-50 border-rose-200"
            />
            <KpiCard
              title="COMPANY NET P/L"
              value={formatCurrency(netProfitLoss)}
              trend={netProfitLoss >= 0 ? "Solvent Buffer" : "Shortfall"}
              isPositive={netProfitLoss >= 0}
              icon={DollarSign}
              iconColor={netProfitLoss >= 0 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-rose-600 bg-rose-50 border-rose-200"}
            />
          </div>
        ) : isSalesManager ? (
          /* Sales Manager Sees Receivables & Collected Only (No Company Expenses/Payroll) */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="TOTAL COLLECTED REVENUE"
              value={formatCurrency(totalRevenue)}
              trend="Closed realization"
              isPositive={true}
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            />
            <KpiCard
              title="PENDING RECEIVABLES"
              value={formatCurrency(pendingPayments)}
              trend={`${pendingReceivables.length} deals pending collection`}
              isPositive={false}
              icon={CreditCard}
              iconColor="text-amber-600 bg-amber-50 border-amber-200"
            />
            <KpiCard
              title="FORWARDED CLIENT CONTRACTS"
              value={orders.length}
              trend="Technical & Marketing clients"
              isPositive={true}
              icon={ShoppingBag}
              iconColor="text-blue-600 bg-blue-50 border-blue-200"
            />
          </div>
        ) : (
          /* Sales Employee Sees Personal Collection Target */
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

        {/* Search & Sub-Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            {salesCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveView(cat.key as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeView === cat.key ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
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
              placeholder="Search records, client, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: PENDING RECEIVABLES                                               */}
        {/* ========================================================================= */}
        {(activeView === "RECEIVABLES" || activeView === "ORDERS") && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeView === "RECEIVABLES" ? "Pending Receivables from Clients" : "Sales Orders & Deliverable Ledger"}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeView === "RECEIVABLES"
                    ? "Invoices awaiting payment. Sales manager can allocate to sales staff or mark as collected."
                    : "Complete record of orders, retainers, and deliverable handoffs (descending)."}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Order / Invoice ID</th>
                    <th className="py-3 px-4">Client / Customer</th>
                    <th className="py-3 px-4">Department Handoff</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeView === "RECEIVABLES" ? pendingReceivables : filteredOrders).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {ord.orderCode}
                        {ord.client && (
                          <span className="block text-[10px] text-purple-600 font-mono font-normal">
                            Client: {ord.client.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{ord.customer?.name || ord.client?.name || "Client Account"}</div>
                        <div className="text-[11px] text-slate-500">{ord.customer?.company || ord.client?.company || "-"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {ord.client?.departmentType || "Sales"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={ord.paymentStatus} />
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(ord.saleDate)}</td>
                      <td className="py-3 px-4 text-center">
                        {ord.paymentStatus !== "PAID" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={async () => {
                                if (confirm(`Mark ₹${ord.totalAmount} collected for ${ord.orderCode}?`)) {
                                  await markPaymentReceived(ord.id);
                                  setOrders(orders.map((o) => (o.id === ord.id ? { ...o, paymentStatus: "PAID" } : o)));
                                  alert("✓ Amount updated to RECEIVED!");
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                            >
                              Collect
                            </button>
                            {(isAdmin || isSalesManager) && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForTask(ord);
                                  setShowAssignTaskModal(true);
                                }}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200 transition-all cursor-pointer"
                                title="Allot collection task to sales employee"
                              >
                                Allot Staff
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">Settled ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(activeView === "RECEIVABLES" ? pendingReceivables : filteredOrders).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                        No orders or receivables found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: COLLECTION TASKS                                                  */}
        {/* ========================================================================= */}
        {activeView === "COLLECTIONS" && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Receivable Collection Tasks</h3>
                <p className="text-xs text-slate-500">
                  {isSalesEmployee
                    ? "Your assigned receivable recovery duties. Follow up with client accounts and mark received."
                    : "Tasks allotted to sales staff to follow up and collect client payments."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {collectionTasks.map((tsk) => (
                <div key={tsk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
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
                        onClick={() => {
                          setShowCustomPaymentModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Record Collection
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">Collected ✓</span>
                    )}
                  </div>
                </div>
              ))}
              {collectionTasks.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No receivable collection tasks assigned currently.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: COMPANY EXPENSES (ADMIN ONLY)                                     */}
        {/* ========================================================================= */}
        {isAdmin && activeView === "EXPENSES" && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Operational Expenses Log</h3>
                <p className="text-xs text-slate-500">
                  Infra hosting, software licenses, office rent, utilities, and vendor payouts.
                </p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Log Expense
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-600">{exp.expenseCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{exp.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{exp.paidTo || "Vendor"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatCurrency(exp.amount)}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(exp.date)}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        No expenses logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: P&L SOLVENCY BUFFER (ADMIN ONLY)                                  */}
        {/* ========================================================================= */}
        {isAdmin && activeView === "PROFIT_LOSS" && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Company Financial Solvency Equation</h3>
              <p className="text-xs text-slate-500">
                Compare monthly income with payroll salaries and operational expenses to verify sales required for solvency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">Total Inflow (Realized Revenue)</span>
                <p className="text-2xl font-black text-emerald-700 font-mono">{formatCurrency(totalRevenue)}</p>
                <p className="text-[11px] text-emerald-600">Collected from sales & client retainers</p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider font-mono">Total Outflow (Payroll + Expenses)</span>
                <p className="text-2xl font-black text-rose-700 font-mono">{formatCurrency(totalOutflow)}</p>
                <p className="text-[11px] text-rose-600">
                  Payroll: {formatCurrency(totalPayroll)} • Expenses: {formatCurrency(totalExpenses)}
                </p>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border space-y-2",
                netProfitLoss >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
              )}>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Net Solvency Buffer (P/L)</span>
                <p className={cn("text-2xl font-black font-mono", netProfitLoss >= 0 ? "text-blue-700" : "text-amber-700")}>
                  {formatCurrency(netProfitLoss)}
                </p>
                <p className="text-[11px] text-slate-600">
                  {netProfitLoss >= 0
                    ? "✓ Company is solvent and meeting staff payroll commitments."
                    : `⚠️ Shortfall of ${formatCurrency(Math.abs(netProfitLoss))} — additional client sales required.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: PAYMENTS RECEIVED                                                 */}
        {/* ========================================================================= */}
        {activeView === "PAYMENTS" && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Received Payments Ledger</h3>
                <p className="text-xs text-slate-500">All collected receipts and verified payments (descending).</p>
              </div>
              <button
                onClick={() => setShowCustomPaymentModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Record Received Amount
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Order / Deal</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.paymentCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.order?.orderCode || "Direct Payment"}</div>
                        <div className="text-[11px] text-slate-500">{p.notes || "-"}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(p.paymentDate)}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        No payment vouchers recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD CUSTOM RECEIVED PAYMENT                                    */}
      {/* ========================================================================= */}
      {showCustomPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Received Payment</h3>
              <button onClick={() => setShowCustomPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={customPaymentForm.paymentMethod}
                    onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Settlement Notes</label>
                <input
                  type="text"
                  value={customPaymentForm.notes}
                  onChange={(e) => setCustomPaymentForm({ ...customPaymentForm, notes: e.target.value })}
                  placeholder="e.g. Cleared monthly marketing invoice"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {loading ? "Recording..." : "Save Received Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD CUSTOM RECEIVABLE                                             */}
      {/* ========================================================================= */}
      {showCustomReceivableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Custom Receivable</h3>
              <button onClick={() => setShowCustomReceivableModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
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
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  {loading ? "Adding..." : "Add to Receivables"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LOG OPERATIONAL EXPENSE (ADMIN ONLY)                              */}
      {/* ========================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Company Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
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
                  placeholder="e.g. AWS Cloud Infrastructure, Office Lease"
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
                    <option value="SERVER_INFRA">Server & Cloud Infra</option>
                    <option value="SOFTWARE_LICENSES">Software Licenses</option>
                    <option value="OFFICE_RENT">Office Rent</option>
                    <option value="UTILITIES">Utilities & Internet</option>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Paid To / Vendor</label>
                <input
                  type="text"
                  value={expenseForm.paidTo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  placeholder="e.g. Amazon Web Services Inc"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  {loading ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ALLOT COLLECTION TASK TO SALES STAFF                             */}
      {/* ========================================================================= */}
      {showAssignTaskModal && selectedOrderForTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Allot Collection Task to Staff</h3>
              <button onClick={() => setShowAssignTaskModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
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
                  {salesStaff.map((emp) => (
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
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"
                >
                  {loading ? "Assigning..." : "Assign Task to Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
