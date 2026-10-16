// PROFILE — a torn-paper spread: scraps of info pinned, layered and rotated
// on the desk wood, like miko's profile section. Contents are unchanged —
// edit mode still saves the profile (table / localStorage) on Done.

import { useEffect, useState } from 'react';
import { Photo } from '../components/Photo';
import { ScatteredEyes } from '../components/ScatteredEyes';
import { useProfile, saveProfile, type Profile } from '../state/profile';

const BASE = import.meta.env.BASE_URL;

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

/** A torn-sheet scrap sized by its content, with text (or anything) on top. */
function Scrap({ style, className = '', children, eager = false, z = 3 }: { style: React.CSSProperties & { left: string; top: string; width: string; transform: string }; className?: string; children: React.ReactNode; eager?: boolean; z?: number }) {
  return (
    <div className={`prof-piece ${className}`} style={{ ...style, zIndex: z }}>
      <img className="prof-scrap-bg" src={`${BASE}photos/straw-torn-sheet.png`} alt="" loading={eager ? 'eager' : 'lazy'} draggable={false} />
      <div className="prof-scrap-copy">{children}</div>
    </div>
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
      <section className="prof-sheet" aria-label="profile collage">
        <div className="prof-board">
          {/* the title scrap — "Profile" stays put */}
          <Scrap style={{ left: '3.5%', top: '2.5%', width: '27%', transform: 'rotate(-5deg)' }} z={5} eager>
            <span className="prof-kicker">01 · a person behind the paper</span>
            <h1 className="prof-title">Profile</h1>
            <span className="prof-sub">a few notes about me, pinned up where I can find them.</span>
          </Scrap>

          {/* edit controls floating on the desk */}
          <div className="prof-editbar" style={{ left: '66%', top: '3.5%', zIndex: 8 }}>
            <span className="mono-tip prof-tip">you can make this page yours</span>
            {editing ? (
              <>
                <span className="editing-hint prof-hint">click the text to change it — saved to the database</span>
                <button type="button" className="btn btn-solid" onClick={done}>Done editing ✓</button>
              </>
            ) : (
              <button type="button" className="btn" onClick={() => setEditing(true)}>Edit profile notes ✎</button>
            )}
          </div>

          {/* portrait — the photo with the scrap pinned over its corner */}
          <div className="prof-piece" style={{ left: '4.5%', top: '17%', width: '34.5%', transform: 'rotate(-4deg)', zIndex: 2 }}>
            <figure className="prof-photo prof-photo-square">
              <Photo name="profile-photo" icon="user" label="Portrait of Fiona" editable eager />
            </figure>
          </div>
          <div className="prof-piece" style={{ left: '28.5%', top: '19.5%', width: '20%', transform: 'rotate(6.5deg)', zIndex: 3 }}>
            <img className="straw-scrap" src={`${BASE}photos/straw-torn-sheet.png`} alt="" draggable={false} />
            <div className="prof-photo-pin">
              <span className="prof-scrap-label">photo / image</span>
              <span className="prof-scrap-sub">swap in your portrait when ready</span>
            </div>
          </div>

          {/* the art — tall cut-out with the straw-page caption treatment */}
          <div className="prof-piece" style={{ left: '76%', top: '52%', width: '20%', transform: 'rotate(4deg)', zIndex: 2 }}>
            <figure className="prof-photo prof-photo-tall">
              <Photo name="profile-art" icon="star" label="A favorite artwork kept from the scrapbook" editable eager />
            </figure>
            <span className="prof-art-label">art from the scrapbook</span>
          </div>

          {/* 02 — about, tucked under the edit notes, clear of the art */}
          <Scrap style={{ left: '56%', top: '21%', width: '37%', transform: 'rotate(4deg)' }} z={4} eager>
            <span className="prof-kicker num-has">02 — about</span>
            <h3 className="prof-heading">A small about-me</h3>
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
          </Scrap>

          {/* 01 — hello, layered on top of the portrait's lower corner */}
          <Scrap style={{ left: '6%', top: '48%', width: '38%', transform: 'rotate(-6deg)' }} z={6} eager>
            <span className="prof-kicker num-has num-yellow">01 — hello</span>
            <h2 className="prof-name"><EditableText value={draft.name} onChange={(name) => patch({ name })} editing={editing} /></h2>
            <p className="prof-body">
              <EditableText value={draft.noteText} onChange={(noteText) => patch({ noteText })} editing={editing} multiline />
            </p>
            <span className="scribble hello-scribble prof-motto">
              {'~ '}
              <EditableText value={draft.motto} onChange={(motto) => patch({ motto })} editing={editing} />
              {' ~'}
            </span>
          </Scrap>

          {/* loose note piles keeping the desk messy-but-neat */}
          <img className="straw-scrap" src={`${BASE}photos/note-pile-3.png`} alt="" style={{ left: '56%', top: '73%', width: '17%', transform: 'rotate(38deg)', zIndex: 1 }} draggable={false} loading="lazy" />
          <img className="straw-scrap" src={`${BASE}photos/note-pile-1.png`} alt="" style={{ left: '8%', top: '73.5%', width: '15%', transform: 'rotate(-40deg) scaleX(-1)', zIndex: 1 }} draggable={false} loading="lazy" />
          <img className="straw-scrap" src={`${BASE}photos/note-pile-2.png`} alt="" style={{ left: '56%', top: '2.8%', width: '14%', transform: 'rotate(75deg)', zIndex: 1 }} draggable={false} loading="lazy" />
          <img className="straw-scrap" src={`${BASE}photos/note-pile-4.png`} alt="" style={{ left: '32%', top: '85%', width: '15%', transform: 'rotate(140deg)', zIndex: 1 }} draggable={false} loading="lazy" />
          <img className="straw-scrap" src={`${BASE}photos/note-pile-1.png`} alt="" style={{ left: '79.5%', top: '88.5%', width: '14%', transform: 'rotate(-15deg) scaleX(-1)', zIndex: 1 }} draggable={false} loading="lazy" />
        </div>

        {/* eyes loose on the profile board — only on measured-empty pockets:
            the top strip between scraps, the mid gap, and the wide clear
            band right of the hello note. Never over paper. */}
        <ScatteredEyes
          spots={[
            { top: '2%', left: '44%', size: 'clamp(72px, 7.5vw, 118px)', rotate: 20, flip: true, drift: 0, z: 0 },
            { top: '40%', left: '46.5%', size: 'clamp(86px, 9vw, 132px)', rotate: -34, drift: 2.4, z: 0 },
            { top: '55%', left: '46%', size: 'clamp(130px, 14vw, 210px)', rotate: 10, flip: true, spin: true, drift: 1, z: 0 },
          ]}
        />
      </section>
    </div>
  );
}
