import { Upload } from "lucide-react";
import { useHeroUploadFlow } from "../hooks/useHeroUploadFlow";
import { HeroShowcase } from "./components/HeroShowcase";
import { HeroUploadPanel } from "./components/HeroUploadPanel";
import type { TemplateParams } from "../types";

export type HeroUploadOptions = {
  previewParams: TemplateParams;
  templateId: string;
};

type HeroPageProps = {
  isBusy: boolean;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
  onScrollDown: () => void;
};

export function HeroPage({ isBusy, onMagicFrame, onScrollDown }: HeroPageProps) {
  const flow = useHeroUploadFlow({ isBusy, onMagicFrame });

  return (
    <div
      className={`hero-page${flow.isDragOver ? " is-drag-over" : ""}${flow.uploadPanelOpen ? " is-upload-open" : ""}`}
      onDragLeave={flow.handleDragLeave}
      onDragOver={flow.handleDragOver}
      onDrop={flow.handleDrop}
    >
      <div className="hero-copy">
        <h1 className="hero-title">Your photo, instantly framed.</h1>
        <p className="hero-lead">
          Upload what you already have. FrameForge wraps it in a polished card, ready to post without design work.
        </p>
        <div className="hero-upload-row">
          <button
            className="hero-upload"
            disabled={isBusy || flow.ceremonyPhase !== "idle"}
            type="button"
            onClick={flow.openUploadPanel}
          >
            <Upload aria-hidden="true" className="hero-upload-icon" size={16} strokeWidth={2.4} />
            <span>Try from a Photo or Video</span>
          </button>
          <p className="hero-upload-hint">JPG · PNG · MP4 · MOV — drag anywhere to upload</p>
        </div>
      </div>

      <HeroShowcase
        heroAssetRatio={flow.heroAssetRatio}
        params={flow.heroPreview.params}
        rawImageSrc={flow.rawImageSrc}
        templateId={flow.heroPreview.templateId}
        onRandomizeTemplate={flow.handleRandomizeTemplate}
        onRawEnter={flow.handleRawEnter}
        onRawLeave={flow.handleRawLeave}
        onSwapRawImage={flow.handleSwapRawImage}
      />

      <HeroUploadPanel
        ceremonyLabel={flow.ceremonyLabel}
        ceremonyPhase={flow.ceremonyPhase}
        isBusy={isBusy}
        isDragOver={flow.isDragOver}
        isPreviewLoading={flow.isPreviewLoading}
        open={flow.uploadPanelOpen}
        previewUrl={flow.previewUrl}
        onClose={flow.closeUploadPanel}
        onDragEnter={flow.handlePanelDragEnter}
        onDragLeave={flow.handlePanelDragLeave}
        onDrop={flow.handleDrop}
        onFileSelect={flow.handleFileSelect}
        onMagicFrame={() => void flow.handleMagicFrame()}
      />

      <button
        aria-label="进入编辑器"
        className="scroll-hint scroll-hint-down"
        type="button"
        onClick={onScrollDown}
      >
        <span className="scroll-hint-icon" aria-hidden="true" />
      </button>
    </div>
  );
}
