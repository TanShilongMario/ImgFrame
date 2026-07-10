/** 编辑器舞台预览最大高度（需与 styles.css 保持一致） */
export const STAGE_PREVIEW_MAX_HEIGHT_PX = 760;
export const STAGE_PREVIEW_MAX_HEIGHT_VH = 72;
export const STAGE_PREVIEW_MAX_HEIGHT = `min(${STAGE_PREVIEW_MAX_HEIGHT_PX}px, ${STAGE_PREVIEW_MAX_HEIGHT_VH}vh)`;

export function getStageWidthPercent(ratioNumber: number): number {
  return Math.min(96, Math.max(58, 68 + (ratioNumber - 1) * 22));
}

export function getStagePreviewStyle(ratio: string, ratioNumber: number) {
  const widthLimitByHeight = `min(${Math.round(STAGE_PREVIEW_MAX_HEIGHT_PX * ratioNumber)}px, ${(STAGE_PREVIEW_MAX_HEIGHT_VH * ratioNumber).toFixed(3)}vh)`;
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
