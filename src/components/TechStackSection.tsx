const techStack = [
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "FastAPI", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Firebase", category: "Database" },
  { name: "GPT", category: "AI" },
  { name: "Llama", category: "AI" },
  { name: "Embeddings", category: "AI" },
  { name: "RAG", category: "AI" },
  { name: "Supabase", category: "Infrastructure" },
  { name: "Vercel", category: "Infrastructure" },
  { name: "Railway", category: "Infrastructure" },
  { name: "Render", category: "Infrastructure" },
];

const categoryColors: Record<string, string> = {
  Frontend: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Backend: "bg-green-500/10 text-green-600 border-green-500/20",
  Database: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  AI: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Infrastructure: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const TechStackSection = () => {
  return (
    <section id="tech-stack" className="section-padding bg-secondary/30">
      <div className="container-tight">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Technology
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Built with{" "}
            <span className="gradient-text">Modern Tech</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powered by cutting-edge technologies for performance, scalability, and reliability.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {techStack.map((tech, index) => (
            <div
              key={tech.name}
              className={`px-5 py-2.5 rounded-full border font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-md opacity-0 animate-scale-in ${categoryColors[tech.category]}`}
              style={{ animationDelay: `${0.03 + index * 0.03}s` }}
            >
              {tech.name}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-10">
          {Object.entries(categoryColors).map(([category, colorClass]) => (
            <div key={category} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${colorClass.split(" ")[0]}`} />
              <span className="text-muted-foreground">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
