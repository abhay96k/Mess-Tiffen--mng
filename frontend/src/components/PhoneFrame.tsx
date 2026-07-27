import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] p-0 sm:p-4 md:p-6 select-none">
      {/* Outer Real-World Mobile Device Container */}
      <div className="relative w-full h-screen sm:w-[412px] sm:h-[892px] sm:rounded-[50px] sm:border-[10px] sm:border-[#1e293b] bg-slate-50 shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Dynamic Island / Camera Notch */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-[110px] h-[28px] bg-slate-950 rounded-full z-50 items-center justify-between px-3 shadow-md">
          <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-700"></div>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
        </div>

        {/* Speaker Bar */}
        <div className="hidden sm:block absolute top-1 left-1/2 -translate-x-1/2 w-[48px] h-[4px] bg-slate-800 rounded-full z-50"></div>

        {/* Screen Content Wrapper */}
        <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden relative">
          
          {/* Top Status Bar */}
          <div className="w-full h-11 bg-transparent shrink-0 flex items-center justify-between px-6 pt-3 select-none text-[13px] font-bold text-slate-800 z-40 sm:flex hidden">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-800 fill-current" viewBox="0 0 24 24">
                <path d="M2 17h2v4H2v-4zm4-4h2v8H6v-8zm4-4h2v12h-2V9zm4-4h2v16h-2V5zm4-4h2v20h-2V1z"/>
              </svg>
              <svg className="w-4 h-4 text-slate-800 fill-current" viewBox="0 0 24 24">
                <path d="M12 21l-12-12c5-5 14-5 19 0l-7 12zm0-15c-3 0-6 1-8 3l8 8 8-8c-2-2-5-3-8-3z"/>
              </svg>
              <div className="w-5.5 h-3 border border-slate-800 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-4 bg-emerald-600 rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Actual Application Content */}
          <div className="flex-1 flex flex-col overflow-hidden pt-0 sm:pt-0">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="hidden sm:block w-full h-6 bg-transparent shrink-0 relative z-40 select-none">
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>

        </div>

      </div>
    </div>
  );
}
