import type { CanvasRatio, TemplateParams } from "../types";
import { getTemplateById, templateRegistry } from "./registry";

const ratios: CanvasRatio[] = ["1:1", "4:5", "3:4", "9:16", "16:9"];
const backgrounds = ["#e9e7e2", "#1a1a18", "#dfe8e4", "#f3efe8", "#2c2c2a", "#ece8e1", "#d8ddd8"];
const borderColors = ["#ffffff", "#f5f2ec", "rgba(255,255,255,0.72)", "#3a3a36", "#e8e4dc"];
const titleColors = ["#dd684f", "#3d5c48", "#8c6b4f", "#ffffff", "#2b2b28", "#b85c42", "#e8e4dc"];
const titles = ["高级展示", "视觉容器", "Quiet Frame", "Poster Study", "Material Card", "Cover Draft"];
const subtitles = ["上传即生成", "Curated layout", "Frame your work", "Presentation ready", "Made to share"];
const refinedCredits = ["Made by FrameForge", "Forged in FrameForge", "FrameForge Studio"];

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
      credit: "Made by FrameForge",
      titleColor: pick(titleColors)
    }
  };
}

export function randomizeWithinTemplate(templateId: string): TemplateParams {
  const template = getTemplateById(templateId);
  return randomizeTemplateParams(template.baseParams);
}

export function randomizeFull(): { templateId: string; params: TemplateParams } {
  const template = pick(templateRegistry);
  return {
    templateId: template.id,
    params: randomizeTemplateParams(template.baseParams)
  };
}

export function mergeTemplateParams(base: TemplateParams, next: TemplateParams): TemplateParams {
  return cloneParams(next);
}
