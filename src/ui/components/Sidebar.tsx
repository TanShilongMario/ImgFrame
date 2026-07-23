import { Image as ImageIcon } from "lucide-react";
import { useLocale } from "../../i18n/LocaleContext";
import { templateRegistry } from "../../templates/registry";

type SidebarProps = {
  activeTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
};

export function Sidebar({ activeTemplateId, onSelectTemplate }: SidebarProps) {
  const { t, templateName } = useLocale();

  return (
    <aside className="sidebar workspace-rail">
      <div className="workspace-rail-panel">
        <div className="workspace-rail-scroll">
          <section className="panel template-panel">
            <div className="panel-heading panel-heading-static">
              <span>{t("sidebar.gallery")}</span>
            </div>
            <div className="template-list">
              {templateRegistry.map((template) => {
                const imageOnly = template.supportsVideo === false;
                const name = templateName(template.id, template.name);

                return (
                  <button
                    key={template.id}
                    className={`template-item${activeTemplateId === template.id ? " is-active" : ""}`}
                    title={imageOnly ? `${name}（${t("template.imageOnly")}）` : name}
                    type="button"
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    <span className="template-item-label">{name}</span>
                    {imageOnly ? (
                      <span
                        aria-label={t("template.imageOnly")}
                        className="template-item-badge"
                        title={t("template.imageOnly")}
                      >
                        <ImageIcon aria-hidden="true" size={13} strokeWidth={2.2} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
