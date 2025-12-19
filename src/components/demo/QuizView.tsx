import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizViewProps {
  questions: QuizQuestion[];
}

const QuizView = ({ questions }: QuizViewProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (selectedAnswer === questions[currentQuestion]?.correctIndex) {
      setScore(score + 1);
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
  };

  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/50">
        <Trophy className="w-16 h-16 mb-4" />
        <p>No quiz questions available</p>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mb-6",
          percentage >= 70 ? "bg-green-500/20" : percentage >= 40 ? "bg-yellow-500/20" : "bg-red-500/20"
        )}>
          <Trophy className={cn(
            "w-12 h-12",
            percentage >= 70 ? "text-green-400" : percentage >= 40 ? "text-yellow-400" : "text-red-400"
          )} />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-xl text-white/70 mb-6">
          You scored <span className="text-primary font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span>
        </p>
        <p className="text-4xl font-bold text-primary mb-8">{percentage}%</p>
        
        <Button onClick={handleRestart} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="h-full flex flex-col">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/60 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-white mb-6">{question?.question}</h3>
        
        <div className="space-y-3">
          {question?.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctIndex;
            const showCorrectness = selectedAnswer !== null;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all flex items-center gap-3",
                  "border-2",
                  !showCorrectness && "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
                  showCorrectness && isCorrect && "border-green-500 bg-green-500/20",
                  showCorrectness && isSelected && !isCorrect && "border-red-500 bg-red-500/20",
                  showCorrectness && !isSelected && !isCorrect && "border-white/10 bg-white/5 opacity-50"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                  !showCorrectness && "bg-white/10 text-white/70",
                  showCorrectness && isCorrect && "bg-green-500 text-white",
                  showCorrectness && isSelected && !isCorrect && "bg-red-500 text-white"
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-white flex-1">{option}</span>
                {showCorrectness && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                {showCorrectness && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        disabled={selectedAnswer === null}
        className="w-full mt-6 h-12"
      >
        {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
      </Button>
    </div>
  );
};

export default QuizView;
