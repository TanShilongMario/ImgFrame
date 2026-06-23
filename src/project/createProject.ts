import { createId } from "../utils/id";
import type { MediaAsset, Project } from "../types";
import { randomizeFull, randomizeWithinTemplate } from "../templates/randomize";
import { getTemplateById } from "../templates/registry";

export function createProjectFromMedia(asset: MediaAsset): Project {
  const now = new Date().toISOString();
  const starterTemplate = getTemplateById("frameforge-signature");

  return {
    id: createId("project"),
    name: asset.name.replace(/\.[^.]+$/, "") || "未命名项目",
    mediaAssetId: asset.id,
    templateId: starterTemplate.id,
    templateParams: structuredClone(starterTemplate.baseParams),
    createdAt: now,
    updatedAt: now
  };
}

export function createProjectFromGallery(entry: {
  label: string;
  templateId: string;
  params: Project["templateParams"];
  demoId: string;
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
