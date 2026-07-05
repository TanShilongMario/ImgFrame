import { useEffect } from "react";

export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "frameforge-theme";

export function useAppTheme() {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
  }, []);

  return { theme: "dark" as const };
}
