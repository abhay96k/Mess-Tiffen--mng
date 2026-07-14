import { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2800); // 2.8 seconds splash time
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-primary flex flex-col items-center justify-between p-8 text-white z-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
          className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-xs border border-white/20 shadow-lg relative overflow-hidden"
        >
          {/* Glowing background ring */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 rounded-full animate-pulse"></div>
          
          {/* Custom SVG Vector Tiffin/Food Box Logo */}
          <svg className="w-12 h-12 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </motion.div>

        {/* System Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-4xl font-extrabold text-white tracking-tight text-center mb-1 drop-shadow-sm"
        >
          Mess Tiffin
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xs tracking-[0.25em] text-white/70 uppercase font-semibold text-center mb-6"
        >
          Management System
        </motion.p>

        {/* Hotpot Emoji & Divider line */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 120, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex items-center gap-3 my-2"
        >
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-xl leading-none animate-bounce" style={{ animationDuration: '2.5s' }}>🍲</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-sm font-medium italic text-primary-light text-center px-4 tracking-wide max-w-[280px]"
        >
          Manage Meals. Track Attendance. Simplify Life.
        </motion.p>
      </div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex flex-col items-center gap-3 mb-12"
      >
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <span className="text-xs text-white/50 font-medium tracking-widest">LOADING</span>
      </motion.div>
    </div>
  );
}
