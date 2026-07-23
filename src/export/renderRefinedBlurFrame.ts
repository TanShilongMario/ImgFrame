import type { CanvasRatio, RefinedFrameConfig, TemplateParams } from "../types";
import type { TextFontId } from "../templates/fonts";
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

function resolveRatioNumber(refinedFrame: RefinedFrameConfig, media: LoadedMedia): number {
  if (refinedFrame.canvasRatio === "auto") {
    return media.width / media.height;
  }

  return ratioNumberMap[refinedFrame.canvasRatio];
}

function drawRefinedGradient(
  context: CanvasRenderingContext2D,
  frameX: number,
  frameY: number,
  frameWidth: number,
  frameHeight: number,
  tone: RefinedFrameConfig["gradientTone"]
) {
  const gradient = context.createLinearGradient(0, frameY + frameHeight, 0, frameY);

  if (tone === "white") {
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.03, "#fffffffd");
    gradient.addColorStop(0.41, "rgba(255, 255, 255, 0)");
  } else {
    gradient.addColorStop(0, "#111111");
    gradient.addColorStop(0.03, "rgba(17, 17, 17, 0.98)");
    gradient.addColorStop(0.41, "rgba(17, 17, 17, 0)");
  }

  context.save();
  context.fillStyle = gradient;
  context.fillRect(frameX, frameY, frameWidth, frameHeight);
  context.restore();
}

function drawRefinedCredit(
  context: CanvasRenderingContext2D,
  frameX: number,
  frameY: number,
  frameWidth: number,
  frameHeight: number,
  credit: string,
  tone: RefinedFrameConfig["gradientTone"],
  canvasWidth: number,
  canvasHeight: number,
  fontFamily: TextFontId,
  creditSize: number
) {
  const fontSize = cssPx(creditSize, canvasWidth);
  const bottomInset = Math.min(cssPx(28, canvasHeight, canvasHeight), Math.max(cssPx(14, canvasHeight, canvasHeight), frameHeight * 0.03));
  const maxTextWidth = Math.min(frameWidth * 0.72, cssPx(480, canvasWidth));

  context.save();
  context.font = `800 ${fontSize}px ${getFontStack(fontFamily)}`;
  context.fillStyle = tone === "white" ? "rgba(34, 34, 31, 0.62)" : "rgba(255, 255, 255, 0.78)";
  context.textAlign = "center";
  context.textBaseline = "bottom";

  let text = credit;
  while (text.length > 0 && context.measureText(text).width > maxTextWidth) {
    text = text.slice(0, -1);
  }

  context.fillText(text, frameX + frameWidth / 2, frameY + frameHeight - bottomInset);
  context.restore();
}

export function renderRefinedBlurFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const refinedFrame = params.refinedFrame;
  if (!refinedFrame) {
    throw new Error("模板缺少 refinedFrame 配置。");
  }

  const ratioNumber = resolveRatioNumber(refinedFrame, media);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);

  context.fillStyle = params.canvas.background;
  context.fillRect(0, 0, width, height);

  const blurPx = cssPx(refinedFrame.backgroundBlur, width);
  const bgExpand = cssPx(24, width);
  const bgWidth = width * 1.08;
  const bgHeight = height * 1.08;
  const bgX = (width - bgWidth) / 2;
  const bgY = (height - bgHeight) / 2;

  context.save();
  context.filter = `blur(${blurPx}px)`;
  drawCoverImage(context, media.source, bgX - bgExpand, bgY - bgExpand, bgWidth + bgExpand * 2, bgHeight + bgExpand * 2, 0.42);
  context.restore();

  const visibleWidth = ((100 - refinedFrame.cropWidth) / 100) * width;
  const verticalInset = (refinedFrame.cropHeight / 100) * height * 0.5;
  const frameWidth = visibleWidth;
  const frameHeight = height - verticalInset * 2;
  const frameX = (width - frameWidth) / 2;
  const frameY = verticalInset;

  context.save();
  context.shadowColor = "rgba(24, 24, 24, 0.12)";
  context.shadowBlur = cssPx(40, width);
  context.shadowOffsetX = 0;
  context.shadowOffsetY = cssPx(12, width);
  context.fillStyle = "#ffffff";
  context.fillRect(frameX, frameY, frameWidth, frameHeight);
  context.restore();

  context.save();
  context.beginPath();
  context.rect(frameX, frameY, frameWidth, frameHeight);
  context.clip();
  drawCoverImage(context, media.source, frameX, frameY, frameWidth, frameHeight, 0.42);
  context.restore();

  drawRefinedGradient(context, frameX, frameY, frameWidth, frameHeight, refinedFrame.gradientTone);

  const borderWidth = cssPx(5, width);
  context.save();
  context.strokeStyle = "#ffffff";
  context.lineWidth = borderWidth * 2;
  context.strokeRect(
    frameX + borderWidth,
    frameY + borderWidth,
    frameWidth - borderWidth * 2,
    frameHeight - borderWidth * 2
  );
  context.restore();

  drawRefinedCredit(
    context,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    params.text.credit,
    refinedFrame.gradientTone,
    width,
    height,
    params.text.fontFamily,
    refinedFrame.creditSize
  );

  return canvas;
}
