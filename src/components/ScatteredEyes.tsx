// The wandering eyeball-cluster GIF from miko's straw.page — scattered
// across the open wall space of every page at different sizes, angles and
// paces so the black wall feels alive. Purely decorative: pointer-events
// are off and the eyes sit under the paper, never on top of it.

const BASE = import.meta.env.BASE_URL;
const EYE_SRC = `${BASE}photos/straw-eye-a.gif`;

export interface EyeSpot {
  /** % down the host page */
  top: string;
  left?: string;
  right?: string;
  /** rendered width, CSS length */
  size: string;
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
}

export function ScatteredEyes({ spots }: { spots: EyeSpot[] }) {
  return (
    <div className="eye-scatter-layer" aria-hidden="true">
      {spots.map((spot, index) => (
        <img
          key={index}
          className={`eye-scatter ${spot.spin ? 'eye-spin' : 'eye-bob'}`}
          src={EYE_SRC}
          alt=""
          loading={spot.eager ? 'eager' : 'lazy'}
          draggable={false}
          style={{
            top: spot.top,
            left: spot.left,
            right: spot.right,
            width: spot.size,
            zIndex: spot.z ?? 1,
            transform: `rotate(${spot.rotate}deg) scaleX(${spot.flip ? -1 : 1})`,
            animationDelay: `${(spot.drift ?? 0) * -1}s`,
          }}
        />
      ))}
    </div>
  );
}
