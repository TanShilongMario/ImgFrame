import { Image as ImageIcon } from "lucide-react";
import { useLocale } from "../../i18n/LocaleContext";
import { templateRegistry } from "../../templates/registry";

type MobileTemplateRailProps = {
  activeTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
};

export function MobileTemplateRail({ activeTemplateId, onSelectTemplate }: MobileTemplateRailProps) {
  const { t, templateName } = useLocale();

  return (
    <div className="mobile-template-rail" role="listbox" aria-label={t("dock.templates")}>
      {templateRegistry.map((template) => {
        const imageOnly = template.supportsVideo === false;
        const name = templateName(template.id, template.name);

        return (
          <button
            key={template.id}
            aria-selected={activeTemplateId === template.id}
            className={`mobile-template-chip${activeTemplateId === template.id ? " is-active" : ""}`}
            role="option"
            title={imageOnly ? `${name}（${t("template.imageOnly")}）` : name}
            type="button"
            onClick={() => onSelectTemplate(template.id)}
          >
            <span>{name}</span>
            {imageOnly ? (
              <ImageIcon aria-hidden="true" className="mobile-template-chip-badge" size={12} strokeWidth={2.2} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
