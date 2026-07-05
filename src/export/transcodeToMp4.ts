import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import coreJsUrl from "@ffmpeg/core?url";
import coreWasmUrl from "@ffmpeg/core/wasm?url";

let ffmpegReady: Promise<FFmpeg> | null = null;

export function preloadFfmpeg(): void {
  void getFfmpeg().catch(() => {
    ffmpegReady = null;
  });
}

async function getFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegReady) {
    ffmpegReady = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(coreJsUrl, "text/javascript"),
        wasmURL: await toBlobURL(coreWasmUrl, "application/wasm")
      });
      return ffmpeg;
    })().catch((error) => {
      ffmpegReady = null;
      throw error;
    });
  }

  return ffmpegReady;
}

function buildTranscodeArgs(hasAudio: boolean): string[] {
  const args = [
    "-y",
    "-i",
    "input.webm",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "ultrafast",
    "-crf",
    "22",
    "-movflags",
    "+faststart"
  ];

  if (hasAudio) {
    args.push("-c:a", "aac", "-b:a", "128k");
  } else {
    args.push("-an");
  }

  args.push("output.mp4");
  return args;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(message));
      }
    );
  });
}

export type TranscodeProgress = {
  phase: "loading" | "transcoding";
  ratio: number;
};

export async function transcodeWebmToMp4(
  webmBlob: Blob,
  hasAudio: boolean,
  onProgress?: (progress: TranscodeProgress) => void
): Promise<Blob> {
  if (webmBlob.size === 0) {
    throw new Error("录制的视频为空，无法转码。");
  }

  onProgress?.({ phase: "loading", ratio: 0 });
  const ffmpeg = await withTimeout(getFfmpeg(), 90_000, "转码器加载超时，请重试。");
  onProgress?.({ phase: "loading", ratio: 1 });

  const progressHandler = ({ progress }: { progress: number }) => {
    if (!Number.isFinite(progress)) {
      return;
    }

    onProgress?.({ phase: "transcoding", ratio: Math.min(1, Math.max(0, progress)) });
  };

  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile("input.webm", await fetchFile(webmBlob));

    const timeoutMs = Math.max(120_000, Math.ceil(webmBlob.size / 20_000));

    try {
      await withTimeout(ffmpeg.exec(buildTranscodeArgs(hasAudio)), timeoutMs, "MP4 转码超时，请尝试更短的视频。");
    } catch (firstError) {
      if (!hasAudio) {
        throw firstError;
      }

      await withTimeout(ffmpeg.exec(buildTranscodeArgs(false)), timeoutMs, "MP4 转码超时，请尝试更短的视频。");
    }

    const data = await ffmpeg.readFile("output.mp4");
    const bytes = data instanceof Uint8Array ? Uint8Array.from(data) : new TextEncoder().encode(String(data));

    if (bytes.byteLength === 0) {
      throw new Error("MP4 转码结果为空。");
    }

    return new Blob([bytes], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile("input.webm").catch(() => undefined);
    await ffmpeg.deleteFile("output.mp4").catch(() => undefined);
  }
}
