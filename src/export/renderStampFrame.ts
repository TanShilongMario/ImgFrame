import type { TemplateParams } from "../types";
import { getFontStack } from "../templates/fonts";
import {
  clampStampFrame,
  getStampRotation,
  resolveStampRatioNumber
} from "../templates/stampFrame";
import { drawRoughPaperFill } from "../templates/printFrame";
import { createCanvas, cssPx, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { resolveExportDimensions } from "./sizing";

function seededRandom(seed: number): () => number {
  let state = Math.max(1, seed % 2147483647);
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

type Rgb = { r: number; g: number; b: number };
const meshColorCache = new WeakMap<object, Map<number, Rgb[]>>();
const meshColorKeyCache = new Map<string, Rgb[]>();

function rgbCss(color: Rgb, strength: number, alpha = 1): string {
  const channel = (value: number) => Math.max(0, Math.min(255, Math.round(value * strength)));
  return `rgba(${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}, ${alpha})`;
}

function rgbHex(color: Rgb, strength: number): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value * strength))).toString(16).padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

function sampleMeshColors(source: CanvasImageSource, seed: number): Rgb[] {
  const sample = document.createElement("canvas");
  sample.width = 12;
  sample.height = 12;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [{ r: 30, g: 66, b: 69 }];
  }

  drawCoverImage(context, source, 0, 0, sample.width, sample.height, 0.42);
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  const rand = seededRandom(seed ^ 0x6d657368);
  const colors: Rgb[] = [];
  for (let index = 0; index < 6; index += 1) {
    const x = Math.floor(rand() * sample.width);
    const y = Math.floor(rand() * sample.height);
    const offset = (y * sample.width + x) * 4;
    colors.push({ r: pixels[offset], g: pixels[offset + 1], b: pixels[offset + 2] });
  }
  return colors;
}

function getMeshColors(source: CanvasImageSource, seed: number, cacheKey?: string): Rgb[] {
  if (cacheKey) {
    const keyed = `${cacheKey}|${seed}`;
    const cached = meshColorKeyCache.get(keyed);
    if (cached) return cached;
    const colors = sampleMeshColors(source, seed);
    meshColorKeyCache.set(keyed, colors);
    while (meshColorKeyCache.size > 12) {
      const oldest = meshColorKeyCache.keys().next().value;
      if (oldest === undefined) break;
      meshColorKeyCache.delete(oldest);
    }
    return colors;
  }

  if ((typeof source !== "object" && typeof source !== "function") || source === null) {
    return sampleMeshColors(source, seed);
  }

  const key = source as object;
  const cachedBySeed = meshColorCache.get(key);
  const cached = cachedBySeed?.get(seed);
  if (cached) {
    return cached;
  }

  const colors = sampleMeshColors(source, seed);
  const nextBySeed = cachedBySeed ?? new Map<number, Rgb[]>();
  nextBySeed.set(seed, colors);
  meshColorCache.set(key, nextBySeed);
  return colors;
}

function punchPerforations(context: CanvasRenderingContext2D, size: number, radius: number) {
  const spacing = radius * 2.55;
  const count = Math.max(8, Math.floor(size / spacing));
  const step = size / count;

  context.save();
  context.globalCompositeOperation = "destination-out";
  for (let index = 0; index <= count; index += 1) {
    const offset = Math.min(size, index * step);
    for (const [x, y] of [
      [offset, 0],
      [offset, size],
      [0, offset],
      [size, offset]
    ]) {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawPostmark(
  context: CanvasRenderingContext2D,
  size: number,
  text: string,
  date: string,
  fontFamily: string,
  seed: number
) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
  const dateLine = date.trim();
  if (lines.length === 0 && !dateLine) {
    return;
  }

  const mark = document.createElement("canvas");
  const padding = size * 0.4;
  mark.width = Math.ceil(size * 2.2);
  mark.height = Math.ceil(size * 1.8);
  const markContext = mark.getContext("2d");
  if (!markContext) return;

  const cx = padding + size * 0.98;
  const cy = padding + size * 0.18;
  const textSize = Math.max(8, size * 0.045);
  const dateSize = Math.max(7, size * 0.032);
  markContext.font = `700 ${textSize}px ${fontFamily}`;
  const textWidth = lines.reduce((max, line) => Math.max(max, markContext.measureText(line.toUpperCase()).width), 0);
  markContext.font = `600 ${dateSize}px ${fontFamily}`;
  const dateWidth = dateLine ? markContext.measureText(dateLine.toUpperCase()).width : 0;
  const totalLines = lines.length + (dateLine ? 1 : 0);
  const contentHeight = lines.length * textSize * 1.08 + (dateLine ? dateSize * 1.4 : 0);
  const radius = Math.min(
    size * 0.34,
    Math.max(size * 0.19, Math.max(textWidth, dateWidth) * 0.62, contentHeight * 0.64)
  );
  const rand = seededRandom(seed ^ 0x706f7374);

  markContext.save();
  markContext.globalAlpha = 0.72;
  markContext.strokeStyle = "#7d302c";
  markContext.fillStyle = "#7d302c";
  markContext.lineWidth = Math.max(1, size * 0.008);
  markContext.lineCap = "round";

  // 先盖出完整但浓淡不均的圆环，再统一用颗粒遮罩制造自然缺墨。
  for (const ringScale of [1, 0.82]) {
    const ringRadius = radius * ringScale;
    markContext.globalAlpha = 0.48 + rand() * 0.2;
    markContext.beginPath();
    markContext.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    markContext.stroke();

    markContext.globalAlpha = 0.12 + rand() * 0.12;
    markContext.beginPath();
    markContext.arc(
      cx + (rand() - 0.5) * size * 0.004,
      cy + (rand() - 0.5) * size * 0.004,
      ringRadius,
      0,
      Math.PI * 2
    );
    markContext.stroke();
  }

  const lineHeight = textSize * 1.08;
  let textY = cy - contentHeight / 2 + lineHeight / 2;
  markContext.globalAlpha = 0.72;
  markContext.textAlign = "center";
  markContext.textBaseline = "middle";
  markContext.font = `700 ${textSize}px ${fontFamily}`;
  for (const line of lines) {
    markContext.fillText(line.toUpperCase(), cx, textY, radius * 1.55);
    textY += lineHeight;
  }
  if (dateLine) {
    markContext.font = `600 ${dateSize}px ${fontFamily}`;
    markContext.fillText(dateLine.toUpperCase(), cx, textY + dateSize * 0.18, radius * 1.55);
  }

  for (let index = -1; index <= 1; index += 1) {
    const y = cy + radius * (0.48 + index * 0.2);
    markContext.globalAlpha = 0.4 + rand() * 0.32;
    markContext.beginPath();
    markContext.moveTo(cx + radius * 0.72, y);
    markContext.bezierCurveTo(
      cx + radius,
      y - radius * 0.12,
      cx + radius * 1.22,
      y + radius * 0.12,
      cx + radius * 1.72,
      y
    );
    markContext.stroke();
  }
  markContext.restore();

  // 从整枚邮戳中随机抠掉细碎油墨，文字和圆环都会产生自然缺印。
  markContext.save();
  markContext.globalCompositeOperation = "destination-out";
  for (let index = 0; index < 150 + totalLines * 24; index += 1) {
    const angle = rand() * Math.PI * 2;
    const distance = Math.sqrt(rand()) * radius * 1.85;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    const width = size * (0.003 + rand() * 0.018);
    const height = size * (0.002 + rand() * 0.009);
    markContext.globalAlpha = 0.45 + rand() * 0.55;
    markContext.fillRect(x, y, width, height);
  }
  markContext.restore();

  context.drawImage(mark, -padding, -padding);
}

function drawDottedPaper(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  source: CanvasImageSource,
  seed: number,
  cacheKey?: string
) {
  // 视频只在首次渲染时取色；后续帧复用同一组 Mesh Gradient 配色。
  const colors = getMeshColors(source, seed, cacheKey);
  drawRoughPaperFill(context, 0, 0, width, height, rgbHex(colors[0], 0.3), seed);
  const rand = seededRandom(seed ^ 0x314159);
  context.save();
  context.globalCompositeOperation = "screen";
  colors.slice(1).forEach((color, index) => {
    const cx = width * (0.08 + rand() * 0.84);
    const cy = height * (0.08 + rand() * 0.84);
    const radius = Math.max(width, height) * (0.34 + rand() * 0.3);
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, rgbCss(color, 0.72, index % 2 === 0 ? 0.82 : 0.65));
    gradient.addColorStop(0.48, rgbCss(color, 0.48, 0.42));
    gradient.addColorStop(1, rgbCss(color, 0.2, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
  context.restore();

  const gap = Math.max(5, cssPx(11, width));
  const radius = Math.max(0.6, gap * 0.08);
  context.save();
  context.globalAlpha = 0.18;
  context.fillStyle = "#020b0d";
  for (let y = gap * 0.5; y < height; y += gap) {
    for (let x = gap * 0.5; x < width; x += gap) {
      context.beginPath();
      context.arc(x + (rand() - 0.5) * gap * 0.18, y + (rand() - 0.5) * gap * 0.18, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

export function renderStampFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number,
  options?: { paletteCacheKey?: string }
): HTMLCanvasElement {
  const stampFrame = params.stampFrame ? clampStampFrame(params.stampFrame) : undefined;
  if (!stampFrame) {
    throw new Error("模板缺少 stampFrame 配置。");
  }

  const ratioNumber = resolveStampRatioNumber(stampFrame, media.width, media.height);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  drawDottedPaper(context, width, height, media.source, stampFrame.seed, options?.paletteCacheKey);

  const stampSize = Math.round((Math.min(width, height) * stampFrame.stampSize) / 100);
  const perforation = cssPx(stampFrame.perforationSize, width);
  const stamp = document.createElement("canvas");
  stamp.width = stampSize;
  stamp.height = stampSize;
  const stampContext = stamp.getContext("2d");
  if (!stampContext) {
    return canvas;
  }

  drawRoughPaperFill(stampContext, 0, 0, stampSize, stampSize, "#eee9de", stampFrame.seed + 17);
  punchPerforations(stampContext, stampSize, perforation);

  const imageInset = (stampSize * stampFrame.stampPadding) / 100;
  const imageSize = stampSize - imageInset * 2;
  stampContext.save();
  stampContext.beginPath();
  stampContext.rect(imageInset, imageInset, imageSize, imageSize);
  stampContext.clip();
  drawCoverImage(stampContext, media.source, imageInset, imageInset, imageSize, imageSize, 0.42);
  stampContext.restore();
  stampContext.strokeStyle = "rgba(68, 57, 45, 0.34)";
  stampContext.lineWidth = Math.max(1, stampSize * 0.008);
  stampContext.strokeRect(imageInset, imageInset, imageSize, imageSize);

  const fontFamily = getFontStack(params.text.fontFamily);
  const centerX = width * 0.5;
  const centerY = height * 0.44;
  const rotation = (getStampRotation(stampFrame.seed) * Math.PI) / 180;
  context.save();
  context.translate(centerX, centerY);
  context.rotate(rotation);
  context.shadowColor = "rgba(0, 0, 0, 0.3)";
  context.shadowBlur = stampSize * 0.08;
  context.shadowOffsetY = stampSize * 0.045;
  context.drawImage(stamp, -stampSize / 2, -stampSize / 2);
  context.restore();

  context.save();
  context.translate(centerX, centerY);
  context.rotate(rotation);
  context.translate(-stampSize / 2, -stampSize / 2);
  drawPostmark(context, stampSize, params.text.credit, params.text.subtitle, fontFamily, stampFrame.seed);
  context.restore();

  const caption = params.text.title.trim();
  if (caption) {
    const captionPx = cssPx(stampFrame.captionSize, width);
    context.save();
    context.fillStyle = "rgba(242, 238, 225, 0.88)";
    context.font = `600 ${captionPx}px ${fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.letterSpacing = `${captionPx * 0.08}px`;
    context.fillText(caption.toUpperCase(), centerX, height * 0.73, width * 0.78);
    context.restore();
  }

  return canvas;
}
