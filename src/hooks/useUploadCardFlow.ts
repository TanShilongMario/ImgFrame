import { useEffect, useRef, useState } from "react";
import { randomizeTemplatePick } from "../templates/randomize";
import type { HeroCeremonyPhase } from "../ui/components/HeroUploadPanel";
import type { HeroUploadOptions } from "../ui/HeroPage";

// 每幕之间刻意留出静止的一拍，营造"起 — 顿 — 起"的仪式节奏
const CEREMONY_STEPS: Array<{ phase: HeroCeremonyPhase; label: string; delay: number }> = [
  { phase: "dots", label: "素材进入画布", delay: 0 },
  { phase: "reading", label: "正在采样色彩", delay: 1650 },
  { phase: "transforming", label: "正在生成展示卡片", delay: 3250 },
  { phase: "done", label: "定格完成 · 即将进入编辑器", delay: 4600 }
];

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type UseUploadCardFlowOptions = {
  isBusy: boolean;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
  onAfterMagicFrame?: () => void;
  getMagicOptions?: () => HeroUploadOptions;
};

export function useUploadCardFlow({
  isBusy,
  onMagicFrame,
  onAfterMagicFrame,
  getMagicOptions
}: UseUploadCardFlowOptions) {
  const previewUrlRef = useRef<string | null>(null);
  const [fallbackPreview] = useState(() => randomizeTemplatePick());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<HeroCeremonyPhase>("idle");
  const [ceremonyLabel, setCeremonyLabel] = useState("");

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

  function handleFileSelect(file?: File) {
    if (!file || !isImageFile(file) || isBusy || ceremonyPhase !== "idle") {
      return;
    }

    setPreviewFromFile(file);
  }

  function handlePanelDragEnter() {
    if (isBusy || ceremonyPhase !== "idle") {
      return;
    }

    setIsDragOver(true);
  }

  function handlePanelDragLeave() {
    setIsDragOver(false);
  }

  function resetPreview() {
    setSelectedFile(null);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
    setIsDragOver(false);
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

      // 白光定格后多停留一拍，让"惊喜"落地再进入编辑器
      await wait(1050);
      const magicOptions = getMagicOptions?.() ?? {
        previewParams: fallbackPreview.params,
        templateId: fallbackPreview.templateId
      };
      await onMagicFrame(selectedFile, magicOptions);
    } finally {
      setCeremonyPhase("idle");
      setCeremonyLabel("");
      resetPreview();
      onAfterMagicFrame?.();
    }
  }

  return {
    previewUrl,
    isDragOver,
    ceremonyPhase,
    ceremonyLabel,
    handleFileSelect,
    handlePanelDragEnter,
    handlePanelDragLeave,
    handleMagicFrame,
    resetPreview
  };
}
