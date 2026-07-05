import { useEffect, useMemo, useRef, useState } from "react";
import { buildGalleryBatch, type GalleryEntry } from "../gallery/catalog";
import { useAppTheme } from "../hooks/useAppTheme";
import { useOrchestratedNavigation } from "../hooks/useOrchestratedNavigation";
import { analyzeImageFile } from "../media/analyzeImage";
import { createMediaAsset } from "../media/metadata";
import {
  applyGalleryToProject,
  createProjectFromGallery,
  createProjectFromMedia,
  normalizeProject,
  replaceProjectMedia,
  shuffleProjectParams,
  switchProjectTemplate
} from "../project/createProject";
import { getTemplateById } from "../templates/registry";
import { applyMagicModeParams } from "../project/magicMode";
import { mediaRepository, projectRepository, settingsRepository } from "../storage/repositories";
import type { MediaAsset, Project } from "../types";
import { createId } from "../utils/id";
import { downloadBlob, sanitizeFilename } from "../export/canvasUtils";
import { exportProjectImage } from "../export/exportProjectImage";
import { exportProjectVideo } from "../export/exportProjectVideo";
import { preloadFfmpeg } from "../export/transcodeToMp4";
import { AlbumSection } from "./AlbumSection";
import { EditorSection } from "./EditorSection";
import { GallerySection } from "./GallerySection";
import { HeroPage, type HeroUploadOptions } from "./HeroPage";
import { SiteHeader } from "./components/SiteHeader";

/** 高频/初始状态不弹 toast，避免拖动滑杆时提示不断闪现 */
const QUIET_STATUSES = new Set(["等待上传素材", "项目已更新，尚未保存"]);

export function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeSection, navigateTo } = useOrchestratedNavigation(scrollRef);
  useAppTheme();
  const [project, setProject] = useState<Project | null>(null);
  const [mediaAsset, setMediaAsset] = useState<MediaAsset | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState("等待上传素材");
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (QUIET_STATUSES.has(status)) {
      setToastVisible(false);
      return;
    }

    setToastVisible(true);
    const timer = window.setTimeout(() => setToastVisible(false), 2400);

    return () => window.clearTimeout(timer);
  }, [status]);
  const [isBusy, setIsBusy] = useState(false);
  const [galleryBatchSeed, setGalleryBatchSeed] = useState(() => Date.now());
  const galleryEntries = useMemo(() => buildGalleryBatch(galleryBatchSeed), [galleryBatchSeed]);

  useEffect(() => {
    void restoreLastSession();
  }, []);

  const autosaveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!project) {
      return;
    }

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      void (async () => {
        await settingsRepository.saveDefault({
          id: "default",
          lastProject: project,
          preferredRatio: project.templateParams.canvas.ratio,
          updatedAt: new Date().toISOString()
        });
      })();
    }, 600);

    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [project]);

  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!mediaAsset) {
      setMediaUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(mediaAsset.blob);
    setMediaUrl(url);

    if (mediaAsset.type === "video") {
      preloadFfmpeg();
    }

    return () => URL.revokeObjectURL(url);
  }, [mediaAsset]);

  async function restoreLastSession() {
    const [settings, projects] = await Promise.all([
      settingsRepository.getDefault(),
      projectRepository.list()
    ]);
    const sortedProjects = projects
      .map(normalizeProject)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setRecentProjects(sortedProjects);

    if (settings?.lastProject) {
      const restored = normalizeProject(settings.lastProject);
      setProject(restored);

      if (restored.mediaAssetId) {
        const asset = await mediaRepository.get(restored.mediaAssetId);
        setMediaAsset(asset ?? null);
      }

      setStatus("已恢复上次项目");
    }
  }

  async function saveProjectToAlbum(nextProject: Project) {
    await projectRepository.save(nextProject);
    await settingsRepository.saveDefault({
      id: "default",
      lastProject: nextProject,
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

  async function handleDeleteProject(projectId: string) {
    const target = recentProjects.find((item) => item.id === projectId);
    if (!target) {
      return;
    }

    await projectRepository.remove(projectId);
    setRecentProjects((items) => items.filter((item) => item.id !== projectId));

    if (project?.id === projectId) {
      setProject(null);
      setMediaAsset(null);
    }

    setStatus(`已删除 ${target.name}`);
  }

  async function handleDuplicateProject(projectId: string) {
    const source = recentProjects.find((item) => item.id === projectId);
    if (!source) {
      return;
    }

    const duplicateNameBase = `${source.name} Copy`;
    const usedNames = new Set(recentProjects.map((item) => item.name));
    let duplicateName = duplicateNameBase;
    let seq = 2;
    while (usedNames.has(duplicateName)) {
      duplicateName = `${duplicateNameBase} ${seq}`;
      seq += 1;
    }

    const now = new Date().toISOString();
    const duplicated: Project = {
      ...source,
      id: createId("project"),
      name: duplicateName,
      createdAt: now,
      updatedAt: now
    };

    await projectRepository.save(duplicated);
    setRecentProjects((items) => [duplicated, ...items]);
    setStatus(`已新建副本 ${duplicateName}`);
  }

  async function loadProject(selected: Project) {
    const normalized = normalizeProject(selected);
    setProject(normalized);

    if (normalized.mediaAssetId) {
      const asset = await mediaRepository.get(normalized.mediaAssetId);
      setMediaAsset(asset ?? null);
    } else {
      setMediaAsset(null);
    }

    setStatus(`已打开 ${normalized.name}`);
    void navigateTo("editor");
  }

  async function ingestFile(file: File) {
    setIsBusy(true);
    setStatus("正在读取素材");

    try {
      const asset = await createMediaAsset(file);
      await mediaRepository.save(asset);

      if (project) {
        setProject(replaceProjectMedia(project, asset));
        setMediaAsset(asset);
        setStatus("已替换素材");
        return;
      }

      const nextProject = createProjectFromMedia(asset);
      setProject(nextProject);
      setMediaAsset(asset);
      setStatus("已创建当前项目");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "素材读取失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMagicFrame(file: File, options: HeroUploadOptions) {
    setIsBusy(true);
    setStatus("正在生成展示卡片");

    try {
      const asset = await createMediaAsset(file);
      let templateParams = options.previewParams;
      const analysis = await analyzeImageFile(file);
      templateParams = applyMagicModeParams(templateParams, analysis);

      const nextProject = createProjectFromMedia(asset, {
        templateId: options.templateId,
        templateParams
      });
      await mediaRepository.save(asset);
      setProject(nextProject);
      setMediaAsset(asset);
      setStatus("生成完成，进入编辑器");
      await navigateTo("editor");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "素材读取失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload(file?: File) {
    if (!file) {
      return;
    }

    await ingestFile(file);
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

  function handleSelectTemplate(templateId: string) {
    if (!project || project.templateId === templateId) {
      return;
    }

    const template = getTemplateById(templateId);
    const nextProject = switchProjectTemplate(project, templateId);
    updateProject(nextProject);
    setStatus(`已切换至「${template.name}」`);
  }

  async function handleDownloadResult() {
    if (!project) {
      return;
    }

    if (!mediaAsset || !mediaUrl) {
      setStatus("请先上传素材后再下载");
      return;
    }

    setIsBusy(true);

    try {
      if (mediaAsset.type === "video") {
        setStatus("正在导出视频...");

        const result = await exportProjectVideo(project, mediaAsset, mediaUrl, {
          scale: 1,
          onProgress: (progress, label) => {
            if (label) {
              setStatus(label);
              return;
            }

            setStatus(`正在导出视频 ${Math.round(progress * 100)}%...`);
          }
        });

        const filename = `${sanitizeFilename(project.name)}.${result.extension}`;
        downloadBlob(result.blob, filename);
        setStatus(
          result.usedFallback
            ? `MP4 转码失败，已下载 WebM（${result.fallbackReason ?? "未知原因"}）`
            : "结果视频已下载"
        );
        return;
      }

      setStatus("正在导出结果图...");

      const blob = await exportProjectImage(project, mediaAsset, mediaUrl, { format: "png" });
      const filename = `${sanitizeFilename(project.name)}.png`;
      downloadBlob(blob, filename);
      setStatus("结果图已下载");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导出失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleApplyGalleryEntry(entry: GalleryEntry) {
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
    <>
      <SiteHeader activeSection={activeSection} onNavigate={navigateTo} />
      <div className="scroll-app" ref={scrollRef}>
        <section className="scroll-section hero-section" data-section="hero">
        <HeroPage
          isBusy={isBusy}
          onMagicFrame={(file, options) => handleMagicFrame(file, options)}
          onScrollDown={() => navigateTo("editor")}
        />
      </section>

      <section className="scroll-section editor-section" data-section="editor">
        <EditorSection
          isBusy={isBusy}
          mediaAsset={mediaAsset}
          mediaUrl={mediaUrl}
          project={project}
          onNavigate={navigateTo}
          onDownloadResult={() => void handleDownloadResult()}
          onSaveToAlbum={() => void handleSaveToAlbum()}
          onShuffleParams={handleShuffleParams}
          onSelectTemplate={handleSelectTemplate}
          onMagicFrame={(file, options) => void handleMagicFrame(file, options)}
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

      <section className="scroll-section album-section" data-section="album">
        <AlbumSection
          projects={recentProjects}
          onNavigate={navigateTo}
          onDeleteProject={(projectId) => void handleDeleteProject(projectId)}
          onDuplicateProject={(projectId) => void handleDuplicateProject(projectId)}
          onOpenProject={(item) => void loadProject(item)}
          onRenameProject={(projectId, name) => void handleRenameProject(projectId, name)}
        />
      </section>
      </div>

      <div aria-live="polite" className={`app-toast${toastVisible ? " is-visible" : ""}`} role="status">
        {status}
      </div>
    </>
  );
}
