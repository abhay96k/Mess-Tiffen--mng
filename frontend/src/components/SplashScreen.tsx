import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import tiffinLogo from '../assets/tiffin_logo_3d.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Force DOM properties for strict iOS Safari compliance
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');

      const attemptPlay = async () => {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('iOS Autoplay restricted by browser:', err);
          setIsBlocked(true);
        }
      };

      attemptPlay();
    }

    // Safety completion timer strictly capping splash at 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 5) {
      onComplete();
    }
  };

  const handleStartPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBlocked(false);
      }).catch(() => {
        onComplete();
      });
    } else {
      onComplete();
    }
  };

  return (
    <div 
      onClick={handleStartPlay}
      onTouchStart={handleStartPlay}
      className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-between p-8 text-[#2C332E] z-50 overflow-hidden select-none cursor-pointer"
    >
      {/* Video Container - Hidden until actively playing to prevent native iOS play button overlay */}
      <video
        ref={videoRef}
        src="/Tiffin_logo_splash_animation_1080p_20261004185906.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        onPlay={() => {
          setIsPlaying(true);
          setIsBlocked(false);
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        onError={(e) => {
          console.error('Splash video error:', e);
          onComplete();
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Fallback Brand Splash poster when video is loading or blocked by iOS Safari policy */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-between p-8 z-10">
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* 3D Tiffin Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="w-32 h-32 mb-6 relative flex items-center justify-center"
            >
              <img src={tiffinLogo} alt="Mess Tiffin" className="w-full h-full object-contain drop-shadow-xl" />
            </motion.div>

            {/* Title matching logo graphic */}
            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-black tracking-tight text-center mb-1 flex items-center gap-2"
            >
              <span className="text-[#35523A]">MESS</span>
              <span className="text-[#EA6A14]">TIFFIN</span>
            </motion.h1>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xs tracking-[0.25em] text-[#68756C] uppercase font-bold text-center mb-6"
            >
              — MANAGEMENT SYSTEM —
            </motion.p>
          </div>

          {/* Interactive Tap Prompt if iOS Safari required touch */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-[#35523A] text-white text-xs font-bold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce"
            >
              <span>Tap Anywhere to Open</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </motion.div>
          )}
        </div>
      )}

      {/* Sleek Skip Button Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-6 right-6 z-30"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="bg-black/40 hover:bg-black/70 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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




