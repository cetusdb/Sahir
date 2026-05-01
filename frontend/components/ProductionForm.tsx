'use client';

import { useEffect, useState } from 'react';
import { api, type CategoryFlat, type ProductionUpsert } from '@/lib/api';
import ImageUploader from './ImageUploader';

type Props = {
  initial?: Partial<ProductionUpsert>;
  initialGenreIds?: number[];
  onSubmit: (data: ProductionUpsert) => Promise<void>;
  submitLabel: string;
};

export default function ProductionForm({
  initial = {}, initialGenreIds = [], onSubmit, submitLabel
}: Props) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [originalTitle, setOriginalTitle] = useState(initial.originalTitle ?? '');
  const [type, setType] = useState<'Movie' | 'TVShow'>(initial.type ?? 'Movie');
  const [releaseYear, setReleaseYear] = useState<number>(
    initial.releaseYear ?? new Date().getFullYear());
  const [endYear, setEndYear] = useState<number | ''>(initial.endYear ?? '');
  const [durationMin, setDurationMin] = useState<number | ''>(initial.durationMin ?? '');
  const [seasonsCount, setSeasonsCount] = useState<number | ''>(initial.seasonsCount ?? '');
  const [episodesCount, setEpisodesCount] = useState<number | ''>(initial.episodesCount ?? '');
  const [synopsis, setSynopsis] = useState(initial.synopsis ?? '');
  const [posterUrl, setPosterUrl] = useState(initial.posterUrl ?? '');
  const [backdropUrl, setBackdropUrl] = useState(initial.backdropUrl ?? '');
  const [trailerUrl, setTrailerUrl] = useState(initial.trailerUrl ?? '');
  const [director, setDirector] = useState(initial.director ?? '');
  const [country, setCountry] = useState(initial.country ?? '');
  const [language, setLanguage] = useState(initial.language ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(initial.categoryId ?? '');
  const [genreIds, setGenreIds] = useState<number[]>(initialGenreIds);

  const [categories, setCategories] = useState<CategoryFlat[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.categoriesFlat().then(setCategories).catch(() => {});
    api.genres().then(setGenres).catch(() => {});
  }, []);

  function toggleGenre(id: number) {
    setGenreIds((prev) => prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        originalTitle: originalTitle.trim() || null,
        type,
        releaseYear: Number(releaseYear),
        endYear: endYear === '' ? null : Number(endYear),
        durationMin: durationMin === '' ? null : Number(durationMin),
        seasonsCount: seasonsCount === '' ? null : Number(seasonsCount),
        episodesCount: episodesCount === '' ? null : Number(episodesCount),
        synopsis: synopsis.trim() || null,
        posterUrl: posterUrl.trim() || null,
        backdropUrl: backdropUrl.trim() || null,
        trailerUrl: trailerUrl.trim() || null,
        director: director.trim() || null,
        country: country.trim() || null,
        language: language.trim() || null,
        categoryId: categoryId === '' ? null : Number(categoryId),
        genreIds
      });
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Başlık *">
          <input required value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls} />
        </Field>
        <Field label="Orijinal başlık">
          <input value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)}
            className={inputCls} />
        </Field>
        <Field label="Tür *">
          <select value={type} onChange={(e) => setType(e.target.value as any)}
            className={inputCls}>
            <option value="Movie">Film</option>
            <option value="TVShow">Dizi</option>
          </select>
        </Field>
        <Field label="Kategori">
          <select value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputCls}>
            <option value="">— Seçiniz —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? '└ ' : ''}{c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Yapım yılı *">
          <input type="number" required min={1888} max={2100}
            value={releaseYear} onChange={(e) => setReleaseYear(Number(e.target.value))}
            className={inputCls} />
        </Field>
        <Field label="Bitiş yılı (dizi)">
          <input type="number" min={1888} max={2100}
            value={endYear} onChange={(e) =>
              setEndYear(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputCls} />
        </Field>

        {type === 'Movie' ? (
          <Field label="Süre (dk)">
            <input type="number" min={1}
              value={durationMin} onChange={(e) =>
                setDurationMin(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls} />
          </Field>
        ) : (
          <>
            <Field label="Sezon sayısı">
              <input type="number" min={1}
                value={seasonsCount} onChange={(e) =>
                  setSeasonsCount(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls} />
            </Field>
            <Field label="Bölüm sayısı">
              <input type="number" min={1}
                value={episodesCount} onChange={(e) =>
                  setEpisodesCount(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls} />
            </Field>
          </>
        )}

        <Field label="Yönetmen">
          <input value={director} onChange={(e) => setDirector(e.target.value)}
            className={inputCls} />
        </Field>
        <Field label="Ülke">
          <input value={country} onChange={(e) => setCountry(e.target.value)}
            className={inputCls} />
        </Field>
        <Field label="Dil">
          <input value={language} onChange={(e) => setLanguage(e.target.value)}
            className={inputCls} />
        </Field>
        <Field label="Fragman URL">
          <input type="url" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)}
            placeholder="https://youtube.com/..." className={inputCls} />
        </Field>
      </div>

      <Field label="Özet">
        <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)}
          rows={4} className={inputCls} />
      </Field>

      <ImageUploader value={posterUrl} onChange={setPosterUrl} label="Poster" />
      <ImageUploader value={backdropUrl} onChange={setBackdropUrl}
        label="Arkaplan görseli (opsiyonel)" />

      <div>
        <span className="text-sm text-muted">Türler</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {genres.map((g) => {
            const on = genreIds.includes(g.id);
            return (
              <button type="button" key={g.id} onClick={() => toggleGenre(g.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                  ${on ? 'bg-accent text-black border-accent'
                       : 'border-border hover:bg-card'}`}>
                {g.name}
              </button>
            );
          })}
          {genres.length === 0 && <span className="text-xs text-muted">Yükleniyor...</span>}
        </div>
      </div>

      {err && <div className="text-red-400 text-sm">{err}</div>}

      <div className="flex gap-3">
        <button disabled={busy}
          className="px-5 py-2 rounded-md bg-accent text-black font-semibold disabled:opacity-50">
          {busy ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputCls = `w-full bg-card border border-border rounded-md px-3 py-2 text-sm
                  focus:outline-none focus:border-accent`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
