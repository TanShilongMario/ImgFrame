import type { TemplateParams } from "../types";
import {
  clampSwatchFrame,
  deriveSwatchColorsFromSource,
  getSwatchLayoutPx,
  hexToRgb,
  pickContrastTextColor,
  resolveSwatchRatioNumber
} from "../templates/swatchFrame";
import { cssPx, createCanvas, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { resolveExportDimensions } from "./sizing";

export function renderSwatchFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const swatchFrame = params.swatchFrame ? clampSwatchFrame(params.swatchFrame) : undefined;
  if (!swatchFrame) {
    throw new Error("模板缺少 swatchFrame 配置。");
  }

  const ratioNumber = resolveSwatchRatioNumber(swatchFrame, media.width, media.height);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const layout = getSwatchLayoutPx(swatchFrame, width, height);
  const borderPx = cssPx(swatchFrame.borderWidth, width);
  const colors = deriveSwatchColorsFromSource(media.source, swatchFrame.segmentCount, swatchFrame.seed);
  const segmentWidth = width / swatchFrame.segmentCount;
  const colorHeight = height - layout.labelBandHeight;
  const labelFontSize = Math.max(10, Math.round(11 * (width / 720)));

  context.clearRect(0, 0, width, height);

  for (let index = 0; index < swatchFrame.segmentCount; index += 1) {
    const x = index * segmentWidth;
    const hex = colors[index] ?? "#B4B0A8";
    const rgb = hexToRgb(hex);

    context.fillStyle = hex;
    context.fillRect(x, 0, segmentWidth, colorHeight);

    context.fillStyle = hex;
    context.fillRect(x, colorHeight, segmentWidth, layout.labelBandHeight);

    context.fillStyle = pickContrastTextColor(rgb);
    context.font = `600 ${labelFontSize}px "SF Mono", "Menlo", "Consolas", monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(hex, x + segmentWidth / 2, colorHeight + layout.labelBandHeight / 2);
  }

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
