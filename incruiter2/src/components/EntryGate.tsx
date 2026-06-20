import { brand, intro } from '../data/content';

type Props = {
  hidden: boolean;
  onEnter: () => void;
};

/**
 * The locked landing — built to create anticipation. A live badge, a cinematic
 * staggered reveal, three proof-stats to spark desire, and one bright, glowing CTA.
 * No scroll prompt here; that guidance only appears once they're inside.
 */
export default function EntryGate({ hidden, onEnter }: Props) {
  return (
    <div className={`gate${hidden ? ' gate--hidden' : ''}`} aria-hidden={hidden}>
      <div className="gate__inner">
        <p className="gate__badge">
          <span className="gate__badge-dot" aria-hidden="true" />
          {intro.eyebrow}
        </p>

        <h1 className="h-hero gate__title">{brand.tagline}</h1>

        <div className="gate__stats" aria-hidden="true">
          {intro.stats.map((s) => (
            <span className="gate__stat" key={s.k}>
              <b>{s.v}</b> {s.k}
            </span>
          ))}
        </div>

        <button className="btn-enter" type="button" onClick={onEnter}>
          <span className="btn-enter__label">{intro.enter}</span>
          <span className="btn-enter__arrow" aria-hidden="true">
            →
          </span>
        </button>

        <p className="gate__teaser">{intro.teaser}</p>
      </div>
    </div>
  );
}
