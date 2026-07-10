import type { TemplateParams } from "../types";
import {
  buildDotField,
  clampDotFrame,
  drawDotField,
  getDotLayoutPx,
  DOT_PLATE_BACKING,
  resolveDotRatioNumber,
  type DotLayoutPx
} from "../templates/dotFrame";
import { cssPx, createCanvas, drawCoverImage, type LoadedMedia } from "./canvasUtils";
import { resolveExportDimensions } from "./sizing";

function clipInnerWindow(context: CanvasRenderingContext2D, layout: DotLayoutPx) {
  context.beginPath();
  context.roundRect(layout.innerX, layout.innerY, layout.innerW, layout.innerH, layout.innerRadius);
  context.clip();
}

/** 第 1 层（底）：整张画布铺满用户原图 */
function renderPhotoLayer(
  source: CanvasImageSource,
  width: number,
  height: number
): HTMLCanvasElement {
  const plate = document.createElement("canvas");
  plate.width = width;
  plate.height = height;
  const context = plate.getContext("2d");
  if (!context) {
    throw new Error("无法创建底图层。");
  }

  drawCoverImage(context, source, 0, 0, width, height, 0.42);

  return plate;
}

/** 第 2 层（顶）：中央窗内不透明底色 + 波点，完全压住底图 */
function renderDotLayer(
  field: ReturnType<typeof buildDotField>,
  layout: DotLayoutPx,
  width: number,
  height: number
): HTMLCanvasElement {
  const plate = document.createElement("canvas");
  plate.width = width;
  plate.height = height;
  const context = plate.getContext("2d");
  if (!context) {
    throw new Error("无法创建波点层。");
  }

  context.clearRect(0, 0, width, height);
  context.save();
  clipInnerWindow(context, layout);
  context.fillStyle = DOT_PLATE_BACKING;
  context.fillRect(layout.innerX, layout.innerY, layout.innerW, layout.innerH);
  drawDotField(context, field, layout.innerX, layout.innerY, layout.innerW, layout.innerH);
  context.restore();

  return plate;
}

export function renderDotFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const dotFrame = params.dotFrame ? clampDotFrame(params.dotFrame) : undefined;
  if (!dotFrame) {
    throw new Error("模板缺少 dotFrame 配置。");
  }

  const ratioNumber = resolveDotRatioNumber(dotFrame, media.width, media.height);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const layout = getDotLayoutPx(dotFrame, width, height);
  const borderPx = cssPx(dotFrame.borderWidth, width);
  const field = buildDotField(media.source, dotFrame.seed);

  const photoLayer = renderPhotoLayer(media.source, width, height);
  const dotLayer = renderDotLayer(field, layout, width, height);

  context.clearRect(0, 0, width, height);
  context.drawImage(photoLayer, 0, 0);
  context.drawImage(dotLayer, 0, 0);

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
