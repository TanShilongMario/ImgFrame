import type { TemplateParams } from "../types";
import { templateRegistry } from "../templates/registry";
import { randomizeTemplateParams } from "../templates/randomize";
import { heroImageUrls } from "../media/heroImages";

export type GalleryEntry = {
  id: string;
  label: string;
  templateId: string;
  templateName: string;
  mediaUrl: string;
  params: TemplateParams;
};

function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function shuffleSeeded<T>(items: T[], rand: () => number): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export const GALLERY_BATCH_SIZE = 24;

export function buildGalleryBatch(seed = Date.now()): GalleryEntry[] {
  const rand = seededRandom(seed);
  const images = heroImageUrls;

  if (images.length === 0) {
    return [];
  }

  // 把图片均匀分配到 24 个槽位，避免同一张图连续出现或重复过多
  const imageSlots: string[] = [];
  const shuffledImages = shuffleSeeded(images, rand);

  for (let index = 0; index < GALLERY_BATCH_SIZE; index += 1) {
    imageSlots.push(shuffledImages[index % shuffledImages.length]);
  }

  // 再对槽位做一次轻洗牌，让相邻位置不会完全是同一张图
  for (let index = 0; index < imageSlots.length - 1; index += 1) {
    if (imageSlots[index] === imageSlots[index + 1]) {
      const nextDifferent = imageSlots.findIndex((url, offset) => offset > index + 1 && url !== imageSlots[index]);

      if (nextDifferent !== -1) {
        [imageSlots[index + 1], imageSlots[nextDifferent]] = [imageSlots[nextDifferent], imageSlots[index + 1]];
      }
    }
  }

  const shuffledTemplates = shuffleSeeded(templateRegistry, rand);
  const entries: GalleryEntry[] = [];

  for (let index = 0; index < GALLERY_BATCH_SIZE; index += 1) {
    const mediaUrl = imageSlots[index];
    const template = shuffledTemplates[index % shuffledTemplates.length];
    const params = randomizeTemplateParams(template.baseParams);
    params.text = {
      ...params.text,
      credit: template.name,
      title: template.name
    };

    entries.push({
      id: `batch-${seed}-${index}`,
      label: template.name,
      templateId: template.id,
      templateName: template.name,
      mediaUrl,
      params
    });
  }

  return entries;
}

export function getGalleryEntryLabel(entry: GalleryEntry): string {
  return entry.label;
}
