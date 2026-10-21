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