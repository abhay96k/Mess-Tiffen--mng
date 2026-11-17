import { useRef, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const VIDEO_START_TIME = 2.22;
const VIDEO_END_TIME = 6.72; // Plays for ~4.5 seconds

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeekedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Direct DOM property assignment strictly required for iOS Safari & Android mobile autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');

    const trySeek = () => {
      if (!hasSeekedRef.current) {
        hasSeekedRef.current = true;
        try {
          video.currentTime = VIDEO_START_TIME;
        } catch {
          // ignore
        }
      }
    };

    if (video.readyState >= 1) {
      trySeek();
    } else {
      video.addEventListener('loadedmetadata', trySeek, { once: true });
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          trySeek();
        })
        .catch((err) => {
          console.warn('Video autoplay notice:', err.message);
        });
    }

    // Safety timeout: transition after 6.5 seconds if video ends or completes
    const timer = setTimeout(() => {
      onComplete();
    }, 6500);

    return () => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', trySeek);
    };
  }, [onComplete]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.currentTime >= VIDEO_END_TIME) {
      onComplete();
    }
  };

  return (
    <div 
      onClick={onComplete}
      className="absolute inset-0 bg-[#F6F2EB] flex flex-col items-center justify-center z-50 overflow-hidden select-none cursor-pointer"
    >
      {/* Video is the only element - No static image or fallback logo will ever render */}
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
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
      />
    </div>
  );
}
