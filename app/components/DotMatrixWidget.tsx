'use client';

import { useEffect, useRef, useState } from 'react';

const MODES = ['neutral', 'think', 'listen', 'alert'] as const;
type Mode = typeof MODES[number];

const MODE_LABELS: Record<Mode, string> = {
  neutral: '输入',
  think: '实干',
  listen: '复盘',
  alert: '休眠',
};

export default function DotMatrixWidget({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('think');
  const [coord, setCoord] = useState('00,00');
  const modeRef = useRef<Mode>('think');
  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DOT_SPACING = 13;
    const DOT_SIZE = 3.8;
    const BG = '#e6e8ef';
    const DOT_DIM = '#cdd1e0';

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      colsRef.current = Math.floor(w / DOT_SPACING);
      rowsRef.current = Math.floor(h / DOT_SPACING);
    }

    function getIntensity(c: number, r: number, time: number): number {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      if (!cols || !rows) return 0;
      const x = c / cols;
      const y = r / rows;
      const dist = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);

      switch (modeRef.current) {
        case 'neutral': {
          const pulse = (Math.sin(time * 0.05) + 1) / 2;
          const ring = Math.abs(dist - pulse * 0.4);
          return ring < 0.05 ? 1 : ring < 0.1 ? 0.2 : 0;
        }
        case 'think': {
          const angle = Math.atan2(y - 0.5, x - 0.5);
          const orbit = Math.sin(dist * 20 - time * 0.2 + angle * 3);
          return orbit > 0.8 ? 1 : orbit > 0.4 ? 0.2 : 0;
        }
        case 'listen': {
          const wave = Math.sin(x * 10 + time * 0.3) * 0.3 + 0.5;
          return Math.abs(y - wave) < 0.05 ? 1 : 0.1;
        }
        case 'alert': {
          const gridPos = Math.floor(time * 0.2) % 2;
          return gridPos === 0
            ? (c % 4 === 0 || r % 4 === 0 ? (Math.random() > 0.5 ? 1 : 0) : 0)
            : dist < 0.3 ? 1 : 0;
        }
        default:
          return 0;
      }
    }

    function draw() {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      if (!canvas || !ctx || !cols || !rows) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = frameRef.current++;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * DOT_SPACING + DOT_SPACING / 2;
          const y = j * DOT_SPACING + DOT_SPACING / 2;
          const intensity = getIntensity(i, j, time);

          // base dot (always visible)
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = DOT_DIM;
          ctx.fill();

          if (intensity > 0) {
            if (intensity === 1) {
              ctx.shadowBlur = 5;
              ctx.shadowColor = 'rgba(255,203,0,0.5)';
            }
            ctx.beginPath();
            ctx.arc(x, y, DOT_SIZE, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,203,0,${intensity})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,203,0,${intensity * 0.6})`;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    draw();

    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = Math.floor((e.clientX - rect.left) / 13);
    const my = Math.floor((e.clientY - rect.top) / 13);
    setCoord(
      `${String(mx).padStart(2, '0')},${String(my).padStart(2, '0')}`
    );
  };

  return (
    <div className={`neo-inset rounded-2xl overflow-hidden flex flex-col font-mono ${className}`}>
      {/* ── 顶部元数据栏 ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1 text-[8px] uppercase tracking-widest text-[var(--text-sub)]">
        <span>MODE: DEEP WORK</span>
        <span className="text-[var(--accent-yellow)]">FOCUSED</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-yellow)] animate-pulse" />
          SYNCING
        </span>
      </div>

      {/* ── Canvas 点阵区域 ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-crosshair"
        style={{ minHeight: '130px', position: 'relative' }}
      >
        {/* scanline 叠加层 */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(rgba(255,255,255,0) 50%, rgba(180,185,200,0.08) 50%)',
            backgroundSize: '100% 4px',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
        />
      </div>

      {/* ── 底部坐标栏 ── */}
      <div className="px-3 py-1 text-[8px] tracking-widest text-[var(--text-sub)]">
        ENERGY: HIGH // COGNITIVE LOAD: OPTIMAL // CAPACITY: 85%
      </div>

      {/* ── 模式切换按钮 ── */}
      <div className="grid grid-cols-4 border-t border-[var(--shadow-dark)]">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative py-2 text-[8px] uppercase tracking-widest transition-colors ${
              mode === m
                ? 'text-[var(--accent-yellow)]'
                : 'text-[var(--text-sub)] hover:text-[var(--accent-yellow)]'
            }`}
          >
            {MODE_LABELS[m]}
            {mode === m && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-0.5 bg-[var(--accent-yellow)] rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
