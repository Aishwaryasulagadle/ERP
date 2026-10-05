"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  Clock,
  TrendingUp,
  FileText,
  CreditCard,
  CheckSquare,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  MapPin,
  CalendarCheck,
  FolderKanban,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JdsLogo } from "@/components/ui/JdsLogo";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
  userDepartment?: string;
}

export function Sidebar({ isCollapsed, onToggleCollapse, userRole = "ADMIN", userDepartment = "" }: SidebarProps) {
  const pathname = usePathname();

  const isSalesOrAdmin =
    userRole === "ADMIN" ||
    (userDepartment && userDepartment.toLowerCase().includes("sales"));

  const isSalesStaff =
    userRole === "EMPLOYEE" &&
    (userDepartment && userDepartment.toLowerCase().includes("sales"));

  const isClientsVisible = !isSalesStaff;

  const navigationGroups = [
    {
      group: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
      ],
    },
    ...(isSalesOrAdmin
      ? [
          {
            group: "Sales & CRM",
            items: [
              { name: "CRM & Leads", href: "/crm", icon: Target, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], badge: "Active", visible: true },
              { name: "Sales Management", href: "/sales", icon: TrendingUp, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Quotations", href: "/sales?tab=QUOTATIONS", icon: FileText, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Invoices & Ledger", href: "/sales?tab=INVOICES", icon: FileSpreadsheet, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Payments", href: "/sales?tab=PAYMENTS", icon: CreditCard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Customer Directory", href: "/sales?tab=CUSTOMERS", icon: Users, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
            ],
          },
        ]
      : []),
    {
      group: "Workforce & HR",
      items: [
        { name: "Employee Directory", href: "/employees", icon: Users, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Attendance", href: "/employees?tab=ATTENDANCE", icon: Clock, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Leave Management", href: "/employees?tab=LEAVE", icon: CalendarCheck, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Employee Tracking", href: "/employee/reports", icon: MapPin, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Task Management", href: "/employees?tab=TASKS", icon: CheckSquare, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Payroll & Salary Slips", href: "/employees?tab=PAYROLL", icon: CreditCard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Helpdesk & Queries", href: "/employees?tab=QUERIES", icon: Activity, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
      ],
    },
    ...(isClientsVisible
      ? [
          {
            group: "Projects & Operations",
            items: [
              { name: "Client Deliverables", href: "/reports", icon: Layers, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
              { name: "Progress Tracker", href: "/reports?tab=TIMELINE", icon: LineChart, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
              { name: "Reports & Analytics", href: "/reports?tab=ANALYTICS", icon: PieChart, roles: ["ADMIN", "MANAGER"] },
            ],
          },
        ]
      : []),
    {
      group: "Administration",
      items: [
        { name: "System Settings", href: "/settings?tab=SECURITY", icon: Settings, roles: ["ADMIN"] },
        { name: "Audit Trail", href: "/settings", icon: ShieldCheck, roles: ["ADMIN"] },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 transition-all duration-200 h-screen sticky top-0 z-40 select-none shadow-[1px_0_3px_0_rgba(0,0,0,0.02)]",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header with JDS Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0] bg-white">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden group">
          <JdsLogo size="sm" showText={!isCollapsed} subtitle="Enterprise" />
        </Link>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((i) => i.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="space-y-0.5">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] tracking-wider uppercase font-mono">
                  {group.group}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer relative",
                      isActive
                        ? "bg-[#1674B9]/10 text-[#14558A] font-bold"
                        : "text-[#1E293B] hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#1674B9] rounded-r-full" />
                    )}
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-[#1674B9]" : "text-[#64748B] group-hover:text-slate-900"
                      )}
                    />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.name}</span>
                        {(item as any).badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#08764D]/10 text-[#08764D] border border-[#08764D]/20">
                            {(item as any).badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B] bg-slate-50/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#08764D] animate-pulse" />
            <span className="text-[11px] font-mono font-medium text-slate-600">JDS Core v2.4</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer w-full flex items-center justify-center md:hidden"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

