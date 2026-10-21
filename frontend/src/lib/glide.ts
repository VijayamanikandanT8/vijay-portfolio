import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

// duration = BASE + (screens travelled × PER_SCREEN), kept between MIN and MAX seconds.
// Bigger PER_SCREEN = slower, so you see every page pass by.
const BASE = 0.7;
const PER_SCREEN = 0.16;
const MIN = 0.9;
const MAX = 4.5;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

let stopCurrent: (() => void) | null = null;

export function sectionY(href: string): number | null {
  const id = href.replace(/^#/, "");
  if (id === "home") return 0;
  const pinned = ScrollTrigger.getById(`${id}-pin`);
  if (pinned) return pinned.start;
  const cert = id === "certifications" ? ScrollTrigger.getById("certifications-scroll") : undefined;
  if (cert) return cert.start;
  const el = document.getElementById(id);
  if (!el) return null;
  return el.getBoundingClientRect().top + window.scrollY;
}

export function glideTo(y: number): Promise<void> {
  stopCurrent?.();

  const html = document.documentElement;
  const max = Math.max(0, html.scrollHeight - window.innerHeight);
  const target = clamp(Math.round(y), 0, max);
  const distance = Math.abs(target - window.scrollY);
  if (distance < 2) return Promise.resolve();

  const lenis = window.__lenis;
  if (!lenis) {
    window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
    return Promise.resolve();
  }

  const duration = clamp(BASE + (distance / window.innerHeight) * PER_SCREEN, MIN, MAX);

  return new Promise<void>((resolve) => {
    let done = false;
    let safety = 0;
    let off: () => void = () => {};

    const finish = () => {
      if (done) return;
      done = true;
      off();
      window.clearTimeout(safety);
      html.classList.remove("is-navigating");
      if (stopCurrent === finish) stopCurrent = null;
      resolve();
    };

    stopCurrent = finish;
    html.classList.add("is-navigating");
    off = lenis.on("virtual-scroll", finish);
    safety = window.setTimeout(finish, (duration + 0.6) * 1000);

    lenis.scrollTo(target, { duration, easing: easeInOutSine, lock: false, onComplete: finish });
  });
}

export function glideToSection(href: string): Promise<void> {
  const y = sectionY(href);
  return y === null ? Promise.resolve() : glideTo(y);
}