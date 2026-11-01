import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-[#171717] flex items-center justify-center text-white">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium tracking-tight text-[#171717]">
            ClipDown
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#777777] bg-[#F0F0ED] px-1.5 py-0.5 rounded">
            Prototype
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[12px] text-[#777777]">
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#24865B] animate-pulse" />
          Fluid Engine
        </span>
        <span className="text-[#E5E5E5] hidden sm:inline">|</span>
        <span className="font-mono text-[11px] text-[#777777]">v1.0.4</span>
      </div>
    </header>
  );
};
