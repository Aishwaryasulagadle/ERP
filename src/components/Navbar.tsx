"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Building2,
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
  Clock,
  CheckSquare,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  ChevronDown,
  Menu,
  Layers,
} from "lucide-react";
import { performGlobalSearch } from "@/actions/reports";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Cards";

interface NavbarProps {
  user: any;
  notifications?: any[];
}

export function Navbar({ user, notifications = [] }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const userRole = user?.role || "EMPLOYEE";

  // Ctrl + K Global Search Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandModal((prev) => !prev);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setShowCommandModal(false);
        setSearchResults(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isSalesOrAdmin =
    userRole === "ADMIN" ||
    (user?.department && user.department.toLowerCase().includes("sales")) ||
    (user?.email && user.email.toLowerCase().includes("sales"));

  const isSalesStaff =
    userRole === "EMPLOYEE" &&
    ((user?.department && user.department.toLowerCase().includes("sales")) ||
      (user?.email && user.email.toLowerCase().includes("sales")));

  const isClientsVisible = !isSalesStaff;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visible: true },
    { name: "CRM / Leads", href: "/crm", icon: Target, visible: isSalesOrAdmin },
    { name: "Sales", href: "/sales", icon: TrendingUp, visible: isSalesOrAdmin },
    { name: "Employees", href: "/employees", icon: Users, visible: true },
    { name: "Clients", href: "/reports", icon: Layers, visible: isClientsVisible },
    { name: "Settings", href: "/settings", icon: Settings, visible: userRole === "ADMIN" },
  ];

  const filteredNav = navigation.filter((item) => item.visible);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await performGlobalSearch(val);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
        {/* Left Brand & Module Navigation Links */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-black shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform border border-blue-400/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-sm">ERP CORE</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                ENTERPRISE
              </span>
            </div>
          </Link>

          {/* Top Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-blue-600" : "text-slate-500")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-3">
          {/* Global Search Button with Ctrl + K */}
          <button
            onClick={() => setShowCommandModal(true)}
            className="flex items-center justify-between w-40 sm:w-60 lg:w-72 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-white hover:border-blue-400 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search records...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-600 bg-white border border-slate-200 rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center font-mono shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold border border-blue-200">
                    {notifications.length} Unread
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-slate-400">All notifications caught up</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/20 shadow-sm">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="hidden md:block">
                <span className="text-xs font-semibold text-slate-900 block truncate max-w-[90px]">
                  {user?.name || "Admin"}
                </span>
                <span className="text-[10px] text-blue-600 font-mono font-semibold block">{userRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{user?.name || "Admin"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || "admin@erp.local"}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={userRole} />
                  </div>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Enterprise Settings</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileNavOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-3 shadow-lg sticky top-16 z-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Command / Search Modal (Ctrl + K) */}
      {showCommandModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search leads, customers, orders, employees, tasks... (Press ESC to exit)"
                className="w-full bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => {
                  setShowCommandModal(false);
                  setSearchResults(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grouped Search Results */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
              {isSearching && <p className="text-center py-6 text-xs text-slate-500 font-mono">Searching records...</p>}

              {searchResults && (
                <>
                  {searchResults.leads?.length > 0 && (
                    <div>
                      <div className="px-2 pb-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                        CRM Leads ({searchResults.leads.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.leads.map((l: any) => (
                          <div
                            key={l.id}
                            onClick={() => {
                              setShowCommandModal(false);
                              router.push(`/crm`);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{l.customerName}</p>
                              <p className="text-[11px] text-slate-500">{l.company || l.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={l.status} />
                              <span className="text-xs font-mono font-bold text-emerald-600">
                                ₹{l.expectedValue?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.sales?.length > 0 && (
                    <div>
                      <div className="px-2 pb-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                        Sales Orders ({searchResults.sales.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.sales.map((o: any) => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setShowCommandModal(false);
                              router.push(`/sales`);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{o.orderCode}</p>
                              <p className="text-[11px] text-slate-500">{o.customer?.name || "Customer"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={o.paymentStatus} />
                              <span className="text-xs font-mono font-bold text-emerald-600">
                                ₹{o.totalAmount?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.employees?.length > 0 && (
                    <div>
                      <div className="px-2 pb-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                        Employees ({searchResults.employees.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.employees.map((e: any) => (
                          <div
                            key={e.id}
                            onClick={() => {
                              setShowCommandModal(false);
                              router.push(`/employees`);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{e.user?.name}</p>
                              <p className="text-[11px] text-slate-500">{e.designation?.name || "Staff"}</p>
                            </div>
                            <span className="text-xs font-mono text-slate-500">{e.employeeCode}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.tasks?.length > 0 && (
                    <div>
                      <div className="px-2 pb-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">
                        Tasks ({searchResults.tasks.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.tasks.map((t: any) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setShowCommandModal(false);
                              router.push(`/tasks`);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{t.title}</p>
                              <p className="text-[11px] text-slate-500">{t.taskCode}</p>
                            </div>
                            <StatusBadge status={t.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.values(searchResults).every((arr: any) => arr?.length === 0) && (
                    <p className="text-center py-6 text-xs text-slate-400">No matching enterprise records found</p>
                  )}
                </>
              )}

              {!searchQuery && (
                <div className="py-6 text-center">
                  <p className="text-xs font-medium text-slate-700">Quick Jump Navigation</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {filteredNav.map((n) => (
                      <Link
                        key={n.name}
                        href={n.href}
                        onClick={() => setShowCommandModal(false)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                      >
                        {n.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
