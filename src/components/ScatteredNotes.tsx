// Miko's scribbled note piles — the loose torn-sheet scraps of the wall are
// these now. Pinned to the page like everything else, never over paper, and
// each one sits at its own angle. Purely decorative: pointer-events off.

const BASE = import.meta.env.BASE_URL;

export interface NoteSpot {
  /** % down the host page, or any CSS length */
  top: string;
  left?: string;
  right?: string;
  /** which pile photo, 1–4 */
  pile: 1 | 2 | 3 | 4;
  /** rendered width, CSS length (poke eyes are sized by CSS instead) */
  size?: string;
  /** base tilt in degrees */
  rotate: number;
  flip?: boolean;
  z?: number;
  eager?: boolean;
  /** wall-poke eye positioning: shifted out of the content column */
  poke?: 'l' | 'r';
}

export function ScatteredNotes({ spots }: { spots: NoteSpot[] }) {
  return (
    <div className="note-scatter-layer" aria-hidden="true">
      {spots.map((spot, index) => (
        <img
          key={index}
          className={`note-scatter ${spot.poke === 'l' ? 'eye-poke-l' : ''} ${spot.poke === 'r' ? 'eye-poke-r' : ''}`}
          src={`${BASE}photos/note-pile-${spot.pile}.png`}
          alt=""
          loading={spot.eager ? 'eager' : 'lazy'}
          draggable={false}
          style={{
            top: spot.top,
            left: spot.poke ? undefined : spot.left,
            right: spot.poke ? undefined : spot.right,
            width: spot.poke ? undefined : spot.size,
            zIndex: spot.z ?? 0,
            transform: `rotate(${spot.rotate}deg) scaleX(${spot.flip ? -1 : 1})`,
          }}
        />
      ))}
    </div>
  );
}
