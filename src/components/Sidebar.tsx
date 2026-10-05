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
  Bell,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      group: "MAIN",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
      ],
    },
    ...(isSalesOrAdmin
      ? [
          {
            group: "CRM",
            items: [
              { name: "Leads Pipeline", href: "/crm", icon: Target, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], badge: "New", visible: true },
              { name: "Customers", href: "/sales?tab=CUSTOMERS", icon: Users, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Follow-ups", href: "/crm?tab=FOLLOW_UP", icon: Clock, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
            ],
          },
          {
            group: "SALES",
            items: [
              { name: "Orders & Deals", href: "/sales", icon: TrendingUp, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Quotations", href: "/sales?tab=QUOTATIONS", icon: FileText, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Invoices Ledger", href: "/sales?tab=INVOICES", icon: FileText, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
              { name: "Payments", href: "/sales?tab=PAYMENTS", icon: CreditCard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"], visible: true },
            ],
          },
        ]
      : []),
    {
      group: "PEOPLE & HR",
      items: [
        { name: "Staff Directory", href: "/employees", icon: Users, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Attendance & Punch", href: "/employees?tab=ATTENDANCE", icon: Clock, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Leave & WFH", href: "/employees?tab=LEAVE", icon: Calendar, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Salary Slips", href: "/employees?tab=PAYROLL", icon: CreditCard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Holidays & Weekends", href: "/employees?tab=HOLIDAYS", icon: Sparkles, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Helpdesk Queries", href: "/employees?tab=QUERIES", icon: Activity, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "Sprint Tasks", href: "/employees?tab=TASKS", icon: CheckSquare, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
        { name: "My Work Reports", href: "/employee/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
      ],
    },
    ...(isClientsVisible
      ? [
          {
            group: "CLIENTS & PROJECTS",
            items: [
              { name: "Active Clients", href: "/reports?tab=CLIENTS", icon: Building2, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
              { name: "Progress Reports", href: "/reports?tab=PROGRESS_REPORTS", icon: FileSpreadsheet, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
              { name: "Financials & P&L", href: "/reports?tab=FINANCIALS", icon: DollarSign, roles: ["ADMIN", "MANAGER"] },
            ],
          },
        ]
      : []),
    {
      group: "SYSTEM",
      items: [
        { name: "Audit Trail", href: "/settings", icon: ShieldCheck, roles: ["ADMIN"] },
        { name: "Settings & RBAC", href: "/settings?tab=SECURITY", icon: Settings, roles: ["ADMIN"] },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 h-screen sticky top-0 z-40 select-none shadow-xs",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-600/20">
            <Building2 className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 block truncate">MY ERP</span>
              <span className="text-[10px] text-blue-600 font-mono tracking-wider font-semibold uppercase block">
                Enterprise SaaS
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden md:block"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((i) => i.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">
                  {group.group}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer",
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      )}
                    />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.name}</span>
                        {(item as any).badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
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

      {/* Collapse Toggle Footer for Mobile / Bottom display */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono text-slate-500">System v1.0.0</span>
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
