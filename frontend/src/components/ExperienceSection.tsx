import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./ExperienceSection.css";

// TweenMax (used by the original demo) auto-killed conflicting tweens; GSAP 3
// doesn't, so every tween here opts in. Scoped to this file only.
const to = (targets: gsap.TweenTarget, vars: gsap.TweenVars) =>
  gsap.to(targets, { overwrite: "auto", ...vars });

interface ExperienceItem {
  side: string; // vertical text beside the slide (company)
  title: string; // big word on the slide (keep it short)
  subtitle: string; // line under the title
  role: string; // heading when the slide is opened
  period: string;
  text: string; // long description shown when opened
  image: string;
}

// ---------------------------------------------------------------------------
// EDIT THIS LIST to change the experience entries (minimum 4 entries).
// Images live in public/images/experience (1.jpg, 2.jpg, ...)
// ---------------------------------------------------------------------------
const EXPERIENCE: ExperienceItem[] = [
  {
    side: "M & S Software India",
    title: "Intern",
    subtitle: "Project Internship",
    role: "Project Intern",
    period: "Jan 2023 – Apr 2023",
    text: "Completed a Project Internship at M&S Software India Pvt. Ltd., Chennai, while pursuing B.E. Computer Science. Worked on real-world software project tasks, applying web development fundamentals in a professional team environment and gaining hands-on exposure to the software development lifecycle.",
    image: "/images/experience/1.jpg",
  },
  {
    side: "M & S Software India",
    title: ".NET",
    subtitle: ".NET & Web Technologies Training",
    role: "Trainee – .NET & Web Technologies",
    period: "Jun 2023 – Sep 2023",
    text: "Successfully completed a 3-month training program at M&S Software India Pvt. Ltd., Chennai, in .NET and Web Technologies. Recognised by the company director as sincere and hardworking during the program.",
    image: "/images/experience/5.jpg",
  },
  {
    side: "JLA Tech Services",
    title: "Full Stack",
    subtitle: "Python Full Stack Developer",
    role: "Python Full Stack Developer",
    period: "Nov 2025 – Present",
    text: "Built and maintained Python/Django web applications using REST APIs, JWT authentication, SQL and Bootstrap 5, contributing to 35+ Django and AI/ML project deliverables. Developed responsive user interfaces using HTML5, CSS3, JavaScript and Bootstrap 5, integrating them with Django backend functionality.",
    image: "/images/experience/2.jpg",
  },
  {
    side: "JLA Tech Services",
    title: "AI & ML",
    subtitle: "AI Integration & Machine Learning",
    role: "Python Full Stack Developer",
    period: "Nov 2025 – Present",
    text: "Integrated the OpenAI API and Groq API (LLaMA 3) into Django backend applications, delivering real-time AI chatbot and text-prediction features. Built, trained and evaluated Scikit-learn classification models using Pandas and NumPy, including a Heart Disease Prediction system achieving 88%+ prediction accuracy.",
    image: "/images/experience/3.jpg",
  },
  {
    side: "JLA Tech Services",
    title: "Vision",
    subtitle: "Computer Vision & Delivery",
    role: "Python Full Stack Developer",
    period: "Nov 2025 – Present",
    text: "Developed an OpenCV-based computer vision module within a Django application for image processing, filtering, resizing and object detection. Owned features end-to-end across the SDLC: testing, debugging, deployment and database operations across SQLite, MySQL and Oracle SQL.",
    image: "/images/experience/4.jpg",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Equation of a line (y = mx + b).
const lineEq = (y2: number, y1: number, x2: number, x1: number, currentVal: number) => {
  const m = (y2 - y1) / (x2 - x1);
  const b = y1 - m * x1;
  return m * currentVal + b;
};

const CHARS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  ".", ":", ",", "^",
];

// Replaces the text of an element with one <span> per character
// (what "charming.js" did in the original demo).
function splitChars(el: HTMLElement) {
  const text = el.textContent ?? "";
  el.textContent = "";
  const spans: HTMLElement[] = [];
  for (const ch of text) {
    const s = document.createElement("span");
    s.textContent = ch;
    s.dataset.initial = ch;
    el.appendChild(s);
    spans.push(s);
  }
  return { spans, original: text };
}

const timers = new Set<number>();
const later = (fn: () => void, ms: number) => {
  const id = window.setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
  return id;
};

// Randomize letters: used when navigating, to switch the current slide's texts.
const randomizeLetters = (letters: HTMLElement[]) =>
  new Promise<void>((resolve) => {
    const total = letters.length;
    let cnt = 0;
    letters.forEach((letter, pos) => {
      let loopTimeout = 0;
      const loop = () => {
        letter.textContent = CHARS[getRandomInt(0, CHARS.length - 1)];
        loopTimeout = later(loop, getRandomInt(30, 120));
      };
      loop();
      later(() => {
        window.clearTimeout(loopTimeout);
        timers.delete(loopTimeout);
        letter.style.opacity = "1";
        letter.textContent = letter.dataset.initial ?? "";
        if (++cnt === total) resolve();
      }, pos * lineEq(40, 0, 8, 200, total));
    });
  });

// Hide each of the letters with delays: used when showing the content.
const disassembleLetters = (letters: HTMLElement[]) =>
  new Promise<void>((resolve) => {
    const total = letters.length;
    let cnt = 0;
    letters.forEach((letter, pos) => {
      later(() => {
        letter.style.opacity = "0";
        if (++cnt === total) resolve();
      }, pos * 30);
    });
  });

type Win = { width: number; height: number };

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------
class Slide {
  el: HTMLElement;
  imgWrap: HTMLElement;
  img: HTMLElement;
  textWrap: HTMLElement;
  number: HTMLElement;
  side: HTMLElement;
  titleLetters: HTMLElement[];
  sideLetters: HTMLElement[];
  private restore: Array<() => void> = [];
  width = 0;
  height = 0;
  transforms: { x: number; y: number; rotation: number }[] = [];
  isLeft = false;
  isRight = false;
  isCurrent = false;
  private mousetime = 0;
  private winRef: () => Win;
  private allowTilt: () => boolean;

  constructor(el: HTMLElement, winRef: () => Win, allowTilt: () => boolean) {
    this.el = el;
    this.winRef = winRef;
    this.allowTilt = allowTilt;
    this.imgWrap = el.querySelector<HTMLElement>(".exp-slide__img-wrap")!;
    this.img = this.imgWrap.querySelector<HTMLElement>(".exp-slide__img")!;
    this.textWrap = el.querySelector<HTMLElement>(".exp-slide__title-wrap")!;
    this.number = el.querySelector<HTMLElement>(".exp-slide__number")!;
    const title = el.querySelector<HTMLElement>(".exp-slide__title")!;
    this.side = el.querySelector<HTMLElement>(".exp-slide__side")!;

    const t = splitChars(title);
    const s = splitChars(this.side);
    this.restore.push(() => (title.textContent = t.original));
    this.restore.push(() => (this.side.textContent = s.original));
    // Shuffle so the letters animate in random order.
    this.titleLetters = [...t.spans].sort(() => 0.5 - Math.random());
    this.sideLetters = [...s.spans].sort(() => 0.5 - Math.random());

    this.calcSizes();
    this.calcTransforms();
  }

  calcSizes() {
    this.width = this.imgWrap.offsetWidth;
    this.height = this.imgWrap.offsetHeight;
  }

  // 0: outside top-left | 1: top-left (prev) | 2: center (current)
  // 3: bottom-right (next) | 4: outside bottom-right | 5: left side (content open)
    calcTransforms() {
    const w = this.winRef();

    // phones: horizontal carousel, neighbours peek in from the sides
    if (window.matchMedia("(max-width: 52.99em)").matches) {
      const step = this.width + 12; // card width + gap
      this.transforms = [
        { x: -2 * step, y: 0, rotation: 0 }, // 0 outside left (one full step past the peek)
        { x: -step, y: 0, rotation: 0 }, // 1 prev (peek)
        { x: 0, y: 0, rotation: 0 }, // 2 current
        { x: step, y: 0, rotation: 0 }, // 3 next (peek)
        { x: 2 * step, y: 0, rotation: 0 }, // 4 outside right (one full step past the peek)
        { x: 0, y: 0, rotation: 0 }, // 5 content open (banner stays centred)
      ];
      return;
    }

    // desktop (unchanged)
    this.transforms = [
      { x: -1 * (w.width / 2 + this.width), y: -1 * (w.height / 2 + this.height), rotation: -30 },
      { x: -1 * (w.width / 2 - this.width / 3), y: -1 * (w.height / 2 - this.height / 3), rotation: 0 },
      { x: 0, y: 0, rotation: 0 },
      { x: w.width / 2 - this.width / 3, y: w.height / 2 - this.height / 3, rotation: 0 },
      { x: w.width / 2 + this.width, y: w.height / 2 + this.height, rotation: 30 },
      { x: -1 * (w.width / 2 - this.width / 2 - w.width * 0.075), y: 0, rotation: 0 },
    ];
  }

  onEnter = () => {
    if (!this.isCurrent || !this.allowTilt()) return;
    window.clearTimeout(this.mousetime);
    this.mousetime = window.setTimeout(() => {
      to(this.img, { duration: 0.8, ease: "power3.out", scale: 1.1 });
    }, 40);
  };

  onMove = (ev: MouseEvent) =>
    requestAnimationFrame(() => {
      if (!this.allowTilt() || !this.isCurrent) return;
      this.tilt(ev);
    });

  onLeave = () =>
    requestAnimationFrame(() => {
      if (!this.allowTilt() || !this.isCurrent) return;
      window.clearTimeout(this.mousetime);
      to([this.imgWrap, this.textWrap], {
        duration: 1.8,
        ease: "power4.out",
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
      });
      to(this.img, { duration: 1.8, ease: "power4.out", scale: 1 });
    });

  tilt(ev: MouseEvent) {
    const bounds = this.imgWrap.getBoundingClientRect();
    const rel = { x: ev.clientX - bounds.left, y: ev.clientY - bounds.top };
    // Move -20..20px and rotate -15..15deg in both axes.
    const t = { x: [-20, 20], y: [-20, 20] };
    const r = { x: [-15, 15], y: [-15, 15] };
    const tx = ((t.x[1] - t.x[0]) / bounds.width) * rel.x + t.x[0];
    const ty = ((t.y[1] - t.y[0]) / bounds.height) * rel.y + t.y[0];
    const rx = ((r.x[1] - r.x[0]) / bounds.height) * rel.y + r.x[0];
    const ry = ((r.y[1] - r.y[0]) / bounds.width) * rel.x + r.y[0];

    to(this.imgWrap, {
      duration: 1.5,
      ease: "power1.out",
      x: tx,
      y: ty,
      rotationX: rx,
      rotationY: ry,
    });
    to(this.textWrap, { duration: 1.5, ease: "power1.out", x: -tx, y: -ty });
  }

  position(pos: number) {
    gsap.set(this.imgWrap, {
      x: this.transforms[pos].x,
      y: this.transforms[pos].y,
      rotationX: 0,
      rotationY: 0,
      opacity: 1,
      rotationZ: this.transforms[pos].rotation,
      ...(window.matchMedia("(max-width: 52.99em)").matches
        ? { filter: pos === 2 || pos === 5 ? "brightness(1)" : "brightness(0.42)" }
        : {}),
    });
  }

  setCurrent(isContentOpen?: boolean) {
    this.isCurrent = true;
    this.el.classList.add("exp-slide--current", "exp-slide--visible");
    this.position(isContentOpen ? 5 : 2);
  }

  setLeft(isContentOpen?: boolean) {
    this.isRight = this.isCurrent = false;
    this.isLeft = true;
    this.el.classList.add("exp-slide--visible");
    this.position(isContentOpen ? 0 : 1);
  }

  setRight(isContentOpen?: boolean) {
    this.isLeft = this.isCurrent = false;
    this.isRight = true;
    this.el.classList.add("exp-slide--visible");
    this.position(isContentOpen ? 4 : 3);
  }

  reset() {
    this.isRight = this.isLeft = this.isCurrent = false;
    this.el.className = "exp-slide";
  }

  hide() {
    gsap.set(this.imgWrap, { x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 0 });
  }

  // position: -2 outside TL | -1 prev | 0 center | 1 next | 2 outside BR | 3 left (content open)
  moveToPosition(settings: {
    position: number;
    from?: number;
    delay?: number;
    resetImageScale?: boolean;
  }) {
    return new Promise<void>((resolve) => {
      const { position, from, delay, resetImageScale } = settings;
      const mobile = window.matchMedia("(max-width: 52.99em)").matches;
      const dim = (p: number) => ({ filter: p === 0 || p === 3 ? "brightness(1)" : "brightness(0.42)" });
      to(this.imgWrap, {
        duration: 0.8,
        ease: "power4.inOut",
        delay: delay || 0,
        ...(mobile ? dim(position) : {}),
        startAt:
          from !== undefined
            ? {
                x: this.transforms[from + 2].x,
                y: this.transforms[from + 2].y,
                rotationX: 0,
                rotationY: 0,
                rotationZ: this.transforms[from + 2].rotation,
                ...(mobile ? dim(from) : {}),
              }
            : {},
        x: this.transforms[position + 2].x,
        y: this.transforms[position + 2].y,
        rotationX: 0,
        rotationY: 0,
        rotationZ: this.transforms[position + 2].rotation,
        onStart: from !== undefined ? () => void gsap.set(this.imgWrap, { opacity: 1 }) : undefined,
        onComplete: () => resolve(),
      });

      if (resetImageScale) {
        to(this.img, { duration: 0.8, ease: "power4.inOut", scale: 1 });
      }
    });
  }

  hideTexts(animation = false) {
    if (animation) {
      disassembleLetters(this.titleLetters).then(() => gsap.set(this.textWrap, { opacity: 0 }));
      disassembleLetters(this.sideLetters).then(() => gsap.set(this.side, { opacity: 0 }));
    } else {
      gsap.set(this.textWrap, { opacity: 0 });
      gsap.set(this.side, { opacity: 0 });
    }
  }

  showTexts(animation = true) {
    gsap.set(this.textWrap, { opacity: 1 });
    gsap.set(this.side, { opacity: 1 });
    if (animation) {
      randomizeLetters(this.titleLetters);
      randomizeLetters(this.sideLetters);
      to(this.number, {
        duration: 0.6,
        ease: "elastic.out(1,0.5)",
        startAt: { x: "-10%", opacity: 0 },
        x: "0%",
        opacity: 1,
      });
    }
  }

  destroy() {
    window.clearTimeout(this.mousetime);
    gsap.killTweensOf([this.imgWrap, this.img, this.textWrap, this.number]);
    gsap.set([this.imgWrap, this.img, this.textWrap, this.number, this.side], {
      clearProps: "transform,opacity",
    });
    this.restore.forEach((fn) => fn());
  }
}

// ---------------------------------------------------------------------------
// Content (one per slide)
// ---------------------------------------------------------------------------
class Content {
  el: HTMLElement;
  number: HTMLElement;
  title: HTMLElement;
  subtitle: HTMLElement;
  text: HTMLElement;
  backCtrl: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
    this.number = el.querySelector<HTMLElement>(".exp-content__number")!;
    this.title = el.querySelector<HTMLElement>(".exp-content__title")!;
    this.subtitle = el.querySelector<HTMLElement>(".exp-content__subtitle")!;
    this.text = el.querySelector<HTMLElement>(".exp-content__text")!;
    this.backCtrl = el.parentElement!.querySelector<HTMLElement>(".exp-content__close")!;
  }

  private parts() {
    return [this.backCtrl, this.number, this.title, this.subtitle, this.text];
  }

  show() {
    this.el.classList.add("exp-content__item--current");
    to(this.parts(), {
      duration: 0.8,
      ease: "power4.out",
      delay: 0.4,
      opacity: 1,
      startAt: { y: 40 },
      y: 0,
      stagger: 0.05,
    });
  }

  hide() {
    this.el.classList.remove("exp-content__item--current");
    to(this.parts().reverse(), {
      duration: 0.3,
      ease: "power3.in",
      opacity: 0,
      y: 10,
      stagger: 0.01,
    });
  }
}

// ---------------------------------------------------------------------------
// Slideshow
// ---------------------------------------------------------------------------
class Slideshow {
  root: HTMLElement;
  el: HTMLElement;
  deco: HTMLElement;
  slides: Slide[];
  contents: Content[];
  total: number;
  current = 0;
  isContentOpen = false;
  isAnimating = false;
  allowTilt = true;
  winsize: Win = { width: 0, height: 0 };

  currentSlide!: Slide;
  nextSlide!: Slide;
  prevSlide!: Slide;
  upcomingSlide!: Slide;

  private cleanups: Array<() => void> = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.el = root.querySelector<HTMLElement>(".exp-slideshow")!;
    this.deco = this.el.querySelector<HTMLElement>(".exp-slideshow__deco")!;
    this.calcWinsize();

    const winRef = () => this.winsize;
    const tiltRef = () => this.allowTilt;
    this.slides = Array.from(this.el.querySelectorAll<HTMLElement>(".exp-slide")).map(
      (s) => new Slide(s, winRef, tiltRef),
    );
    this.total = this.slides.length;
    this.contents = Array.from(
      root.querySelectorAll<HTMLElement>(".exp-content > .exp-content__item"),
    ).map((c) => new Content(c));

    if (this.total < 4) return; // needs at least 4 slides

    this.render();
    this.currentSlide.showTexts(false);
    this.initEvents();
  }

  calcWinsize() {
    this.winsize = { width: this.root.clientWidth, height: this.root.clientHeight };
  }

  render() {
    this.currentSlide = this.slides[this.current];
    this.nextSlide = this.slides[this.current + 1 <= this.total - 1 ? this.current + 1 : 0];
    this.prevSlide = this.slides[this.current - 1 >= 0 ? this.current - 1 : this.total - 1];
    this.currentSlide.setCurrent();
    this.nextSlide.setRight();
    this.prevSlide.setLeft();
  }

  private listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ) {
    target.addEventListener(type, fn);
    this.cleanups.push(() => target.removeEventListener(type, fn));
  }

  initEvents() {
    this.slides.forEach((slide) => {
      this.listen(slide.imgWrap, "click", () => {
        if (slide.isRight) this.navigate("next");
        else if (slide.isLeft) this.navigate("prev");
        else this.showContent();
      });
      this.listen(slide.imgWrap, "mouseenter", slide.onEnter);
      this.listen(slide.imgWrap, "mousemove", slide.onMove);
      this.listen(slide.imgWrap, "mouseleave", slide.onLeave);
    });

    this.listen(this.root.querySelector<HTMLElement>(".exp-content__close")!, "click", () =>
      this.hideContent(),
    );

    this.listen(this.root.querySelector<HTMLElement>(".exp-nav--prev")!, "click", () => this.navigate("prev"));
    this.listen(this.root.querySelector<HTMLElement>(".exp-nav--next")!, "click", () => this.navigate("next"));

    const onResize = () => {
      this.calcWinsize();
      this.slides.forEach((s) => {
        s.calcSizes();
        s.calcTransforms();
      });
      this.nextSlide.setRight(this.isContentOpen);
      this.prevSlide.setLeft(this.isContentOpen);
      this.currentSlide.setCurrent(this.isContentOpen);
      if (this.isContentOpen) {
        gsap.set(this.deco, {
          scaleX: this.winsize.width / this.deco.offsetWidth,
          scaleY: this.winsize.height / this.deco.offsetHeight,
          x: -20,
          y: 20,
        });
      }
    };
    window.addEventListener("resize", onResize);
    this.cleanups.push(() => window.removeEventListener("resize", onResize));

    // swipe left / right to change card
    let sx = 0;
    let sy = 0;
    const onTouchStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (this.isContentOpen || this.isAnimating) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) this.navigate(dx < 0 ? "next" : "prev");
    };
    this.el.addEventListener("touchstart", onTouchStart, { passive: true });
    this.el.addEventListener("touchend", onTouchEnd, { passive: true });
    this.cleanups.push(() => {
      this.el.removeEventListener("touchstart", onTouchStart);
      this.el.removeEventListener("touchend", onTouchEnd);
    });
  }

  showContent() {
    if (this.isContentOpen || this.isAnimating) return;
    this.allowTilt = false;
    this.isContentOpen = true;
    this.el.classList.add("exp-slideshow--previewopen");
    to(this.deco, {
      duration: 0.8,
      ease: "power4.inOut",
      scaleX: this.winsize.width / this.deco.offsetWidth,
      scaleY: this.winsize.height / this.deco.offsetHeight,
      x: -20,
      y: 20,
    });
    // Move away right/left slides.
    this.prevSlide.moveToPosition({ position: -2 });
    this.nextSlide.moveToPosition({ position: 2 });
    // Position the current slide and reset its image scale.
    this.currentSlide.moveToPosition({ position: 3, resetImageScale: true });
    this.contents[this.current].show();
    this.currentSlide.hideTexts(true);
  }

  hideContent() {
    if (!this.isContentOpen || this.isAnimating) return;
    this.el.classList.remove("exp-slideshow--previewopen");
    this.contents[this.current].hide();
    to(this.deco, {
      duration: 0.8,
      ease: "power4.inOut",
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
    });
    this.prevSlide.moveToPosition({ position: -1 });
    this.nextSlide.moveToPosition({ position: 1 });
    this.currentSlide.moveToPosition({ position: 0 }).then(() => {
      this.allowTilt = true;
      this.isContentOpen = false;
    });
    this.currentSlide.showTexts();
  }

  bounceDeco(direction: "next" | "prev", delay: number) {
    to(this.deco, {
      duration: 0.4,
      ease: "power2.in",
      delay: delay + delay * 0.2,
      x: direction === "next" ? -40 : 40,
      y: window.matchMedia("(max-width: 52.99em)").matches ? 0 : direction === "next" ? -40 : 40,
      onComplete: () => {
        to(this.deco, { duration: 0.6, ease: "power2.out", x: 0, y: 0 });
      },
    });
  }

  navigate(direction: "next" | "prev") {
    if (this.isAnimating || this.isContentOpen) return;
    this.isAnimating = true;
    this.allowTilt = false;

    const upcomingPos =
      direction === "next"
        ? this.current < this.total - 2
          ? this.current + 2
          : Math.abs(this.total - 2 - this.current)
        : this.current >= 2
          ? this.current - 2
          : Math.abs(this.total - 2 + this.current);

    this.upcomingSlide = this.slides[upcomingPos];

    this.current =
      direction === "next"
        ? this.current < this.total - 1
          ? this.current + 1
          : 0
        : this.current > 0
          ? this.current - 1
          : this.total - 1;

    this.prevSlide
      .moveToPosition({ position: direction === "next" ? -2 : 0, delay: direction === "next" ? 0 : 0.14 })
      .then(() => {
        if (direction === "next") this.prevSlide.hide();
      });

    this.currentSlide.moveToPosition({ position: direction === "next" ? -1 : 1, delay: 0.07 });
    this.currentSlide.hideTexts();

    this.bounceDeco(direction, 0.07);

    this.nextSlide
      .moveToPosition({ position: direction === "next" ? 0 : 2, delay: direction === "next" ? 0.14 : 0 })
      .then(() => {
        if (direction === "prev") this.nextSlide.hide();
      });

    const showIncoming = (s: Slide) =>
      window.matchMedia("(max-width: 52.99em)").matches ? later(() => s.showTexts(), 650) : s.showTexts();
    if (direction === "next") showIncoming(this.nextSlide);
    else showIncoming(this.prevSlide);

    this.upcomingSlide
      .moveToPosition({
        position: direction === "next" ? 1 : -1,
        from: direction === "next" ? 2 : -2,
        delay: 0.21,
      })
      .then(() => {
        [this.nextSlide, this.currentSlide, this.prevSlide].forEach((s) => s.reset());
        this.render();
        this.allowTilt = true;
        this.isAnimating = false;
      });
  }

  destroy() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    gsap.killTweensOf(this.deco);
    gsap.set(this.deco, { clearProps: "transform" });
    this.contents.forEach((c) =>
      gsap.killTweensOf([c.backCtrl, c.number, c.title, c.subtitle, c.text]),
    );
    this.slides.forEach((s) => {
      s.destroy();
      s.reset();
    });
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ExperienceSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const slideshow = new Slideshow(root);
    return () => slideshow.destroy();
  }, []);

  return (
    <section className="experience" id="experience" ref={rootRef}>
      <div className="exp-frame">
        <h2 className="exp-frame__title">Experience</h2>
        <span className="exp-frame__sub">Roles &amp; work history</span>
      </div>

      <div className="exp-slideshow">
        <div className="exp-slideshow__deco" />

        {EXPERIENCE.map((item, i) => (
          <div className="exp-slide" key={`${item.title}-${i}`}>
            <div
              className="exp-slide__img-wrap"
              style={{ "--exp-img": `url(${item.image})` } as React.CSSProperties}
            >
              <div
                className="exp-slide__img"
                style={{ backgroundImage: `url(${item.image})` }}
              />
            </div>
            <div className="exp-slide__side">{item.side}</div>
            <div className="exp-slide__title-wrap">
              <span className="exp-slide__number">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="exp-slide__title">{item.title}</h3>
              <h4 className="exp-slide__subtitle">{item.subtitle}</h4>
            </div>
          </div>
        ))}

        <button type="button" className="exp-nav exp-nav--prev" aria-label="Previous">
          <svg className="exp-icon exp-icon--prev" viewBox="0 0 408 408">
            <polygon
              fill="#fff"
              points="204 0 168.3 35.7 311.1 178.5 0 178.5 0 229.5 311.1 229.5 168.3 372.3 204 408 408 204"
            />
          </svg>
        </button>
        <button type="button" className="exp-nav exp-nav--next" aria-label="Next">
          <svg className="exp-icon exp-icon--next" viewBox="0 0 408 408">
            <polygon
              fill="#fff"
              points="204 0 168.3 35.7 311.1 178.5 0 178.5 0 229.5 311.1 229.5 168.3 372.3 204 408 408 204"
            />
          </svg>
        </button>
      </div>

      <div className="exp-content">
        {EXPERIENCE.map((item, i) => (
          <div className="exp-content__item" key={`c-${item.title}-${i}`}>
            <span className="exp-content__number">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="exp-content__title">{item.title}</h3>
            <h4 className="exp-content__subtitle">
              <span className="exp-sub__role">{item.role}</span>
              <span className="exp-sub__dot"> &middot; </span>
              <span className="exp-sub__company">{item.side}</span>
              <span className="exp-sub__dot"> &middot; </span>
              <span className="exp-sub__period">{item.period}</span>
            </h4>
            <div className="exp-content__text">{item.text}</div>
          </div>
        ))}
        <button type="button" className="exp-content__close" aria-label="Close">
          <svg className="exp-icon exp-icon--longarrow" viewBox="0 0 54 24">
            <path
              fill="currentColor"
              d="M.42 11.158L12.38.256c.333-.27.696-.322 1.09-.155.395.166.593.467.593.903v6.977h38.87c.29 0 .53.093.716.28.187.187.28.426.28.716v5.98c0 .29-.093.53-.28.716a.971.971 0 0 1-.716.28h-38.87v6.977c0 .416-.199.717-.592.903-.395.167-.759.104-1.09-.186L.42 12.62a1.018 1.018 0 0 1 0-1.462z"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}