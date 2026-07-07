import { useRef, type DragEvent, type ChangeEvent } from "react";
import { isUploadableMediaFile } from "../../media/videoPoster";
import { HeroDotField } from "./HeroDotField";

export type HeroCeremonyPhase = "idle" | "dots" | "reading" | "transforming" | "done";

type HeroUploadCardProps = {
  previewUrl: string | null;
  isPreviewLoading?: boolean;
  ceremonyPhase: HeroCeremonyPhase;
  ceremonyLabel: string;
  isDragOver: boolean;
  isBusy: boolean;
  imageOnly?: boolean;
  variant?: "modal" | "inline";
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileSelect: (file?: File) => void;
  onMagicFrame: () => void;
};

function isMediaFile(file: File, imageOnly: boolean): boolean {
  if (imageOnly) {
    return file.type.startsWith("image/");
  }

  return isUploadableMediaFile(file);
}

export function HeroUploadCard({
  previewUrl,
  isPreviewLoading = false,
  ceremonyPhase,
  ceremonyLabel,
  isDragOver,
  isBusy,
  imageOnly = false,
  variant = "modal",
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileSelect,
  onMagicFrame
}: HeroUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeInputRef = useRef<HTMLInputElement>(null);
  const isCeremony = ceremonyPhase !== "idle";
  const hasPreview = Boolean(previewUrl);
  const hasSelectedMedia = hasPreview || isPreviewLoading;
  const showPreviewImage = hasPreview && (ceremonyPhase === "idle" || ceremonyPhase === "done");

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

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    onFileSelect(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragEnter();
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      onDragLeave();
    }
  }

  function handleDropInternal(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && isMediaFile(file, imageOnly)) {
      onFileSelect(file);
      return;
    }

    onDrop(event);
  }

  const mediaAccept = imageOnly ? "image/*" : "image/*,video/*";
  const uploadLabel = imageOnly ? "上传图片" : "Upload photo or video";

  return (
    <div
      className={`hero-upload-card${variant === "inline" ? " hero-upload-card-inline" : ""}${!hasSelectedMedia && !isCeremony ? " is-empty" : ""}${isDragOver ? " is-drag-over" : ""}${isCeremony ? " is-ceremony" : ""} is-phase-${ceremonyPhase}`}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDropInternal}
    >
      <div className="hero-upload-frame">
        {isPreviewLoading ? (
          <p className="hero-upload-preview-loading">正在读取视频首帧…</p>
        ) : null}

        {showPreviewImage ? (
          <img
            alt="已选素材预览"
            className={`hero-upload-preview${ceremonyPhase === "done" ? " is-reveal" : ""}`}
            src={previewUrl ?? undefined}
          />
        ) : null}

        {hasPreview && isCeremony ? <HeroDotField imageUrl={previewUrl ?? ""} phase={ceremonyPhase} /> : null}

        {isCeremony ? (
          <div className="hero-upload-ceremony-copy">
            <p key={ceremonyLabel} className="hero-upload-ceremony-label">
              {ceremonyLabel}
            </p>
            <div className="hero-upload-ceremony-bar">
              <span className={`hero-upload-ceremony-progress is-${ceremonyPhase}`} aria-hidden="true" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="hero-upload-actions">
        {!hasSelectedMedia ? (
          <>
            <input ref={fileInputRef} accept={mediaAccept} hidden type="file" onChange={handleInputChange} />
            <button
              className="hero-upload-action hero-upload-action-primary"
              disabled={isBusy}
              type="button"
              onClick={() => openFilePicker("upload")}
            >
              {uploadLabel}
            </button>
          </>
        ) : (
          <>
            <input ref={changeInputRef} accept={mediaAccept} hidden type="file" onChange={handleInputChange} />
            <button
              className="hero-upload-action hero-upload-action-secondary"
              disabled={isBusy || isCeremony || isPreviewLoading}
              type="button"
              onClick={() => openFilePicker("change")}
            >
              Change Media
            </button>
            <button
              className="hero-upload-action hero-upload-action-magic"
              disabled={isBusy || isCeremony || isPreviewLoading}
              type="button"
              onClick={onMagicFrame}
            >
              Magic Frame
            </button>
          </>
        )}
      </div>
    </div>
  );
}
