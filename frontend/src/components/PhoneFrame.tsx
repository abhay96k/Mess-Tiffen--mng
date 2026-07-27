import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#122018] p-0 sm:p-4 md:p-6 select-none">
      {/* Outer Glassmorphic Forest Phone Container */}
      <div className="relative w-full h-screen sm:w-[412px] sm:h-[892px] sm:rounded-[52px] sm:border-[10px] sm:border-[#1e3427] bg-forest-gradient shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Dynamic Island / Camera Notch */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-[#0c1610] rounded-full z-50 items-center justify-between px-3 border border-white/10 shadow-lg">
          <div className="w-3.5 h-3.5 bg-black rounded-full border border-white/20"></div>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>

        {/* Speaker Bar */}
        <div className="hidden sm:block absolute top-1 left-1/2 -translate-x-1/2 w-[48px] h-[4px] bg-white/20 rounded-full z-50"></div>

        {/* Screen Content Wrapper */}
        <div className="w-full h-full flex flex-col bg-forest-gradient overflow-hidden relative">
          
          {/* Top Status Bar Placeholder */}
          <div className="w-full h-11 bg-transparent shrink-0 flex items-center justify-between px-6 pt-3 select-none text-[13px] font-semibold text-white z-40 sm:flex hidden">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M2 17h2v4H2v-4zm4-4h2v8H6v-8zm4-4h2v12h-2V9zm4-4h2v16h-2V5zm4-4h2v20h-2V1z"/>
              </svg>
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 21l-12-12c5-5 14-5 19 0l-7 12zm0-15c-3 0-6 1-8 3l8 8 8-8c-2-2-5-3-8-3z"/>
              </svg>
              <div className="w-5.5 h-3 border border-white/60 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-4 bg-emerald-400 rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Actual Application Content */}
          <div className="flex-1 flex flex-col overflow-hidden pt-0 sm:pt-0">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="hidden sm:block w-full h-6 bg-transparent shrink-0 relative z-40 select-none">
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/30 rounded-full"></div>
          </div>

        </div>

      </div>
    </div>
  );
}
