import { useEffect, useMemo, useState } from "react";
import { createMediaAsset } from "../media/metadata";
import { createProjectFromMedia } from "../project/createProject";
import { mediaRepository, projectRepository, settingsRepository } from "../storage/repositories";
import type { MediaAsset, Project } from "../types";

export function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [mediaAsset, setMediaAsset] = useState<MediaAsset | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState("等待上传素材");
  const [isBusy, setIsBusy] = useState(false);
  const [templateListOpen, setTemplateListOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [frameOpen, setFrameOpen] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    void restoreLastSession();
  }, []);

  const mediaUrl = useMemo(() => {
    if (!mediaAsset) {
      return undefined;
    }

    return URL.createObjectURL(mediaAsset.blob);
  }, [mediaAsset]);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  async function restoreLastSession() {
    const [settings, projects] = await Promise.all([
      settingsRepository.getDefault(),
      projectRepository.list()
    ]);
    const sortedProjects = projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setRecentProjects(sortedProjects);

    if (!settings?.lastProjectId) {
      return;
    }

    const lastProject = sortedProjects.find((item) => item.id === settings.lastProjectId);
    if (!lastProject) {
      return;
    }

    setProject(lastProject);

    if (lastProject.mediaAssetId) {
      const asset = await mediaRepository.get(lastProject.mediaAssetId);
      setMediaAsset(asset ?? null);
    }

    setStatus("已恢复上次项目");
  }

  async function handleFileChange(file?: File) {
    if (!file) {
      return;
    }

    setIsBusy(true);
    setStatus("正在读取素材");

    try {
      const asset = await createMediaAsset(file);
      const nextProject = createProjectFromMedia(asset);
      await mediaRepository.save(asset);
      await projectRepository.save(nextProject);
      await settingsRepository.saveDefault({
        id: "default",
        lastProjectId: nextProject.id,
        preferredRatio: nextProject.templateParams.canvas.ratio,
        updatedAt: new Date().toISOString()
      });

      setMediaAsset(asset);
      setProject(nextProject);
      setRecentProjects((items) => [nextProject, ...items]);
      setStatus("已创建本地项目，并写入 IndexedDB");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "素材读取失败");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <h1>Image Card</h1>
            <p>High resolution frame</p>
          </div>
        </div>

        <label className="upload-button">
          <input
            accept="image/*,video/*"
            disabled={isBusy}
            type="file"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
          />
          上传素材
        </label>

        <section className={`panel template-panel ${templateListOpen ? "is-expanded" : "is-collapsed"}`}>
          <button
            className="panel-heading"
            type="button"
            onClick={() => setTemplateListOpen((value) => !value)}
          >
            <span>模板画廊</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="template-list">
            <button className="template-item is-active">Minimalist</button>
            <button className="template-item">Glass Card</button>
            <button className="template-item">Soft Layer</button>
          </div>
        </section>

        <section className={`panel history-panel ${historyOpen ? "is-expanded" : "is-collapsed"}`}>
          <button
            className="panel-heading"
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
          >
            <span>历史记录</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="history-list">
            {recentProjects.length === 0 ? (
              <div className="history-item is-empty">暂无本地项目</div>
            ) : (
              recentProjects.slice(0, 5).map((item) => (
                <button
                  className={`history-item${project?.id === item.id ? " is-active" : ""}`}
                  key={item.id}
                  type="button"
                  onClick={() => setProject(item)}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </section>

        <section className={`panel control-panel ${archiveOpen ? "is-expanded" : "is-collapsed"}`}>
          <button className="panel-heading" type="button" onClick={() => setArchiveOpen((value) => !value)}>
            <span>Archive</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="panel-content">
            <Field label="Database" value="IndexedDB" />
            <Field label="Projects" value={`${recentProjects.length}`} />
            <Field label="Media" value={mediaAsset?.type ?? "-"} />
          </div>
        </section>
      </aside>

      <section className="stage">
        {!project ? (
          <label className="hero-dropzone">
            <input
              accept="image/*,video/*"
              disabled={isBusy}
              type="file"
              onChange={(event) => void handleFileChange(event.target.files?.[0])}
            />
            <span className="upload-glyph" aria-hidden="true" />
            <span className="hero-action">上传图片</span>
          </label>
        ) : (
          <div className="canvas-preview" style={{ background: project.templateParams.canvas.background }}>
            <p className="poster-subtitle">{project.templateParams.text.subtitle}</p>
            <div
              className="media-card"
              style={{
                borderColor: project.templateParams.media.borderColor,
                borderRadius: project.templateParams.media.radius,
                borderWidth: project.templateParams.media.borderWidth,
                boxShadow: `0 ${project.templateParams.media.shadow.offsetY}px ${project.templateParams.media.shadow.blur}px rgba(24, 24, 24, ${project.templateParams.media.shadow.opacity})`
              }}
            >
              {mediaUrl && mediaAsset?.type === "image" ? (
                <img alt={mediaAsset.name} src={mediaUrl} />
              ) : mediaUrl ? (
                <video muted playsInline controls src={mediaUrl} />
              ) : (
                <div className="media-placeholder">素材预览</div>
              )}
            </div>
            <h2 style={{ color: project.templateParams.text.titleColor }}>
              {project.templateParams.text.title}
            </h2>
            <p className="credit">{project.templateParams.text.credit}</p>
          </div>
        )}
      </section>

      <aside className="inspector">
        <section className="inspector-summary">
          <h2>Design</h2>
          <p>{status}</p>
        </section>

        <section className={`panel control-panel ${frameOpen ? "is-expanded" : "is-collapsed"}`}>
          <button className="panel-heading" type="button" onClick={() => setFrameOpen((value) => !value)}>
            <span>Frame</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="panel-content">
            <Field label="Ratio" value={project?.templateParams.canvas.ratio ?? "-"} />
            <Field label="Background" value={project?.templateParams.canvas.background ?? "-"} />
            <Field label="Round Corner" value={`${project?.templateParams.media.radius ?? 0}`} />
            <Field label="Border" value={`${project?.templateParams.media.borderWidth ?? 0}`} />
          </div>
        </section>
      </aside>
    </main>
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
