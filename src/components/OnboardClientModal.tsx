"use client";

import React, { useState, useRef } from "react";
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
  Upload,
  Calendar,
  FileCheck,
  Paperclip,
  Check,
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
      estimatedEndDate: initialData?.estimatedEndDate || "",
      documentUrl: initialData?.documentUrl || "",
      documentName: initialData?.documentName || "",
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

  // Mode: "SERVICES" (itemized deliverables) or "DOCUMENT" (upload quotation/proposal document)
  const [deliverableMode, setDeliverableMode] = useState<"SERVICES" | "DOCUMENT">("SERVICES");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        estimatedEndDate: initialData?.estimatedEndDate || "",
        documentUrl: initialData?.documentUrl || "",
        documentName: initialData?.documentName || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Client Name and Phone Number are required!");
      return;
    }

    // If using Document mode, make sure a document is uploaded, or fall back to a default service placeholder
    let finalServices = [...formData.services];
    if (deliverableMode === "DOCUMENT") {
      if (!formData.documentUrl) {
        setError("Please upload a quotation, proposal, or work scope document, or switch to 'Itemized Services' mode.");
        return;
      }
      // If user has no services entered or wants quotation-based scope, create a clean default deliverable pointing to the document
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0 shadow-xs">
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Client & Company Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Client & Company Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nexa Digital Labs"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Department, Billing & Timeline */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Department, Billing & Timeline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Allocated Department</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
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
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
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
                  {formData.billingType === "MONTHLY" ? "Monthly Retainer (₹) *" : "Total Value (₹) *"}
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Optional Estimated End Date */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Estimated End Date</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={formData.estimatedEndDate || ""}
                    onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Scope Specification Choice: Direct Upload Document OR Add Deliverable Services */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Client Work Scope & Deliverables</span>
              </div>

              {/* Toggle: Services list vs Upload Quotation/Document */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeliverableMode("SERVICES")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    deliverableMode === "SERVICES"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  <span>Itemized Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverableMode("DOCUMENT")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    deliverableMode === "DOCUMENT"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Document / Quotation</span>
                </button>
              </div>
            </div>

            {/* Mode A: Upload Document (Quotation / Scope PDF) */}
            {deliverableMode === "DOCUMENT" && (
              <div className="p-4 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-xl space-y-3">
                <div className="flex flex-col items-center justify-center text-center py-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-2">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs">Direct Quotation or Project Scope Document</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                    Upload the client proposal, quotation PDF, or work statement. The delivery team can view and download it directly.
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
                    <div className="mt-3.5 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate max-w-xs">{formData.documentName || "Quotation Document"}</span>
                      <a
                        href={formData.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline text-[11px] ml-1"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveDocument}
                        className="p-1 hover:text-rose-600 rounded text-slate-400 ml-2 cursor-pointer"
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
                      className="mt-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? "Uploading File..." : "Select Quotation / PDF File"}</span>
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 mt-1.5">Supported: PDF, Word, Excel, Images (Max 15MB)</span>
                </div>
              </div>
            )}

            {/* Mode B: Itemized Services List */}
            {deliverableMode === "SERVICES" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
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
                      className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
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
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-500"
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
                              className="w-full sm:w-40 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium text-xs focus:outline-none focus:border-blue-500"
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
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 font-mono">Note:</span>
                        <input
                          type="text"
                          placeholder="Specific note/guideline for this deliverable (e.g. 60-sec video, Brand tone)..."
                          value={srv.notes || ""}
                          onChange={(e) => handleServiceChange(srv.id, "notes", e.target.value)}
                          className="flex-1 px-2 py-1 bg-white border border-slate-200/80 rounded-md text-slate-700 text-[11px] placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer text-xs"
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
