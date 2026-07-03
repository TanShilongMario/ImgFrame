/**
 * 编辑器滑块 / 控件驱动的预览层统一过渡。
 *
 * 用法：凡 inline style 会随 templateParams 变化的 DOM，加上此类名即可与题序模板同款「惯性」。
 * 新模板在 CardPreview 子组件里，给所有参数绑定层挂 {@link combinePreviewSurface}。
 */
export const PREVIEW_PARAM_SURFACE_CLASS = "preview-param-surface";

export const PREVIEW_PARAM_DURATION_MS = 420;

/** 合并预览参数过渡类与模板专属 class */
export function combinePreviewSurface(...classes: (string | false | undefined)[]): string {
  return [PREVIEW_PARAM_SURFACE_CLASS, ...classes.filter(Boolean)].join(" ");
}
