/** 编辑器舞台预览最大高度（需与 styles.css 保持一致） */
export const STAGE_PREVIEW_MAX_HEIGHT = "min(640px, 52vh)";

export function getStageWidthPercent(ratioNumber: number): number {
  return Math.min(92, Math.max(52, 62 + (ratioNumber - 1) * 24));
}

export function getStagePreviewStyle(ratio: string, ratioNumber: number) {
  const widthLimitByHeight = `min(${Math.round(640 * ratioNumber)}px, ${(52 * ratioNumber).toFixed(3)}vh)`;
  const width = ratioNumber < 1
    ? `min(100%, ${widthLimitByHeight})`
    : `min(${getStageWidthPercent(ratioNumber)}%, ${widthLimitByHeight})`;

  return {
    aspectRatio: ratio,
    height: "auto",
    maxWidth: "100%",
    width
  } as const;
}
