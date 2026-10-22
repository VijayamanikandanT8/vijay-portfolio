import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { isTouch, markLite, isLow } from "./perf";

gsap.registerPlugin(ScrollTrigger);

// Don't re-measure the whole page on every "resize" (locking the page removes
// the scrollbar, which fires one). We refresh manually below instead.
ScrollTrigger.config({
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  limitCallbacks: true,
  ignoreMobileResize: true, // address-bar show/hide on phones no longer re-measures the page
});

const LOCK_CLASSES = ["resume-lock", "intro-lock", "proj-lock", "edu-lock", "cert-lock", "ach-lock", "svc-lock"];
const isLocked = () => LOCK_CLASSES.some((c) => document.body.classList.contains(c));

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function initSmoothScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Mouse wheel / trackpad: eased glide. Touch: set SYNC_TOUCH to false to use the
  // phone's own native scrolling instead (pinned sections may then shake slightly).
  const SYNC_TOUCH = !isLow();
  const lenis = new Lenis({
    lerp: 0.14,
    smoothWheel: true,
    wheelMultiplier: 1.7,
    touchMultiplier: 1.5,
    syncTouch: isTouch && SYNC_TOUCH,
    syncTouchLerp: 0.1,
    touchInertiaExponent: 1.7,
    allowNestedScroll: true,
    autoRaf: false,
  });
  window.__lenis = lenis;

  // Keep GSAP ScrollTrigger (About pin) and Lenis on the same clock.
  // "is-scrolling" lets the CSS drop hover work while the page moves, and a tiny
  // frame-time sampler switches on lite mode by itself if scrolling is dropping frames.
  const html = document.documentElement;
  let scrolling = false;
  let idleTimer = 0;
  const onLenisScroll = () => {
    ScrollTrigger.update();
    if (!scrolling) {
      scrolling = true;
      html.classList.add("is-scrolling");
    }
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      scrolling = false;
      html.classList.remove("is-scrolling");
    }, 80);
  };
  lenis.on("scroll", onLenisScroll);

  let frames = 0;
  let slowFrames = 0;
  let badWindows = 0;
  const sample = (_t: number, dt: number) => {
    if (!scrolling || html.classList.contains("perf-lite")) return;
    frames++;
    if (dt > 34) slowFrames++;
    if (frames < 90) return;
    badWindows = slowFrames / frames > 0.22 ? badWindows + 1 : 0;
    frames = slowFrames = 0;
    if (badWindows >= 2) markLite(true);
  };
  gsap.ticker.add(sample);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Pause smooth scrolling while Projects / Education overlays lock the page.
  const syncLock = () => {
    const b = document.body.classList;
    if (LOCK_CLASSES.some((c) => b.contains(c))) lenis.stop();
    else {
      lenis.start();
      lenis.resize();
    }
  };
  const mo = new MutationObserver(syncLock);
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  syncLock();

  // One debounced refresh for REAL window resizes, never while a section is open.
  let resizeTimer = 0;
  const onResize = (e: Event) => {
    if (!e.isTrusted || isLocked()) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
  };
  window.addEventListener("resize", onResize);

  return () => {
    mo.disconnect();
    window.removeEventListener("resize", onResize);
    window.clearTimeout(resizeTimer);
    gsap.ticker.remove(tick);
    gsap.ticker.remove(sample);
    window.clearTimeout(idleTimer);
    html.classList.remove("is-scrolling");
    lenis.destroy();
    delete window.__lenis;
  };
}