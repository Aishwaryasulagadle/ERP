"use client";

import { useState, useEffect } from "react";
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
  Edit3,
  X,
  UserCheck,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Filter,
  Layers,
  Save,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createLead,
  updateLeadStatus,
  updateLeadDetails,
  requestLeadConversionApproval,
} from "@/actions/crm";
import { createClient } from "@/actions/clients";
import { StatusBadge, KpiCard } from "@/components/ui/Cards";
import { OnboardClientModal, OnboardClientFormData } from "@/components/OnboardClientModal";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface CRMClientProps {
  initialLeads: any[];
  employees: any[];
  user?: any;
  userRole?: string;
}

const SOURCES = [
  { value: "CALLING", label: "Phone Call" },
  { value: "VISIT", label: "In-Person Visit" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "WEBSITE", label: "Website Form" },
  { value: "REFERRAL", label: "Referral / Word of Mouth" },
  { value: "OTHER", label: "Other Channel" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low Priority" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High Priority" },
  { value: "URGENT", label: "Urgent Hot Lead" },
];

export function CRMClient({ initialLeads, employees, user, userRole = "EMPLOYEE" }: CRMClientProps) {
  const [leads, setLeads] = useState<any[]>(initialLeads);
  const [activeStageFilter, setActiveStageFilter] = useState<string>("ALL");
  const [leadScopeFilter, setLeadScopeFilter] = useState<"ALL" | "MINE">("ALL");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync state if server props refresh
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const currentEmpId = (user as any)?.employeeId;
  const isManager = userRole === "MANAGER";
  const isAdmin = userRole === "ADMIN";
  const isEmployee = userRole === "EMPLOYEE";

  // Form states for creating a lead
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    company: "",
    location: "",
    source: "CALLING",
    productInterest: "",
    expectedValue: 0,
    assignedToId: currentEmpId || "",
    priority: "MEDIUM",
    notes: "",
    followUpDate: "",
  });

  // State for drawer editing
  const [editDrawerData, setEditDrawerData] = useState({
    customerName: "",
    phone: "",
    email: "",
    company: "",
    location: "",
    source: "CALLING",
    productInterest: "",
    expectedValue: 0,
    priority: "MEDIUM",
    notes: "",
    assignedToId: "",
  });

  const [convertData, setConvertData] = useState({
    totalAmount: 180000,
    itemTitle: "Digital Marketing Retainer",
    departmentType: "DIGITAL_MARKETING" as "DIGITAL_MARKETING" | "TECHNICAL",
    billingType: "MONTHLY" as "MONTHLY" | "ONE_TIME",
    serviceDetails: "",
  });

  const [loading, setLoading] = useState(false);

  // Active Kanban Board Stages (Excluding LOST which has its own dedicated list view)
  const kanbanStages = ["NEW", "CONTACTED", "FOLLOW_UP", "QUALIFIED", "PENDING_APPROVAL", "CONVERTED"];

  // Open Drawer and prepare edit state
  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead);
    setIsEditingInDrawer(false);
    setEditDrawerData({
      customerName: lead.customerName || "",
      phone: lead.phone || "",
      email: lead.email || "",
      company: lead.company || "",
      location: lead.location || "",
      source: lead.source || "CALLING",
      productInterest: lead.productInterest || "",
      expectedValue: lead.expectedValue || 0,
      priority: lead.priority || "MEDIUM",
      notes: lead.notes || "",
      assignedToId: lead.assignedToId || "",
    });
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.phone.trim()) {
      alert("Customer Name and Phone Number are compulsory!");
      return;
    }
    setLoading(true);
    try {
      const newLead = await createLead({
        ...formData,
        assignedToId: isAdmin && formData.assignedToId ? formData.assignedToId : currentEmpId,
      });
      setLeads([newLead, ...leads]);
      setShowCreateModal(false);
      setFormData({
        customerName: "",
        phone: "",
        email: "",
        company: "",
        location: "",
        source: "CALLING",
        productInterest: "",
        expectedValue: 0,
        assignedToId: currentEmpId || "",
        priority: "MEDIUM",
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
      const updated = await updateLeadStatus(leadId, status);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updated, status } : l)));
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev: any) => ({ ...prev, ...updated, status }));
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveDrawerEdit = async () => {
    if (!selectedLead) return;
    if (!editDrawerData.customerName.trim() || !editDrawerData.phone.trim()) {
      alert("Customer Name and Phone Number are compulsory!");
      return;
    }
    setLoading(true);
    try {
      const updated = await updateLeadDetails(selectedLead.id, editDrawerData);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSelectedLead((prev: any) => ({ ...prev, ...updated }));
      setIsEditingInDrawer(false);
      alert("✓ Lead details updated successfully!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmitForApproval = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId) || selectedLead;
    if (!lead) return;
    setLoading(true);
    try {
      const updated = await requestLeadConversionApproval(lead.id, {
        totalAmount: lead.expectedValue || 0,
        itemTitle: lead.productInterest || "Client Contract",
        departmentType: (lead.departmentType as any) || "DIGITAL_MARKETING",
        billingType: (lead.billingType as any) || "MONTHLY",
        serviceDetails: lead.notes || "",
      });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updated } : l)));
      if (selectedLead?.id === lead.id) {
        setSelectedLead((prev: any) => ({ ...prev, ...updated }));
      }
      alert(`✓ Lead ${lead.leadCode} (${lead.customerName}) submitted for Manager Approval!`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardClientSubmit = async (formData: OnboardClientFormData) => {
    if (!selectedLead) return;
    setLoading(true);
    try {
      await createClient({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        departmentType: formData.departmentType,
        billingType: formData.billingType,
        amount: formData.amount,
        notes: formData.notes,
        leadId: selectedLead.id,
        initialServices: formData.services.map((s) => ({
          serviceName: s.serviceName,
          category: s.category,
          targetCount: s.targetCount,
          billingCycle: s.billingCycle,
          milestoneAmount: s.milestoneAmount,
          notes: s.notes,
        })),
      });
      const updated = { ...selectedLead, status: "CONVERTED" };
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)));
      setSelectedLead(updated);
      setShowConvertModal(false);
      alert(`✓ Lead ${selectedLead.leadCode} successfully approved & immediately onboarded into Client Accounts and Sales Order!`);
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
    if (!leadId) return;

    // If an employee drags into CONVERTED or PENDING_APPROVAL, directly submit for manager approval
    if (isEmployee && (targetStage === "CONVERTED" || targetStage === "PENDING_APPROVAL")) {
      handleEmployeeSubmitForApproval(leadId);
      return;
    }

    // If manager or admin drags into CONVERTED, open OnboardClientModal
    if (!isEmployee && targetStage === "CONVERTED") {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        handleOpenLead(lead);
        setShowConvertModal(true);
      }
      return;
    }

    handleStatusChange(leadId, targetStage);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Filter pipeline leads
  const filteredLeads = leads.filter((lead) => {
    const matchesStage = activeStageFilter === "ALL" || lead.status === activeStageFilter;
    const matchesScope =
      leadScopeFilter === "ALL" ||
      (leadScopeFilter === "MINE" && (lead.assignedToId === currentEmpId || lead.assignedTo?.userId === user?.id));
    const matchesSearch =
      lead.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.leadCode?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.notes?.toLowerCase().includes(search.toLowerCase());
    return matchesStage && matchesScope && matchesSearch;
  });

  // Calculate dynamic KPIs strictly based on current scope/filters
  const scopeFilteredLeads = leads.filter((lead) => {
    return (
      leadScopeFilter === "ALL" ||
      (leadScopeFilter === "MINE" && (lead.assignedToId === currentEmpId || lead.assignedTo?.userId === user?.id))
    );
  });

  const totalLeads = scopeFilteredLeads.length;
  const newCount = scopeFilteredLeads.filter((l) => l.status === "NEW").length;
  const contactedCount = scopeFilteredLeads.filter((l) => l.status === "CONTACTED").length;
  const followUpCount = scopeFilteredLeads.filter((l) => l.status === "FOLLOW_UP").length;
  const qualifiedCount = scopeFilteredLeads.filter((l) => l.status === "QUALIFIED").length;
  const pendingApprovalCount = scopeFilteredLeads.filter((l) => l.status === "PENDING_APPROVAL").length;
  const convertedCount = scopeFilteredLeads.filter((l) => l.status === "CONVERTED").length;
  const lostCount = scopeFilteredLeads.filter((l) => l.status === "LOST").length;

  const crmCategories = [
    { key: "ALL", label: "Active Pipeline", icon: Layers, count: totalLeads - lostCount, color: "text-blue-500" },
    { key: "NEW", label: "New Leads", icon: Sparkles, count: newCount, color: "text-blue-500" },
    { key: "CONTACTED", label: "Contacted Leads", icon: PhoneCall, count: contactedCount, color: "text-indigo-500" },
    { key: "FOLLOW_UP", label: "Follow-up Queue", icon: Clock, count: followUpCount, color: "text-amber-500" },
    { key: "QUALIFIED", label: "Qualified Deals", icon: Target, count: qualifiedCount, color: "text-cyan-500" },
    { key: "PENDING_APPROVAL", label: "Pending Approval", icon: ShieldCheck, count: pendingApprovalCount, color: "text-orange-500" },
    { key: "CONVERTED", label: "Converted Clients", icon: CheckCircle2, count: convertedCount, color: "text-emerald-500" },
    { key: "LOST", label: "Lost Leads Archive", icon: XCircle, count: lostCount, color: "text-rose-500" },
  ];

  const lostLeadsList = filteredLeads.filter((l) => l.status === "LOST");

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* CRM Operations Sidebar */}
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
                  <h2 className="font-bold text-xs text-slate-900 truncate">CRM Pipeline</h2>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isAdmin ? "Global Enterprise CRM" : isManager ? "Department Sales Pipeline" : "My Personal Leads"}
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
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 w-full min-w-0 overflow-x-auto">
        <div className="space-y-6">
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
                Leads & CRM Pipeline
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEmployee
                  ? "Track your client conversations, follow-up notes, and submit proposals for manager approval."
                  : "Department deal pipeline, sales conversion audit, and staff performance."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Scope filter for Admin / Manager */}
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
                    {isAdmin ? `All Company Leads (${leads.length})` : `Department Pipeline (${leads.length})`}
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
                    My Own Leads ({leads.filter((l) => l.assignedToId === currentEmpId || l.assignedTo?.userId === user?.id).length})
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* Dynamic KPI Cards Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setActiveStageFilter("ALL")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "ALL"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Active Pipeline</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{totalLeads - lostCount}</p>
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
              onClick={() => setActiveStageFilter("PENDING_APPROVAL")}
              className={`p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                activeStageFilter === "PENDING_APPROVAL"
                  ? "bg-orange-50 border-orange-400 text-orange-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-orange-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase font-mono">Pending Approval</span>
              <p className="text-xl font-bold font-mono text-orange-600 mt-1">{pendingApprovalCount}</p>
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
                placeholder="Search leads by name, phone, company, notes..."
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

          {/* View Selection: If LOST is selected from sidebar, show clean table/list. Otherwise, show Kanban Pipeline */}
          {activeStageFilter === "LOST" ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Lost & Closed Leads Archive ({lostLeadsList.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">Leads marked as lost or unclosed for review and audit</p>
                </div>
              </div>

              {lostLeadsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No lost leads found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Lead</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Notes / Reason</th>
                        <th className="py-3 px-4">Sales Rep</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lostLeadsList.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => handleOpenLead(lead)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{lead.customerName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{lead.leadCode}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono">{lead.phone}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                              {lead.source}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={lead.priority} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{lead.notes || "—"}</td>
                          <td className="py-3 px-4 text-slate-700">{lead.assignedTo?.user?.name || "Unassigned"}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(lead.id, "NEW");
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                            >
                              Reopen Lead
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* CRM Kanban Pipeline Board (LOST excluded from Kanban) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 min-h-[500px]">
              {kanbanStages.map((stage) => {
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
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {stage === "PENDING_APPROVAL" ? "APPROVAL" : stage}
                        </span>
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
                          onClick={() => handleOpenLead(lead)}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer shadow-xs space-y-2",
                            stage === "PENDING_APPROVAL"
                              ? "bg-amber-50/70 border-amber-300 hover:border-amber-400"
                              : "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-semibold text-xs text-slate-900 truncate">{lead.customerName}</div>
                            <span
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono",
                                lead.priority === "URGENT"
                                  ? "bg-rose-100 text-rose-700 border-rose-300"
                                  : lead.priority === "HIGH"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : lead.priority === "LOW"
                                  ? "bg-slate-100 text-slate-600 border-slate-300"
                                  : "bg-blue-100 text-blue-700 border-blue-300"
                              )}
                            >
                              {lead.priority || "MED"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 truncate">
                            <span>{lead.phone}</span>
                            <span className="text-[10px] font-mono px-1 rounded bg-slate-200/70 text-slate-700">
                              {lead.source}
                            </span>
                          </div>

                          {lead.notes && (
                            <p className="text-[10px] text-slate-600 line-clamp-1 italic bg-white/60 px-1.5 py-0.5 rounded border border-slate-200/60">
                              "{lead.notes}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                            <span className="font-mono font-bold text-emerald-600">
                              {lead.expectedValue > 0 ? formatCurrency(lead.expectedValue) : "Open Deal"}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px] truncate max-w-[90px]">
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
          )}

          {/* Lead Details & Editing Right Drawer */}
          {selectedLead && !showConvertModal && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
                <div className="space-y-5">
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsEditingInDrawer(!isEditingInDrawer)}
                        title="Edit lead details"
                        className={cn(
                          "p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                          isEditingInDrawer
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingInDrawer ? "Viewing" : "Edit"}</span>
                      </button>
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Edit Mode Inside Drawer */}
                  {isEditingInDrawer ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800 text-[11px] font-semibold">
                        Edit contact details, source, priority, and follow-up notes.
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Customer Name *</label>
                        <input
                          type="text"
                          value={editDrawerData.customerName}
                          onChange={(e) => setEditDrawerData({ ...editDrawerData, customerName: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Phone Number *</label>
                          <input
                            type="text"
                            value={editDrawerData.phone}
                            onChange={(e) => setEditDrawerData({ ...editDrawerData, phone: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                          <input
                            type="email"
                            value={editDrawerData.email}
                            onChange={(e) => setEditDrawerData({ ...editDrawerData, email: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Company / Business</label>
                          <input
                            type="text"
                            value={editDrawerData.company}
                            onChange={(e) => setEditDrawerData({ ...editDrawerData, company: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Deal Value (₹)</label>
                          <input
                            type="number"
                            value={editDrawerData.expectedValue}
                            onChange={(e) => setEditDrawerData({ ...editDrawerData, expectedValue: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Lead Source</label>
                          <select
                            value={editDrawerData.source}
                            onChange={(e) => setEditDrawerData({ ...editDrawerData, source: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                          >
                            {SOURCES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Priority</label>
                          <select
                            value={editDrawerData.priority}
                            onChange={(e) => setEditDrawerData({ ...editDrawerData, priority: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Follow-up & Conversation Notes</label>
                        <textarea
                          rows={3}
                          value={editDrawerData.notes}
                          onChange={(e) => setEditDrawerData({ ...editDrawerData, notes: e.target.value })}
                          placeholder="Client requirement, conversation details, budget, follow-up..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveDrawerEdit}
                          disabled={loading}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{loading ? "Saving..." : "Save Changes"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingInDrawer(false)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: View Details Inside Drawer */
                    <>
                      {/* Expected Value & Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Deal Value</span>
                          <p className="text-base font-bold text-emerald-600 mt-1 font-mono">
                            {selectedLead.expectedValue > 0 ? formatCurrency(selectedLead.expectedValue) : "Open Deal"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Stage Status</span>
                          <div className="mt-1">
                            <StatusBadge status={selectedLead.status} />
                          </div>
                        </div>
                      </div>

                      {/* Contact & Lead Info */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500">Business / Company:</span>
                          <span className="text-slate-900 font-medium">{selectedLead.company || "Individual Client"}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500">Phone Number:</span>
                          <span className="text-slate-900 font-mono font-bold text-blue-600">{selectedLead.phone}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500">Email:</span>
                          <span className="text-slate-900">{selectedLead.email || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500">Lead Source:</span>
                          <span className="font-mono font-bold text-purple-600">
                            {SOURCES.find((s) => s.value === selectedLead.source)?.label || selectedLead.source}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500">Priority:</span>
                          <span className="font-bold text-slate-800">{selectedLead.priority || "MEDIUM"}</span>
                        </div>
                        <div className="flex justify-between pt-0.5">
                          <span className="text-slate-500">Assigned Sales Rep:</span>
                          <span className="text-slate-900 font-medium">
                            {selectedLead.assignedTo?.user?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {/* Follow-up / Client Notes Section */}
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-amber-900 font-bold">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                            <span>Follow-up & Client Notes</span>
                          </div>
                          <button
                            onClick={() => setIsEditingInDrawer(true)}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedLead.notes || "No notes added yet. Click Edit to add follow-up details."}
                        </p>
                      </div>
                    </>
                  )}
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
                          ? "You have submitted this lead for Manager Approval. Your Sales Manager or Admin will review and onboard them as a client."
                          : `Sales rep ${selectedLead.assignedTo?.user?.name || "Employee"} requested client conversion. Review and onboard below.`}
                      </p>
                      {!isEmployee && (
                        <button
                          onClick={() => setShowConvertModal(true)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Onboard Client</span>
                        </button>
                      )}
                    </div>
                  ) : selectedLead.status !== "CONVERTED" && selectedLead.status !== "LOST" && (
                    isEmployee ? (
                      <button
                        onClick={() => handleEmployeeSubmitForApproval(selectedLead.id)}
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit for Manager Approval</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConvertModal(true)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Convert & Onboard Client</span>
                      </button>
                    )
                  )}

                  {/* Stage Status Selector (Includes option to mark as LOST without a kanban section) */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="NEW">Status: NEW</option>
                      <option value="CONTACTED">Status: CONTACTED</option>
                      <option value="FOLLOW_UP">Status: FOLLOW_UP</option>
                      <option value="QUALIFIED">Status: QUALIFIED</option>
                      <option value="PENDING_APPROVAL">Status: PENDING_APPROVAL</option>
                      {(!isEmployee || isAdmin) && <option value="CONVERTED">Status: CONVERTED</option>}
                      <option value="LOST">Status: Mark as LOST / Closed</option>
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

          {/* Onboard Client Modal directly opened on Conversion */}
          {showConvertModal && selectedLead && (
            <OnboardClientModal
              isOpen={showConvertModal}
              onClose={() => setShowConvertModal(false)}
              onSubmit={handleOnboardClientSubmit}
              title={isEmployee ? "Submit Lead for Client Onboarding Approval" : "Onboard Converted Client Account"}
              subtitle={
                isEmployee
                  ? `Set package, deliverables, and commercial model for ${selectedLead.customerName}. Manager will approve.`
                  : `Prefilled from lead ${selectedLead.leadCode}. Allocate to department, configure deliverable targets, and onboard.`
              }
              submitButtonText={isEmployee ? "Submit for Manager Approval" : "Confirm & Onboard to Department"}
              initialData={{
                name: selectedLead.customerName || "",
                company: selectedLead.company || "",
                phone: selectedLead.phone || "",
                email: selectedLead.email || "",
                source: selectedLead.source || "CALLING",
                departmentType: (selectedLead.departmentType as any) || "DIGITAL_MARKETING",
                billingType: (selectedLead.billingType as any) || "MONTHLY",
                amount: selectedLead.expectedValue || 50000,
                notes: selectedLead.notes || "",
                leadId: selectedLead.id,
                services: [
                  {
                    id: "srv-init",
                    serviceName:
                      selectedLead.productInterest ||
                      ((selectedLead.departmentType as any) === "TECHNICAL"
                        ? "Web & Application Development"
                        : "Instagram Reels & Social Media Deliverables"),
                    category: (selectedLead.departmentType as any) === "TECHNICAL" ? "DEVELOPMENT" : "MARKETING",
                    targetCount: (selectedLead.departmentType as any) === "TECHNICAL" ? 1 : 15,
                    billingCycle: (selectedLead.billingType as any) || "MONTHLY",
                    milestoneAmount: (selectedLead.billingType as any) === "ONE_TIME" ? selectedLead.expectedValue || 0 : 0,
                    notes: "",
                  },
                ],
              }}
            />
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
                  {/* Compulsory Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Customer / Person Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="e.g. Ramesh Kadam"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Optional Fields: Business Name & Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Business / Company Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Apex Tech Solutions"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. client@gmail.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Source & Priority */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                      >
                        {SOURCES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Amount & Admin Sales Rep Assigner */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Expected Deal Value (₹ Optional)</label>
                      <input
                        type="number"
                        value={formData.expectedValue || ""}
                        onChange={(e) => setFormData({ ...formData, expectedValue: Number(e.target.value) })}
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    {/* Only Admin gets to manually reassign to another salesperson; Employees & Managers auto-assign to themselves */}
                    {isAdmin ? (
                      <div>
                        <label className="block text-slate-600 mb-1">Assign to Salesperson (Admin only)</label>
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
                    ) : (
                      <div>
                        <label className="block text-slate-600 mb-1">Assigned Sales Representative</label>
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                          {user?.name || "Assigned to You"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes / Follow-up Details */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Initial Notes / Follow-up Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter conversation notes, client's requirements, next follow-up agenda..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white text-xs"
                    />
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
