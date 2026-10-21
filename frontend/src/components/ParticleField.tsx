import { useEffect, useRef } from "react";
import { isLite } from "../lib/perf";

interface ParticleFieldProps {
  density?: number;
  speed?: number;
  className?: string;
  colorStops?: string[];
}

interface Particle {
  x: number;
  y: number;
  z: number;
  r: number;
  hue: string;
}

const DEFAULT_STOPS = ["#5fd8ff", "#8b7bff", "#ff5fae"];

export default function ParticleField({
  density = 140,
  speed = 0.12,
  className,
  colorStops = DEFAULT_STOPS,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A stable string, so an inline array prop doesn't restart the effect every render.
  const stopsKey = colorStops.join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stops = stopsKey.split("|");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, isLite() ? 1 : 1.5);
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let inView = true;
    let mx = 0.5;
    let my = 0.5;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((width * height) / 9000 + density * 0.15) * (isLite() ? 0.55 : 1));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1 + 0.15,
        r: Math.random() * 1.6 + 0.3,
        hue: stops[Math.floor(Math.random() * stops.length)],
      }));
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += speed;
      for (const p of particles) {
        const parallaxX = (mx - 0.5) * 26 * p.z;
        const parallaxY = (my - 0.5) * 26 * p.z;
        const drift = Math.sin(t * 0.4 * p.z + p.x) * 6 * p.z;
        const px = p.x + parallaxX + drift;
        const py = ((p.y + t * p.z * 3) % (height + 20)) + parallaxY;
        ctx.beginPath();
        ctx.fillStyle = p.hue;
        ctx.globalAlpha = 0.25 + p.z * 0.5;
        ctx.arc(px, py, p.r * p.z * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(draw);
    };

    // Only animate while the canvas is on screen and the tab is visible.
    const start = () => {
      if (running || reduceMotion || !inView || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) draw(); // one static frame
    else start();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, speed, stopsKey]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}