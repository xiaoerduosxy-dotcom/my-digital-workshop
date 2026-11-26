'use client';

import { useEffect, useRef } from 'react';

type Pixel = { x: number; y: number; phase: number; glow: number };

const GOLD_LEVELS = [0.13, 0.28, 0.55, 0.9] as const;

function soften(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export default function DotMatrixWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !container || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pixels: Pixel[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastDraw = -Infinity;
    let visible = true;

    function draw(time: number) {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0, 0, width, height);

      const groups: Pixel[][] = GOLD_LEVELS.map(() => []);
      ctx.beginPath();
      for (const pixel of pixels) {
        const { x, y, phase, glow } = pixel;
        ctx.moveTo(x + 0.85, y);
        ctx.arc(x, y, 0.85, 0, Math.PI * 2);
        const wave = Math.sin(phase - time);
        const light = glow * (wave > 0.79 ? 1 : wave > 0.4 ? 0.29 : 0);
        if (light >= 0.07) {
          const band = light > 0.68 ? 3 : light > 0.4 ? 2 : light > 0.2 ? 1 : 0;
          groups[band].push(pixel);
        }
      }
      ctx.fillStyle = 'rgba(158, 146, 185, .22)';
      ctx.fill();

      function rings(group: Pixel[], alpha: number) {
        if (!ctx) return;
        ctx.beginPath();
        for (const { x, y } of group) {
          ctx.moveTo(x + 3.8, y);
          ctx.arc(x, y, 3.8, 0, Math.PI * 2);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 203, 0, ${alpha})`;
        ctx.shadowBlur = alpha > 0.8 ? 5 : 0;
        ctx.shadowColor = 'rgba(255, 203, 0, .5)';
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (const { x, y } of group) {
          ctx.moveTo(x + 0.75, y);
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(255, 203, 0, ${alpha * 0.65})`;
        ctx.fill();
      }

      groups.forEach((group, index) => {
        if (group.length) rings(group, GOLD_LEVELS[index]);
      });
    }

    function tick(now: number) {
      frame = 0;
      if (!visible || reducedMotion.matches) return;
      if (now - lastDraw >= 29) {
        // Same three-arm spiral as the original “实干” mode, at a stable speed.
        draw(now * 0.0055);
        lastDraw = now;
      }
      frame = window.requestAnimationFrame(tick);
    }

    function syncMotion() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) draw(0.9);
      else if (visible) frame = window.requestAnimationFrame(tick);
    }

    function resize() {
      if (!canvas || !container || !ctx) return;
      width = container.clientWidth;
      height = container.clientHeight;
      const resolution = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * resolution);
      canvas.height = Math.round(height * resolution);
      ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
      const spacing = width < 400 ? 11 : 13;
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      const insetX = (width - cols * spacing) / 2;
      const insetY = (height - rows * spacing) / 2;
      const narrow = width < 460;
      const scale = Math.max(135, Math.min(height * 1.06, width * 0.48));
      pixels = [];
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const x = insetX + (col + 0.5) * spacing;
          const y = insetY + (row + 0.5) * spacing;
          // Place the vivid rings in the upper-right, away from the reading start.
          const dx = (x - width * 0.83) / scale;
          const dy = (y - height * 0.23) / scale;
          const horizontal = soften((x / width - (narrow ? 0.49 : 0.43)) / 0.38);
          const vertical = 1 - soften((y / height - 0.23) / 0.62);
          pixels.push({
            x,
            y,
            phase: Math.hypot(dx, dy) * 20 + Math.atan2(dy, dx) * 3,
            glow: horizontal * vertical * (narrow ? 0.61 : 1),
          });
        }
      }
      draw(reducedMotion.matches ? 0.9 : performance.now() * 0.0055);
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncMotion();
    });
    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    reducedMotion.addEventListener('change', syncMotion);
    resize();
    syncMotion();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener('change', syncMotion);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'repeating-linear-gradient(180deg, transparent 0 2px, rgb(152 136 182 / 5%) 2px 4px), radial-gradient(ellipse at 83% 12%, #e4ddf385, #eae9f22e 59%, transparent 83%)' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
