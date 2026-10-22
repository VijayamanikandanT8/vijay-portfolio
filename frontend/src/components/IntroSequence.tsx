import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import GlassTypography, { type GlassTypographyHandle } from "./GlassTypography";
import IntroCore from "./IntroCore";
import AssembledLogo from "./AssembledLogo";

type Stage =
  | "black"
  | "field"
  | "hi"
  | "letters"
  | "assemble"
  | "name"
  | "push"
  | "core"
  | "flash"
  | "done";

// Tamil greeting helper: hand-draws every contour of a word in order, moves the pen dot,
// and wipes the gold fill in behind the pen. Returns a paint(progress 0..1) function.
function prepTamilScript(svg: SVGSVGElement | null) {
  const segs = Array.from(svg?.querySelectorAll<SVGPathElement>(".tamil-line") ?? []);
  const pen = svg?.querySelector<SVGCircleElement>(".tamil-pen") ?? null;
  const wipe = svg?.querySelector<SVGRectElement>(".tamil-wipe") ?? null;
  const x0 = Number(wipe?.dataset.x0 ?? 0);
  const span = Number(wipe?.dataset.r ?? 0);
  const lens = segs.map((s) => s.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const prev: number[] = segs.map(() => -1);
  segs.forEach((s, i) => {
    s.style.setProperty("stroke-dasharray", `${lens[i]} ${lens[i]}`);
    s.style.setProperty("stroke-dashoffset", String(lens[i]));
    s.style.setProperty("visibility", "hidden");
  });
  return (p: number) => {
    const at = p * total;
    let acc = 0;
    let active = -1;
    let activeLocal = 0;
    for (let i = 0; i < segs.length; i++) {
      const len = lens[i] || 1;
      const local = Math.min(Math.max((at - acc) / len, 0), 1);
      if (local > 0) {
        active = i;
        activeLocal = local;
      }
      if (local !== prev[i]) {
        prev[i] = local;
        segs[i].style.setProperty("stroke-dashoffset", String(len * (1 - local)));
        segs[i].style.setProperty("visibility", local > 0 ? "visible" : "hidden");
      }
      acc += len;
    }
    if (active >= 0 && pen) {
      const pt = segs[active].getPointAtLength(activeLocal * (lens[active] || 1));
      pen.setAttribute("cx", String(pt.x));
      pen.setAttribute("cy", String(pt.y));
    }
    if (pen) pen.style.opacity = p > 0.001 && p < 0.985 ? "1" : "0";
    // ink fill follows the pen with a soft edge
    const wp = Math.min(1, Math.max(0, (p - 0.16) / 0.84));
    wipe?.setAttribute("x", String(x0 - span + wp * span));
    svg?.style.setProperty("--draw", p.toFixed(4));
  };
}

interface Props {
  onComplete: () => void;
}


export default function IntroSequence({ onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [glassStage, setGlassStage] = useState<
    "hidden" | "hi" | "letters" | "assemble" | "name" | "tamil" | "push"
  >("hidden");
  const [stage, setStage] = useState<Stage>("black");
  const flashRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<GlassTypographyHandle>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }

        // "Welcome Aboard." is hand-written: each letter stroke is drawn in order, a pen dot follows
    const nameEl = glassRef.current?.nameEl ?? null;
    const segs = Array.from(nameEl?.querySelectorAll<SVGPathElement>(".script-line") ?? []);
    const penDot = nameEl?.querySelector<SVGCircleElement>(".script-pen") ?? null;
    const lens = segs.map((s) => s.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0);
    segs.forEach((s, i) => s.style.setProperty("stroke-dasharray", `${lens[i]} ${lens[i]}`));
    const reveal = { p: 0 };
        const prev: number[] = segs.map(() => -1);
    const paintReveal = () => {
      nameEl?.style.setProperty("--draw", reveal.p.toFixed(4));
      const at = reveal.p * total;
      let acc = 0;
      let active = -1;
      let activeLocal = 0;
      for (let i = 0; i < segs.length; i++) {
        const len = lens[i] || 1;
        const local = Math.min(Math.max((at - acc) / len, 0), 1);
        if (local > 0) {
          active = i;
          activeLocal = local;
        }
        if (local !== prev[i]) {
          prev[i] = local;
          segs[i].style.setProperty("stroke-dashoffset", String(len * (1 - local)));
          segs[i].style.setProperty("visibility", local > 0 ? "visible" : "hidden");
        }
        acc += len;
      }
      if (active >= 0 && penDot) {
        const pt = segs[active].getPointAtLength(activeLocal * (lens[active] || 1));
        penDot.setAttribute("cx", String(pt.x));
        penDot.setAttribute("cy", String(pt.y));
      }
    };
    paintReveal();

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        setStage("done");
        onComplete();
      },
    });
    tlRef.current = tl;

    tl.set(rootRef.current, { autoAlpha: 1 });
    tl.to({}, { duration: 1.0 }); // 1s gap before "Hi, I'm" appears, as requested

    tl.call(() => {
      setStage("field");
      setStage("hi");
      setGlassStage("hi");
    });
    // Run the background fade and the hold in parallel (both start at
    // position 0) instead of back-to-back — that double-counting was
    // the extra ~1.8s gap you were seeing. The hold is exactly as long
    // as the "Hi, I'm" stagger takes to finish (7 chars * 0.16s delay +
    // 0.85s pop-in = 1.81s), so VIJAY starts the instant it's done —
    // no added pause.
    tl.to({}, { duration: 2.4 }); // wait until INITIALIZING has fully appeared, then start writing

    tl.call(() => {
      setStage("letters");
      setGlassStage("letters");
    });

    tl.to(reveal, {
      p: 1,
      duration: 6.0,
      ease: "sine.inOut",
      onUpdate: paintReveal,
    });
    tl.to({}, { duration: 0.2 });

    tl.call(() => {
      setGlassStage("assemble");
      setStage("assemble");
    });
    tl.to({}, { duration: 0.6 });

    tl.call(() => {
      setStage("name");
      setGlassStage("name");
    });
    tl.to({}, { duration: 0.9 });

        // ===== Greeting page (before the tunnel): "Priyamudan" then "Vijay", hand-written in cursive =====
    const tamilEl = glassRef.current?.tamilEl ?? null;
    const pick = (sel: string) => tamilEl?.querySelector<SVGSVGElement>(sel) ?? null;
    const paintPriya = prepTamilScript(pick(".tamil-svg--priya"));
    const paintSwoosh = prepTamilScript(pick(".tamil-svg--swoosh"));
    const paintVijay = prepTamilScript(pick(".tamil-svg--vijay"));
    const paintUnder = prepTamilScript(pick(".tamil-svg--under"));
    const tamilHalo = tamilEl?.querySelector(".tamil-halo") ?? null;
    const sparks = tamilEl ? Array.from(tamilEl.querySelectorAll<SVGPathElement>(".tamil-spark")) : [];
    const hearts = tamilEl ? Array.from(tamilEl.querySelectorAll<SVGPathElement>(".tamil-heart")) : [];
    const writePriya = { p: 0 };
    const writeSwoosh = { p: 0 };
    const writeVijay = { p: 0 };
    const writeUnder = { p: 0 };

    tl.call(() => setGlassStage("tamil"));
    tl.set(tamilEl, { autoAlpha: 1, scale: 1 });
    tl.fromTo(
      tamilHalo,
      { opacity: 0, scale: 0.55 },
      { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" },
      "<"
    );
    // 1) Priyamudan is written first
    tl.to(
      writePriya,
      { p: 1, duration: 3.2, ease: "sine.inOut", onUpdate: () => paintPriya(writePriya.p) },
      "<0.35"
    );
    // 2) the swoosh flows out and loops into the heart
    tl.to(
      writeSwoosh,
      { p: 1, duration: 1.7, ease: "sine.inOut", onUpdate: () => paintSwoosh(writeSwoosh.p) },
      "+=0.05"
    );
    // 3) Vijay is written below it
    tl.to(
      writeVijay,
      { p: 1, duration: 1.9, ease: "sine.inOut", onUpdate: () => paintVijay(writeVijay.p) },
      "+=0.05"
    );
    // 4) the underline sweeps under Vijay
    tl.to(
      writeUnder,
      { p: 1, duration: 0.8, ease: "power2.out", onUpdate: () => paintUnder(writeUnder.p) },
      "+=0.05"
    );
    // 5) red hearts pop, sparks flash
    tl.fromTo(
      hearts,
      { opacity: 0, scale: 0, transformOrigin: "50% 70%" },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(3)",
        stagger: 0.18,
        onComplete: () => {
          gsap.set(hearts, { clearProps: "transform,transformOrigin" });
        },
      },
      "-=0.05"
    );
    tl.fromTo(
      sparks,
      { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" },
      {
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
        stagger: 0.1,
        onComplete: () => {
          gsap.set(sparks, { clearProps: "transform,transformOrigin" });
        },
      },
      "<0.1"
    );
    tl.call(() => tamilEl?.classList.add("tamil-page--done")); // sheen + heartbeat
    tl.to({}, { duration: 3.6 }); // extras need ~2.5s to draw, then the full page stays visible
    // exit: pushes toward the camera while the tunnel starts
    tl.call(() => {
      gsap.to(tamilEl, { scale: 1.8, autoAlpha: 0, duration: 0.75, ease: "power3.in" });
    });
    tl.to({}, { duration: 0.3 });

    tl.call(() => {
      setStage("push");
      setGlassStage("push");
    });
    // short beat where the tunnel dolly used to run
    tl.to({}, { duration: 0.6 });

    tl.call(() => setStage("core"));
    tl.to({}, { duration: 1.6 });

    tl.call(() => setStage("flash"));
    tl.to(flashRef.current, { autoAlpha: 1, duration: 0.3, ease: "power1.in" });
    tl.to(rootRef.current, { autoAlpha: 0, duration: 0.7, ease: "power1.out" }, "-=0.05");

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    tlRef.current?.kill();
    onComplete();
  };

  if (stage === "done") return null;

  return (
    <div className="intro-overlay" ref={rootRef} role="presentation">

      <GlassTypography ref={glassRef} stage={glassStage} />

      <IntroCore active={stage === "core"} />

      <AssembledLogo active={stage === "core"} />

      <div className="intro-flash" ref={flashRef} />

      <button type="button" className="skip-intro" onClick={skip}>
        Skip intro
      </button>
    </div>
  );
}