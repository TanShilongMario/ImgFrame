import type { MediaAsset, Project } from "../types";
import {
  createCanvas,
  createLoadedMediaFromVideo,
  loadVideoElement,
  type LoadedMedia
} from "./canvasUtils";
import { renderProjectFrame } from "./renderProjectFrame";
import { transcodeWebmToMp4 } from "./transcodeToMp4";

export type ExportVideoOptions = {
  scale?: number;
  fps?: number;
  onProgress?: (progress: number, label?: string) => void;
};

export type ExportVideoResult = {
  blob: Blob;
  mimeType: string;
  extension: string;
  usedFallback: boolean;
  fallbackReason?: string;
};

function pickRecorderMimeType(): string {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
}

function canRecordMp4Directly(): boolean {
  return (
    MediaRecorder.isTypeSupported("video/mp4") ||
    MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,mp4a.40.2")
  );
}

function pickDirectMp4MimeType(): string | null {
  const candidates = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function drawFrameToCanvas(
  target: CanvasRenderingContext2D,
  project: Project,
  media: LoadedMedia,
  scale: number
) {
  const frame = renderProjectFrame(project, media, scale, "mp4");
  target.clearRect(0, 0, target.canvas.width, target.canvas.height);
  target.drawImage(frame, 0, 0);
}

async function attachAudioTrack(video: HTMLVideoElement): Promise<{
  stream: MediaStream;
  hasAudio: boolean;
  cleanup: () => void;
}> {
  const audioContext = new AudioContext();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const sourceNode = audioContext.createMediaElementSource(video);
  const destination = audioContext.createMediaStreamDestination();
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;

  sourceNode.connect(destination);
  sourceNode.connect(silentGain);
  silentGain.connect(audioContext.destination);

  const hasAudio = destination.stream.getAudioTracks().length > 0;

  return {
    stream: destination.stream,
    hasAudio,
    cleanup: () => {
      sourceNode.disconnect();
      silentGain.disconnect();
      void audioContext.close();
    }
  };
}

async function recordCompositedVideo(
  project: Project,
  mediaUrl: string,
  options: ExportVideoOptions
): Promise<{ blob: Blob; mimeType: string; hasAudio: boolean }> {
  const { scale = 1, fps = 30, onProgress } = options;
  const directMp4 = canRecordMp4Directly() ? pickDirectMp4MimeType() : null;
  const recorderMimeType = directMp4 ?? pickRecorderMimeType();

  const video = await loadVideoElement(mediaUrl);
  const media = createLoadedMediaFromVideo(video);
  const probe = renderProjectFrame(project, media, scale, "mp4");
  const { canvas, context } = createCanvas(probe.width, probe.height);

  drawFrameToCanvas(context, project, media, scale);

  const canvasStream = canvas.captureStream(fps);
  const { stream: audioStream, hasAudio, cleanup: cleanupAudio } = await attachAudioTrack(video);
  const audioTracks = audioStream.getAudioTracks();

  const outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

  const recorder = new MediaRecorder(outputStream, {
    mimeType: recorderMimeType,
    videoBitsPerSecond: 8_000_000
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorderMimeType }));
    recorder.onerror = () => reject(new Error("视频编码失败。"));
  });

  video.currentTime = 0;
  await new Promise<void>((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve();
      return;
    }

    video.onseeked = () => resolve();
  });

  onProgress?.(0, "正在合成视频...");
  recorder.start(200);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    };

    const paint = () => {
      drawFrameToCanvas(context, project, media, scale);

      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        onProgress?.(Math.min(0.82, (video.currentTime / duration) * 0.82), "正在合成视频...");
      }

      if (video.ended) {
        finish();
        return;
      }

      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(paint);
        return;
      }

      requestAnimationFrame(paint);
    };

    video.onended = finish;
    video.onerror = () => {
      settled = true;
      reject(new Error("视频播放失败。"));
    };

    void video.play().then(paint).catch(reject);
  });

  await new Promise((resolve) => window.setTimeout(resolve, 320));
  recorder.stop();
  video.pause();

  const blob = await recorded;
  cleanupAudio();

  if (blob.size === 0) {
    throw new Error("视频录制结果为空。");
  }

  return { blob, mimeType: recorderMimeType, hasAudio };
}

export async function exportProjectVideo(
  project: Project,
  mediaAsset: MediaAsset,
  mediaUrl: string,
  options: ExportVideoOptions = {}
): Promise<ExportVideoResult> {
  if (mediaAsset.type !== "video") {
    throw new Error("当前素材不是视频。");
  }

  const { onProgress } = options;
  const { blob, mimeType, hasAudio } = await recordCompositedVideo(project, mediaUrl, options);

  if (mimeType.includes("mp4")) {
    onProgress?.(1, "导出完成");
    return {
      blob,
      mimeType,
      extension: "mp4",
      usedFallback: false
    };
  }

  try {
    onProgress?.(0.84, "正在加载转码器...");

    const mp4Blob = await transcodeWebmToMp4(blob, hasAudio, (progress) => {
      if (progress.phase === "loading") {
        onProgress?.(0.84 + progress.ratio * 0.04, "正在加载转码器...");
        return;
      }

      onProgress?.(0.88 + progress.ratio * 0.12, "正在转码 MP4...");
    });

    onProgress?.(1, "导出完成");

    return {
      blob: mp4Blob,
      mimeType: "video/mp4",
      extension: "mp4",
      usedFallback: false
    };
  } catch (error) {
    const fallbackReason = error instanceof Error ? error.message : "MP4 转码失败";
    onProgress?.(0.9, "MP4 转码失败，已回退 WebM");

    return {
      blob,
      mimeType,
      extension: "webm",
      usedFallback: true,
      fallbackReason
    };
  }
}
