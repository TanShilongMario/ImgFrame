import type { BandColorChoice, BandFrameConfig } from "../types";

export const BAND_FRAME_LIMITS = {
  outerMargin: { min: 0, max: 16 },
  bandHeight: { min: 14, max: 50 },
  subtitleSize: { min: 10, max: 32 },
  titleSize: { min: 20, max: 64 }
} as const;

/** 卡片圆角（px @720 参考宽） */
export const BAND_CARD_RADIUS_PX = 36;

/** 5 个固定配色（腰封与衬底共用） */
export const BAND_FIXED_COLORS: { id: Exclude<BandColorChoice, "system">; label: string; hex: string }[] = [
  { id: "cream", label: "米白", hex: "#f6f2ea" },
  { id: "sand", label: "浅褐", hex: "#d8c7b1" },
  { id: "mist", label: "雾灰", hex: "#e4e1db" },
  { id: "lilac", label: "淡紫", hex: "#d1cbd4" },
  { id: "sage", label: "黛绿", hex: "#cbd4cc" }
];

const FIXED_COLOR_MAP = new Map(BAND_FIXED_COLORS.map((item) => [item.id, item.hex]));

function migrateBandColorChoice(choice: BandColorChoice | "ink"): BandColorChoice {
  return choice === "ink" ? "lilac" : choice;
}

export function clampBandFrame(frame: BandFrameConfig): BandFrameConfig {
  const clampValue = (value: number, range: { min: number; max: number }) =>
    Math.min(Math.max(value, range.min), range.max);

  return {
    ...frame,
    bandColor: migrateBandColorChoice(frame.bandColor as BandColorChoice | "ink"),
    backingColor: migrateBandColorChoice(frame.backingColor as BandColorChoice | "ink"),
    outerMargin: clampValue(frame.outerMargin, BAND_FRAME_LIMITS.outerMargin),
    bandHeight: clampValue(frame.bandHeight, BAND_FRAME_LIMITS.bandHeight),
    subtitleSize: clampValue(frame.subtitleSize, BAND_FRAME_LIMITS.subtitleSize),
    titleSize: clampValue(frame.titleSize, BAND_FRAME_LIMITS.titleSize)
  };
}

/** 卡片圆角随参考宽缩放 */
export function getBandCardRadiusPx(referenceWidth = 720): number {
  return Math.round(BAND_CARD_RADIUS_PX * (referenceWidth / 720));
}

/** 解析腰封 / 衬底实际颜色：固定色直接取，system 用已算出的 hex（缺省回退浅色） */
export function resolveBandColor(choice: BandColorChoice, systemHex?: string): string {
  if (choice === "system") {
    return systemHex ?? "#e6e2da";
  }

  return FIXED_COLOR_MAP.get(choice) ?? "#f6f2ea";
}

/* ---------------- 颜色工具 ---------------- */

export type Rgb = { r: number; g: number; b: number };

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (value: number) => clamp255(value).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    [r1, g1, b1] = [c, x, 0];
  } else if (hp < 2) {
    [r1, g1, b1] = [x, c, 0];
  } else if (hp < 3) {
    [r1, g1, b1] = [0, c, x];
  } else if (hp < 4) {
    [r1, g1, b1] = [0, x, c];
  } else if (hp < 5) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  const m = ln - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

/** 相对亮度，用于决定腰封上文字取深色还是浅色 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 1;
  }

  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function getBandTextColors(bandHex: string): { title: string; subtitle: string } {
  const isDark = getRelativeLuminance(bandHex) < 0.42;
  if (isDark) {
    return { title: "rgba(255, 255, 255, 0.94)", subtitle: "rgba(255, 255, 255, 0.7)" };
  }
  return { title: "#3e3c40", subtitle: "rgba(62, 60, 64, 0.62)" };
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }
  return { r, g, b };
}

/**
 * 系统配色：基于图像平均色，给出协调的暖中性色。
 * - 腰封（band）：高明度浅色
 * - 衬底（backing）：中等明度
 * 每次调用都带随机抖动，因此重复点击会得到不同结果。
 */
export function deriveSystemColor(average: Rgb, target: "band" | "backing"): string {
  const { h } = rgbToHsl(average);
  const hueJitter = (Math.random() - 0.5) * 36; // ±18°
  const hue = h + hueJitter;

  if (target === "band") {
    const s = 8 + Math.random() * 12; // 8–20%
    const l = 90 + Math.random() * 6; // 90–96%
    return rgbToHex(hslToRgb(hue, s, l));
  }

  const s = 14 + Math.random() * 12; // 14–26%
  const l = 74 + Math.random() * 9; // 74–83%
  return rgbToHex(hslToRgb(hue, s, l));
}

/**
 * 导出时若没有预存 system hex，用平均色派生一个稳定值（不加随机，保证可复现）。
 */
export function fallbackSystemColor(average: Rgb, target: "band" | "backing"): string {
  const { r, g, b } = average;
  const toHex = (value: number) => Math.min(255, Math.max(0, Math.round(value))).toString(16).padStart(2, "0");
  const mix = (channel: number, towards: number, ratio: number) => channel + (towards - channel) * ratio;
  const ratio = target === "band" ? 0.82 : 0.55;
  return `#${toHex(mix(r, 245, ratio))}${toHex(mix(g, 240, ratio))}${toHex(mix(b, 232, ratio))}`;
}

/** 从 CanvasImageSource 同步取平均色（导出时用） */
export function sampleAverageColorFromSource(source: CanvasImageSource): Rgb {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return { r: 200, g: 190, b: 178 };
  }

  context.drawImage(source, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  return { r: r / count, g: g / count, b: b / count };
}

/** 从图片 URL 异步取平均色（编辑器点击"系统"时用） */
export function sampleAverageColorFromUrl(url: string): Promise<Rgb> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        resolve(sampleAverageColorFromSource(image));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("无法读取图像配色。"));
    image.src = url;
  });
}
