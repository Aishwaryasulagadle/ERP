"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DashboardChartsProps {
  salesData: any[];
  leadData: any[];
  taskStats: any;
}

export function DashboardCharts({ salesData, leadData, taskStats }: DashboardChartsProps) {
  // Brand color palette for pipeline and tasks
  const brandColors = ["#1674B9", "#08764D", "#F28C16", "#64748B", "#8B5CF6"];

  const taskChartData = [
    { name: "Completed", value: taskStats?.completedTasks || 0, color: "#08764D" },
    { name: "In Progress", value: taskStats?.inProgressTasks || 0, color: "#1674B9" },
    { name: "Pending", value: taskStats?.pendingTasks || 0, color: "#F28C16" },
    { name: "Overdue", value: taskStats?.overdueTasks || 0, color: "#EF4444" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Sales & Revenue Trajectory (Area Chart) */}
      <div className="lg:col-span-8 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Revenue & Sales Trajectory</h3>
            <p className="text-xs text-[#64748B]">Weekly deal velocity & financial turnover</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1674B9] inline-block" /> Sales (₹)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#08764D] inline-block" /> Revenue (₹)
            </span>
          </div>
        </div>

        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1674B9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1674B9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#08764D" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#08764D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  color: "#1E293B",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.08)",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), "Amount"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#1674B9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="revenue" stroke="#08764D" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. CRM Pipeline Stage Distribution (Pie Chart) */}
      <div className="lg:col-span-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">CRM Lead Pipeline</h3>
          <p className="text-xs text-[#64748B]">Distribution across sales conversion stages</p>
        </div>

        <div className="h-52 w-full relative flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leadData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="count"
              >
                {leadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || brandColors[index % brandColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  color: "#1E293B",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
          {leadData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || brandColors[index % brandColors.length] }} />
              <span className="text-[#64748B] truncate text-[11px]">{item.name}:</span>
              <span className="font-semibold text-slate-900 font-mono text-[11px]">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

