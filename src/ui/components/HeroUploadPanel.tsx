import { HeroUploadCard, type HeroCeremonyPhase } from "./HeroUploadCard";

export type { HeroCeremonyPhase } from "./HeroUploadCard";

type HeroUploadPanelProps = {
  open: boolean;
  previewUrl: string | null;
  isPreviewLoading?: boolean;
  ceremonyPhase: HeroCeremonyPhase;
  ceremonyLabel: string;
  isDragOver: boolean;
  isBusy: boolean;
  onClose: () => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (file?: File) => void;
  onMagicFrame: () => void;
};

export function HeroUploadPanel({
  open,
  previewUrl,
  isPreviewLoading = false,
  ceremonyPhase,
  ceremonyLabel,
  isDragOver,
  isBusy,
  onClose,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileSelect,
  onMagicFrame
}: HeroUploadPanelProps) {
  const isCeremony = ceremonyPhase !== "idle";

  if (!open) {
    return null;
  }

  return (
    <div className="hero-upload-panel" role="dialog" aria-modal="true" aria-label="上传素材">
      <button
        aria-label="关闭上传面板"
        className="hero-upload-panel-backdrop"
        disabled={isCeremony}
        type="button"
        onClick={onClose}
      />

      <HeroUploadCard
        ceremonyLabel={ceremonyLabel}
        ceremonyPhase={ceremonyPhase}
        isBusy={isBusy}
        isDragOver={isDragOver}
        isPreviewLoading={isPreviewLoading}
        previewUrl={previewUrl}
        variant="modal"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onFileSelect={onFileSelect}
        onMagicFrame={onMagicFrame}
      />
    </div>
  );
}
