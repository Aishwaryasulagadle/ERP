"use client";

import { useState, useMemo } from "react";
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
  ArrowDownRight,
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
  Target,
  Percent,
  TrendingDown,
  BarChart3,
  GitCommit,
  RotateCcw,
  UserCheck,
  ChevronRight,
  Building,
  HelpCircle,
  Info,
  ShieldCheck,
  ChevronDown,
  Package,
  Activity,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { createOrder, createCustomer } from "@/actions/sales";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

interface SalesClientProps {
  initialData: any;
}

export function SalesClient({ initialData }: SalesClientProps) {
  // Existing Navigation State
  const [activeView, setActiveView] = useState<
    | "ORDERS"
    | "CUSTOMERS"
    | "INVOICES"
    | "PAYMENTS"
    | "TARGETS"
    | "PROFITABILITY"
    | "FORECAST"
    | "LIFECYCLE"
    | "RETURNS"
    | "REP_PERFORMANCE"
    | "ANALYTICS"
  >("ORDERS");

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Existing datasets
  const [orders, setOrders] = useState<any[]>(initialData.orders || []);
  const [customers, setCustomers] = useState<any[]>(initialData.customers || []);
  const [invoices, setInvoices] = useState<any[]>(initialData.invoices || []);
  const [payments, setPayments] = useState<any[]>(initialData.payments || []);
  const [quotations, setQuotations] = useState<any[]>(initialData.quotations || []);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any | null>(null);

  // 1. Target & Achievements Data State
  const [targetPeriod, setTargetPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [overallMonthlyTarget, setOverallMonthlyTarget] = useState<number>(1000000);
  const [overallYearlyTarget, setOverallYearlyTarget] = useState<number>(12000000);
  const [salesRepsTargets, setSalesRepsTargets] = useState<any[]>([
    {
      id: "rep-1",
      name: "Rahul Sharma",
      team: "Enterprise Sales",
      monthlyTarget: 400000,
      actualSales: 320000,
      ordersCount: 18,
      pendingPayments: 45000,
    },
    {
      id: "rep-2",
      name: "Amit Patel",
      team: "Commercial Team",
      monthlyTarget: 300000,
      actualSales: 210000,
      ordersCount: 12,
      pendingPayments: 62000,
    },
    {
      id: "rep-3",
      name: "Priya Sundaram",
      team: "Strategic Accounts",
      monthlyTarget: 400000,
      actualSales: 450000,
      ordersCount: 20,
      pendingPayments: 18000,
    },
    {
      id: "rep-4",
      name: "Vikram Malhotra",
      team: "Direct & SMB",
      monthlyTarget: 250000,
      actualSales: 220000,
      ordersCount: 14,
      pendingPayments: 30000,
    },
  ]);

  // Target Form Modal State
  const [targetForm, setTargetForm] = useState({
    repId: "ALL",
    period: "MONTHLY",
    targetAmount: 1000000,
    team: "Enterprise Sales",
  });

  // 2. Profit & Margin Analysis State
  const [profitBreakdownType, setProfitBreakdownType] = useState<"ORDER" | "CUSTOMER" | "PRODUCT">("ORDER");

  // 3. Sales Lifecycle State
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("ALL");

  // 5. Sales Returns / Refunds State
  const [returnsList, setReturnsList] = useState<any[]>([
    {
      id: "RET-2026-001",
      orderId: "ORD-2026-002",
      customer: "Apex Global Tech",
      product: "ERP User Add-on Licenses (10 Users)",
      reason: "Ordered excess licenses by mistake",
      amount: 45000,
      status: "REFUNDED",
      creditNote: "CN-2026-081",
      date: "2026-09-28",
    },
    {
      id: "RET-2026-002",
      orderId: "ORD-2026-004",
      customer: "Nova Dynamics Ltd",
      product: "Custom Integration Module",
      reason: "Feature scope modified",
      amount: 30000,
      status: "APPROVED",
      creditNote: "CN-2026-082",
      date: "2026-10-01",
    },
    {
      id: "RET-2026-003",
      orderId: "ORD-2026-007",
      customer: "Zenith Cloud Solutions",
      product: "Cloud Storage Add-on 1TB",
      reason: "Downgraded subscription tier",
      amount: 15000,
      status: "REQUESTED",
      creditNote: "Pending Review",
      date: "2026-10-02",
    },
  ]);

  const [returnForm, setReturnForm] = useState({
    orderId: "",
    customer: "",
    product: "Enterprise ERP Cloud Suite (Annual)",
    reason: "Client downgrade / Scope adjustment",
    amount: 25000,
    status: "REQUESTED",
  });

  // 7. Rep Performance Filter State
  const [repFilterTeam, setRepFilterTeam] = useState("ALL");
  const [repSearch, setRepSearch] = useState("");

  // 8. Sales Analytics Date Filter State
  const [analyticsDateRange, setAnalyticsDateRange] = useState<
    "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM"
  >("THIS_MONTH");

  // New Order Form
  const [orderForm, setOrderForm] = useState({
    customerId: customers[0]?.id || "",
    itemTitle: "Enterprise ERP Cloud Suite (Annual)",
    unitPrice: 180000,
    quantity: 1,
    discount: 0,
    paymentStatus: "PAID",
    notes: "",
  });

  // New Customer Form
  const [custForm, setCustForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  // Existing Handlers
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

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetForm.repId === "ALL") {
      if (targetForm.period === "MONTHLY") {
        setOverallMonthlyTarget(Number(targetForm.targetAmount));
      } else {
        setOverallYearlyTarget(Number(targetForm.targetAmount));
      }
    } else {
      setSalesRepsTargets((prev) =>
        prev.map((r) =>
          r.id === targetForm.repId
            ? { ...r, monthlyTarget: Number(targetForm.targetAmount), team: targetForm.team }
            : r
        )
      );
    }
    setShowTargetModal(false);
    alert("Sales Target updated successfully!");
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const newRet = {
      id: `RET-2026-${String(returnsList.length + 1).padStart(3, "0")}`,
      orderId: returnForm.orderId || "ORD-2026-009",
      customer: returnForm.customer || "Enterprise Client",
      product: returnForm.product,
      reason: returnForm.reason,
      amount: Number(returnForm.amount),
      status: returnForm.status,
      creditNote: returnForm.status === "REFUNDED" ? `CN-2026-0${returnsList.length + 85}` : "Pending Review",
      date: new Date().toISOString().split("T")[0],
    };
    setReturnsList([newRet, ...returnsList]);
    setShowReturnModal(false);
    alert(`Sales return request created: ${newRet.id}`);
  };

  // Calculations for Existing and New Views
  const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingPayments = orders
    .filter((o) => o.paymentStatus !== "PAID")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todaySales = 45000;
  const monthlySales = totalRev > 0 ? totalRev : 750000;

  // Target metrics
  const activeTarget = targetPeriod === "MONTHLY" ? overallMonthlyTarget : overallYearlyTarget;
  const actualTargetSales = targetPeriod === "MONTHLY" ? monthlySales : monthlySales * 11.2;
  const achievementPct = Math.min(Math.round((actualTargetSales / activeTarget) * 100), 999);
  const remainingTarget = Math.max(activeTarget - actualTargetSales, 0);

  // Profit & Margin metrics
  const costOfSales = Math.round(monthlySales * 0.672); // e.g. ₹3,80,000 / ₹5,65,000 ratio
  const grossProfit = monthlySales - costOfSales;
  const grossMarginPct = ((grossProfit / monthlySales) * 100).toFixed(1);

  // Forecast calculations
  const currentSalesVal = monthlySales;
  const confirmedOrdersVal = 120000;
  const expectedSalesVal = 200000;
  const forecastRevenueVal = currentSalesVal + confirmedOrdersVal + expectedSalesVal;
  const targetGapOrSurplus = forecastRevenueVal - activeTarget;

  // Returns metrics
  const totalReturnsVal = returnsList.reduce((sum, r) => sum + r.amount, 0);
  const totalRefundsVal = returnsList
    .filter((r) => r.status === "REFUNDED")
    .reduce((sum, r) => sum + r.amount, 0);
  const netSalesVal = monthlySales - totalRefundsVal;

  // Existing Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesPayment = paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
    const matchesSearch =
      o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.company?.toLowerCase().includes(search.toLowerCase());
    return matchesPayment && matchesSearch;
  });

  // Existing Sales Revenue Trend Data
  const salesTrendData = [
    { name: "Week 1", sales: 110000 },
    { name: "Week 2", sales: 145000 },
    { name: "Week 3", sales: 195000 },
    { name: "Week 4", sales: 215000 },
  ];

  // Forecast Comparison Chart Data
  const forecastChartData = [
    { category: "Current Sales", value: currentSalesVal, fill: "#2563EB" },
    { category: "Confirmed Orders", value: confirmedOrdersVal, fill: "#3B82F6" },
    { category: "Expected Pipeline", value: expectedSalesVal, fill: "#60A5FA" },
    { category: "Total Forecast", value: forecastRevenueVal, fill: "#10B981" },
    { category: "Monthly Target", value: activeTarget, fill: "#F59E0B" },
  ];

  // Lifecycle Flow Mock Dataset based on orders & quotations
  const lifecycleData = useMemo(() => {
    const items = [
      {
        id: "LC-101",
        quoteId: "QT-2026-001",
        orderId: "ORD-2026-001",
        invoiceId: "INV-2026-001",
        receiptId: "REC-2026-001",
        customer: "Acme Global Industries",
        amount: 212400,
        stage: "Receipt",
        status: "Paid",
        statusType: "PAID",
      },
      {
        id: "LC-102",
        quoteId: "QT-2026-002",
        orderId: "ORD-2026-002",
        invoiceId: "INV-2026-002",
        receiptId: "REC-2026-002",
        customer: "Tata Consultancy & Logistics",
        amount: 141600,
        stage: "Payment",
        status: "Partially Paid",
        statusType: "PARTIAL",
      },
      {
        id: "LC-103",
        quoteId: "QT-2026-003",
        orderId: "ORD-2026-003",
        invoiceId: "INV-2026-003",
        receiptId: "Pending",
        customer: "Reliance Retail Hub",
        amount: 354000,
        stage: "Invoice",
        status: "Invoiced",
        statusType: "INVOICED",
      },
      {
        id: "LC-104",
        quoteId: "QT-2026-004",
        orderId: "ORD-2026-004",
        invoiceId: "Pending",
        receiptId: "Pending",
        customer: "Infosys Digital Systems",
        amount: 180000,
        stage: "Sales Order",
        status: "Converted",
        statusType: "CONVERTED",
      },
      {
        id: "LC-105",
        quoteId: "QT-2026-005",
        orderId: "Pending",
        invoiceId: "Pending",
        receiptId: "Pending",
        customer: "HDFC FinTech Labs",
        amount: 420000,
        stage: "Quotation",
        status: "Accepted",
        statusType: "ACCEPTED",
      },
      {
        id: "LC-106",
        quoteId: "QT-2026-006",
        orderId: "Pending",
        invoiceId: "Pending",
        receiptId: "Pending",
        customer: "Wipro Cloud Services",
        amount: 160000,
        stage: "Quotation",
        status: "Sent",
        statusType: "SENT",
      },
      {
        id: "LC-107",
        quoteId: "QT-2026-007",
        orderId: "Pending",
        invoiceId: "Pending",
        receiptId: "Pending",
        customer: "Mahindra Logistics Corp",
        amount: 95000,
        stage: "Quotation",
        status: "Draft",
        statusType: "DRAFT",
      },
    ];
    return items;
  }, []);

  // Filtered Reps
  const filteredReps = salesRepsTargets.filter((r) => {
    const matchesTeam = repFilterTeam === "ALL" || r.team === repFilterTeam;
    const matchesSearch = r.name.toLowerCase().includes(repSearch.toLowerCase()) || r.team.toLowerCase().includes(repSearch.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  // Profit Details Mock List
  const profitOrdersList = orders.map((o, idx) => {
    const rev = o.totalAmount || 180000;
    const cost = Math.round(rev * (0.6 + (idx % 3) * 0.05));
    const profit = rev - cost;
    const margin = ((profit / rev) * 100).toFixed(1);
    return {
      id: o.orderCode || `ORD-2026-${idx + 1}`,
      customer: o.customer?.name || "Direct Client",
      company: o.customer?.company || "Enterprise Account",
      revenue: rev,
      cost,
      profit,
      margin,
    };
  });

  const profitProductList = [
    {
      product: "Enterprise ERP Cloud Suite (Annual)",
      category: "Software Subscription",
      revenue: 540000,
      cost: 320000,
      profit: 220000,
      margin: "40.7%",
    },
    {
      product: "Custom Integration Module & API Connectors",
      category: "Professional Services",
      revenue: 280000,
      cost: 165000,
      profit: 115000,
      margin: "41.1%",
    },
    {
      product: "Dedicated Cloud Server Hosting (Managed)",
      category: "Infrastructure",
      revenue: 190000,
      cost: 145000,
      profit: 45000,
      margin: "23.7%",
    },
    {
      product: "24/7 Priority SLA Support Package",
      category: "Support & Maintenance",
      revenue: 120000,
      cost: 45000,
      profit: 75000,
      margin: "62.5%",
    },
  ];

  // Existing Categories & Added Admin Category Sections
  const salesCategories = [
    { key: "ORDERS", label: "Sales Orders", icon: ShoppingBag, count: orders.length, color: "text-blue-500" },
    { key: "CUSTOMERS", label: "Client Accounts", icon: Users, count: customers.length, color: "text-indigo-500" },
    { key: "INVOICES", label: "Invoices & Billing", icon: Receipt, count: invoices.length, color: "text-emerald-500" },
    { key: "PAYMENTS", label: "Payment Receipts", icon: CreditCard, count: payments.length, color: "text-amber-500" },
    { key: "TARGETS", label: "Target & Achievement", icon: Target, count: `${achievementPct}%`, color: "text-rose-500" },
    { key: "PROFITABILITY", label: "Profit & Margins", icon: Percent, count: `${grossMarginPct}%`, color: "text-emerald-600" },
    { key: "FORECAST", label: "Sales Forecast", icon: TrendingUp, count: "₹10.7L", color: "text-blue-600" },
    { key: "LIFECYCLE", label: "Sales Lifecycle Flow", icon: GitCommit, count: "5 Stages", color: "text-purple-600" },
    { key: "RETURNS", label: "Returns & Refunds", icon: RotateCcw, count: returnsList.length, color: "text-orange-500" },
    { key: "REP_PERFORMANCE", label: "Rep Performance", icon: UserCheck, count: salesRepsTargets.length, color: "text-teal-600" },
    { key: "ANALYTICS", label: "Sales Analytics Hub", icon: BarChart3, count: "Live", color: "text-indigo-600" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sales Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs overflow-y-auto max-h-[calc(100vh-4rem)]">
          {/* Sales Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Sales Operations</h2>
                  <p className="text-[10px] text-slate-500 truncate">Admin Ledger & Strategy</p>
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

          {/* Core Ledger Modules */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Ledger Modules
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {salesCategories.slice(0, 4).map((cat) => {
                const isActive = activeView === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveView(cat.key as any)}
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

          {/* Payment Status Filter for Orders View */}
          {activeView === "ORDERS" && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Payment Filter
              </div>
              <div className="space-y-1">
                {[
                  { key: "ALL", label: "All Orders", count: orders.length },
                  { key: "PAID", label: "Paid In Full", count: orders.filter((o) => o.paymentStatus === "PAID").length },
                  { key: "PENDING", label: "Pending Payment", count: orders.filter((o) => o.paymentStatus !== "PAID").length },
                ].map((pf) => (
                  <button
                    key={pf.key}
                    onClick={() => setPaymentFilter(pf.key)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                      paymentFilter === pf.key
                        ? "bg-slate-200/70 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <span>{pf.label}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{pf.count}</span>
                  </button>
                ))}
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

      {/* Main Workspace Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Sales Ledger & Revenue
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise Invoicing, Customer Billing, Subscriptions & Financial Audits
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Sales Order</span>
            </button>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-blue-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Customer</span>
            </button>
            <button
              onClick={() => setShowTargetModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-blue-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Target className="w-3.5 h-3.5 text-rose-500" />
              <span>Set Targets</span>
            </button>
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-blue-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
              <span>Record Return</span>
            </button>
            <button
              onClick={() => alert("Exporting verified sales ledger & analytics report...")}
              className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer shadow-xs"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Existing KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="TODAY'S SALES"
            value={formatCurrency(todaySales)}
            trend="↑ 4.5%"
            comparisonText="daily run-rate"
            isPositive={true}
            icon={TrendingUp}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />

          <KpiCard
            title="MONTHLY SALES"
            value={formatCurrency(monthlySales)}
            trend="↑ 12.8%"
            comparisonText="vs previous month"
            isPositive={true}
            icon={DollarSign}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />

          <KpiCard
            title="TOTAL ORDERS"
            value={orders.length}
            trend="+18"
            comparisonText="closed deals"
            isPositive={true}
            icon={ShoppingBag}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />

          <KpiCard
            title="PENDING PAYMENTS"
            value={formatCurrency(pendingPayments)}
            comparisonText={`${orders.filter((o) => o.paymentStatus !== "PAID").length} invoices due`}
            isPositive={false}
            icon={CreditCard}
            iconColor="text-blue-600 bg-blue-50 border-blue-200"
          />
        </div>

        {/* Existing Sales Trend Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Sales Revenue Trend</h3>
              <p className="text-xs text-slate-500">Monthly billing and realization curve</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              Realized Revenue
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesLedgerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "12px",
                    color: "#0F172A",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#salesLedgerGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* View Switcher Tabs & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {salesCategories.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === tab.key
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded",
                    activeView === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter / Search Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {activeView === "ORDERS" && (
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            )}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Data Display Area */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          {/* =========================================================================
              VIEW 1: EXISTING SALES ORDERS TABLE
          ========================================================================= */}
          {activeView === "ORDERS" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Sales Rep</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{ord.orderCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{ord.customer?.name}</div>
                        <div className="text-[11px] text-slate-500">{ord.customer?.company}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{ord.employee?.user?.name || "Direct"}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={ord.paymentStatus} />
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(ord.saleDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: EXTENDED CUSTOMER ACCOUNTS (With Deep Dive Drawer/Modal)
          ========================================================================= */}
          {activeView === "CUSTOMERS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Click any customer below to view customer-wise detailed metrics (Total Sales, Paid, Pending, Average Order Value).
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-center">Orders Count</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomerDetail(c)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-2">
                          <span>{c.name}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                        </td>
                        <td className="py-3 px-4 text-slate-700">{c.company || "-"}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{c.phone}</td>
                        <td className="py-3 px-4 text-slate-500">{c.email || "-"}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                          {c.orders?.length || 1}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerDetail(c);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            View Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: EXISTING INVOICES LEDGER
          ========================================================================= */}
          {activeView === "INVOICES" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-900">{inv.order?.customer?.name || "Client"}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(inv.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: EXISTING PAYMENTS LEDGER
          ========================================================================= */}
          {activeView === "PAYMENTS" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-center">Method</th>
                    <th className="py-3 px-4 text-right">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.receiptNumber}</td>
                      <td className="py-3 px-4 text-slate-900">{p.order?.customer?.name || "Customer"}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(p.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================================================
              NEW FEATURE 1: SALES TARGET & ACHIEVEMENT
          ========================================================================= */}
          {activeView === "TARGETS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-500" />
                    Sales Target & Achievement Monitoring
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set, update, and track enterprise quotas, teams, and sales representatives.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setTargetPeriod("MONTHLY")}
                      className={cn(
                        "px-3 py-1 rounded-lg font-bold transition-all",
                        targetPeriod === "MONTHLY" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setTargetPeriod("YEARLY")}
                      className={cn(
                        "px-3 py-1 rounded-lg font-bold transition-all",
                        targetPeriod === "YEARLY" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                      )}
                    >
                      Yearly
                    </button>
                  </div>
                  <button
                    onClick={() => setShowTargetModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage Target</span>
                  </button>
                </div>
              </div>

              {/* Target Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {targetPeriod} TARGET
                  </span>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {formatCurrency(activeTarget)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Enterprise Baseline Quota</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    ACTUAL SALES
                  </span>
                  <div className="text-xl font-bold text-emerald-600 font-mono mt-1">
                    {formatCurrency(actualTargetSales)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    Realized Revenue
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    ACHIEVEMENT %
                  </span>
                  <div className="text-xl font-bold text-blue-600 font-mono mt-1">
                    {achievementPct}%
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(achievementPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    REMAINING TARGET
                  </span>
                  <div className="text-xl font-bold text-amber-600 font-mono mt-1">
                    {formatCurrency(remainingTarget)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Needed to hit 100% quota</span>
                </div>
              </div>

              {/* Sales Representative Target Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Sales Representative Performance Against Target
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Sales Rep</th>
                        <th className="py-3 px-4">Team / Dept</th>
                        <th className="py-3 px-4 text-right">Target</th>
                        <th className="py-3 px-4 text-right">Actual Sales</th>
                        <th className="py-3 px-4 text-center">Achievement %</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesRepsTargets.map((rep) => {
                        const pct = Math.round((rep.actualSales / rep.monthlyTarget) * 100);
                        return (
                          <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">{rep.name}</td>
                            <td className="py-3 px-4 text-slate-600">{rep.team}</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                              {formatCurrency(rep.monthlyTarget)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                              {formatCurrency(rep.actualSales)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={cn(
                                  "font-bold font-mono px-2 py-0.5 rounded text-[11px] border",
                                  pct >= 100
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : pct >= 75
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                                {pct}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setTargetForm({
                                    repId: rep.id,
                                    period: "MONTHLY",
                                    targetAmount: rep.monthlyTarget,
                                    team: rep.team,
                                  });
                                  setShowTargetModal(true);
                                }}
                                className="px-2 py-1 text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md font-semibold transition-colors"
                              >
                                Edit Target
                              </button>
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

          {/* =========================================================================
              NEW FEATURE 2: PROFIT & MARGIN ANALYSIS
          ========================================================================= */}
          {activeView === "PROFITABILITY" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    Profit & Margin Intelligence
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gross margin and cost breakdown across orders, customer accounts, and software products.
                  </p>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setProfitBreakdownType("ORDER")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold transition-all",
                      profitBreakdownType === "ORDER" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                    )}
                  >
                    By Order
                  </button>
                  <button
                    onClick={() => setProfitBreakdownType("CUSTOMER")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold transition-all",
                      profitBreakdownType === "CUSTOMER" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                    )}
                  >
                    By Customer
                  </button>
                  <button
                    onClick={() => setProfitBreakdownType("PRODUCT")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold transition-all",
                      profitBreakdownType === "PRODUCT" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                    )}
                  >
                    By Product/Service
                  </button>
                </div>
              </div>

              {/* Profitability KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    TOTAL REVENUE
                  </span>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {formatCurrency(monthlySales)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Invoiced Billing Total</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    COST OF SALES
                  </span>
                  <div className="text-xl font-bold text-rose-600 font-mono mt-1">
                    {formatCurrency(costOfSales)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">COGS, Infra & Direct Costs</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    GROSS PROFIT
                  </span>
                  <div className="text-xl font-bold text-emerald-600 font-mono mt-1">
                    {formatCurrency(grossProfit)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    Net Contribution
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    GROSS MARGIN %
                  </span>
                  <div className="text-xl font-bold text-blue-600 font-mono mt-1">
                    {grossMarginPct}%
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Average margin yield</span>
                </div>
              </div>

              {/* Profit Table by Selection */}
              {profitBreakdownType === "ORDER" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Order Code</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4 text-right">Revenue</th>
                        <th className="py-3 px-4 text-right">Cost</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profitOrdersList.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">{po.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{po.customer}</div>
                            <div className="text-[11px] text-slate-500">{po.company}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(po.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600">
                            {formatCurrency(po.cost)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(po.profit)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {po.margin}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {profitBreakdownType === "CUSTOMER" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Customer Account</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4 text-right">Total Revenue</th>
                        <th className="py-3 px-4 text-right">Estimated Cost</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((c, i) => {
                        const rev = 180000 * ((i % 3) + 1);
                        const cost = Math.round(rev * 0.65);
                        const profit = rev - cost;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                            <td className="py-3 px-4 text-slate-600">{c.company || "-"}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(rev)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-rose-600">
                              {formatCurrency(cost)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                              {formatCurrency(profit)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                35.0%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {profitBreakdownType === "PRODUCT" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Product / Service</th>
                        <th className="py-3 px-4">Product Category</th>
                        <th className="py-3 px-4 text-right">Revenue</th>
                        <th className="py-3 px-4 text-right">Cost</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-center">Gross Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profitProductList.map((pr, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">{pr.product}</td>
                          <td className="py-3 px-4 text-slate-600">{pr.category}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(pr.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600">
                            {formatCurrency(pr.cost)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(pr.profit)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {pr.margin}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              NEW FEATURE 3: SALES FORECAST
          ========================================================================= */}
          {activeView === "FORECAST" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Sales Forecast & Opportunity Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Predictive revenue modeling comparing realized sales, committed contracts, expected pipeline & quota.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200">
                  Target Surplus: +{formatCurrency(Math.max(targetGapOrSurplus, 0))}
                </div>
              </div>

              {/* Forecast Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    CURRENT SALES
                  </span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1">
                    {formatCurrency(currentSalesVal)}
                  </div>
                  <span className="text-[10px] text-slate-500">Closed & Invoiced</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    CONFIRMED ORDERS
                  </span>
                  <div className="text-base font-bold text-blue-600 font-mono mt-1">
                    {formatCurrency(confirmedOrdersVal)}
                  </div>
                  <span className="text-[10px] text-blue-600">Pending Billing</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    EXPECTED SALES
                  </span>
                  <div className="text-base font-bold text-indigo-600 font-mono mt-1">
                    {formatCurrency(expectedSalesVal)}
                  </div>
                  <span className="text-[10px] text-slate-500">Hot Pipeline Deals</span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider block">
                    FORECAST REVENUE
                  </span>
                  <div className="text-base font-bold text-blue-700 font-mono mt-1">
                    {formatCurrency(forecastRevenueVal)}
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">107% of Target</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    SALES TARGET
                  </span>
                  <div className="text-base font-bold text-slate-800 font-mono mt-1">
                    {formatCurrency(activeTarget)}
                  </div>
                  <span className="text-[10px] text-slate-500">Admin Quota</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    TARGET SURPLUS
                  </span>
                  <div className="text-base font-bold text-emerald-700 font-mono mt-1">
                    +{formatCurrency(targetGapOrSurplus)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Positive Delta</span>
                </div>
              </div>

              {/* Clean Chart: Actual Sales vs Forecast vs Target */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Actual Sales vs Forecast vs Target Comparison
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastChartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v / 100000}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E8F0",
                          borderRadius: "12px",
                          color: "#0F172A",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val)), "Amount"]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              NEW FEATURE 4: QUOTATION → ORDER → INVOICE → PAYMENT FLOW (LIFECYCLE)
          ========================================================================= */}
          {activeView === "LIFECYCLE" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-purple-600" />
                    Sales Lifecycle Tracking Flow
                  </h3>
                  <p className="text-xs text-slate-500">
                    End-to-end pipeline visibility: Quotation → Sales Order → Invoice → Payment → Receipt.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={lifecycleFilter}
                    onChange={(e) => setLifecycleFilter(e.target.value)}
                    className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Lifecycle Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="INVOICED">Invoiced</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              {/* Visual Flow Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 font-mono">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Quotation</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Sales Order</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Invoice</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Payment</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Receipt</span>
                  </div>
                </div>
              </div>

              {/* Lifecycle Tracking Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Quotation</th>
                      <th className="py-3 px-4">Sales Order</th>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Current Stage</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lifecycleData
                      .filter((item) => lifecycleFilter === "ALL" || item.statusType === lifecycleFilter)
                      .map((lc) => (
                        <tr key={lc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">{lc.customer}</td>
                          <td className="py-3 px-4 font-mono text-blue-600 font-bold">{lc.quoteId}</td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {lc.orderId !== "Pending" ? (
                              <span className="font-bold text-slate-900">{lc.orderId}</span>
                            ) : (
                              <span className="text-slate-400 italic">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {lc.invoiceId !== "Pending" ? (
                              <span className="font-bold text-slate-900">{lc.invoiceId}</span>
                            ) : (
                              <span className="text-slate-400 italic">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {lc.receiptId !== "Pending" ? (
                              <span className="font-bold text-emerald-600">{lc.receiptId}</span>
                            ) : (
                              <span className="text-slate-400 italic">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatCurrency(lc.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                              {lc.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={lc.statusType} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              NEW FEATURE 5: SALES RETURNS / REFUNDS / CREDIT NOTES
          ========================================================================= */}
          {activeView === "RETURNS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-orange-500" />
                    Sales Returns, Refunds & Credit Notes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track return merchandise requests, credit notes issuance, and net sales reconciliation.
                  </p>
                </div>
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Return Request</span>
                </button>
              </div>

              {/* Returns Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    TOTAL GROSS SALES
                  </span>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {formatCurrency(monthlySales)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Pre-return revenue</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    TOTAL RETURNS
                  </span>
                  <div className="text-xl font-bold text-orange-600 font-mono mt-1">
                    {formatCurrency(totalReturnsVal)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">{returnsList.length} items filed</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    REFUNDS PROCESSED
                  </span>
                  <div className="text-xl font-bold text-rose-600 font-mono mt-1">
                    {formatCurrency(totalRefundsVal)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Adjusted via Credit Notes</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                    NET SALES
                  </span>
                  <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
                    {formatCurrency(netSalesVal)}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                    Actual Realized Net
                  </span>
                </div>
              </div>

              {/* Returns Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Return ID</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Product / Service</th>
                      <th className="py-3 px-4">Return Reason</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Credit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnsList.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{ret.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{ret.orderId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{ret.customer}</td>
                        <td className="py-3 px-4 text-slate-700">{ret.product}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={ret.reason}>
                          {ret.reason}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(ret.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={ret.status} />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 font-bold">{ret.creditNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              NEW FEATURE 7: SALES REPRESENTATIVE PERFORMANCE
          ========================================================================= */}
          {activeView === "REP_PERFORMANCE" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    Sales Representative Performance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quota attainment, deals closed, average ticket size, and pending collections by sales agent.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={repFilterTeam}
                    onChange={(e) => setRepFilterTeam(e.target.value)}
                    className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Teams</option>
                    <option value="Enterprise Sales">Enterprise Sales</option>
                    <option value="Commercial Team">Commercial Team</option>
                    <option value="Strategic Accounts">Strategic Accounts</option>
                    <option value="Direct & SMB">Direct & SMB</option>
                  </select>
                  <div className="relative w-40">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search Rep..."
                      value={repSearch}
                      onChange={(e) => setRepSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rep Performance Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-3 px-4">Sales Representative</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4 text-center">Total Orders</th>
                      <th className="py-3 px-4 text-right">Total Sales</th>
                      <th className="py-3 px-4 text-right">Target</th>
                      <th className="py-3 px-4 text-center">Achievement %</th>
                      <th className="py-3 px-4 text-right">Avg Order Value</th>
                      <th className="py-3 px-4 text-right">Pending Payments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReps.map((rep) => {
                      const achievement = Math.round((rep.actualSales / rep.monthlyTarget) * 100);
                      const aov = Math.round(rep.actualSales / (rep.ordersCount || 1));
                      return (
                        <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{rep.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {rep.id}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{rep.team}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                            {rep.ordersCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(rep.actualSales)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(rep.monthlyTarget)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "font-bold font-mono px-2 py-0.5 rounded text-[11px] border",
                                achievement >= 100
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : achievement >= 75
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {achievement}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                            {formatCurrency(aov)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600 font-bold">
                            {formatCurrency(rep.pendingPayments)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              NEW FEATURE 8: SALES ANALYTICS HUB (With Date Range Filters)
          ========================================================================= */}
          {activeView === "ANALYTICS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Admin Sales Analytics Command Center
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive cross-sectional insights across revenue, margins, forecasts, and collections.
                  </p>
                </div>

                {/* Date Filters Required: Today, This Week, This Month, This Quarter, This Year, Custom */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {[
                    { id: "TODAY", label: "Today" },
                    { id: "THIS_WEEK", label: "This Week" },
                    { id: "THIS_MONTH", label: "This Month" },
                    { id: "THIS_QUARTER", label: "This Quarter" },
                    { id: "THIS_YEAR", label: "This Year" },
                    { id: "CUSTOM", label: "Custom Range" },
                  ].map((df) => (
                    <button
                      key={df.id}
                      onClick={() => setAnalyticsDateRange(df.id as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                        analyticsDateRange === df.id
                          ? "bg-white text-blue-600 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {df.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8-Dimension Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>1. Revenue Analysis</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {formatCurrency(monthlySales)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ↑ 14.2% YoY growth rate
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>2. Profit & Margin</span>
                    <Percent className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 mt-2">
                    {grossMarginPct}% Margin
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Gross Profit: {formatCurrency(grossProfit)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>3. Target vs Actual</span>
                    <Target className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-blue-600 mt-2">
                    {achievementPct}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Gap: {formatCurrency(remainingTarget)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>4. Sales Forecast</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-600 mt-2">
                    {formatCurrency(forecastRevenueVal)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Surplus: +{formatCurrency(targetGapOrSurplus)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>5. Customer Sales</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {customers.length} Accounts
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Avg Revenue: {formatCurrency(Math.round(monthlySales / (customers.length || 1)))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>6. Rep Performance</span>
                    <UserCheck className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-teal-700 mt-2">
                    4 Active Reps
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Top Producer: Priya S. (112%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>7. Orders Analysis</span>
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {orders.length} Closed Deals
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Avg Deal Size: {formatCurrency(Math.round(monthlySales / (orders.length || 1)))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>8. Payment Realization</span>
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-600 mt-2">
                    {formatCurrency(pendingPayments)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {orders.filter((o) => o.paymentStatus !== "PAID").length} Pending Invoices
                  </div>
                </div>
              </div>

              {/* Multi-Dimensional Analytics Chart */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Revenue vs Cost vs Target Performance Curves
                    </h4>
                    <p className="text-xs text-slate-500">
                      Cross-metric time-series breakdown for {analyticsDateRange.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    Live Enterprise Model
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={[
                        { period: "W1", revenue: 110000, cost: 70000, target: 120000 },
                        { period: "W2", revenue: 145000, cost: 95000, target: 125000 },
                        { period: "W3", revenue: 195000, cost: 130000, target: 130000 },
                        { period: "W4", revenue: 215000, cost: 145000, target: 140000 },
                        { period: "Projected", revenue: 285000, cost: 180000, target: 200000 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E8F0",
                          borderRadius: "12px",
                          color: "#0F172A",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        iconType="circle"
                      />
                      <Bar dataKey="revenue" name="Realized Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Cost of Sales" fill="#F87171" radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Benchmark Target"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            MODAL 1: CREATE SALES ORDER MODAL (Existing)
        ========================================================================= */}
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Create Sales Order</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Customer Account *</label>
                  <select
                    value={orderForm.customerId}
                    onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || "Direct"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Product / Service Package</label>
                  <input
                    type="text"
                    required
                    value={orderForm.itemTitle}
                    onChange={(e) => setOrderForm({ ...orderForm, itemTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      value={orderForm.unitPrice}
                      onChange={(e) => setOrderForm({ ...orderForm, unitPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Payment Status</label>
                    <select
                      value={orderForm.paymentStatus}
                      onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PENDING">PENDING</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20"
                  >
                    {loading ? "Generating..." : "Generate Order & Invoice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: ADD CUSTOMER MODAL (Existing)
        ========================================================================= */}
        {showCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Add Customer Account</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={custForm.name}
                    onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={custForm.company}
                      onChange={(e) => setCustForm({ ...custForm, company: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={custForm.phone}
                      onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20"
                  >
                    {loading ? "Saving..." : "Save Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: SET / UPDATE SALES TARGET (New Admin Action)
        ========================================================================= */}
        {showTargetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900">Manage Sales Target</h3>
                </div>
                <button
                  onClick={() => setShowTargetModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTarget} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Target Period *</label>
                  <select
                    value={targetForm.period}
                    onChange={(e) => setTargetForm({ ...targetForm, period: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="MONTHLY">Monthly Target Period</option>
                    <option value="YEARLY">Yearly Target Period</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Sales Representative / Team *</label>
                  <select
                    value={targetForm.repId}
                    onChange={(e) => setTargetForm({ ...targetForm, repId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Overall Company Target (All Teams)</option>
                    {salesRepsTargets.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.team})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={targetForm.targetAmount}
                    onChange={(e) => setTargetForm({ ...targetForm, targetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTargetModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Save Target Quota
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: RECORD SALES RETURN / CREDIT NOTE (New Admin Action)
        ========================================================================= */}
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-500" />
                  <h3 className="text-base font-bold text-slate-900">Record Sales Return</h3>
                </div>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReturn} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Customer / Client Account</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Global Industries"
                    value={returnForm.customer}
                    onChange={(e) => setReturnForm({ ...returnForm, customer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Order ID</label>
                    <input
                      type="text"
                      placeholder="ORD-2026-001"
                      value={returnForm.orderId}
                      onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Return Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={returnForm.amount}
                      onChange={(e) => setReturnForm({ ...returnForm, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Product / Service</label>
                  <input
                    type="text"
                    required
                    value={returnForm.product}
                    onChange={(e) => setReturnForm({ ...returnForm, product: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Return Reason</label>
                  <textarea
                    rows={2}
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Status</label>
                  <select
                    value={returnForm.status}
                    onChange={(e) => setReturnForm({ ...returnForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="REQUESTED">Requested</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REFUNDED">Refunded (Issue Credit Note)</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Submit Return Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 5: CUSTOMER-WISE SALES ANALYSIS MODAL (New Feature 6)
        ========================================================================= */}
        {selectedCustomerDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedCustomerDetail.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Company: {selectedCustomerDetail.company || "Direct Individual Account"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Extended Customer Metric Cards (Total Orders, Total Sales, Paid, Pending, Last Order, AOV) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    TOTAL ORDERS
                  </span>
                  <div className="text-lg font-bold text-blue-600 font-mono mt-1">
                    {selectedCustomerDetail.orders?.length ? selectedCustomerDetail.orders.length * 5 : 25}
                  </div>
                  <span className="text-[10px] text-slate-500">Lifetime Transactions</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    TOTAL SALES
                  </span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {formatCurrency(850000)}
                  </div>
                  <span className="text-[10px] text-slate-500">Gross Account Value</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    PAID AMOUNT
                  </span>
                  <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
                    {formatCurrency(700000)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">82.3% Realized</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">
                    PENDING AMOUNT
                  </span>
                  <div className="text-lg font-bold text-amber-700 font-mono mt-1">
                    {formatCurrency(150000)}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">Invoice Due</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    LAST ORDER DATE
                  </span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1">
                    02 Oct 2026
                  </div>
                  <span className="text-[10px] text-slate-500">Recent Purchase</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    AVG ORDER VALUE
                  </span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1">
                    {formatCurrency(34000)}
                  </div>
                  <span className="text-[10px] text-slate-500">Per transaction</span>
                </div>
              </div>

              {/* Customer Orders Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Account Orders & Invoices History
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order Code</th>
                        <th className="py-2.5 px-3">Package</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">ORD-2026-081</td>
                        <td className="py-2 px-3 text-slate-700">Enterprise Cloud Suite (Annual)</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">₹1,80,000</td>
                        <td className="py-2 px-3 text-center"><StatusBadge status="PAID" /></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">ORD-2026-074</td>
                        <td className="py-2 px-3 text-slate-700">Custom Integration Module & API</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">₹1,50,000</td>
                        <td className="py-2 px-3 text-center"><StatusBadge status="PENDING" /></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">ORD-2026-042</td>
                        <td className="py-2 px-3 text-slate-700">24/7 Priority SLA Support</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">₹5,20,000</td>
                        <td className="py-2 px-3 text-center"><StatusBadge status="PAID" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
