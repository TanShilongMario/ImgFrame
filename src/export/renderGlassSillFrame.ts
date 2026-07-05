import type { CanvasRatio, GlassSillFrameConfig, TemplateParams } from "../types";
import {
  clampGlassSillFrame,
  getGlassSillCaptionColor,
  getGlassSillInsetsPx,
  getGlassSillInnerRadiusPx,
  getGlassSillOuterRadiusPx,
  getGlassSillPlateInsetPx,
  getGlassSillPlateRadiusPx,
  GLASS_FROST_ALPHA,
  hexToRgba,
  resolveGlassSillBackingColor,
  resolveGlassSillCausticColor
} from "../templates/glassSillFrame";
import { sampleMaterialToneFromSource } from "../templates/bandFrame";
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

function resolveRatioNumber(frame: GlassSillFrameConfig, media: LoadedMedia): number {
  if (frame.canvasRatio === "auto") {
    return media.width / media.height;
  }

  return ratioNumberMap[frame.canvasRatio];
}

function getGlassPlateRect(width: number, height: number, plateInset: number, outerRadius: number) {
  const plateRadius = getGlassSillPlateRadiusPx(outerRadius, plateInset);

  return {
    x: plateInset,
    y: plateInset,
    w: width - plateInset * 2,
    h: height - plateInset * 2,
    radius: plateRadius
  };
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

  const sides: Array<[number, number, number, number]> = [
    [0, y, 0, y + height * edgeDepth],
    [0, y + height, 0, y + height * (1 - edgeDepth)],
    [x, 0, x + width * edgeDepth, 0],
    [x + width, 0, x + width * (1 - edgeDepth), 0]
  ];

  for (const [x0, y0, x1, y1] of sides) {
    const gradient = context.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${maxAlpha})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(x, y, width, height);
  }

  context.restore();
}

function drawGlassCausticLight(
  context: CanvasRenderingContext2D,
  plate: ReturnType<typeof getGlassPlateRect>,
  innerX: number,
  innerY: number,
  innerW: number,
  innerH: number,
  causticHex: string,
  referenceWidth: number
) {
  const windowBottom = innerY + innerH;
  const spots = [
    { cx: innerX + innerW * 0.22, cy: windowBottom + innerH * 0.02, rx: innerW * 0.16, ry: innerH * 0.09, alpha: 0.58 },
    { cx: innerX + innerW * 0.52, cy: windowBottom + innerH * 0.05, rx: innerW * 0.2, ry: innerH * 0.11, alpha: 0.68 },
    { cx: innerX + innerW * 0.78, cy: windowBottom + innerH * 0.015, rx: innerW * 0.13, ry: innerH * 0.08, alpha: 0.5 }
  ];

  context.save();
  context.beginPath();
  context.roundRect(plate.x, plate.y, plate.w, plate.h, plate.radius);
  context.clip();
  context.filter = `blur(${cssPx(10, referenceWidth)}px)`;

  for (const spot of spots) {
    const gradient = context.createRadialGradient(spot.cx, spot.cy, 0, spot.cx, spot.cy, Math.max(spot.rx, spot.ry));
    gradient.addColorStop(0, hexToRgba(causticHex, spot.alpha));
    gradient.addColorStop(0.55, hexToRgba(causticHex, spot.alpha * 0.35));
    gradient.addColorStop(1, hexToRgba(causticHex, 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(spot.cx, spot.cy, spot.rx, spot.ry, 0, 0, Math.PI * 2);
    context.fill();
  }

  const rimGradient = context.createLinearGradient(0, windowBottom - innerH * 0.04, 0, windowBottom + innerH * 0.12);
  rimGradient.addColorStop(0, hexToRgba(causticHex, 0));
  rimGradient.addColorStop(0.35, hexToRgba(causticHex, 0.3));
  rimGradient.addColorStop(1, hexToRgba(causticHex, 0));
  context.filter = "none";
  context.fillStyle = rimGradient;
  context.fillRect(innerX, windowBottom - innerH * 0.05, innerW, innerH * 0.18);

  context.restore();
}

function drawOuterGlassBorder(
  context: CanvasRenderingContext2D,
  plate: ReturnType<typeof getGlassPlateRect>,
  lineWidth: number
) {
  const { x, y, w, h, radius } = plate;

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.72)";
  context.lineWidth = lineWidth;
  context.beginPath();
  context.roundRect(x + lineWidth / 2, y + lineWidth / 2, w - lineWidth, h - lineWidth, radius);
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.2)";
  context.lineWidth = Math.max(1, lineWidth * 0.6);
  context.beginPath();
  context.roundRect(x + lineWidth * 1.2, y + lineWidth * 1.2, w - lineWidth * 2.4, h - lineWidth * 2.4, radius * 0.92);
  context.stroke();
  context.restore();
}

export function renderGlassSillFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const glassSillFrame = params.glassSillFrame ? clampGlassSillFrame(params.glassSillFrame) : undefined;
  if (!glassSillFrame) {
    throw new Error("模板缺少 glassSillFrame 配置。");
  }

  const ratioNumber = resolveRatioNumber(glassSillFrame, media);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const insetsPx = getGlassSillInsetsPx(glassSillFrame, width);
  const outerRadius = getGlassSillOuterRadiusPx(glassSillFrame.outerRadius, width);
  const innerRadius = getGlassSillInnerRadiusPx(glassSillFrame.edgeWidth, width, glassSillFrame.outerRadius);
  const blurPx = cssPx(glassSillFrame.blur, width);
  const plateInset = getGlassSillPlateInsetPx(width);
  const plate = getGlassPlateRect(width, height, plateInset, outerRadius);
  const needsSystemBacking = glassSillFrame.backingColor === "system" && !glassSillFrame.systemBackingHex;
  const needsCaustic = !glassSillFrame.causticHex;
  const average =
    needsSystemBacking || needsCaustic ? sampleMaterialToneFromSource(media.source) : null;
  const backingColor = resolveGlassSillBackingColor(glassSillFrame, average);
  const causticColor = resolveGlassSillCausticColor(glassSillFrame.causticHex, average);

  const innerX = insetsPx.left;
  const innerY = insetsPx.top;
  const innerW = width - insetsPx.left - insetsPx.right;
  const innerH = height - insetsPx.top - insetsPx.bottom;

  context.clearRect(0, 0, width, height);
  context.fillStyle = backingColor;
  context.fillRect(0, 0, width, height);

  context.save();
  context.beginPath();
  context.roundRect(plate.x, plate.y, plate.w, plate.h, plate.radius);
  context.clip();
  context.filter = `blur(${blurPx}px) saturate(1.04)`;
  drawCoverImage(context, media.source, 0, 0, width, height, 0.42);
  context.filter = "none";
  context.fillStyle = `rgba(255, 255, 255, ${GLASS_FROST_ALPHA})`;
  context.fillRect(plate.x, plate.y, plate.w, plate.h);
  context.restore();

  drawGlassCausticLight(context, plate, innerX, innerY, innerW, innerH, causticColor, width);
  drawOuterGlassBorder(context, plate, Math.max(1, cssPx(2, width)));

  context.save();
  context.beginPath();
  context.roundRect(innerX, innerY, innerW, innerH, innerRadius);
  context.clip();
  drawCoverImage(context, media.source, 0, 0, width, height, 0.42);
  context.restore();

  drawInsetShadow(context, innerX, innerY, innerW, innerH, innerRadius);

  const caption = params.text.title.slice(0, 40);
  const fontStack = getFontStack(params.text.fontFamily);
  const captionSize = Math.min(cssPx(18, width), Math.max(cssPx(12, width), width * 0.028));
  const bandTop = height - insetsPx.bottom;
  const bandBottom = height - plateInset;
  const captionY = bandTop + (bandBottom - bandTop) / 2;
  const captionColor = getGlassSillCaptionColor(glassSillFrame.textTone);

  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${captionSize}px ${fontStack}`;
  context.fillStyle = captionColor;
  if (glassSillFrame.textTone === "white" || glassSillFrame.textTone === "gray") {
    context.shadowColor = "rgba(0, 0, 0, 0.32)";
    context.shadowBlur = cssPx(6, width);
  }
  context.fillText(caption, width / 2, captionY);
  context.restore();

  return canvas;
}
