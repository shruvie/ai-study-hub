import { AlertCircle, Clock, Target } from "lucide-react";

const problems = [
  {
    icon: AlertCircle,
    title: "Generic Learning Resources",
    description: "One-size-fits-all content fails to address individual learning styles, pace, and knowledge gaps.",
  },
  {
    icon: Target,
    title: "Lack of Personalization",
    description: "Students waste time on topics they've mastered while struggling with concepts that need more attention.",
  },
  {
    icon: Clock,
    title: "Ineffective Revision",
    description: "Without smart scheduling and adaptive review, knowledge fades quickly after initial learning.",
  },
];

const ProblemSection = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-tight">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            The Challenge
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Why Traditional Learning Falls Short
          </h2>
          <p className="text-lg text-muted-foreground">
            Students face significant hurdles with conventional learning approaches that don't adapt to their unique needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className="glass-card p-8 hover-lift opacity-0 animate-fade-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                <problem.icon className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {problem.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
