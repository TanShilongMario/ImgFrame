import type { DotFrameConfig, RefinedCanvasRatio } from "../types";

export const DOT_PLATE_BACKING = "#2c2c2a";

export const DOT_FRAME_LIMITS = {
  windowMargin: { min: 10, max: 28 },
  innerRadius: { min: 0, max: 64 },
  borderWidth: { min: 2, max: 12 }
} as const;

export const DOT_DEFAULTS = {
  windowMargin: 16,
  innerRadius: 20,
  borderWidth: 4,
  seed: 42
};

export type DotLayoutPx = {
  innerX: number;
  innerY: number;
  innerW: number;
  innerH: number;
  innerRadius: number;
};

export type RenderDot = {
  x: number;
  y: number;
  color: string;
};

export type DotField = {
  dots: RenderDot[];
  columns: number;
  rows: number;
  studFill: number;
};

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function getSourceSize(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  if (source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }

  const bitmap = source as ImageBitmap;
  return { width: bitmap.width, height: bitmap.height };
}

/** 从原图采样颜色，生成规则波点场（顶层特效用） */
export function buildDotField(source: CanvasImageSource, seed: number): DotField {
  const rand = seededRandom(seed);
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);
  const sourceAspect = sourceWidth / Math.max(sourceHeight, 1);

  const columns = Math.round(14 + rand() * 8);
  const rows = Math.max(columns, Math.round(columns * sourceAspect));
  const studFill = 0.72 + rand() * 0.12;
  const jitterAmp = 0.01 + rand() * 0.02;

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = columns;
  sampleCanvas.height = rows;
  const sampleContext = sampleCanvas.getContext("2d");
  if (!sampleContext) {
    return { dots: [], columns, rows, studFill };
  }

  sampleContext.drawImage(source, 0, 0, columns, rows);
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  const dots: RenderDot[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = (row * columns + column) * 4;
      if (pixels[index + 3] < 32) {
        continue;
      }

      const jitterX = (rand() - 0.5) * jitterAmp;
      const jitterY = (rand() - 0.5) * jitterAmp;

      dots.push({
        x: (column + 0.5) / columns + jitterX / columns,
        y: (row + 0.5) / rows + jitterY / rows,
        color: `rgb(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]})`
      });
    }
  }

  return { dots, columns, rows, studFill };
}

/** 在中央窗内绘制不透明波点（顶层） */
export function drawDotField(
  context: CanvasRenderingContext2D,
  field: DotField,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const cell = Math.min(width / field.columns, height / field.rows);
  const radius = (cell * field.studFill) / 2;

  for (const dot of field.dots) {
    context.beginPath();
    context.fillStyle = dot.color;
    context.arc(x + dot.x * width, y + dot.y * height, radius, 0, Math.PI * 2);
    context.fill();
  }
}

export function clampDotFrame(frame: DotFrameConfig): DotFrameConfig {
  return {
    ...frame,
    canvasRatio: frame.canvasRatio ?? "auto",
    windowMargin: Math.min(
      Math.max(frame.windowMargin ?? DOT_DEFAULTS.windowMargin, DOT_FRAME_LIMITS.windowMargin.min),
      DOT_FRAME_LIMITS.windowMargin.max
    ),
    innerRadius: Math.min(
      Math.max(frame.innerRadius ?? DOT_DEFAULTS.innerRadius, DOT_FRAME_LIMITS.innerRadius.min),
      DOT_FRAME_LIMITS.innerRadius.max
    ),
    borderWidth: Math.min(
      Math.max(frame.borderWidth ?? DOT_DEFAULTS.borderWidth, DOT_FRAME_LIMITS.borderWidth.min),
      DOT_FRAME_LIMITS.borderWidth.max
    ),
    seed: Math.max(0, Math.round(frame.seed ?? DOT_DEFAULTS.seed))
  };
}

export function getDotLayoutPx(frame: DotFrameConfig, canvasWidth: number, canvasHeight: number): DotLayoutPx {
  const normalized = clampDotFrame(frame);
  const marginX = (canvasWidth * normalized.windowMargin) / 100;
  const marginY = (canvasHeight * normalized.windowMargin) / 100;
  const innerRadius = Math.round(normalized.innerRadius * (canvasWidth / 720));

  return {
    innerX: marginX,
    innerY: marginY,
    innerW: canvasWidth - marginX * 2,
    innerH: canvasHeight - marginY * 2,
    innerRadius
  };
}

const ratioNumberMap: Record<RefinedCanvasRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  auto: 3 / 4
};

export function resolveDotRatioNumber(frame: DotFrameConfig, mediaWidth: number, mediaHeight: number): number {
  if (frame.canvasRatio === "auto") {
    return mediaWidth / mediaHeight;
  }

  return ratioNumberMap[frame.canvasRatio];
}
