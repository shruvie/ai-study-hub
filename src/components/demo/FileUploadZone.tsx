import { useState, useCallback } from "react";
import { Upload, FileText, Link, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onProcess: (content: string, type: 'file' | 'url') => void;
  isProcessing: boolean;
}

const FileUploadZone = ({ onProcess, isProcessing }: FileUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => 
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type.startsWith('image/') ||
      file.type === 'text/plain'
    );
    
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (activeTab === 'url' && url) {
      onProcess(url, 'url');
    } else if (activeTab === 'file' && files.length > 0) {
      // Read file contents
      const fileContents: string[] = [];
      for (const file of files) {
        const text = await file.text();
        fileContents.push(`--- ${file.name} ---\n${text}`);
      }
      onProcess(fileContents.join('\n\n'), 'file');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setActiveTab('file')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
            activeTab === 'file' 
              ? "bg-primary text-white" 
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
            activeTab === 'url' 
              ? "bg-primary text-white" 
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Link className="w-4 h-4" />
          Paste URL
        </button>
      </div>

      {/* File Upload Zone */}
      {activeTab === 'file' && (
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
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white font-medium">
                {isDragOver ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-white/50 text-sm mt-1">
                or click to browse (PDF, DOCX, Images, TXT)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
          />
          <p className="text-white/40 text-sm">
            Paste a website URL to extract and analyze its content
          </p>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && activeTab === 'file' && (
        <div className="space-y-2">
          <p className="text-white/60 text-sm font-medium">{files.length} file(s) selected</p>
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm text-white truncate">{file.name}</span>
              <span className="text-xs text-white/40">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || (activeTab === 'file' ? files.length === 0 : !url)}
        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Generate Insights
          </>
        )}
      </Button>
    </div>
  );
};

export default FileUploadZone;
