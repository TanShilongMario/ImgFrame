import type { TemplateParams } from "../types";
import { defaultTemplateParams } from "./defaults";

export type TemplateDefinition = {
  id: string;
  name: string;
  family: string;
  baseParams: TemplateParams;
};

export const templateRegistry: TemplateDefinition[] = [
  {
    id: "frameforge-signature",
    name: "FrameForge Signature",
    family: "refined-blur-frame",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "3:4", background: "#e8e8e5", padding: 0 },
      media: {
        radius: 0,
        borderWidth: 5,
        borderColor: "#ffffff",
        shadow: { blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "FrameForge",
        subtitle: "Signature blur frame",
        credit: "Made by FrameForge",
        titleColor: "#2a2a28"
      },
      refinedFrame: {
        cropWidth: 33,
        cropHeight: 0,
        backgroundBlur: 32,
        gradientTone: "white"
      }
    }
  },
  {
    id: "minimal-poster-card",
    name: "极简海报",
    family: "minimal-card",
    baseParams: defaultTemplateParams
  },
  {
    id: "glass-card",
    name: "玻璃卡片",
    family: "glass-card",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "4:5", background: "#dfe8e4", padding: 56 },
      media: {
        radius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.72)",
        shadow: { blur: 48, offsetX: 0, offsetY: 24, opacity: 0.14 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Glass Frame",
        subtitle: "Translucent layers",
        credit: "Made by FrameForge",
        titleColor: "#3d5c48"
      }
    }
  },
  {
    id: "soft-layer",
    name: "柔和层次",
    family: "soft-layer",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "3:4", background: "#f3efe8", padding: 72 },
      media: {
        radius: 36,
        borderWidth: 0,
        borderColor: "#ffffff",
        shadow: { blur: 64, offsetX: 0, offsetY: 28, opacity: 0.12 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Soft Layer",
        subtitle: "Quiet composition",
        credit: "Made by FrameForge",
        titleColor: "#8c6b4f"
      }
    }
  },
  {
    id: "dark-editorial",
    name: "暗色编辑",
    family: "editorial",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "4:5", background: "#1a1a18", padding: 48 },
      media: {
        radius: 12,
        borderWidth: 2,
        borderColor: "#3a3a36",
        shadow: { blur: 40, offsetX: 0, offsetY: 20, opacity: 0.35 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Editorial",
        subtitle: "Dark canvas",
        credit: "Made by FrameForge",
        titleColor: "#e8e4dc"
      }
    }
  },
  {
    id: "warm-border",
    name: "暖色边框",
    family: "border-card",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "1:1", background: "#ece8e1", padding: 40 },
      media: {
        radius: 8,
        borderWidth: 14,
        borderColor: "#ffffff",
        shadow: { blur: 24, offsetX: 0, offsetY: 12, opacity: 0.16 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Warm Border",
        subtitle: "Classic frame",
        credit: "Made by FrameForge",
        titleColor: "#b85c42"
      }
    }
  },
  {
    id: "cinema-wide",
    name: "电影宽幅",
    family: "cinema",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "16:9", background: "#2c2c2a", padding: 36 },
      media: {
        radius: 4,
        borderWidth: 6,
        borderColor: "#f5f2ec",
        shadow: { blur: 56, offsetX: 0, offsetY: 32, opacity: 0.28 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Cinema",
        subtitle: "Wide format",
        credit: "Made by FrameForge",
        titleColor: "#f5f2ec"
      }
    }
  }
];

export function getTemplateById(id: string): TemplateDefinition {
  return templateRegistry.find((item) => item.id === id) ?? templateRegistry[0];
}
