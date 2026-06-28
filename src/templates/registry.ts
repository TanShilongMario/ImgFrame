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
        canvasRatio: "auto",
        cropWidth: 33,
        cropHeight: 0,
        backgroundBlur: 32,
        gradientTone: "white"
      }
    }
  }
];

export function getTemplateById(id: string): TemplateDefinition {
  return templateRegistry.find((item) => item.id === id) ?? templateRegistry[0];
}
