import { useLocale } from "../../i18n/LocaleContext";

type LanguageToggleProps = {
  /** mobile：左上角浮层；header：桌面导航内 */
  variant?: "mobile" | "header";
};

/** 黑白对位切换：当前语言实心，另一侧空心 */
export function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
  const { locale, toggleLocale, t } = useLocale();
  const nextIsEn = locale === "zh";

  return (
    <button
      aria-label={nextIsEn ? t("lang.switchToEn") : t("lang.switchToZh")}
      className={`language-toggle language-toggle-${variant}`}
      title={nextIsEn ? t("lang.switchToEn") : t("lang.switchToZh")}
      type="button"
      onClick={toggleLocale}
    >
      <span className={`language-toggle-opt${locale === "zh" ? " is-active" : ""}`}>{t("lang.zh")}</span>
      <span className="language-toggle-divider" aria-hidden="true" />
      <span className={`language-toggle-opt${locale === "en" ? " is-active" : ""}`}>{t("lang.en")}</span>
    </button>
  );
}
