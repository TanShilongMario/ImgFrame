import type { CanvasRatio, GridFrameConfig, TemplateParams } from "../types";
import {
  getGridCellRects,
  getGridLineColor,
  getGridTitleColor,
  getCellOverlayRgba,
  GRID_LINE_WIDTH_PX
} from "../templates/gridFrame";
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

function resolveRatioNumber(gridFrame: GridFrameConfig, media: LoadedMedia): number {
  if (gridFrame.canvasRatio === "auto") {
    return media.width / media.height;
  }

  return ratioNumberMap[gridFrame.canvasRatio];
}

function drawCellEffect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  overlay: string,
  effect: "darken" | "lighten"
) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.globalCompositeOperation = effect === "darken" ? "multiply" : "screen";
  context.fillStyle = overlay;
  context.fillRect(x, y, width, height);
  context.restore();
}

export function renderGridFrame(
  params: TemplateParams,
  media: LoadedMedia,
  scale: number
): HTMLCanvasElement {
  const gridFrame = params.gridFrame;
  if (!gridFrame) {
    throw new Error("模板缺少 gridFrame 配置。");
  }

  const ratioNumber = resolveRatioNumber(gridFrame, media);
  const { width, height } = resolveExportDimensions(ratioNumber, media, scale);
  const { canvas, context } = createCanvas(width, height);
  const cells = getGridCellRects(gridFrame);

  context.fillStyle = params.canvas.background;
  context.fillRect(0, 0, width, height);
  drawCoverImage(context, media.source, 0, 0, width, height, 0.42);

  cells.forEach((cell) => {
    const entry = gridFrame.cellEffects[cell.index];
    const overlay = getCellOverlayRgba(entry);
    if (!overlay || (entry.effect !== "darken" && entry.effect !== "lighten")) {
      return;
    }

    drawCellEffect(
      context,
      (cell.left / 100) * width,
      (cell.top / 100) * height,
      (cell.width / 100) * width,
      (cell.height / 100) * height,
      overlay,
      entry.effect
    );
  });

  const lineColor = getGridLineColor(gridFrame.lineTone);
  const lineWidth = Math.max(1, cssPx(GRID_LINE_WIDTH_PX, width));
  const x1 = (gridFrame.lineX1 / 100) * width;
  const x2 = (gridFrame.lineX2 / 100) * width;
  const y1 = (gridFrame.lineY1 / 100) * height;
  const y2 = (gridFrame.lineY2 / 100) * height;
  const inset = lineWidth / 2;

  context.save();
  context.strokeStyle = lineColor;
  context.lineWidth = lineWidth;
  [x1, x2].forEach((x) => {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  });
  [y1, y2].forEach((y) => {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  });
  context.strokeRect(inset, inset, width - lineWidth, height - lineWidth);
  context.restore();

  const titleCell = cells[8];
  const title = params.text.title.slice(0, 10);
  const titleX = ((titleCell.left + titleCell.width / 2) / 100) * width;
  const titleY = ((titleCell.top + titleCell.height / 2) / 100) * height;
  const fontSize = Math.min(cssPx(28, width), Math.max(cssPx(14, width), width * 0.045));

  context.save();
  context.font = `800 ${fontSize}px ${getFontStack(params.text.fontFamily)}`;
  context.fillStyle = getGridTitleColor(gridFrame.lineTone);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(title, titleX, titleY);
  context.restore();

  return canvas;
}
