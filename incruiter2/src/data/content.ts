export const brand = {
  name: 'InCruiter',
  tagline: 'Interviews, handled.',
  url: 'https://incruiter.com',
  demoUrl: 'https://incruiter.com/book-a-demo',
};

export const intro = {
  eyebrow: 'AI INTERVIEW PLATFORM',
  title: 'Interviews, handled.',
  stats: [
    { v: '4×', k: 'faster' },
    { v: '80%', k: 'cheaper' },
    { v: '600+', k: 'teams' },
  ],
  enter: 'Enter InCruiter',
  teaser: '30-second journey',
  hint: 'Scroll to explore',
};

export const problem = { title: 'Hiring is broken.' };

export const turn = { title: 'So we rebuilt it.' };

export const platform = { eyebrow: 'THE PLATFORM', title: 'Meet the products.' };

export type Product = { id: string; name: string; line: string; accent: string };
export const products: Product[] = [
  { id: 'incserve', name: 'IncServe', line: 'Expert interviewers, on demand.', accent: '#38E1FF' },
  { id: 'incbot', name: 'IncBot', line: 'AI screens every candidate.', accent: '#3B82F6' },
  { id: 'incvid', name: 'IncVid', line: 'Live interviews, cheat-proof.', accent: '#1E5BFF' },
  { id: 'incscreen', name: 'IncScreen', line: 'AI phone screening, automatic.', accent: '#5EEAD4' },
  { id: 'incfeed', name: 'IncFeed', line: 'Scheduling that runs itself.', accent: '#8B9CFF' },
  { id: 'incexit', name: 'IncExit', line: 'Know why they really leave.', accent: '#38E1FF' },
];

export type ProofStat = { to: number; suffix?: string; decimals?: number; label: string };
export const proof = {
  stats: [
    { to: 4, suffix: '×', label: 'faster' },
    { to: 80, suffix: '%', label: 'cheaper' },
    { to: 6, suffix: 'h', label: 'to feedback' },
  ] as ProofStat[],
  trust: 'EY · PwC · EXL · Dentsu',
};

export const vision = { title: 'Precision hiring, augmented by AI.' };

export const cta = {
  title: 'See it in action.',
  button: 'Book a demo',
  memory: 'InCruiter — interviews, handled.',
};
