import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Attempt auto-play programmatically
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Video autoplay failed or was prevented:', err);
      });
    }

    // Auto-complete exactly after 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleTimeUpdate = () => {
    // Cut off playback at 5 seconds if video is longer
    if (videoRef.current && videoRef.current.currentTime >= 5) {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Intro Video Element */}
      <video
        ref={videoRef}
        src="/Tiffin_logo_splash_animation_1080p_20261004185906.mp4"
        autoPlay
        muted
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        onError={(e) => {
          console.error('Splash video loading error:', e);
          onComplete();
        }}
        className="w-full h-full object-cover"
      />

      {/* Sleek Skip Button Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 right-6 z-20"
      >
        <button
          onClick={onComplete}
          className="bg-black/40 hover:bg-black/70 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
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


