import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent, KeyboardEvent, PointerEvent as RPointerEvent } from "react";
import gsap from "gsap";
import me from "../assets/me.jpg";
import "./ContactSection.css";
import NameWordmark from "./NameWordmark";
import { glideTo } from "../lib/glide";
import { apiUrl } from "../lib/api";

// ---------------------------------------------------------------------------
// CONTACT SECTION  -  EDIT THESE
//   FORM_ENDPOINT : "" opens the visitor's mail app. Put a Formspree / Web3Forms /
//                   own-API URL to POST the form as JSON instead.
//   WHATSAPP      : country code + number, digits only (e.g. 919876543210). "" hides it.
//   PHONE         : shown on the Call card. "" hides it.
//   MAP_QUERY     : "" = use the location from your site data.
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = apiUrl("/api/contact");
const WHATSAPP = "919789124264";
const PHONE = "+91 9789124264";
const MAP_QUERY = "";
// Google Maps Embed API key (free). Put it in .env as VITE_GOOGLE_MAPS_KEY=xxxx
const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? "";
const DISPLAY_NAME = "Vijayamanikandan T.";
const ROLE_LINE = "Python Fullstack Developer";
const LANGS = ["English", "Tamil"];

const TIMEZONE = "Asia/Kolkata"; // keep in sync with IST_OFFSET_MIN
const IST_OFFSET_MIN = 330;
const WORK_HOURS: [number, number] = [9, 21];
const OFF_DAYS = [0]; // 0 = Sunday
const SLOTS = ["10:00", "11:30", "14:00", "15:30", "17:00", "19:00"];
const CALL_MINUTES = 30;

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/vijayamanikandan-t-49852024a", d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" },
  { label: "GitHub", href: "https://github.com/vijaycodex8", d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
  { label: "Instagram", href: "https://www.instagram.com/virat_vj8/", d: "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01" },
  { label: "X / Twitter", href: "https://x.com/your-handle", d: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" },
];

const TOPICS = ["Web app", "Mobile app", "AI / ML", "Data", "Automation", "Other"];
const ROLES = ["Full Stack", "Flutter", "Python", "AI & ML", "Data Analytics"];
const BUDGETS = ["< ₹2k", "₹2k – 5k", "₹5k – 10k", "₹10k – 25k", "₹25k – 50k", "₹50k +"];
const TIMELINES = ["ASAP", "1 month", "2–3 months", "Flexible"];
const FEATURES = ["Auth & roles", "Dashboard", "Payments", "AI / chatbot", "REST API", "Admin panel", "Mobile app", "Deployment"];
const MODES = [
  { id: "meet", label: "Google Meet" },
  { id: "phone", label: "Phone call" },
  { id: "wa", label: "WhatsApp" },
];
const STEPS = [
  { t: "You share the brief", d: "Tell me the idea, the goal and a rough budget. A few lines is enough.", when: "Today" },
  { t: "I reply personally", d: "You hear back from me directly, not from a bot or a ticket system.", when: "< 24 h" },
  { t: "Short call", d: "A quick chat on Meet, phone or WhatsApp to align on what you need.", when: `${CALL_MINUTES} min` },
  { t: "Scope, then build", d: "A clear scope and timeline come first. Once agreed, the build starts.", when: "Kick-off" },
];
const STATS = [
  { n: "35+", l: "Project deliverables" },
  { n: "< 24h", l: "Typical reply" },
  { n: String(LANGS.length), l: LANGS.join(" · ") },
];
const FAQ = [
  { q: "How quickly will you reply?", a: "Usually within 24 hours, and often much faster during working hours (see the live clock)." },
  { q: "Do you take freelance projects?", a: "Yes. Web apps, APIs, dashboards, automation and AI / ML work. Share a short brief and we can scope it together." },
  { q: "Which time zone do you work in?", a: "IST (UTC+5:30). I'm happy to overlap with your hours. The call booker shows every slot in your own time too." },
  { q: "How does a project start?", a: "Brief, then a short call, then a clear scope and timeline. Once that's agreed, the build starts." },
];

const D = {
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  check: "M20 6L9 17l-5-5",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  chat: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  cal: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18",
  msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  layers: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  arrow: "M7 17L17 7 M7 7h10v10",
  nav: "M3 11l19-9-9 19-2-8-8-2z",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  chev: "M6 9l6 6 6-6",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

function Ico({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ---------- helpers ----------
const css = (o: Record<string, string | number>) => o as CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtHr = (h: number) => `${h % 12 || 12} ${h < 12 || h === 24 ? "AM" : "PM"}`;

function istParts(date: Date) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(date)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return { y: o.year, m: o.month, d: o.day, h: o.hour, min: o.minute, s: o.second };
}

interface Day {
  key: string;
  y: number;
  m: number;
  d: number;
  wd: number;
}

function buildDays(now: Date): Day[] {
  const p = istParts(now);
  const out: Day[] = [];
  for (let i = 0; out.length < 7 && i < 14; i++) {
    const t = new Date(Date.UTC(p.y, p.m - 1, p.d + i));
    const wd = t.getUTCDay();
    if (OFF_DAYS.includes(wd)) continue;
    out.push({ key: t.toISOString().slice(0, 10), y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd });
  }
  return out;
}

const slotInstant = (day: Day, slot: string) => {
  const [h, mi] = slot.split(":").map(Number);
  return new Date(Date.UTC(day.y, day.m - 1, day.d, h, mi) - IST_OFFSET_MIN * 60000);
};

const icsDate = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

function downloadIcs(start: Date, title: string, desc: string) {
  const end = new Date(start.getTime() + CALL_MINUTES * 60000);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Portfolio//Contact//EN", "BEGIN:VEVENT",
    `UID:${start.getTime()}@portfolio`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${title}`, `DESCRIPTION:${desc.replace(/\n/g, "\\n")}`, "END:VEVENT", "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "call-with-me.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- types ----------
interface Props {
  email?: string;
  location?: string;
  availability?: string;
  name?: string;
}
type TabId = "message" | "call" | "project";
type Status = "idle" | "sending" | "sent" | "error";
type Via = "mail" | "api" | "whatsapp";
type Errors = Partial<Record<"name" | "email" | "message" | "slot", string>>;

const TABS: { id: TabId; label: string; d: string; title: string; sub: string }[] = [
  { id: "message", label: "Message", d: D.msg, title: "Send me a message", sub: "Quick question or just saying hi. I usually reply within a day." },
  { id: "call", label: "Book a call", d: D.cal, title: "Book a 30-min call", sub: "Pick a day and a slot. You'll see it in your own time zone too." },
  { id: "project", label: "Project brief", d: D.layers, title: "Tell me about your project", sub: "A few details help me come back with a useful answer." },
];

const HEADING = ["Let’s", "build", "something", "great", "together."];
const DRAFT_KEY = "ct-draft-v2";

export default function ContactSection({ email = "", location = "", availability = "", name = "" }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<TabId>("message");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [topic, setTopic] = useState(TOPICS[0]);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState("");
  const [mode, setMode] = useState(MODES[0].id);
  const [budget, setBudget] = useState(1);
  const [budgetText, setBudgetText] = useState("");
  const [isCustomBudget, setIsCustomBudget] = useState(false);
  const budgetLabel = (() => {
    if (!isCustomBudget) return BUDGETS[budget];
    const t = budgetText.trim();
    if (!t) return "Custom (to discuss)";
    return /^[\d,.\s]+[kKlL]?$/.test(t) ? `₹${t}` : t;
  })();
  const [timeline, setTimeline] = useState(TIMELINES[1]);
  const [features, setFeatures] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [via, setVia] = useState<Via>("mail");
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [mapType, setMapType] = useState<"m" | "k">("m");
  const [zoom, setZoom] = useState(12);
  const [mapLive, setMapLive] = useState(false);
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const [faq, setFaq] = useState(0);
  const [role, setRole] = useState(0);

  const days = useMemo(() => buildDays(new Date()), []);
  const place = MAP_QUERY || location || "Coimbatore, Tamil Nadu";
  const tabIdx = TABS.findIndex((t) => t.id === tab);
  const meta = TABS[tabIdx];
  const mapSrc = MAPS_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${encodeURIComponent(place)}&zoom=${zoom}&maptype=${mapType === "k" ? "satellite" : "roadmap"}`
    : `https://www.google.com/maps?q=${encodeURIComponent(place)}&t=${mapType}&z=${zoom}&hl=en&output=embed`;

    // ---------- map: lock again when the visitor clicks outside it, or presses Esc ----------
  useEffect(() => {
    if (!mapLive) return;
    const onDown = (e: PointerEvent) => {
      if (mapFrameRef.current && !mapFrameRef.current.contains(e.target as Node)) setMapLive(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setMapLive(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mapLive]);

  // ---------- clocks ----------
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    const r = window.setInterval(() => setRole((x) => (x + 1) % ROLES.length), 2200);
    return () => {
      window.clearInterval(t);
      window.clearInterval(r);
    };
  }, []);

  const ist = istParts(now);
  const online = ist.h >= WORK_HOURS[0] && ist.h < WORK_HOURS[1];
  const dayFrac = (ist.h * 3600 + ist.min * 60 + ist.s) / 86400;
  const h12 = ist.h % 12 || 12;

  // ---------- toast ----------
  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1900);
  }, []);

  // ---------- draft autosave ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm((f) => ({ ...f, ...(JSON.parse(raw) as Partial<typeof f>) }));
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    }, 400);
    return () => window.clearTimeout(t);
  }, [form]);

  // ---------- scroll reveal ----------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(".ct-rv");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  // ---------- particle network that reacts to the cursor ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    interface P { x: number; y: number; vx: number; vy: number; r: number }
    let w = 0, h = 0, raf = 0, running = false, resizeT = 0;
    let pts: P[] = [];
    const mouse = { x: -999, y: -999 };

    const init = () => {
      w = root.clientWidth;
      h = root.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const n = Math.min(80, Math.round((w * h) / 24000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1 + Math.random() * 1.6 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
          if (d2 < 22000 && d2 > 1) { const d = Math.sqrt(d2); p.x -= (dx / d) * 0.5; p.y -= (dy / d) * 0.5; }
        }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(139,123,255,${((1 - d / 130) * 0.26).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 170) {
          ctx.strokeStyle = `rgba(95,216,255,${((1 - dm / 170) * 0.6).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(95,216,255,0.75)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduce) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (running) return; running = true; raf = requestAnimationFrame(draw); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    init();
    draw();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(root);
    const onResize = () => { window.clearTimeout(resizeT); resizeT = window.setTimeout(init, 200); };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      root.style.setProperty("--px", `${mouse.x}px`);
      root.style.setProperty("--py", `${mouse.y}px`);
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    window.addEventListener("resize", onResize);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      stop(); io.disconnect(); window.clearTimeout(resizeT);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // ---------- 3D tilt on the profile card ----------
  useEffect(() => {
    const el = tiltRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 14);
      rx(-(py - 0.5) * 14);
      el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--tx", `${((0.5 - px) * 14).toFixed(1)}px`);
      el.style.setProperty("--ty", `${((0.5 - py) * 14).toFixed(1)}px`);
    };
    const leave = () => { rx(0); ry(0); el.style.setProperty("--tx", "0px"); el.style.setProperty("--ty", "0px"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
    };
  }, []);

  // ---------- magnetic elements ----------
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>("[data-magnet]").forEach((el) => {
      const k = Number(el.dataset.magnet) || 0.3;
      const qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * k);
        qy((e.clientY - (r.top + r.height / 2)) * k * 1.4);
      };
      const leave = () => { qx(0); qy(0); };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.killTweensOf(el);
        gsap.set(el, { clearProps: "transform" });
      });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  // ---------- confetti on success ----------
  useEffect(() => {
    const host = panelRef.current;
    if (status !== "sent" || !host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#5fd8ff", "#8b7bff", "#ff5fae", "#ffb454", "#3ddc97"];
    for (let i = 0; i < 48; i++) {
      const s = document.createElement("i");
      s.className = "ct-confetti";
      s.style.background = colors[i % colors.length];
      host.appendChild(s);
      gsap.set(s, { left: "50%", top: "42%", scale: 0.6 + Math.random() });
      gsap.timeline({ onComplete: () => s.remove() })
        .to(s, { x: (Math.random() - 0.5) * 560, y: -(80 + Math.random() * 220), rotation: Math.random() * 540, duration: 0.7, ease: "power2.out" })
        .to(s, { y: "+=320", x: "+=30", opacity: 0, rotation: "+=360", duration: 1.1, ease: "power1.in" }, ">-0.05");
    }
  }, [status]);

  // ---------- form plumbing ----------
  const glow = (e: RPointerEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof Errors]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} copied`);
    } catch {
      flash("Press Ctrl + C to copy");
    }
  };

  const toggleFeature = (f: string) => setFeatures((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]));

  const validate = (): Errors => {
    const er: Errors = {};
    if (form.name.trim().length < 2) er.name = "Please tell me your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "Enter a valid email address";
    if (tab !== "call" && form.message.trim().length < 10) er.message = "Write at least 10 characters";
    if (tab === "call" && !slot) er.slot = "Pick a time slot";
    return er;
  };

  const callWhen = () => {
    const day = days[dayIdx];
    return slot && day ? slotInstant(day, slot) : null;
  };

  const compose = () => {
    const n = form.name.trim();
    const em = form.email.trim();
    const msg = form.message.trim();
    const sign = `\n\n— ${n} (${em})`;
    if (tab === "call") {
      const day = days[dayIdx];
      const modeLabel = MODES.find((m) => m.id === mode)?.label ?? "";
      const at = `${WD[day.wd]} ${day.d} ${MON[day.m - 1]}, ${slot} IST`;
      return {
        subject: `Call request: ${at}`,
        body: `Hi, I'd like to book a ${CALL_MINUTES}-minute call.\n\nWhen: ${at}\nVia: ${modeLabel}${msg ? `\nAgenda: ${msg}` : ""}${sign}`,
      };
    }
    if (tab === "project") {
      return {
        subject: `Project brief: ${topic} (${budgetLabel})`,
        body: `Type: ${topic}\nBudget: ${budgetLabel}\nTimeline: ${timeline}\nFeatures: ${features.length ? features.join(", ") : "not sure yet"}\n\n${msg}${sign}`,
      };
    }
    return { subject: `${topic} enquiry from ${n}`, body: `${msg}${sign}` };
  };

  const submit = async (how: "primary" | "whatsapp") => {
    if (status === "sending") return;
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) {
      panelRef.current?.classList.remove("ct-shake");
      void panelRef.current?.offsetWidth; // restart the animation
      panelRef.current?.classList.add("ct-shake");
      return;
    }
    const { subject, body } = compose();
    if (how === "whatsapp") {
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`${subject}\n\n${body}`)}`, "_blank", "noopener");
      setVia("whatsapp");
      setStatus("sent");
      return;
    }
    setStatus("sending");
    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            type: tab,
            name: form.name.trim(),
            email: form.email.trim(),
            topic,
            message: form.message.trim(),
            budget: tab === "project" ? budgetLabel : "",
            timeline: tab === "project" ? timeline : "",
            features: tab === "project" ? features : [],
            slot: tab === "call" && slot ? `${WD[days[dayIdx].wd]} ${days[dayIdx].d} ${MON[days[dayIdx].m - 1]}, ${slot} IST` : "",
            mode: tab === "call" ? MODES.find((m) => m.id === mode)?.label ?? "" : "",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          console.error("Contact API error:", res.status, j);
          throw new Error(String(res.status));
        }
        setVia("api");
      } else {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        await new Promise((r) => window.setTimeout(r, 900));
        setVia("mail");
      }
      setStatus("sent");
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    } catch {
      setStatus("error");
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit("primary");
  };
  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void submit("primary");
  };

  const reset = () => {
    setForm({ name: "", email: "", message: "" });
    setErrors({});
    setSlot("");
    setFeatures([]);
    setStatus("idle");
  };

  // ---------- small render helpers ----------
  const field = (name: "name" | "email", label: string, type: string) => (
    <div className={`ct-field${errors[name] ? " has-error" : ""}`}>
      <input id={`ct-${name}`} className="ct-input" name={name} type={type} value={form[name]} onChange={onChange} placeholder=" " autoComplete={name} aria-invalid={!!errors[name]} />
      <label htmlFor={`ct-${name}`}>{label}</label>
      <span className="ct-field__bar" />
      {errors[name] && <span className="ct-field__err">{errors[name]}</span>}
    </div>
  );

  const area = (label: string, rows: number) => (
    <div className={`ct-field ct-field--area${errors.message ? " has-error" : ""}`}>
      <textarea id="ct-message" className="ct-input" name="message" rows={rows} maxLength={800} value={form.message} onChange={onChange} placeholder=" " aria-invalid={!!errors.message} />
      <label htmlFor="ct-message">{label}</label>
      <span className="ct-field__bar" />
      <span className="ct-count">{form.message.length}/800</span>
      {errors.message && <span className="ct-field__err">{errors.message}</span>}
    </div>
  );

  const chips = (list: string[], value: string, set: (v: string) => void, label: string) => (
    <div className="ct-chips" role="group" aria-label={label}>
      {list.map((t) => (
        <button type="button" key={t} className={`ct-chip${value === t ? " is-on" : ""}`} onClick={() => set(t)} aria-pressed={value === t}>{t}</button>
      ))}
    </div>
  );

  const channels = [
    { key: "mail", label: "Email", value: email || "your@email.com", d: D.mail, href: `mailto:${email}`, copy: email, c: "var(--cyan)" },
    ...(WHATSAPP ? [{ key: "wa", label: "WhatsApp", value: "Chat instantly", d: D.chat, href: `https://wa.me/${WHATSAPP}`, copy: "", c: "var(--leaf)" }] : []),
    ...(PHONE ? [{ key: "tel", label: "Call", value: PHONE, d: D.phone, href: `tel:${PHONE.replace(/\s/g, "")}`, copy: PHONE, c: "var(--amber)" }] : []),
  ];

  const sentTitle = via === "api" ? "Message sent!" : via === "whatsapp" ? "WhatsApp is open" : "Almost there!";
  const sentText =
    via === "api" ? "Thanks for reaching out. I’ll get back to you soon."
    : via === "whatsapp" ? "Your message is ready in WhatsApp. Just press send."
    : "Your mail app should have opened with everything filled in. Just press send.";
  const when = tab === "call" ? callWhen() : null;
  const selDay = days[dayIdx];

  return (
    <section className="ct" id="contact" ref={rootRef}>
      <canvas className="ct-net" ref={canvasRef} aria-hidden="true" />
      <div className="ct-glow" aria-hidden="true" />
      <div className="ct-aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="ct-grid" aria-hidden="true" />

      <div className="ct-marquee" aria-hidden="true">
        <div className="ct-marquee__track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              {Array.from({ length: 4 }).map((__, i) => (
                <b key={i}>Let’s talk <i>✦</i> Open to new projects <i>✦</i> Say hello <i>✦</i></b>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="ct-wrap">
        {/* ---------------- header ---------------- */}
        <header className="ct-head-block">
          <span className="ct-eyebrow ct-rv"><i className="ct-dot" /> Contact</span>
          <h2 className="ct-title" aria-label={HEADING.join(" ")}>
            {HEADING.map((w, i) => (
              <span className="ct-title__w ct-rv" style={css({ "--d": `${i * 90}ms` })} key={w} aria-hidden="true">
                <span className={i === 3 ? "ct-grad" : undefined}>{w}</span>{" "}
              </span>
            ))}
          </h2>
          <p className="ct-lead ct-rv" style={css({ "--d": "300ms" })}>
            I can help with <span className="ct-role"><span key={role} className="ct-role__w">{ROLES[role]}</span></span>
          </p>
        </header>

        {/* ---------------- main: identity + form ---------------- */}
        <div className="ct-main">
          <aside className="ct-side">
            <div className="ct-id ct-rv" style={css({ "--d": "120ms" })}>
              <div className="ct-id__tilt" ref={tiltRef}>
                <span className="ct-id__sheen" aria-hidden="true" />
                <div className="ct-id__top">
                  <span className="ct-badge"><i className="ct-dot" />{availability || "Open to work"}</span>
                  <span className="ct-id__no">ID · 001</span>
                </div>

                <div className="ct-photo">
                  <span className="ct-photo__ring" aria-hidden="true" />
                  <span className="ct-photo__ring ct-photo__ring--2" aria-hidden="true" />
                  <div className="ct-photo__orbit" aria-hidden="true">
                    {ROLES.map((r, i) => (
                      <span className="ct-photo__chip" key={r} style={css({ "--a": `${(360 / ROLES.length) * i}deg` })}><b>{r}</b></span>
                    ))}
                  </div>
                  <div className="ct-photo__img"><img src={me} alt={DISPLAY_NAME} loading="lazy" draggable={false} /></div>
                </div>

                <h3 className="ct-id__name">{DISPLAY_NAME}</h3>
                <p className="ct-id__role">{ROLE_LINE}</p>
                {location && <p className="ct-id__loc"><Ico d={D.pin} size={14} />{location}</p>}

                <div className="ct-clock">
                  <div className="ct-clock__row">
                    <span>Local time · IST</span>
                    <strong className={online ? "is-on" : ""}><i className="ct-dot" />{online ? "Online now" : "Offline"}</strong>
                  </div>
                  <div className="ct-clock__time">{pad(h12)}:{pad(ist.min)}<small>:{pad(ist.s)}</small> <em>{ist.h < 12 ? "AM" : "PM"}</em></div>
                  <div className="ct-track" aria-hidden="true">
                    <i className="ct-track__win" style={css({ left: `${(WORK_HOURS[0] / 24) * 100}%`, width: `${((WORK_HOURS[1] - WORK_HOURS[0]) / 24) * 100}%` })} />
                    <i className="ct-track__now" style={css({ left: `${dayFrac * 100}%` })} />
                  </div>
                  <div className="ct-track__lbl"><span>12 AM</span><span>Working {fmtHr(WORK_HOURS[0])} – {fmtHr(WORK_HOURS[1])}</span><span>12 AM</span></div>
                </div>

                <ul className="ct-facts">
                  <li><Ico d={D.zap} size={15} /><small>Reply</small><b>&lt; 24 h</b></li>
                  <li><Ico d={D.globe} size={15} /><small>Zone</small><b>UTC+5:30</b></li>
                  <li><Ico d={D.chat} size={15} /><small>Speaks</small><b>{LANGS.join(" · ")}</b></li>
                </ul>
              </div>
            </div>

            <div className="ct-channels">
              {channels.map((c, i) => (
                <div className="ct-chan ct-rv" key={c.key} style={css({ "--d": `${220 + i * 80}ms`, "--c": c.c })}>
                  <a className="ct-chan__main" href={c.href} target={c.key === "wa" ? "_blank" : undefined} rel="noreferrer noopener" data-cursor={c.key === "mail" ? "Email" : c.key === "wa" ? "Chat" : "Call"}>
                    <span className="ct-chan__ico"><Ico d={c.d} /></span>
                    <span className="ct-chan__txt"><small>{c.label}</small><strong>{c.value}</strong></span>
                    <span className="ct-chan__go"><Ico d={D.arrow} size={16} /></span>
                  </a>
                  {c.copy && (
                    <button type="button" className="ct-chan__copy" onClick={() => copy(c.copy, c.label)} aria-label={`Copy ${c.label}`}>
                      <Ico d={D.copy} size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="ct-socials ct-rv" style={css({ "--d": "480ms" })}>
              {SOCIALS.filter((s) => s.label !== "GitHub" && s.label !== "X / Twitter").map((s) => (
                <a key={s.label} className="ct-social" href={s.href} target="_blank" rel="noreferrer noopener" aria-label={s.label} data-magnet="0.35">
                  <Ico d={s.d} /><span>{s.label}</span>
                </a>
              ))}
            </div>
          </aside>

          {/* ---------------- what happens next (fills the gap under the form) ---------------- */}
          <div className="ct-extra ct-rv" style={css({ "--d": "320ms" })}>
            <div className="ct-extra__head">
              <span className="ct-extra__eyebrow"><i className="ct-dot" />How it works</span>
              <h3 className="ct-extra__title">What happens <span className="ct-grad">after you hit send</span></h3>
            </div>
            <ol className="ct-steps">
              {STEPS.map((st, i) => (
                <li className="ct-step" key={st.t} style={css({ "--i": i })}>
                  <span className="ct-step__no">{`0${i + 1}`}</span>
                  <div className="ct-step__txt"><strong>{st.t}</strong><p>{st.d}</p></div>
                  <em className="ct-step__when">{st.when}</em>
                </li>
              ))}
            </ol>
            <div className="ct-stats">
              {STATS.map((x) => (
                <div className="ct-stat" key={x.l}><b>{x.n}</b><span>{x.l}</span></div>
              ))}
            </div>
          </div>

          {/* ---------------- form panel ---------------- */}
          <div className="ct-panel ct-rv" style={css({ "--d": "200ms", "--i": tabIdx })} ref={panelRef} onPointerMove={glow}>
            <div className="ct-tabs" role="tablist" aria-label="How would you like to reach me">
              <span className="ct-tabs__ind" aria-hidden="true" />
              {TABS.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`ct-tab${tab === t.id ? " is-on" : ""}`} onClick={() => { setTab(t.id); setErrors({}); }}>
                  <Ico d={t.d} size={16} /><span>{t.label}</span>
                </button>
              ))}
            </div>

            <form className={`ct-form${status === "sent" ? " is-hidden" : ""}`} onSubmit={onSubmit} onKeyDown={onKey} noValidate>
              <div className="ct-head">
                <h3 key={tab} className="ct-head__t">{meta.title}</h3>
                <p>{meta.sub}</p>
              </div>

              <div className="ct-row">
                {field("name", "Your name", "text")}
                {field("email", "Your email", "email")}
              </div>

              <div className="ct-pane" key={tab}>
                {tab === "message" && (
                  <>
                    {chips(TOPICS, topic, setTopic, "What is this about")}
                    {area("Tell me what's on your mind", 5)}
                  </>
                )}

                {tab === "call" && (
                  <>
                    <div className="ct-days" role="group" aria-label="Pick a day">
                      {days.map((d, i) => (
                        <button type="button" key={d.key} className={`ct-day${i === dayIdx ? " is-on" : ""}`} onClick={() => { setDayIdx(i); setSlot(""); }}>
                          <small>{WD[d.wd]}</small><b>{d.d}</b><em>{MON[d.m - 1]}</em>
                        </button>
                      ))}
                    </div>
                    <div className={`ct-slots${errors.slot ? " has-error" : ""}`} role="group" aria-label="Pick a time (IST)">
                      {SLOTS.map((s) => {
                        const past = selDay ? slotInstant(selDay, s).getTime() < now.getTime() + 3600000 : true;
                        return (
                          <button type="button" key={s} disabled={past} className={`ct-slot${slot === s ? " is-on" : ""}`} onClick={() => { setSlot(s); setErrors((e) => ({ ...e, slot: undefined })); }}>
                            {s}<small>IST</small>
                          </button>
                        );
                      })}
                    </div>
                    <p className="ct-slotnote" aria-live="polite">
                      {errors.slot ? errors.slot : when ? <>In your time: <b>{when.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}</b></> : "All slots are shown in IST, with a 1-hour notice."}
                    </p>
                    <div className="ct-modes" role="group" aria-label="Call type">
                      {MODES.map((m) => (
                        <button type="button" key={m.id} className={`ct-mode${mode === m.id ? " is-on" : ""}`} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}>{m.label}</button>
                      ))}
                    </div>
                    {area("Agenda (optional)", 3)}
                  </>
                )}

                {tab === "project" && (
                  <>
                    {chips(TOPICS, topic, setTopic, "Project type")}
                    <div className={`ct-budget${isCustomBudget ? " is-custom" : ""}`} style={css({ "--p": `${(budget / (BUDGETS.length - 1)) * 100}%` })}>
                      <div className="ct-budget__top"><span>Budget</span><strong>{budgetLabel}{isCustomBudget && <em className="ct-budget__tag">Custom</em>}</strong></div>
                      <input type="range" min={0} max={BUDGETS.length - 1} step={1} value={budget} onChange={(e) => { setBudget(Number(e.target.value)); setIsCustomBudget(false); }} aria-label="Budget range" />
                      <div className="ct-budget__ticks" aria-hidden="true">{BUDGETS.map((b) => <i key={b} />)}</div>
                      <button
                        type="button"
                        className={`ct-budget__pick${isCustomBudget ? " is-on" : ""}`}
                        aria-pressed={isCustomBudget}
                        onClick={() => setIsCustomBudget((v) => !v)}
                      >
                        <b>✎</b> {isCustomBudget ? "Using my own amount (tap to go back)" : "Not in these ranges? Type my own budget"}
                      </button>
                      {isCustomBudget && (
                        <>
                          <div className="ct-budget__custom">
                            <span>₹</span>
                            <input
                              type="text"
                              inputMode="text"
                              maxLength={30}
                              value={budgetText}
                              onChange={(e) => setBudgetText(e.target.value)}
                              placeholder="e.g. 3000 or 3k – 5k"
                              aria-label="Custom budget"
                              autoFocus
                            />
                          </div>
                          <p className="ct-budget__hint">Any amount is fine. Type what suits you and we can discuss it.</p>
                        </>
                      )}
                    </div>
                    {chips(TIMELINES, timeline, setTimeline, "Timeline")}
                    <div className="ct-chips ct-chips--feat" role="group" aria-label="Features">
                      {FEATURES.map((f) => (
                        <button type="button" key={f} className={`ct-chip${features.includes(f) ? " is-on" : ""}`} onClick={() => toggleFeature(f)} aria-pressed={features.includes(f)}>
                          {features.includes(f) ? "✓ " : "+ "}{f}
                        </button>
                      ))}
                    </div>
                    {area("Describe your project", 4)}
                  </>
                )}
              </div>

              <div className="ct-actions">
                <button className={`ct-send${status === "sending" ? " is-sending" : ""}`} type="submit" disabled={status === "sending"} data-magnet="0.25">
                  <span className="ct-send__shine" />
                  <span className="ct-send__label">{status === "sending" ? "Sending..." : tab === "call" ? "Request this slot" : tab === "project" ? "Send brief" : "Send message"}</span>
                  <span className="ct-send__ico"><Ico d={D.send} size={18} /></span>
                </button>
                {WHATSAPP && (
                  <button type="button" className="ct-wa" onClick={() => void submit("whatsapp")}>
                    <Ico d={D.chat} size={18} /><span>via WhatsApp</span>
                  </button>
                )}
              </div>
              <p className="ct-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send · your draft is saved on this device</p>

              {status === "error" && <p className="ct-error" role="alert">Something went wrong. Please try again, or email me directly.</p>}
            </form>

            {/* success state */}
            <div className={`ct-done${status === "sent" ? " is-on" : ""}`} aria-live="polite">
              <svg className="ct-done__check" viewBox="0 0 52 52" aria-hidden="true">
                <defs>
                  <linearGradient id="ct-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5fd8ff" />
                    <stop offset="100%" stopColor="#ff5fae" />
                  </linearGradient>
                </defs>
                <circle cx="26" cy="26" r="24" fill="none" stroke="url(#ct-g)" strokeWidth="2" />
                <path d="M15 27l8 8 14-16" fill="none" stroke="#5fd8ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>{sentTitle}</h3>
              <p>{sentText}</p>
              <div className="ct-done__btns">
                {tab === "call" && when && (
                  <button type="button" className="ct-again ct-again--solid" onClick={() => downloadIcs(when, `Call with ${DISPLAY_NAME}`, `${CALL_MINUTES}-minute call (${MODES.find((m) => m.id === mode)?.label ?? ""})`)}>
                    <Ico d={D.cal} size={16} /> Add to calendar
                  </button>
                )}
                <button type="button" className="ct-again" onClick={reset}>Send another</button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- map + faq ---------------- */}
        <div className="ct-lower">
          <div className="ct-map ct-rv" data-cursor="Explore">
            <div className="ct-map__bar">
              <span className="ct-map__live"><i className="ct-dot" />Live map</span>
              <div className="ct-map__ctl">
                <button type="button" className={mapType === "m" ? "is-on" : ""} onClick={() => setMapType("m")}>Map</button>
                <button type="button" className={mapType === "k" ? "is-on" : ""} onClick={() => setMapType("k")}>Satellite</button>
                <span className="ct-map__sep" />
                <button type="button" onClick={() => setZoom((z) => Math.max(5, z - 1))} aria-label="Zoom out"><Ico d={D.minus} size={14} /></button>
                <button type="button" onClick={() => setZoom((z) => Math.min(17, z + 1))} aria-label="Zoom in"><Ico d={D.plus} size={14} /></button>
              </div>
            </div>
            <div
              ref={mapFrameRef}
              className={`ct-map__frame${mapLive ? " is-live" : ""}${mapType === "k" ? " is-sat" : ""}`}
              onClick={() => { if (!mapLive) setMapLive(true); }}
            >
              <iframe
                key={`${mapType}-${zoom}-${place}`}
                title={`Map of ${place}`}
                src={mapSrc}
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <span className="ct-map__radar" aria-hidden="true"><i /><i /><i /></span>
              <span className="ct-map__corner ct-map__corner--a" aria-hidden="true" />
              <span className="ct-map__corner ct-map__corner--b" aria-hidden="true" />
              {!mapLive && <button type="button" className="ct-map__lock" onClick={() => setMapLive(true)}><Ico d={D.nav} size={16} />Click to explore the map</button>}
            </div>
            <div className="ct-map__foot">
              <div><small>Based in</small><strong>{place}</strong></div>
              <div className="ct-map__links">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`} target="_blank" rel="noreferrer noopener"><Ico d={D.nav} size={15} />Directions</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`} target="_blank" rel="noreferrer noopener"><Ico d={D.arrow} size={15} />Open in Maps</a>
              </div>
            </div>
          </div>

          <div className="ct-faq ct-rv" style={css({ "--d": "120ms" })}>
            <h3 className="ct-faq__title">Quick answers</h3>
            {FAQ.map((f, i) => (
              <div className={`ct-qa${faq === i ? " is-open" : ""}`} key={f.q}>
                <button type="button" className="ct-qa__q" onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i}>
                  <span>{f.q}</span><Ico d={D.chev} size={18} />
                </button>
                <div className="ct-qa__a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {name && (
        <div className="ct-name">
          <NameWordmark name={name} />
        </div>
      )}

      <footer className="ct-foot">
        <div className="ct-foot__row">
          <span>© {new Date().getFullYear()} · Designed &amp; built by me</span>
          <button type="button" className="ct-top" data-magnet="0.3" onClick={() => void glideTo(0)}>
            Back to top ↑
          </button>
        </div>
      </footer>

      <div className={`ct-toast${toast ? " is-on" : ""}`} role="status" aria-live="polite"><Ico d={D.check} size={16} />{toast || " "}</div>
    </section>
  );
}