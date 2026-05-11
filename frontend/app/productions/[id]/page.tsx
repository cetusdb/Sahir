'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  type Comment, type ProductionDetail, type Watchlist
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useUI } from '@/lib/ui-context';
import CommentItem, { type CommentNode } from '@/components/CommentItem';

export default function ProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [p, setP] = useState<ProductionDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<number>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [err, setErr] = useState<string | null>(null);

  // Watchlist seçimi
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [showListPicker, setShowListPicker] = useState(false);
  const [newListName, setNewListName] = useState('');

  const { user } = useAuth();
  const { toast, confirm } = useUI();

  useEffect(() => {
    api.production(id).then(setP).catch((e) => setErr(e.message));
    api.comments(id).then(setComments).catch(() => {});
    if (user) {
      api.myRating(id).then((r) => setMyScore(r.score)).catch(() => {});
      api.myWatchlists().then(setLists).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitRating(score: number) {
    try {
      await api.rate(id, score);
      setMyScore(score);
      toast(`${score}/10 puan kaydedildi`, 'success');
    }
    catch (e: any) { toast('Puan verilemedi: ' + e.message, 'error'); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      const c = await api.addComment(id, body.trim(), isSpoiler);
      setComments([c, ...comments]);
      setBody('');
      setIsSpoiler(false);
      toast('Yorumun yayınlandı', 'success');
    } catch (e: any) { toast('Yorum gönderilemedi: ' + e.message, 'error'); }
  }

  async function likeComment(commentId: number) {
    if (likedComments.has(commentId)) return;
    try {
      const r = await api.likeComment(commentId);
      setComments(comments.map((c) =>
        c.id === commentId ? { ...c, likeCount: r.likeCount } : c
      ));
      setLikedComments(new Set(likedComments).add(commentId));
    } catch (e: any) { toast('Beğeni başarısız: ' + e.message, 'error'); }
  }

  async function revealSpoiler(commentId: number) {
    const ok = await confirm({
      title: 'Spoiler içeriyor',
      message: 'Bu yorum spoiler içeriyor. Görmek istediğine emin misin?',
      confirmText: 'Yine de göster',
      cancelText: 'Vazgeç'
    });
    if (!ok) return;
    const next = new Set(revealedSpoilers);
    next.add(commentId);
    setRevealedSpoilers(next);
  }

  async function markWatched() {
    try {
      await api.markWatched(id);
      toast('İzlendi olarak işaretlendi', 'success');
    }
    catch (e: any) { toast(e.message, 'error'); }
  }

  async function addToList(watchlistId: number) {
    try {
      await api.addToWatchlist(watchlistId, id);
      toast('Listeye eklendi', 'success');
      setShowListPicker(false);
    } catch (e: any) { toast(e.message, 'error'); }
  }

  async function deleteThisProduction() {
    if (!p) return;
    const ok = await confirm({
      title: 'Yapımı sil',
      message: `"${p.title}" yapımını silmek istediğine emin misin?\n\nBu işlem ilgili tüm puanları, yorumları ve liste girişlerini de siler ve geri alınamaz.`,
      confirmText: 'Sil',
      destructive: true
    });
    if (!ok) return;
    try {
      await api.deleteProduction(id);
      toast('Yapım silindi', 'success');
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch (e: any) { toast('Hata: ' + e.message, 'error'); }
  }

  async function createListAndAdd() {
    if (!newListName.trim()) return;
    try {
      const w = await api.createWatchlist({ name: newListName.trim() });
      setLists([w, ...lists]);
      await api.addToWatchlist(w.id, id);
      toast(`"${w.name}" oluşturuldu ve eklendi`, 'success');
      setNewListName('');
      setShowListPicker(false);
    } catch (e: any) { toast(e.message, 'error'); }
  }

  if (err) return <div className="text-red-400">Hata: {err}</div>;
  if (!p)  return <div className="text-muted">Yükleniyor...</div>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <div className="bg-card rounded-xl overflow-hidden border border-border">
          {p.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.posterUrl} alt={p.title} className="w-full" />
          ) : (
            <div className="aspect-[2/3] flex items-center justify-center text-muted">
              Poster yok
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted">
            {p.type === 'TVShow' ? 'Dizi' : 'Film'} · {p.releaseYear}
            {p.endYear ? ` – ${p.endYear}` : ''}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1">{p.title}</h1>
          {p.originalTitle && p.originalTitle !== p.title && (
            <div className="text-muted">{p.originalTitle}</div>
          )}

          <div className="flex gap-4 items-center mt-4 text-sm flex-wrap">
            <span className="text-accent text-2xl font-bold">★ {p.averageScore || '—'}</span>
            <span className="text-muted">{p.ratingCount} oy</span>
            {p.durationMin && <span className="text-muted">{p.durationMin} dk</span>}
            {p.seasonsCount && <span className="text-muted">{p.seasonsCount} sezon</span>}
            {p.categoryName && (
              <span className="px-2 py-0.5 rounded-full bg-card border border-border">
                {p.categoryName}
              </span>
            )}
          </div>

          {p.genres?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.genres.map((g) => (
                <span key={g} className="text-xs px-2 py-1 rounded bg-card border border-border">
                  {g}
                </span>
              ))}
            </div>
          )}

          <p className="mt-5 leading-relaxed text-text/90">{p.synopsis}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {p.director && <Info label="Yönetmen" value={p.director} />}
            {p.country  && <Info label="Ülke"     value={p.country}  />}
            {p.language && <Info label="Dil"      value={p.language} />}
          </dl>

          {/* Kullanıcı eylemleri */}
          {user ? (
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-sm text-muted mb-1">Senin puanın:</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => submitRating(n)}
                      className={`w-9 h-9 rounded-md border text-sm font-semibold
                        ${myScore === n
                          ? 'bg-accent text-black border-accent'
                          : 'border-border hover:bg-card'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={markWatched}
                  className="px-4 py-2 rounded-md border border-border hover:bg-card text-sm">
                  ✓ İzledim
                </button>
                <button onClick={() => setShowListPicker(!showListPicker)}
                  className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm">
                  + Listeye Ekle
                </button>
                {(user.role === 'Editor' || user.role === 'Admin') && (
                  <Link href={`/editor/productions/${id}/edit`}
                    className="px-4 py-2 rounded-md border border-accent2
                               text-accent2 hover:bg-card text-sm">
                    ✎ Düzenle
                  </Link>
                )}
                {(user.role === 'Editor' || user.role === 'Admin') && (
                  <button onClick={deleteThisProduction}
                    className="px-4 py-2 rounded-md border border-red-500/40
                               text-red-400 hover:bg-red-500/10 text-sm">
                    🗑 Sil
                  </button>
                )}
              </div>

              {/* Liste seçici */}
              {showListPicker && (
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <div className="text-sm font-semibold">Mevcut listelerin</div>
                  {lists.length === 0 && (
                    <div className="text-xs text-muted">Henüz listen yok.</div>
                  )}
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {lists.map((l) => (
                      <button key={l.id} onClick={() => addToList(l.id)}
                        className="w-full text-left px-3 py-2 rounded
                                   hover:bg-panel border border-transparent hover:border-border
                                   text-sm flex justify-between">
                        <span>{l.name}</span>
                        <span className="text-muted text-xs">{l.itemCount} öğe</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="text-xs text-muted mb-2">Yeni liste oluştur:</div>
                    <div className="flex gap-2">
                      <input value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Liste adı"
                        className="flex-1 bg-panel border border-border rounded-md
                                   px-3 py-1.5 text-sm" />
                      <button onClick={createListAndAdd}
                        className="px-3 py-1.5 bg-accent text-black rounded-md
                                   text-sm font-semibold">
                        Oluştur + Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 text-sm text-muted">
              Puan vermek, yorum yazmak ve listeye eklemek için
              {' '}<Link href="/login" className="text-accent underline">giriş yap</Link>.
            </div>
          )}
        </div>
      </section>

      {/* Yorumlar */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Yorumlar</h2>

        {user && (
          <form onSubmit={submitComment} className="mb-5">
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              rows={3} placeholder="Bu yapım hakkında ne düşünüyorsun?"
              className="w-full bg-card border border-border rounded-md px-3 py-2
                         focus:outline-none focus:border-accent" />
            <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
              <button type="button"
                onClick={() => setIsSpoiler(!isSpoiler)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                           ${isSpoiler
                             ? 'bg-red-500/20 border-red-500 text-red-300'
                             : 'border-border text-muted hover:bg-card'}`}>
                {isSpoiler ? '⚠ Spoiler içerir (aktif)' : '⚠ Spoiler içerir mi?'}
              </button>
              <button className="px-4 py-1.5 bg-accent text-black rounded-md font-semibold">
                Gönder
              </button>
            </div>
            {isSpoiler && (
              <p className="text-xs text-red-300 mt-2">
                Bu yorum spoiler etiketiyle paylaşılacak; diğer kullanıcılara
                "spoiler içeriyor" uyarısıyla gösterilecek, açmak için onay isteyecek.
              </p>
            )}
          </form>
        )}

        <div className="space-y-3">
          {comments.length === 0 && (
            <div className="text-muted">Henüz yorum yok. İlk yorumu sen yaz.</div>
          )}
          {buildCommentTree(comments).map((root) => (
            <CommentItem
              key={root.id}
              node={root}
              depth={0}
              onAdd={(c) => {
                setComments([...comments, c]);
                toast('Yanıt eklendi', 'success');
              }}
              onDelete={(deletedId) => {
                setComments(comments.filter((x) =>
                  x.id !== deletedId && x.parentCommentId !== deletedId));
                toast('Yorum silindi', 'success');
              }}
              onLike={likeComment}
              liked={likedComments}
              revealed={revealedSpoilers}
              onReveal={revealSpoiler}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs uppercase tracking-wide">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * Düz yorum listesini parent-child ağacına çevirir.
 * En yeni yorumlar üstte, yanıtlar kronolojik (eskiden yeniye) sıralanır.
 */
function buildCommentTree(flat: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  // Önce tüm node'ları map'e koy
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  // Sonra parent-child ilişkisini kur
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentCommentId && map.has(c.parentCommentId)) {
      map.get(c.parentCommentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  // Kök yorumlar: en yeni en üstte
  roots.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Yanıtlar: eskiden yeniye (sohbet akışı)
  const sortReplies = (n: CommentNode) => {
    n.replies.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    n.replies.forEach(sortReplies);
  };
  roots.forEach(sortReplies);

  return roots;
}
