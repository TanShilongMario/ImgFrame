import { useState, type DragEvent, type MouseEvent } from "react";
import { pickHeroImage } from "../media/heroImages";
import { randomizeTemplatePick, randomizeWithinTemplate } from "../templates/randomize";
import type { HeroUploadOptions } from "../ui/HeroPage";
import { useUploadCardFlow } from "./useUploadCardFlow";

type UseHeroUploadFlowOptions = {
  isBusy: boolean;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
};

export function useHeroUploadFlow({ isBusy, onMagicFrame }: UseHeroUploadFlowOptions) {
  const [rawImageSrc, setRawImageSrc] = useState(() => pickHeroImage());
  const [heroPreview, setHeroPreview] = useState(() => randomizeTemplatePick());
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);

  const cardFlow = useUploadCardFlow({
    isBusy,
    onMagicFrame,
    onAfterMagicFrame: () => setUploadPanelOpen(false)
  });

  function handleSwapRawImage() {
    setRawImageSrc((current) => pickHeroImage(current));
    setHeroPreview((current) => randomizeTemplatePick(current.templateId));
  }

  function handleRandomizeTemplate() {
    setHeroPreview((current) => ({
      templateId: current.templateId,
      params: randomizeWithinTemplate(current.templateId)
    }));
  }

  function handleRawEnter(event: MouseEvent<HTMLElement>) {
    const rotation = (Math.random() * 4 - 2).toFixed(2);
    event.currentTarget.style.setProperty("--hero-hover-rotate", `${rotation}deg`);
  }

  function handleRawLeave(event: MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--hero-hover-rotate", "0deg");
  }

  function openUploadPanel() {
    if (isBusy || cardFlow.ceremonyPhase !== "idle") {
      return;
    }

    setUploadPanelOpen(true);
  }

  function closeUploadPanel() {
    if (cardFlow.ceremonyPhase !== "idle") {
      return;
    }

    setUploadPanelOpen(false);
    cardFlow.resetPreview();
  }

  function handleFileSelect(file?: File) {
    if (!file || isBusy || cardFlow.ceremonyPhase !== "idle") {
      return;
    }

    setUploadPanelOpen(true);
    cardFlow.handleFileSelect(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (isBusy || cardFlow.ceremonyPhase !== "idle") {
      return;
    }

    cardFlow.handlePanelDragEnter();
    setUploadPanelOpen(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      cardFlow.handlePanelDragLeave();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    cardFlow.handlePanelDragLeave();

    if (isBusy || cardFlow.ceremonyPhase !== "idle") {
      return;
    }

    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  }

  async function handleMagicFrame() {
    await cardFlow.handleMagicFrame();
  }

  return {
    rawImageSrc,
    heroPreview,
    uploadPanelOpen,
    previewUrl: cardFlow.previewUrl,
    isPreviewLoading: cardFlow.isPreviewLoading,
    isDragOver: cardFlow.isDragOver,
    ceremonyPhase: cardFlow.ceremonyPhase,
    ceremonyLabel: cardFlow.ceremonyLabel,
    openUploadPanel,
    closeUploadPanel,
    handleSwapRawImage,
    handleRandomizeTemplate,
    handleRawEnter,
    handleRawLeave,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handlePanelDragEnter: cardFlow.handlePanelDragEnter,
    handlePanelDragLeave: cardFlow.handlePanelDragLeave,
    handleDrop,
    handleMagicFrame
  };
}
