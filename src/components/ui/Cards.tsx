"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  const norm = status?.toUpperCase() || "";

  let badgeStyle = "bg-slate-50 text-slate-700 border-slate-200/90";
  let dotColor = "bg-slate-400";

  // Success / Emerald
  if (
    [
      "PAID",
      "CONVERTED",
      "PRESENT",
      "COMPLETED",
      "ACTIVE",
      "QUALIFIED",
      "APPROVED",
      "RESOLVED",
      "SUCCESS",
      "WON",
    ].includes(norm)
  ) {
    badgeStyle = "bg-emerald-50/90 text-emerald-800 border-emerald-200";
    dotColor = "bg-emerald-600";
  }
  // Pending / Amber Warning
  else if (
    [
      "PENDING",
      "FOLLOW_UP",
      "LATE",
      "MEDIUM",
      "IN_PROGRESS",
      "CONTACTED",
      "ACTION_NEEDED",
      "HALF_DAY",
      "OPTIONAL",
      "WARNING",
      "HIGH",
      "NEGOTIATION",
      "PROPOSAL",
    ].includes(norm)
  ) {
    badgeStyle = "bg-amber-50/90 text-amber-800 border-amber-200";
    dotColor = "bg-amber-500";
  }
  // Danger / Rose Alert
  else if (
    [
      "LOST",
      "OVERDUE",
      "ABSENT",
      "URGENT",
      "FAILED",
      "REJECTED",
      "CANCELLED",
      "CLOSED",
    ].includes(norm)
  ) {
    badgeStyle = "bg-rose-50/90 text-rose-800 border-rose-200";
    dotColor = "bg-rose-500";
  }
  // Primary / Corporate Blue
  else if (
    [
      "NEW",
      "LEAVE",
      "ADMIN",
      "CLIENT",
      "OPEN",
      "PRO",
      "ENTERPRISE",
      "LOW",
      "WORK_FROM_HOME",
      "WFH",
      "NATIONAL",
      "FESTIVAL",
    ].includes(norm)
  ) {
    badgeStyle = "bg-blue-50/90 text-blue-800 border-blue-200";
    dotColor = "bg-blue-600";
  }
  // Neutral / Slate
  else if (
    [
      "MANAGER",
      "EMPLOYEE",
      "SHIFTS",
      "TASK",
      "LEAD",
      "SUNDAY",
      "COMPANY_OFF",
      "GENERATED",
      "HOLD",
    ].includes(norm)
  ) {
    badgeStyle = "bg-slate-50 text-slate-700 border-slate-200";
    dotColor = "bg-slate-500";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors select-none",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        badgeStyle,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
      <span>{status?.replace(/_/g, " ")}</span>
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: string;
  comparisonText?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  trend,
  comparisonText,
  isPositive = true,
  icon: Icon,
  iconColor = "text-[#1674B9] bg-blue-50 border-blue-200/80",
  className,
  onClick,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 rounded-xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between relative group",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            iconColor
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
          {value}
        </div>
        {(trend || comparisonText) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-semibold px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border",
                  isPositive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-rose-50 text-rose-700 border-rose-200/80"
                )}
              >
                {trend}
              </span>
            )}
            {comparisonText && (
              <span className="text-slate-500 text-[11px] truncate font-normal">
                {comparisonText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

