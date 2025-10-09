import { cn } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const SOUND_PREFERENCE_KEY = 'video_sound_preference';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ 
  src, 
  poster, 
  className
}: VideoPlayerProps) {
  // Récupérer la préférence de son depuis localStorage
  const getSoundPreference = () => {
    const stored = localStorage.getItem(SOUND_PREFERENCE_KEY);
    return stored === 'unmuted';
  };

  const [isMuted, setIsMuted] = useState(!getSoundPreference());
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // Sauvegarder la préférence
      localStorage.setItem(SOUND_PREFERENCE_KEY, newMutedState ? 'muted' : 'unmuted');
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Appliquer la préférence de son au montage
      video.muted = isMuted;
      
      // Démarrer la lecture automatiquement
      video.play().catch(() => {
        // Ignorer les erreurs d'autoplay
      });
    }
  }, [isMuted]);

  // Observer pour détecter quand la vidéo n'est plus visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Réappliquer l'état muted avant la lecture
            video.muted = isMuted;
            // Vidéo visible : lecture
            video.play().catch(() => {});
          } else {
            // Vidéo non visible : pause
            video.pause();
          }
        });
      },
      {
        threshold: 0.5, // Au moins 50% de la vidéo doit être visible
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isMuted]);

  return (
    <div 
      className={cn("relative group overflow-hidden", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Mute button - visible on hover */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={toggleMute}
          className="pointer-events-auto absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}