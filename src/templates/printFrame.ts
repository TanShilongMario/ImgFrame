import { drawCoverImage } from "../export/canvasUtils";
import type { PrintFrameConfig, PrintPaperColor, RefinedCanvasRatio } from "../types";

export const PRINT_FRAME_LIMITS = {
  windowMargin: { min: 10, max: 28 },
  innerRadius: { min: 0, max: 64 },
  borderWidth: { min: 2, max: 12 }
} as const;

/** 偏向真实纸张的低饱和色：象牙、本白、暖灰，避免假黄褐 */
export const PRINT_PAPER_COLORS: { id: PrintPaperColor; label: string; hex: string }[] = [
  { id: "cream", label: "象牙纸", hex: "#f4f1ea" },
  { id: "sand", label: "本白纸", hex: "#efebe3" },
  { id: "warm", label: "暖白纸", hex: "#f2ebe2" },
  { id: "parchment", label: "棉浆纸", hex: "#ebe6dc" },
  { id: "newsprint", label: "新闻纸", hex: "#e8e6e1" }
];

const PAPER_COLOR_MAP = new Map(PRINT_PAPER_COLORS.map((item) => [item.id, item.hex]));

export const PRINT_DEFAULTS = {
  windowMargin: 16,
  innerRadius: 20,
  borderWidth: 4,
  seed: 42,
  backingColor: "cream" as const
};

export type PrintLayoutPx = {
  innerX: number;
  innerY: number;
  innerW: number;
  innerH: number;
  innerRadius: number;
};

/** 单颗印刷网点：CMYK 分色墨量 + 总网点大小 */
export type PrintDot = {
  x: number;
  y: number;
  c: number;
  m: number;
  yInk: number;
  k: number;
  /** 相对格子的半径比例 0–0.5 */
  radiusRatio: number;
};

export type PrintField = {
  dots: PrintDot[];
  columns: number;
  rows: number;
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

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

/** sRGB → 简易 CMYK（印刷分色用） */
function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);

  if (k >= 0.999) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }

  const den = 1 - k;
  return {
    c: (1 - rn - k) / den,
    m: (1 - gn - k) / den,
    y: (1 - bn - k) / den,
    k
  };
}

/** 印刷四色油墨（process CMYK） */
const PROCESS_CYAN = { r: 0, g: 174, b: 239 };
const PROCESS_MAGENTA = { r: 236, g: 0, b: 140 };
const PROCESS_YELLOW = { r: 255, g: 242, b: 0 };
const PROCESS_BLACK = { r: 28, g: 26, b: 24 };

export function resolvePrintPaperHex(color: PrintPaperColor): string {
  return PAPER_COLOR_MAP.get(color) ?? PRINT_PAPER_COLORS[0].hex;
}

/** 网点层缓存：同一张图 + seed + 比例只生成一次，边距/圆角变化不再重算 */
const HALFTONE_CACHE_MAX = 6;
const halftoneLayerCache = new Map<string, HTMLCanvasElement>();
const paperTileCache = new Map<string, HTMLCanvasElement>();

/** 每个网点格在离屏层上的像素边长；越大越清晰，越小越快 */
const HALFTONE_CELL_PX = 5;

function rememberCache<T>(map: Map<string, T>, key: string, value: T, max: number): T {
  if (map.has(key)) {
    map.delete(key);
  }
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    map.delete(oldest);
  }
  return value;
}

function stabilizeAspectRatio(aspectRatio: number): number {
  return Math.round(aspectRatio * 1000) / 1000;
}

/**
 * AM 半色调网点：网格只由 seed + 目标宽高比决定（与预览像素尺寸无关）。
 * 密度约 100–120 列，Cover 采样不拉伸原图。
 */
export function buildPrintField(
  source: CanvasImageSource,
  seed: number,
  aspectRatio: number
): PrintField {
  const rand = seededRandom(seed);
  const destRatio = Math.max(0.2, stabilizeAspectRatio(aspectRatio));

  // 密度对齐「加密前」一档：约 100–120 列，行数按目标窗比例
  const columns = Math.round(100 + rand() * 20);
  const rows = Math.max(8, Math.round(columns / destRatio));
  const jitterAmp = 0.05 + rand() * 0.03;
  // 明度映射点径：亮→极小，暗→接近铺满格距
  const maxRadiusRatio = 0.48;
  const minRadiusRatio = 0.02;
  const toneGamma = 1.15;

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = columns;
  sampleCanvas.height = rows;
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) {
    return { dots: [], columns, rows };
  }

  // Cover：按目标窗比例裁切填充，切换画布比例时不拉伸
  drawCoverImage(sampleContext, source, 0, 0, columns, rows, 0.42);
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  const dots: PrintDot[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = (row * columns + column) * 4;
      if (pixels[index + 3] < 32) {
        continue;
      }

      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      // 相对明度 0–1：越高越亮
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      // 点径只由明度决定：明度越高点越小，越低点越大
      const sizeByLuma = Math.pow(1 - luminance, toneGamma);

      if (sizeByLuma < 0.02) {
        continue;
      }

      const cmyk = rgbToCmyk(r, g, b);
      const radiusRatio = minRadiusRatio + sizeByLuma * (maxRadiusRatio - minRadiusRatio);
      const jitterX = (rand() - 0.5) * jitterAmp;
      const jitterY = (rand() - 0.5) * jitterAmp;

      dots.push({
        x: (column + 0.5 + jitterX) / columns,
        y: (row + 0.5 + jitterY) / rows,
        c: cmyk.c,
        m: cmyk.m,
        yInk: cmyk.y,
        k: cmyk.k,
        radiusRatio
      });
    }
  }

  return { dots, columns, rows };
}

/**
 * 将网点栅格化为离屏位图；同一 cacheKey 下 seed/比例不变则直接复用。
 * 边距、描边、纸色变化不应触发重建。
 */
export function getPrintHalftoneLayer(
  source: CanvasImageSource,
  seed: number,
  aspectRatio: number,
  cacheKey?: string
): HTMLCanvasElement {
  const ratio = stabilizeAspectRatio(aspectRatio);
  const key = cacheKey ? `${cacheKey}|${seed}|${ratio}` : undefined;
  if (key) {
    const hit = halftoneLayerCache.get(key);
    if (hit) {
      // LRU：挪到末尾
      rememberCache(halftoneLayerCache, key, hit, HALFTONE_CACHE_MAX);
      return hit;
    }
  }

  const field = buildPrintField(source, seed, ratio);
  const layer = document.createElement("canvas");
  layer.width = Math.max(1, Math.round(field.columns * HALFTONE_CELL_PX));
  layer.height = Math.max(1, Math.round(field.rows * HALFTONE_CELL_PX));
  const context = layer.getContext("2d");
  if (context) {
    // 透明底，叠印到纸色上
    context.clearRect(0, 0, layer.width, layer.height);
    drawPrintDotField(context, field, 0, 0, layer.width, layer.height);
  }

  if (key) {
    return rememberCache(halftoneLayerCache, key, layer, HALFTONE_CACHE_MAX);
  }

  return layer;
}

function getPaperGrainTile(paperHex: string, seed: number): HTMLCanvasElement {
  const key = `${paperHex}|${seed}`;
  const hit = paperTileCache.get(key);
  if (hit) {
    rememberCache(paperTileCache, key, hit, HALFTONE_CACHE_MAX);
    return hit;
  }

  const tileSize = 192;
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = tileSize;
  grainCanvas.height = tileSize;
  const grainContext = grainCanvas.getContext("2d");
  if (!grainContext) {
    return grainCanvas;
  }

  const base = hexToRgb(paperHex);
  const rand = seededRandom(seed ^ 0x5f3759df);
  const imageData = grainContext.createImageData(tileSize, tileSize);
  const pixels = imageData.data;

  for (let row = 0; row < tileSize; row += 1) {
    for (let column = 0; column < tileSize; column += 1) {
      const index = (row * tileSize + column) * 4;
      // 细纤维噪声：幅度小，色偏跟随纸基，不做脏点
      const fine = (rand() - 0.5) * 9;
      const fiber =
        Math.sin(column * 0.41 + row * 0.09 + seed * 0.0007) * 2.2 +
        Math.sin(column * 0.11 - row * 0.27) * 1.4 +
        (rand() - 0.5) * 2.5;
      // 极淡的冷暖微差，模拟纸浆纤维
      const warmShift = (rand() - 0.5) * 1.8;

      pixels[index] = clamp255(base.r + fine + fiber + warmShift);
      pixels[index + 1] = clamp255(base.g + fine + fiber * 0.96 + warmShift * 0.4);
      pixels[index + 2] = clamp255(base.b + fine + fiber * 0.9 - warmShift * 0.35);
      pixels[index + 3] = 255;
    }
  }

  grainContext.putImageData(imageData, 0, 0);
  return rememberCache(paperTileCache, key, grainCanvas, HALFTONE_CACHE_MAX);
}

/** 纸张底色：柔和实色 + 细腻纤维颗粒（避免脏斑与假黄） */
export function drawRoughPaperFill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  paperHex: string,
  seed: number
) {
  context.fillStyle = paperHex;
  context.fillRect(x, y, width, height);

  const grainCanvas = getPaperGrainTile(paperHex, seed);

  context.save();
  context.globalAlpha = 0.28;
  context.globalCompositeOperation = "multiply";
  const pattern = context.createPattern(grainCanvas, "repeat");
  if (pattern) {
    context.fillStyle = pattern;
    context.fillRect(x, y, width, height);
  }
  context.restore();

  // 轻微柔光，让纸面更像受光后的本白，而不是发脏的米色
  context.save();
  context.globalAlpha = 0.08;
  context.fillStyle = "#ffffff";
  context.fillRect(x, y, width, height);
  context.restore();
}

function drawProcessInkDot(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  ink: { r: number; g: number; b: number },
  amount: number
) {
  if (amount < 0.06 || radius < 0.35) {
    return;
  }

  // 墨量只影响透明度，点径保持明度映射结果
  const alpha = Math.min(0.9, 0.22 + amount * 0.7);
  context.beginPath();
  context.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${alpha})`;
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();
}

/**
 * CMYK 分色叠印：四色油墨各自轻微错位，模拟印刷套准误差（色散）。
 * 使用 multiply，墨色叠在纸上更像印刷品。
 */
export function drawPrintDotField(
  context: CanvasRenderingContext2D,
  field: PrintField,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const cell = Math.min(width / field.columns, height / field.rows);
  // 比之前更明显的套准错位
  const spread = Math.max(0.55, cell * 0.22);

  context.save();
  context.globalCompositeOperation = "multiply";

  for (const dot of field.dots) {
    const cx = x + dot.x * width;
    const cy = y + dot.y * height;
    const radius = cell * dot.radiusRatio;
    if (radius < 0.4) {
      continue;
    }

    // C / M / Y / K 各版错位方向不同
    drawProcessInkDot(context, cx - spread, cy - spread * 0.15, radius, PROCESS_CYAN, dot.c);
    drawProcessInkDot(context, cx + spread * 0.85, cy - spread * 0.75, radius, PROCESS_MAGENTA, dot.m);
    drawProcessInkDot(context, cx + spread * 0.35, cy + spread, radius, PROCESS_YELLOW, dot.yInk);
    drawProcessInkDot(context, cx + spread * 0.1, cy + spread * 0.2, radius, PROCESS_BLACK, dot.k);
  }

  context.restore();
}

export function clampPrintFrame(frame: PrintFrameConfig): PrintFrameConfig {
  const backingColor = PRINT_PAPER_COLORS.some((item) => item.id === frame.backingColor)
    ? frame.backingColor
    : PRINT_DEFAULTS.backingColor;

  return {
    ...frame,
    canvasRatio: frame.canvasRatio ?? "auto",
    windowMargin: Math.min(
      Math.max(frame.windowMargin ?? PRINT_DEFAULTS.windowMargin, PRINT_FRAME_LIMITS.windowMargin.min),
      PRINT_FRAME_LIMITS.windowMargin.max
    ),
    innerRadius: Math.min(
      Math.max(frame.innerRadius ?? PRINT_DEFAULTS.innerRadius, PRINT_FRAME_LIMITS.innerRadius.min),
      PRINT_FRAME_LIMITS.innerRadius.max
    ),
    borderWidth: Math.min(
      Math.max(frame.borderWidth ?? PRINT_DEFAULTS.borderWidth, PRINT_FRAME_LIMITS.borderWidth.min),
      PRINT_FRAME_LIMITS.borderWidth.max
    ),
    seed: Math.max(0, Math.round(frame.seed ?? PRINT_DEFAULTS.seed)),
    backingColor
  };
}

export function getPrintLayoutPx(frame: PrintFrameConfig, canvasWidth: number, canvasHeight: number): PrintLayoutPx {
  const normalized = clampPrintFrame(frame);
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

export function resolvePrintRatioNumber(frame: PrintFrameConfig, mediaWidth: number, mediaHeight: number): number {
  if (frame.canvasRatio === "auto") {
    return mediaWidth / mediaHeight;
  }

  return ratioNumberMap[frame.canvasRatio];
}
