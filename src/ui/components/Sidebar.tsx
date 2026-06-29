import { templateRegistry } from "../../templates/registry";

type SidebarProps = {
  templateListOpen: boolean;
  activeTemplateId?: string;
  onToggleTemplateList: () => void;
  onSelectTemplate: (templateId: string) => void;
};

export function Sidebar({
  templateListOpen,
  activeTemplateId,
  onToggleTemplateList,
  onSelectTemplate
}: SidebarProps) {
  return (
    <aside className="sidebar workspace-rail">
      <div className="workspace-rail-panel">
        <div className="workspace-rail-scroll">
          <section className={`panel template-panel ${templateListOpen ? "is-expanded" : "is-collapsed"}`}>
            <button className="panel-heading" type="button" onClick={onToggleTemplateList}>
              <span>模板画廊</span>
              <span className="panel-chevron" aria-hidden="true" />
            </button>
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

        <div className="brand workspace-rail-footer">
          <h1>Library</h1>
          <p>Assets · Templates</p>
        </div>
      </div>
    </aside>
  );
}
