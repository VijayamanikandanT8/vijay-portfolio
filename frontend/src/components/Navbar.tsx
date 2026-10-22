  import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
  import { createPortal } from "react-dom";
  import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
  import gsap from "gsap";
  import ScrollToPlugin from "gsap/ScrollToPlugin";
  import ScrollTrigger from "gsap/ScrollTrigger";
  import { glideToSection } from "../lib/glide";
  import type { NavbarInfo, NavLink } from "../types/site";
  import { Icon } from "../content/icons";

  gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

  
  const NAV_ICON: Record<string, keyof typeof Icon> = {
    Home: "home",
    About: "user",
    Skills: "code",
    Services: "layers",
    Projects: "folder",
    Experience: "briefcase",
    Education: "book",
    Certifications: "cup",
    Achievements: "target",
    Contact: "mail",
  };

  // Adds the Experience link right after Projects (before Education)
  // when the backend's link list doesn't already contain it.
  function withExperience(links: NavLink[]): NavLink[] {
    if (links.some((l) => l.href === "#experience")) return links;
    const exp: NavLink = { label: "Experience", href: "#experience" };
    const i = links.findIndex((l) => l.href === "#projects");
    if (i === -1) return [...links, exp];
    return [...links.slice(0, i + 1), exp, ...links.slice(i + 1)];
  }

  // Adds the Education link right after Experience when the backend's
  // link list doesn't already contain it.
  function withEducation(links: NavLink[]): NavLink[] {
    if (links.some((l) => l.href === "#education")) return links;
    const edu: NavLink = { label: "Education", href: "#education" };
    let i = links.findIndex((l) => l.href === "#experience");
    if (i === -1) i = links.findIndex((l) => l.href === "#projects");
    if (i === -1) return [...links, edu];
    return [...links.slice(0, i + 1), edu, ...links.slice(i + 1)];
  }

  // Adds the Certifications link right after Education when the backend's
  // link list doesn't already contain it.
  function withCertifications(links: NavLink[]): NavLink[] {
    if (links.some((l) => l.href === "#certifications")) return links;
    const cert: NavLink = { label: "Certifications", href: "#certifications" };
    const i = links.findIndex((l) => l.href === "#education");
    if (i === -1) return [...links, cert];
    return [...links.slice(0, i + 1), cert, ...links.slice(i + 1)];
  }

  // Adds the Achievements link right after Certifications when the backend's
  // link list doesn't already contain it.
  function withAchievements(links: NavLink[]): NavLink[] {
    if (links.some((l) => l.href === "#achievements")) return links;
    const ach: NavLink = { label: "Achievements", href: "#achievements" };
    const i = links.findIndex((l) => l.href === "#certifications");
    if (i === -1) return [...links, ach];
    return [...links.slice(0, i + 1), ach, ...links.slice(i + 1)];
  }

  // Adds the Services link right before Projects (after Skills) when the
  // backend's link list doesn't already contain it.
  function withServices(links: NavLink[]): NavLink[] {
    if (links.some((l) => l.href === "#services")) return links;
    const svc: NavLink = { label: "Services", href: "#services" };
    const i = links.findIndex((l) => l.href === "#projects");
    if (i === -1) return [...links, svc];
    const a = links.findIndex((l) => l.href === "#achievements");
    if (a === -1) return [...links.slice(0, i), svc, ...links.slice(i)];
    return [...links.slice(0, a + 1), svc, ...links.slice(a + 1)];
  }

  // Adds the Contact link at the end when the backend's link list doesn't
  // already contain it.
  function withContact(links: NavLink[]): NavLink[] {
    if (links.some((l) => l.href === "#contact")) return links;
    return [...links, { label: "Contact", href: "#contact" }];
  }

    // Quick-nav "speed dial": a round launcher that docks in a screen corner and fans the links out
  // along two quarter-circles. It picks the corner with the least content under it, so it never sits
  // on top of text/buttons; drag it to a corner to pin it there (double-click it to go back to auto).
  type Corner = "bl" | "br" | "tr" | "tl"; // bottom-left, bottom-right, top-right, top-left
  const CORNER_ORDER: Corner[] = ["bl", "br", "tr", "tl"]; // preference order
  const DOCK_RINGS = [114, 184]; // px radius of the inner / outer arc
  const DOCK_SIZE = 56;
  const DOCK_MARGIN = 22;
  const ZONE = 92; // px square checked for content around each corner
  const STORE_KEY = "navDockCorner";
  const CONTENT_TAGS = new Set(["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT", "IMG", "VIDEO", "LABEL"]);

  function isContent(el: Element) {
    if (CONTENT_TAGS.has(el.tagName)) return true;
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === 3 && n.textContent && n.textContent.trim()) return parseFloat(getComputedStyle(el).opacity) > 0.05;
    }
    return false;
  }

  // How many sample points in a corner's zone land on real content (text, links, buttons, images).
  function cornerHits(c: Corner, dock: HTMLElement | null) {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.clientHeight;
    const x0 = c[1] === "l" ? 10 : W - 10 - ZONE;
    const y0 = c[0] === "t" ? 10 : H - 10 - ZONE;
    let hits = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const stack = document.elementsFromPoint(x0 + (ZONE * (i + 0.5)) / 4, y0 + (ZONE * (j + 0.5)) / 4);
        for (const el of stack) {
          if (el === document.documentElement || el === document.body) continue;
          if (dock && dock.contains(el)) continue;
          if (isContent(el)) hits++;
          break;
        }
      }
    }
    return hits;
  }

  function pickCorner(current: Corner, dock: HTMLElement | null): Corner {
    const scores = CORNER_ORDER.map((c, i) => ({ c, s: cornerHits(c, dock) + (c[0] === "t" ? 1.5 : 0) + i * 0.25 }));
    const cur = scores.find((x) => x.c === current)!.s;
    const best = scores.reduce((m, x) => (x.s < m.s ? x : m));
    return best.s + 1 < cur ? best.c : current; // +1 = hysteresis, avoids hopping around
  }

  function readStoredCorner(): Corner | null {
    try {
      const v = localStorage.getItem(STORE_KEY);
      return v === "bl" || v === "br" || v === "tl" || v === "tr" ? v : null;
    } catch {
      return null;
    }
  }

  function fanPositions(n: number) {
    const inner = Math.ceil(n / 2);
    const counts = [inner, n - inner];
    const out: { x: number; y: number }[] = [];
    counts.forEach((count, ring) => {
      for (let k = 0; k < count; k++) {
        const deg = count === 1 ? 45 : (k / (count - 1)) * 90; // 0 = along the screen edge, 90 = up/down the side
        const rad = (deg * Math.PI) / 180;
        out.push({ x: Math.cos(rad) * DOCK_RINGS[ring], y: Math.sin(rad) * DOCK_RINGS[ring] });
      }
    });
    return out;
  }

  export default function Navbar({ navbar, siteName }: { navbar: NavbarInfo; siteName: string }) {
  const [open, setOpen] = useState(false);
  const links = withContact(withServices(withAchievements(withCertifications(withEducation(withExperience(navbar.links))))));
  const [active, setActive] = useState<string>(links[0].href);
  const [dockVisible, setDockVisible] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [pinnedCorner] = useState<Corner | null>(readStoredCorner);
  const [corner, setCorner] = useState<Corner>(pinnedCorner ?? "bl");
  const [pinned, setPinned] = useState(pinnedCorner !== null);
  const [placed, setPlaced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ sx: number; sy: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const lockUntil = useRef(0);

  // Moves the sliding highlight pill under the active link.
  const movePill = useCallback(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const el = list.querySelector<HTMLElement>(".nav-link.is-active");
    if (!el) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${el.offsetWidth}px`;
    pill.style.transform = `translateX(${el.offsetLeft}px)`;
  }, []);

  useLayoutEffect(() => {
    movePill();
  }, [active, movePill]);

  useEffect(() => {
    window.addEventListener("resize", movePill);
    const t = window.setTimeout(movePill, 400); // after web-fonts settle
    return () => {
      window.removeEventListener("resize", movePill);
      window.clearTimeout(t);
    };
  }, [movePill]);

  // Scroll-spy + progress bar + floating dock visibility.
  useEffect(() => {
    let raf = 0;
    let lastSpy = 0;
    let spyTimer = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      // only the dock ring reads this, so don't write it on <html> (that restyles the whole page)
      dockRef.current?.style.setProperty("--nav-progress", p.toFixed(3));

      // The checks below read layout. Run them about 8 times a second while scrolling
      // (with a trailing call, so the final state is always correct).
      const nowMs = performance.now();
      if (nowMs - lastSpy < 120) {
        window.clearTimeout(spyTimer);
        spyTimer = window.setTimeout(update, 130);
        return;
      }
      lastSpy = nowMs;

      const home = document.getElementById("home");
      const homeBottom = home ? home.getBoundingClientRect().bottom : 0;
      setDockVisible(homeBottom < window.innerHeight * 0.2);

      if (performance.now() < lockUntil.current) return; // a click-scroll is running
      const line = window.innerHeight * 0.4;
      let current = links[0].href;
      for (const l of links) {
        const sec = document.querySelector(l.href);
        if (!sec) continue;
        if (sec.getBoundingClientRect().top <= line) current = l.href;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navbar.links]);

  // Close the mobile menu if the screen grows past the tablet breakpoint (rotate / resize).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1200px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hide the floating dock while a section overlay (projects, education...) is open.
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    const check = () => setOverlayOpen(/-lock\b/.test(document.body.className));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // Collapse the dock when it hides, on Escape, or on a click/tap anywhere outside it.
  useEffect(() => {
    if (!dockVisible || overlayOpen) setDockOpen(false);
  }, [dockVisible, overlayOpen]);

  useEffect(() => {
    if (!dockOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDockOpen(false);
        fabRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) setDockOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [dockOpen]);

  // Put the dock in its corner (and keep it there on resize).
  useLayoutEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const place = () => {
      const W = document.documentElement.clientWidth;
      const H = document.documentElement.clientHeight;
      const x = corner[1] === "l" ? DOCK_MARGIN : W - DOCK_MARGIN - DOCK_SIZE;
      const y = corner[0] === "t" ? DOCK_MARGIN : H - DOCK_MARGIN - DOCK_SIZE;
      el.style.setProperty("--dx", `${x}px`);
      el.style.setProperty("--dy", `${y}px`);
    };
    place();
    const raf = requestAnimationFrame(() => setPlaced(true)); // no slide-in on first paint
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
    };
  }, [corner, dockVisible]);

  // Auto mode: whenever scrolling settles, move to the corner with the least content under it.
  useEffect(() => {
    if (!dockVisible || pinned || dockOpen || dragging) return;
    let t1 = 0;
    let t2 = 0;
    const evaluate = () => {
      const next = pickCorner(corner, dockRef.current);
      if (next !== corner) setCorner(next);
    };
    const schedule = () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      t1 = window.setTimeout(evaluate, 160);
      t2 = window.setTimeout(evaluate, 900); // second look once section animations have settled
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [dockVisible, pinned, dockOpen, dragging, corner, active]);

  // Drag the launcher to any corner to pin it; double-click it to return to auto.
  const onFabDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    drag.current = { sx: e.clientX, sy: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onFabMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 10) {
      d.moved = true;
      setDockOpen(false);
      setDragging(true);
    }
    if (d.moved && dockRef.current) {
      dockRef.current.style.setProperty("--dx", `${e.clientX - DOCK_SIZE / 2}px`);
      dockRef.current.style.setProperty("--dy", `${e.clientY - DOCK_SIZE / 2}px`);
    }
  };
  const onFabUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    suppressClick.current = true;
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.clientHeight;
    const next = ((e.clientY < H / 2 ? "t" : "b") + (e.clientX < W / 2 ? "l" : "r")) as Corner;
    setDragging(false);
    setCorner(next);
    setPinned(true);
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch {
      /* storage can be blocked; pinning just lasts for this visit */
    }
  };
  const onFabDouble = () => {
    setPinned(false);
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  };

  const go = (href: string) => {
    setActive(href);
    lockUntil.current = Infinity; // freeze the scroll-spy for the whole glide
    glideToSection(href).then(() => {
      lockUntil.current = performance.now() + 150;
    });
  };

    const fan = fanPositions(links.length);
  const activeLabel = links.find((l) => l.href === active)?.label ?? links[0].label;
  const dockUsable = dockVisible && !overlayOpen;

  const dock = (
    <div
      ref={dockRef}
      className={`nav-dock nav-dock--${corner}${dockUsable ? " is-visible" : ""}${dockOpen ? " is-open" : ""}${placed ? " is-placed" : ""}${dragging ? " is-dragging" : ""}${pinned ? " is-pinned" : ""}`}
      role="navigation"
      aria-label="Quick navigation"
    >
      <div className="nav-dock-in">
        <span className="nav-dock-halo" aria-hidden="true" />
        {links.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            className={`nav-dock-item${active === link.href ? " is-active" : ""}`}
            style={
              {
                ["--fx" as string]: `${fan[i].x.toFixed(1)}px`,
                ["--fy" as string]: `${fan[i].y.toFixed(1)}px`,
                ["--i" as string]: i,
              } as CSSProperties
            }
            aria-label={link.label}
            aria-current={active === link.href ? "page" : undefined}
            tabIndex={dockUsable && dockOpen ? 0 : -1}
            onClick={(e) => {
              e.preventDefault();
              setDockOpen(false);
              go(link.href);
            }}
          >
            {Icon[NAV_ICON[link.label] ?? "code"]}
            <span className="nav-dock-tip">{link.label}</span>
          </a>
        ))}
        <button
          ref={fabRef}
          type="button"
          className="nav-dock-fab"
          aria-label={dockOpen ? "Close quick navigation" : `Open quick navigation (current: ${activeLabel})`}
          aria-expanded={dockOpen}
          tabIndex={dockUsable ? 0 : -1}
          onPointerDown={onFabDown}
          onPointerMove={onFabMove}
          onPointerUp={onFabUp}
          onPointerCancel={onFabUp}
          onDoubleClick={onFabDouble}
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            setDockOpen((v) => !v);
          }}
        >
          <span className="nav-dock-ring" aria-hidden="true" />
          <span className="nav-dock-now" key={active} aria-hidden="true">
            {Icon[NAV_ICON[activeLabel] ?? "code"]}
          </span>
          <span className="nav-dock-x" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="nav-dock-pin" aria-hidden="true" />
          <span className="nav-dock-label" aria-hidden="true">{activeLabel}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <nav className="nav" aria-label="Main navigation">
        <a
          href="#home"
          className="nav-logo"
          onClick={(e) => {
            e.preventDefault();
            go("#home");
          }}
        >
          <span className="logo-bracket">{navbar.logoLeft}</span>
          <span className="logo-text">{navbar.logoText}</span>
          <span className="logo-bracket">{navbar.logoRight}</span>
          <span className="nav-logo-full">{siteName}</span>
        </a>

        <ul className="nav-links" ref={listRef}>
          <span className="nav-pill" ref={pillRef} aria-hidden="true" />
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`nav-link${active === link.href ? " is-active" : ""}`}
                aria-current={active === link.href ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(link.href);
                }}
              >
                <span className="nav-link-icon">{Icon[NAV_ICON[link.label] ?? "code"]}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <button
            className={`nav-hamburger${open ? " is-open" : ""}`}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <span className="nav-progress" ref={barRef} aria-hidden="true" />
      </nav>

      <div className={`mobile-backdrop${open ? " is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div className={`mobile-menu${open ? " is-open" : ""}`}>
        <ul>
          {links.map((link, i) => (
            <li key={link.href} style={{ ["--i" as string]: i }}>
              <a
                href={link.href}
                className={`mobile-link${active === link.href ? " is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  go(link.href);
                }}
              >
                <span className="mobile-link-icon">{Icon[NAV_ICON[link.label] ?? "code"]}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {createPortal(dock, document.body)}
    </>
  );
}