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

export type RefinedFrameConfig = {
  canvasRatio: RefinedCanvasRatio;
  cropWidth: number;
  cropHeight: number;
  backgroundBlur: number;
  gradientTone: GradientTone;
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
  };
  refinedFrame?: RefinedFrameConfig;
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

