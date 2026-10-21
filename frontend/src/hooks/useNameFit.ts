import { useEffect } from "react";

const BIG_FONT = 90; // only oversized "display" names are touched
const MIN_FONT = 28; // never shrink below this (px)

const squash = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/**
 * Finds every oversized heading that shows the visitor's name (even when it was
 * split into one <span> per letter) and keeps the WHOLE name on a single line
 * inside its container, so the last letters can never wrap onto a hidden
 * second line or get clipped.
 */
export function useNameFit(name: string | undefined) {
  useEffect(() => {
    if (!name) return;
    const full = squash(name);
    const first = squash(name.trim().split(/\s+/)[0] ?? "");
    if (!first) return;

    const SKIP = new Set(["SCRIPT", "STYLE", "SVG", "CANVAS", "VIDEO", "IMG", "PATH", "NOSCRIPT"]);

    const isName = (el: Element) => {
      if (SKIP.has(el.tagName.toUpperCase()) || el.childElementCount > 40) return false;
      const t = squash(el.textContent ?? "");
      return t.length > 0 && t.length <= full.length + 2 && t.startsWith(first);
    };

    const fit = (el: HTMLElement) => {
      const box = el.parentElement;
      if (!box) return;

      // back to the original size (stylesheet OR inline), then measure
      if (el.dataset.nameFitInline === undefined) el.dataset.nameFitInline = el.style.fontSize;
      el.style.fontSize = el.dataset.nameFitInline;
      el.style.whiteSpace = "nowrap";
      el.style.flexWrap = "nowrap";
      el.style.overflow = "visible";

      const cur = parseFloat(getComputedStyle(el).fontSize);
      const range = document.createRange();
      range.selectNodeContents(el);
      const textW = range.getBoundingClientRect().width;
      if (!textW || !cur) return;

      const bcs = getComputedStyle(box);
      const br = box.getBoundingClientRect();
      const padL = parseFloat(bcs.paddingLeft) || 0;
      const padR = parseFloat(bcs.paddingRight) || 0;
      const inner = br.width - padL - padR;
      const vw = document.documentElement.clientWidth;
      const edge = Math.max(16, br.left + padL);
      const avail = Math.min(inner, vw - edge * 2);

      const k = avail / textW;
      if (k < 1) {
        el.style.fontSize = `${Math.max(MIN_FONT, Math.floor(cur * k * 0.985))}px`;
      }
      el.dataset.nameFit = "1";
    };

    const run = () => {
      const all = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
      const hits = all.filter((el) => {
        if (el.closest(".nav, nav, .nw")) return false; // .nw = NameWordmark fits itself
        if (!el.dataset.nameFit && parseFloat(getComputedStyle(el).fontSize) < BIG_FONT) return false;
        return isName(el);
      });
      // keep only the outermost match (the heading, not the spans inside it)
      hits.filter((el) => !el.parentElement || !hits.includes(el.parentElement)).forEach(fit);
    };

    let t = 0;
    const later = () => {
      window.clearTimeout(t);
      t = window.setTimeout(run, 150);
    };

    const timers = [600, 1800, 4500].map((ms) => window.setTimeout(run, ms));
    window.addEventListener("resize", later);
    window.addEventListener("load", later);
    document.fonts?.ready.then(later);

    return () => {
      window.clearTimeout(t);
      timers.forEach((x) => window.clearTimeout(x));
      window.removeEventListener("resize", later);
      window.removeEventListener("load", later);
    };
  }, [name]);
}