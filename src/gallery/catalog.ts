import type { TemplateParams } from "../types";
import { getTemplateById, templateRegistry } from "../templates/registry";
import { randomizeTemplateParams } from "../templates/randomize";

export type DemoPreset = {
  id: string;
  label: string;
  fill: string;
};

export type GalleryEntry = {
  id: string;
  label: string;
  templateId: string;
  templateName: string;
  demoId: string;
  params: TemplateParams;
};

export const demoPresets: DemoPreset[] = [
  { id: "demo-01", label: "Rose Dawn", fill: "linear-gradient(145deg, #f4c4bc 0%, #e8a598 48%, #c9786a 100%)" },
  { id: "demo-02", label: "Forest Mist", fill: "linear-gradient(160deg, #c8ddd2 0%, #8fb09a 52%, #4f7360 100%)" },
  { id: "demo-03", label: "Sand Stone", fill: "linear-gradient(135deg, #f0e8dc 0%, #d8c4aa 50%, #b89a78 100%)" },
  { id: "demo-04", label: "Night Ink", fill: "linear-gradient(155deg, #3a3a40 0%, #222228 55%, #101014 100%)" },
  { id: "demo-05", label: "Sky Wash", fill: "linear-gradient(140deg, #dce8f2 0%, #a8c4dc 45%, #6a94b8 100%)" },
  { id: "demo-06", label: "Clay Warm", fill: "linear-gradient(150deg, #efd8c8 0%, #d9a88c 48%, #b87458 100%)" },
  { id: "demo-07", label: "Sage Calm", fill: "linear-gradient(145deg, #e4ece6 0%, #b8cfc0 50%, #7fa892 100%)" },
  { id: "demo-08", label: "Lilac Haze", fill: "linear-gradient(150deg, #ebe4f0 0%, #c8b4d8 48%, #9580b0 100%)" },
  { id: "demo-09", label: "Copper Glow", fill: "linear-gradient(140deg, #f2ddd0 0%, #d8a888 50%, #b07850 100%)" },
  { id: "demo-10", label: "Mono Paper", fill: "linear-gradient(160deg, #f7f5f1 0%, #e8e4dc 52%, #ccc8c0 100%)" }
];

function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function buildGalleryCatalog(): GalleryEntry[] {
  const entries: GalleryEntry[] = [];

  for (const demo of demoPresets) {
    for (const template of templateRegistry) {
      const params = randomizeTemplateParams(template.baseParams);

      entries.push({
        id: `${demo.id}-${template.id}`,
        label: `${demo.label} · ${template.name}`,
        templateId: template.id,
        templateName: template.name,
        demoId: demo.id,
        params
      });
    }
  }

  return entries;
}

export function buildGalleryBatch(seed = Date.now()): GalleryEntry[] {
  const rand = seededRandom(seed);
  const batchSize = 28 + Math.floor(rand() * 9);
  const entries: GalleryEntry[] = [];

  for (let index = 0; index < batchSize; index += 1) {
    const demo = demoPresets[Math.floor(rand() * demoPresets.length)];
    const template = templateRegistry[Math.floor(rand() * templateRegistry.length)];
    const params = randomizeTemplateParams(template.baseParams);

    entries.push({
      id: `batch-${seed}-${index}`,
      label: `${demo.label} · ${template.name}`,
      templateId: template.id,
      templateName: template.name,
      demoId: demo.id,
      params
    });
  }

  return entries;
}

export function getDemoPreset(id: string): DemoPreset {
  return demoPresets.find((item) => item.id === id) ?? demoPresets[0];
}

export function getHeroCarouselSlides() {
  return demoPresets.slice(0, 4).map((demo, index) => {
    const template = templateRegistry[index % templateRegistry.length];
    const params = template.baseParams;

    return {
      id: demo.id,
      demo,
      templateId: template.id,
      templateName: template.name,
      params
    };
  });
}

export function getGalleryEntryLabel(entry: GalleryEntry): string {
  const template = getTemplateById(entry.templateId);
  return `${entry.label.split(" · ")[0]} · ${template.name}`;
}
