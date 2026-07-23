import type { TemplateParams } from "../types";
import {
  clampPrintFrame,
  drawRoughPaperFill,
  getPrintHalftoneLayer,
  getPrintLayoutPx,
  resolvePrintPaperHex,
  resolvePrintRatioNumber
} from "../templates/printFrame";
import { cssPx, createCanvas, type LoadedMedia } from "./canvasUtils";
import { resolveExportDimensions } from "./sizing";

export type RenderPrintFrameOptions = {
  /** 预览传入 mediaUrl，用于复用网点位图；导出可省略 */
  cacheKey?: string;
};

export function renderPrintFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number,
  options?: RenderPrintFrameOptions
): HTMLCanvasElement {
  const printFrame = params.printFrame ? clampPrintFrame(params.printFrame) : undefined;
  if (!printFrame) {
    throw new Error("模板缺少 printFrame 配置。");
  }

  const ratioNumber = resolvePrintRatioNumber(printFrame, media.width, media.height);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const layout = getPrintLayoutPx(printFrame, width, height);
  const borderPx = cssPx(printFrame.borderWidth, width);
  const paperHex = resolvePrintPaperHex(printFrame.backingColor);

  // 网点只跟 seed + 画布比例 + 原图绑定；边距变化只改贴图位置
  const windowAspect = layout.innerW / Math.max(layout.innerH, 1);
  const halftone = getPrintHalftoneLayer(
    media.source,
    printFrame.seed,
    windowAspect,
    options?.cacheKey
  );

  context.clearRect(0, 0, width, height);
  drawRoughPaperFill(context, 0, 0, width, height, paperHex, printFrame.seed);

  context.save();
  context.beginPath();
  context.roundRect(layout.innerX, layout.innerY, layout.innerW, layout.innerH, layout.innerRadius);
  context.clip();
  context.drawImage(halftone, layout.innerX, layout.innerY, layout.innerW, layout.innerH);
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
