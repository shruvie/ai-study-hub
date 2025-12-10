import { Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const DemoSection = () => {
  return (
    <section className="section-padding">
      <div className="container-tight">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Demo
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            See LearnAI{" "}
            <span className="gradient-text">In Action</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Watch how our AI transforms the way you learn with personalized insights and adaptive content.
          </p>
        </div>

        {/* Video Placeholder */}
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-3xl overflow-hidden glass-card group cursor-pointer hover-lift">
            {/* Gradient Background */}
            <div className="absolute inset-0 gradient-primary opacity-10" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:2rem_2rem]" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              {/* Play Button */}
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Demo Video Coming Soon
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                We're putting the finishing touches on our product demo. Check back soon!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="hero" size="lg">
                  <Play className="w-5 h-5" />
                  Get Notified
                </Button>
                <Button variant="glass" size="lg">
                  <Upload className="w-5 h-5" />
                  Upload Your Demo
                </Button>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-24 h-24 border-2 border-primary/20 rounded-2xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-primary/20 rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
