import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type AppSection = "hero" | "editor" | "gallery" | "album";

export const SCROLL_MS = 720;

const sections: AppSection[] = ["hero", "editor", "gallery", "album"];
const innerScrollSelectors = [".gallery-scroll-container", ".album-scroll-container", ".workspace-rail-scroll"];

function findInnerScrollable(target: EventTarget | null, boundary: Element): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  for (const selector of innerScrollSelectors) {
    const element = target.closest(selector);
    if (element instanceof HTMLElement && boundary.contains(element) && element.scrollHeight > element.clientHeight + 1) {
      return element;
    }
  }

  return null;
}

function isAtScrollEdge(element: HTMLElement, direction: 1 | -1): boolean {
  if (direction > 0) {
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
  }

  return element.scrollTop <= 0;
}

export function useOrchestratedNavigation(containerRef: RefObject<HTMLDivElement | null>) {
  const [activeSection, setActiveSection] = useState<AppSection>("hero");
  const isAnimatingRef = useRef(false);
  const activeSectionRef = useRef<AppSection>("hero");

  const scrollToSectionRaw = useCallback(async (section: AppSection) => {
    const container = containerRef.current;
    const target = container?.querySelector(`[data-section="${section}"]`);

    if (!target || !container) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    await new Promise<void>((resolve) => {
      const finish = () => resolve();
      container.addEventListener("scrollend", finish, { once: true });
      window.setTimeout(finish, SCROLL_MS);
    });

    activeSectionRef.current = section;
    setActiveSection(section);
  }, [containerRef]);

  const navigateTo = useCallback(async (target: AppSection) => {
    if (isAnimatingRef.current) {
      return;
    }

    const current = activeSectionRef.current;
    if (current === target) {
      return;
    }

    isAnimatingRef.current = true;

    try {
      await scrollToSectionRaw(target);
    } finally {
      isAnimatingRef.current = false;
    }
  }, [scrollToSectionRaw]);

  const stepSection = useCallback((direction: 1 | -1) => {
    const current = activeSectionRef.current;

    // Gallery 与 Album 之间不允许通过滚动/翻页互达，只能走导航按钮
    if (current === "gallery" && direction > 0) {
      return;
    }
    if (current === "album" && direction < 0) {
      return;
    }

    const currentIndex = sections.indexOf(current);
    const nextIndex = Math.min(sections.length - 1, Math.max(0, currentIndex + direction));

    if (nextIndex === currentIndex) {
      return;
    }

    void navigateTo(sections[nextIndex]);
  }, [navigateTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      const innerScrollable = findInnerScrollable(event.target, container);

      if (innerScrollable) {
        if (!isAtScrollEdge(innerScrollable, direction)) {
          return;
        }

        if (innerScrollable.classList.contains("gallery-scroll-container") ||
            innerScrollable.classList.contains("album-scroll-container")) {
          if (direction < 0) {
            event.preventDefault();
            const currentIndex = sections.indexOf(activeSectionRef.current);
            // If we are in album, don't scroll up to gallery
            if (activeSectionRef.current === "album") {
              return;
            }
            const prevIndex = Math.max(0, currentIndex - 1);
            void navigateTo(sections[prevIndex]);
          }

          return;
        }

        if (innerScrollable.classList.contains("workspace-rail-scroll")) {
          return;
        }
      }

      event.preventDefault();
      stepSection(direction);
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef, navigateTo, stepSection]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isAnimatingRef.current) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          target.closest(innerScrollSelectors.join(",")))
      ) {
        return;
      }

      if (event.key === "PageDown" || event.key === "ArrowDown") {
        event.preventDefault();
        stepSection(1);
      } else if (event.key === "PageUp" || event.key === "ArrowUp") {
        event.preventDefault();
        stepSection(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stepSection]);

  return { activeSection, navigateTo };
}
