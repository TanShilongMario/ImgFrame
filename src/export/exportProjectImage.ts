import { getTemplateById } from "../templates/registry";
import type { MediaAsset, Project } from "../types";
import { canvasToBlob, loadMediaSource } from "./canvasUtils";
import { renderBandFrame } from "./renderBandFrame";
import { renderGlassFrame } from "./renderGlassFrame";
import { renderGridFrame } from "./renderGridFrame";
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

  let canvas: HTMLCanvasElement;

  if (template.family === "refined-blur-frame") {
    canvas = renderRefinedBlurFrame(project.templateParams, media, scale);
  } else if (template.family === "grid-frame") {
    canvas = renderGridFrame(project.templateParams, media, scale);
  } else if (template.family === "glass-frame") {
    canvas = renderGlassFrame(project.templateParams, media, scale, format);
  } else if (template.family === "band-frame") {
    canvas = renderBandFrame(project.templateParams, media, scale);
  } else {
    canvas = renderStandardFrame(project.templateParams, media, scale);
  }

  return canvasToBlob(canvas, format, quality);
}
