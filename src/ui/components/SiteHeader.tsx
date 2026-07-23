import type { AppSection } from "../../hooks/useOrchestratedNavigation";
import { useLocale } from "../../i18n/LocaleContext";
import { LanguageToggle } from "./LanguageToggle";

type SiteHeaderProps = {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
};

export function SiteHeader({ activeSection, onNavigate }: SiteHeaderProps) {
  const { t } = useLocale();

  const navItems: { id: AppSection; labelKey: "nav.home" | "nav.design" | "nav.gallery" | "nav.album" }[] = [
    { id: "hero", labelKey: "nav.home" },
    { id: "editor", labelKey: "nav.design" },
    { id: "gallery", labelKey: "nav.gallery" },
    { id: "album", labelKey: "nav.album" }
  ];

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
            {t(item.labelKey)}
          </button>
        ))}
        <LanguageToggle variant="header" />
      </nav>
    </header>
  );
}
