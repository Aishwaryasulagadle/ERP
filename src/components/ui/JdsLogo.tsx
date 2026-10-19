import React from "react";

interface JdsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
}

export function JdsLogo({
  className = "",
  size = "md",
  showText = true,
  subtitle = "ERP Core",
}: JdsLogoProps) {
  const iconDimensions = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }[size];

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  }[size];

  const subSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-sm",
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Authentic Jisnu Brand Logo */}
      <div
        className={`${iconDimensions} relative rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200 bg-white p-0.5 transition-transform duration-200 hover:scale-105`}
      >
        <img
          src="/icon.jpeg"
          alt="Jisnu Logo"
          className="w-full h-full object-cover rounded-[10px]"
        />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes} font-bold tracking-tight text-slate-900 leading-tight flex items-center`}
            >
              <span className="text-[#1674B9]">JISNU</span>
              <span className="ml-1 text-slate-800">ERP</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1674B9]/10 text-[#14558A] border border-[#1674B9]/20 uppercase">
              Core
            </span>
          </div>
          {subtitle && (
            <span
              className={`${subSizes} text-[#64748B] font-semibold tracking-tight uppercase truncate`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
