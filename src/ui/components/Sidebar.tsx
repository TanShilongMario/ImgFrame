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
              {templateRegistry.map((template) => (
                <button
                  key={template.id}
                  className={`template-item${activeTemplateId === template.id ? " is-active" : ""}`}
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
