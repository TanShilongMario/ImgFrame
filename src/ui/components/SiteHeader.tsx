// import { Moon, Sun } from "lucide-react";
import type { AppSection } from "../../hooks/useOrchestratedNavigation";
// import type { AppTheme } from "../../hooks/useAppTheme";

type SiteHeaderProps = {
  activeSection: AppSection;
  // theme: AppTheme;
  onNavigate: (section: AppSection) => void;
  // onToggleTheme: () => void;
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
        {/* 暗色模式入口暂时下线，样式待优化后再启用
        <button
          aria-label={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
          className="site-header-theme-toggle"
          title={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
          type="button"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" size={15} strokeWidth={2.2} />
          ) : (
            <Moon aria-hidden="true" size={15} strokeWidth={2.2} />
          )}
        </button>
        */}
      </nav>
    </header>
  );
}
