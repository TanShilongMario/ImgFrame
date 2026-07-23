import type { TemplateParams } from "../types";
import {
  clampCornerFrame,
  CORNER_IMAGE_SHADOW,
  getCornerLayoutPx,
  getCornerTextColors,
  resolveCornerRatioNumber
} from "../templates/cornerFrame";
import {
  fallbackSystemColor,
  resolveBandColor,
  sampleAverageColorFromSource
} from "../templates/bandFrame";
import { getFontStack } from "../templates/fonts";
import { cssPx, createCanvas, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { resolveExportDimensions } from "./sizing";

const TITLE_MAX = 64;
const SUBTITLE_MAX = 40;

export function renderCornerFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const cornerFrame = params.cornerFrame ? clampCornerFrame(params.cornerFrame) : undefined;
  if (!cornerFrame) {
    throw new Error("模板缺少 cornerFrame 配置。");
  }

  const ratioNumber = resolveCornerRatioNumber(cornerFrame, media.width, media.height);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const layout = getCornerLayoutPx(cornerFrame, width, height);

  const needsSystem = cornerFrame.backingColor === "system" && !cornerFrame.systemBackingHex;
  const average = needsSystem ? sampleAverageColorFromSource(media.source) : null;
  const backingHex = resolveBandColor(
    cornerFrame.backingColor,
    cornerFrame.systemBackingHex ?? (average ? fallbackSystemColor(average, "backing") : undefined)
  );

  context.fillStyle = backingHex;
  context.fillRect(0, 0, width, height);

  // 图片卡片 + 轻微外阴影 + 描边（先画图片，文字叠在上层，与预览一致）
  context.save();
  context.shadowColor = `rgba(24, 24, 24, ${CORNER_IMAGE_SHADOW.opacity})`;
  context.shadowBlur = cssPx(CORNER_IMAGE_SHADOW.blur, width);
  context.shadowOffsetX = 0;
  context.shadowOffsetY = cssPx(CORNER_IMAGE_SHADOW.offsetY, width);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(layout.cardX, layout.cardY, layout.cardW, layout.cardH, layout.mediaRadius);
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.roundRect(layout.cardX, layout.cardY, layout.cardW, layout.cardH, layout.mediaRadius);
  context.clip();
  drawCoverImage(context, media.source, layout.cardX, layout.cardY, layout.cardW, layout.cardH, 0.42);
  context.restore();

  if (layout.borderPx > 0) {
    context.save();
    context.strokeStyle = "rgba(255, 255, 255, 0.96)";
    context.lineWidth = layout.borderPx;
    context.beginPath();
    context.roundRect(
      layout.cardX + layout.borderPx / 2,
      layout.cardY + layout.borderPx / 2,
      layout.cardW - layout.borderPx,
      layout.cardH - layout.borderPx,
      Math.max(0, layout.mediaRadius - layout.borderPx / 2)
    );
    context.stroke();
    context.restore();
  }

  const textColors = getCornerTextColors(cornerFrame.textTone);
  const fontStack = getFontStack(params.text.fontFamily);
  const subtitlePx = cssPx(cornerFrame.subtitleSize, width);
  const titlePx = cssPx(cornerFrame.titleSize, width);
  const gap = subtitlePx * 0.55;
  const subtitle = params.text.subtitle.slice(0, SUBTITLE_MAX);
  const title = params.text.title.slice(0, TITLE_MAX);
  const isRight = cornerFrame.textCorner.endsWith("right");
  const isBottom = cornerFrame.textCorner.startsWith("bottom");

  context.save();
  context.textAlign = isRight ? "right" : "left";
  context.textBaseline = "top";
  const textX = isRight ? width - layout.textPadX : layout.textPadX;

  if (isBottom) {
    const blockHeight = (subtitle ? subtitlePx + gap : 0) + titlePx;
    const blockTop = height - layout.textPadY - blockHeight;
    let cursorY = blockTop;
    if (subtitle) {
      context.font = `700 ${subtitlePx}px ${fontStack}`;
      context.fillStyle = textColors.subtitle;
      context.fillText(subtitle, textX, cursorY);
      cursorY += subtitlePx + gap;
    }
    context.font = `800 ${titlePx}px ${fontStack}`;
    context.fillStyle = textColors.title;
    context.fillText(title, textX, cursorY);
  } else {
    let cursorY = layout.textPadY;
    if (subtitle) {
      context.font = `700 ${subtitlePx}px ${fontStack}`;
      context.fillStyle = textColors.subtitle;
      context.fillText(subtitle, textX, cursorY);
      cursorY += subtitlePx + gap;
    }
    context.font = `800 ${titlePx}px ${fontStack}`;
    context.fillStyle = textColors.title;
    context.fillText(title, textX, cursorY);
  }
  context.restore();

  return canvas;
}
