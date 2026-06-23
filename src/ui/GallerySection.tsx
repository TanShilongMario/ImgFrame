import type { GalleryEntry } from "../gallery/catalog";
import { getDemoPreset } from "../gallery/catalog";
import { CardPreview } from "./components/CardPreview";

type GallerySectionProps = {
  entries: GalleryEntry[];
  onApplyEntry: (entry: GalleryEntry) => void;
  onRefreshBatch: () => void;
  onNavigate: (section: "hero" | "editor" | "gallery") => void;
};

export function GallerySection({ entries, onApplyEntry, onRefreshBatch, onNavigate }: GallerySectionProps) {
  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div>
          <p className="gallery-eyebrow">Gallery Mode</p>
          <h2>模板画廊</h2>
          <p className="gallery-lead">{entries.length} 种精选组合 · 点击套用，回到编辑器继续微调</p>
        </div>
        <div className="gallery-header-actions">
          <button className="gallery-refresh" type="button" onClick={onRefreshBatch}>
            换一批
          </button>
          <button className="hero-link" type="button" onClick={() => onNavigate("editor")}>
            返回编辑器 ↑
          </button>
        </div>
      </header>

      <div className="gallery-grid">
        {entries.map((entry) => (
          <button className="gallery-card" key={entry.id} type="button" onClick={() => onApplyEntry(entry)}>
            <CardPreview
              demoFill={getDemoPreset(entry.demoId).fill}
              params={entry.params}
              templateId={entry.templateId}
              variant="gallery"
            />
            <span className="gallery-card-label">{entry.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
