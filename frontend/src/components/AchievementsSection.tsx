import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as RPointerEvent } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import "./AchievementsSection.css";

gsap.registerPlugin(ScrollToPlugin);

interface Achievement {
  image: string;
  avatar: string;
  title: string;
  subtitle: string;
  label: string;
  date: string;
  paragraphs: string[];
}

// ---------------------------------------------------------------------------
// EDIT THIS LIST to change the achievements.
// Images live in public/images/achievements (wide images, ~1920x500 work best)
// Avatars live in public/images/achievements/authors
// The first paragraph is shown larger when a card is opened.
// ---------------------------------------------------------------------------
const ACHIEVEMENTS: Achievement[] = [
  {
    image: "/images/achievements/a.jpg",
    avatar: "/images/achievements/authors/1.png",
    title: "Guest Speaker: AI & ML",
    subtitle: "Innovation Trend Analysis",
    label: "Guest Speaker",
    date: "06/2026",
    paragraphs: [
      "Invited as a Guest Speaker for an Artificial Intelligence & Machine Learning seminar at Christ The King Polytechnic College, Coimbatore, representing JLA Tech Services and our client Initz Technology.",
      "The session, “Real-Time Innovation Trend Analysis”, was delivered to the students of the AI & ML Department in an interactive format, with real-world examples and demonstrations showing how AI is transforming industries and creating new opportunities.",
      "Topics covered: AI & ML fundamentals, real-time innovation trend analysis, Generative AI and Large Language Models (LLMs), AI tools and their practical applications, ChatGPT, Gemini and modern AI assistants, AI in software development and business automation, career opportunities in AI, Machine Learning and Software Development, and future trends in Artificial Intelligence.",
      "It was inspiring to see the enthusiasm, curiosity and active participation of the students. Heartfelt thanks to the Management, Faculty Members and Students of Christ The King Polytechnic College, and to JLA Tech Services and Initz Technology for trusting me with this responsibility.",
    ],
  },
  {
    image: "/images/achievements/b.jpg",
    avatar: "/images/achievements/authors/2.png",
    title: "Resource Person: DL Workshop",
    subtitle: "Deep Learning Using Python",
    label: "Resource Person",
    date: "08/2026",
    paragraphs: [
      "Served as a Resource Person for a one-day hands-on workshop on “Deep Learning Using Python – From Fundamentals to Real-World Applications”, organised by the Department of Computer Science & BCA in association with the Internal Quality Assurance Cell (IQAC) at Government Arts and Science College (Co-Education), Kaikattiputhur, Avinashi.",
      "The workshop was held on 4 August 2026, from 10:00 AM to 4:00 PM in the Seminar Hall. I shared practical knowledge on Deep Learning using Python, from fundamentals to real-world applications, and demonstrated the concepts hands-on.",
      "It was a great experience to engage with enthusiastic students, answer their questions, demonstrate practical concepts, and contribute to their technical learning journey.",
      "Sincere thanks to JLA Tech Services, Erode, and Initz Technologies for recognizing my skills and giving me this opportunity. I am also grateful to Dr. B. Hemalatha, Principal (FAC), the Department of Computer Science & BCA, the IQAC and the entire college team for their warm hospitality, and to all the students for their active participation and curiosity.",
    ],
  },
  {
    image: "/images/achievements/c.jpg",
    avatar: "/images/achievements/authors/3.png",
    title: "First Prize: Project Expo",
    subtitle: "Virtual Paint with OpenCV",
    label: "Prize Winner",
    date: "04/2022",
    paragraphs: [
      "Won First Prize and a Certificate of Excellence at Project Expo & Science Day 2022, held at Nadar Saraswathi College of Engineering & Technology, Theni, on 26 April 2022, for my project “Virtual Paint with OpenCV” from the Department of Computer Science & Engineering.",
      "Virtual Paint is a computer vision project built with Python and OpenCV. It uses the webcam to detect and track a coloured marker in real time and turns its movement into drawing on a virtual canvas, so you can paint on screen without touching a mouse or a screen.",
      "The project covered colour detection, contour detection, real-time video processing and drawing on a live video feed. I presented and demonstrated it live to the judges and visitors, and explained how it works.",
      "Winning first place among the projects at the expo was an early milestone for me. It encouraged me to keep building practical projects in Python, Computer Vision and AI.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Triangle mesh, drawn on ONE canvas (replaces Trianglify + hundreds of SVG
// paths). Triangles are revealed with a soft edge around the circle the card
// is growing through, so the pattern "blooms" instead of popping.
// ---------------------------------------------------------------------------
interface Tri {
  x0: number; y0: number;
  x1: number; y1: number;
  x2: number; y2: number;
  cx: number; cy: number; // centre, used for the reveal distance
  bx: number; by: number; // bottom centre, triangles scale from here
}

const MESH_RGB = "222,101,81"; // same orange-red as the original demo 1
const MESH_FEATHER = 140; // px, width of the soft reveal edge
const BUCKETS = 6; // alpha levels, lets us stroke 6 paths instead of 600

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

function makeMesh(w: number, h: number, cell = 90): Tri[] {
  const rand = mulberry32(11);
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
    const minX = Math.min(a[0], b[0], c[0]);
    const maxX = Math.max(a[0], b[0], c[0]);
    out.push({
      x0: a[0], y0: a[1], x1: b[0], y1: b[1], x2: c[0], y2: c[1],
      cx: (a[0] + b[0] + c[0]) / 3,
      cy: (a[1] + b[1] + c[1]) / 3,
      bx: (minX + maxX) / 2,
      by: Math.max(a[1], b[1], c[1]),
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

const smooth = (t: number) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------------------
// Demo 1 numbers: circular clip, viewBox 1920 x 500.
// r = 992 = hypot(960, 250) so the circle fully covers the image.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GALLERY: the images shown under each achievement when its card is opened.
// One entry per achievement, in the same order as ACHIEVEMENTS above.
// Upload your pictures to public/images/achievements/gallery/
//   shots(2, 5)  ->  2-1.jpg, 2-2.jpg ... 2-5.jpg   (for achievement #2)
// Missing files are skipped automatically, so extra slots are harmless.
// For your own file names and captions write the list by hand, e.g.
//   [{ src: "/images/achievements/gallery/award.jpg", caption: "State award" }]
// ---------------------------------------------------------------------------
interface Shot {
  src: string;
  caption?: string;
}

const shots = (n: number, count = 10): Shot[] =>
  Array.from({ length: count }, (_, k) => ({
    src: `/images/achievements/gallery/${n}-${k + 1}.jpg`,
    caption: "",
  }));

const GALLERY: Shot[][] = [shots(1), shots(2, 7), shots(3)];

const pad2 = (n: number) => String(n).padStart(2, "0");

// ---------------------------------------------------------------------------
// DETAILS: the rich info shown inside an opened card (fact cards, organisation
// cards, topic tiles, skill chips, thank-you note, tags). One entry per
// achievement, same order as ACHIEVEMENTS. Use `undefined` to keep a card
// plain. Every field is optional: delete any block you don't want.
// When a card has DETAILS, only its FIRST paragraph is shown as the summary.
// ---------------------------------------------------------------------------
const ICONS = {
  mic: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8",
  spark: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  monitor: "M2 3h20v14H2z M8 21h8 M12 17v4",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  cap: "M22 10L12 5 2 10l10 5 10-5z M6 12v5c3 2 9 2 12 0v-5 M22 10v6",
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  arrow: "M5 12h14 M12 5l7 7-7 7",
} as const;
type IconName = keyof typeof ICONS;

interface Fact {
  icon: IconName;
  label: string;
  value: string;
}
interface Org {
  icon: IconName;
  mark: string; // big outlined letters in the card corner
  kind: string; // small pill, e.g. "Host institution"
  name: string;
  place?: string;
  lines: string[];
}
interface Topic {
  tag: string;
  title: string;
}
interface Details {
  facts?: Fact[];
  orgs?: Org[];
  topics?: Topic[];
  skills?: string[];
  note?: { text: string; next?: string };
  tags?: string[];
  link?: { label: string; href: string }; // e.g. your LinkedIn post
}

// colours cycled over the cards / chips (deep enough to read on white)
const ACCENTS = ["#0ea5c6", "#6d5cf0", "#e0368f", "#e08a00", "#16a36a", "#2f6fe0", "#e03150", "#0f9d8f"];

const DETAILS: (Details | undefined)[] = [
  {
    facts: [
      { icon: "mic", label: "Role", value: "Guest Speaker" },
      { icon: "spark", label: "Session", value: "Real-Time Innovation Trend Analysis" },
      { icon: "users", label: "Audience", value: "Students of the AI & ML Department" },
      { icon: "monitor", label: "Format", value: "Interactive, with real-world examples & demos" },
    ],
    orgs: [
      {
        icon: "briefcase",
        mark: "JLA",
        kind: "Represented",
        name: "JLA Tech Services",
        place: "Erode, Tamil Nadu",
        lines: [
          "My company: Python Full Stack Developer since Nov 2025",
          "Gave me the opportunity to represent our team",
        ],
      },
      {
        icon: "link",
        mark: "IT",
        kind: "Client partner",
        name: "Initz Technology",
        lines: ["Client of JLA Tech Services", "Trusted me with this responsibility"],
      },
      {
        icon: "cap",
        mark: "CK",
        kind: "Host institution",
        name: "Christ The King Polytechnic College",
        place: "Coimbatore, Tamil Nadu",
        lines: [
          "AI & ML Department",
          "Warm welcome and support from the Management, Faculty Members and Students",
        ],
      },
    ],
    topics: [
      { tag: "Fundamentals", title: "Artificial Intelligence & Machine Learning fundamentals" },
      { tag: "Trends", title: "Real-Time Innovation Trend Analysis" },
      { tag: "GenAI", title: "Generative AI and Large Language Models (LLMs)" },
      { tag: "Tools", title: "AI tools and their practical applications" },
      { tag: "Assistants", title: "ChatGPT, Gemini and modern AI assistants" },
      { tag: "Industry", title: "AI in software development and business automation" },
      { tag: "Career", title: "Career opportunities in AI, Machine Learning and Software Development" },
      { tag: "Future", title: "Future trends and innovations in Artificial Intelligence" },
    ],
    skills: [
      "Artificial Intelligence",
      "Machine Learning",
      "Generative AI",
      "LLMs",
      "ChatGPT",
      "Gemini",
      "AI Tools",
      "Python",
      "Django",
      "FastAPI",
      "Software Development",
      "Business Automation",
      "Technical Speaking",
      "Mentoring",
    ],
    note: {
      text: "A heartfelt thank you to the Management, Faculty Members and Students of Christ The King Polytechnic College for the warm welcome and support, and to JLA Tech Services and Initz Technology for trusting me with this responsibility and the opportunity to share my knowledge with future technology professionals.",
      next: "Looking forward to more technical sessions, workshops and knowledge-sharing initiatives.",
    },
    tags: [
      "ArtificialIntelligence",
      "MachineLearning",
      "GenerativeAI",
      "ChatGPT",
      "AI",
      "Python",
      "PythonDeveloper",
      "Django",
      "FastAPI",
      "Technology",
      "Innovation",
      "GuestSpeaker",
      "TechnicalSeminar",
      "Learning",
      "Coimbatore",
      "AITools",
      "SoftwareDevelopment",
      "CareerGrowth",
    ],
    // link: { label: "View the LinkedIn post", href: "https://www.linkedin.com/posts/your-post-link" },
  },
  {
    facts: [
      { icon: "mic", label: "Role", value: "Resource Person" },
      { icon: "spark", label: "Workshop", value: "Deep Learning Using Python" },
      { icon: "users", label: "Audience", value: "Students of Computer Science & BCA" },
      { icon: "monitor", label: "Format", value: "One-day hands-on · 4 Aug 2026 · 10:00 AM – 4:00 PM" },
    ],
    orgs: [
      {
        icon: "briefcase",
        mark: "JLA",
        kind: "Represented",
        name: "JLA Tech Services",
        place: "Erode, Tamil Nadu",
        lines: [
          "My company: Python Full Stack Developer since Nov 2025",
          "Recognized my skills and supported me for this opportunity",
        ],
      },
      {
        icon: "link",
        mark: "IT",
        kind: "Client partner",
        name: "Initz Technologies",
        lines: ["Client of JLA Tech Services", "Trusted and encouraged me to take up this role"],
      },
      {
        icon: "cap",
        mark: "GA",
        kind: "Host institution",
        name: "Government Arts and Science College (Co-Education)",
        place: "Kaikattiputhur, Avinashi, Tamil Nadu",
        lines: [
          "Department of Computer Science & BCA, with the IQAC",
          "Warm hospitality from Dr. B. Hemalatha, Principal (FAC), and the college team",
        ],
      },
    ],
    topics: [
      { tag: "Fundamentals", title: "Fundamentals of Deep Learning" },
      { tag: "Python", title: "Deep Learning using Python" },
      { tag: "Hands-on", title: "Practical demonstrations of key concepts" },
      { tag: "Real-world", title: "Real-world applications of Deep Learning" },
      { tag: "Q&A", title: "Interaction and doubt-clearing with students" },
    ],
    skills: [
      "Deep Learning",
      "Python",
      "Machine Learning",
      "Artificial Intelligence",
      "Hands-on Training",
      "Technical Speaking",
      "Teaching",
      "Mentoring",
      "Knowledge Sharing",
    ],
    note: {
      text: "Sincere thanks to JLA Tech Services, Erode, and Initz Technologies for recognizing my skills and giving me this valuable opportunity, to Dr. B. Hemalatha, Principal (FAC), the Department of Computer Science & BCA, the IQAC and the entire college team for their warm hospitality, and to all the students for their participation, curiosity and enthusiasm.",
      next: "Looking forward to more opportunities to Learn • Share • Inspire in the field of technology.",
    },
    tags: [
      "DeepLearning",
      "Python",
      "ArtificialIntelligence",
      "MachineLearning",
      "AI",
      "PythonProgramming",
      "Workshop",
      "HandsOnWorkshop",
      "ResourcePerson",
      "Teaching",
      "KnowledgeSharing",
      "ComputerScience",
      "StudentDevelopment",
      "Technology",
      "Learning",
      "CareerGrowth",
      "JLAtechServices",
      "InitzTechnologies",
      "Avinashi",
      "TamilNadu",
    ],
    // link: { label: "View the LinkedIn post", href: "https://www.linkedin.com/posts/your-post-link" },
  },
  {
    facts: [
      { icon: "spark", label: "Award", value: "First Prize · Certificate of Excellence" },
      { icon: "monitor", label: "Project", value: "Virtual Paint with OpenCV" },
      { icon: "cap", label: "Department", value: "Computer Science & Engineering" },
      { icon: "users", label: "Event", value: "Project Expo & Science Day 2022 · 26 April 2022" },
    ],
    orgs: [
      {
        icon: "cap",
        mark: "NS",
        kind: "Host institution",
        name: "Nadar Saraswathi College of Engineering & Technology",
        place: "Vadapudupatti, Theni, Tamil Nadu",
        lines: [
          "Approved by AICTE, affiliated to Anna University, Chennai",
          "Organised Project Expo & Science Day 2022",
        ],
      },
      {
        icon: "briefcase",
        mark: "CSE",
        kind: "Department",
        name: "Computer Science & Engineering",
        lines: [
          "Project exhibited under the CSE department",
          "Secured First Prize for the project",
        ],
      },
    ],
    topics: [
      { tag: "Detection", title: "Colour detection of a marker through the webcam" },
      { tag: "Tracking", title: "Real-time object tracking using contours" },
      { tag: "Canvas", title: "Drawing on a virtual canvas from hand movement" },
      { tag: "Tools", title: "Python and OpenCV for image and video processing" },
      { tag: "Result", title: "First Prize at Project Expo & Science Day 2022" },
    ],
    skills: [
      "OpenCV",
      "Python",
      "Computer Vision",
      "Image Processing",
      "Colour Detection",
      "Real-Time Video Processing",
      "Project Presentation",
      "Problem Solving",
    ],
    note: {
      text: "Winning First Prize with Virtual Paint was an early step on my journey in Python and Computer Vision. Thank you to Nadar Saraswathi College of Engineering & Technology, the coordinators and the judges for this recognition and for the platform to showcase my work.",
      next: "Always learning, building and looking for the next challenge.",
    },
    tags: [
      "ProjectExpo",
      "ScienceDay",
      "FirstPrize",
      "CertificateOfExcellence",
      "OpenCV",
      "ComputerVision",
      "Python",
      "VirtualPaint",
      "ImageProcessing",
      "ComputerScience",
      "Engineering",
      "StudentProject",
      "Innovation",
      "Theni",
    ],
    // link: { label: "View the LinkedIn post", href: "https://www.linkedin.com/posts/your-post-link" },
  },
];

function Ico({ n }: { n: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[n]} />
    </svg>
  );
}

const R_FULL = 992;
const R_SMALL = 60;
const BODY_LOCK = "ach-lock";
const CLOSED = "ach-card__container--closed";

type Phase = "idle" | "opening" | "open" | "closing";

export default function AchievementsSection() {
  // ---------------- gallery + full-screen viewer ----------------
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [lb, setLb] = useState<{ a: number; i: number } | null>(null);
  const [zoom, setZoom] = useState(false);
  const lbRef = useRef<HTMLDivElement>(null);
  const lbFrameRef = useRef<HTMLDivElement>(null);
  const lbOpenRef = useRef(false);
  const lbOriginRef = useRef<HTMLElement | null>(null);
  const lbDirRef = useRef(0);
  const lbFirstRef = useRef(true);
  const lbClosingRef = useRef(false);
  const swipeRef = useRef({ x: 0, moved: false });
  lbOpenRef.current = lb !== null;

  const shotsOf = (a: number) => (GALLERY[a] ?? []).filter((s) => !failed.has(s.src));

  const openLb = (a: number, i: number, origin: HTMLElement) => {
    lbOriginRef.current = origin;
    lbFirstRef.current = true;
    lbDirRef.current = 0;
    lbClosingRef.current = false;
    setZoom(false);
    setLb({ a, i });
  };

  const stepLb = (d: number) => {
    lbDirRef.current = d;
    setZoom(false);
    setLb((cur) => {
      if (!cur) return cur;
      const n = shotsOf(cur.a).length;
      return n < 2 ? cur : { a: cur.a, i: (cur.i + d + n) % n };
    });
  };

  const jumpLb = (i: number) => {
    if (!lb || lb.i === i) return;
    lbDirRef.current = i > lb.i ? 1 : -1;
    setZoom(false);
    setLb({ a: lb.a, i });
  };

  const closeLb = () => {
    if (lbClosingRef.current) return;
    lbClosingRef.current = true;
    const finish = () => {
      setLb(null);
      setZoom(false);
      lbOriginRef.current?.focus({ preventScroll: true });
    };
    if (lbRef.current) {
      gsap.to(lbRef.current, { autoAlpha: 0, duration: 0.25, ease: "power2.out", onComplete: finish });
    } else {
      finish();
    }
  };

  // viewer entrance + slide animation (backdrop fade, image scales / slides in)
  useEffect(() => {
    if (!lb) return;
    const backdrop = lbRef.current;
    const frame = lbFrameRef.current;
    if (!backdrop || !frame) return;
    const first = lbFirstRef.current;
    lbFirstRef.current = false;
    if (first) gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
    gsap.fromTo(
      frame,
      first ? { scale: 0.86, y: 40, autoAlpha: 0 } : { x: lbDirRef.current * 90, scale: 0.97, autoAlpha: 0 },
      { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: first ? 0.8 : 0.55, ease: "expo.out", overwrite: true }
    );
  }, [lb?.a, lb?.i, lb === null]);

  // viewer keyboard: Esc closes, arrows navigate
  useEffect(() => {
    if (!lb) return;
    const closeBtn = () => lbRef.current?.querySelector<HTMLElement>(".ach-lb__close") ?? null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLb();
      } else if (e.key === "ArrowRight") stepLb(1);
      else if (e.key === "ArrowLeft") stepLb(-1);
      else if (e.key === "Tab") {
        e.preventDefault();
        closeBtn()?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    closeBtn()?.focus({ preventScroll: true });
    return () => document.removeEventListener("keydown", onKey);
  }, [lb === null, failed]);

  // reveal the gallery tiles (stagger) as they scroll into view inside the opened card
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observers: IntersectionObserver[] = [];
    root.querySelectorAll<HTMLElement>(".ach-card__container").forEach((container) => {
      const targets = container.querySelectorAll<HTMLElement>(".ach-shot, .ach-gallery__head, .ach-rv");
      if (!targets.length) return;
      if (reduce) {
        targets.forEach((t) => t.classList.add("is-in"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => entries.forEach((en) => en.target.classList.toggle("is-in", en.isIntersecting)),
        { root: container, threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      targets.forEach((t) => io.observe(t));
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // 3D tilt + moving light on the gallery tiles (mouse only)
  const tiltMove = (e: RPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = (el.parentElement ?? el).getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--ry", `${((px - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - py) * 9).toFixed(2)}deg`);
  };
  const tiltReset = (e: RPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  const renderGallery = (a: number) => {
    const list = shotsOf(a);
    if (!list.length) return null;
    return (
      <div className="ach-gallery">
        <div className="ach-gallery__head">
          <span className="ach-gallery__label">Gallery</span>
          <span className="ach-gallery__count">{pad2(list.length)} photos</span>
          <span className="ach-gallery__line" />
          <span className="ach-gallery__hint">Click an image to view full screen</span>
        </div>
        <div className="ach-gallery__grid">
          {list.map((s, k) => (
            <figure className="ach-shot" key={s.src} style={{ "--i": k % 5 } as CSSProperties}>
              <button
                type="button"
                className="ach-shot__btn"
                aria-label={`View image ${k + 1} of ${list.length} full screen`}
                onClick={(e) => openLb(a, k, e.currentTarget)}
                onPointerMove={tiltMove}
                onPointerLeave={tiltReset}
              >
                <img
                  className="ach-shot__img"
                  src={s.src}
                  alt={s.caption || `${ACHIEVEMENTS[a].title} photo ${k + 1}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => setFailed((prev) => new Set(prev).add(s.src))}
                />
                <span className="ach-shot__shade" />
                <span className="ach-shot__shine" />
                <span className="ach-shot__num">{pad2(k + 1)}</span>
                <span className="ach-shot__cap">
                  <span>{s.caption || "View full screen"}</span>
                  <span className="ach-shot__zoom" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  </span>
                </span>
              </button>
            </figure>
          ))}
        </div>
      </div>
    );
  };

  const renderDetails = (a: number) => {
    const d = DETAILS[a];
    if (!d) return null;
    const acc = (k: number, i = k): CSSProperties =>
      ({ "--c": ACCENTS[k % ACCENTS.length], "--i": i % 8 }) as CSSProperties;
    const head = (label: string, count?: number) => (
      <div className="ach-sec__head ach-rv">
        <span className="ach-sec__label">{label}</span>
        {count !== undefined && <span className="ach-sec__count">{pad2(count)}</span>}
        <span className="ach-sec__line" />
      </div>
    );
    return (
      <div className="ach-info">
        {d.facts && d.facts.length > 0 && (
          <div className="ach-facts">
            {d.facts.map((f, k) => (
              <div className="ach-fact ach-rv" key={f.label} style={acc(k)}>
                <span className="ach-fact__ico">
                  <Ico n={f.icon} />
                </span>
                <span className="ach-fact__label">{f.label}</span>
                <span className="ach-fact__value">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {d.orgs && d.orgs.length > 0 && (
          <div className="ach-sec">
            {head("Who & where", d.orgs.length)}
            <div className="ach-orgs">
              {d.orgs.map((o, k) => (
                <Fragment key={o.name}>
                  {k > 0 && (
                    <span className="ach-orgs__link ach-rv" aria-hidden="true">
                      <Ico n="link" />
                    </span>
                  )}
                  <div className="ach-org ach-rv" style={acc(k + 1)}>
                    <span className="ach-org__mark" aria-hidden="true">
                      {o.mark}
                    </span>
                    <div className="ach-org__top">
                      <span className="ach-org__badge">
                        <Ico n={o.icon} />
                      </span>
                      <span className="ach-org__kind">{o.kind}</span>
                    </div>
                    <div className="ach-org__name">{o.name}</div>
                    {o.place && (
                      <div className="ach-org__place">
                        <Ico n="pin" />
                        {o.place}
                      </div>
                    )}
                    <ul className="ach-org__lines">
                      {o.lines.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {d.topics && d.topics.length > 0 && (
          <div className="ach-sec">
            {head("Topics covered", d.topics.length)}
            <div className="ach-topics">
              {d.topics.map((t, k) => (
                <div className="ach-topic ach-rv" key={t.title} style={acc(k + 2, k)}>
                  <span className="ach-topic__no">{pad2(k + 1)}</span>
                  <span className="ach-topic__tag">{t.tag}</span>
                  <span className="ach-topic__title">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.skills && d.skills.length > 0 && (
          <div className="ach-sec">
            {head("Skills & tools", d.skills.length)}
            <div className="ach-skills">
              {d.skills.map((s, k) => (
                <span className="ach-skill ach-rv" key={s} style={acc(k)}>
                  <i className="ach-skill__dot" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {d.note && (
          <blockquote className="ach-note ach-rv">
            <span className="ach-note__mark" aria-hidden="true">
              “
            </span>
            <div className="ach-note__text">{d.note.text}</div>
            {d.note.next && (
              <div className="ach-note__next">
                <Ico n="spark" />
                {d.note.next}
              </div>
            )}
          </blockquote>
        )}

        {((d.tags && d.tags.length > 0) || d.link) && (
          <div className="ach-sec">
            {d.tags && d.tags.length > 0 && (
              <>
                {head("Tags")}
                <div className="ach-tags">
                  {d.tags.map((t, k) => (
                    <span className="ach-tag ach-rv" key={t} style={acc(k + 3, k)}>
                      #{t}
                    </span>
                  ))}
                </div>
              </>
            )}
            {d.link && (
              <a className="ach-link ach-rv" href={d.link.href} target="_blank" rel="noreferrer noopener">
                {d.link.label}
                <Ico n="arrow" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderLightbox = () => {
    if (!lb) return null;
    const list = shotsOf(lb.a);
    if (!list.length) return null;
    const idx = Math.min(lb.i, list.length - 1);
    const s = list[idx];
    const multi = list.length > 1;
    return createPortal(
      <div
        className="ach-lb"
        ref={lbRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${ACHIEVEMENTS[lb.a].title} images`}
        data-lenis-prevent
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLb();
        }}
      >
        <div className="ach-lb__top">
          <span className="ach-lb__count">
            {pad2(idx + 1)} / {pad2(list.length)}
          </span>
          <span className="ach-lb__title">{ACHIEVEMENTS[lb.a].title}</span>
          <button type="button" className="ach-lb__btn ach-lb__close" aria-label="Close viewer" onClick={closeLb}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className="ach-lb__stage"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLb();
          }}
          onPointerDown={(e) => {
            swipeRef.current = { x: e.clientX, moved: false };
          }}
          onPointerUp={(e) => {
            const dx = e.clientX - swipeRef.current.x;
            if (!zoom && multi && Math.abs(dx) > 60) {
              swipeRef.current.moved = true;
              stepLb(dx < 0 ? 1 : -1);
            }
          }}
        >
          {multi && (
            <button type="button" className="ach-lb__btn ach-lb__nav ach-lb__nav--prev" aria-label="Previous image" onClick={() => stepLb(-1)}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <div className="ach-lb__frame" ref={lbFrameRef} key={s.src}>
            <img
              className={`ach-lb__img${zoom ? " is-zoom" : ""}`}
              src={s.src}
              alt={s.caption || `${ACHIEVEMENTS[lb.a].title} photo ${idx + 1}`}
              draggable={false}
              onClick={(e) => {
                if (swipeRef.current.moved) return;
                const img = e.currentTarget;
                const r = (img.parentElement ?? img).getBoundingClientRect();
                img.style.transformOrigin = `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`;
                setZoom((z) => !z);
              }}
              onPointerMove={(e) => {
                if (!zoom) return;
                const img = e.currentTarget;
                const r = (img.parentElement ?? img).getBoundingClientRect();
                img.style.transformOrigin = `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`;
              }}
            />
          </div>

          {multi && (
            <button type="button" className="ach-lb__btn ach-lb__nav ach-lb__nav--next" aria-label="Next image" onClick={() => stepLb(1)}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="ach-lb__bar">
          <div className="ach-lb__cap">{s.caption}</div>
          {multi && (
            <div className="ach-lb__thumbs">
              {list.map((t, k) => (
                <button
                  key={t.src}
                  type="button"
                  className={`ach-lb__thumb${k === idx ? " is-on" : ""}`}
                  aria-label={`Show image ${k + 1}`}
                  onClick={() => jumpLb(k)}
                >
                  <img src={t.src} alt="" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };
  const rootRef = useRef<HTMLElement>(null);
  const meshRef = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  // Start every card fully clipped (circle r = 0) before the first paint,
  // the entrance animation below grows them into view.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.querySelectorAll<SVGCircleElement>(".ach-clip").forEach((c) => c.setAttribute("r", "0"));
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = meshRef.current;
    const scrim = scrimRef.current;
    if (!root || !canvas || !scrim) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduce ? 8 : 1;

    const cards = Array.from(root.querySelectorAll<HTMLElement>(".ach-card")).map((el, id) => ({
      id,
      el,
      container: el.querySelector<HTMLElement>(".ach-card__container")!,
      trigger: el.querySelector<SVGSVGElement>(".ach-card__image")!,
      clip: el.querySelector<SVGCircleElement>(".ach-clip")!,
      content: el.querySelector<HTMLElement>(".ach-card__content")!,
      close: el.querySelector<HTMLButtonElement>(".ach-card__btn-close")!,
      tl: null as gsap.core.Timeline | null,
    }));
    type CardState = (typeof cards)[number];

    let phase: Phase = "idle";
    let openId = -1;
    let entrance: gsap.core.Tween | null = null;

    // ---------------- mesh canvas ----------------
    let mesh: Tri[] = [];
    let vw = 0;
    let vh = 0;

    const buildMesh = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      const dpr = 1;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 0.8;
      ctx.lineJoin = "round";
      mesh = makeMesh(vw, vh, 130);
    };

    // Called every frame while the card floats. One clear + 6 strokes.
    const drawMesh = (track: { width: number; x: number; y: number }) => {
      ctx.clearRect(0, 0, vw, vh);
      const R = track.width / 2;
      if (R < 1) return;
      const paths: Path2D[] = [];
      const used: boolean[] = [];
      for (let b = 0; b < BUCKETS; b++) {
        paths.push(new Path2D());
        used.push(false);
      }
      for (let i = 0; i < mesh.length; i++) {
        const t = mesh[i];
        const dx = t.cx - track.x;
        const dy = t.cy - track.y;
        const k = (R - Math.sqrt(dx * dx + dy * dy)) / MESH_FEATHER;
        if (k <= 0) continue;
        const e = smooth(k > 1 ? 1 : k);
        const b = Math.max(0, Math.ceil(e * BUCKETS) - 1);
        const p = paths[b];
        used[b] = true;
        p.moveTo(t.bx + (t.x0 - t.bx) * e, t.by + (t.y0 - t.by) * e);
        p.lineTo(t.bx + (t.x1 - t.bx) * e, t.by + (t.y1 - t.by) * e);
        p.lineTo(t.bx + (t.x2 - t.bx) * e, t.by + (t.y2 - t.by) * e);
        p.closePath();
      }
      for (let b = 0; b < BUCKETS; b++) {
        if (!used[b]) continue;
        ctx.strokeStyle = `rgba(${MESH_RGB},${(((b + 1) / BUCKETS) * 0.9).toFixed(2)})`;
        ctx.stroke(paths[b]);
      }
    };

    buildMesh();
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (phase === "idle") buildMesh();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    // ---------------- warm up ----------------
    // Decode the card images while the browser is idle, so the first open
    // never stalls on image decoding.
    const warm = () =>
      ACHIEVEMENTS.forEach((a) => {
        const img = new Image();
        img.decoding = "async";
        img.src = a.image;
        img.decode?.().catch(() => undefined);
      });
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (idle) idle(warm, { timeout: 2500 });
    else window.setTimeout(warm, 800);

    // ---------------- entrance (circle clip grows each card into view) ----
    let io: IntersectionObserver | null = null;
    if (!reduce) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io?.disconnect();
          entrance = gsap.to(
            cards.map((c) => c.clip),
            {
              attr: { r: R_FULL },
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.08,
            }
          );
        },
        { threshold: 0.15 }
      );
      io.observe(root.querySelector(".ach-wrapper")!);
    }

    // ---------------- other cards ----------------
    const others = (id: number) => cards.filter((c) => c.id !== id).map((c) => c.el);

    const hideOthers = (id: number) => {
      const els = others(id);
      els.forEach((el) => el.classList.add("ach-card--fading"));
      gsap.to(els, {
        scale: 0.8,
        autoAlpha: 0,
        transformOrigin: "center bottom",
        duration: 0.4,
        ease: "expo.inOut",
        overwrite: "auto",
      });
    };

    const showOthers = (id: number, delay: number) => {
      const els = others(id);
      gsap.to(els, {
        scale: 1,
        autoAlpha: 1,
        duration: 0.5,
        delay,
        ease: "expo.inOut",
        overwrite: "auto",
        clearProps: "all",
        onComplete: () => els.forEach((el) => el.classList.remove("ach-card--fading")),
      });
    };

    // ---------------- open timeline (demo 1) ----------------
    const buildOpen = (card: CardState) => {
      const { container, content, clip } = card;
      const tl = gsap.timeline({ paused: true });

      // 1. caption/content slides out of the way
      const slideDown = gsap.to(content, { y: window.innerHeight, duration: 0.8, ease: "expo.inOut" });

      // 2. circular clip shrinks to a small circle
      const clipIn = gsap.fromTo(
        clip,
        { attr: { r: R_FULL } },
        { attr: { r: R_SMALL }, duration: 0.8, ease: "expo.inOut", immediateRender: false }
      );

      // 3. card floats to full screen; the mesh blooms around it
      const rect = container.getBoundingClientRect();
      const windowW = window.innerWidth;
      const windowH = window.innerHeight;
      const track = { width: 0, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const float = gsap.timeline();
      float.set(container, {
        width: rect.width,
        height: rect.height,
        x: rect.left,
        y: rect.top,
        position: "fixed",
        overflow: "hidden",
        willChange: "width, height, transform",
      });
      float.to(
        container,
        {
          width: windowW,
          height: windowH,
          x: windowW / 2,
          y: 0,
          xPercent: -50,
          force3D: true,
          duration: 2,
          ease: "expo.inOut",
          clearProps: "all",
          // content is slid out of view by now, so swapping layouts is invisible
          onStart: () => container.classList.remove(CLOSED),
          // when rewinding (closing) the closed layout must be back before
          // the caption slides into place again
          onReverseComplete: () => container.classList.add(CLOSED),
        },
        0
      );
      float.to(
        track,
        {
          width: windowW,
          x: windowW / 2,
          y: 0,
          duration: 2,
          ease: "expo.inOut",
          onUpdate: () => drawMesh(track),
        },
        0
      );

      // 4. circular clip grows back to full size
      const clipOut = gsap.fromTo(
        clip,
        { attr: { r: R_SMALL } },
        { attr: { r: R_FULL }, duration: 0.8, ease: "expo.inOut", immediateRender: false }
      );

      // 5. article content slides up
      const slideUp = gsap.to(content, { y: 0, duration: 1, ease: "expo.inOut", clearProps: "all" });

      tl.add(slideDown);
      tl.add(clipIn, 0);
      tl.add(float, `-=${clipIn.duration() * 0.6}`);
      tl.add(clipOut, `-=${float.duration() * 0.3}`);
      tl.add(slideUp, `-=${clipOut.duration() * 0.6}`);
      // dark scrim behind the mesh, so the page underneath never competes with it
      tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 0.94, duration: 1.2, ease: "power2.out" }, 0);
      tl.timeScale(speed);
      return tl;
    };

    const openCard = (card: CardState) => {
      if (phase !== "idle") return;
      phase = "opening";
      openId = card.id;
      entrance?.progress(1); // never open in the middle of the entrance

      document.body.classList.add(BODY_LOCK);
      root.classList.add("ach--open");
      card.trigger.setAttribute("tabindex", "-1");
      card.container.setAttribute("role", "dialog");
      card.container.setAttribute("data-lenis-prevent", "");
      card.container.setAttribute("aria-modal", "true");

      card.tl?.kill();
      const tl = buildOpen(card);
      card.tl = tl;
      tl.eventCallback("onComplete", () => {
        if (phase !== "opening") return;
        phase = "open";
        card.close.focus({ preventScroll: true });
      });

      hideOthers(card.id);
      tl.play(0);
    };

    // Close works at any moment, even while the card is still opening: the
    // timeline simply plays backwards from wherever it is.
    const closeCard = (card: CardState) => {
      if ((phase !== "open" && phase !== "opening") || !card.tl) return;
      phase = "closing";
      const tl = card.tl;

      gsap.to(card.container, {
        scrollTo: { y: 0 },
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          card.container.style.overflow = "hidden";
        },
      });

      tl.eventCallback("onReverseComplete", () => {
        gsap.set([card.container, card.content], { clearProps: "all" });
        card.container.classList.add(CLOSED);
        card.container.removeAttribute("role");
        card.container.removeAttribute("data-lenis-prevent");
        card.container.removeAttribute("aria-modal");
        card.trigger.setAttribute("tabindex", "0");
        ctx.clearRect(0, 0, vw, vh);
        document.body.classList.remove(BODY_LOCK);
        root.classList.remove("ach--open");
        phase = "idle";
        openId = -1;
        card.trigger.focus({ preventScroll: true });
      });

      showOthers(card.id, (tl.time() * 0.8) / speed);
      tl.reverse();
    };

    // ---------------- listeners ----------------
    const cleanups: Array<() => void> = [];
    cards.forEach((card) => {
      const onOpen = () => openCard(card);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCard(card);
        }
      };
      const onClose = () => closeCard(card);
      card.trigger.addEventListener("click", onOpen);
      card.trigger.addEventListener("keydown", onKey);
      card.close.addEventListener("click", onClose);
      cleanups.push(() => {
        card.trigger.removeEventListener("click", onOpen);
        card.trigger.removeEventListener("keydown", onKey);
        card.close.removeEventListener("click", onClose);
      });
    });

    const onDocKey = (e: KeyboardEvent) => {
      if (openId < 0 || lbOpenRef.current) return;
      if (e.key === "Escape") closeCard(cards[openId]);
      // simple focus trap: the close button is the only control in the dialog
      if (e.key === "Tab") {
        e.preventDefault();
        // cycle focus between the close button and the gallery images
        const els = Array.from(
          cards[openId].container.querySelectorAll<HTMLElement>(".ach-card__btn-close, .ach-link, .ach-shot__btn")
        );
        const at = els.indexOf(document.activeElement as HTMLElement);
        const next = e.shiftKey ? (at <= 0 ? els.length - 1 : at - 1) : at < 0 || at >= els.length - 1 ? 0 : at + 1;
        els[next].focus();
      }
    };
    document.addEventListener("keydown", onDocKey);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onDocKey);
      cleanups.forEach((fn) => fn());
      io?.disconnect();
      entrance?.kill();
      cards.forEach((c) => {
        c.tl?.kill();
        gsap.killTweensOf([c.el, c.container, c.content, c.clip]);
        gsap.set([c.el, c.container, c.content], { clearProps: "all" });
        c.clip.setAttribute("r", String(R_FULL));
        c.container.classList.add(CLOSED);
      });
      gsap.killTweensOf(scrim);
      gsap.set(scrim, { clearProps: "all" });
      document.body.classList.remove(BODY_LOCK);
      root.classList.remove("ach--open");
    };
  }, []);

  return (
    <section className="achievements" id="achievements" ref={rootRef}>
      <div className="ach-scrim" ref={scrimRef} aria-hidden="true" />
      <canvas className="ach-mesh" ref={meshRef} aria-hidden="true" />
      {renderLightbox()}

      <header className="ach-header">
        <span className="ach-header__eyebrow">Recognition</span>
        <h2 className="ach-header__title">Achievements</h2>
        <p className="ach-header__sub">Select a card to read the full story.</p>
      </header>

      <div className="ach-wrapper">
        {ACHIEVEMENTS.map((a, i) => (
          <div className="ach-card" key={a.title}>
            <div className={`ach-card__container ${CLOSED}`}>
              <svg
                className="ach-card__image"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 1920 500"
                preserveAspectRatio="xMidYMid slice"
                role="button"
                tabIndex={0}
                aria-label={`Open: ${a.title}`}
              >
                <defs>
                  <clipPath id={`ach-clip-${i}`}>
                    {/* r = 992 = hypot(960, 250) */}
                    <circle className="ach-clip" cx="960" cy="250" r={R_FULL} />
                  </clipPath>
                </defs>
                <image
                  clipPath={`url(#ach-clip-${i})`}
                  width="1920"
                  height="500"
                  xlinkHref={a.image}
                  preserveAspectRatio="xMidYMid slice"
                />
              </svg>
              <div className="ach-card__content">
                <button className="ach-card__btn-close" type="button" aria-label="Close">
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="ach-card__caption">
                  <h3 className="ach-card__title">{a.title}</h3>
                  <p className="ach-card__subtitle">{a.subtitle}</p>
                </div>
                <div className="ach-card__copy">
                  <div className="ach-meta">
                    <img className="ach-meta__avatar" src={a.avatar} alt="" width={40} height={40} loading="lazy" />
                    <span className="ach-meta__author">{a.label}</span>
                    <span className="ach-meta__date">{a.date}</span>
                  </div>
                  {a.paragraphs.map((p, k) => (
                    <Fragment key={k}>
                      {(!DETAILS[i] || k === 0) && <p>{p}</p>}
                      {k === 0 && renderDetails(i)}
                      {k === a.paragraphs.length - 1 && renderGallery(i)}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}