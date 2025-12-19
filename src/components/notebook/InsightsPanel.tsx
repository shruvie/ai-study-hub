import { useState } from "react";
import { Brain, Headphones, HelpCircle, Layers, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import MindmapView from "@/components/demo/MindmapView";
import AudioPlayer from "@/components/demo/AudioPlayer";
import QuizView from "@/components/demo/QuizView";
import FlashcardsView from "@/components/demo/FlashcardsView";

interface InsightsContent {
  mindmap?: string;
  audioScript?: string;
  videoOutline?: Array<{ title: string; content: string }>;
  quiz?: Array<{ question: string; options: string[]; correctIndex: number }>;
  flashcards?: Array<{ front: string; back: string }>;
}

interface InsightsPanelProps {
  content: InsightsContent | null;
  isProcessing: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const InsightsPanel = ({ content, isProcessing, activeTab, onTabChange }: InsightsPanelProps) => {
  const hasContent = content && Object.keys(content).length > 0;

  const tabs = [
    { id: 'mindmap', label: 'Mindmap', icon: Brain },
    { id: 'audio', label: 'Audio', icon: Headphones },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'flashcards', label: 'Cards', icon: Layers },
  ];

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">AI Insights</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Generated learning materials
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 mx-4 mt-2">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={!hasContent && !isProcessing}
              className="gap-1 text-xs px-2"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Generating insights...
              </p>
            </div>
          ) : !hasContent ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Brain className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Add sources and click "Generate Insights" to see AI-generated content
              </p>
            </div>
          ) : (
            <>
              <TabsContent value="mindmap" className="h-full m-0 p-4 overflow-auto">
                <MindmapView diagram={content?.mindmap || ''} />
              </TabsContent>

              <TabsContent value="audio" className="h-full m-0 p-4 overflow-auto">
                <AudioPlayer script={content?.audioScript || ''} />
              </TabsContent>

              <TabsContent value="quiz" className="h-full m-0 p-4 overflow-auto">
                <QuizView questions={content?.quiz || []} />
              </TabsContent>

              <TabsContent value="flashcards" className="h-full m-0 p-4 overflow-auto">
                <FlashcardsView cards={content?.flashcards || []} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default InsightsPanel;
