type SidebarProps = {
  templateListOpen: boolean;
  archiveOpen: boolean;
  onToggleTemplateList: () => void;
  onToggleArchive: () => void;
  projectsCount: number;
  mediaType?: string;
};

export function Sidebar({
  templateListOpen,
  archiveOpen,
  onToggleTemplateList,
  onToggleArchive,
  projectsCount,
  mediaType
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
          <button className="template-item is-active" type="button">
            FrameForge Signature
          </button>
        </div>
      </section>

      <section className={`panel control-panel ${archiveOpen ? "is-expanded" : "is-collapsed"}`}>
        <button className="panel-heading" type="button" onClick={onToggleArchive}>
          <span>Archive</span>
          <span className="panel-chevron" aria-hidden="true" />
        </button>
        <div className="panel-content">
          <Field label="Database" value="IndexedDB" />
          <Field label="Projects" value={`${projectsCount}`} />
          <Field label="Media" value={mediaType ?? "-"} />
        </div>
      </section>
      </div>

      <div className="brand">
        <h1>Library</h1>
        <p>Assets · Templates</p>
      </div>
      </div>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
