import { useEffect, useState } from "react";

type MediaKind = "image" | "video";

/**
 * 检测图片/视频真实宽高比，用于「随原图」画布比例。
 * 必须按 mediaType 分流：视频切勿先走 Image()，否则会整文件解码导致严重卡顿。
 */
export function useImageAspectRatio(url?: string, mediaType: MediaKind = "image"): number | undefined {
  const [ratio, setRatio] = useState<number | undefined>();

  useEffect(() => {
    if (!url) {
      setRatio(undefined);
      return;
    }

    let cancelled = false;

    if (mediaType === "video") {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        if (cancelled) {
          return;
        }

        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setRatio(video.videoWidth / video.videoHeight);
        }
      };

      video.onerror = () => {
        if (!cancelled) {
          setRatio(undefined);
        }
      };

      video.src = url;

      return () => {
        cancelled = true;
        video.onloadedmetadata = null;
        video.onerror = null;
        video.removeAttribute("src");
        video.load();
      };
    }

    const img = new Image();

    img.onload = () => {
      if (cancelled) {
        return;
      }

      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setRatio(undefined);
      }
    };

    img.src = url;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [url, mediaType]);

  return ratio;
}
