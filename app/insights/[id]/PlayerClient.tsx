'use client';

import { useRef, useState, useEffect } from 'react';

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PlayerClient({ audioSrc }: { audioSrc: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [metaLoaded, setMetaLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="neo-inset rounded-2xl px-5 pt-4 pb-4 flex flex-col gap-2" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
      {/* 波形（播放时展开） */}
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ height: isPlaying ? '2rem' : '0', opacity: isPlaying ? 1 : 0 }}
      >
        <div className="wave-track">
          {Array.from({ length: 16 }).map((_, idx) => (
            <span
              key={idx}
              className={`wave-bar wave-${idx + 1}`}
              style={{ background: 'var(--accent-yellow)' }}
            />
          ))}
        </div>
      </div>

      {/* 控制行 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying((v) => !v)}
          className="player-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm text-[var(--accent-yellow)]"
          style={{
            filter: isPlaying ? 'drop-shadow(0 0 7px rgba(255,203,0,0.55))' : undefined,
          }}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div
          className="flex-1 relative h-1.5 rounded-full bg-[var(--bg-page)] cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: isPlaying
                ? 'linear-gradient(90deg, var(--accent-yellow), #FFE066)'
                : 'var(--shadow-dark)',
              transition: 'width 0.15s linear',
              boxShadow: isPlaying ? '0 0 5px rgba(255,203,0,0.5)' : undefined,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, background: 'var(--accent-yellow)' }}
          />
        </div>

        <span className="font-mono text-[9px] text-[var(--text-sub)] shrink-0 tabular-nums select-none">
          {formatTime(currentTime)}
          {metaLoaded && ` / ${formatTime(duration)}`}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setMetaLoaded(true);
        }}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
