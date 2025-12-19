import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  BookOpen, 
  Save, 
  Share2, 
  Loader2,
  Brain,
  Headphones,
  Video,
  HelpCircle,
  Layers
} from 'lucide-react';
import FileUploadZone from '@/components/demo/FileUploadZone';
import MindmapView from '@/components/demo/MindmapView';
import AudioPlayer from '@/components/demo/AudioPlayer';
import VideoOverview from '@/components/demo/VideoOverview';
import QuizView from '@/components/demo/QuizView';
import FlashcardsView from '@/components/demo/FlashcardsView';
import { ShareModal } from '@/components/ShareModal';

interface NotebookData {
  id: string;
  title: string;
  owner_id: string;
  content_json: {
    mindmap?: string;
    audioScript?: string;
    videoSlides?: Array<{ title: string; content: string }>;
    quiz?: Array<{ question: string; options: string[]; correctIndex: number }>;
    flashcards?: Array<{ front: string; back: string }>;
  } | null;
  source_type?: string | null;
  source_content?: string | null;
}

export default function Notebook() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const fetchNotebook = useCallback(async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setNotebook(data as NotebookData);
      setTitle(data.title);
      
      // Check if user can edit
      if (data.owner_id === user.id) {
        setCanEdit(true);
      } else {
        const { data: permission } = await supabase
          .from('notebook_permissions')
          .select('role')
          .eq('notebook_id', id)
          .eq('user_id', user.id)
          .single();
        
        setCanEdit(permission?.role === 'editor');
      }

      // If content exists, switch to results tab
      if (data.content_json && Object.keys(data.content_json).length > 0) {
        setActiveTab('mindmap');
      }
    } catch (error) {
      console.error('Error fetching notebook:', error);
      toast.error('Failed to load notebook');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    fetchNotebook();

    // Set up realtime subscription for collaborative updates
    if (id) {
      const channel = supabase
        .channel(`notebook-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notebooks',
            filter: `id=eq.${id}`
          },
          (payload) => {
            const updatedNotebook = payload.new as NotebookData;
            setNotebook(updatedNotebook);
            setTitle(updatedNotebook.title);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, fetchNotebook]);

  const handleSaveTitle = async () => {
    if (!notebook || !canEdit) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notebooks')
        .update({ title })
        .eq('id', notebook.id);

      if (error) throw error;
      toast.success('Title saved');
    } catch (error) {
      console.error('Error saving title:', error);
      toast.error('Failed to save title');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessContent = async (content: string, sourceType: string) => {
    if (!notebook || !canEdit) return;
    
    setProcessing(true);
    try {
      // Call the process-content edge function
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: { content, sourceType }
      });

      if (error) throw error;

      // Update notebook with generated content
      const { error: updateError } = await supabase
        .from('notebooks')
        .update({
          content_json: data,
          source_type: sourceType,
          source_content: content.substring(0, 1000) // Store first 1000 chars
        })
        .eq('id', notebook.id);

      if (updateError) throw updateError;

      setNotebook(prev => prev ? { ...prev, content_json: data, source_type: sourceType } : null);
      setActiveTab('mindmap');
      toast.success('Content processed successfully!');
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Failed to process content. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const content = (notebook?.content_json || {}) as NotebookData['content_json'] & Record<string, unknown>;
  const hasContent = content && Object.keys(content).length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Notebook not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-tight flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              {canEdit ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    className="font-display font-semibold text-lg border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                    placeholder="Untitled Notebook"
                  />
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              ) : (
                <span className="font-display font-semibold text-lg">{title}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {notebook.owner_id === user?.id && (
              <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-tight py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="upload" className="gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="mindmap" disabled={!hasContent} className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Mindmap</span>
            </TabsTrigger>
            <TabsTrigger value="audio" disabled={!hasContent} className="gap-2">
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="video" disabled={!hasContent} className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" disabled={!hasContent} className="gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" disabled={!hasContent} className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Flashcards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            {canEdit ? (
              <FileUploadZone onProcess={handleProcessContent} isProcessing={processing} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                You have view-only access to this notebook
              </div>
            )}
          </TabsContent>

          <TabsContent value="mindmap">
            <MindmapView diagram={content.mindmap || ''} />
          </TabsContent>

          <TabsContent value="audio">
            <AudioPlayer script={content.audioScript || ''} />
          </TabsContent>

          <TabsContent value="video">
            <VideoOverview slides={content.videoSlides || []} />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizView questions={content.quiz || []} />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardsView cards={content.flashcards || []} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        notebookId={notebook.id}
        notebookTitle={notebook.title}
        onShareComplete={fetchNotebook}
      />
    </div>
  );
}
