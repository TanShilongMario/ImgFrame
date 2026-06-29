export const CSS_REFERENCE_WIDTH = 720;

/** 将 @720 设计稿 px 换算到目标画布/预览宽度 */
export function cssPx(value: number, canvasWidth: number, referenceWidth = CSS_REFERENCE_WIDTH): number {
  return value * (canvasWidth / referenceWidth);
}
