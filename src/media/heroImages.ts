// 自动加载 src/media 下的所有图片，后续往目录里放新图即可，无需改代码。
const modules = import.meta.glob("./*.{png,jpg,jpeg,webp,avif}", { eager: true, import: "default" }) as Record<string, string>;

export const heroImageUrls: string[] = Object.values(modules).sort((a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true })
);

export function pickHeroImage(exclude?: string): string {
  if (heroImageUrls.length === 0) {
    return "";
  }

  if (heroImageUrls.length === 1) {
    return heroImageUrls[0];
  }

  const candidates = exclude ? heroImageUrls.filter((url) => url !== exclude) : heroImageUrls;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? heroImageUrls[0];
}
