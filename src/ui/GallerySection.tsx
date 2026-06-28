import { RotateCw, Images, ArrowUp } from "lucide-react";
import type { GalleryEntry } from "../gallery/catalog";
import { CardPreview } from "./components/CardPreview";

type GallerySectionProps = {
  entries: GalleryEntry[];
  onApplyEntry: (entry: GalleryEntry) => void;
  onRefreshBatch: () => void;
  onNavigate: (section: "hero" | "editor" | "gallery" | "album") => void;
};

export function GallerySection({ entries, onApplyEntry, onRefreshBatch, onNavigate }: GallerySectionProps) {
  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div>
          <p className="gallery-eyebrow">Gallery</p>
          <p className="gallery-lead">{entries.length} 种精选组合 · 点击卡片套用，回到编辑器继续微调</p>
        </div>
        <div className="gallery-header-actions">
          <button className="stage-action nav-action" type="button" onClick={onRefreshBatch}>
            <RotateCw aria-hidden="true" size={14} strokeWidth={2.2} />
            换一批
          </button>
          <button className="stage-action nav-action" type="button" onClick={() => onNavigate("album")}>
            <Images aria-hidden="true" size={14} strokeWidth={2.2} />
            前往画册
          </button>
          <button className="stage-action stage-action-primary nav-action" type="button" onClick={() => onNavigate("editor")}>
            <ArrowUp aria-hidden="true" size={14} strokeWidth={2.2} />
            返回编辑器
          </button>
        </div>
      </header>

      <div className="gallery-scroll-container">
        <div className="gallery-grid">
          {entries.map((entry) => (
            <button className="gallery-card" key={entry.id} type="button" onClick={() => onApplyEntry(entry)}>
              <CardPreview
                mediaUrl={entry.mediaUrl}
                params={entry.params}
                templateId={entry.templateId}
                variant="gallery"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
