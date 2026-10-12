"use client";

import { ReactNode, useState } from "react";
import { LucideIcon, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubNavTab {
  key: string;
  label: string;
  icon?: LucideIcon;
  count?: number | string;
  badgeColor?: string;
  description?: string;
}

interface PageLayoutProps {
  moduleTitle: string;
  moduleSubtitle?: string;
  moduleIcon?: LucideIcon;
  badge?: string;
  tabs?: SubNavTab[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  headerActions?: ReactNode;
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}

export function PageLayout({
  moduleTitle,
  moduleSubtitle,
  moduleIcon: ModuleIcon,
  badge,
  tabs = [],
  activeTab,
  onTabChange,
  headerActions,
  children,
  defaultSidebarOpen = true,
}: PageLayoutProps) {
  const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(defaultSidebarOpen);

  const hasTabs = tabs && tabs.length > 0 && onTabChange;

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-3.75rem)] bg-[#F5F7FA]">
      {/* Module Operations Sub-Sidebar (Optional) */}
      {hasTabs && isSubSidebarOpen && (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#E2E8F0] flex flex-col shrink-0 p-3 space-y-3 transition-all shadow-[1px_0_2px_0_rgba(0,0,0,0.02)]">
          <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {ModuleIcon && (
                  <div className="w-7 h-7 rounded-lg bg-[#1674B9]/10 border border-[#1674B9]/20 flex items-center justify-center text-[#1674B9] shrink-0">
                    <ModuleIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-xs text-slate-900 truncate">{moduleTitle}</h2>
                    {badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase bg-[#1674B9]/10 text-[#14558A] border border-[#1674B9]/20">
                        {badge}
                      </span>
                    )}
                  </div>
                  {moduleSubtitle && (
                    <p className="text-[10px] text-[#64748B] truncate mt-0.5">{moduleSubtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubSidebarOpen(false)}
                title="Collapse views"
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
              Views & Filters
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-[#1674B9]/10 text-[#14558A] font-bold border border-[#1674B9]/20 shadow-2xs"
                        : "text-[#1E293B] hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {Icon && (
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-[#1674B9]" : "text-[#64748B]"
                          )}
                        />
                      )}
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {tab.count !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ml-2",
                          isActive
                            ? "bg-[#1674B9] text-white"
                            : tab.badgeColor || "bg-slate-100 text-slate-700 border border-slate-200"
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
      )}

      {/* Main Workspace */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-[#F5F7FA]">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {hasTabs && !isSubSidebarOpen && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E2E8F0] mb-4 shadow-xs">
              <button
                type="button"
                onClick={() => setIsSubSidebarOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#1674B9]/10 text-[#14558A] hover:bg-[#1674B9] hover:text-white border border-[#1674B9]/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                <span>Show Operations Filter</span>
              </button>
              <span className="text-xs text-[#64748B]">
                Active view: <span className="text-slate-900 font-bold">{tabs.find((t) => t.key === activeTab)?.label || activeTab}</span>
              </span>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

