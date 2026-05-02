'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
};

export default function ImageUploader({ value, onChange, label = 'Poster' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(f: File | null) {
    if (!f) return;
    setErr(null); setBusy(true);
    try {
      const r = await api.uploadImage(f);
      onChange(r.url);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1 flex gap-3">
        <div className="w-32 h-48 bg-card border border-border rounded-md
                        overflow-hidden flex items-center justify-center text-xs text-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="poster" className="w-full h-full object-cover" />
          ) : (
            <span>Görsel yok</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input ref={inputRef} type="file" accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="hidden" />
          <button type="button" disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-2 rounded-md bg-accent text-black font-semibold text-sm
                       disabled:opacity-50">
            {busy ? 'Yükleniyor...' : 'Bilgisayardan Yükle'}
          </button>
          <div className="text-xs text-muted">veya bir URL yapıştır:</div>
          <input type="url" value={value ?? ''}
            placeholder="https://..."
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-card border border-border rounded-md px-3 py-1.5
                       text-sm focus:outline-none focus:border-accent" />
          {err && <div className="text-red-400 text-xs">{err}</div>}
          <div className="text-xs text-muted">
            JPG/PNG/WebP, en fazla 5 MB.
          </div>
        </div>
      </div>
    </div>
  );
}
