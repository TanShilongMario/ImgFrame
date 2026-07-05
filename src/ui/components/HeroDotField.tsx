import { useEffect, useRef } from "react";
import { sampleImageDots, type ImageDot } from "../../media/sampleImageDots";
import type { HeroCeremonyPhase } from "./HeroUploadCard";

type HeroDotFieldProps = {
  imageUrl: string;
  phase: HeroCeremonyPhase;
};

type CeremonyDot = ImageDot & {
  /** 0..1，错开每颗粒子的出现时间 */
  stagger: number;
  /** 呼吸相位偏移，让每颗粒子的节奏互不同步 */
  breathePhase: number;
  /** 呼吸频率（弧度/毫秒），每颗略有差异 */
  breatheSpeed: number;
  /** 呼吸幅度，轻微且随机 */
  breatheAmp: number;
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function HeroDotField({ imageUrl, phase }: HeroDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<CeremonyDot[]>([]);
  const phaseRef = useRef<HeroCeremonyPhase>(phase);
  const phaseStartRef = useRef(performance.now());
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (phaseRef.current !== phase) {
      phaseRef.current = phase;
      phaseStartRef.current = performance.now();
    }
  }, [phase]);

  useEffect(() => {
    let cancelled = false;

    void sampleImageDots(imageUrl).then((dots) => {
      if (cancelled) {
        return;
      }

      dotsRef.current = dots.map((dot) => ({
        ...dot,
        stagger: Math.random(),
        breathePhase: Math.random() * Math.PI * 2,
        breatheSpeed: 0.0022 + Math.random() * 0.0032,
        breatheAmp: 0.1 + Math.random() * 0.2
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const drawContext = context;

    function resizeCanvas() {
      const currentCanvas = canvasRef.current;
      const parent = currentCanvas?.parentElement;
      if (!parent || !currentCanvas) {
        return;
      }

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      currentCanvas.width = Math.round(rect.width * dpr);
      currentCanvas.height = Math.round(rect.height * dpr);
      currentCanvas.style.width = `${rect.width}px`;
      currentCanvas.style.height = `${rect.height}px`;
      drawContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();

    function drawFrame(now: number) {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) {
        return;
      }

      const rect = currentCanvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const currentPhase = phaseRef.current;
      const t = now - phaseStartRef.current;
      const minSide = Math.min(width, height);

      drawContext.clearRect(0, 0, width, height);

      for (const dot of dotsRef.current) {
        // 呼吸：每颗粒子按自己的相位与频率轻微放大缩小
        const breathe = 1 + Math.sin(now * dot.breatheSpeed + dot.breathePhase) * dot.breatheAmp;
        let radiusScale = breathe;
        let alpha = 1;

        if (currentPhase === "dots") {
          // 粒子错落地从无到有绽出，随后进入呼吸
          const bornT = clamp01((t - 120 - dot.stagger * 620) / 480);
          if (bornT <= 0) {
            continue;
          }
          const eased = easeOutCubic(bornT);
          radiusScale = eased * (1 + Math.sin(Math.PI * bornT) * 0.25) * breathe;
          alpha = eased;
        } else if (currentPhase === "reading" || currentPhase === "transforming") {
          // 持续呼吸，无扫描光带
          radiusScale = breathe;
        } else if (currentPhase === "done") {
          // 粒子缓缓淡出，把画面交还给实图
          const settle = clamp01(t / 420);
          radiusScale = 1 + (breathe - 1) * (1 - settle);
          alpha = 1 - clamp01((t - 200) / 700);
        }

        if (alpha <= 0) {
          continue;
        }

        drawContext.beginPath();
        drawContext.globalAlpha = alpha;
        drawContext.fillStyle = dot.color;
        drawContext.arc(dot.x * width, dot.y * height, dot.radius * minSide * radiusScale, 0, Math.PI * 2);
        drawContext.fill();
        drawContext.globalAlpha = 1;
      }

      frameRef.current = window.requestAnimationFrame(drawFrame);
    }

    frameRef.current = window.requestAnimationFrame(drawFrame);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [imageUrl]);

  return <canvas ref={canvasRef} aria-hidden="true" className="hero-dot-field" />;
}
