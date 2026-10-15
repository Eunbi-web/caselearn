// PROFILE — notes about the person behind the paper. Edit mode turns the
// texts into dashed editable fields ("click the text to change it") and
// saves to the profile table / localStorage on Done.

import { useEffect, useState } from 'react';
import { Photo } from '../components/Photo';
import { PageHero } from '../components/UI';
import { useProfile, saveProfile, type Profile } from '../state/profile';

function EditableText({ value, onChange, editing, className = '', multiline = false }: { value: string; onChange: (next: string) => void; editing: boolean; className?: string; multiline?: boolean }) {
  if (!editing) return <span className={className}>{value}</span>;
  if (multiline) {
    return (
      <textarea
        className={`editable ${className}`}
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: '100%', background: 'transparent', border: 0, font: 'inherit', color: 'inherit', resize: 'vertical' }}
      />
    );
  }
  return (
    <input
      className={`editable ${className}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ width: '100%', background: 'transparent', border: 0, font: 'inherit', color: 'inherit' }}
    />
  );
}

export function ProfilePage() {
  const profile = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);

  // re-sync the draft when the remote profile loads
  useEffect(() => { if (!editing) setDraft(profile); }, [profile, editing]);

  const patch = (part: Partial<Profile>) => setDraft((current) => ({ ...current, ...part }));

  const done = () => {
    saveProfile(draft);
    setEditing(false);
  };

  return (
    <div className={editing ? 'editing' : ''}>
      <PageHero num="01" kicker="a person behind the paper" title="Profile" sub="A few notes about me, pinned up where I can find them." />

      <div className="sheet-pad">
        <div className="edit-bar">
          <span className="mono-tip">you can make this page yours</span>
          <span style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {editing ? (
              <>
                <span className="editing-hint">click the text to change it — saved to the database</span>
                <button type="button" className="btn btn-solid" onClick={done}>Done editing ✓</button>
              </>
            ) : (
              <button type="button" className="btn" onClick={() => setEditing(true)}>Edit profile notes ✎</button>
            )}
          </span>
        </div>

        <div className="profile-grid">
          <figure className="polaroid profile-photo-fig">
            <span className="tape tape-top" aria-hidden="true" />
            <div className="polaroid-window">
              <Photo name="profile-photo" icon="user" label="Portrait of Fiona" editable eager />
            </div>
            <span className="fig-label">photo / image</span>
            <span className="fig-sub">swap in your portrait when ready</span>
          </figure>

          <div className="profile-notes">
            <section className="paper-note note-hello">
              <span className="note-label">01 — hello</span>
              <h2><EditableText value={draft.name} onChange={(name) => patch({ name })} editing={editing} /></h2>
              <p>
                <EditableText value={draft.noteText} onChange={(noteText) => patch({ noteText })} editing={editing} multiline />
              </p>
              <span className="scribble hello-scribble">
                {'~ '}
                <EditableText value={draft.motto} onChange={(motto) => patch({ motto })} editing={editing} />
                {' ~'}
              </span>
            </section>

            <section className="paper-note">
              <span className="note-label">02 — about</span>
              <h3>A small about-me</h3>
              <dl className="id-rows">
                <div>
                  <dt>SIGN</dt>
                  <dd><EditableText value={draft.sign} onChange={(sign) => patch({ sign })} editing={editing} /></dd>
                </div>
                <div>
                  <dt>BORN</dt>
                  <dd><EditableText value={draft.dob} onChange={(dob) => patch({ dob })} editing={editing} /></dd>
                </div>
                <div>
                  <dt>CITIZEN</dt>
                  <dd><EditableText value={draft.citizen} onChange={(citizen) => patch({ citizen })} editing={editing} /></dd>
                </div>
                <div>
                  <dt>CASE NO.</dt>
                  <dd>{draft.caseNumber}</dd>
                </div>
              </dl>
              <div className="fandom-chips">
                {(editing
                  ? draft.fandoms.join('•').split('•').map((chip) => chip.trim())
                  : draft.fandoms
                ).filter(Boolean).map((chip, index) => (
                  <span className="chip" key={index}>
                    {editing ? (
                      <input
                        className="editable"
                        value={chip}
                        onChange={(event) => {
                          const chips = [...draft.fandoms];
                          chips[index] = event.target.value;
                          patch({ fandoms: chips });
                        }}
                        style={{ border: 0, background: 'transparent', font: 'inherit' }}
                      />
                    ) : chip}
                  </span>
                ))}
                {editing && (
                  <button type="button" className="chip" onClick={() => patch({ fandoms: [...draft.fandoms, 'new fandom'] })}>+ chip</button>
                )}
              </div>
            </section>

            <section className="note-extra">
              <span className="note-label">03 — extra bits</span>
              <h3>Currently curious about…</h3>
              <p style={{ font: '15px var(--font-serif)', lineHeight: 1.6 }}>
                <EditableText value={draft.extra} onChange={(extra) => patch({ extra })} editing={editing} multiline />
              </p>
              <span className="sticky-spark" aria-hidden="true">✳</span>
            </section>
          </div>
        </div>

        <div className="profile-art">
          <span className="art-label">art from the scrapbook</span>
          <figure className="polaroid">
            <span className="tape tape-corner" aria-hidden="true" />
            <div className="polaroid-window">
              <Photo name="profile-art" icon="star" label="A favorite artwork kept from the scrapbook" editable eager />
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
}
