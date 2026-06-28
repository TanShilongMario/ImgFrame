import { useRef } from "react";
import { HeroDotField } from "./HeroDotField";

export type HeroCeremonyPhase = "idle" | "dots" | "reading" | "transforming" | "done";

type HeroUploadPanelProps = {
  open: boolean;
  previewUrl: string | null;
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

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function HeroUploadPanel({
  open,
  previewUrl,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeInputRef = useRef<HTMLInputElement>(null);
  const isCeremony = ceremonyPhase !== "idle";
  const hasPreview = Boolean(previewUrl);

  if (!open) {
    return null;
  }

  function openFilePicker(target: "upload" | "change") {
    if (isBusy || isCeremony) {
      return;
    }

    if (target === "upload") {
      fileInputRef.current?.click();
      return;
    }

    changeInputRef.current?.click();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    onFileSelect(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragEnter();
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      onDragLeave();
    }
  }

  function handleDropInternal(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && isImageFile(file)) {
      onFileSelect(file);
      return;
    }

    onDrop(event);
  }

  return (
    <div className="hero-upload-panel" role="dialog" aria-modal="true" aria-label="上传图片">
      <button
        aria-label="关闭上传面板"
        className="hero-upload-panel-backdrop"
        disabled={isCeremony}
        type="button"
        onClick={onClose}
      />

      <div
        className={`hero-upload-card${isDragOver ? " is-drag-over" : ""}${isCeremony ? " is-ceremony" : ""}`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDropInternal}
      >
        <div className="hero-upload-frame">
          {hasPreview && ceremonyPhase === "idle" ? (
            <img alt="已选图片预览" className="hero-upload-preview" src={previewUrl ?? undefined} />
          ) : null}

          {hasPreview && isCeremony ? <HeroDotField active imageUrl={previewUrl ?? ""} /> : null}

          {isCeremony ? (
            <div className="hero-upload-ceremony-copy">
              <p className="hero-upload-ceremony-label">{ceremonyLabel}</p>
              <div className="hero-upload-ceremony-bar">
                <span className={`hero-upload-ceremony-progress is-${ceremonyPhase}`} aria-hidden="true" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="hero-upload-actions">
          {!hasPreview ? (
            <>
              <input
                ref={fileInputRef}
                accept="image/*"
                hidden
                type="file"
                onChange={handleInputChange}
              />
              <button
                className="hero-upload-action hero-upload-action-primary"
                disabled={isBusy}
                type="button"
                onClick={() => openFilePicker("upload")}
              >
                Upload an image
              </button>
            </>
          ) : (
            <>
              <input
                ref={changeInputRef}
                accept="image/*"
                hidden
                type="file"
                onChange={handleInputChange}
              />
              <button
                className="hero-upload-action hero-upload-action-secondary"
                disabled={isBusy || isCeremony}
                type="button"
                onClick={() => openFilePicker("change")}
              >
                Change Photo
              </button>
              <button
                className="hero-upload-action hero-upload-action-magic"
                disabled={isBusy || isCeremony}
                type="button"
                onClick={onMagicFrame}
              >
                Magic Frame
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
