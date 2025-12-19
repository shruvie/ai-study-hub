import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsViewProps {
  cards: Flashcard[];
}

const FlashcardsView = ({ cards }: FlashcardsViewProps) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(cards);

  const goToCard = (index: number) => {
    setCurrentCard(Math.max(0, Math.min(shuffledCards.length - 1, index)));
    setIsFlipped(false);
  };

  const nextCard = () => goToCard(currentCard + 1);
  const prevCard = () => goToCard(currentCard - 1);
  
  const flipCard = () => setIsFlipped(!isFlipped);

  const shuffleCards = () => {
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const resetCards = () => {
    setShuffledCards(cards);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/50">
        <Layers className="w-16 h-16 mb-4" />
        <p>No flashcards available</p>
      </div>
    );
  }

  const card = shuffledCards[currentCard];

  return (
    <div className="h-full flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-white/60 text-sm">
          Card {currentCard + 1} of {shuffledCards.length}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffleCards}
            className="text-white/60 hover:text-white hover:bg-white/10 gap-1"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetCards}
            className="text-white/60 hover:text-white hover:bg-white/10 gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Card Display */}
      <div className="flex-1 flex items-center justify-center perspective-1000">
        <div 
          onClick={flipCard}
          className={cn(
            "relative w-full max-w-lg aspect-[4/3] cursor-pointer transition-all duration-500 preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 p-8 flex flex-col items-center justify-center text-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs text-white/40 uppercase tracking-wider mb-4">Question / Term</span>
            <p className="text-xl font-medium text-white leading-relaxed">{card?.front}</p>
            <span className="absolute bottom-4 text-xs text-white/30">Click to flip</span>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/20 p-8 flex flex-col items-center justify-center text-center backface-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <span className="text-xs text-green-400/60 uppercase tracking-wider mb-4">Answer / Definition</span>
            <p className="text-xl font-medium text-white leading-relaxed">{card?.back}</p>
            <span className="absolute bottom-4 text-xs text-white/30">Click to flip back</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={prevCard}
          disabled={currentCard === 0}
          className="w-12 h-12 rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        {/* Card Indicators */}
        <div className="flex gap-1.5">
          {shuffledCards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToCard(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentCard === index ? "bg-primary w-6" : "bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextCard}
          disabled={currentCard === shuffledCards.length - 1}
          className="w-12 h-12 rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-center text-white/30 text-xs mt-4">
        Use arrow keys to navigate, space to flip
      </p>
    </div>
  );
};

export default FlashcardsView;
