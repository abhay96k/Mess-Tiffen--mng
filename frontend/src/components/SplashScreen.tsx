import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import tiffinLogo from '../assets/tiffin_logo_3d.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');

      // Attempt immediate background video autoplay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            // Autoplay restricted by browser policy (e.g. iOS Low Power mode)
            // Native fallback 3D animation handles the splash automatically
            setIsVideoPlaying(false);
          });
      }
    }

    // Auto-complete and transition to Login screen after 4 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 4.5) {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-between p-8 text-[#2C332E] z-50 overflow-hidden select-none">
      {/* Background Video Layer - Fades in if allowed by browser policy */}
      <video
        ref={videoRef}
        src="/Tiffin_logo_splash_animation_1080p_20261004185906.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        onPlay={() => setIsVideoPlaying(true)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        onError={() => setIsVideoPlaying(false)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${
          isVideoPlaying ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      />

      {/* Seamless 60fps Native Animated 3D Splash (Runs automatically on all devices) */}
      <div className={`absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-between p-8 z-20 transition-opacity duration-500 ${
        isVideoPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        
        {/* Soft Background Rays */}
        <div className="absolute inset-0 bg-radial from-amber-100/40 via-transparent to-transparent pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          {/* Floating 3D Tiffin Logo with shimmer glow */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
            transition={{
              scale: { type: 'spring', stiffness: 100, damping: 15 },
              opacity: { duration: 0.6 },
              y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
            }}
            className="w-36 h-36 mb-6 relative flex items-center justify-center"
          >
            {/* Glowing ring under logo */}
            <div className="absolute inset-2 bg-[#EA6A14]/15 rounded-full blur-xl animate-pulse" />
            
            <img 
              src={tiffinLogo} 
              alt="Mess Tiffin" 
              className="w-full h-full object-contain drop-shadow-2xl relative z-10" 
            />
          </motion.div>

          {/* Title matching reference image brand design */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-2">
              <span className="text-[#35523A]">MESS</span>
              <span className="text-[#EA6A14]">TIFFIN</span>
            </h1>
            
            <p className="text-[11px] tracking-[0.25em] text-[#68756C] uppercase font-bold mt-2">
              — MANAGEMENT SYSTEM —
            </p>
          </motion.div>
        </div>

        {/* Elegant Automated Loading Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[200px] flex flex-col items-center gap-3 mb-6 relative z-10"
        >
          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-[#EAE4D9] rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.8, ease: "linear" }}
              className="h-full bg-gradient-to-r from-[#35523A] via-[#EA6A14] to-[#35523A] rounded-full"
            />
          </div>
          <span className="text-[10px] font-extrabold tracking-widest text-[#35523A]/70 uppercase">
            LOADING
          </span>
        </motion.div>
      </div>

      {/* Sleek Skip Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-6 right-6 z-30"
      >
        <button
          type="button"
          onClick={onComplete}
          className="bg-black/30 hover:bg-black/60 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Skip</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}





