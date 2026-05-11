'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme, type Theme } from '@/lib/theme-context';

type Item = { id: Theme; label: string; emoji: string; desc?: string };

const themes: Item[] = [
  { id: 'default',    label: 'Varsayılan',         emoji: '🎬' },
  { id: 'christmas',  label: 'Christmas',          emoji: '🎄' },
  { id: 'halloween',  label: 'Halloween',          emoji: '🎃' },
  { id: 'valentines', label: "Valentine's Day",    emoji: '💖' }
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = themes.find((t) => t.id === theme) ?? themes[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Tema değiştir"
        className="text-sm px-3 py-1.5 rounded-md border border-border
                   hover:bg-card flex items-center gap-1.5">
        <span aria-hidden>{current.emoji}</span>
        <span className="hidden md:inline">Tema</span>
        <span className="text-xs text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-panel border border-border
                        rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted
                          border-b border-border">
            Tema seç
          </div>
          {themes.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-3
                            hover:bg-card transition-colors
                            ${active ? 'bg-card' : ''}`}>
                <span className="text-lg leading-none mt-0.5">{t.emoji}</span>
                <div className="flex-1">
                  <div className={`font-semibold ${active ? 'text-accent' : ''}`}>
                    {t.label}
                  </div>
                  {t.desc && <div className="text-xs text-muted">{t.desc}</div>}
                </div>
                {active && <span className="text-accent text-sm">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
