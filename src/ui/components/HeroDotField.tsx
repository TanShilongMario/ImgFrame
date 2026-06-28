import { useEffect, useRef } from "react";
import { sampleImageDots, type ImageDot } from "../../media/sampleImageDots";

type HeroDotFieldProps = {
  imageUrl: string;
  active: boolean;
};

type AnimatedDot = ImageDot & {
  startX: number;
  startY: number;
};

export function HeroDotField({ imageUrl, active }: HeroDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<AnimatedDot[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void sampleImageDots(imageUrl).then((dots) => {
      if (cancelled) {
        return;
      }

      dotsRef.current = dots.map((dot) => ({
        ...dot,
        startX: Math.random(),
        startY: Math.random()
      }));
      startedAtRef.current = performance.now();
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!active) {
      return;
    }

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
      const startedAt = startedAtRef.current ?? now;
      const elapsed = now - startedAt;
      const settleProgress = Math.min(1, elapsed / 720);
      const eased = 1 - (1 - settleProgress) ** 3;
      const pulse = 0.88 + Math.sin(elapsed / 420) * 0.08;

      drawContext.clearRect(0, 0, width, height);

      for (const dot of dotsRef.current) {
        const x = (dot.startX + (dot.x - dot.startX) * eased) * width;
        const y = (dot.startY + (dot.y - dot.startY) * eased) * height;
        const radius = dot.radius * Math.min(width, height) * pulse;

        drawContext.beginPath();
        drawContext.fillStyle = dot.color;
        drawContext.arc(x, y, radius, 0, Math.PI * 2);
        drawContext.fill();
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
  }, [active, imageUrl]);

  return <canvas ref={canvasRef} aria-hidden="true" className="hero-dot-field" />;
}
