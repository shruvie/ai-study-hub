import { Upload, Brain, Route, MessageCircle, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Notes",
    description: "Simply upload your documents, notes, or study materials in any format.",
  },
  {
    icon: Brain,
    step: "02",
    title: "AI Analysis",
    description: "Our AI processes and understands your content, extracting key concepts and insights.",
  },
  {
    icon: Route,
    step: "03",
    title: "Get Your Path",
    description: "Receive a customized learning path with curated content and recommendations.",
  },
  {
    icon: MessageCircle,
    step: "04",
    title: "Ask Questions",
    description: "Interact with AI to clarify doubts and get personalized explanations.",
  },
  {
    icon: TrendingUp,
    step: "05",
    title: "Track & Revise",
    description: "Monitor your progress and use smart revision to retain knowledge long-term.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-padding relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container-tight relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Start Learning in{" "}
            <span className="gradient-text">5 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From uploading your first document to mastering any subject—here's your journey.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative text-center opacity-0 animate-fade-up"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                {/* Step Number Badge */}
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mx-auto relative z-10 group hover:-translate-y-2 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
