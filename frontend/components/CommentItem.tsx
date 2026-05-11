'use client';

import { useState } from 'react';
import { api, type Comment } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export type CommentNode = Comment & { replies: CommentNode[] };

type Props = {
  node: CommentNode;
  depth: number;
  onAdd: (newComment: Comment) => void;
  onDelete: (id: number) => void;
  onLike: (id: number) => void;
  liked: Set<number>;
  revealed: Set<number>;
  onReveal: (id: number) => void;
};

/**
 * Yorum + (gizli) yanıtlar.
 *
 * Yanıtlar varsayılan olarak gizlidir. Yorumun altında
 * "X yanıt göster ↓" butonu görünür. Tıklanınca yanıt zinciri
 * açılır (recursive — alt yanıtlar da kendi gizleme/gösterme
 * butonlarıyla gelir).
 */
export default function CommentItem({
  node, depth, onAdd, onDelete, onLike, liked, revealed, onReveal
}: Props) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);   // yanıtlar varsayılan gizli

  const isLiked = liked.has(node.id);
  const hidden  = node.isSpoiler && !revealed.has(node.id);
  const totalDescendants = countAllReplies(node);
  const hasReplies = totalDescendants > 0;
  const maxIndent = 4;
  const indentClass =
    depth === 0 ? '' :
    depth === 1 ? 'ml-6 sm:ml-10 border-l-2 border-border pl-4' :
                  'ml-4 sm:ml-6 border-l-2 border-border pl-3';

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setBusy(true);
    try {
      const c = await api.addComment(
        node.productionId, replyBody.trim(), replySpoiler, node.id);
      onAdd(c);
      setReplyBody('');
      setReplySpoiler(false);
      setShowReply(false);
      setExpanded(true);          // yanıt eklenince zinciri otomatik aç
    } catch (e: any) { alert('Yanıt gönderilemedi: ' + e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className={indentClass}>
      <article className={`bg-card border rounded-lg p-4 ${
        node.isSpoiler ? 'border-red-500/40' : 'border-border'
      }`}>
        <header className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{node.username}</span>
            {node.isSpoiler && (
              <span className="text-xs px-2 py-0.5 rounded-full
                               bg-red-500/20 text-red-300 border border-red-500/40">
                ⚠ Spoiler
              </span>
            )}
            {depth > 0 && (
              <span className="text-xs text-muted">↳ yanıt</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {new Date(node.createdAt).toLocaleString('tr-TR')}
            </span>
            {user?.role === 'Admin' && (
              <button
                onClick={async () => {
                  if (!confirm('Bu yorumu (ve tüm yanıtlarını) silmek istediğine emin misin?')) return;
                  try {
                    await api.adminDeleteComment(node.id);
                    onDelete(node.id);
                  } catch (e: any) { alert('Hata: ' + e.message); }
                }}
                className="text-xs px-2 py-0.5 rounded border border-red-500/40
                           text-red-400 hover:bg-red-500/10">
                Sil
              </button>
            )}
          </div>
        </header>

        {hidden ? (
          <div className="mt-3 bg-panel border border-red-500/30 rounded-md p-4 text-center">
            <p className="text-sm text-red-300 mb-2">
              ⚠ Bu yorum spoiler içeriyor.
            </p>
            <button onClick={() => onReveal(node.id)}
              className="text-xs px-3 py-1.5 rounded-md bg-red-500/20
                         text-red-300 border border-red-500/40 hover:bg-red-500/30">
              Yine de göster
            </button>
          </div>
        ) : (
          <p className="mt-2 leading-relaxed whitespace-pre-wrap">{node.body}</p>
        )}

        <footer className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onLike(node.id)}
            disabled={isLiked}
            className={`text-xs px-2 py-1 rounded border flex items-center gap-1
                       transition-colors
                       ${isLiked
                         ? 'bg-accent/20 border-accent text-accent cursor-default'
                         : 'border-border hover:bg-panel'}`}>
            <span>{isLiked ? '❤' : '♡'}</span>
            <span>{node.likeCount}</span>
          </button>

          {user && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs px-2 py-1 rounded border border-border
                         hover:bg-panel">
              {showReply ? '✕ İptal' : '↩ Yanıtla'}
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs px-2 py-1 rounded border border-accent2
                         text-accent2 hover:bg-card flex items-center gap-1">
              {expanded
                ? <>▲ Yanıtları gizle</>
                : <>▼ {totalDescendants} yanıt göster</>}
            </button>
          )}
        </footer>

        {showReply && user && (
          <form onSubmit={submitReply} className="mt-3 pt-3 border-t border-border">
            <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
              rows={2} placeholder={`@${node.username} kullanıcısına yanıt yaz...`}
              autoFocus
              className="w-full bg-panel border border-border rounded-md px-3 py-2
                         text-sm focus:outline-none focus:border-accent" />
            <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
              <button type="button"
                onClick={() => setReplySpoiler(!replySpoiler)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors
                           ${replySpoiler
                             ? 'bg-red-500/20 border-red-500 text-red-300'
                             : 'border-border text-muted hover:bg-card'}`}>
                {replySpoiler ? '⚠ Spoiler (aktif)' : '⚠ Spoiler içerir mi?'}
              </button>
              <button disabled={busy || !replyBody.trim()}
                className="px-3 py-1 bg-accent text-black rounded-md text-xs font-semibold
                           disabled:opacity-50">
                {busy ? 'Gönderiliyor...' : 'Yanıtla'}
              </button>
            </div>
          </form>
        )}
      </article>

      {/* Yanıtlar — sadece kullanıcı "göster" butonuna basınca render edilir */}
      {hasReplies && expanded && (
        <div className="mt-3 space-y-3">
          {node.replies.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              depth={Math.min(depth + 1, maxIndent)}
              onAdd={onAdd}
              onDelete={onDelete}
              onLike={onLike}
              liked={liked}
              revealed={revealed}
              onReveal={onReveal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Bir yorumun altındaki tüm yanıtları (alt yanıtlar dahil) sayar. */
function countAllReplies(node: CommentNode): number {
  return node.replies.reduce(
    (sum, child) => sum + 1 + countAllReplies(child), 0
  );
}
