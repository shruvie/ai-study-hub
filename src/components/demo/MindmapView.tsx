import { useMemo } from "react";

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
}

interface MindmapViewProps {
  diagram: string;
}

const MindmapView = ({ diagram }: MindmapViewProps) => {
  // Parse diagram string into structured nodes
  const mindmapData = useMemo(() => {
    try {
      // Try to extract meaningful content from the diagram
      const lines = diagram.split('\n').filter(line => line.trim() && !line.includes('mindmap') && !line.includes('graph'));
      
      // Create a default structure if parsing fails
      if (lines.length < 2) {
        return getDefaultMindmap();
      }

      // Extract labels from the diagram
      const labels: string[] = [];
      lines.forEach(line => {
        // Match content inside brackets, parentheses, or just plain text
        const matches = line.match(/\[([^\]]+)\]|\(([^)]+)\)|:::\s*(\w+)|^\s*(\w[\w\s]+)$/);
        if (matches) {
          const label = matches[1] || matches[2] || matches[3] || matches[4];
          if (label && label.trim() && !['root', 'id1', 'id2', 'id3'].includes(label.trim().toLowerCase())) {
            labels.push(label.trim());
          }
        }
      });

      if (labels.length === 0) {
        return getDefaultMindmap();
      }

      // Build structure: first label is root, rest are distributed
      const root = labels[0];
      const children = labels.slice(1, 7); // Max 6 children for cleaner look

      return {
        id: 'root',
        label: root,
        children: children.map((label, i) => ({
          id: `child-${i}`,
          label,
          children: []
        }))
      };
    } catch {
      return getDefaultMindmap();
    }
  }, [diagram]);

  return (
    <div className="h-full flex items-center justify-center overflow-auto p-8">
      <div className="relative w-full max-w-4xl">
        {/* Central Node */}
        <div className="flex flex-col items-center">
          <CentralNode label={mindmapData.label} />
          
          {/* Branch Container */}
          {mindmapData.children && mindmapData.children.length > 0 && (
            <div className="mt-8 w-full">
              {/* SVG Connections */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="hsl(var(--primary) / 0.4)"
                    />
                  </marker>
                </defs>
              </svg>

              {/* Child Nodes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12">
                {mindmapData.children.map((child, index) => (
                  <BranchNode 
                    key={child.id} 
                    node={child} 
                    index={index}
                    total={mindmapData.children?.length || 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Central/Root Node - styled like an elegant notebook title
const CentralNode = ({ label }: { label: string }) => (
  <div className="relative group">
    {/* Glow effect */}
    <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
    
    {/* Main node */}
    <div className="relative bg-gradient-to-br from-primary/90 to-primary px-8 py-5 rounded-2xl shadow-2xl border border-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] rounded-2xl" />
      <h3 className="text-xl md:text-2xl font-bold text-primary-foreground text-center relative z-10 leading-tight">
        {label}
      </h3>
    </div>

    {/* Decorative lines emanating from center */}
    <svg className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-10 overflow-visible" style={{ zIndex: -1 }}>
      <path
        d="M 64 0 C 64 20, 20 30, 0 40"
        stroke="hsl(var(--primary) / 0.3)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 2"
      />
      <path
        d="M 64 0 C 64 20, 64 30, 64 40"
        stroke="hsl(var(--primary) / 0.3)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 2"
      />
      <path
        d="M 64 0 C 64 20, 108 30, 128 40"
        stroke="hsl(var(--primary) / 0.3)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 2"
      />
    </svg>
  </div>
);

// Branch/Child Node - styled like sticky notes
const BranchNode = ({ 
  node, 
  index,
  total 
}: { 
  node: MindmapNode; 
  index: number;
  total: number;
}) => {
  // Rotate slightly for organic feel
  const rotations = [-2, 1, -1, 2, -1.5, 1.5];
  const rotation = rotations[index % rotations.length];
  
  // Color variations for sticky note effect
  const colors = [
    'from-amber-400/20 to-amber-500/10 border-amber-400/30',
    'from-rose-400/20 to-rose-500/10 border-rose-400/30',
    'from-sky-400/20 to-sky-500/10 border-sky-400/30',
    'from-emerald-400/20 to-emerald-500/10 border-emerald-400/30',
    'from-violet-400/20 to-violet-500/10 border-violet-400/30',
    'from-orange-400/20 to-orange-500/10 border-orange-400/30',
  ];
  const colorClass = colors[index % colors.length];

  return (
    <div 
      className="relative group"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Shadow/depth effect */}
      <div className="absolute inset-0 bg-black/10 rounded-lg translate-x-1 translate-y-1 blur-sm" />
      
      {/* Sticky note body */}
      <div className={`
        relative bg-gradient-to-br ${colorClass} 
        px-5 py-4 rounded-lg 
        transform transition-all duration-300
        hover:scale-105 hover:-rotate-1
        cursor-default
      `}>
        {/* Tape/pin decoration at top */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-primary/20 rounded-sm border border-primary/30" />
        
        {/* Subtle paper texture */}
        <div className="absolute inset-0 opacity-30 rounded-lg" 
          style={{ 
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, hsl(var(--foreground) / 0.03) 24px, hsl(var(--foreground) / 0.03) 25px)'
          }} 
        />
        
        {/* Content */}
        <p className="text-sm md:text-base font-medium text-foreground/90 text-center relative z-10 leading-snug">
          {node.label}
        </p>

        {/* Corner fold effect */}
        <div className="absolute bottom-0 right-0 w-4 h-4 overflow-hidden">
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-background/50 transform rotate-45 translate-x-3 translate-y-3" />
        </div>
      </div>
    </div>
  );
};

// Default mindmap when parsing fails
const getDefaultMindmap = (): MindmapNode => ({
  id: 'root',
  label: 'Main Topic',
  children: [
    { id: 'c1', label: 'Key Concept 1' },
    { id: 'c2', label: 'Key Concept 2' },
    { id: 'c3', label: 'Key Concept 3' },
    { id: 'c4', label: 'Important Detail' },
    { id: 'c5', label: 'Related Idea' },
    { id: 'c6', label: 'Summary Point' },
  ]
});

export default MindmapView;
