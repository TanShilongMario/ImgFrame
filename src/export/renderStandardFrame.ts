import type { CanvasRatio, TemplateParams } from "../types";
import { cssPx, createCanvas, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { resolveExportDimensions } from "./sizing";

const ratioNumberMap: Record<CanvasRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "16:9": 16 / 9
};

function resolveCanvasSize(ratio: CanvasRatio, media: LoadedMedia, padding: number, scale: number) {
  const ratioNumber = ratioNumberMap[ratio];
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);

  return {
    width,
    height,
    padding: Math.round(padding * (width / 720))
  };
}

function drawRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const clampedRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + clampedRadius, y);
  context.arcTo(x + width, y, x + width, y + height, clampedRadius);
  context.arcTo(x + width, y + height, x, y + height, clampedRadius);
  context.arcTo(x, y + height, x, y, clampedRadius);
  context.arcTo(x, y, x + width, y, clampedRadius);
  context.closePath();
}

export function renderStandardFrame(params: TemplateParams, media: LoadedMedia, scale: number): HTMLCanvasElement {
  const { width, height, padding } = resolveCanvasSize(params.canvas.ratio, media, params.canvas.padding, scale);
  const { canvas, context } = createCanvas(width, height);

  context.fillStyle = params.canvas.background;
  context.fillRect(0, 0, width, height);

  const subtitleSize = cssPx(11, width);
  context.font = `800 ${subtitleSize}px "Inter", "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
  context.fillStyle = "rgba(44, 44, 41, 0.54)";
  context.textAlign = "right";
  context.textBaseline = "top";
  context.fillText(params.text.subtitle, width - padding, padding * 0.55);

  const mediaWidth = width - padding * 2;
  const mediaHeight = Math.round(mediaWidth / ratioNumberMap[params.canvas.ratio]);
  const mediaX = padding;
  const mediaY = padding + subtitleSize * 1.8;
  const radius = cssPx(params.media.radius, width);
  const borderWidth = cssPx(params.media.borderWidth, width);

  context.save();
  context.shadowColor = `rgba(24, 24, 24, ${params.media.shadow.opacity})`;
  context.shadowBlur = cssPx(params.media.shadow.blur, width);
  context.shadowOffsetX = cssPx(params.media.shadow.offsetX, width);
  context.shadowOffsetY = cssPx(params.media.shadow.offsetY, width);
  drawRoundedRectPath(context, mediaX, mediaY, mediaWidth, mediaHeight, radius);
  context.fillStyle = "rgba(255, 255, 255, 0.38)";
  context.fill();
  context.restore();

  context.save();
  drawRoundedRectPath(context, mediaX, mediaY, mediaWidth, mediaHeight, radius);
  context.clip();
  drawCoverImage(context, media.source, mediaX, mediaY, mediaWidth, mediaHeight);
  context.restore();

  if (borderWidth > 0) {
    context.save();
    drawRoundedRectPath(context, mediaX, mediaY, mediaWidth, mediaHeight, radius);
    context.strokeStyle = params.media.borderColor;
    context.lineWidth = borderWidth;
    context.stroke();
    context.restore();
  }

  const titleSize = cssPx(28, width);
  context.font = `900 ${titleSize}px "Inter", "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
  context.fillStyle = params.text.titleColor;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(params.text.title, width / 2, mediaY + mediaHeight + cssPx(18, width));

  const creditSize = cssPx(10, width);
  context.font = `800 ${creditSize}px "Inter", "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
  context.fillStyle = "rgba(44, 44, 41, 0.54)";
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.fillText(params.text.credit, width - padding, height - cssPx(12, width));

  return canvas;
}
