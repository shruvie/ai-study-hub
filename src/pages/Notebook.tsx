import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  Sparkles, 
  Share2, 
  Settings,
  Network,
  Headphones,
  Video,
  HelpCircle,
  Layers,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Link as LinkIcon,
  X,
  Trash2,
  Plus,
  Image,
  FileType
} from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';
import MindmapView from '@/components/demo/MindmapView';
import AudioPlayer from '@/components/demo/AudioPlayer';
import VideoOverview from '@/components/demo/VideoOverview';
import QuizView from '@/components/demo/QuizView';
import FlashcardsView from '@/components/demo/FlashcardsView';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Source {
  id: string;
  name: string;
  type: 'file' | 'url';
  content: string;
  active: boolean;
  fileType?: string;
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

interface ProcessedData {
  mindmap: string;
  audioScript: string;
  videoOutline: { title: string; content: string }[];
  quiz: { question: string; options: string[]; correctIndex: number }[];
  flashcards: { front: string; back: string }[];
}

export default function Notebook() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [title, setTitle] = useState('Untitled notebook');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [activeTab, setActiveTab] = useState('mindmap');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Upload state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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

      // Load processed data if exists
      if (notebookData.content_json && 
          Object.keys(notebookData.content_json).some(k => k !== 'sources' && notebookData.content_json?.[k as keyof typeof notebookData.content_json])) {
        setProcessedData({
          mindmap: notebookData.content_json.mindmap || '',
          audioScript: notebookData.content_json.audioScript || '',
          videoOutline: notebookData.content_json.videoOutline || notebookData.content_json.videoSlides || [],
          quiz: notebookData.content_json.quiz || [],
          flashcards: notebookData.content_json.flashcards || []
        });
        setHasResults(true);
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

  const handleSaveTitle = async () => {
    if (!notebook || !canEdit) return;
    
    try {
      const { error } = await supabase
        .from('notebooks')
        .update({ title })
        .eq('id', notebook.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  // File extraction functions
  const extractText = async (file: File): Promise<{ text: string; needsServerProcessing: boolean }> => {
    const fileName = file.name.toLowerCase();
    
    if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return { text: await file.text(), needsServerProcessing: false };
    }
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileName.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromDocx(arrayBuffer);
        return { text, needsServerProcessing: false };
      } catch (error) {
        console.error('Error extracting DOCX:', error);
        return { text: '', needsServerProcessing: true };
      }
    }
    
    // PDFs and images need server-side processing
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf') || file.type.startsWith('image/')) {
      return { text: '', needsServerProcessing: true };
    }
    
    try {
      return { text: await file.text(), needsServerProcessing: false };
    } catch {
      return { text: '', needsServerProcessing: true };
    }
  };

  const extractTextFromServer = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const { data, error } = await supabase.functions.invoke('process-content', {
      body: { 
        fileData: base64,
        fileName: file.name,
        fileType: file.type,
        contentType: 'file'
      }
    });

    if (error) throw new Error(error.message);
    return data?.extractedText || '';
  };

  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const documentXml = await findDocumentXmlInZip(uint8Array);
    if (!documentXml) {
      throw new Error('Could not find document.xml in DOCX file');
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    const textElements = xmlDoc.getElementsByTagName('w:t');
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < textElements.length; i++) {
      const text = textElements[i].textContent || '';
      currentParagraph += text;
      
      const parent = textElements[i].parentElement?.parentElement;
      const nextParent = textElements[i + 1]?.parentElement?.parentElement;
      if (parent !== nextParent || i === textElements.length - 1) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
        }
        currentParagraph = '';
      }
    }
    
    return paragraphs.join('\n\n');
  };

  const findDocumentXmlInZip = async (data: Uint8Array): Promise<string | null> => {
    let offset = 0;
    while (offset < data.length - 30) {
      if (data[offset] === 0x50 && data[offset + 1] === 0x4b && 
          data[offset + 2] === 0x03 && data[offset + 3] === 0x04) {
        
        const compressedSize = data[offset + 18] | (data[offset + 19] << 8) | 
                               (data[offset + 20] << 16) | (data[offset + 21] << 24);
        const uncompressedSize = data[offset + 22] | (data[offset + 23] << 8) | 
                                  (data[offset + 24] << 16) | (data[offset + 25] << 24);
        const fileNameLength = data[offset + 26] | (data[offset + 27] << 8);
        const extraFieldLength = data[offset + 28] | (data[offset + 29] << 8);
        const compressionMethod = data[offset + 8] | (data[offset + 9] << 8);
        
        const fileNameStart = offset + 30;
        const fileNameBytes = data.slice(fileNameStart, fileNameStart + fileNameLength);
        const fileName = new TextDecoder().decode(fileNameBytes);
        
        if (fileName === 'word/document.xml') {
          const dataStart = fileNameStart + fileNameLength + extraFieldLength;
          const compressedData = data.slice(dataStart, dataStart + (compressedSize || uncompressedSize));
          
          if (compressionMethod === 0) {
            return new TextDecoder().decode(compressedData);
          }
          
          if (compressionMethod === 8) {
            try {
              const ds = new DecompressionStream('deflate-raw');
              const blob = new Blob([compressedData]);
              const decompressedStream = blob.stream().pipeThrough(ds);
              const decompressedBlob = await new Response(decompressedStream).blob();
              return await decompressedBlob.text();
            } catch (e) {
              console.error('Decompression failed:', e);
              return null;
            }
          }
        }
        
        const dataStart = offset + 30 + fileNameLength + extraFieldLength;
        offset = dataStart + (compressedSize || 1);
      } else {
        offset++;
      }
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const newSources: Source[] = [];
    
    for (const file of files) {
      try {
        const result = await extractText(file);
        let text = result.text;
        
        // If needs server processing, send to edge function
        if (result.needsServerProcessing) {
          toast.info(`Extracting text from ${file.name}...`);
          text = await extractTextFromServer(file);
        }
        
        if (text) {
          newSources.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: 'file',
            content: text,
            active: true,
            fileType: file.type
          });
        }
      } catch (err) {
        console.error('Error processing file:', err);
        toast.error(`Failed to process ${file.name}`);
      }
    }
    
    if (newSources.length > 0) {
      const updatedSources = [...sources, ...newSources];
      setSources(updatedSources);
      await saveSources(updatedSources);
      toast.success(`Added ${newSources.length} source(s)`);
    }
    setShowAddModal(false);
  };

  const handleAddUrl = async () => {
    if (!url.trim()) return;
    
    const newSource: Source = {
      id: crypto.randomUUID(),
      name: new URL(url).hostname,
      type: 'url',
      content: url,
      active: true
    };
    
    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    await saveSources(updatedSources);
    setUrl('');
    setShowAddModal(false);
    toast.success('URL added');
  };

  const saveSources = async (sourcesToSave: Source[]) => {
    if (!notebook || !canEdit) return;
    
    const currentContent = notebook.content_json || {};
    const sourcesForDb = sourcesToSave.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      content: s.content,
      active: s.active,
      fileType: s.fileType
    }));
    
    await supabase
      .from('notebooks')
      .update({
        content_json: { ...currentContent, sources: sourcesForDb } as any
      })
      .eq('id', notebook.id);
  };

  const toggleSource = (sourceId: string) => {
    const updated = sources.map(s => 
      s.id === sourceId ? { ...s, active: !s.active } : s
    );
    setSources(updated);
    saveSources(updated);
  };

  const removeSource = (sourceId: string) => {
    const updated = sources.filter(s => s.id !== sourceId);
    setSources(updated);
    saveSources(updated);
    toast.success('Source removed');
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

    if (combinedContent.length > 50000) {
      toast.error('Content is too large. Please use smaller sources.');
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      console.log('Sending content for processing, length:', combinedContent.length);
      
      const { data, error: fnError } = await supabase.functions.invoke('process-content', {
        body: { content: combinedContent, contentType: 'file' }
      });

      console.log('Edge function response:', data);

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error('Processing failed');

      // Extract the actual content data from the nested structure
      const contentData = data.data;
      
      if (!contentData || !contentData.mindmap) {
        throw new Error('Invalid response from AI - missing content');
      }
      
      const sourcesForDb = sources.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        content: s.content,
        active: s.active,
        fileType: s.fileType
      }));

      const newProcessedData: ProcessedData = {
        mindmap: contentData.mindmap || '',
        audioScript: contentData.audioScript || '',
        videoOutline: contentData.videoOutline || [],
        quiz: contentData.quiz || [],
        flashcards: contentData.flashcards || []
      };

      await supabase
        .from('notebooks')
        .update({
          content_json: { ...newProcessedData, sources: sourcesForDb } as any,
          source_type: 'file',
          source_content: combinedContent.substring(0, 1000)
        })
        .eq('id', notebook.id);

      setProcessedData(newProcessedData);
      setHasResults(true);
      setActiveTab('mindmap');
      toast.success('Insights generated successfully!');
    } catch (err) {
      console.error('Processing error:', err);
      const message = err instanceof Error ? err.message : 'Failed to process content';
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const getFileIcon = (source: Source) => {
    if (source.type === 'url') return <LinkIcon className="h-4 w-4 text-blue-400" />;
    if (source.fileType?.startsWith('image/')) return <Image className="h-4 w-4 text-green-400" />;
    if (source.fileType?.includes('pdf')) return <FileType className="h-4 w-4 text-red-400" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const tabItems = [
    { id: "mindmap", label: "Mindmap", icon: Network },
    { id: "audio", label: "Audio", icon: Headphones },
    { id: "video", label: "Video", icon: Video },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
    { id: "flashcards", label: "Cards", icon: Layers },
  ];

  const activeSources = sources.filter(s => s.active);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-white/50">Notebook not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {canEdit ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                className="bg-transparent text-lg font-medium focus:outline-none border-b border-transparent hover:border-white/20 focus:border-primary transition-colors max-w-[200px] sm:max-w-none"
              />
            ) : (
              <span className="text-lg font-medium">{title}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {notebook.owner_id === user?.id && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <Settings className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Left Panel - Sources & Upload */}
        <div className="w-full lg:w-[400px] xl:w-[450px] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Sources</h2>
              <p className="text-white/50 text-sm">
                {activeSources.length} of {sources.length} active
              </p>
            </div>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>

          {/* Sources List */}
          <div className="space-y-2 mb-6">
            {sources.length === 0 ? (
              <div 
                onClick={() => canEdit && setShowAddModal(true)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragOver 
                    ? "border-primary bg-primary/10" 
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                )}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                <p className="text-white/70 font-medium">Drop files here</p>
                <p className="text-white/40 text-sm mt-1">or click to browse</p>
              </div>
            ) : (
              sources.map(source => (
                <div
                  key={source.id}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                    source.active 
                      ? "bg-white/10 border border-white/20" 
                      : "bg-white/5 border border-transparent opacity-60"
                  )}
                  onClick={() => toggleSource(source.id)}
                >
                  {getFileIcon(source)}
                  <span className="text-sm truncate flex-1 text-white">{source.name}</span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSource(source.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Generate Button */}
          {canEdit && sources.length > 0 && (
            <Button 
              onClick={handleProcessSources}
              disabled={processing || activeSources.length === 0}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Insights
                </>
              )}
            </Button>
          )}

          {/* Processing Status */}
          {processing && (
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
                Upload documents or paste URLs to generate AI-powered learning materials including mindmaps, audio summaries, quizzes, and flashcards.
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

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-white">Add Source</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
              <button
                onClick={() => setAddType('file')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  addType === 'file' 
                    ? "bg-primary text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
              <button
                onClick={() => setAddType('url')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  addType === 'url' 
                    ? "bg-primary text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <LinkIcon className="w-4 h-4" />
                Paste URL
              </button>
            </div>

            {addType === 'file' ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  isDragOver 
                    ? "border-primary bg-primary/10" 
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.docx,.pdf,image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                <p className="text-sm font-medium text-white">
                  {isDragOver ? "Drop files here" : "Drag & drop files"}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  PDF, DOCX, TXT, Images
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
                <Button onClick={handleAddUrl} disabled={!url.trim()} className="w-full">
                  Add URL
                </Button>
              </div>
            )}
          </div>
        </div>
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
