import type { GridCellEffectEntry, GridFrameConfig } from "../types";

export const GRID_LINE_LIMITS = {
  lineX1: { min: 18, max: 42 },
  lineX2: { min: 58, max: 82 },
  lineY1: { min: 22, max: 48 },
  lineY2: { min: 62, max: 88 },
  titleSize: { min: 14, max: 48 },
  minGap: 12
} as const;

/** 内部分割线与外框线宽（px，不可调） */
export const GRID_LINE_WIDTH_PX = 2;

export type GridCellRect = {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function clampGridFrame(frame: GridFrameConfig): GridFrameConfig {
  const lineX1 = Math.min(
    Math.max(frame.lineX1, GRID_LINE_LIMITS.lineX1.min),
    GRID_LINE_LIMITS.lineX1.max
  );
  const lineX2 = Math.min(
    Math.max(frame.lineX2, GRID_LINE_LIMITS.lineX2.min, lineX1 + GRID_LINE_LIMITS.minGap),
    GRID_LINE_LIMITS.lineX2.max
  );
  const lineY1 = Math.min(
    Math.max(frame.lineY1, GRID_LINE_LIMITS.lineY1.min),
    GRID_LINE_LIMITS.lineY1.max
  );
  const lineY2 = Math.min(
    Math.max(frame.lineY2, GRID_LINE_LIMITS.lineY2.min, lineY1 + GRID_LINE_LIMITS.minGap),
    GRID_LINE_LIMITS.lineY2.max
  );

  return {
    ...frame,
    lineX1,
    lineX2,
    lineY1,
    lineY2,
    titleSize: Math.min(Math.max(frame.titleSize ?? 28, GRID_LINE_LIMITS.titleSize.min), GRID_LINE_LIMITS.titleSize.max),
    seed: Math.max(0, Math.round(frame.seed))
  };
}

export function getGridCellRects(frame: GridFrameConfig): GridCellRect[] {
  const normalized = clampGridFrame(frame);
  const columns = [0, normalized.lineX1, normalized.lineX2, 100];
  const rows = [0, normalized.lineY1, normalized.lineY2, 100];
  const cells: GridCellRect[] = [];

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      cells.push({
        index: row * 3 + column,
        left: columns[column],
        top: rows[row],
        width: columns[column + 1] - columns[column],
        height: rows[row + 1] - rows[row]
      });
    }
  }

  return cells;
}

function randomStrength(rand: () => number, effect: "darken" | "lighten"): number {
  if (effect === "darken") {
    return Number((0.16 + rand() * 0.44).toFixed(3));
  }

  return Number((0.14 + rand() * 0.4).toFixed(3));
}

export function deriveCellEffectsFromSeed(seed: number): GridCellEffectEntry[] {
  const rand = seededRandom(seed);
  const effects: GridCellEffectEntry[] = Array.from({ length: 9 }, () => ({
    effect: "none",
    strength: 0
  }));
  const affectedCount = 3 + Math.floor(rand() * 3);
  const indices = Array.from({ length: 9 }, (_, index) => index);

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }

  for (let index = 0; index < affectedCount; index += 1) {
    const effect = rand() > 0.5 ? "darken" : "lighten";
    effects[indices[index]] = {
      effect,
      strength: randomStrength(rand, effect)
    };
  }

  return effects;
}

export function normalizeCellEffects(raw: unknown): GridCellEffectEntry[] {
  if (!Array.isArray(raw) || raw.length !== 9) {
    return deriveCellEffectsFromSeed(42);
  }

  return raw.map((entry) => {
    if (typeof entry === "string") {
      if (entry === "none") {
        return { effect: "none" as const, strength: 0 };
      }

      if (entry === "darken" || entry === "lighten") {
        const strength = entry === "darken" ? 0.34 : 0.3;
        return { effect: entry, strength };
      }

      return { effect: "none" as const, strength: 0 };
    }

    if (entry && typeof entry === "object" && "effect" in entry) {
      const effect = entry.effect as GridCellEffectEntry["effect"];
      if (effect === "none") {
        return { effect: "none", strength: 0 };
      }

      const strength = typeof entry.strength === "number" ? entry.strength : 0.32;
      return {
        effect,
        strength: Math.min(0.72, Math.max(0.12, strength))
      };
    }

    return { effect: "none", strength: 0 };
  });
}

export function withDerivedGridEffects(frame: GridFrameConfig): GridFrameConfig {
  const normalized = clampGridFrame(frame);
  return {
    ...normalized,
    cellEffects: deriveCellEffectsFromSeed(normalized.seed)
  };
}

export function getGridLineColor(tone: GridFrameConfig["lineTone"]): string {
  return tone === "white" ? "#ffffff" : "#111111";
}

export function getGridTitleColor(tone: GridFrameConfig["lineTone"]): string {
  return tone === "white" ? "#ffffff" : "#111111";
}

export function getCellOverlayRgba(entry: GridCellEffectEntry): string | null {
  if (entry.effect === "none" || entry.strength <= 0) {
    return null;
  }

  if (entry.effect === "darken") {
    const gray = Math.round(70 + entry.strength * 90);
    return `rgba(${gray}, ${gray}, ${gray}, ${entry.strength})`;
  }

  const tone = Math.round(228 + entry.strength * 24);
  return `rgba(${tone}, ${tone}, ${tone}, ${entry.strength})`;
}
