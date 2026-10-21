import { Fragment, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, ElementType } from "react";
import "./NameWordmark.css";

/* NAME WORDMARK · "Morph Wave" (variable font: Anybody, weight + width axes) */

interface Props {
  name: string;
  /** heading tag (h1, h2 ...) */
  as?: ElementType;
  /** on narrow screens the name breaks after this many characters */
  breakAt?: number;
  /** show the name in capitals (wide extended caps look best with this font) */
  caps?: boolean;
  className?: string;
}

const MAX_FONT = 260;
const MIN_FONT = 22;
const STACK_BELOW = 640; // available width (px) under which the name stacks on two lines

export default function NameWordmark({ name, as: Tag = "h2", breakAt = 6, caps = true, className = "" }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);

  const chars = useMemo(() => Array.from((caps ? name.toUpperCase() : name).trim()), [name, caps]);
  const mid = (chars.filter((c) => c !== " ").length - 1) / 2;

  useEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    const ghost = ghostRef.current;
    if (!root || !inner || !ghost) return;

    const letters = Array.from(inner.querySelectorAll<HTMLElement>(".nw-l"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cx: number[] = [];
    let cy: number[] = [];
    let lh = 100;
    let visible = false;

    /* ---------- 1. fit to width ---------- */
    // The ghost row holds every character at 100px in the resting weight/width,
    // so measuring never touches the live (animating) letters.
    const fit = () => {
      const avail = root.clientWidth;
      if (!avail) return;

      const ws = Array.from(ghost.children).map((c) => (c as HTMLElement).getBoundingClientRect().width);
      if (!ws.length || ws.some((w) => !w)) return;
      const sum = (a: number, b: number) => ws.slice(a, b).reduce((s, x) => s + x, 0);
      const brk = Math.min(breakAt, ws.length);
      const one = sum(0, ws.length);
      const two = Math.max(sum(0, brk), sum(brk, ws.length));

      let stack = avail < STACK_BELOW;
      let size = (100 * avail) / (stack ? two : one);
      if (!stack && size < 34) {
        stack = true;
        size = (100 * avail) / two;
      }
      size = Math.max(MIN_FONT, Math.min(MAX_FONT, Math.floor(size * 0.985)));

      root.classList.toggle("is-stack", stack);
      inner.style.fontSize = `${size}px`;

      // every letter sits in a fixed box, so swelling letters never push the others
      let li = 0;
      chars.forEach((c, k) => {
        if (c === " ") return;
        letters[li].style.width = `${((ws[k] * size) / 100).toFixed(2)}px`;
        li += 1;
      });

      inner.style.setProperty("--gw", String(inner.offsetWidth || 1));
      cx = [];
      cy = [];
      letters.forEach((el) => {
        el.style.setProperty("--gx", String(el.offsetLeft));
        cx.push(el.offsetLeft + el.offsetWidth / 2);
        cy.push(el.offsetTop + el.offsetHeight / 2);
      });
      lh = letters[0]?.offsetHeight || size;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    document.fonts?.load("800 100px Anybody").then(fit, () => undefined);
    document.fonts?.ready.then(fit);

    /* ---------- 2. play when visible, pause when not ---------- */
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        root.classList.toggle("is-in", visible);
      },
      { threshold: 0.3 }
    );
    io.observe(root);

    /* ---------- 3. pointer: letters swell near the cursor ---------- */
    const lift = letters.map(() => 0);
    const target = letters.map(() => 0);
    let raf = 0;
    const loop = () => {
      raf = 0;
      let moving = false;
      for (let i = 0; i < letters.length; i++) {
        const next = lift[i] + (target[i] - lift[i]) * 0.16;
        if (Math.abs(next - lift[i]) > 0.001) {
          lift[i] = next;
          letters[i].style.setProperty("--lift", next.toFixed(3));
        }
        if (Math.abs(target[i] - lift[i]) > 0.002) moving = true;
      }
      if (moving) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const r = inner.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const R = Math.max(60, lh * 1.1);
      for (let i = 0; i < letters.length; i++) {
        const dx = (px - cx[i]) / R;
        const dy = (py - cy[i]) / (lh * 1.4);
        target[i] = Math.exp(-dx * dx) * Math.max(0, 1 - dy * dy);
      }
      kick();
    };
    const onLeave = () => {
      target.fill(0);
      kick();
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    /* ---------- 4. scroll velocity -> travelling skew wave ---------- */
    let lastY = window.scrollY;
    let v = 0;
    let push = 0;
    let vRaf = 0;
    const vLoop = () => {
      vRaf = 0;
      v += (push - v) * 0.18;
      push *= 0.86;
      if (Math.abs(v) < 0.01 && Math.abs(push) < 0.01) {
        v = push = 0;
        root.style.setProperty("--v", "0");
        return;
      }
      root.style.setProperty("--v", v.toFixed(2));
      vRaf = requestAnimationFrame(vLoop);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (reduce || !visible) return;
      push = Math.max(-9, Math.min(9, push + dy * 0.12));
      if (!vRaf) vRaf = requestAnimationFrame(vLoop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(vRaf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [name, breakAt, chars]);

  let li = -1;
  const Comp = Tag as ElementType;

  return (
    <Comp ref={rootRef} className={`nw ${className}`.trim()} aria-label={name}>
      {/* hidden measuring row (resting weight/width, 100px) */}
      <span className="nw-ghost" ref={ghostRef} aria-hidden="true">
        {chars.map((c, k) => (c === " " ? <i className="nw-sp" key={k} /> : <i key={k}>{c}</i>))}
      </span>

      <span className="nw-inner" ref={innerRef} aria-hidden="true">
        {chars.map((c, k) => {
          if (c === " ") return <span className="nw-sp" key={k} />;
          li += 1;
          const i = li;
          const style = {
            "--i": i,
            "--d": Math.round(Math.abs(i - mid) * 60),
            "--sk": Math.sin(i * 0.75).toFixed(3),
          } as CSSProperties;
          const isDot = c === "." && k === chars.length - 1;
          return (
            <Fragment key={k}>
              <span className={`nw-l${isDot ? " nw-dot" : ""}`} style={style}>
                <span className="nw-f" data-ch={c}>
                  <span className="nw-g">{c}</span>
                </span>
              </span>
              {k === breakAt - 1 && <span className="nw-br" />}
            </Fragment>
          );
        })}
      </span>
      <span className="nw-rule" aria-hidden="true" />
    </Comp>
  );
}