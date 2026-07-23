import type { Locale } from "./locale";
import { formatMessage, type MessageKey } from "./messages";

/** 兼容仍写入中文原文的状态串，以及 key / 带参数形式 */
const LEGACY_STATUS_TO_KEY: Record<string, MessageKey> = {
  "等待上传素材": "status.waiting",
  "项目已更新，尚未保存": "status.updated",
  "已恢复上次项目": "status.restored",
  "手机版仅支持图片": "status.mobileImagesOnly",
  "手机版仅支持图片，请重新上传": "status.mobileImagesOnlyReupload",
  "正在读取素材": "status.reading",
  "已替换素材": "status.replaced",
  "已创建当前项目": "status.created",
  "素材读取失败": "status.readFailed",
  "正在生成展示卡片": "status.generating",
  "生成完成": "status.generated",
  "已在当前模板内随机参数": "status.shuffled",
  "请先上传素材后再下载": "status.needMedia",
  "手机版仅支持下载图片": "status.mobileImageDownloadOnly",
  "正在导出 GIF...": "status.exportingGif",
  "长按 GIF 保存到相册": "status.longPressGif",
  "正在导出结果图...": "status.exportingImage",
  "长按图片保存到相册": "status.longPressImage",
  "已分享，可选择保存到相册": "status.imageShared",
  "结果图已保存": "status.imageSaved",
  "已取消保存": "status.saveCancelled",
  "导出失败": "status.exportFailed",
  "正在导出视频": "status.exportingVideo",
  "正在导出视频...": "status.exportingVideo",
  "结果视频已保存": "status.videoSaved",
  "已保存到画册": "status.savedToAlbum",
  "已保存至画册": "status.savedToAlbum"
};

export function translateStatus(
  status: string,
  locale: Locale,
  templateName: (id: string, fallback?: string) => string
): string {
  const key = LEGACY_STATUS_TO_KEY[status];
  if (key) {
    return formatMessage(locale, key);
  }

  const switched = /^已切换至「(.+)」$/.exec(status);
  if (switched) {
    return formatMessage(locale, "status.switched", { name: switched[1] });
  }

  const switchedEn = /^Switched to ["“](.+)["”]$/.exec(status);
  if (switchedEn) {
    return formatMessage(locale, "status.switched", { name: switchedEn[1] });
  }

  const gifProgress = /^正在导出 GIF (\d+)%\.\.\.$/.exec(status);
  if (gifProgress) {
    return formatMessage(locale, "status.exportingGifProgress", { progress: gifProgress[1] });
  }

  const gifShared = /^已分享 GIF（(.+)MB）$/.exec(status);
  if (gifShared) {
    return formatMessage(locale, "status.gifShared", { size: gifShared[1] });
  }

  const gifSaved = /^结果 GIF 已保存（(.+)MB）$/.exec(status);
  if (gifSaved) {
    return formatMessage(locale, "status.gifSaved", { size: gifSaved[1] });
  }

  if (status.startsWith("status.switched|")) {
    const id = status.slice("status.switched|".length);
    return formatMessage(locale, "status.switched", { name: templateName(id, id) });
  }

  if (status.startsWith("status.")) {
    const [rawKey, ...rest] = status.split("|");
    const messageKey = rawKey as MessageKey;
    const params: Record<string, string> = {};
    for (const part of rest) {
      const [k, v] = part.split("=");
      if (k && v !== undefined) {
        params[k] = v;
      }
    }
    return formatMessage(locale, messageKey, params);
  }

  return status;
}

export { LEGACY_STATUS_TO_KEY };
