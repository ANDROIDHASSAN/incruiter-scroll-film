import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global defaults: snappy but smooth easing, GPU-friendly.
gsap.defaults({ ease: 'power3.out', duration: 1 });

// Avoid ScrollTrigger thrashing on mobile browser-chrome resize.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };
