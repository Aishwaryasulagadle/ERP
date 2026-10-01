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
  const taskChartData = [
    { name: "Completed", value: taskStats.completedTasks, color: "#10B981" },
    { name: "In Progress", value: taskStats.inProgressTasks, color: "#3B82F6" },
    { name: "Pending", value: taskStats.pendingTasks, color: "#F59E0B" },
    { name: "Overdue", value: taskStats.overdueTasks, color: "#EF4444" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Sales & Revenue Trend (Area Chart) */}
      <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue & Sales Trajectory</h3>
            <p className="text-xs text-slate-500">Weekly deal velocity & financial turnover</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Sales (₹)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Gross (₹)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "12px",
                  color: "#0F172A",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), "Amount"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. CRM Pipeline Stage Distribution (Pie Chart) */}
      <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">CRM Lead Pipeline</h3>
          <p className="text-xs text-slate-500">Distribution across sales conversion stages</p>
        </div>

        <div className="h-56 w-full relative flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leadData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {leadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "12px",
                  color: "#0F172A",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {leadData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-500 truncate">{item.name}:</span>
              <span className="font-semibold text-slate-800">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
