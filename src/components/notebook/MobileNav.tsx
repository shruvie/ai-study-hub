import { FileText, MessageSquare, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activePane: 'sources' | 'chat' | 'insights';
  onPaneChange: (pane: 'sources' | 'chat' | 'insights') => void;
}

const MobileNav = ({ activePane, onPaneChange }: MobileNavProps) => {
  const navItems = [
    { id: 'sources' as const, label: 'Sources', icon: FileText },
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'insights' as const, label: 'Insights', icon: Brain },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onPaneChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors",
              activePane === item.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
