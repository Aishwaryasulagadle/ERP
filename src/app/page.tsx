import Link from "next/link";
import { auth } from "@/auth";
import {
  Building2,
  TrendingUp,
  Target,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Receipt,
  UserCheck,
  CheckSquare,
  Globe,
  Database,
  ArrowUpRight,
  Laptop,
  Check,
  SlidersHorizontal,
  CircleDollarSign,
  PieChart,
  ChevronRight,
  Layers,
  Award,
  Zap,
  Lock,
  Workflow,
  CalendarCheck,
  FileCheck2,
  HelpCircle,
  TrendingDown,
  Briefcase,
  KeyRound,
  FileSpreadsheet,
  Gauge,
  LineChart,
  Boxes,
  ShieldAlert,
  FolderGit2,
  MousePointerClick,
  Sparkle,
  Server,
  Terminal,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* 1. Global Announcement / Live Status Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-slate-400">NODE STATUS:</span>
            <span className="text-slate-100 font-semibold text-xs">ERP Core v2.4 Operating Online</span>
            <span className="hidden sm:inline-block text-slate-700">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 text-[11px]">
              <Database className="w-3 h-3 text-blue-400" /> PostgreSQL 16 Relational Engine Active
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-medium">
              <Lock className="w-3 h-3" /> RBAC Enforced
            </span>
            <span className="hidden md:inline-block text-slate-700">•</span>
            <span className="hidden md:inline-block text-slate-300 font-medium">9 Connected ESS Portals</span>
          </div>
        </div>
      </div>

      {/* 2. Top Enterprise Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 erp-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/25 group-hover:scale-105 transition-transform border border-blue-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-slate-900 text-lg">ERP CORE</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold erp-badge-blue tracking-wider">
                  ENTERPRISE
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold tracking-tight">Cloud Business & Workforce Platform</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <span>Capabilities</span>
            </a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">
              Core Modules
            </a>
            <a href="#self-service" className="hover:text-blue-600 transition-colors">
              Self-Service Suite
            </a>
            <a href="#architecture" className="hover:text-blue-600 transition-colors">
              Architecture
            </a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">
              Role Matrix
            </a>
          </nav>

          {/* Action / Auth Buttons */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  <span>Launch Live Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section with Modern Visual Hierarchy */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-[#F8FAFC]">
        {/* Ambient Grid & Glow Accents */}
        <div className="absolute inset-0 bg-grid-slate opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-blue-100/70 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[380px] h-[320px] bg-indigo-100/60 blur-[110px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full erp-badge-blue text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin-slow" />
            <span>Complete Enterprise Business & Workforce Suite</span>
            <span className="text-blue-300">•</span>
            <span className="font-mono text-[11px] font-extrabold text-blue-800">Next.js 16 + Prisma</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              One Unified Operating System For Your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                Enterprise Growth
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              Eliminate disconnected tools. Power your entire company with integrated CRM deal pipelines, real-time sales ledgers, employee time tracking, sprint boards, HR payroll, and self-service portals.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href={session?.user ? "/dashboard" : "/login"}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold shadow-lg"
            >
              <span>{session?.user ? "Enter ERP Dashboard" : "Get Started / Launch Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#modules"
              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold shadow-xs"
            >
              <span>Explore All Modules</span>
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            </a>
          </div>

          {/* 4 Live Operational Metric Cards */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="erp-card p-5 text-left group">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Revenue Flow</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-3 tracking-tight">₹12.4M+</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-time ledger audit</span>
                </div>
              </div>

              <div className="erp-card p-5 text-left group">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>CRM Velocity</span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-3 tracking-tight">99.8%</div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mt-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Lead conversion speed</span>
                </div>
              </div>

              <div className="erp-card p-5 text-left group">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Workforce Sync</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-3 tracking-tight">100%</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Automated time & breaks</span>
                </div>
              </div>

              <div className="erp-card p-5 text-left group">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Self-Service</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-3 tracking-tight">9 Portals</div>
                <div className="flex items-center gap-1.5 text-xs text-purple-600 font-bold mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zero HR bottlenecks</span>
                </div>
              </div>
            </div>

            {/* Platform Mockup Live Frame */}
            <div className="p-2.5 sm:p-3.5 bg-slate-900/10 border border-slate-300 rounded-3xl shadow-2xl erp-glow-blue text-left">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Browser Tab Header */}
                <div className="bg-slate-950 text-slate-300 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>https://erp.enterprise.cloud/live-operations</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold bg-emerald-950/90 text-emerald-400 px-3 py-1 rounded-full border border-emerald-700/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      System Active • 2026
                    </span>
                  </div>
                </div>

                {/* Internal Mockup Dashboard Showcase */}
                <div className="p-6 bg-slate-50/70 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise Operational Control</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Continuous telemetry across Sales, Attendance, and Pipeline</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono erp-badge-blue px-2.5 py-1 rounded-lg">
                        ADMIN CONSOLE VIEW
                      </span>
                    </div>
                  </div>

                  {/* 3 Live Telemetry Modules in Mockup */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sales Lifecycle Pipeline */}
                    <div className="erp-card p-4.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span>Sales Lifecycle</span>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-sm font-black text-slate-900 font-mono">
                        QT-102 → SO-102 → INV-102
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-[85%] rounded-full" />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-blue-700 font-mono font-bold pt-1">
                        <span>Status: Paid & Realized</span>
                        <span>₹1,45,000</span>
                      </div>
                    </div>

                    {/* Target Achievement Bar */}
                    <div className="erp-card p-4.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span>Target Achievement</span>
                        <Target className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ₹7,50,000 / ₹10,00,000
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[75%] rounded-full" />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-emerald-700 font-mono font-bold pt-1">
                        <span>75% Monthly Target Met</span>
                        <span>₹2.5L Rem.</span>
                      </div>
                    </div>

                    {/* Staff Attendance & Floor Rate */}
                    <div className="erp-card p-4.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span>Staff Attendance</span>
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-sm font-black text-slate-900 font-mono">
                        29 Present • 3 On Leave
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full w-[91%] rounded-full" />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-purple-700 font-mono font-bold pt-1">
                        <span>Active Floor Rate: 91%</span>
                        <span>0 Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Enterprise Capabilities Showcase */}
      <section id="features" className="py-16 md:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full erp-badge-blue text-xs font-bold font-mono">
              CORE ENTERPRISE MODULES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Engineered for Complete Corporate Alignment
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Each module connects into real-time relational ledgers, eliminating duplicate data entry and disconnected spreadsheets.
            </p>
          </div>

          <div id="modules" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: CRM & Lead Pipeline */}
            <div className="erp-card p-7 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                    CRM & Lead Pipeline
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Track stages from New, Contacted, Follow-up, to Converted with 1-click customer & order generation.
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Interactive Kanban & List views</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct lead-to-sale conversion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Revenue potential & follow-up scheduler</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>View CRM Engine</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 2: Sales Ledger & Invoicing */}
            <div className="erp-card p-7 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                    Sales Ledger & Invoicing
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Manage targets, profit margins, sales forecasts, returns & credit notes, and the 5-stage lifecycle flow.
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quotation → Order → Invoice → Receipt</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sales representative quota tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Returns, exchanges & credit notes</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>View Sales Suite</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 3: Employee Self-Service */}
            <div id="self-service" className="erp-card p-7 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-purple-600 transition-colors">
                    Employee Self-Service (ESS)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    9 dedicated self-service tools for clock punches, leaves, work logs, overtime, tasks, and queries.
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Attendance correction requests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time leave balance tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Overtime claim submission & ticket desk</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                <span>View ESS Portal</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 4: Tasks & Work Management */}
            <div className="erp-card p-7 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                    Tasks & Work Management
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Delegation, hourly progress logs, sprint boards, priority alerts, and completion tracking.
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Granular hourly task time-logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Task history & progress audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Priority SLA assignment matrix</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                <span>View Sprint Taskboard</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 5: HR, Payroll & Payslips */}
            <div className="erp-card p-7 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">
                    HR, Payroll & Payslips
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Automated salary slips with allowances, PF deductions, tax calculations, and holiday calendars.
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant printable salary slips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Workplace helpdesk resolution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Department & salary band structures</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>View Payroll Engine</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 6: Executive Analytics & Reports */}
            <div className="erp-card p-7 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-rose-600 transition-colors">
                    Executive Analytics & Reports
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Real-time KPI telemetry, client submission reports, cross-metric date filtering, and CSV exports.
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom date-range intelligence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Multi-tiered audit trail log</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exportable Excel/CSV report formats</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
                <span>View Analytics Hub</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Production Architecture & Relational Sync */}
      <section id="architecture" className="py-16 md:py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-400 text-xs font-bold font-mono">
              RELATIONAL INTEGRITY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Built on Modern Enterprise Data Architecture
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Enterprise transactions are secured by ACID compliance, TypeScript type safety, and real-time schema triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <Database className="w-8 h-8 text-blue-400" />
              <h3 className="font-bold text-white text-base">Prisma ORM & PostgreSQL</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Relational schema modeling with cascade safety, foreign key validations, and query optimizations.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <Lock className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-white text-base">NextAuth Role Guardians</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Cryptographically signed JWT sessions enforcing route-level and API-level role constraints.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <Workflow className="w-8 h-8 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Atomic Server Actions</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Server-side business mutations with instant state revalidation, eliminating cache inconsistencies.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <Zap className="w-8 h-8 text-amber-400" />
              <h3 className="font-bold text-white text-base">Turbopack Acceleration</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Instant compile times, sub-second HMR updates, and production-grade bundle tree-shaking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Role-Based Workspaces & Governance Section */}
      <section id="roles" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full erp-badge-amber text-xs font-bold font-mono">
              ROLE-BASED SECURITY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tailored Workspaces For Every Stakeholder
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Strict RBAC ensures employees operate in self-service mode while Admins & Managers retain centralized oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Role */}
            <div className="erp-card p-6 space-y-4 hover:border-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold erp-badge-amber px-2.5 py-1 rounded-lg font-mono">
                  ADMIN ROLE
                </span>
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Full Enterprise Governance</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Configure departments, designations, salary structures, approve leaves/overtime, and manage global settings.
                </p>
              </div>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Global Sales & Margin Override
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Employee Payroll & Staff Salary Setup
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Executive Analytics & CSV Exports
                </li>
              </ul>
            </div>

            {/* Manager Role */}
            <div className="erp-card p-6 space-y-4 hover:border-purple-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold erp-badge-purple px-2.5 py-1 rounded-lg font-mono">
                  MANAGER ROLE
                </span>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Team & Pipeline Leadership</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Assign tasks, review team attendance, monitor CRM lead conversions, and review pending employee queries.
                </p>
              </div>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Team Sprint & Task Allocation
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> CRM Lead Pipeline Distribution
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Attendance & Overtime Verification
                </li>
              </ul>
            </div>

            {/* Employee Role */}
            <div className="erp-card p-6 space-y-4 hover:border-blue-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold erp-badge-blue px-2.5 py-1 rounded-lg font-mono">
                  EMPLOYEE ROLE
                </span>
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Focused Self-Service Portal</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Clock in/out, log daily progress, apply for leave, submit overtime, track personal tickets, and review payslips.
                </p>
              </div>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Biometric Time Punch & Daily Logs
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Personal Leave & Overtime Requests
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Printable Salary Slip Access
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Quick Access Demo Credentials Callout */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-7 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-blue-50/90 border border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider font-mono">
                <KeyRound className="w-4 h-4" /> Ready for Live Evaluation
              </div>
              <h4 className="text-lg font-black text-slate-900">Experience All Enterprise Roles in Demo Mode</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Log in with predefined credentials (<code className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">admin@erp.com</code>, <code className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">manager@erp.com</code>, or <code className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">employee@erp.com</code> / password: <code className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">password123</code>).
              </p>
            </div>
            <Link
              href="/login"
              className="btn-primary shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold"
            >
              <span>Launch Demo Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Corporate Production Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-950 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3.5 md:col-span-2">
              <div className="flex items-center gap-3 text-white font-black text-lg">
                <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <span>ERP CORE Enterprise Operating Suite</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-medium">
                A modern full-stack enterprise resource planning platform engineered with Next.js, Prisma ORM, and PostgreSQL for unified operational velocity.
              </p>
            </div>

            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Platform Modules</h5>
              <ul className="text-xs space-y-2 font-medium">
                <li><a href="#modules" className="hover:text-white transition-colors">CRM & Lead Engine</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Sales & Invoicing</a></li>
                <li><a href="#self-service" className="hover:text-white transition-colors">Employee Self-Service</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">HR & Payroll Suite</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">System & Access</h5>
              <ul className="text-xs space-y-2 font-medium">
                <li><a href="#roles" className="hover:text-white transition-colors">Role-Based Access Control</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Relational Architecture</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In Portal</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Live Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
            <div>
              © 2026 ERP Cloud Systems. All rights reserved. Built for enterprise scale.
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Secured
              </span>
              <span>•</span>
              <span>Next.js 16 (Turbopack)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
