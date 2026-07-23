import type { TemplateParams } from "../types";
import { deriveCellEffectsFromSeed, withDerivedGridEffects } from "./gridFrame";
import { defaultTemplateParams } from "./defaults";

export type TemplateDefinition = {
  id: string;
  name: string;
  family: string;
  baseParams: TemplateParams;
  /**
   * 是否适合视频素材。false 时模板列表显示「建议图片」标识。
   * 默认 true；计算极重、逐帧难以实时导出的模板应设为 false。
   */
  supportsVideo?: boolean;
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
        credit: "薄雾时分",
        titleColor: "#2a2a28",
        fontFamily: "sans"
      },
      refinedFrame: {
        canvasRatio: "auto",
        cropWidth: 33,
        cropHeight: 0,
        backgroundBlur: 32,
        gradientTone: "white",
        creditSize: 14
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
        titleSize: 28,
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
        edgeWidth: 3,
        bottomExtra: 1,
        blur: 30,
        outerRadius: 64,
        textTone: "white",
        titleSize: 28,
        subtitleSize: 14,
        backingColor: "system"
      }
    }
  },
  {
    id: "glass-sill",
    name: "沉璃",
    family: "glass-sill-frame",
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
        title: "Arashiyama · Kyoto",
        subtitle: "",
        credit: "沉璃",
        titleColor: "#ffffff",
        fontFamily: "serif"
      },
      glassSillFrame: {
        canvasRatio: "auto",
        edgeWidth: 3.5,
        bottomBand: 13,
        blur: 32,
        outerRadius: 56,
        textTone: "white",
        captionSize: 18,
        backingColor: "system"
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
  },
  {
    id: "corner-caption",
    name: "隅题",
    family: "corner-frame",
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "4:5", background: "#d8c7b1", padding: 0 },
      media: {
        radius: 20,
        borderWidth: 4,
        borderColor: "#ffffff",
        shadow: { blur: 28, offsetX: 0, offsetY: 10, opacity: 0.14 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "Title for a sentence",
        subtitle: "Subtitle",
        credit: "隅题",
        titleColor: "#111111",
        fontFamily: "sans"
      },
      cornerFrame: {
        canvasRatio: "auto",
        outerMargin: 10,
        mediaRadius: 20,
        borderWidth: 4,
        subtitleSize: 14,
        titleSize: 28,
        textCorner: "bottom-left",
        textTone: "black",
        backingColor: "sand"
      }
    }
  },
  {
    id: "fluted-rib",
    name: "长虹",
    family: "fluted-frame",
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
        title: "",
        subtitle: "",
        credit: "长虹",
        titleColor: "#ffffff",
        fontFamily: "sans"
      },
      flutedFrame: {
        canvasRatio: "auto",
        windowMargin: 16,
        innerRadius: 20,
        borderWidth: 4,
        seed: 42
      }
    }
  },
  {
    id: "color-strip",
    name: "色谱",
    family: "swatch-frame",
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
        title: "",
        subtitle: "",
        credit: "色谱",
        titleColor: "#ffffff",
        fontFamily: "sans"
      },
      swatchFrame: {
        canvasRatio: "auto",
        windowMargin: 16,
        innerRadius: 20,
        borderWidth: 4,
        segmentCount: 4,
        seed: 42
      }
    }
  },
  // 波点模板暂时下线（效果不如网点）
  // {
  //   id: "polka-dots",
  //   name: "波点",
  //   family: "dot-frame",
  //   baseParams: {
  //     ...defaultTemplateParams,
  //     canvas: { ratio: "3:4", background: "transparent", padding: 0 },
  //     media: {
  //       radius: 0,
  //       borderWidth: 0,
  //       borderColor: "#ffffff",
  //       shadow: { blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
  //       crop: { x: 0, y: 0, scale: 1, rotation: 0 }
  //     },
  //     text: {
  //       title: "",
  //       subtitle: "",
  //       credit: "波点",
  //       titleColor: "#ffffff",
  //       fontFamily: "sans"
  //     },
  //     dotFrame: {
  //       canvasRatio: "auto",
  //       windowMargin: 16,
  //       innerRadius: 20,
  //       borderWidth: 4,
  //       seed: 42
  //     }
  //   }
  // },
  {
    id: "halftone-print",
    name: "网点",
    family: "print-frame",
    /** CMYK 半色调逐帧过重，视频导出不实用 */
    supportsVideo: false,
    baseParams: {
      ...defaultTemplateParams,
      canvas: { ratio: "3:4", background: "transparent", padding: 0 },
      media: {
        radius: 0,
        borderWidth: 0,
        borderColor: "#ffffff",
        shadow: { blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
        crop: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      text: {
        title: "",
        subtitle: "",
        credit: "网点",
        titleColor: "#ffffff",
        fontFamily: "sans"
      },
      printFrame: {
        canvasRatio: "auto",
        windowMargin: 16,
        innerRadius: 20,
        borderWidth: 4,
        seed: 42,
        backingColor: "cream"
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
