import type { TemplateParams } from "../types";
import { deriveCellEffectsFromSeed, withDerivedGridEffects } from "./gridFrame";
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
    name: "雾纱",
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
        title: "雾纱",
        subtitle: "Soft blur frame",
        credit: "雾纱",
        titleColor: "#2a2a28",
        fontFamily: "sans"
      },
      refinedFrame: {
        canvasRatio: "auto",
        cropWidth: 33,
        cropHeight: 0,
        backgroundBlur: 32,
        gradientTone: "white"
      }
    }
  },
  {
    id: "grid-editorial",
    name: "格叙",
    family: "grid-frame",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "3:4", background: "#e8e8e5", padding: 0 },
      media: {
        radius: 0,
        borderWidth: 0,
        borderColor: "#ffffff",
        shadow: { blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Title",
        subtitle: "Grid editorial",
        credit: "格叙",
        titleColor: "#111111",
        fontFamily: "serif"
      },
      gridFrame: withDerivedGridEffects({
        canvasRatio: "auto",
        lineTone: "black",
        lineX1: 28,
        lineX2: 72,
        lineY1: 38,
        lineY2: 82,
        seed: 42,
        cellEffects: deriveCellEffectsFromSeed(42)
      })
    }
  },
  {
    id: "glass-plate",
    name: "空璃",
    family: "glass-frame",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "3:4", background: "#e8e8e5", padding: 0 },
      media: {
        radius: 0,
        borderWidth: 0,
        borderColor: "#ffffff",
        shadow: { blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Kyoto",
        subtitle: "Arashiyama · Japan",
        credit: "空璃",
        titleColor: "#ffffff",
        fontFamily: "serif"
      },
      glassFrame: {
        canvasRatio: "auto",
        edgeWidth: 2,
        bottomExtra: 1,
        blur: 30,
        textTone: "white"
      }
    }
  },
  {
    id: "caption-band",
    name: "题序",
    family: "band-frame",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "4:5", background: "#d8c7b1", padding: 0 },
      media: {
        radius: 0,
        borderWidth: 0,
        borderColor: "#ffffff",
        shadow: { blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Title for a sentence",
        subtitle: "Subtitle",
        credit: "题序",
        titleColor: "#3e3c40",
        fontFamily: "sans"
      },
      bandFrame: {
        canvasRatio: "auto",
        outerMargin: 8,
        bandHeight: 28,
        subtitleSize: 16,
        titleSize: 30,
        bandColor: "cream",
        backingColor: "sand"
      }
    }
  }
];

export function getTemplateById(id: string): TemplateDefinition {
  return templateRegistry.find((item) => item.id === id) ?? templateRegistry[0];
}

export function getTemplateFamily(templateId: string): string {
  return getTemplateById(templateId).family;
}
