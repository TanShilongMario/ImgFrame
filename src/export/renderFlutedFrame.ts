import type { TemplateParams } from "../types";
import {
  clampFlutedFrame,
  getFlutedLayoutPx,
  getFlutedShaderUniforms,
  resolveFlutedRatioNumber
} from "../templates/flutedFrame";
import { cssPx, createCanvas, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { renderFlutedBackground } from "../webgl/renderFlutedBackground";
import { resolveExportDimensions } from "./sizing";

export function renderFlutedFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const flutedFrame = params.flutedFrame ? clampFlutedFrame(params.flutedFrame) : undefined;
  if (!flutedFrame) {
    throw new Error("模板缺少 flutedFrame 配置。");
  }

  const ratioNumber = resolveFlutedRatioNumber(flutedFrame, media.width, media.height);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const layout = getFlutedLayoutPx(flutedFrame, width, height);
  const borderPx = cssPx(flutedFrame.borderWidth, width);

  const flutedPlate = renderFlutedBackground(media, width, height, getFlutedShaderUniforms());

  context.clearRect(0, 0, width, height);
  context.drawImage(flutedPlate, 0, 0, width, height);

  context.save();
  context.beginPath();
  context.roundRect(layout.innerX, layout.innerY, layout.innerW, layout.innerH, layout.innerRadius);
  context.clip();
  drawCoverImage(
    context,
    media.source,
    layout.innerX,
    layout.innerY,
    layout.innerW,
    layout.innerH,
    0.42
  );
  context.restore();

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.92)";
  context.lineWidth = borderPx;
  context.beginPath();
  context.roundRect(
    layout.innerX + borderPx / 2,
    layout.innerY + borderPx / 2,
    layout.innerW - borderPx,
    layout.innerH - borderPx,
    Math.max(0, layout.innerRadius - borderPx / 2)
  );
  context.stroke();
  context.restore();

  return canvas;
}
