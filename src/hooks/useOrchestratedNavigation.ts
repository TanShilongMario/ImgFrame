import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type AppSection = "hero" | "editor" | "gallery" | "album";

export const SCROLL_MS = 720;
export const RAIL_MS = 480;

const sections: AppSection[] = ["hero", "editor", "gallery", "album"];
const innerScrollSelectors = [".gallery-scroll-container", ".album-scroll-container", ".workspace-rail-scroll"];

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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
  const [editorRailsVisible, setEditorRailsVisible] = useState(false);
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
      if (current === "editor" && target !== "editor") {
        setEditorRailsVisible(false);
        await wait(RAIL_MS);
        await scrollToSectionRaw(target);
        return;
      }

      if (target === "editor" && current !== "editor") {
        setEditorRailsVisible(false);
        await scrollToSectionRaw("editor");
        setEditorRailsVisible(true);
        await wait(RAIL_MS);
        return;
      }

      setEditorRailsVisible(false);
      await scrollToSectionRaw(target);
    } finally {
      isAnimatingRef.current = false;
    }
  }, [scrollToSectionRaw]);

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

      const currentIndex = sections.indexOf(activeSectionRef.current);
      
      // Prevent scrolling down from gallery to album, and scrolling up from album to gallery
      if (activeSectionRef.current === "gallery" && direction > 0) {
        return;
      }
      if (activeSectionRef.current === "album" && direction < 0) {
        return;
      }

      const nextIndex = Math.min(sections.length - 1, Math.max(0, currentIndex + direction));

      if (nextIndex === currentIndex) {
        return;
      }

      void navigateTo(sections[nextIndex]);
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef, navigateTo]);

  return { activeSection, editorRailsVisible, navigateTo };
}
