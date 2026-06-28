import { createId } from "../utils/id";
import type { MediaAsset, Project, RefinedFrameConfig, TemplateParams } from "../types";
import { randomizeFull, randomizeWithinTemplate } from "../templates/randomize";
import { getTemplateById } from "../templates/registry";

export function normalizeProject(project: Project): Project {
  const refined = project.templateParams.refinedFrame as RefinedFrameConfig | undefined;
  if (refined && (refined as RefinedFrameConfig & { canvasRatio?: unknown }).canvasRatio === undefined) {
    return {
      ...project,
      templateParams: {
        ...project.templateParams,
        refinedFrame: { ...refined, canvasRatio: "auto" }
      }
    };
  }

  return project;
}

export function createProjectFromMedia(
  asset: MediaAsset,
  options?: { templateId?: string; templateParams?: TemplateParams }
): Project {
  const now = new Date().toISOString();
  const starterTemplate = getTemplateById(options?.templateId ?? "frameforge-signature");

  return {
    id: createId("project"),
    name: asset.name.replace(/\.[^.]+$/, "") || "未命名项目",
    mediaAssetId: asset.id,
    templateId: starterTemplate.id,
    templateParams: structuredClone(options?.templateParams ?? starterTemplate.baseParams),
    createdAt: now,
    updatedAt: now
  };
}

export function createProjectFromGallery(entry: {
  label: string;
  templateId: string;
  params: Project["templateParams"];
}): Project {
  const now = new Date().toISOString();

  return {
    id: createId("project"),
    name: entry.label,
    templateId: entry.templateId,
    templateParams: entry.params,
    createdAt: now,
    updatedAt: now
  };
}

export function applyGalleryToProject(project: Project, entry: {
  templateId: string;
  params: Project["templateParams"];
  label: string;
}): Project {
  return {
    ...project,
    templateId: entry.templateId,
    templateParams: entry.params,
    name: project.mediaAssetId ? project.name : entry.label,
    updatedAt: new Date().toISOString()
  };
}

export function shuffleProjectParams(project: Project): Project {
  return {
    ...project,
    templateParams: randomizeWithinTemplate(project.templateId),
    updatedAt: new Date().toISOString()
  };
}

export function shuffleProjectAll(project: Project): Project {
  const randomized = randomizeFull();

  return {
    ...project,
    templateId: randomized.templateId,
    templateParams: randomized.params,
    updatedAt: new Date().toISOString()
  };
}
