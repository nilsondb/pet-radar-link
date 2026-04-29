import { Menu } from "lucide-react";

interface Props {
  title: string;
  onMenuClick?: () => void;
}

export const PetHeader = ({ title, onMenuClick }: Props) => (
  <header className="header-gradient text-primary-foreground sticky top-0 z-30 shadow-md">
    <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  </header>
);
