import { useEffect, useState } from "react";

// 检测图片的真实宽高比，用于精调模板跟随原图比例出图。
export function useImageAspectRatio(url?: string): number | undefined {
  const [ratio, setRatio] = useState<number | undefined>();

  useEffect(() => {
    if (!url) {
      setRatio(undefined);
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) {
        return;
      }

      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };

    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return ratio;
}
