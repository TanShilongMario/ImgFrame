import { getTemplateById } from "../templates/registry";
import type { MediaAsset, Project } from "../types";
import { canvasToBlob, loadMediaSource } from "./canvasUtils";
import { renderRefinedBlurFrame } from "./renderRefinedBlurFrame";
import { renderStandardFrame } from "./renderStandardFrame";

export type ExportImageOptions = {
  format?: "png" | "jpeg";
  scale?: number;
  quality?: number;
};

export async function exportProjectImage(
  project: Project,
  mediaAsset: MediaAsset,
  mediaUrl: string,
  options: ExportImageOptions = {}
): Promise<Blob> {
  const { format = "png", scale = 1, quality = 0.92 } = options;
  const template = getTemplateById(project.templateId);
  const media = await loadMediaSource(mediaAsset, mediaUrl);

  const canvas =
    template.family === "refined-blur-frame"
      ? renderRefinedBlurFrame(project.templateParams, media, scale)
      : renderStandardFrame(project.templateParams, media, scale);

  return canvasToBlob(canvas, format, quality);
}
