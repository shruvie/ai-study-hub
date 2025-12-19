import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, Save, Share2, Loader2 } from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';
import SourcesPanel from '@/components/notebook/SourcesPanel';
import ChatPanel from '@/components/notebook/ChatPanel';
import InsightsPanel from '@/components/notebook/InsightsPanel';
import MobileNav from '@/components/notebook/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface Source {
  id: string;
  name: string;
  type: 'file' | 'url';
  content: string;
  active: boolean;
}

interface NotebookData {
  id: string;
  title: string;
  owner_id: string;
  content_json: {
    mindmap?: string;
    audioScript?: string;
    videoSlides?: Array<{ title: string; content: string }>;
    videoOutline?: Array<{ title: string; content: string }>;
    quiz?: Array<{ question: string; options: string[]; correctIndex: number }>;
    flashcards?: Array<{ front: string; back: string }>;
    sources?: Source[];
  } | null;
  source_type?: string | null;
  source_content?: string | null;
}

export default function Notebook() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [activePane, setActivePane] = useState<'sources' | 'chat' | 'insights'>('sources');
  const [activeInsightTab, setActiveInsightTab] = useState('mindmap');

  const fetchNotebook = useCallback(async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const notebookData = data as NotebookData;
      setNotebook(notebookData);
      setTitle(notebookData.title);
      
      // Load sources from content_json
      if (notebookData.content_json?.sources) {
        setSources(notebookData.content_json.sources);
      }
      
      // Check if user can edit
      if (notebookData.owner_id === user.id) {
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

      // If content exists, switch to insights
      if (notebookData.content_json && 
          Object.keys(notebookData.content_json).some(k => k !== 'sources')) {
        setActivePane('insights');
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

    // Set up realtime subscription
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
            if (updatedNotebook.content_json?.sources) {
              setSources(updatedNotebook.content_json.sources);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, fetchNotebook]);

  // Save sources whenever they change
  useEffect(() => {
    if (!notebook || !canEdit || sources.length === 0) return;
    
    const saveDebounced = setTimeout(async () => {
      const currentContent = notebook.content_json || {};
      const sourcesForDb = sources.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        content: s.content,
        active: s.active
      }));
      
      const { error } = await supabase
        .from('notebooks')
        .update({
          content_json: { ...currentContent, sources: sourcesForDb } as any
        })
        .eq('id', notebook.id);

      if (error) console.error('Error saving sources:', error);
    }, 1000);

    return () => clearTimeout(saveDebounced);
  }, [sources, notebook, canEdit]);

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

  const handleProcessSources = async () => {
    if (!notebook || !canEdit) return;
    
    const activeSources = sources.filter(s => s.active);
    if (activeSources.length === 0) {
      toast.error('Please add at least one source');
      return;
    }

    const combinedContent = activeSources
      .map(s => `--- ${s.name} ---\n${s.content}`)
      .join('\n\n');

    if (combinedContent.length > 40000) {
      toast.error('Content is too large. Please use smaller sources.');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: { content: combinedContent, contentType: 'file' }
      });

      if (error) throw error;

      const contentData = data?.data || data;

      // Convert sources to JSON-compatible format
      const sourcesForDb = sources.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        content: s.content,
        active: s.active
      }));

      const { error: updateError } = await supabase
        .from('notebooks')
        .update({
          content_json: { ...contentData, sources: sourcesForDb } as any,
          source_type: 'file',
          source_content: combinedContent.substring(0, 1000)
        })
        .eq('id', notebook.id);

      if (updateError) throw updateError;

      setNotebook(prev => prev ? { 
        ...prev, 
        content_json: { ...contentData, sources } 
      } : null);
      
      setActivePane('insights');
      toast.success('Insights generated successfully!');
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Failed to process content. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getSourceContents = () => {
    return sources
      .filter(s => s.active)
      .map(s => `--- ${s.name} ---\n${s.content}`)
      .join('\n\n');
  };

  const content = notebook?.content_json || {};

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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm z-50 flex-shrink-0">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              {canEdit ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    className="font-semibold text-base border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-40 md:w-auto"
                    placeholder="Untitled Notebook"
                  />
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              ) : (
                <span className="font-semibold text-base truncate max-w-[150px] md:max-w-none">{title}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {notebook.owner_id === user?.id && (
              <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
                <Share2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Share</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Three Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        {!isMobile ? (
          <>
            {/* Sources Panel - Left */}
            <div className="w-64 flex-shrink-0">
              <SourcesPanel
                sources={sources}
                onSourcesChange={setSources}
                onProcessSources={handleProcessSources}
                isProcessing={processing}
                canEdit={canEdit}
              />
            </div>

            {/* Chat Panel - Center */}
            <div className="flex-1 border-x border-border">
              <ChatPanel
                notebookId={notebook.id}
                sourceContents={getSourceContents()}
                canEdit={canEdit}
              />
            </div>

            {/* Insights Panel - Right */}
            <div className="w-80 flex-shrink-0">
              <InsightsPanel
                content={content}
                isProcessing={processing}
                activeTab={activeInsightTab}
                onTabChange={setActiveInsightTab}
              />
            </div>
          </>
        ) : (
          /* Mobile Layout - Single pane with bottom nav */
          <div className="flex-1 pb-16">
            {activePane === 'sources' && (
              <SourcesPanel
                sources={sources}
                onSourcesChange={setSources}
                onProcessSources={handleProcessSources}
                isProcessing={processing}
                canEdit={canEdit}
              />
            )}
            {activePane === 'chat' && (
              <ChatPanel
                notebookId={notebook.id}
                sourceContents={getSourceContents()}
                canEdit={canEdit}
              />
            )}
            {activePane === 'insights' && (
              <InsightsPanel
                content={content}
                isProcessing={processing}
                activeTab={activeInsightTab}
                onTabChange={setActiveInsightTab}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav activePane={activePane} onPaneChange={setActivePane} />
      )}

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
