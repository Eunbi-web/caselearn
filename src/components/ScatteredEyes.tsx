// The wandering eyeball-cluster GIF from miko's straw.page — scattered
// across the open wall space of every page at different sizes, angles and
// paces so the black wall feels alive. Purely decorative: pointer-events
// are off and the eyes sit under the paper, never on top of it.

const BASE = import.meta.env.BASE_URL;
const EYE_SRC = `${BASE}photos/straw-eye-a.gif`;

export interface EyeSpot {
  /** % down the host page, or any CSS length — 'top' as vh works too */
  top: string;
  left?: string;
  right?: string;
  /** rendered width, CSS length (poke eyes are sized by CSS instead) */
  size?: string;
  /** base tilt in degrees — every eye sits at its own angle */
  rotate: number;
  /** seconds offset so the drifts never run in lockstep */
  drift?: number;
  /** mirrored copy so two eyes never look like duplicates */
  flip?: boolean;
  /** slow lazy rotation instead of the bob, for the big ones */
  spin?: boolean;
  z?: number;
  eager?: boolean;
  /**
   * wall-poke eye: absolutely positioned but shifted out of the 1040px
   * content column into the black margin ('l' / 'r'). Its top is still
   * relative to the host page, so it scrolls with the page content while
   * never sitting on top of it. Hidden below 1150px where the margin goes.
   */
  poke?: 'l' | 'r';
}

export function ScatteredEyes({ spots }: { spots: EyeSpot[] }) {
  return (
    <div className="eye-scatter-layer" aria-hidden="true">
      {spots.map((spot, index) => (
        <img
          key={index}
          className={`eye-scatter ${spot.poke === 'l' ? 'eye-poke-l' : ''} ${spot.poke === 'r' ? 'eye-poke-r' : ''} ${spot.spin ? 'eye-spin' : 'eye-bob'}`}
          src={EYE_SRC}
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
            animationDelay: `${(spot.drift ?? 0) * -1}s`,
          }}
        />
      ))}
    </div>
  );
}
