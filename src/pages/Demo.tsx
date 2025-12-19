import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronLeft,
  Sparkles,
  Settings,
  Share2,
  Network,
  Headphones,
  Video,
  HelpCircle,
  Layers,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FileUploadZone from "@/components/demo/FileUploadZone";
import MindmapView from "@/components/demo/MindmapView";
import AudioPlayer from "@/components/demo/AudioPlayer";
import VideoOverview from "@/components/demo/VideoOverview";
import QuizView from "@/components/demo/QuizView";
import FlashcardsView from "@/components/demo/FlashcardsView";

interface ProcessedData {
  mindmap: string;
  audioScript: string;
  videoOutline: { title: string; content: string }[];
  quiz: { question: string; options: string[]; correctIndex: number }[];
  flashcards: { front: string; back: string }[];
}

const Demo = () => {
  const [notebookTitle, setNotebookTitle] = useState("Untitled notebook");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [activeTab, setActiveTab] = useState("mindmap");
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleProcess = async (content: string, type: 'file' | 'url', files?: File[]) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let textContent = content;
      
      // If we have files that need server-side processing (PDFs, images)
      if (files && files.length > 0) {
        const fileTexts: string[] = [];
        
        for (const file of files) {
          // Convert file to base64 for server-side processing
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          // Call process-content with file data
          const { data, error: fnError } = await supabase.functions.invoke('process-content', {
            body: { 
              fileData: base64,
              fileName: file.name,
              fileType: file.type,
              contentType: 'file'
            }
          });

          if (fnError) throw new Error(fnError.message);
          if (data?.extractedText) {
            fileTexts.push(`--- ${file.name} ---\n${data.extractedText}`);
          }
        }
        
        // Combine extracted text with any text content
        textContent = [content, ...fileTexts].filter(Boolean).join('\n\n');
      }
      
      // If URL, we'll pass it to the backend for processing
      if (type === 'url') {
        textContent = `Please analyze the content from this URL: ${content}. Extract key concepts, create educational materials, and generate study aids based on typical content from such a source.`;
      }

      const { data, error: fnError } = await supabase.functions.invoke('process-content', {
        body: { content: textContent, contentType: type }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process content');
      }

      setProcessedData(data.data);
      setHasResults(true);
      setActiveTab("mindmap");
      
      toast({
        title: "Content Processed!",
        description: "Your learning materials are ready.",
      });
    } catch (err) {
      console.error('Processing error:', err);
      const message = err instanceof Error ? err.message : 'Failed to process content';
      setError(message);
      toast({
        title: "Processing Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tabItems = [
    { id: "mindmap", label: "Mindmap", icon: Network },
    { id: "audio", label: "Audio", icon: Headphones },
    { id: "video", label: "Video", icon: Video },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
    { id: "flashcards", label: "Cards", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              value={notebookTitle}
              onChange={(e) => setNotebookTitle(e.target.value)}
              className="bg-transparent text-lg font-medium focus:outline-none border-b border-transparent hover:border-white/20 focus:border-primary transition-colors max-w-[200px] sm:max-w-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <Settings className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Left Panel - Upload Area */}
        <div className="w-full lg:w-[400px] xl:w-[450px] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Resource Upload</h2>
            <p className="text-white/50 text-sm">
              Upload documents or paste URLs to generate AI-powered learning materials
            </p>
          </div>

          <FileUploadZone 
            onProcess={handleProcess} 
            isProcessing={isProcessing} 
          />

          {/* Processing Status */}
          {isProcessing && (
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div>
                  <p className="text-white font-medium">Processing your content...</p>
                  <p className="text-white/50 text-sm">Generating mindmap, quiz, flashcards, and more</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium">Processing failed</p>
                  <p className="text-white/50 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="mt-auto pt-6 space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/20">
              <p className="text-sm text-white/70">
                <span className="text-emerald-400 font-medium">AI-Powered:</span> Generates mindmaps, audio summaries, quizzes, and flashcards automatically.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20">
              <p className="text-sm text-white/70">
                <span className="text-blue-400 font-medium">Supported formats:</span> PDF, DOCX, TXT, Images, and web URLs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Results Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasResults && processedData ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 pt-4 border-b border-white/10">
                <TabsList className="bg-white/5 p-1 h-auto flex-wrap">
                  {tabItems.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white text-white/60"
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <TabsContent value="mindmap" className="h-full m-0">
                  <MindmapView diagram={processedData.mindmap} />
                </TabsContent>
                
                <TabsContent value="audio" className="h-full m-0">
                  <AudioPlayer script={processedData.audioScript} />
                </TabsContent>
                
                <TabsContent value="video" className="h-full m-0">
                  <VideoOverview slides={processedData.videoOutline} />
                </TabsContent>
                
                <TabsContent value="quiz" className="h-full m-0">
                  <QuizView questions={processedData.quiz} />
                </TabsContent>
                
                <TabsContent value="flashcards" className="h-full m-0">
                  <FlashcardsView cards={processedData.flashcards} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No content yet</h3>
              <p className="text-white/50 max-w-md mb-8">
                Upload a document or paste a URL to generate AI-powered learning materials including mindmaps, audio summaries, quizzes, and flashcards.
              </p>
              
              {/* Preview of what will be generated */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl">
                {tabItems.map((tab) => (
                  <div 
                    key={tab.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <tab.icon className="w-6 h-6 text-white/30" />
                    <span className="text-xs text-white/40">{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Demo;
