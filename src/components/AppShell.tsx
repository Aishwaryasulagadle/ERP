"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";

interface AppShellProps {
  user: any;
  notifications: any[];
  children: React.ReactNode;
}

export function AppShell({ user, notifications, children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar user={user} notifications={notifications} />

      {/* Main Full-Width Content Area */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-[#F8FAFC]">
        {children}
      </div>
    </div>
  );
}
