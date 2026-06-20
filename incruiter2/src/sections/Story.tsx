import { useEffect, useState } from 'react';
import { storyClock } from '../lib/storyClock';
import Counter from '../components/Counter';
import MagneticButton from '../components/MagneticButton';
import {
  brand,
  problem,
  turn,
  platform,
  products,
  proof,
  vision,
  cta,
} from '../data/content';

type BeatProps = { active: boolean };
type Align = 'center' | 'left' | 'right';
type Beat = { align?: Align; render: (p: BeatProps) => JSX.Element };

/**
 * The single focal stage. One beat at a time, crossfading by scroll. Statement beats sit
 * centred for rhythm; the products are staged alternately left/right — a dynamic gallery
 * that also keeps the film's centre subject in view. A lead-in beat guides the viewer in.
 */
const BEATS: Beat[] = [
  // Problem (tension)
  { render: () => <h2 className="h-statement">{problem.title}</h2> },

  // Turn (relief)
  {
    render: () => (
      <>
        <span className="turn__bar" aria-hidden="true" />
        <h2 className="h-statement text-grad">{turn.title}</h2>
      </>
    ),
  },

  // Lead-in — guides the viewer into the product showcase
  {
    render: () => (
      <>
        <p className="eyebrow">{platform.eyebrow}</p>
        <h2 className="h-statement">{platform.title}</h2>
      </>
    ),
  },

  // Products — staged alternately left / right
  ...products.map(
    (prod, i): Beat => ({
      align: i % 2 === 0 ? 'left' : 'right',
      render: () => (
        <div className="beat__product" style={{ ['--accent' as string]: prod.accent }}>
          <span className="beat__product-index">
            {String(i + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
          </span>
          <h2 className="beat__product-name">{prod.name}</h2>
          <p className="beat__product-line">{prod.line}</p>
        </div>
      ),
    }),
  ),

  // Proof (conviction)
  {
    render: ({ active }) => (
      <>
        <div className="beat__proof-grid">
          {proof.stats.map((s) => (
            <div className="beat__proof-cell" key={s.label}>
              <span className="proof__num">
                <Counter to={s.to} suffix={s.suffix} decimals={s.decimals} active={active} />
              </span>
              <span className="proof__label">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="beat__trust">{proof.trust}</p>
      </>
    ),
  },

  // Vision
  { render: () => <h2 className="h-statement">{vision.title}</h2> },

  // CTA
  {
    render: () => (
      <>
        <h2 className="h-hero">{cta.title}</h2>
        <MagneticButton href={brand.demoUrl}>
          {cta.button}
          <span className="magnetic__arrow" aria-hidden="true">
            →
          </span>
        </MagneticButton>
        <p className="cta__memory">{cta.memory}</p>
      </>
    ),
  },
];

const VH_PER_BEAT = 220;

export default function Story({ entered }: { entered: boolean }) {
  const N = BEATS.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    return storyClock.subscribe((p) => {
      const i = Math.min(N - 1, Math.max(0, Math.floor(p * N + 0.0001)));
      setActive((prev) => (prev === i ? prev : i));
    });
  }, [N]);

  return (
    <div id="story" className="story" style={{ height: `${N * VH_PER_BEAT}vh` }}>
      <div className={`story__stage${entered ? '' : ' is-idle'}`}>
        {BEATS.map((beat, i) => (
          <article
            key={i}
            className={
              'beat' +
              ` beat--${beat.align ?? 'center'}` +
              (i === active ? ' is-active' : '') +
              (i < active ? ' is-past' : '')
            }
            aria-hidden={i === active ? undefined : true}
          >
            <div className="beat__inner">{beat.render({ active: i === active })}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
