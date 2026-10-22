// Device tier detection. "Lite" mode keeps every effect but makes the heaviest
// ones cheaper (no backdrop blur, smaller canvases) on weak CPUs / phones.
type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

const nav = (typeof navigator !== "undefined" ? navigator : {}) as Nav;
const root = typeof document !== "undefined" ? document.documentElement : null;

export const isTouch =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const weakDevice = () => {
  const cores = nav.hardwareConcurrency || 8;
  const mem = nav.deviceMemory || 8;
  const phone = isTouch && Math.min(window.screen.width, window.screen.height) < 820;
  return cores <= 4 || mem <= 4 || !!nav.connection?.saveData || phone;
};

export const isLite = () => !!root && root.classList.contains("perf-lite");

export function markLite(remember = false) {
  root?.classList.add("perf-lite");
  if (remember) {
    try {
      sessionStorage.setItem("perf-lite", "1");
    } catch {
      /* storage blocked: fine */
    }
  }
}

// Runs once, when this file is first imported (before the first paint).
if (root) {
  let remembered = false;
  try {
    remembered = sessionStorage.getItem("perf-lite") === "1";
  } catch {
    /* ignore */
  }
  if (isTouch) root.classList.add("is-touch");
  if (remembered || weakDevice()) markLite();
}
/* ===== Low-end detection ===== */
export const isLow = () => !!root && root.classList.contains("perf-low");

export function markLow() {
  root?.classList.add("perf-low");
  markLite(true);
  try {
    sessionStorage.setItem("perf-low", "1");
  } catch {
    /* ignore */
  }
}

// A browser with no real GPU (VMs, remote desktops, CPU-only PCs) draws WebGL in software.
function noRealGPU(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      c.getContext("webgl", { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|basic render|software/i.test(name);
  } catch {
    return false;
  }
}

if (root) {
  let remembered = false;
  try {
    remembered = sessionStorage.getItem("perf-low") === "1";
  } catch {
    /* ignore */
  }
  if (remembered || noRealGPU()) {
    root.classList.add("perf-low");
    markLite();
  }

  // Frame watchdog (always on, not only while scrolling): if the page stays under ~20fps
  // for two measuring windows in a row, switch to low mode.
  let frames = 0;
  let slow = 0;
  let bad = 0;
  let last = 0;
  const watch = (now: number) => {
    if (isLow()) return;
    if (last && !document.hidden && now - last < 500) {
      frames++;
      if (now - last > 50) slow++;
    }
    last = now;
    if (frames >= 150) {
      bad = slow / frames > 0.3 ? bad + 1 : 0;
      frames = 0;
      slow = 0;
      if (bad >= 2) {
        markLow();
        return;
      }
    }
    requestAnimationFrame(watch);
  };
  window.setTimeout(() => requestAnimationFrame(watch), 5000); // let the page finish loading first
}
