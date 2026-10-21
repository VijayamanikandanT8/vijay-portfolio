import { useEffect, useRef, useState } from "react";
import { isLite } from "../lib/perf";

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uVel;
uniform float uScroll;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.02 + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 1.7;
  vec2 m = (uMouse - 0.5) * vec2(asp, 1.0) * 1.7;
  float t = (uTime + uScroll * 6.0) * 0.07;

  // cursor lens: a travelling ripple that grows with pointer speed
  vec2 d = p - m;
  float dist = length(d);
  float lens = exp(-dist * dist * 4.5);
  p += d / (dist + 0.001) * lens * (0.05 + uVel * 0.12) * sin(dist * 16.0 - uTime * 2.6);

  // domain-warped flow field
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.5),
                fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 1.2));
  float f = fbm(p + 3.0 * r);

  vec3 cyan  = vec3(0.30, 0.78, 0.97);
  vec3 vio   = vec3(0.55, 0.48, 1.00);
  vec3 pink  = vec3(1.00, 0.50, 0.75);
  vec3 amber = vec3(1.00, 0.80, 0.50);
  vec3 c = mix(cyan, vio, smoothstep(0.2, 0.7, q.x));
  c = mix(c, pink, smoothstep(0.3, 0.8, r.y));
  c = mix(c, amber, smoothstep(0.55, 0.95, r.x * f * 1.7));

  // keep the text column calmer
  float side = mix(0.55, 1.0, smoothstep(0.12, 0.65, uv.x));
  float fade = 1.0 - uScroll * 0.7;

  vec3 col = vec3(1.0);
  col = mix(col, c, smoothstep(0.25, 0.85, f) * 0.38 * side * fade);

  // thin topographic contour lines, stronger near the cursor
  float g = f * 14.0;
  float w = fwidth(g);
  float dd = min(fract(g), 1.0 - fract(g));
  float line = 1.0 - smoothstep(0.0, w * 1.4, dd);
  col = mix(col, vec3(0.34, 0.31, 0.80), line * (0.13 + lens * 0.22) * side * fade);

  // soft light tint under the cursor
  col = mix(col, vec3(0.62, 0.56, 1.0), lens * 0.10 * fade);

  // dither against banding
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

/* White, GPU-drawn living background: a domain-warped pastel flow field with thin contour
   lines and a cursor lens. Renders at reduced resolution, adapts its quality if the frame rate
   drops, and stops completely while the hero is off-screen. */
export default function HeroBackdrop({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const startRef = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    activeRef.current = active;
    if (active) startRef.current?.();
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setFailed(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[HeroBackdrop] shader error:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setFailed(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[HeroBackdrop] link error:", gl.getProgramInfoLog(prog));
      setFailed(true);
      return;
    }
    gl.useProgram(prog);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uVel = gl.getUniformLocation(prog, "uVel");
    const uScroll = gl.getUniformLocation(prog, "uScroll");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = isLite() ? 0.55 : 0.75; // render resolution vs. CSS pixels (lowered automatically if frames get slow)
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let mx = 0.62;
    let my = 0.5;
    let tx = 0.62;
    let ty = 0.5;
    let vel = 0;
    let slow = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isLite() ? 1 : 1.5);
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr * scale));
      const h = Math.max(2, Math.round(canvas.clientHeight * dpr * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uVel, vel);
      gl.uniform1f(uScroll, Math.min(1, window.scrollY / Math.max(1, window.innerHeight)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!activeRef.current || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      time += dt;

      const ox = mx;
      const oy = my;
      const k = Math.min(1, dt * 6);
      mx += (tx - mx) * k;
      my += (ty - my) * k;
      const speed = Math.hypot(mx - ox, my - oy) / Math.max(dt, 0.001);
      vel += (Math.min(speed, 3) - vel) * Math.min(1, dt * 4);

      draw();

      // adaptive quality: if the machine struggles, quietly render fewer pixels
      if (dt > 0.034) slow++;
      else slow = Math.max(0, slow - 1);
      if (slow > 45 && scale > 0.4) {
        scale *= 0.8;
        slow = 0;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || reduce) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    startRef.current = start;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      tx = (e.clientX - r.left) / r.width;
      ty = 1 - (e.clientY - r.top) / r.height;
    };
    const onVisible = () => {
      if (!document.hidden && activeRef.current) start();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    canvas.addEventListener("webglcontextlost", onLost);
    const ro = new ResizeObserver(() => {
      draw();
    });
    ro.observe(canvas);

    draw(); // first frame immediately (also the only frame when reduced motion is on)
    if (activeRef.current) start();

    return () => {
      cancelAnimationFrame(raf);
      startRef.current = null;
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisible);
      canvas.removeEventListener("webglcontextlost", onLost);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return failed ? <div className="hx-fallback" aria-hidden="true" /> : <canvas ref={ref} className="hx-gl" aria-hidden="true" />;
}