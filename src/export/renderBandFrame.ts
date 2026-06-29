import type { BandFrameConfig, CanvasRatio, TemplateParams } from "../types";
import {
  getBandCardRadiusPx,
  getBandTextColors,
  resolveBandColor,
  sampleAverageColorFromSource
} from "../templates/bandFrame";
import { getFontStack } from "../templates/fonts";
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

function resolveRatioNumber(bandFrame: BandFrameConfig, media: LoadedMedia): number {
  if (bandFrame.canvasRatio === "auto") {
    return media.width / media.height;
  }

  return ratioNumberMap[bandFrame.canvasRatio];
}

export function renderBandFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const bandFrame = params.bandFrame;
  if (!bandFrame) {
    throw new Error("模板缺少 bandFrame 配置。");
  }

  const ratioNumber = resolveRatioNumber(bandFrame, media);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);

  const needsSystem =
    (bandFrame.bandColor === "system" && !bandFrame.systemBandHex) ||
    (bandFrame.backingColor === "system" && !bandFrame.systemBackingHex);
  const average = needsSystem ? sampleAverageColorFromSource(media.source) : null;

  const backingHex = resolveBandColor(
    bandFrame.backingColor,
    bandFrame.systemBackingHex ?? (average ? fallbackSystem(average, "backing") : undefined)
  );
  const bandHex = resolveBandColor(
    bandFrame.bandColor,
    bandFrame.systemBandHex ?? (average ? fallbackSystem(average, "band") : undefined)
  );

  const marginPx = (bandFrame.outerMargin / 100) * width;
  const cardX = marginPx;
  const cardY = marginPx;
  const cardW = width - marginPx * 2;
  const cardH = height - marginPx * 2;
  const radius = getBandCardRadiusPx(width);

  context.fillStyle = backingHex;
  context.fillRect(0, 0, width, height);

  context.save();
  context.beginPath();
  context.roundRect(cardX, cardY, cardW, cardH, radius);
  context.clip();

  drawCoverImage(context, media.source, cardX, cardY, cardW, cardH, 0.42);

  const bandH = (bandFrame.bandHeight / 100) * cardH;
  const bandY = cardY + cardH - bandH;
  context.fillStyle = bandHex;
  context.fillRect(cardX, bandY, cardW, bandH);

  const textColors = getBandTextColors(bandHex);
  const fontStack = getFontStack(params.text.fontFamily);
  const padX = Math.max(cssPx(24, width), cardW * 0.055);
  const subtitlePx = cssPx(bandFrame.subtitleSize, width);
  const titlePx = cssPx(bandFrame.titleSize, width);
  const gap = subtitlePx * 0.7;
  const blockHeight = subtitlePx + gap + titlePx;
  const blockTop = bandY + (bandH - blockHeight) / 2;

  context.textAlign = "left";
  context.textBaseline = "top";

  context.font = `700 ${subtitlePx}px ${fontStack}`;
  context.fillStyle = textColors.subtitle;
  context.fillText(params.text.subtitle.slice(0, 24), cardX + padX, blockTop);

  context.font = `800 ${titlePx}px ${fontStack}`;
  context.fillStyle = textColors.title;
  context.fillText(params.text.title.slice(0, 40), cardX + padX, blockTop + subtitlePx + gap);

  context.restore();

  return canvas;
}

function fallbackSystem(average: { r: number; g: number; b: number }, target: "band" | "backing"): string {
  // 导出时若没有预存 system hex，用平均色派生一个稳定值（不加随机，保证可复现）。
  const { r, g, b } = average;
  const toHex = (value: number) => Math.min(255, Math.max(0, Math.round(value))).toString(16).padStart(2, "0");
  const mix = (channel: number, towards: number, ratio: number) => channel + (towards - channel) * ratio;
  const ratio = target === "band" ? 0.82 : 0.55;
  return `#${toHex(mix(r, 245, ratio))}${toHex(mix(g, 240, ratio))}${toHex(mix(b, 232, ratio))}`;
}
