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
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
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
      {/* JDS Geometric Brand Icon */}
      <div
        className={`${iconDimensions} relative rounded-xl bg-gradient-to-br from-[#1674B9] via-[#14558A] to-[#0D3B66] p-1.5 shadow-sm border border-[#1674B9]/30 flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 hover:scale-105`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Top-Right Accent Shape (JDS Orange) */}
          <path
            d="M26 6C26 4.89543 26.8954 4 28 4H40C42.2091 4 44 5.79086 44 8V20C44 21.1046 43.1046 22 42 22H38C36.8954 22 36 21.1046 36 20V12H28C26.8954 12 26 11.1046 26 10V6Z"
            fill="#F28C16"
          />
          {/* Bottom-Left Accent Shape (JDS Emerald Green) */}
          <path
            d="M4 28C4 26.8954 4.89543 26 6 26H10C11.1046 26 12 26.8954 12 28V36H20C21.1046 36 22 36.8954 22 38V42C22 43.1046 21.1046 44 20 44H8C5.79086 44 4 42.2091 4 40V28Z"
            fill="#08764D"
          />
          {/* Central Connecting Diamond / Node (JDS White / Deep Blue) */}
          <rect
            x="14"
            y="14"
            width="20"
            height="20"
            rx="5"
            fill="#FFFFFF"
            className="drop-shadow-sm"
          />
          {/* Interior JDS Monogram */}
          <path
            d="M19 19H29M24 19V29M24 29H20"
            stroke="#14558A"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes} font-black tracking-tight text-slate-900 leading-tight flex items-center`}
            >
              <span className="text-[#1674B9]">JDS</span>
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
