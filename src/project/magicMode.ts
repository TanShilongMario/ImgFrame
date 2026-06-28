import type { ImageAnalysis } from "../media/analyzeImage";
import type { TemplateParams } from "../types";

export function applyMagicModeParams(previewParams: TemplateParams, analysis: ImageAnalysis): TemplateParams {
  const params = structuredClone(previewParams);

  if (params.refinedFrame) {
    params.refinedFrame = {
      ...params.refinedFrame,
      canvasRatio: "auto",
      gradientTone: analysis.averageBrightness >= 0.42 ? "white" : "black"
    };
  }

  params.text = {
    ...params.text,
    credit: params.text.credit.trim() || "Made by FrameForge"
  };

  return params;
}
