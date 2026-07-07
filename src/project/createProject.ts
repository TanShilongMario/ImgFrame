import { createId } from "../utils/id";
import type { GridFrameConfig, MediaAsset, Project, RefinedFrameConfig, TemplateParams } from "../types";
import { randomizeFull, randomizeWithinTemplate, normalizeBandFrame, normalizeFlutedFrame, normalizeGlassFrame, normalizeGlassSillFrame, normalizeGridFrame } from "../templates/randomize";
import { getTemplateById } from "../templates/registry";
import { normalizeTextFont } from "../templates/fonts";

export function normalizeProject(project: Project): Project {
  let templateParams = project.templateParams;

  const normalizedFont = normalizeTextFont(templateParams.text.fontFamily);
  if (normalizedFont !== templateParams.text.fontFamily) {
    templateParams = {
      ...templateParams,
      text: { ...templateParams.text, fontFamily: normalizedFont }
    };
  }

  const refined = templateParams.refinedFrame as RefinedFrameConfig | undefined;
  if (refined && (refined as RefinedFrameConfig & { canvasRatio?: unknown }).canvasRatio === undefined) {
    templateParams = {
      ...templateParams,
      refinedFrame: { ...refined, canvasRatio: "auto" }
    };
  }

  const gridFrame = normalizeGridFrame(templateParams.gridFrame);
  if (gridFrame) {
    templateParams = {
      ...templateParams,
      gridFrame
    };
  }

  const glassFrame = normalizeGlassFrame(templateParams.glassFrame);
  if (glassFrame) {
    templateParams = {
      ...templateParams,
      glassFrame
    };
  }

  const glassSillFrame = normalizeGlassSillFrame(templateParams.glassSillFrame);
  if (glassSillFrame) {
    templateParams = {
      ...templateParams,
      glassSillFrame
    };
  }

  const bandFrame = normalizeBandFrame(templateParams.bandFrame);
  if (bandFrame) {
    templateParams = {
      ...templateParams,
      bandFrame
    };
  }

  const flutedFrame = normalizeFlutedFrame(templateParams.flutedFrame);
  if (flutedFrame) {
    templateParams = {
      ...templateParams,
      flutedFrame
    };
  }

  if (templateParams === project.templateParams) {
    return project;
  }

  return {
    ...project,
    templateParams
  };
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

export function replaceProjectMedia(project: Project, asset: MediaAsset): Project {
  return {
    ...project,
    mediaAssetId: asset.id,
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

export function switchProjectTemplate(project: Project, templateId: string): Project {
  const template = getTemplateById(templateId);

  return {
    ...project,
    templateId: template.id,
    templateParams: structuredClone(template.baseParams),
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
