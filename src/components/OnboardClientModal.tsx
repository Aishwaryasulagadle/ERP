"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Building2,
  Sparkles,
  Layers,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardServiceItem {
  id: string;
  serviceName: string;
  category?: string;
  target: string;
  targetCount?: number;
  billingCycle?: string;
  milestoneAmount?: number;
  notes?: string;
}

export interface OnboardClientFormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  departmentType: "DIGITAL_MARKETING" | "TECHNICAL";
  billingType: "MONTHLY" | "ONE_TIME";
  amount: number;
  notes: string;
  services: OnboardServiceItem[];
  leadId?: string;
  assignedEmployeeIds?: string[];
}

interface OnboardClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OnboardClientFormData) => Promise<void>;
  initialData?: Partial<OnboardClientFormData>;
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
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

const SERVICE_PRESETS = [
  { label: "15 Reels", name: "Instagram Reels & Shorts", target: "15 Reels" },
  { label: "25 Posts", name: "Static Graphics & Carousels", target: "25 Posts" },
  { label: "Meta & Google Ads", name: "Meta & Google Ads Campaign", target: "2 Campaigns" },
  { label: "Website Dev", name: "Website UI/UX & Development", target: "Complete Launch" },
  { label: "Custom ERP Suite", name: "Enterprise ERP System Deployment", target: "Full Build" },
  { label: "SEO & Content", name: "On-Page & Technical SEO Articles", target: "8 Articles" },
];

export function OnboardClientModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Onboard New Client Account",
  subtitle = "Register client deliverables, retainer amount, and allocate to service department.",
  submitButtonText = "Confirm & Onboard Client",
}: OnboardClientModalProps) {
  const [formData, setFormData] = useState<OnboardClientFormData>(() => {
    return {
      name: initialData?.name || "",
      company: initialData?.company || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      source: initialData?.source || "CALLING",
      departmentType: initialData?.departmentType || "DIGITAL_MARKETING",
      billingType: initialData?.billingType || "MONTHLY",
      amount: initialData?.amount !== undefined ? initialData.amount : 50000,
      notes: initialData?.notes || "",
      leadId: initialData?.leadId || undefined,
      assignedEmployeeIds: initialData?.assignedEmployeeIds || [],
      services:
        initialData?.services && initialData.services.length > 0
          ? initialData.services.map((s) => ({
              ...s,
              target: s.target || (s.targetCount !== undefined ? String(s.targetCount) : "15"),
            }))
          : [
              {
                id: "srv-1",
                serviceName: "Instagram Reels & Content Deliverables",
                target: "15",
                billingCycle: "MONTHLY",
                milestoneAmount: 0,
                notes: "",
              },
            ],
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if initialData changes when opened
  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || "",
        company: initialData.company || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        source: initialData.source || "CALLING",
        departmentType: initialData.departmentType || "DIGITAL_MARKETING",
        billingType: initialData.billingType || "MONTHLY",
        amount: initialData.amount !== undefined ? initialData.amount : 50000,
        notes: initialData.notes || "",
        leadId: initialData.leadId || undefined,
        assignedEmployeeIds: initialData.assignedEmployeeIds || [],
        services:
          initialData.services && initialData.services.length > 0
            ? initialData.services.map((s) => ({
                ...s,
                target: s.target || (s.targetCount !== undefined ? String(s.targetCount) : "1"),
              }))
            : [
                {
                  id: "srv-1",
                  serviceName:
                    initialData.departmentType === "TECHNICAL"
                      ? "Web & Application Development"
                      : "Instagram Reels & Content Deliverables",
                  target: initialData.departmentType === "TECHNICAL" ? "1 Milestone" : "15 Reels",
                  billingCycle: initialData.billingType || "MONTHLY",
                  milestoneAmount: initialData.billingType === "ONE_TIME" ? initialData.amount || 0 : 0,
                  notes: "",
                },
              ],
      });
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddService = () => {
    const isTech = formData.departmentType === "TECHNICAL";
    const newService: OnboardServiceItem = {
      id: `srv-${Date.now()}`,
      serviceName: isTech ? "Feature Module / Sprint Milestone" : "Graphics & Posts",
      target: isTech ? "1 Milestone" : "10",
      billingCycle: formData.billingType,
      milestoneAmount: 0,
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, newService],
    }));
  };

  const handleApplyPreset = (preset: (typeof SERVICE_PRESETS)[0]) => {
    const newService: OnboardServiceItem = {
      id: `srv-${Date.now()}`,
      serviceName: preset.name,
      target: preset.target,
      billingCycle: formData.billingType,
      milestoneAmount: 0,
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, newService],
    }));
  };

  const handleRemoveService = (id: string) => {
    if (formData.services.length <= 1) {
      alert("At least one deliverable service item is required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  const handleServiceChange = (id: string, field: keyof OnboardServiceItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Client Name and Phone Number are required!");
      return;
    }
    if (formData.services.length === 0) {
      setError("Please add at least one deliverable service.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to onboard client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Client & Business Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Client & Business Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contact / Person Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. JVM Institute / Zenith Corp"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@business.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Department & Financials */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Department & Commercial Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Allocated Department</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, departmentType: "DIGITAL_MARKETING" })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer",
                      formData.departmentType === "DIGITAL_MARKETING"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Marketing
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, departmentType: "TECHNICAL" })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer",
                      formData.departmentType === "TECHNICAL"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Technical
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Billing Frequency</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingType: "MONTHLY" })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer",
                      formData.billingType === "MONTHLY"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingType: "ONE_TIME" })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer",
                      formData.billingType === "ONE_TIME"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    One-Time
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {formData.billingType === "MONTHLY" ? "Monthly Retainer Amount (₹) *" : "Total Contract Value (₹) *"}
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Deliverable Services List with Dynamic Add */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Deliverable Services & Monthly Targets ({formData.services.length})</span>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Service</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">Quick Add:</span>
              {SERVICE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium shrink-0 transition-colors"
                >
                  + {p.label}
                </button>
              ))}
            </div>

            {/* List of Services */}
            <div className="space-y-2.5">
              {formData.services.map((srv, idx) => (
                <div
                  key={srv.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 w-full sm:w-auto">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Service / deliverable name (e.g. Reels, UI Sprints)"
                      value={srv.serviceName}
                      onChange={(e) => handleServiceChange(srv.id, "serviceName", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                      <span className="text-[11px] text-slate-500 font-semibold shrink-0">Target:</span>
                      <input
                        type="text"
                        placeholder="e.g. 15, 20 Reels, MVP Launch"
                        value={srv.target}
                        onChange={(e) => handleServiceChange(srv.id, "target", e.target.value)}
                        className="w-full sm:w-44 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveService(srv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove deliverable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Notes / Instructions for the Delivery Team */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Client Notes & Operational Instructions</span>
            </div>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter requirements, brand guidelines, shared drives, or notes for the delivery manager..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Onboarding..." : submitButtonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
