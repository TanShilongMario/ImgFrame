import type { CanvasRatio, GlassFrameConfig, TemplateParams } from "../types";
import {
  clampGlassFrame,
  getGlassInnerRadiusPx,
  getGlassInsets,
  getGlassOuterRadiusPx,
  getGlassTextColors,
  GLASS_FROST_ALPHA
} from "../templates/glassFrame";
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

function drawFullFrostPlate(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  outerRadius: number,
  blurPx: number,
  frostAlpha: number
) {
  context.save();
  context.beginPath();
  context.roundRect(0, 0, width, height, outerRadius);
  context.clip();
  context.filter = `blur(${blurPx}px) saturate(1.04)`;
  drawCoverImage(context, source, 0, 0, width, height, 0.42);
  context.filter = "none";
  context.fillStyle = `rgba(255, 255, 255, ${frostAlpha})`;
  context.fillRect(0, 0, width, height);
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
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();

  const topGradient = context.createLinearGradient(0, y, 0, y + height * 0.35);
  topGradient.addColorStop(0, "rgba(0, 0, 0, 0.34)");
  topGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = topGradient;
  context.fillRect(x, y, width, height);

  const leftGradient = context.createLinearGradient(x, 0, x + width * 0.22, 0);
  leftGradient.addColorStop(0, "rgba(0, 0, 0, 0.18)");
  leftGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = leftGradient;
  context.fillRect(x, y, width, height);

  context.restore();
}

function drawOuterGlassBorder(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  lineWidth: number
) {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = lineWidth;
  context.beginPath();
  context.roundRect(lineWidth / 2, lineWidth / 2, width - lineWidth, height - lineWidth, radius);
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.22)";
  context.lineWidth = Math.max(1, lineWidth * 0.6);
  context.beginPath();
  context.roundRect(lineWidth * 1.2, lineWidth * 1.2, width - lineWidth * 2.4, height - lineWidth * 2.4, radius * 0.92);
  context.stroke();
  context.restore();
}

export function renderGlassFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number,
  format: "png" | "jpeg" = "png"
): HTMLCanvasElement {
  const glassFrame = params.glassFrame ? clampGlassFrame(params.glassFrame) : undefined;
  if (!glassFrame) {
    throw new Error("模板缺少 glassFrame 配置。");
  }

  const ratioNumber = resolveRatioNumber(glassFrame, media);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const insets = getGlassInsets(glassFrame);
  const outerRadius = getGlassOuterRadiusPx(width);
  const innerRadius = getGlassInnerRadiusPx(glassFrame.edgeWidth, width);
  const blurPx = cssPx(glassFrame.blur, width);

  const top = (insets.top / 100) * height;
  const right = (insets.right / 100) * width;
  const bottom = (insets.bottom / 100) * height;
  const left = (insets.left / 100) * width;
  const innerX = left;
  const innerY = top;
  const innerW = width - left - right;
  const innerH = height - top - bottom;

  context.clearRect(0, 0, width, height);

  if (format === "jpeg") {
    // JPEG 无 alpha，整图铺底色，圆角外为底色（无法透明）。
    context.fillStyle = params.canvas.background;
    context.fillRect(0, 0, width, height);
  } else {
    // PNG：从最外层就把整个画布裁成圆角，圆角外永不被任何绘制触碰，保证透明。
    context.beginPath();
    context.roundRect(0, 0, width, height, outerRadius);
    context.clip();
  }

  drawFullFrostPlate(context, media.source, width, height, outerRadius, blurPx, GLASS_FROST_ALPHA);
  drawOuterGlassBorder(context, width, height, outerRadius, Math.max(1, cssPx(2, width)));

  context.save();
  context.beginPath();
  context.roundRect(innerX, innerY, innerW, innerH, innerRadius);
  context.clip();
  drawCoverImage(context, media.source, 0, 0, width, height, 0.42);
  context.restore();

  drawInsetShadow(context, innerX, innerY, innerW, innerH, innerRadius);

  const textColors = getGlassTextColors(glassFrame.textTone);
  const fontStack = getFontStack(params.text.fontFamily);
  const title = params.text.title.slice(0, 24);
  const subtitle = params.text.subtitle.slice(0, 48);
  const titleSize = Math.min(cssPx(28, width), Math.max(cssPx(16, width), width * 0.042));
  const subtitleSize = Math.min(cssPx(14, width), Math.max(cssPx(10, width), width * 0.018));
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
