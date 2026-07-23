import { getTemplateById } from "../templates/registry";
import type { Project } from "../types";
import type { LoadedMedia } from "./canvasUtils";
import { renderBandFrame } from "./renderBandFrame";
import { renderCornerFrame } from "./renderCornerFrame";
import { renderGlassFrame } from "./renderGlassFrame";
import { renderGridFrame } from "./renderGridFrame";
import { renderFlutedFrame } from "./renderFlutedFrame";
import { renderPrintFrame } from "./renderPrintFrame";
import { renderDotFrame } from "./renderDotFrame";
import { renderSwatchFrame } from "./renderSwatchFrame";
import { renderGlassSillFrame } from "./renderGlassSillFrame";
import { renderRefinedBlurFrame } from "./renderRefinedBlurFrame";
import { renderStandardFrame } from "./renderStandardFrame";
import { renderStampFrame } from "./renderStampFrame";

export type RenderFrameFormat = "png" | "jpeg" | "mp4";

export function renderProjectFrame(
  project: Project,
  media: LoadedMedia,
  scale: number,
  format: RenderFrameFormat = "png"
): HTMLCanvasElement {
  const template = getTemplateById(project.templateId);

  if (template.family === "refined-blur-frame") {
    return renderRefinedBlurFrame(project.templateParams, media, scale);
  }

  if (template.family === "grid-frame") {
    return renderGridFrame(project.templateParams, media, scale);
  }

  if (template.family === "glass-frame") {
    return renderGlassFrame(project.templateParams, media, scale, format);
  }

  if (template.family === "glass-sill-frame") {
    return renderGlassSillFrame(project.templateParams, media, scale);
  }

  if (template.family === "band-frame") {
    return renderBandFrame(project.templateParams, media, scale);
  }

  if (template.family === "corner-frame") {
    return renderCornerFrame(project.templateParams, media, scale);
  }

  if (template.family === "fluted-frame") {
    return renderFlutedFrame(project.templateParams, media, scale);
  }

  if (template.family === "swatch-frame") {
    return renderSwatchFrame(project.templateParams, media, scale);
  }

  if (template.family === "dot-frame") {
    return renderDotFrame(project.templateParams, media, scale);
  }

  if (template.family === "print-frame") {
    return renderPrintFrame(project.templateParams, media, scale);
  }

  if (template.family === "stamp-frame") {
    return renderStampFrame(project.templateParams, media, scale, {
      paletteCacheKey: `${project.id}|${project.mediaAssetId ?? project.templateId}`
    });
  }

  return renderStandardFrame(project.templateParams, media, scale);
}
