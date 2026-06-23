import { useEffect, useMemo, useRef, useState } from "react";
import { buildGalleryBatch, getDemoPreset, type GalleryEntry } from "../gallery/catalog";
import { useOrchestratedNavigation } from "../hooks/useOrchestratedNavigation";
import { createMediaAsset } from "../media/metadata";
import {
  applyGalleryToProject,
  createProjectFromGallery,
  createProjectFromMedia,
  shuffleProjectParams
} from "../project/createProject";
import { mediaRepository, projectRepository, settingsRepository } from "../storage/repositories";
import type { MediaAsset, Project } from "../types";
import { EditorSection } from "./EditorSection";
import { GallerySection } from "./GallerySection";
import { HeroPage, type CeremonyPhase } from "./HeroPage";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeSection, editorRailsVisible, navigateTo } = useOrchestratedNavigation(scrollRef);
  const showEditorRails = editorRailsVisible && activeSection === "editor";
  const [project, setProject] = useState<Project | null>(null);
  const [mediaAsset, setMediaAsset] = useState<MediaAsset | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState("等待上传素材");
  const [isBusy, setIsBusy] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<CeremonyPhase>("idle");
  const [activeDemoId, setActiveDemoId] = useState<string | undefined>();
  const [galleryBatchSeed, setGalleryBatchSeed] = useState(() => Date.now());
  const [templateListOpen, setTemplateListOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [frameOpen, setFrameOpen] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const galleryEntries = useMemo(() => buildGalleryBatch(galleryBatchSeed), [galleryBatchSeed]);

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

  const editorDemoFill = useMemo(() => {
    if (mediaAsset || !activeDemoId) {
      return undefined;
    }

    return getDemoPreset(activeDemoId).fill;
  }, [activeDemoId, mediaAsset]);

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

  async function saveProjectToAlbum(nextProject: Project) {
    await projectRepository.save(nextProject);
    await settingsRepository.saveDefault({
      id: "default",
      lastProjectId: nextProject.id,
      preferredRatio: nextProject.templateParams.canvas.ratio,
      updatedAt: new Date().toISOString()
    });

    setProject(nextProject);
    setRecentProjects((items) => [nextProject, ...items.filter((item) => item.id !== nextProject.id)]);
  }

  function getNextFrameName() {
    const usedNumbers = recentProjects
      .map((item) => /^Frame(\d+)$/.exec(item.name)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(Number);
    const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : recentProjects.length + 1;

    return `Frame${nextNumber}`;
  }

  async function handleSaveToAlbum() {
    if (!project) {
      return;
    }

    const isAlreadySaved = recentProjects.some((item) => item.id === project.id);
    await saveProjectToAlbum({
      ...project,
      name: isAlreadySaved ? project.name : getNextFrameName(),
      updatedAt: new Date().toISOString()
    });
    setStatus("已保存至画册");
  }

  async function handleRenameProject(projectId: string, name: string) {
    const nextName = name.trim().slice(0, 32);
    const target = recentProjects.find((item) => item.id === projectId);

    if (!target || !nextName || target.name === nextName) {
      return;
    }

    const renamedProject = {
      ...target,
      name: nextName,
      updatedAt: new Date().toISOString()
    };

    await projectRepository.save(renamedProject);
    setRecentProjects((items) => items.map((item) => (item.id === projectId ? renamedProject : item)));

    if (project?.id === projectId) {
      setProject((current) => (current ? { ...current, name: nextName } : current));
    }

    setStatus(`已重命名为 ${nextName}`);
  }

  async function loadProject(selected: Project) {
    setProject(selected);

    if (selected.mediaAssetId) {
      const asset = await mediaRepository.get(selected.mediaAssetId);
      setMediaAsset(asset ?? null);
      setActiveDemoId(undefined);
    } else {
      setMediaAsset(null);
    }

    setStatus(`已打开 ${selected.name}`);
    void navigateTo("editor");
  }

  async function ingestFile(file: File, options?: { ceremonial?: boolean }) {
    setIsBusy(true);

    if (options?.ceremonial) {
      setCeremonyPhase("reading");
      setStatus("正在读取素材");
    } else {
      setStatus("正在读取素材");
    }

    try {
      if (options?.ceremonial) {
        await wait(700);
      }

      const asset = await createMediaAsset(file);

      if (options?.ceremonial) {
        setCeremonyPhase("transforming");
        setStatus("正在生成展示卡片");
        await wait(900);
      }

      const nextProject = createProjectFromMedia(asset);
      await mediaRepository.save(asset);
      setProject(nextProject);
      setMediaAsset(asset);
      setActiveDemoId(undefined);
      setStatus(options?.ceremonial ? "生成完成，进入编辑器" : "已创建当前项目");

      if (options?.ceremonial) {
        setCeremonyPhase("done");
        await wait(500);
        await navigateTo("editor");
        setCeremonyPhase("idle");
      }
    } catch (error) {
      setCeremonyPhase("idle");
      setStatus(error instanceof Error ? error.message : "素材读取失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload(file?: File, options?: { ceremonial?: boolean; fromHero?: boolean }) {
    if (!file) {
      return;
    }

    const ceremonial = options?.ceremonial ?? options?.fromHero ?? false;
    await ingestFile(file, { ceremonial });
  }

  function updateProject(nextProject: Project) {
    setProject(nextProject);
    setStatus("项目已更新，尚未保存");
  }

  function handleShuffleParams() {
    if (!project) {
      return;
    }

    updateProject(shuffleProjectParams(project));
    setStatus("已在当前模板内随机参数");
  }

  function handleDownloadResult() {
    if (!project) {
      return;
    }

    setStatus("下载结果图功能待接入高清导出");
  }

  async function handleApplyGalleryEntry(entry: GalleryEntry) {
    setActiveDemoId(entry.demoId);

    const nextProject = project
      ? applyGalleryToProject(project, entry)
      : createProjectFromGallery(entry);

    setProject(nextProject);
    setStatus(`已套用 ${entry.label}`);
    void navigateTo("editor");
  }

  function handleRefreshGalleryBatch() {
    setGalleryBatchSeed(Date.now());
  }

  return (
    <div className="scroll-app" ref={scrollRef}>
      <section className="scroll-section hero-section" data-section="hero">
        <HeroPage
          ceremonyPhase={ceremonyPhase}
          isBusy={isBusy}
          onScrollDown={() => navigateTo("editor")}
          onUpload={(file) => void handleUpload(file, { ceremonial: true, fromHero: true })}
        />
      </section>

      <section className="scroll-section editor-section" data-section="editor">
        <EditorSection
          archiveOpen={archiveOpen}
          demoFill={editorDemoFill}
          frameOpen={frameOpen}
          historyOpen={historyOpen}
          isBusy={isBusy}
          editorRailsVisible={showEditorRails}
          mediaAsset={mediaAsset}
          mediaUrl={mediaUrl}
          project={project}
          recentProjects={recentProjects}
          status={status}
          templateListOpen={templateListOpen}
          onNavigate={navigateTo}
          onSelectProject={(item) => void loadProject(item)}
          onDownloadResult={handleDownloadResult}
          onSaveToAlbum={() => void handleSaveToAlbum()}
          onShuffleParams={handleShuffleParams}
          onToggleArchive={() => setArchiveOpen((value) => !value)}
          onToggleFrame={() => setFrameOpen((value) => !value)}
          onToggleHistory={() => setHistoryOpen((value) => !value)}
          onToggleTemplateList={() => setTemplateListOpen((value) => !value)}
          onRenameProject={(projectId, name) => void handleRenameProject(projectId, name)}
          onUpdateTemplateParams={(params) => {
            if (!project) {
              return;
            }

            updateProject({
              ...project,
              templateParams: params,
              updatedAt: new Date().toISOString()
            });
          }}
          onUpload={(file) => void handleUpload(file)}
        />
      </section>

      <section className="scroll-section gallery-section" data-section="gallery">
        <GallerySection
          entries={galleryEntries}
          onApplyEntry={(entry) => void handleApplyGalleryEntry(entry)}
          onNavigate={navigateTo}
          onRefreshBatch={handleRefreshGalleryBatch}
        />
      </section>
    </div>
  );
}
