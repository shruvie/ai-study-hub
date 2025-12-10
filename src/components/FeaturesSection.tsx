import {
  User,
  Lightbulb,
  Route,
  FileText,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Smartphone,
  Database,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: User,
    title: "AI-Based Student Profiling",
    description: "Understand your learning style, strengths, and areas for improvement through intelligent analysis.",
  },
  {
    icon: Lightbulb,
    title: "Adaptive Content Recommendation",
    description: "Receive personalized study materials that evolve based on your progress and preferences.",
  },
  {
    icon: Route,
    title: "Personalized Learning Path",
    description: "Follow a customized curriculum designed specifically for your goals and pace.",
  },
  {
    icon: FileText,
    title: "AI-Powered Notebook",
    description: "Upload notes and documents—our AI extracts insights and creates study guides automatically.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Doubt Solving",
    description: "Get instant answers to your questions with context-aware AI assistance.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track your progress with detailed dashboards and actionable insights.",
  },
  {
    icon: RefreshCw,
    title: "Smart Revision System",
    description: "Spaced repetition and intelligent scheduling ensure long-term knowledge retention.",
  },
  {
    icon: Smartphone,
    title: "Multi-Device Access",
    description: "Learn seamlessly across all your devices with synchronized progress.",
  },
  {
    icon: Database,
    title: "Data-Driven Feedback",
    description: "Receive actionable recommendations based on comprehensive learning analytics.",
  },
  {
    icon: Shield,
    title: "Secure & Scalable",
    description: "Enterprise-grade security with infrastructure that scales with your needs.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding bg-secondary/30">
      <div className="container-tight">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Learn Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive suite of AI-powered tools designed to transform your learning experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-6 hover-lift group opacity-0 animate-scale-in"
              style={{ animationDelay: `${0.05 + index * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent group-hover:gradient-primary transition-all duration-300 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
