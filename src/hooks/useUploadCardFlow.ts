import { useEffect, useRef, useState } from "react";
import { createMediaPreviewUrl, isUploadableMediaFile } from "../media/videoPoster";
import { randomizeTemplatePick } from "../templates/randomize";
import type { HeroCeremonyPhase } from "../ui/components/HeroUploadPanel";
import type { HeroUploadOptions } from "../ui/HeroPage";

// 每幕之间刻意留出静止的一拍，营造"起 — 顿 — 起"的仪式节奏
const CEREMONY_STEPS: Array<{ phase: HeroCeremonyPhase; labelKey: "ceremony.enter" | "ceremony.sampling" | "ceremony.generating" | "ceremony.done"; delay: number }> = [
  { phase: "dots", labelKey: "ceremony.enter", delay: 0 },
  { phase: "reading", labelKey: "ceremony.sampling", delay: 1650 },
  { phase: "transforming", labelKey: "ceremony.generating", delay: 3250 },
  { phase: "done", labelKey: "ceremony.done", delay: 4600 }
];

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type UseUploadCardFlowOptions = {
  isBusy: boolean;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
  onAfterMagicFrame?: () => void;
};

export function useUploadCardFlow({
  isBusy,
  onMagicFrame,
  onAfterMagicFrame
}: UseUploadCardFlowOptions) {
  const previewUrlRef = useRef<string | null>(null);
  const previewGenerationRef = useRef(0);
  const lastMagicTemplateRef = useRef<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
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

  async function setPreviewFromFile(file: File) {
    const generation = ++previewGenerationRef.current;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(file);
    setPreviewUrl(null);
    setIsPreviewLoading(true);

    try {
      const nextUrl = await createMediaPreviewUrl(file);
      if (generation !== previewGenerationRef.current) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      previewUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);
    } catch {
      if (generation === previewGenerationRef.current) {
        setSelectedFile(null);
      }
    } finally {
      if (generation === previewGenerationRef.current) {
        setIsPreviewLoading(false);
      }
    }
  }

  function handleFileSelect(file?: File) {
    if (!file || !isUploadableMediaFile(file) || isBusy || ceremonyPhase !== "idle") {
      return;
    }

    void setPreviewFromFile(file);
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
    previewGenerationRef.current += 1;
    setSelectedFile(null);
    setIsPreviewLoading(false);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
    setIsDragOver(false);
  }

  async function handleMagicFrame() {
    if (!selectedFile || !previewUrl || isBusy || ceremonyPhase !== "idle" || isPreviewLoading) {
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
        setCeremonyLabel(step.labelKey);
        previousDelay = step.delay;
      }

      // 波点淡出后多停留一拍，再进入编辑器
      await wait(1050);
      const picked = randomizeTemplatePick(lastMagicTemplateRef.current);
      lastMagicTemplateRef.current = picked.templateId;
      await onMagicFrame(selectedFile, {
        templateId: picked.templateId,
        previewParams: picked.params
      });
    } finally {
      setCeremonyPhase("idle");
      setCeremonyLabel("");
      resetPreview();
      onAfterMagicFrame?.();
    }
  }

  return {
    previewUrl,
    isPreviewLoading,
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
