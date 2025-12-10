import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Brain, BookOpen } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container-tight relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 text-sm font-medium text-accent-foreground mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI-Powered Learning Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Your Personal{" "}
            <span className="gradient-text">AI Study</span>
            <br />
            Companion
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Adaptive learning, personalized study paths, and an AI notebook that understands your notes—just like NotebookLM.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Button variant="hero" size="xl">
              Try the Demo
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Floating Cards */}
          <div className="relative h-64 md:h-80 opacity-0 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            {/* Main Card */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-72 md:w-80 glass-card p-6 animate-float">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AI Analysis</p>
                  <p className="text-sm text-muted-foreground">Understanding your notes...</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 gradient-primary rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">Generating personalized insights</p>
              </div>
            </div>

            {/* Left Card */}
            <div className="absolute left-0 md:left-10 top-12 w-48 glass-card p-4 animate-float-delayed hidden sm:block">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Study Path</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 bg-accent rounded-full w-full" />
                <div className="h-1.5 bg-accent rounded-full w-4/5" />
                <div className="h-1.5 bg-accent rounded-full w-3/5" />
              </div>
            </div>

            {/* Right Card */}
            <div className="absolute right-0 md:right-10 top-20 w-44 glass-card p-4 animate-float hidden sm:block" style={{ animationDelay: "1s" }}>
              <p className="text-sm font-medium text-foreground mb-2">Progress</p>
              <div className="flex items-end gap-1 h-12">
                {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t gradient-primary opacity-80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
