import type { TextFontId } from "./templates/fonts";

export type MediaType = "image" | "video";

export type CanvasRatio = "1:1" | "4:5" | "4:3" | "3:4" | "9:16" | "16:9";

export type RefinedCanvasRatio = CanvasRatio | "auto";

export type CropConfig = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type MediaAsset = {
  id: string;
  type: MediaType;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  blob: Blob;
  createdAt: string;
};

export type ShadowConfig = {
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

export type GradientTone = "white" | "black";

export type GridLineTone = "white" | "black";

export type GridCellEffect = "none" | "darken" | "lighten";

export type GridCellEffectEntry = {
  effect: GridCellEffect;
  strength: number;
};

export type GridFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  lineTone: GridLineTone;
  lineX1: number;
  lineX2: number;
  lineY1: number;
  lineY2: number;
  seed: number;
  cellEffects: GridCellEffectEntry[];
};

export type RefinedFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  cropWidth: number;
  cropHeight: number;
  backgroundBlur: number;
  gradientTone: GradientTone;
};

export type GlassTextTone = "white" | "black" | "gray";

export type BandColorChoice = "cream" | "sand" | "mist" | "lilac" | "sage" | "system";

export type BandFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  outerMargin: number;
  bandHeight: number;
  subtitleSize: number;
  titleSize: number;
  bandColor: BandColorChoice;
  backingColor: BandColorChoice;
  systemBandHex?: string;
  systemBackingHex?: string;
};

export type GlassFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  edgeWidth: number;
  bottomExtra: number;
  blur: number;
  outerRadius: number;
  textTone: GlassTextTone;
  backingColor: BandColorChoice;
  systemBackingHex?: string;
  /** @deprecated 迁移至 systemBackingHex */
  backingHex?: string;
};

export type GlassSillFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  edgeWidth: number;
  bottomBand: number;
  blur: number;
  outerRadius: number;
  textTone: GlassTextTone;
  backingColor: BandColorChoice;
  systemBackingHex?: string;
  causticHex?: string;
  /** @deprecated 迁移至 systemBackingHex */
  backingHex?: string;
};

export type FlutedFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  /** 中央图距边缘的间距（%，越大中央图越小） */
  windowMargin: number;
  /** 中央图圆角 */
  innerRadius: number;
  /** 中央图浅白描边宽度 */
  borderWidth: number;
  /** 长虹玻璃随机种子（影响纹理疏密、扭曲与光影） */
  seed: number;
};

export type SwatchFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  /** 中央图距边缘的间距（%，越大中央图越小） */
  windowMargin: number;
  /** 中央图圆角 */
  innerRadius: number;
  /** 中央图浅白描边宽度 */
  borderWidth: number;
  /** 背景色条等分数（3–6） */
  segmentCount: number;
  /** 随机取色种子 */
  seed: number;
};

export type DotFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  /** 中央图距边缘的间距（%，越大中央图越小） */
  windowMargin: number;
  innerRadius: number;
  borderWidth: number;
  /** 波点随机种子（影响密度、大小与分布） */
  seed: number;
};

export type TemplateParams = {
  canvas: {
    ratio: CanvasRatio;
    background: string;
    padding: number;
  };
  media: {
    radius: number;
    borderWidth: number;
    borderColor: string;
    shadow: ShadowConfig;
    crop: CropConfig;
  };
  text: {
    title: string;
    subtitle: string;
    credit: string;
    titleColor: string;
    fontFamily: TextFontId;
  };
  refinedFrame?: RefinedFrameConfig;
  gridFrame?: GridFrameConfig;
  glassFrame?: GlassFrameConfig;
  glassSillFrame?: GlassSillFrameConfig;
  bandFrame?: BandFrameConfig;
  flutedFrame?: FlutedFrameConfig;
  swatchFrame?: SwatchFrameConfig;
  dotFrame?: DotFrameConfig;
};

export type Project = {
  id: string;
  name: string;
  mediaAssetId?: string;
  templateId: string;
  templateParams: TemplateParams;
  createdAt: string;
  updatedAt: string;
};

export type HistoryRecord = {
  id: string;
  projectId: string;
  label: string;
  createdAt: string;
};

export type AppSettings = {
  id: "default";
  lastProject?: Project;
  preferredRatio: CanvasRatio;
  updatedAt: string;
};

