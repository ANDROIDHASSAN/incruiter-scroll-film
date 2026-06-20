import { brand } from '../data/content';

/** Minimal fixed top nav: wordmark + a low-key demo link (revealed after entry). */
export default function Nav({ showCta = true }: { showCta?: boolean }) {
  return (
    <nav className="nav" aria-label="Primary">
      <a className="nav__brand" href="#top">
        <span className="nav__dot" aria-hidden="true" />
        {brand.name}
      </a>
      <a
        className={`nav__cta${showCta ? '' : ' nav__cta--hidden'}`}
        href={brand.demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={showCta ? 0 : -1}
      >
        Book a demo
      </a>
    </nav>
  );
}
