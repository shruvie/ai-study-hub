import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  script: string;
}

const AudioPlayer = ({ script }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.rate = rate;
        utterance.volume = isMuted ? 0 : 1;
        
        utterance.onend = () => {
          setIsPlaying(false);
          setProgress(100);
          if (intervalRef.current) clearInterval(intervalRef.current);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        
        // Estimate progress
        const estimatedDuration = (script.length / 150) * 60 * 1000 / rate;
        const startTime = Date.now();
        
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.min((elapsed / estimatedDuration) * 100, 100);
          setProgress(newProgress);
        }, 100);
      }
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current) {
      utteranceRef.current.volume = isMuted ? 1 : 0;
    }
  };

  return (
    <div className="flex flex-col h-full">
    {/* Script Display (SCROLLABLE) */}
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 bg-white/5 rounded-xl mb-6"
    >
        <h3 className="text-lg font-semibold text-white mb-4">Audio Script</h3>
        <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{script}</p>
      </div>

      {/* Player Controls */}
      <div className="bg-white/5 rounded-xl p-6 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            max={100}
            step={1}
            className="w-full"
            disabled
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>{Math.round(progress)}%</span>
            <span>Audio Overview</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handlePlay}
            size="lg"
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-white/40">Speed:</span>
          {[0.75, 1, 1.25, 1.5].map((speed) => (
            <button
              key={speed}
              onClick={() => setRate(speed)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                rate === speed 
                  ? 'bg-primary text-white' 
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
