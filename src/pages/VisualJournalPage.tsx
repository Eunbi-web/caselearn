// VISUAL JOURNAL — pictures, scraps & loose notes, arranged like a desk
// that doesn't believe in frames. Journal posts live as taped polaroids.

import { useState } from 'react';
import { Photo } from '../components/Photo';
import { PageHero } from '../components/UI';
import { useJournal, addPost, savePostEdit, deletePost } from '../state/journal';
import type { JournalPost } from '../data/extras';

function PostCard({ post, index }: { post: JournalPost; index: number }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const tilt = index % 3 === 0 ? 'vj-tilt-l' : index % 3 === 1 ? 'vj-tilt-r' : 'vj-tilt-l';

  return (
    <figure className={`polaroid vj-polaroid ${tilt}`}>
      <span className="tape tape-top" aria-hidden="true" />
      <span className="polaroid-window" style={{ display: 'block', aspectRatio: '1 / 1.08' }}>
        <Photo name={`journal-${post.id}`} icon="camera" label={post.title} editable eager={index < 2} />
      </span>
      {edit ? (
        <figcaption style={{ display: 'grid', gap: 8, paddingTop: 12 }}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} style={{ border: '1px dashed var(--line)', padding: '6px 8px', font: '700 13px var(--font-mono)' }} />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} style={{ border: '1px dashed var(--line)', padding: '6px 8px', font: '12px var(--font-mono)', resize: 'vertical' }} />
          <span className="vj-post-tools">
            <button type="button" className="btn btn-solid" onClick={() => { savePostEdit(post.id, { title, body }); setEdit(false); }}>Save ✓</button>
            <button type="button" className="btn" onClick={() => { setTitle(post.title); setBody(post.body); setEdit(false); }}>Cancel</button>
          </span>
        </figcaption>
      ) : (
        <figcaption>
          <span className="vj-date">{post.dateLabel}</span>
          <span style={{ font: '700 15px var(--font-serif)', display: 'block' }}>{post.title}</span>
          {post.body && <span className="vj-body-text" style={{ display: 'block', marginTop: 6, maxWidth: '100%' }}>{post.body}</span>}
          <span className="vj-post-tools">
            <button type="button" className="photo-edit-btn" onClick={() => setEdit(true)}>edit ✎</button>
            <button
              type="button"
              className="photo-edit-btn photo-edit-remove"
              title="Remove this update"
              onClick={() => { if (window.confirm(`Remove “${post.title}”?`)) deletePost(post.id); }}
            >
              ✕
            </button>
          </span>
        </figcaption>
      )}
    </figure>
  );
}

export function VisualJournalPage() {
  const posts = useJournal();
  const [first, ...rest] = posts;

  return (
    <div>
      <PageHero
        num="04"
        kicker="pictures, scraps & visual notes"
        title="Visual journal"
        sub="A place for the images that don’t need a frame around them."
      />

      <div className="sheet-pad">
        <div className="vj-scatter">
          <div className="vj-row">
            <section className="paper-note vj-note-card vj-tilt-l">
              <span className="note-label">cut-out study / 01</span>
              <p>no white box — just the art, floating on the page ✳</p>
            </section>

            <figure className="vj-cut">
              <Photo name="visual-cutout" icon="user" label="A small cut-out character drawing" className="photo" />
              <span className="vj-caption">small cut-out / transparent PNG</span>
            </figure>
          </div>

          <div className="vj-row">
            {first && <PostCard post={first} index={0} />}

            <div>
              <h2 className="vj-title-big">
                visual
                <br />
                fragments
                <span className="spark" aria-hidden="true">✳</span>
              </h2>
            </div>

            {rest[0] && <PostCard post={rest[0]} index={1} />}
          </div>

          <div className="vj-row">
            <div className="vj-sticky-col">
              <span className="vj-sticky-num">{String(posts.length + 1).padStart(2, '0')}</span>
              <span className="sticky-note">collect it<br />as you go</span>
            </div>

            <div className="vj-scrap">
              <button
                type="button"
                className="scrap-paper"
                title="Add a new visual update"
                onClick={() => addPost()}
              >
                <span style={{ display: 'inline-block', marginTop: '42%' }}>room for another<br />image — tap to add</span>
              </button>
            </div>

            {rest.slice(1).map((post, index) => <PostCard key={post.id} post={post} index={index + 2} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
