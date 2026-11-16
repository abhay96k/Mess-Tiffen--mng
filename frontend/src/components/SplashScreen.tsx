import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import tiffinLogo from '../assets/tiffin_logo_3d.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const VIDEO_START_TIME = 2.22;
const VIDEO_END_TIME = 6.72; // Plays for ~4.5 seconds of animation

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const hasSeekedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Direct DOM property assignment required for reliable mobile/desktop browser autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');

    const handleReady = () => {
      // Seek once to 2.22s
      if (!hasSeekedRef.current) {
        hasSeekedRef.current = true;
        try {
          video.currentTime = VIDEO_START_TIME;
        } catch (e) {
          console.warn('Initial seek failed:', e);
        }
      }

      // Start playback cleanly after initial position is set
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If browser strictly blocks autoplay (e.g. low power mode), switch to fallback
          if (err.name === 'NotAllowedError') {
            console.warn('Autoplay blocked by browser policy, showing fallback graphic');
            setHasVideoError(true);
          } else {
            // Ignore AbortError caused by normal media seeking
            console.log('Playback notice:', err.message);
          }
        });
      }
    };

    // If metadata already loaded, trigger immediately; otherwise wait for loadedmetadata
    if (video.readyState >= 1) {
      handleReady();
    } else {
      video.addEventListener('loadedmetadata', handleReady, { once: true });
    }

    // Safety timeout: transition after 7 seconds if unattended
    const timer = setTimeout(() => {
      onComplete();
    }, 7000);

    return () => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', handleReady);
    };
  }, [onComplete]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    // Transition to login when intro animation reaches 6.72s
    if (video && video.currentTime >= VIDEO_END_TIME) {
      onComplete();
    }
  };

  return (
    <div 
      onClick={onComplete}
      className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-between p-8 text-[#2C332E] z-50 overflow-hidden select-none cursor-pointer"
    >
      {/* Primary Video Element - Plays cleanly from 2.22 seconds */}
      {!hasVideoError && (
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
            console.error('Video error event:', e);
            setHasVideoError(true);
          }}
          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        />
      )}

      {/* Fallback Graphic - ONLY shown if video file is missing or unplayable */}
      {hasVideoError && (
        <div className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-between p-8 z-20">
          <div className="absolute inset-0 bg-radial from-amber-100/40 via-transparent to-transparent pointer-events-none" />

          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
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
              <div className="absolute inset-2 bg-[#EA6A14]/15 rounded-full blur-xl animate-pulse" />
              <img 
                src={tiffinLogo} 
                alt="Mess Tiffin" 
                className="w-full h-full object-contain drop-shadow-2xl relative z-10" 
              />
            </motion.div>

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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-[200px] flex flex-col items-center gap-3 mb-6 relative z-10"
          >
            <div className="w-full h-1.5 bg-[#EAE4D9] rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.2, ease: "linear" }}
                className="h-full bg-gradient-to-r from-[#35523A] via-[#EA6A14] to-[#35523A] rounded-full"
              />
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-[#35523A]/70 uppercase">
              LOADING • TAP TO SKIP
            </span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
