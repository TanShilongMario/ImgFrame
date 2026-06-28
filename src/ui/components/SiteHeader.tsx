import type { AppSection } from "../../hooks/useOrchestratedNavigation";

type SiteHeaderProps = {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
};

const navItems: { id: AppSection; label: string }[] = [
  { id: "hero", label: "Home" },
  { id: "editor", label: "Design" },
  { id: "gallery", label: "Gallery" },
  { id: "album", label: "My Frames" }
];

export function SiteHeader({ activeSection, onNavigate }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-brand">FrameForge</div>
      <nav className="site-header-nav">
        {navItems.map((item) => (
          <button
            className={`site-header-nav-item${activeSection === item.id ? " is-active" : ""}`}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
