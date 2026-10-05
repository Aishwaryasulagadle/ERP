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

  let bg = "bg-slate-100 text-slate-700 border-slate-200";

  // Success / JDS Emerald Green (#08764D)
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
    ].includes(norm)
  ) {
    bg = "bg-[#08764D]/10 text-[#08764D] border-[#08764D]/25 font-semibold";
  }
  // Pending / JDS Orange Accent (#F28C16)
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
    ].includes(norm)
  ) {
    bg = "bg-[#F28C16]/10 text-[#C2410C] border-[#F28C16]/30 font-semibold";
  }
  // Danger / High Alert / Red
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
    bg = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
  }
  // Primary / JDS Deep Blue (#1674B9)
  else if (
    [
      "NEW",
      "LEAVE",
      "ADMIN",
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
    bg = "bg-[#1674B9]/10 text-[#14558A] border-[#1674B9]/25 font-bold";
  }
  // Neutral / Slate
  else if (
    [
      "MANAGER",
      "SHIFTS",
      "TASK",
      "LEAD",
      "SUNDAY",
      "COMPANY_OFF",
      "GENERATED",
      "HOLD",
    ].includes(norm)
  ) {
    bg = "bg-slate-100 text-slate-700 border-slate-200 font-medium";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border tracking-wide font-mono",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        bg,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90 shrink-0" />
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
  iconColor = "text-[#1674B9] bg-[#1674B9]/10 border-[#1674B9]/20",
  className,
  onClick,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group flex flex-col justify-between relative overflow-hidden",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">{title}</span>
        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3.5">
        <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-sans">{value}</div>
        {(trend || comparisonText) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-bold font-mono px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1",
                  isPositive ? "bg-[#08764D]/10 text-[#08764D] border border-[#08764D]/25" : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {trend}
              </span>
            )}
            {comparisonText && <span className="text-slate-500 text-[11px] truncate font-medium">{comparisonText}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

