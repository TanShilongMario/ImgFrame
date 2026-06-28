import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { getTemplateById } from "../templates/registry";
import { randomizeWithinTemplate } from "../templates/randomize";
import { pickHeroImage } from "../media/heroImages";
import type { TemplateParams } from "../types";
import { HeroTemplateCard } from "./components/HeroTemplateCard";
import { HeroUploadPanel, type HeroCeremonyPhase } from "./components/HeroUploadPanel";

export type HeroUploadOptions = {
  previewParams: TemplateParams;
  templateId: string;
};

type HeroPageProps = {
  isBusy: boolean;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
  onScrollDown: () => void;
};

const heroTemplate = getTemplateById("frameforge-signature");

const CEREMONY_STEPS: Array<{ phase: HeroCeremonyPhase; label: string; delay: number }> = [
  { phase: "dots", label: "素材进入画布", delay: 0 },
  { phase: "reading", label: "正在采样色彩", delay: 900 },
  { phase: "transforming", label: "正在生成展示卡片", delay: 1900 },
  { phase: "done", label: "即将进入编辑器", delay: 2800 }
];

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function HeroPage({ isBusy, onMagicFrame, onScrollDown }: HeroPageProps) {
  const previewUrlRef = useRef<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState(() => pickHeroImage());
  const [heroParams, setHeroParams] = useState(() => heroTemplate.baseParams);
  const [heroAssetRatio, setHeroAssetRatio] = useState(0.75);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<HeroCeremonyPhase>("idle");
  const [ceremonyLabel, setCeremonyLabel] = useState("");

  useEffect(() => {
    if (!rawImageSrc) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setHeroAssetRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = rawImageSrc;
  }, [rawImageSrc]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function setPreviewFromFile(file: File) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    setSelectedFile(file);
  }

  function handleSwapRawImage() {
    setRawImageSrc((current) => pickHeroImage(current));
  }

  function handleRandomizeTemplate() {
    setHeroParams(randomizeWithinTemplate(heroTemplate.id));
  }

  function handleRawEnter(event: React.MouseEvent<HTMLElement>) {
    const rotation = (Math.random() * 4 - 2).toFixed(2);
    event.currentTarget.style.setProperty("--hero-hover-rotate", `${rotation}deg`);
  }

  function handleRawLeave(event: React.MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--hero-hover-rotate", "0deg");
  }

  function openUploadPanel() {
    if (isBusy || ceremonyPhase !== "idle") {
      return;
    }

    setUploadPanelOpen(true);
  }

  function closeUploadPanel() {
    if (ceremonyPhase !== "idle") {
      return;
    }

    setUploadPanelOpen(false);
    setIsDragOver(false);
  }

  function handleFileSelect(file?: File) {
    if (!file || !isImageFile(file) || isBusy || ceremonyPhase !== "idle") {
      return;
    }

    setUploadPanelOpen(true);
    setPreviewFromFile(file);
  }

  function handlePageDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (isBusy || ceremonyPhase !== "idle") {
      return;
    }

    setIsDragOver(true);
    setUploadPanelOpen(true);
  }

  function handlePageDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handlePageDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);

    if (isBusy || ceremonyPhase !== "idle") {
      return;
    }

    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  }

  async function handleMagicFrame() {
    if (!selectedFile || isBusy || ceremonyPhase !== "idle") {
      return;
    }

    try {
      let previousDelay = 0;
      for (const step of CEREMONY_STEPS) {
        const waitMs = step.delay - previousDelay;
        if (waitMs > 0) {
          await wait(waitMs);
        }

        setCeremonyPhase(step.phase);
        setCeremonyLabel(step.label);
        previousDelay = step.delay;
      }

      await wait(500);
      await onMagicFrame(selectedFile, {
        previewParams: heroParams,
        templateId: heroTemplate.id
      });
    } finally {
      setCeremonyPhase("idle");
      setCeremonyLabel("");
      setUploadPanelOpen(false);
      setSelectedFile(null);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setPreviewUrl(null);
    }
  }

  return (
    <div
      className={`hero-page${isDragOver ? " is-drag-over" : ""}${uploadPanelOpen ? " is-upload-open" : ""}`}
      onDragLeave={handlePageDragLeave}
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
    >
      <div className="hero-copy">
        <h1 className="hero-title">Your photo, instantly framed.</h1>
        <p className="hero-lead">
          Upload what you already have. FrameForge wraps it in a polished card, ready to post without design work.
        </p>
        <div className="hero-upload-row">
          <button
            className="hero-upload"
            disabled={isBusy || ceremonyPhase !== "idle"}
            type="button"
            onClick={openUploadPanel}
          >
            <Upload aria-hidden="true" className="hero-upload-icon" size={16} strokeWidth={2.4} />
            <span>Try from a Photo</span>
          </button>
          <p className="hero-upload-hint">JPG · PNG — drag anywhere to upload</p>
        </div>
      </div>

      <div aria-hidden="true" className="hero-showcase">
        <figure
          className="hero-raw hero-hover-card"
          onClick={handleSwapRawImage}
          onMouseEnter={handleRawEnter}
          onMouseLeave={handleRawLeave}
          style={{ "--hero-raw-ratio": String(heroAssetRatio) } as React.CSSProperties}
        >
          <img alt="原始素材" src={rawImageSrc} />
        </figure>
        <HeroTemplateCard
          aspectRatio={heroAssetRatio}
          imageAlt="模版包装效果"
          imageSrc={rawImageSrc}
          onRandomize={handleRandomizeTemplate}
          params={heroParams}
        />
      </div>

      <HeroUploadPanel
        ceremonyLabel={ceremonyLabel}
        ceremonyPhase={ceremonyPhase}
        isBusy={isBusy}
        isDragOver={isDragOver}
        open={uploadPanelOpen}
        previewUrl={previewUrl}
        onClose={closeUploadPanel}
        onDragEnter={() => setIsDragOver(true)}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handlePageDrop}
        onFileSelect={handleFileSelect}
        onMagicFrame={() => void handleMagicFrame()}
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
