import { useState, useCallback } from "react";
import { Upload, FileText, Link, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  // Extract text from files - handles different file types
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    
    // For plain text files, read directly
    if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await file.text();
    }
    
    // For DOCX files, we need to extract the XML content
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileName.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromDocx(arrayBuffer);
        return text;
      } catch (error) {
        console.error('Error extracting DOCX text:', error);
        toast.error(`Could not extract text from ${file.name}. Please try a .txt file.`);
        return '';
      }
    }
    
    // For PDF files, inform user about limitations
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      toast.error('PDF parsing is not yet supported. Please copy/paste the text or upload a .txt file.');
      return '';
    }
    
    // For images, we can't extract text client-side
    if (file.type.startsWith('image/')) {
      toast.error('Image text extraction is not yet supported. Please copy/paste the text.');
      return '';
    }
    
    // Fallback - try to read as text
    try {
      return await file.text();
    } catch {
      return '';
    }
  };

  // Simple DOCX text extractor - DOCX is a ZIP containing XML
  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // DOCX files are ZIP archives - we need to find and parse document.xml
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Find the document.xml file in the ZIP
    const documentXml = await findDocumentXmlInZip(uint8Array);
    if (!documentXml) {
      throw new Error('Could not find document.xml in DOCX file');
    }
    
    // Parse the XML to extract text
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    
    // Extract text from w:t elements (Word text elements)
    const textElements = xmlDoc.getElementsByTagName('w:t');
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < textElements.length; i++) {
      const text = textElements[i].textContent || '';
      currentParagraph += text;
      
      // Check if this is end of paragraph (approximate)
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

  // Find and extract document.xml from ZIP (DOCX format)
  const findDocumentXmlInZip = async (data: Uint8Array): Promise<string | null> => {
    // Simple ZIP parser to find document.xml
    // ZIP files have a specific structure with local file headers
    
    let offset = 0;
    while (offset < data.length - 30) {
      // Look for local file header signature (0x04034b50)
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
          
          // If not compressed (method 0), return directly
          if (compressionMethod === 0) {
            return new TextDecoder().decode(compressedData);
          }
          
          // If compressed with DEFLATE (method 8), decompress
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
        
        // Move to next file
        const dataStart = offset + 30 + fileNameLength + extraFieldLength;
        offset = dataStart + (compressedSize || 1);
      } else {
        offset++;
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    if (activeTab === 'url' && url) {
      onProcess(url, 'url');
    } else if (activeTab === 'file' && files.length > 0) {
      // Extract text content from files
      const fileContents: string[] = [];
      
      for (const file of files) {
        const text = await extractTextFromFile(file);
        if (text.trim()) {
          fileContents.push(`--- ${file.name} ---\n${text}`);
        }
      }
      
      if (fileContents.length === 0) {
        toast.error('No text content could be extracted from the files.');
        return;
      }
      
      const combinedContent = fileContents.join('\n\n');
      
      // Check content size (limit to ~40KB to be safe)
      if (combinedContent.length > 40000) {
        toast.error('Content is too large. Please upload smaller files or use a shorter document.');
        return;
      }
      
      onProcess(combinedContent, 'file');
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
            accept=".txt,.md,.docx"
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
                or click to browse (TXT, DOCX, Markdown)
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
