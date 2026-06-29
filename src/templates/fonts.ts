export type TextFontId = "sans" | "serif" | "song" | "kai" | "brush" | "hand";

export type TextFontOption = {
  id: TextFontId;
  label: string;
  stack: string;
};

/**
 * 字体方案：尽量使用系统自带字体（macOS / Windows），无需联网下载。
 * 预览（CSS font-family）与导出（canvas context.font）共用同一 stack。
 */
export const TEXT_FONT_OPTIONS: TextFontOption[] = [
  {
    id: "sans",
    label: "黑体",
    stack: '"Inter", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
  },
  {
    id: "serif",
    label: "衬线",
    stack: '"Georgia", "Times New Roman", "Songti SC", "STSong", serif'
  },
  {
    id: "song",
    label: "宋体",
    stack: '"Songti SC", "STSong", "SimSun", "Noto Serif SC", serif'
  },
  {
    id: "kai",
    label: "楷体",
    stack: '"Kaiti SC", "STKaiti", "KaiTi", "Kai", "DFKai-SB", serif'
  },
  {
    id: "brush",
    label: "毛笔",
    stack: '"Weibei SC", "Yuppy SC", "Hanzipen SC", "Baoli SC", "STXingkai", "Kaiti SC", cursive'
  },
  {
    id: "hand",
    label: "手写",
    stack: '"Hannotate SC", "Hanzipen SC", "Bradley Hand", "Comic Sans MS", "Kaiti SC", cursive'
  }
];

export const DEFAULT_TEXT_FONT: TextFontId = "sans";

const FONT_MAP = new Map(TEXT_FONT_OPTIONS.map((option) => [option.id, option]));

export function getFontStack(fontId?: TextFontId): string {
  return (fontId && FONT_MAP.get(fontId)?.stack) ?? FONT_MAP.get(DEFAULT_TEXT_FONT)!.stack;
}

export function normalizeTextFont(fontId?: string): TextFontId {
  return fontId && FONT_MAP.has(fontId as TextFontId) ? (fontId as TextFontId) : DEFAULT_TEXT_FONT;
}
