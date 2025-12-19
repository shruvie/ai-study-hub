import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MindmapViewProps {
  diagram: string;
}

const MindmapView = ({ diagram }: MindmapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#818cf8',
        lineColor: '#a5b4fc',
        secondaryColor: '#312e81',
        tertiaryColor: '#1e1b4b',
      },
      flowchart: {
        curve: 'basis',
        padding: 20,
      },
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (containerRef.current && diagram) {
        containerRef.current.innerHTML = '';
        try {
          const { svg } = await mermaid.render('mindmap-svg', diagram);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          containerRef.current.innerHTML = `
            <div class="text-center p-8 text-white/50">
              <p>Unable to render diagram</p>
              <pre class="mt-4 text-xs text-left bg-white/5 p-4 rounded-lg overflow-auto">${diagram}</pre>
            </div>
          `;
        }
      }
    };
    renderDiagram();
  }, [diagram]);

  return (
    <div className="h-full flex items-center justify-center overflow-auto p-4">
      <div 
        ref={containerRef} 
        className="w-full [&_svg]:max-w-full [&_svg]:h-auto"
      />
    </div>
  );
};

export default MindmapView;
