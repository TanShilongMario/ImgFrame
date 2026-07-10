import type { BandColorChoice, BandFrameConfig, CanvasRatio, DotFrameConfig, FlutedFrameConfig, GlassFrameConfig, GlassSillFrameConfig, GridFrameConfig, SwatchFrameConfig, TemplateParams } from "../types";
import { clampDotFrame } from "./dotFrame";
import { clampFlutedFrame } from "./flutedFrame";
import { clampSwatchFrame } from "./swatchFrame";
import { getTemplateById, templateRegistry, type TemplateDefinition } from "./registry";
import { clampGlassFrame } from "./glassFrame";
import { clampGlassSillFrame } from "./glassSillFrame";
import { clampBandFrame } from "./bandFrame";
import { deriveCellEffectsFromSeed, normalizeCellEffects, withDerivedGridEffects } from "./gridFrame";

const ratios: CanvasRatio[] = ["1:1", "4:5", "3:4", "9:16", "16:9"];
const backgrounds = ["#e9e7e2", "#1a1a18", "#dfe8e4", "#f3efe8", "#2c2c2a", "#ece8e1", "#d8ddd8"];
const borderColors = ["#ffffff", "#f5f2ec", "rgba(255,255,255,0.72)", "#3a3a36", "#e8e4dc"];
const titleColors = ["#dd684f", "#3d5c48", "#8c6b4f", "#ffffff", "#2b2b28", "#b85c42", "#e8e4dc"];
const titles = ["高级展示", "视觉容器", "Quiet Frame", "Poster Study", "Material Card", "Cover Draft"];
const subtitles = ["上传即生成", "Curated layout", "Frame your work", "Presentation ready", "Made to share"];
const refinedCredits = ["雾里看花", "薄雾时分", "晨光未醒", "Into the Mist", "Soft Morning", "光影札记"];
const gridTitles = ["Title", "Moment", "Still", "Frame", "Light", "View", "Post", "Note", "City"];
const glassTitles = ["Kyoto", "Tokyo", "Paris", "Shanghai", "Osaka", "London", "Seoul", "Hangzhou"];
const bandTitles = [
  "Title for a sentence",
  "A quiet afternoon",
  "Notes on light",
  "Toward the sea",
  "城市的轮廓",
  "山海之间",
  "一个安静的下午"
];
const bandSubtitles = ["Subtitle", "Chapter 01", "Story", "札记", "序章", "Field notes"];
const glassSubtitles = [
  "Arashiyama · Japan",
  "Shibuya · Japan",
  "Le Marais · France",
  "The Bund · China",
  "Dotonbori · Japan",
  "Camden · UK",
  "Han River · Korea",
  "West Lake · China"
];

const glassSillCaptions = [
  "Arashiyama · Kyoto",
  "Shibuya Crossing",
  "Le Marais · Paris",
  "The Bund · Shanghai",
  "West Lake · Hangzhou",
  "Han River · Seoul"
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function range(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function cloneParams(params: TemplateParams): TemplateParams {
  return structuredClone(params);
}

export function randomizeTemplateParams(base: TemplateParams): TemplateParams {
  if (base.dotFrame) {
    return {
      ...cloneParams(base),
      dotFrame: clampDotFrame({
        ...base.dotFrame,
        windowMargin: range(12, 22),
        innerRadius: range(12, 32),
        borderWidth: range(3, 6),
        seed: Math.floor(Math.random() * 100000)
      })
    };
  }

  if (base.swatchFrame) {
    return {
      ...cloneParams(base),
      swatchFrame: clampSwatchFrame({
        ...base.swatchFrame,
        windowMargin: range(12, 22),
        innerRadius: range(12, 32),
        borderWidth: range(3, 6),
        segmentCount: range(3, 6),
        seed: Math.floor(Math.random() * 100000)
      })
    };
  }

  if (base.flutedFrame) {
    return {
      ...cloneParams(base),
      flutedFrame: clampFlutedFrame({
        ...base.flutedFrame,
        windowMargin: range(12, 22),
        innerRadius: range(12, 32),
        borderWidth: range(3, 6),
        seed: Math.floor(Math.random() * 100000)
      })
    };
  }

  if (base.glassSillFrame) {
    return {
      ...cloneParams(base),
      text: {
        ...base.text,
        title: pick(glassSillCaptions).slice(0, 40),
        subtitle: ""
      },
      glassSillFrame: clampGlassSillFrame({
        ...base.glassSillFrame,
        edgeWidth: Number((2.5 + Math.random() * 3).toFixed(1)),
        bottomBand: Number((10 + Math.random() * 6).toFixed(1)),
        blur: range(24, 40),
        outerRadius: range(44, 72),
        textTone: pick(["white", "black", "gray"] as const),
        backingColor: pick(["cream", "sand", "mist", "lilac", "sage", "system"] as const),
        systemBackingHex: undefined,
        causticHex: undefined
      })
    };
  }

  if (base.glassFrame) {
    return {
      ...cloneParams(base),
      text: {
        ...base.text,
        title: pick(glassTitles).slice(0, 24),
        subtitle: pick(glassSubtitles).slice(0, 48)
      },
      glassFrame: clampGlassFrame({
        ...base.glassFrame,
        edgeWidth: Number((2 + Math.random() * 4).toFixed(1)),
        bottomExtra: Number((Math.random() * 4).toFixed(1)),
        blur: range(20, 40),
        outerRadius: range(48, 80),
        textTone: pick(["white", "black", "gray"] as const),
        backingColor: pick(["cream", "sand", "mist", "lilac", "sage", "system"] as const),
        systemBackingHex: undefined
      })
    };
  }

  if (base.bandFrame) {
    const fixedColors: BandColorChoice[] = ["cream", "sand", "mist", "lilac", "sage"];
    const bandColor = pick(fixedColors); // 腰封偏浅，均为柔和浅色系
    const backingColor = pick(fixedColors.filter((c) => c !== bandColor));
    return {
      ...cloneParams(base),
      text: {
        ...base.text,
        title: pick(bandTitles).slice(0, 40),
        subtitle: pick(bandSubtitles).slice(0, 24)
      },
      bandFrame: clampBandFrame({
        ...base.bandFrame,
        outerMargin: range(4, 12),
        bandHeight: range(22, 36),
        subtitleSize: range(13, 20),
        titleSize: range(26, 40),
        bandColor,
        backingColor,
        systemBandHex: undefined,
        systemBackingHex: undefined
      })
    };
  }

  if (base.gridFrame) {
    const seed = range(1, 99999);
    return {
      ...cloneParams(base),
      text: {
        ...base.text,
        title: pick(gridTitles).slice(0, 10)
      },
      gridFrame: withDerivedGridEffects({
        ...base.gridFrame,
        lineTone: pick(["white", "black"] as const),
        lineX1: range(20, 36),
        lineX2: range(64, 80),
        lineY1: range(26, 42),
        lineY2: range(68, 84),
        seed,
        cellEffects: deriveCellEffectsFromSeed(seed)
      })
    };
  }

  if (base.refinedFrame) {
    return {
      ...cloneParams(base),
      text: {
        ...base.text,
        credit: pick(refinedCredits)
      },
      refinedFrame: {
        canvasRatio: base.refinedFrame.canvasRatio,
        cropWidth: range(24, 42),
        cropHeight: range(0, 28),
        backgroundBlur: range(18, 46),
        gradientTone: pick(["white", "black"] as const)
      }
    };
  }

  return {
    canvas: {
      ratio: pick(ratios),
      background: pick(backgrounds),
      padding: range(36, 80)
    },
    media: {
      radius: range(0, 40),
      borderWidth: range(0, 14),
      borderColor: pick(borderColors),
      shadow: {
        blur: range(20, 72),
        offsetX: 0,
        offsetY: range(8, 32),
        opacity: Number((0.08 + Math.random() * 0.24).toFixed(2))
      },
      crop: { x: 0, y: 0, scale: 1, rotation: 0 }
    },
    text: {
      title: pick(titles),
      subtitle: pick(subtitles),
      credit: pick(refinedCredits),
      titleColor: pick(titleColors),
      fontFamily: base.text.fontFamily
    }
  };
}

export function pickRandomTemplate(excludeId?: string): TemplateDefinition {
  const candidates =
    excludeId && templateRegistry.length > 1
      ? templateRegistry.filter((item) => item.id !== excludeId)
      : templateRegistry;

  return pick(candidates);
}

export function pickRandomTemplateSeeded(rand: () => number, excludeId?: string): TemplateDefinition {
  const candidates =
    excludeId && templateRegistry.length > 1
      ? templateRegistry.filter((item) => item.id !== excludeId)
      : templateRegistry;

  return candidates[Math.floor(rand() * candidates.length)];
}

export function randomizeTemplatePick(excludeTemplateId?: string): { templateId: string; params: TemplateParams } {
  const template = pickRandomTemplate(excludeTemplateId);

  return {
    templateId: template.id,
    params: randomizeTemplateParams(template.baseParams)
  };
}

export function randomizeWithinTemplate(templateId: string): TemplateParams {
  const template = getTemplateById(templateId);
  return randomizeTemplateParams(template.baseParams);
}

export function randomizeFull(): { templateId: string; params: TemplateParams } {
  return randomizeTemplatePick();
}

export function mergeTemplateParams(base: TemplateParams, next: TemplateParams): TemplateParams {
  return cloneParams(next);
}

export function normalizeFlutedFrame(frame?: FlutedFrameConfig): FlutedFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return clampFlutedFrame(frame);
}

export function normalizeSwatchFrame(frame?: SwatchFrameConfig): SwatchFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return clampSwatchFrame(frame);
}

export function normalizeDotFrame(frame?: DotFrameConfig): DotFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return clampDotFrame(frame);
}

export function normalizeGlassFrame(frame?: GlassFrameConfig): GlassFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return clampGlassFrame(frame);
}

export function normalizeGlassSillFrame(frame?: GlassSillFrameConfig): GlassSillFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return clampGlassSillFrame(frame);
}

export function normalizeBandFrame(frame?: BandFrameConfig): BandFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return clampBandFrame(frame);
}

export function normalizeGridFrame(frame?: GridFrameConfig): GridFrameConfig | undefined {
  if (!frame) {
    return undefined;
  }

  return withDerivedGridEffects({
    ...frame,
    cellEffects: normalizeCellEffects(frame.cellEffects)
  });
}
