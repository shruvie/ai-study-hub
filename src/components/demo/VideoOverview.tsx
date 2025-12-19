import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  content: string;
}

interface VideoOverviewProps {
  slides: Slide[];
}

const VideoOverview = ({ slides }: VideoOverviewProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(slides.length - 1, index)));
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  if (slides.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/50">
        <Presentation className="w-16 h-16 mb-4" />
        <p>No slides available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Slide Display */}
      <div className="flex-1 relative bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl overflow-hidden">
        {/* Slide Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 rounded-full text-sm text-white/60">
            {currentSlide + 1} / {slides.length}
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-6">
            {slides[currentSlide]?.title}
          </h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
            {slides[currentSlide]?.content}
          </p>
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Thumbnail Strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "flex-shrink-0 w-32 h-20 rounded-lg p-2 text-left transition-all",
              currentSlide === index
                ? "bg-primary/30 ring-2 ring-primary"
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            <p className="text-xs font-medium text-white truncate">{slide.title}</p>
            <p className="text-[10px] text-white/50 line-clamp-2 mt-1">{slide.content}</p>
          </button>
        ))}
      </div>

      {/* Playback Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          onClick={() => goToSlide(0)}
          variant="outline"
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          Restart
        </Button>
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <Play className="w-4 h-4" />
          {isPlaying ? 'Pause' : 'Auto Play'}
        </Button>
      </div>
    </div>
  );
};

export default VideoOverview;
