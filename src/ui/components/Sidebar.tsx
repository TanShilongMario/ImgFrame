import { Image as ImageIcon } from "lucide-react";
import { templateRegistry } from "../../templates/registry";

type SidebarProps = {
  activeTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
};

export function Sidebar({ activeTemplateId, onSelectTemplate }: SidebarProps) {
  return (
    <aside className="sidebar workspace-rail">
      <div className="workspace-rail-panel">
        <div className="workspace-rail-scroll">
          <section className="panel template-panel">
            <div className="panel-heading panel-heading-static">
              <span>模板画廊</span>
            </div>
            <div className="template-list">
              {templateRegistry.map((template) => {
                const imageOnly = template.supportsVideo === false;

                return (
                  <button
                    key={template.id}
                    className={`template-item${activeTemplateId === template.id ? " is-active" : ""}`}
                    title={imageOnly ? `${template.name}（建议使用图片）` : template.name}
                    type="button"
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    <span className="template-item-label">{template.name}</span>
                    {imageOnly ? (
                      <span aria-label="建议使用图片" className="template-item-badge" title="建议使用图片">
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
