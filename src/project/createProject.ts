import type { MediaAsset, Project } from "../types";
import { defaultTemplateParams, starterTemplate } from "../templates/defaults";
import { createId } from "../utils/id";

export function createProjectFromMedia(asset: MediaAsset): Project {
  const now = new Date().toISOString();
  const ratio = asset.width && asset.height && asset.width > asset.height ? "16:9" : "4:5";

  return {
    id: createId("project"),
    name: asset.name.replace(/\.[^.]+$/, "") || "未命名项目",
    mediaAssetId: asset.id,
    templateId: starterTemplate.id,
    templateParams: {
      ...defaultTemplateParams,
      canvas: {
        ...defaultTemplateParams.canvas,
        ratio
      }
    },
    createdAt: now,
    updatedAt: now
  };
}

