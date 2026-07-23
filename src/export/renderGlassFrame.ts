import type { CanvasRatio, GlassFrameConfig, TemplateParams } from "../types";
import {
  clampGlassFrame,
  getGlassInnerRadiusPx,
  getGlassInsetsPx,
  getGlassOuterRadiusPx,
  getGlassPlateInsetPx,
  getGlassPlateRadiusPx,
  getGlassTextColors,
  GLASS_FROST_ALPHA,
  resolveGlassBackingColor
} from "../templates/glassFrame";
import { fallbackSystemColor, sampleAverageColorFromSource } from "../templates/bandFrame";
import { cssPx, createCanvas, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { getFontStack } from "../templates/fonts";
import { resolveExportDimensions } from "./sizing";

const ratioNumberMap: Record<CanvasRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "16:9": 16 / 9
};

function resolveRatioNumber(glassFrame: GlassFrameConfig, media: LoadedMedia): number {
  if (glassFrame.canvasRatio === "auto") {
    return media.width / media.height;
  }

  return ratioNumberMap[glassFrame.canvasRatio];
}

function getGlassPlateRect(width: number, height: number, plateInset: number, outerRadius: number) {
  const plateRadius = getGlassPlateRadiusPx(outerRadius, plateInset);

  return {
    x: plateInset,
    y: plateInset,
    w: width - plateInset * 2,
    h: height - plateInset * 2,
    radius: plateRadius
  };
}

/** 底层：铺满画布的无圆角矩形（颜色随图像适配） */
function drawGlassBasePlate(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  backingColor: string
) {
  context.fillStyle = backingColor;
  context.fillRect(0, 0, width, height);
}

function drawGlassFrostPlate(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  plate: ReturnType<typeof getGlassPlateRect>,
  blurPx: number,
  frostAlpha: number
) {
  context.save();
  context.beginPath();
  context.roundRect(plate.x, plate.y, plate.w, plate.h, plate.radius);
  context.clip();
  context.filter = `blur(${blurPx}px) saturate(1.04)`;
  drawCoverImage(context, source, 0, 0, width, height, 0.42);
  context.filter = "none";
  context.fillStyle = `rgba(255, 255, 255, ${frostAlpha})`;
  context.fillRect(plate.x, plate.y, plate.w, plate.h);
  context.restore();
}

function drawInsetShadow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const edgeDepth = 0.22;
  const maxAlpha = 0.18;

  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();

  const topGradient = context.createLinearGradient(0, y, 0, y + height * edgeDepth);
  topGradient.addColorStop(0, `rgba(0, 0, 0, ${maxAlpha})`);
  topGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = topGradient;
  context.fillRect(x, y, width, height);

  const bottomGradient = context.createLinearGradient(0, y + height, 0, y + height * (1 - edgeDepth));
  bottomGradient.addColorStop(0, `rgba(0, 0, 0, ${maxAlpha})`);
  bottomGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = bottomGradient;
  context.fillRect(x, y, width, height);

  const leftGradient = context.createLinearGradient(x, 0, x + width * edgeDepth, 0);
  leftGradient.addColorStop(0, `rgba(0, 0, 0, ${maxAlpha})`);
  leftGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = leftGradient;
  context.fillRect(x, y, width, height);

  const rightGradient = context.createLinearGradient(x + width, 0, x + width * (1 - edgeDepth), 0);
  rightGradient.addColorStop(0, `rgba(0, 0, 0, ${maxAlpha})`);
  rightGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = rightGradient;
  context.fillRect(x, y, width, height);

  context.restore();
}

function drawOuterGlassBorder(
  context: CanvasRenderingContext2D,
  plate: ReturnType<typeof getGlassPlateRect>,
  lineWidth: number
) {
  const { x, y, w, h, radius } = plate;

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = lineWidth;
  context.beginPath();
  context.roundRect(x + lineWidth / 2, y + lineWidth / 2, w - lineWidth, h - lineWidth, radius);
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.22)";
  context.lineWidth = Math.max(1, lineWidth * 0.6);
  context.beginPath();
  context.roundRect(x + lineWidth * 1.2, y + lineWidth * 1.2, w - lineWidth * 2.4, h - lineWidth * 2.4, radius * 0.92);
  context.stroke();
  context.restore();
}

export function renderGlassFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number,
  _format: "png" | "jpeg" | "mp4" = "png"
): HTMLCanvasElement {
  const glassFrame = params.glassFrame ? clampGlassFrame(params.glassFrame) : undefined;
  if (!glassFrame) {
    throw new Error("模板缺少 glassFrame 配置。");
  }

  const ratioNumber = resolveRatioNumber(glassFrame, media);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const insetsPx = getGlassInsetsPx(glassFrame, width);
  const outerRadius = getGlassOuterRadiusPx(glassFrame.outerRadius, width);
  const innerRadius = getGlassInnerRadiusPx(glassFrame.edgeWidth, width, glassFrame.outerRadius);
  const blurPx = cssPx(glassFrame.blur, width);
  const plateInset = getGlassPlateInsetPx(width);
  const plate = getGlassPlateRect(width, height, plateInset, outerRadius);
  const average =
    (glassFrame.backingColor === "system" && !glassFrame.systemBackingHex)
      ? sampleAverageColorFromSource(media.source)
      : null;
  const backingColor = resolveGlassBackingColor(glassFrame, average);

  const innerX = insetsPx.left;
  const innerY = insetsPx.top;
  const innerW = width - insetsPx.left - insetsPx.right;
  const innerH = height - insetsPx.top - insetsPx.bottom;

  context.clearRect(0, 0, width, height);
  drawGlassBasePlate(context, width, height, backingColor);
  drawGlassFrostPlate(context, media.source, width, height, plate, blurPx, GLASS_FROST_ALPHA);
  drawOuterGlassBorder(context, plate, Math.max(1, cssPx(2, width)));

  context.save();
  context.beginPath();
  context.roundRect(innerX, innerY, innerW, innerH, innerRadius);
  context.clip();
  drawCoverImage(context, media.source, 0, 0, width, height, 0.42);
  context.restore();

  drawInsetShadow(context, innerX, innerY, innerW, innerH, innerRadius);

  const textColors = getGlassTextColors(glassFrame.textTone);
  const fontStack = getFontStack(params.text.fontFamily);
  const title = params.text.title.slice(0, 40);
  const subtitle = params.text.subtitle.slice(0, 72);
  const titleSize = cssPx(glassFrame.titleSize, width);
  const subtitleSize = cssPx(glassFrame.subtitleSize, width);
  const textX = innerX + cssPx(18, width);
  const textY = innerY + cssPx(22, width);

  context.save();
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = `800 ${titleSize}px ${fontStack}`;
  context.fillStyle = textColors.title;
  if (glassFrame.textTone === "white" || glassFrame.textTone === "gray") {
    context.shadowColor = "rgba(0, 0, 0, 0.28)";
    context.shadowBlur = cssPx(8, width);
  }
  context.fillText(title, textX, textY);
  context.shadowBlur = 0;
  context.font = `600 ${subtitleSize}px ${fontStack}`;
  context.fillStyle = textColors.subtitle;
  context.fillText(subtitle, textX, textY + titleSize * 1.18);
  context.restore();

  return canvas;
}
