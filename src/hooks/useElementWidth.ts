import { useEffect, useState, type RefObject } from "react";

/** 监听元素宽度，用于按参考宽等比缩放圆角等 px 值（避免 % 圆角在非正方形上变椭圆）。 */
export function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const update = () => {
      setWidth(node.getBoundingClientRect().width);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}
