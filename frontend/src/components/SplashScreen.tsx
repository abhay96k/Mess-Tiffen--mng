import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Force muted properties directly on DOM element for iOS Safari autoplay compliance
      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');

      // Programmatic autoplay request
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('iOS Autoplay prevented by browser/Low Power mode:', err);
          // If iOS blocks initial autoplay, play on first user interaction
          const handleFirstTouch = () => {
            video.play().catch(() => onComplete());
          };
          window.addEventListener('touchstart', handleFirstTouch, { once: true });
          window.addEventListener('click', handleFirstTouch, { once: true });
        });
      }
    }

    // Auto-complete strictly after 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleTimeUpdate = () => {
    // Cut off playback at 5 seconds
    if (videoRef.current && videoRef.current.currentTime >= 5) {
      onComplete();
    }
  };

  const handleContainerClick = () => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => onComplete());
    }
  };

  return (
    <div 
      onClick={handleContainerClick}
      onTouchStart={handleContainerClick}
      className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-center z-50 overflow-hidden select-none cursor-pointer"
    >
      {/* Intro Video Element with pointer-events-none to eliminate iOS native controls */}
      <video
        ref={videoRef}
        src="/Tiffin_logo_splash_animation_1080p_20261004185906.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        onError={(e) => {
          console.error('Splash video loading error:', e);
          onComplete();
        }}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Sleek Skip Button Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-6 right-6 z-20"
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



