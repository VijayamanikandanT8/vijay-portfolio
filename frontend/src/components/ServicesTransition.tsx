import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitType from "split-type";
import "./ServicesTransition.css";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Low-poly mesh (same idea as the Achievements triangle bloom): dark facets
// that shrink away along a diagonal wave and reveal the light Services page.
// ---------------------------------------------------------------------------
interface Tri {
  x0: number; y0: number;
  x1: number; y1: number;
  x2: number; y2: number;
  bx: number; by: number; // bottom centre, facets shrink towards this point
  u: number; // wave order (0..~1.22)
  fill: string;
}

const MESH_RGB = "222,101,81"; // the orange-red used by the Achievements mesh
const FEATHER = 0.38; // softness of the wave front
const NOISE = 0.22; // how irregular the wave front is
const T_MAX = 1 + NOISE + FEATHER;
const smooth = (t: number) => t * t * (3 - 2 * t);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMesh(w: number, h: number, cell = 96): Tri[] {
  const rand = mulberry32(7);
  const cols = Math.max(2, Math.ceil(w / cell));
  const rows = Math.max(2, Math.ceil(h / cell));
  const cw = w / cols;
  const ch = h / rows;
  const grid: [number, number][][] = [];
  for (let r = 0; r <= rows; r++) {
    const row: [number, number][] = [];
    for (let c = 0; c <= cols; c++) {
      const x = c * cw + (c === 0 || c === cols ? 0 : (rand() - 0.5) * 2 * cw * 0.38);
      const y = r * ch + (r === 0 || r === rows ? 0 : (rand() - 0.5) * 2 * ch * 0.38);
      row.push([x, y]);
    }
    grid.push(row);
  }
  const out: Tri[] = [];
  const push = (a: [number, number], b: [number, number], c: [number, number]) => {
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const g = 27 + Math.round((rand() - 0.5) * 5); // faint facet shading
    out.push({
      x0: a[0], y0: a[1], x1: b[0], y1: b[1], x2: c[0], y2: c[1],
      bx: (Math.min(a[0], b[0], c[0]) + Math.max(a[0], b[0], c[0])) / 2,
      by: Math.max(a[1], b[1], c[1]),
      u: 0.5 * (cx / w) + 0.5 * (cy / h) + rand() * NOISE,
      fill: `rgb(${g},${g},${g})`,
    });
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = grid[r][c];
      const tr = grid[r][c + 1];
      const bl = grid[r + 1][c];
      const br = grid[r + 1][c + 1];
      if (rand() > 0.5) {
        push(tl, tr, br);
        push(tl, br, bl);
      } else {
        push(tl, tr, bl);
        push(tr, br, bl);
      }
    }
  }
  return out;
}

export default function ServicesTransition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const q = (s: string) => root.querySelector<HTMLElement>(s)!;
    const lineA = q(".sx__word--a");
    const lineB = q(".sx__word--b");
    const badge = q(".sx__badge");
    const metas = Array.from(root.querySelectorAll<HTMLElement>(".sx__meta > *"));

    const splitA = new SplitType(lineA, { types: "chars" });
    const splitB = new SplitType(lineB, { types: "chars" });

    // ---------------- mesh canvas ----------------
    let w = 0;
    let h = 0;
    let dpr = 1;
    let mesh: Tri[] = [];
    const wave = { p: 0 };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = "round";
      const t = wave.p * T_MAX;
      for (const tr of mesh) {
        const k = Math.min(1, Math.max(0, (t - tr.u) / FEATHER));
        if (k >= 1) continue;
        const s = 1 - smooth(k);
        const ax = tr.bx + (tr.x0 - tr.bx) * s;
        const ay = tr.by + (tr.y0 - tr.by) * s;
        const bx = tr.bx + (tr.x1 - tr.bx) * s;
        const by = tr.by + (tr.y1 - tr.by) * s;
        const cx = tr.bx + (tr.x2 - tr.bx) * s;
        const cy = tr.by + (tr.y2 - tr.by) * s;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = tr.fill;
        ctx.fill();
        if (k > 0.01) {
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = `rgba(${MESH_RGB},${(Math.sin(Math.PI * k) * 0.95).toFixed(2)})`;
        } else {
          ctx.lineWidth = 1.2; // closes hairline gaps between untouched facets
          ctx.strokeStyle = tr.fill;
        }
        ctx.stroke();
      }
    };

    const resize = () => {
      const nw = root.clientWidth;
      const nh = root.clientHeight;
      if (nw === w && nh === h && mesh.length) return;
      w = nw;
      h = nh;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      mesh = makeMesh(w, h);
      draw();
    };
    resize();
    window.addEventListener("resize", resize);

    // ---------------- timeline ----------------
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top 75%",
        end: "bottom 30%",
        scrub: true,
        // Certifications (above this band) is pinned with refreshPriority -1.
        // Refresh AFTER it so its pin spacing is included in our start/end.
        refreshPriority: -2,
        onRefresh: resize,
      },
    });

    tl
      .fromTo(metas, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.15 }, 0)
      // 1) the dark facets shatter away along a diagonal wave
      .to(wave, { p: 1, duration: 0.85, ease: "power2.inOut", onUpdate: draw }, 0.05)
      // 2) two outlined words rise out of their masks
      .fromTo(
        splitA.chars ?? [],
        { yPercent: 115 },
        { yPercent: 0, stagger: 0.025, duration: 0.3, ease: "power3.out" },
        0.12,
      )
      .fromTo(
        splitB.chars ?? [],
        { yPercent: 115 },
        { yPercent: 0, stagger: 0.025, duration: 0.3, ease: "power3.out" },
        0.32,
      )
      // 3) second word fills in (like the Services title on hover)
      .fromTo(
        lineB,
        { "--f": "rgba(255,255,255,0)" },
        { "--f": "rgba(255,255,255,1)", duration: 0.25 },
        0.6,
      )
      // 4) parallax in opposite directions + spinning badge
      .fromTo(lineA, { x: "4vw" }, { x: "-5vw", duration: 1 }, 0)
      .fromTo(lineB, { x: "-4vw" }, { x: "5vw", duration: 1 }, 0)
      .fromTo(badge, { rotation: -40 }, { rotation: 400, duration: 1 }, 0)
      // 5) everything lifts away so the Services header lands on a clean page
      // (fade the blended elements themselves; a wrapper with opacity/transform
      //  would isolate them and break the difference blend)
      .to([lineA, lineB, badge, ...metas], { opacity: 0, y: -40, duration: 0.1, ease: "power1.in" }, 0.92);

    return () => {
      window.removeEventListener("resize", resize);
      tl.scrollTrigger?.kill();
      tl.kill();
      splitA.revert();
      splitB.revert();
    };
  }, []);

  return (
    <div className="sx" ref={rootRef} aria-hidden="true">
      <canvas className="sx__mesh" ref={canvasRef} />

      <div className="sx__content">
        <div className="sx__meta">
          <span className="sx__meta-left">03 &mdash; Achievements</span>
          <span className="sx__meta-right">Services</span>
        </div>

        <div className="sx__words">
          <h2 className="sx__word sx__word--a">Proven</h2>
          <h2 className="sx__word sx__word--b">Ready</h2>
        </div>

        <svg className="sx__badge" viewBox="0 0 200 200">
          <defs>
            <path id="sx-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#sx-circle" textLength="486" lengthAdjust="spacing">
              Achievements ✦ Services ✦ Achievements ✦ Services ✦
            </textPath>
          </text>
          <path className="sx__badge-arrow" d="M100 82v34m-14-14 14 14 14-14" />
        </svg>
      </div>
    </div>
  );
}