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
} from "recharts";

interface SalesClientProps {
  initialData: any;
}

export function SalesClient({ initialData }: SalesClientProps) {
  const [activeView, setActiveView] = useState<"ORDERS" | "CUSTOMERS" | "INVOICES" | "PAYMENTS">("ORDERS");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [orders, setOrders] = useState<any[]>(initialData.orders || []);
  const [customers, setCustomers] = useState<any[]>(initialData.customers || []);
  const [invoices, setInvoices] = useState<any[]>(initialData.invoices || []);
  const [payments, setPayments] = useState<any[]>(initialData.payments || []);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

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

  const filteredOrders = orders.filter((o) => {
    const matchesPayment = paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
    const matchesSearch =
      o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.company?.toLowerCase().includes(search.toLowerCase());
    return matchesPayment && matchesSearch;
  });

  const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingPayments = orders.filter((o) => o.paymentStatus !== "PAID").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todaySales = 45000;
  const monthlySales = totalRev || 565000;

  const salesTrendData = [
    { name: "Week 1", sales: 110000 },
    { name: "Week 2", sales: 145000 },
    { name: "Week 3", sales: 195000 },
    { name: "Week 4", sales: 215000 },
  ];

  const salesCategories = [
    { key: "ORDERS", label: "Sales Orders", icon: ShoppingBag, count: orders.length, color: "text-blue-500" },
    { key: "CUSTOMERS", label: "Client Accounts", icon: Users, count: customers.length, color: "text-indigo-500" },
    { key: "INVOICES", label: "Invoices & Billing", icon: Receipt, count: invoices.length, color: "text-emerald-500" },
    { key: "PAYMENTS", label: "Payment Receipts", icon: CreditCard, count: payments.length, color: "text-amber-500" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sales Operations Sidebar */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          {/* Sales Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">Sales Operations</h2>
                  <p className="text-[10px] text-slate-500 truncate">Ledger & Billing Suite</p>
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

          {/* Sidebar Views */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Ledger Modules
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

          {/* Payment Status Filter */}
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

          <div className="flex items-center gap-2.5">
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
              onClick={() => alert("Exporting verified sales ledger report...")}
              className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer shadow-xs"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* KPI Cards */}
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

      {/* Sales Trend Chart */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "ORDERS", label: "Orders & Deals", count: orders.length },
            { id: "CUSTOMERS", label: "Customer Accounts", count: customers.length },
            { id: "INVOICES", label: "Invoices Ledger", count: invoices.length },
            { id: "PAYMENTS", label: "Payments", count: payments.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeView === tab.id
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filter / Search */}
        <div className="flex items-center gap-2">
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

      {/* Dynamic Data Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
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

        {activeView === "CUSTOMERS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Orders Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-700">{c.company || "-"}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{c.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{c.email || "-"}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">{c.orders?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
      </div>

      {/* Create Order Modal */}
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

      {/* Create Customer Modal */}
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
      </div>
    </div>
  );
}
