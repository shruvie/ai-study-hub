import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Upload, 
  Search, 
  Globe, 
  Zap, 
  ArrowRight,
  Sparkles,
  Settings,
  Share2,
  Grid3X3,
  FileText,
  Headphones,
  Video,
  Network,
  FileBarChart,
  LayoutGrid,
  HelpCircle,
  Presentation,
  StickyNote,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Demo = () => {
  const [notebookTitle, setNotebookTitle] = useState("Untitled notebook");

  const studioFeatures = [
    { icon: Headphones, label: "Audio Overview" },
    { icon: Video, label: "Video Overview" },
    { icon: Network, label: "Mind Map" },
    { icon: FileBarChart, label: "Reports" },
    { icon: LayoutGrid, label: "Flashcards" },
    { icon: HelpCircle, label: "Quiz" },
    { icon: FileText, label: "Infographic" },
    { icon: Presentation, label: "Slide deck" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              value={notebookTitle}
              onChange={(e) => setNotebookTitle(e.target.value)}
              className="bg-transparent text-lg font-medium focus:outline-none border-b border-transparent hover:border-white/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create notebook
          </Button>
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <Grid3X3 className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Sources Panel */}
        <div className="w-[360px] border-r border-white/10 flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Sources</h2>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <FileText className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Add Sources Button */}
          <div className="px-4 mb-4">
            <Button className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 gap-2">
              <Plus className="w-4 h-4" />
              Add sources
            </Button>
          </div>

          {/* Deep Research */}
          <div className="mx-4 p-3 rounded-xl bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm">
                  <span className="text-emerald-400 font-medium cursor-pointer hover:underline">Try Deep Research</span>
                  {" "}for an in-depth report and new sources!
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input 
                placeholder="Search the web for new sources"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="px-4 mb-6 flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/15 gap-2">
              <Globe className="w-4 h-4" />
              Web
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/15 gap-2">
              <Zap className="w-4 h-4" />
              Fast research
            </Button>
            <Button size="icon" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white/30" />
            </div>
            <h3 className="font-medium text-white/90 mb-2">Saved sources will appear here</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Click Add source above to add PDFs, websites, text, videos or audio files. Or import a file directly from Google Drive.
            </p>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-r border-white/10">
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <h2 className="text-lg font-medium">Chat</h2>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-medium text-white/90 mb-4">Add a source to get started</h3>
            <Button className="bg-[#2a2a2a] hover:bg-[#333] text-white border border-white/20 gap-2">
              <Upload className="w-4 h-4" />
              Upload a source
            </Button>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input 
                  placeholder="Upload a source to get started"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 pr-24"
                  disabled
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30">
                  0 sources
                </span>
              </div>
              <Button size="icon" className="bg-white/10 hover:bg-white/15 text-white/50">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Studio Panel */}
        <div className="w-[280px] flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Studio</h2>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <FileText className="w-4 h-4" />
            </Button>
          </div>

          {/* Language Banner */}
          <div className="mx-4 p-3 rounded-xl bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-500/30 mb-6">
            <p className="text-xs text-white/70">
              Create an Audio Overview in:{" "}
              <span className="text-blue-400">हिन्दी</span>,{" "}
              <span className="text-blue-400">বাংলা</span>,{" "}
              <span className="text-blue-400">ગુજરાતી</span>,{" "}
              <span className="text-blue-400">ಕನ್ನಡ</span>,{" "}
              <span className="text-blue-400">മലയാളം</span>,{" "}
              <span className="text-blue-400">मराठी</span>,{" "}
              <span className="text-blue-400">ਪੰਜਾਬੀ</span>,{" "}
              <span className="text-blue-400">தமிழ்</span>,{" "}
              <span className="text-blue-400">తెలుగు</span>
            </p>
          </div>

          {/* Studio Features Grid */}
          <div className="px-4 grid grid-cols-2 gap-2 mb-6">
            {studioFeatures.map((feature) => (
              <button
                key={feature.label}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <feature.icon className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white/70">{feature.label}</span>
              </button>
            ))}
          </div>

          {/* Studio Output */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white/30" />
            </div>
            <h3 className="font-medium text-white/90 mb-2">Studio output will be saved here.</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              After adding sources, create an Audio Overview, study guides, and more!
            </p>
          </div>

          {/* Add Note Button */}
          <div className="p-4">
            <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
              <StickyNote className="w-4 h-4" />
              Add note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
