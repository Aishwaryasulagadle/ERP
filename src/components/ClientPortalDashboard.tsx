"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Calendar,
  Layers,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { raiseClientComplaint } from "@/actions/clients";

interface ClientPortalDashboardProps {
  client: any;
  user: any;
}

export function ClientPortalDashboard({ client, user }: ClientPortalDashboardProps) {
  const [activeTab, setActiveTab] = useState<"PROGRESS_SHEET" | "COMPLAINTS">("PROGRESS_SHEET");
  const [clientData, setClientData] = useState<any>(client);

  // Month selection for progress reports
  const [sheetMonth, setSheetMonth] = useState<number>(new Date().getMonth() + 1);
  const [sheetYear, setSheetYear] = useState<number>(new Date().getFullYear());

  // Sheet columns and rows
  const [customColumns, setCustomColumns] = useState<string[]>([
    "Item / Deliverable",
    "Monthly Target",
    "Completed Count",
    "Remaining",
    "Status",
    "Notes & Links",
  ]);
  const [sheetRows, setSheetRows] = useState<any[]>([]);
  const [oneTimeProgressPct, setOneTimeProgressPct] = useState<number>(0);

  // Complaint Form Modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintForm, setComplaintForm] = useState<{
    subject: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: string;
  }>({
    subject: "",
    description: "",
    priority: "HIGH",
    category: "DELIVERABLE_DELAY",
  });

  // Calculate available billing months
  const getAvailableBillingMonths = (c: any) => {
    if (!c) return [];
    const onboardDate = c.onboardingDate ? new Date(c.onboardingDate) : new Date();
    const startYear = onboardDate.getFullYear();
    const startMonth = onboardDate.getMonth() + 1;

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const monthsList: { month: number; year: number; label: string }[] = [];
    const endYear = Math.max(currentYear + 1, startYear);
    for (let y = startYear; y <= endYear; y++) {
      const mStart = y === startYear ? startMonth : 1;
      const mEnd = y === endYear ? 12 : 12;
      for (let m = mStart; m <= mEnd; m++) {
        monthsList.push({
          month: m,
          year: y,
          label: `${monthNames[m - 1]} ${y}`,
        });
      }
    }
    return monthsList;
  };

  // Sync sheet rows when client or month changes (100% synced with ReportsClient logic and DB)
  useEffect(() => {
    if (!clientData) return;

    const isOneTime = clientData.billingType === "ONE_TIME";
    const targetReport = isOneTime
      ? clientData.reports?.find((r: any) => r.month === 0) || clientData.reports?.[0]
      : clientData.reports?.find((r: any) => r.month === sheetMonth && r.year === sheetYear);

    if (isOneTime && targetReport?.notes && targetReport.notes.includes("[Work Completed:")) {
      const match = targetReport.notes.match(/\[Work Completed:\s*(\d+)%\]/);
      if (match) setOneTimeProgressPct(Number(match[1]));
    }

    // 1. If saved report exists for this month, load exact saved columns and rows
    if (targetReport?.columnsJson) {
      try {
        const parsed = JSON.parse(targetReport.columnsJson);
        if (parsed.columns && Array.isArray(parsed.columns)) {
          setCustomColumns(parsed.columns);
        }
        if (parsed.rows && Array.isArray(parsed.rows)) {
          setSheetRows(parsed.rows);
        }
        return;
      } catch (e) {
        console.error("Error parsing saved progress sheet", e);
      }
    }

    // 2. If report does not exist for this month yet, inherit from prior month
    const priorReport = clientData.reports?.find((r: any) => {
      if (isOneTime) return false;
      return r.year < sheetYear || (r.year === sheetYear && r.month < sheetMonth);
    });

    if (priorReport?.columnsJson) {
      try {
        const parsedPrior = JSON.parse(priorReport.columnsJson);
        if (parsedPrior.columns && Array.isArray(parsedPrior.columns)) {
          setCustomColumns(parsedPrior.columns);
        }
        if (parsedPrior.rows && Array.isArray(parsedPrior.rows)) {
          const carryOverRows = parsedPrior.rows.map((row: any, rIdx: number) => {
            const rowCopy = { ...row, id: String(Date.now() + rIdx) };
            if (rowCopy["Completed Count"] !== undefined) rowCopy["Completed Count"] = "0";
            if (rowCopy["Remaining"] !== undefined && rowCopy["Monthly Target"] !== undefined) {
              rowCopy["Remaining"] = rowCopy["Monthly Target"];
            }
            if (rowCopy["Status"] !== undefined) rowCopy["Status"] = "IN_PROGRESS";
            return rowCopy;
          });
          setSheetRows(carryOverRows);
          return;
        }
      } catch (e) {
        console.error("Error parsing prior progress report", e);
      }
    }

    // 3. Fallback: Build from client's onboarded services exactly like ReportsClient
    if (clientData.services && clientData.services.length > 0) {
      const dynamicRows = clientData.services.map((srv: any, idx: number) => {
        let targetDisplay = "1";
        if (srv.target) targetDisplay = String(srv.target);
        else if (srv.notes && srv.notes.includes("[Target:")) {
          const match = srv.notes.match(/\[Target:\s*([^\]]+)\]/);
          if (match) targetDisplay = match[1].trim();
        } else if (srv.targetCount > 0) {
          targetDisplay = String(srv.targetCount);
        } else {
          const n = (srv.serviceName || "").toLowerCase();
          if (n.includes("reel")) targetDisplay = "15";
          else if (n.includes("graphic") || n.includes("carousel")) targetDisplay = "25";
          else if (n.includes("seo")) targetDisplay = "8";
          else if (n.includes("ad")) targetDisplay = "2";
        }

        const targetNum = parseInt(targetDisplay, 10) || srv.targetCount || 0;
        const completedNum = isOneTime ? srv.completedCount || 0 : 0;
        const rem = Math.max(0, targetNum - completedNum);

        return {
          id: String(idx + 1),
          "Item / Deliverable": srv.serviceName,
          [isOneTime ? "Target Scope" : "Monthly Target"]: targetDisplay,
          "Completed Count": String(completedNum),
          Remaining: String(rem),
          Status: srv.status || "IN_PROGRESS",
          "Notes & Links": srv.notes ? srv.notes.replace(/\[Target:\s*[^\]]+\]\s*/g, "").trim() : "Active deliverable",
        };
      });
      setSheetRows(dynamicRows);
      setCustomColumns([
        "Item / Deliverable",
        isOneTime ? "Target Scope" : "Monthly Target",
        "Completed Count",
        "Remaining",
        "Status",
        "Notes & Links",
      ]);
    } else {
      setSheetRows([
        {
          id: "1",
          "Item / Deliverable": isOneTime ? "Project Milestone 1" : "Instagram Reels",
          [isOneTime ? "Target Scope" : "Monthly Target"]: isOneTime ? "Full Launch" : "15",
          "Completed Count": "0",
          Remaining: isOneTime ? "1" : "15",
          Status: "IN_PROGRESS",
          "Notes & Links": "Delivery scope active",
        },
      ]);
      setCustomColumns([
        "Item / Deliverable",
        isOneTime ? "Target Scope" : "Monthly Target",
        "Completed Count",
        "Remaining",
        "Status",
        "Notes & Links",
      ]);
    }
  }, [clientData, sheetMonth, sheetYear]);

  // Raise Complaint Handler
  const handleRaiseComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientData) return;
    setComplaintSubmitting(true);
    try {
      const createdQuery = await raiseClientComplaint({
        clientId: clientData.id,
        subject: complaintForm.subject,
        description: complaintForm.description,
        priority: complaintForm.priority,
        category: complaintForm.category,
      });

      const updatedQueries = [createdQuery, ...(clientData.queries || [])];
      setClientData({ ...clientData, queries: updatedQueries });
      setShowComplaintModal(false);
      setComplaintForm({
        subject: "",
        description: "",
        priority: "HIGH",
        category: "DELIVERABLE_DELAY",
      });
      setActiveTab("COMPLAINTS");
      alert("✓ Your complaint has been submitted successfully! It has been dispatched directly to the delivery team and Admin.");
    } catch (err: any) {
      alert(err.message || "Failed to submit complaint");
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const isOneTime = clientData?.billingType === "ONE_TIME";
  const currentReport = isOneTime
    ? clientData?.reports?.find((r: any) => r.month === 0) || clientData?.reports?.[0]
    : clientData?.reports?.find((r: any) => r.month === sheetMonth && r.year === sheetYear);

  const pendingComplaintsCount = (clientData?.queries || []).filter((q: any) => q.status !== "RESOLVED").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono uppercase tracking-wider">
              Client Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono font-medium text-slate-500 uppercase">
              {clientData?.clientCode || "CLIENT"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {clientData?.name || "Client Deliverables"}
          </h1>
          <p className="text-xs text-slate-500">
            Welcome, <span className="font-semibold text-slate-700">{user?.name || user?.email}</span>. Track your project deliverable progress report sheet and submit any queries or complaints directly to our team.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setComplaintForm({
                subject: "",
                description: "",
                priority: "HIGH",
                category: "DELIVERABLE_DELAY",
              });
              setShowComplaintModal(true);
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Raise Complaint / Query</span>
          </button>
        </div>
      </div>

      {/* Portal Tabs: Progress Report Sheet vs Complaints */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("PROGRESS_SHEET")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors",
            activeTab === "PROGRESS_SHEET"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Progress Report Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab("COMPLAINTS")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors relative",
            activeTab === "COMPLAINTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Complaints & Support Tickets</span>
          {pendingComplaintsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-mono font-bold">
              {pendingComplaintsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PROGRESS REPORT SHEET */}
      {activeTab === "PROGRESS_SHEET" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            {/* Client Quotation / Scope Document */}
            {clientData?.documentUrl && (
              <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-xs">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-indigo-950 truncate">
                        {clientData.documentName || 'Official Quotation & Agreement Document'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-200/60 text-indigo-800 shrink-0">
                        QUOTATION FILE
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-700/80 mt-0.5">
                      Your approved scope of work & agreement document.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={clientData.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span>View / Download Agreement ↗</span>
                  </a>
                </div>
              </div>
            )}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                    Deliverables Progress Sheet
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border",
                      isOneTime
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-purple-50 text-purple-800 border-purple-200"
                    )}
                  >
                    {isOneTime ? "One-Time Project" : "Monthly Retainer"}
                  </span>
                  {currentReport?.status === "COMPLETED" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      COMPLETED & VERIFIED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                      LIVE IN PROGRESS
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {isOneTime
                    ? "Full deliverables breakdown and milestone completion percentage updated live by our delivery team."
                    : "Real-time deliverable tracking for the selected monthly cycle. Switch months to view previous cycles."}
                </p>
              </div>

              {/* Month Selector for Retainer Clients */}
              {!isOneTime && (
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-semibold uppercase font-mono px-2 text-slate-500">
                    Cycle:
                  </span>
                  <select
                    value={`${sheetMonth}-${sheetYear}`}
                    onChange={(e) => {
                      const [m, y] = e.target.value.split("-").map(Number);
                      setSheetMonth(m);
                      setSheetYear(y);
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900 cursor-pointer shadow-2xs"
                  >
                    {getAvailableBillingMonths(clientData).map((opt) => (
                      <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* One-Time Progress Bar */}
            {isOneTime && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 font-mono uppercase">Overall Project Completion</span>
                  <span className="text-slate-900 font-mono text-sm font-bold">{oneTimeProgressPct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, oneTimeProgressPct))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Deliverable Progress Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase font-mono text-[10px]">
                    {customColumns.map((col, idx) => (
                      <th
                        key={idx}
                        className="p-3 border-r border-slate-200 last:border-r-0 min-w-[150px]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetRows.map((row, rIdx) => (
                    <tr
                      key={row.id || rIdx}
                      className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                    >
                      {customColumns.map((col, cIdx) => {
                        const val = row[col] ?? "-";
                        return (
                          <td
                            key={cIdx}
                            className="p-3 border-r border-slate-200 last:border-r-0 font-medium text-slate-800"
                          >
                            {col === "Status" ? (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block",
                                  val.toLowerCase().includes("done") || val.toLowerCase().includes("completed")
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                )}
                              >
                                {val}
                              </span>
                            ) : (
                              <span>{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agreed Scope Cards */}
            {clientData?.services && clientData.services.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider block">
                  Agreed Scope & Deliverable Targets
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clientData.services.map((srv: any, idx: number) => {
                    const targetVal = srv.target || (srv.targetCount ? `${srv.targetCount} units` : "Configured");
                    const cleanNotes = srv.notes ? srv.notes.replace(/\[Target:\s*[^\]]+\]\s*/g, "").trim() : "";

                    return (
                      <div
                        key={srv.id || idx}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {srv.serviceName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {targetVal}
                          </span>
                        </div>
                        {cleanNotes && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {cleanNotes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLAINTS & SUPPORT TICKETS */}
      {activeTab === "COMPLAINTS" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                  Your Complaints & Support Tickets
                </h3>
                <p className="text-xs text-slate-500">
                  Track resolution updates for any issues, delays, or deliverable concerns raised.
                </p>
              </div>

              <button
                onClick={() => {
                  setComplaintForm({
                    subject: "",
                    description: "",
                    priority: "HIGH",
                    category: "DELIVERABLE_DELAY",
                  });
                  setShowComplaintModal(true);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Raise New Complaint</span>
              </button>
            </div>

            <div className="space-y-3">
              {clientData?.queries && clientData.queries.length > 0 ? (
                clientData.queries.map((q: any) => {
                  const isResolved = q.status === "RESOLVED";
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "p-4 rounded-lg border text-xs space-y-2 transition-all",
                        isResolved
                          ? "bg-slate-50/70 border-slate-200 text-slate-700"
                          : "bg-rose-50/30 border-rose-200/80 text-slate-900"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border",
                              isResolved
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            )}
                          >
                            {q.status}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border",
                              q.priority === "URGENT" || q.priority === "HIGH"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            )}
                          >
                            {q.priority} PRIORITY
                          </span>
                          <span className="font-semibold text-slate-900 text-sm">
                            {q.subject}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatDate(q.createdAt)}
                        </span>
                      </div>

                      <p className="text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
                        {q.description}
                      </p>

                      {q.response ? (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <span className="font-semibold text-[11px] uppercase tracking-wider block mb-0.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Official Team Resolution:
                          </span>
                          <p className="text-xs whitespace-pre-wrap">{q.response}</p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 font-mono italic">
                          Awaiting official review from the delivery team.
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-center space-y-1">
                  <p className="font-semibold text-slate-700">No complaints logged yet.</p>
                  <p className="text-slate-400">Everything is running smoothly on your deliverables!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RAISE COMPLAINT MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Raise Complaint / Support Ticket</h3>
                  <p className="text-xs text-slate-500">{clientData?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This ticket will be dispatched immediately to the assigned delivery team and Admin for review.
            </p>

            <form onSubmit={handleRaiseComplaintSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Complaint Subject / Title</label>
                <input
                  type="text"
                  required
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                  placeholder="e.g. Deliverable schedule query or issue in project"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Issue Category</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="DELIVERABLE_DELAY">Deliverable Delay</option>
                    <option value="QUALITY_ISSUE">Deliverable Quality Issue</option>
                    <option value="COMMUNICATION">Team Communication</option>
                    <option value="TECHNICAL_BUG">Technical Bug / Issue</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={complaintForm.priority}
                    onChange={(e) =>
                      setComplaintForm({
                        ...complaintForm,
                        priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Immediate Attention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Please describe the deliverable issue or concern in detail..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={complaintSubmitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{complaintSubmitting ? "Submitting..." : "Submit Complaint"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
