import { Sparkles, Route, MessageCircle } from "lucide-react";

const solutions = [
  {
    icon: Sparkles,
    title: "Personalized Learning Paths",
    description: "Our AI analyzes your learning style, pace, and goals to create a customized curriculum just for you.",
  },
  {
    icon: Route,
    title: "Smart Content Recommendations",
    description: "Receive curated study materials, videos, and exercises tailored to fill your specific knowledge gaps.",
  },
  {
    icon: MessageCircle,
    title: "Instant AI Support",
    description: "Get real-time answers to your questions with an AI that understands the context of your studies.",
  },
];

const SolutionSection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container-tight relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              Our Solution
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              AI That Adapts to{" "}
              <span className="gradient-text">How You Learn</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Experience a revolutionary approach to education where artificial intelligence creates 
              personalized learning experiences, recommends the perfect study content, and provides 
              instant support whenever you need it.
            </p>

            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div
                  key={solution.title}
                  className="flex gap-4 opacity-0 animate-slide-in-left"
                  style={{ animationDelay: `${0.2 + index * 0.15}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <solution.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {solution.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {solution.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative opacity-0 animate-slide-in-right" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card p-8 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">LearnAI Assistant</p>
                    <p className="text-sm text-muted-foreground">Analyzing your progress...</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm text-foreground mb-2">📚 Your learning profile shows you're a visual learner</p>
                    <p className="text-xs text-muted-foreground">Based on your interaction patterns</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm text-foreground mb-2">🎯 Recommended: Video tutorials on calculus</p>
                    <p className="text-xs text-muted-foreground">Matches your current study goals</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>AI actively learning from your progress</span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/30 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
