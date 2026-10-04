import { useState } from 'react';
import { artworks } from '../data/extras';
import { photoSaveHint } from '../lib/supabase';
import { addPost, deletePost, savePostEdit, useJournal } from '../state/journal';
import { formatDateLabel, todayIso } from '../state/edits';
import { Photo } from '../components/Photo';
import type { Navigate } from '../components/UI';

/** ART WORKS → PORTFOLIO — mirrors the linked page: lavender card, script
    subtitle, rule, work-in-progress line, then the artwork gallery. */
export function PortfolioPage({ navigate }: { navigate: Navigate }) {  return (
    <main className="shell page-shell extras-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>← CASE FILE</button><span>/</span><span>EXTRAS / ART WORKS</span></div>
      <div className="menu-card menu-extras extras-wide">
        <h1 className="card-heading">⋆ PORTFOLIO ⋆</h1>
        <p className="card-script">here is a compilation of my artworks in general</p>
        <div className="card-rule" />
        <p className="portfolio-status">STILL A WORK IN PROGRESS</p>
        <div className="gallery">
          {artworks.map((artwork) => (
            <figure key={artwork.slot} className="artwork">
              <Photo name={artwork.slot} icon="star" label={artwork.label} editable eager={artwork.slot === 'artwork-01'} />
            </figure>
          ))}
        </div>
        <p className="portfolio-hint">hover a frame to upload an artwork — {photoSaveHint} · or drop files into <b>public/photos/artwork-01…06.jpg</b></p>
      </div>
    </main>
  );
}

/** LIFE UPDATES → JOURNAL — dated updates you can write, edit and delete. */
export function JournalPage({ navigate }: { navigate: Navigate }) {
  const posts = useJournal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ date: string; title: string; body: string } | null>(null);

  const startEdit = (post: { id: string; date: string; title: string; body: string }) => {
    setEditingId(post.id);
    setDraft({ date: post.date, title: post.title, body: post.body });
  };

  const startNew = () => {
    const post = addPost();
    setEditingId(post.id);
    setDraft({ date: post.date, title: post.title, body: post.body });
  };

  const save = (id: string) => {
    if (!draft) return;
    const date = draft.date || todayIso();
    savePostEdit(id, { date, dateLabel: formatDateLabel(date), title: draft.title.trim() || 'UNTITLED UPDATE', body: draft.body.trim() });
    setEditingId(null);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (window.confirm('Delete this update? This cannot be undone.')) deletePost(id);
  };

  return (
    <main className="shell page-shell extras-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>← CASE FILE</button><span>/</span><span>EXTRAS / LIFE UPDATES</span></div>
      <div className="menu-card menu-extras extras-wide">
        <h1 className="card-heading">⋆ JOURNAL ⋆</h1>
        <p className="card-script">life updates, written down as they happen</p>
        <div className="card-rule" />
        <div className="journal-list">
          {posts.map((post) => editingId === post.id && draft ? (
            <article key={post.id} className="journal-card is-editing">
              <div className="form-row">
                <label className="form-field"><span>DATE</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
                <label className="form-field form-grow"><span>TITLE</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              </div>
              <label className="form-field"><span>THE UPDATE</span><textarea rows={4} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>
              <div className="journal-actions-row">
                <button className="button button-primary button-small" onClick={() => save(post.id)}>SAVE UPDATE</button>
                <button className="button button-ghost button-small" onClick={() => { setEditingId(null); setDraft(null); }}>CANCEL</button>
                <button className="button button-ghost button-small journal-delete" onClick={() => remove(post.id)}>✕ DELETE</button>
              </div>
            </article>
          ) : (
            <article key={post.id} className="journal-card">
              <div className="journal-top">
                <span className="journal-date">⋆ {post.dateLabel}</span>
                <span className="journal-tools">
                  <button className="journal-tool" onClick={() => startEdit(post)}>✎ EDIT</button>
                  <button className="journal-tool journal-tool-danger" onClick={() => remove(post.id)} title="Delete this update">✕</button>
                </span>
              </div>
              <h3>{post.title}</h3>
              {post.body && <p>{post.body}</p>}
            </article>
          ))}
        </div>
        <button className="button button-primary journal-new" onClick={startNew}>+ NEW UPDATE</button>
      </div>
    </main>
  );
}
