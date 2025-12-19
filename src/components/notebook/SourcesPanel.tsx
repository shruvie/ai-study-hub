import { useState } from "react";
import { FileText, Link, Plus, Trash2, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Source {
  id: string;
  name: string;
  type: 'file' | 'url';
  content: string;
  active: boolean;
}

interface SourcesPanelProps {
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  onProcessSources: () => void;
  isProcessing: boolean;
  canEdit: boolean;
}

const SourcesPanel = ({ 
  sources, 
  onSourcesChange, 
  onProcessSources, 
  isProcessing,
  canEdit 
}: SourcesPanelProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
      const text = await extractText(file);
      if (text) {
        newSources.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: 'file',
          content: text,
          active: true
        });
      }
    }
    
    if (newSources.length > 0) {
      onSourcesChange([...sources, ...newSources]);
      toast.success(`Added ${newSources.length} source(s)`);
    }
    setShowAddModal(false);
  };

  const extractText = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    
    if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await file.text();
    }
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileName.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        return await extractTextFromDocx(arrayBuffer);
      } catch (error) {
        console.error('Error extracting DOCX:', error);
        toast.error(`Could not extract text from ${file.name}`);
        return '';
      }
    }
    
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      toast.error('PDF parsing is not yet supported. Please use .txt or .docx files.');
      return '';
    }
    
    try {
      return await file.text();
    } catch {
      return '';
    }
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

  const handleAddUrl = () => {
    if (!url.trim()) return;
    
    onSourcesChange([...sources, {
      id: crypto.randomUUID(),
      name: new URL(url).hostname,
      type: 'url',
      content: url,
      active: true
    }]);
    setUrl('');
    setShowAddModal(false);
    toast.success('URL added');
  };

  const toggleSource = (id: string) => {
    onSourcesChange(sources.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const removeSource = (id: string) => {
    onSourcesChange(sources.filter(s => s.id !== id));
    toast.success('Source removed');
  };

  const activeSources = sources.filter(s => s.active);

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-foreground">Sources</h2>
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAddModal(true)}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {activeSources.length} of {sources.length} active
        </p>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sources yet</p>
            {canEdit && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                className="mt-2"
              >
                Add your first source
              </Button>
            )}
          </div>
        ) : (
          sources.map(source => (
            <div
              key={source.id}
              className={cn(
                "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                source.active 
                  ? "bg-primary/10 border border-primary/30" 
                  : "bg-muted/50 border border-transparent opacity-60"
              )}
              onClick={() => toggleSource(source.id)}
            >
              {source.type === 'file' ? (
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Link className="h-4 w-4 text-primary flex-shrink-0" />
              )}
              <span className="text-sm truncate flex-1">{source.name}</span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSource(source.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Generate Button */}
      {canEdit && sources.length > 0 && (
        <div className="p-4 border-t border-border">
          <Button 
            onClick={onProcessSources}
            disabled={isProcessing || activeSources.length === 0}
            className="w-full gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add Source</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => setAddType('file')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  addType === 'file' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
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
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link className="w-4 h-4" />
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
                    : "border-border hover:border-primary/50"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.docx"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragOver ? "Drop files here" : "Drag & drop files"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  TXT, DOCX, Markdown
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button onClick={handleAddUrl} disabled={!url.trim()} className="w-full">
                  Add URL
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SourcesPanel;
