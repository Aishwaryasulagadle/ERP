"use client";

import { useState } from "react";
import {
  Target,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronDown,
  PhoneCall,
  Edit,
  X,
  UserCheck,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Filter,
  Layers,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createLead, updateLeadStatus, convertLeadToCustomerAndOrder, requestLeadConversionApproval } from "@/actions/crm";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface CRMClientProps {
  initialLeads: any[];
  employees: any[];
  user?: any;
  userRole?: string;
}

export function CRMClient({ initialLeads, employees, user, userRole = "EMPLOYEE" }: CRMClientProps) {
  const [leads, setLeads] = useState<any[]>(initialLeads);
  const [activeStageFilter, setActiveStageFilter] = useState<string>("ALL");
  const [leadScopeFilter, setLeadScopeFilter] = useState<"ALL" | "MINE">("ALL");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentEmpId = (user as any)?.employeeId;
  const isManager = userRole === "MANAGER";
  const isAdmin = userRole === "ADMIN";
  const isEmployee = userRole === "EMPLOYEE";

  // Form states
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    company: "",
    location: "",
    source: "WEBSITE",
    productInterest: "Enterprise ERP Cloud Suite (Annual)",
    expectedValue: 180000,
    assignedToId: currentEmpId || employees[0]?.id || "",
    priority: "HIGH",
    notes: "",
    followUpDate: "",
  });

  const [convertData, setConvertData] = useState({
    totalAmount: 180000,
    itemTitle: "Digital Marketing Retainer",
    departmentType: "DIGITAL_MARKETING" as "DIGITAL_MARKETING" | "TECHNICAL",
    billingType: "MONTHLY" as "MONTHLY" | "ONE_TIME",
    serviceDetails: "",
  });

  const [loading, setLoading] = useState(false);

  const stages = ["NEW", "CONTACTED", "FOLLOW_UP", "QUALIFIED", "PENDING_APPROVAL", "CONVERTED", "LOST"];

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newLead = await createLead(formData);
      setLeads([newLead, ...leads]);
      setShowCreateModal(false);
      setFormData({
        customerName: "",
        phone: "",
        email: "",
        company: "",
        location: "",
        source: "WEBSITE",
        productInterest: "Enterprise ERP Cloud Suite (Annual)",
        expectedValue: 180000,
        assignedToId: employees[0]?.id || "",
        priority: "HIGH",
        notes: "",
        followUpDate: "",
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      await updateLeadStatus(leadId, status);
      setLeads(leads.map((l) => (l.id === leadId ? { ...l, status } : l)));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;
    setLoading(true);
    try {
      if (isEmployee) {
        await requestLeadConversionApproval(selectedLead.id, convertData);
        setLeads(leads.map((l) => (l.id === selectedLead.id ? { ...l, status: "PENDING_APPROVAL", expectedValue: convertData.totalAmount } : l)));
        setSelectedLead({ ...selectedLead, status: "PENDING_APPROVAL", expectedValue: convertData.totalAmount });
        setShowConvertModal(false);
        alert(`✓ Conversion request for ${selectedLead.customerName} submitted to Sales Manager for final approval!`);
      } else {
        await convertLeadToCustomerAndOrder(selectedLead.id, convertData);
        setLeads(leads.map((l) => (l.id === selectedLead.id ? { ...l, status: "CONVERTED" } : l)));
        setSelectedLead({ ...selectedLead, status: "CONVERTED" });
        setShowConvertModal(false);
        alert(`✓ Lead ${selectedLead.leadCode} successfully approved and converted into Client Account and Sales Order!`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      handleStatusChange(leadId, targetStage);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStage = activeStageFilter === "ALL" || lead.status === activeStageFilter;
    const matchesScope =
      leadScopeFilter === "ALL" ||
      (leadScopeFilter === "MINE" && (lead.assignedToId === currentEmpId || (lead.assignedTo?.userId === user?.id)));
    const matchesSearch =
      lead.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.leadCode?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search);
    return matchesStage && matchesScope && matchesSearch;
  });

  const totalLeads = leads.length;
  const newCount = leads.filter((l) => l.status === "NEW").length;
  const contactedCount = leads.filter((l) => l.status === "CONTACTED").length;
  const followUpCount = leads.filter((l) => l.status === "FOLLOW_UP").length;
  const qualifiedCount = leads.filter((l) => l.status === "QUALIFIED").length;
  const pendingApprovalCount = leads.filter((l) => l.status === "PENDING_APPROVAL").length;
  const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;
  const lostCount = leads.filter((l) => l.status === "LOST").length;

  const crmCategories = [
    { key: "ALL", label: "All Pipeline Leads", icon: Layers, count: totalLeads, color: "text-blue-400" },
    { key: "NEW", label: "New Leads", icon: Sparkles, count: newCount, color: "text-amber-400" },
    { key: "CONTACTED", label: "Contacted Leads", icon: PhoneCall, count: contactedCount, color: "text-indigo-400" },
    { key: "FOLLOW_UP", label: "Follow-up Queue", icon: Clock, count: followUpCount, color: "text-purple-400" },
    { key: "QUALIFIED", label: "Qualified Deals", icon: Target, count: qualifiedCount, color: "text-cyan-400" },
    { key: "PENDING_APPROVAL", label: "Pending Approval", icon: ShieldCheck, count: pendingApprovalCount, color: "text-amber-500" },
    { key: "CONVERTED", label: "Converted Accounts", icon: CheckCircle2, count: convertedCount, color: "text-emerald-400" },
    { key: "LOST", label: "Lost / Closed", icon: XCircle, count: lostCount, color: "text-rose-400" },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* CRM Operations Sidebar (Only shown when user clicks into CRM) */}
      {isSidebarOpen ? (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 p-3 space-y-3 transition-all select-none shadow-xs">
          {/* CRM Module Title Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-slate-900 truncate">CRM Operations</h2>
                  <p className="text-[10px] text-slate-500 truncate">Pipeline & Deal Funnel</p>
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

          {/* Sidebar Category Filters */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Pipeline Stages
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {crmCategories.map((cat) => {
                const isActive = activeStageFilter === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveStageFilter(cat.key)}
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

      {/* Main CRM Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50">
        <div className="w-full space-y-6">
          {!isSidebarOpen && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 mb-2 shadow-xs">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                <span>Show CRM Sidebar</span>
              </button>
              <span className="text-xs text-slate-500">
                Active Filter: <span className="text-slate-900 font-bold">{activeStageFilter}</span>
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                CRM / Leads
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Omnichannel Pipeline, Deal Conversion & Follow-up Tracking
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(isManager || isAdmin) && (
                <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setLeadScopeFilter("ALL")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      leadScopeFilter === "ALL"
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Department Leads ({leads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadScopeFilter("MINE")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      leadScopeFilter === "MINE"
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    My Leads ({leads.filter((l) => l.assignedToId === currentEmpId || l.assignedTo?.userId === user?.id).length})
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* CRM Stats Summary Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setActiveStageFilter("ALL")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "ALL"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Total Leads</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{totalLeads}</p>
            </div>

            <div
              onClick={() => setActiveStageFilter("NEW")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "NEW"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">New Leads</span>
              <p className="text-xl font-bold font-mono text-blue-600 mt-1">{newCount}</p>
            </div>

            <div
              onClick={() => setActiveStageFilter("FOLLOW_UP")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "FOLLOW_UP"
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-amber-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Follow-ups</span>
              <p className="text-xl font-bold font-mono text-amber-600 mt-1">{followUpCount}</p>
            </div>

            <div
              onClick={() => setActiveStageFilter("QUALIFIED")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "QUALIFIED"
                  ? "bg-cyan-50 border-cyan-400 text-cyan-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-cyan-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Qualified</span>
              <p className="text-xl font-bold font-mono text-cyan-600 mt-1">{qualifiedCount}</p>
            </div>

            <div
              onClick={() => setActiveStageFilter("CONVERTED")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "CONVERTED"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Converted</span>
              <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{convertedCount}</p>
            </div>

            <div
              onClick={() => setActiveStageFilter("LOST")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "LOST"
                  ? "bg-rose-50 border-rose-400 text-rose-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-rose-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Lost / Closed</span>
              <p className="text-xl font-bold font-mono text-rose-600 mt-1">{lostCount}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search leads by name, company, phone, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            {activeStageFilter !== "ALL" && (
              <button
                onClick={() => setActiveStageFilter("ALL")}
                className="text-xs text-blue-600 hover:underline px-2 font-medium"
              >
                Clear Filter ({activeStageFilter})
              </button>
            )}
          </div>

          {/* CRM Kanban / Pipeline Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 min-h-[500px]">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const stageTotal = stageLeads.reduce((sum, l) => sum + (l.expectedValue || 0), 0);

              return (
                <div
                  key={stage}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                  className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  {/* Column Header */}
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 font-mono">{stage}</span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatCurrency(stageTotal)}</p>
                    </div>
                    <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold flex items-center justify-center text-slate-700">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Lead Cards in Stage */}
                  <div className="flex-1 space-y-2.5 py-3 overflow-y-auto max-h-[600px] scrollbar-thin">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white transition-all cursor-pointer shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-semibold text-xs text-slate-900 truncate">{lead.customerName}</div>
                          <StatusBadge status={lead.priority} size="sm" />
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">{lead.company || lead.phone}</p>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                          <span className="font-mono font-bold text-emerald-600">
                            {formatCurrency(lead.expectedValue || 0)}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {lead.assignedTo?.user?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Drop leads here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lead Details Right Drawer */}
          {selectedLead && !showConvertModal && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                        {selectedLead.customerName?.charAt(0) || "L"}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{selectedLead.customerName}</h3>
                        <p className="text-xs text-blue-600 font-mono">{selectedLead.leadCode}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status & Expected Value */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Expected Value</span>
                      <p className="text-base font-bold text-emerald-600 mt-1 font-mono">
                        {formatCurrency(selectedLead.expectedValue)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Stage Status</span>
                      <div className="mt-1">
                        <StatusBadge status={selectedLead.status} />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Company:</span>
                      <span className="text-slate-900 font-medium">{selectedLead.company || "Direct Individual"}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-slate-900 font-mono">{selectedLead.phone}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-900">{selectedLead.email || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Assigned Rep:</span>
                      <span className="text-slate-900 font-medium">
                        {selectedLead.assignedTo?.user?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-slate-500">Source:</span>
                      <span className="font-mono text-blue-600">{selectedLead.source}</span>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Activity Timeline</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-700">Lead Acquired / Registered</span>
                        <span className="text-[10px] text-slate-500 font-mono">10:00 AM</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-700">Initial Discovery Call Completed</span>
                        <span className="text-[10px] text-slate-500 font-mono">11:30 AM</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-700">Quotation Proposal Dispatched</span>
                        <span className="text-[10px] text-slate-500 font-mono">02:15 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Action Footer */}
                <div className="pt-6 border-t border-slate-100 flex flex-col gap-2">
                  {selectedLead.status === "PENDING_APPROVAL" ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Client Conversion Pending Approval</span>
                      </div>
                      <p className="text-[11px] text-amber-700">
                        {isEmployee
                          ? "You submitted this lead for Manager Approval. The Sales Manager will review and convert it into an active client."
                          : `Sales rep ${selectedLead.assignedTo?.user?.name || "Employee"} requested client conversion. Review package details and approve below.`}
                      </p>
                      {!isEmployee && (
                        <button
                          onClick={() => {
                            setConvertData({
                              totalAmount: selectedLead.expectedValue || 180000,
                              itemTitle: selectedLead.productInterest || "Client Retainer Contract",
                              departmentType: (selectedLead.departmentType as any) || "DIGITAL_MARKETING",
                              billingType: (selectedLead.billingType as any) || "MONTHLY",
                              serviceDetails: selectedLead.notes || "",
                            });
                            setShowConvertModal(true);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Convert to Active Client</span>
                        </button>
                      )}
                    </div>
                  ) : selectedLead.status !== "CONVERTED" && (
                    <button
                      onClick={() => {
                        setConvertData({
                          totalAmount: selectedLead.expectedValue || 180000,
                          itemTitle: selectedLead.productInterest || "Client Retainer Contract",
                          departmentType: (selectedLead.departmentType as any) || "DIGITAL_MARKETING",
                          billingType: (selectedLead.billingType as any) || "MONTHLY",
                          serviceDetails: selectedLead.notes || "",
                        });
                        setShowConvertModal(true);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isEmployee ? "Submit for Client Conversion (Manager Approval)" : "Convert to Active Client & Order"}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {stages.map((st) => (
                        <option key={st} value={st}>
                          Set Status: {st}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Convert Deal Modal */}
          {showConvertModal && selectedLead && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  {isEmployee ? "Submit Lead for Client Conversion Approval" : "Convert Lead to Active Client & Order"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEmployee
                    ? "Set the proposed package and retainer. Once submitted, your Sales Manager will give final approval."
                    : "Instantly create active client account, assign deliverables, and create sales ledger order."}
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Service Department</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConvertData({ ...convertData, departmentType: "DIGITAL_MARKETING" })}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer",
                          convertData.departmentType === "DIGITAL_MARKETING"
                            ? "bg-purple-50 border-purple-500 text-purple-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        Digital Marketing
                      </button>
                      <button
                        type="button"
                        onClick={() => setConvertData({ ...convertData, departmentType: "TECHNICAL" })}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer",
                          convertData.departmentType === "TECHNICAL"
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        Technical / Dev
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Billing Frequency</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConvertData({ ...convertData, billingType: "MONTHLY" })}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer",
                          convertData.billingType === "MONTHLY"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        Monthly Retainer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConvertData({ ...convertData, billingType: "ONE_TIME" })}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer",
                          convertData.billingType === "ONE_TIME"
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        One-Time Project
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Service Deliverables / Scope Description</label>
                    <input
                      type="text"
                      value={convertData.itemTitle}
                      onChange={(e) => setConvertData({ ...convertData, itemTitle: e.target.value })}
                      placeholder="e.g. 15 Reels + 20 Graphics + Meta Ads"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Total Amount / Retainer (₹)</label>
                    <input
                      type="number"
                      value={convertData.totalAmount}
                      onChange={(e) => setConvertData({ ...convertData, totalAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Client Requirements & Onboarding Notes</label>
                    <textarea
                      rows={2}
                      value={convertData.serviceDetails}
                      onChange={(e) => setConvertData({ ...convertData, serviceDetails: e.target.value })}
                      placeholder="Notes for the team manager regarding deliverables, accounts, access..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertLead}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20"
                  >
                    {loading ? "Processing..." : isEmployee ? "Submit for Manager Approval" : "Confirm & Create Client Order"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Lead Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Create New Lead</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Customer / Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Expected Value (₹)</label>
                      <input
                        type="number"
                        value={formData.expectedValue}
                        onChange={(e) => setFormData({ ...formData, expectedValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Assigned Sales Rep</label>
                      <select
                        value={formData.assignedToId}
                        onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.user?.name} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20"
                    >
                      {loading ? "Saving..." : "Create Lead"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
