"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Building2,
  Sparkles,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  FileCheck,
  Paperclip,
  Check,
  Receipt,
  Clock,
  ArrowRight,
  ShieldCheck,
  Info,
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
  estimatedEndDate?: string;
  documentUrl?: string;
  documentName?: string;
  advanceMonths?: number;
  isGstApplicable?: boolean;
  gstNumber?: string;
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
      estimatedEndDate: initialData?.estimatedEndDate || "",
      documentUrl: initialData?.documentUrl || "",
      documentName: initialData?.documentName || "",
      advanceMonths: initialData?.advanceMonths || 1,
      isGstApplicable: initialData?.isGstApplicable || false,
      gstNumber: initialData?.gstNumber || "",
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

  const [deliverableMode, setDeliverableMode] = useState<"SERVICES" | "DOCUMENT">("SERVICES");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        estimatedEndDate: initialData?.estimatedEndDate || "",
        documentUrl: initialData?.documentUrl || "",
        documentName: initialData?.documentName || "",
        advanceMonths: initialData?.advanceMonths || 1,
        isGstApplicable: initialData?.isGstApplicable || false,
        gstNumber: initialData?.gstNumber || "",
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
      if (initialData.documentUrl) {
        setDeliverableMode("DOCUMENT");
      } else {
        setDeliverableMode("SERVICES");
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed");
      }

      setFormData((prev) => ({
        ...prev,
        documentUrl: data.url,
        documentName: data.fileName || file.name,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload quotation/document");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documentUrl: "",
      documentName: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    if (formData.services.length <= 1 && deliverableMode === "SERVICES") {
      alert("At least one deliverable service item is required when using Services mode.");
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

  const monthlyAmount = Number(formData.amount) || 0;
  const advanceMonths = formData.billingType === "MONTHLY" ? (Number(formData.advanceMonths) || 1) : 1;
  const baseUpfrontAmount = formData.billingType === "MONTHLY" ? monthlyAmount * advanceMonths : monthlyAmount;
  const gstAmount = formData.isGstApplicable ? baseUpfrontAmount * 0.18 : 0;
  const totalPayableWithGst = baseUpfrontAmount + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Client Name and Phone Number are required!");
      return;
    }

    let finalServices = [...formData.services];
    if (deliverableMode === "DOCUMENT") {
      if (!formData.documentUrl) {
        setError("Please upload a quotation, proposal, or work scope document, or switch to 'Itemized Services' mode.");
        return;
      }
      if (finalServices.length === 0) {
        finalServices = [
          {
            id: `srv-doc-${Date.now()}`,
            serviceName: formData.documentName ? `Scope as per ${formData.documentName}` : "Scope as per Quotation Document",
            target: "As per Document",
            billingCycle: formData.billingType,
            milestoneAmount: formData.amount || 0,
            notes: `Refer to attached quotation document: ${formData.documentName || "Quotation File"}`,
          },
        ];
      }
    } else {
      if (finalServices.length === 0) {
        setError("Please add at least one deliverable service.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        ...formData,
        advanceMonths: formData.billingType === "MONTHLY" ? advanceMonths : 1,
        services: finalServices,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to onboard client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5">
        
        {/* Clean Modern Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50/80">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 tracking-tight">{title}</h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  New Client
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Scrollable Area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(94vh-140px)] scrollbar-thin scrollbar-thumb-slate-200">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold shadow-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Client & Company Profile */}
          <div className="bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider font-mono">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</div>
                <span>Client & Brand Information</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Client Contact Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Company / Brand Name</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Nexa Digital Labs"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 font-mono text-xs shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Department, Billing & Commercials */}
          <div className="bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider font-mono">
              <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</div>
              <span>Department, Commercials & Financials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Department Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Department</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, departmentType: "DIGITAL_MARKETING" })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer",
                      formData.departmentType === "DIGITAL_MARKETING"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Technical
                  </button>
                </div>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Billing Model</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingType: "MONTHLY" })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer",
                      formData.billingType === "MONTHLY"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    One-Time
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  {formData.billingType === "MONTHLY" ? "Monthly Retainer (₹) *" : "Contract Value (₹) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold font-mono text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 font-mono font-bold text-xs shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Estimated End Date */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Target End Date</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    value={formData.estimatedEndDate || ""}
                    onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 text-xs shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Advance Months Selector Card */}
            {formData.billingType === "MONTHLY" && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 rounded-xl space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-blue-950">Advance Retainer Collection</span>
                      <p className="text-[10px] text-blue-700/80">Collect upfront payment for multiple months.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceMonths: m })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                          (formData.advanceMonths || 1) === m
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                            : "bg-white text-slate-700 border border-blue-200 hover:bg-blue-50"
                        )}
                      >
                        {m === 1 ? "1 Mo" : `${m} Mos`}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-[10px] text-slate-500 font-semibold">Custom:</span>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        value={formData.advanceMonths || 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            advanceMonths: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-12 px-1 py-0.5 bg-white border border-blue-300 rounded-md text-center text-xs font-bold font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-blue-200/60 text-xs">
                  <span className="text-slate-600 text-[11px]">
                    Initial invoice covers <strong>{advanceMonths} month{advanceMonths > 1 ? "s" : ""}</strong> of active retainership.
                  </span>
                  <div className="font-mono font-bold text-blue-950 flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-normal">Base Collected:</span>
                    <span>₹{baseUpfrontAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* GST Applicable Toggle & Financial Breakdown Card */}
            <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900">GST Invoice Applicable</span>
                    <p className="text-[11px] text-slate-500">Apply standard 18% GST on this client&apos;s invoice and collection vouchers.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isGstApplicable: !prev.isGstApplicable,
                    }))
                  }
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative cursor-pointer ring-2 ring-transparent focus:ring-emerald-200 focus:outline-none",
                    formData.isGstApplicable ? "bg-emerald-600" : "bg-slate-300"
                  )}
                  title="Toggle GST applicability"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs flex items-center justify-center",
                      formData.isGstApplicable ? "translate-x-5" : "translate-x-0"
                    )}
                  >
                    {formData.isGstApplicable && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                  </span>
                </button>
              </div>

              {formData.isGstApplicable && (
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Client GSTIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      value={formData.gstNumber || ""}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-500 uppercase transition-all"
                    />
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-right font-mono text-[11px] text-emerald-950 space-y-1">
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>Base Retainer:</span>
                      <span>₹{baseUpfrontAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>GST (18%):</span>
                      <span>+ ₹{gstAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-200 text-xs">
                      <span>Total Payable:</span>
                      <span>₹{totalPayableWithGst.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Scope Specification Choice */}
          <div className="bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider font-mono">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">3</div>
                <span>Client Work Scope & Deliverables</span>
              </div>

              {/* Segmented Mode Control */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDeliverableMode("SERVICES")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    deliverableMode === "SERVICES"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Itemized Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverableMode("DOCUMENT")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    deliverableMode === "DOCUMENT"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Mode A: Upload Document (Quotation / Scope PDF) */}
            {deliverableMode === "DOCUMENT" && (
              <div className="p-5 bg-white border-2 border-dashed border-indigo-200/90 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-2.5 shadow-xs">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Direct Quotation or Project Scope Document</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                    Upload the client proposal, quotation PDF, or work statement. Uploaded securely to ImageKit CDN for team reference.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    id="quotation-upload-input"
                  />

                  {formData.documentUrl ? (
                    <div className="mt-4 flex items-center gap-2.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium shadow-xs">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate max-w-xs">{formData.documentName || "Quotation Document"}</span>
                      <a
                        href={formData.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline text-[11px] ml-1 font-semibold"
                      >
                        Preview File ↗
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveDocument}
                        className="p-1 hover:text-rose-600 rounded text-slate-400 ml-2 cursor-pointer transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? "Uploading File..." : "Select Quotation / PDF File"}</span>
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 mt-2">Supported formats: PDF, Word, Excel, Images (Max 25MB)</span>
                </div>
              </div>
            )}

            {/* Mode B: Itemized Services List */}
            {deliverableMode === "SERVICES" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">Presets:</span>
                    {SERVICE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium shrink-0 transition-colors shadow-2xs"
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Service</span>
                  </button>
                </div>

                {/* List of Services */}
                <div className="space-y-2.5">
                  {formData.services.map((srv, idx) => (
                    <div
                      key={srv.id}
                      className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1 w-full sm:w-auto">
                          <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Service name (e.g. Reels, UI Sprints, Ads)"
                            value={srv.serviceName}
                            onChange={(e) => handleServiceChange(srv.id, "serviceName", e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold text-xs focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <span className="text-[11px] text-slate-500 font-semibold shrink-0">Target:</span>
                            <input
                              type="text"
                              placeholder="e.g. 15 Reels, MVP Launch"
                              value={srv.target}
                              onChange={(e) => handleServiceChange(srv.id, "target", e.target.value)}
                              className="w-full sm:w-36 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
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

                      {/* Per-deliverable Note input */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 font-mono">Note:</span>
                        <input
                          type="text"
                          placeholder="Specific instruction (e.g. 60-sec video, Brand tone, Weekly delivery)..."
                          value={srv.notes || ""}
                          onChange={(e) => handleServiceChange(srv.id, "notes", e.target.value)}
                          className="flex-1 px-2 py-0.5 bg-transparent border-0 text-slate-700 text-[11px] placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Operational Notes */}
          <div className="bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider font-mono">
              <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</div>
              <span>Operational Instructions & Shared Links</span>
            </div>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter client guidelines, shared Google Drive links, communication notes for the delivery team..."
              className="w-full px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 text-xs leading-relaxed shadow-2xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
              <span className="text-slate-400">Total Upfront:</span>
              <span className="font-bold text-slate-900 text-sm">₹{totalPayableWithGst.toLocaleString("en-IN")}</span>
              {formData.isGstApplicable && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-sans">
                  Incl. 18% GST
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? "Onboarding Client..." : submitButtonText}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
