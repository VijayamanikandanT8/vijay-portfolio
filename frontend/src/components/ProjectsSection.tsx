import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import "./ProjectsSection.css";

gsap.registerPlugin(Flip, Observer);

interface ProjectItem {
  image: string;
  title: [string, string];
  meta: string;
  text: string;
}

// ---------------------------------------------------------------------------
// EDIT THIS LIST to change the projects. Images live in public/images/projects
// ---------------------------------------------------------------------------
const PROJECTS: ProjectItem[] = [
  {
    image: "/images/projects/1.jpg",
    title: ["Federated", "Health AI"],
    meta: "Privacy Preserving Disease Prediction Using Federated Learning",
    text: "Lets multiple hospitals collaboratively train disease-prediction models for conditions like diabetes, heart disease and cancer without ever sharing raw patient data. Only encrypted model updates leave each site, combined through secure aggregation, differential privacy and homomorphic encryption, keeping the system accurate, scalable and compliant with HIPAA and GDPR regulations.",
  },
  {
    image: "/images/projects/2.jpg",
    title: ["Cyber Attack", "Prediction"],
    meta: "Cyber Attack Prediction: From Traditional Machine Learning to Generative Artificial Intelligence",
    text: "Explores how generative AI models such as ChatGPT and DALL-E can strengthen cyber defence, from log analysis and incident response to synthetic training data and attack simulation. Python pipelines connect the models to SIEM and intrusion-detection tools, while the study also examines misuse risks and the need for responsible governance.",
  },
  {
    image: "/images/projects/3.jpg",
    title: ["Dynamic AES", "& Blockchain"],
    meta: "Dynamic AES Encryption and Blockchain Key Management: A Novel Solution for Cloud Data Security",
    text: "Encrypts every uploaded file with its own unique AES key before storing it on Google Drive, while the key is emailed to the owner and never kept on the server. Fingerprint-hash login, admin approval and blockchain-inspired key handling add further layers of protection, all built with Python and Django.",
  },
  {
    image: "/images/projects/4.jpg",
    title: ["Soil Health", "Digital Twin"],
    meta: "AI-Driven Soil Health Digital Twin for Predictive Irrigation and Nutrient Sustainability",
    text: "Combines IoT soil and weather sensors, AI solar-energy forecasting and evapotranspiration modelling to decide when and how much to irrigate solar-powered pumps. A live dashboard gives farmers real-time monitoring and alerts, helping cut water and energy waste while keeping crops healthy and productive across changing weather conditions.",
  },
  {
    image: "/images/projects/5.jpg",
    title: ["Battery", "Forecasting"],
    meta: "Generative AI for Battery Performance Forecasting in EVs",
    text: "Applies generative AI to forecast how electric vehicle batteries perform over time, learning patterns from historical battery data to anticipate changes in behaviour and health. Reliable forecasts support smarter charging, safer operation and better maintenance planning for EV owners and fleet operators, reducing unexpected failures and extending battery life.",
  },
  {
    image: "/images/projects/6.jpg",
    title: ["Invisible", "Watermarking"],
    meta: "Hybrid Image Protection System Using Invisible Watermarking",
    text: "A hybrid image protection system that embeds invisible watermarks into images, so ownership can be proven without visibly changing the picture. The hidden mark helps creators and organisations detect tampering, trace unauthorised copies and protect their visual content from misuse, combining several protection techniques in one workflow.",
  },
  {
    image: "/images/projects/7.jpg",
    title: ["Genetic", "Variants"],
    meta: "Machine Learning-Based Mobile Application for Predicting the Pathogenicity of Human Genetic Variants Using ClinVar and dbSNP Data",
    text: "A mobile application that uses machine learning trained on ClinVar and dbSNP data to predict whether human genetic variants are pathogenic. Users enter variant details and receive a prediction on their phone, making variant interpretation faster, simpler and more accessible for researchers, students and clinicians working in genomics.",
  },
  {
    image: "/images/projects/8.jpg",
    title: ["Lung", "Pathology"],
    meta: "Interpretable AI for Accurate Lung Pathology Identification Across CT and X-Ray Modalities",
    text: "An accurate, interpretable AI system that identifies lung pathologies from both CT scans and chest X-ray images, showing not only what it predicts but why. Clear explanations help radiologists and clinicians trust the results, while working across two imaging modalities makes the tool flexible for real hospital workflows.",
  },
  {
    image: "/images/projects/9.jpg",
    title: ["Certificate", "Verification"],
    meta: "Secure Intelligent Certificate Extraction and Verification System",
    text: "Extracts names, dates, registration numbers, signatures and seals from scanned certificates using Tesseract OCR and OpenCV, then verifies authenticity with machine learning, template matching and rule-based checks against trusted databases. Encryption, role-based access and audit logs keep data secure, and a web dashboard shows results with confidence scores.",
  },
  {
    image: "/images/projects/10.jpg",
    title: ["Plagiarism", "Detection"],
    meta: "Plagiarism Detection System Using Language Processing Techniques for Student Assignments and Code Submissions",
    text: "A plagiarism detection system that uses language processing techniques to compare student work and flag suspicious similarity. It covers both written assignments and code submissions, helping teachers review originality fairly and quickly, and encouraging students to submit their own work instead of copying from classmates or online sources.",
  },
];

// One row of tags per project (same order as PROJECTS above)
const TAGS: string[][] = [
  ["Federated Learning", "Differential Privacy", "Encryption"],
  ["Generative AI", "Python", "SIEM / IDS"],
  ["AES", "Blockchain", "Python · Django"],
  ["IoT", "Digital Twin", "AI Forecasting"],
  ["Generative AI", "Time-series", "EV Batteries"],
  ["Watermarking", "Image Security", "Hybrid"],
  ["Machine Learning", "Mobile App", "ClinVar · dbSNP"],
  ["Explainable AI", "CT · X-Ray", "Deep Learning"],
  ["Tesseract OCR", "OpenCV", "Machine Learning"],
  ["NLP", "Code Similarity", "Education"],
];

const BODY_LOCK = "proj-lock";

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stackWrapRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stackWrap = stackWrapRef.current;
    const stack = stackRef.current;
    const slides = slidesRef.current;
    const content = contentRef.current;
    const title = titleRef.current;
    const backCtrl = backRef.current;
    const prevBtn = prevRef.current;
    const nextBtn = nextRef.current;
    if (!section || !stackWrap || !stack || !slides || !content || !title || !backCtrl || !prevBtn || !nextBtn) return;

    const items = Array.from(stack.querySelectorAll<HTMLElement>(".proj-stack__item:not(.proj-stack__item--empty)"));
    const contentItems = Array.from(content.querySelectorAll<HTMLElement>(".proj-content__item"));
    const textsOf = (i: number) =>
      Array.from(contentItems[i].querySelectorAll<HTMLElement>(".proj-oh > .proj-oh__inner"));
    const mainTitleTexts = Array.from(title.querySelectorAll<HTMLElement>(".proj-oh > .proj-oh__inner"));
    const navArrows = [prevBtn, nextBtn];
    const total = items.length;

    let winH = window.innerHeight;
    const onResize = () => {
      winH = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    const onMove = (e: MouseEvent) => {
      section.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      section.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
    };
    let moveRaf = 0;
    let lastMove: MouseEvent | null = null;
    const onMoveThrottled = (e: MouseEvent) => {
      lastMove = e;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        if (lastMove) onMove(lastMove);
      });
    };
    window.addEventListener("mousemove", onMoveThrottled, { passive: true });

    let isOpen = false;
    let isAnimating = false;
    let current = -1;

    const open = (stackItem: HTMLElement) => {
      if (isAnimating || isOpen) return;
      isAnimating = true;
      current = items.indexOf(stackItem);
      scrollObserver.enable();

      // Keep the section's height while the stack is moved out of it.
      stackWrap.style.height = `${stackWrap.offsetHeight}px`;

      document.body.classList.add(BODY_LOCK);
      section.classList.add("projects--open");
      content.classList.add("proj-content--open");
      contentItems[current].classList.add("proj-content__item--current");
      items[current].classList.add("proj-stack__item--current");

      const state = Flip.getState(items, { props: "opacity" });
      slides.appendChild(stack);

      // .proj-slides is fixed to the viewport, so offsets are viewport based.
      const itemCenter = stackItem.offsetTop + stackItem.offsetHeight / 2;
      const focusY = window.matchMedia("(max-width: 52.99em)").matches ? slides.clientHeight / 2 : winH / 2;
      gsap.set(stack, { y: focusY - itemCenter });

      Flip.from(state, {
        duration: 1,
        ease: "expo",
        onComplete: () => {
          isOpen = true;
          isAnimating = false;
        },
        absoluteOnLeave: true,
      })
        .to(mainTitleTexts, { duration: 0.9, ease: "expo", yPercent: -101 }, 0)
        .to(textsOf(current), { duration: 1, ease: "expo", startAt: { yPercent: 101 }, yPercent: 0 }, 0)
        .to(backCtrl, { duration: 1, ease: "expo", startAt: { opacity: 0 }, opacity: 1 }, 0)
        .to(
          navArrows,
          {
            duration: 1,
            ease: "expo",
            startAt: { opacity: 0, y: (pos: number) => (pos ? -150 : 150) },
            y: 0,
            opacity: (pos: number) => ((current === 0 && !pos) || (current === total - 1 && pos) ? 0 : 1),
          },
          0
        );
    };

    const close = () => {
      if (isAnimating || !isOpen) return;
      isAnimating = true;
      scrollObserver.disable();
      items[current].classList.remove("proj-stack__item--current");
      document.body.classList.remove(BODY_LOCK);

      const state = Flip.getState(items, { props: "opacity" });
      stackWrap.appendChild(stack);
      gsap.set(stack, { y: 0 });

      Flip.from(state, {
        duration: 1,
        ease: "expo",
        onComplete: () => {
          section.classList.remove("projects--open");
          content.classList.remove("proj-content--open");
          contentItems[current].classList.remove("proj-content__item--current");
          stackWrap.style.height = "";
          current = -1;
          isOpen = false;
          isAnimating = false;
        },
        absoluteOnLeave: true,
      })
        .to(mainTitleTexts, { duration: 0.9, ease: "expo", startAt: { yPercent: 101 }, yPercent: 0 }, 0)
        .to(textsOf(current), { duration: 1, ease: "expo", yPercent: -101 }, 0)
        .to(backCtrl, { duration: 1, ease: "expo", opacity: 0 }, 0)
        .to(
          navArrows,
          { duration: 1, ease: "expo", y: (pos: number) => (pos ? 100 : -100), opacity: 0 },
          0
        );
    };

    const navigate = (direction: "prev" | "next") => {
      if (
        isAnimating ||
        (direction === "next" && current === total - 1) ||
        (direction === "prev" && current === 0)
      )
        return;
      isAnimating = true;

      const previousCurrent = current;
      current = direction === "next" ? current + 1 : current - 1;

      items[previousCurrent].classList.remove("proj-stack__item--current");
      items[current].classList.add("proj-stack__item--current");

      gsap.set(prevBtn, { opacity: current > 0 ? 1 : 0 });
      gsap.set(nextBtn, { opacity: current < total - 1 ? 1 : 0 });

      const shift = items.length > 1 ? items[1].offsetTop - items[0].offsetTop : winH / 2 + winH * 0.02;
      gsap
        .timeline()
        .to(stack, {
          duration: 1,
          ease: "expo",
          y: direction === "next" ? `-=${shift}` : `+=${shift}`,
          onComplete: () => {
            isAnimating = false;
          },
        })
        .to(
          textsOf(previousCurrent),
          {
            duration: 0.2,
            ease: "power1",
            yPercent: direction === "next" ? 101 : -101,
            onComplete: () => contentItems[previousCurrent].classList.remove("proj-content__item--current"),
          },
          0
        )
        .to(
          textsOf(current),
          {
            duration: 0.9,
            ease: "expo",
            startAt: { yPercent: direction === "next" ? -101 : 101 },
            onStart: () => contentItems[current].classList.add("proj-content__item--current"),
            yPercent: 0,
          },
          0.2
        );
    };

    // Scroll / touch closes the open slideshow
    const scrollFn = () => {
      /* wheel / swipe now navigates; see onWheel below */
    };
    const scrollObserver = Observer.create({
      type: "wheel,touch",
      wheelSpeed: -1,
      onDown: scrollFn,
      onUp: scrollFn,
      tolerance: 10,
      preventDefault: !window.matchMedia("(max-width: 52.99em)").matches,
    });
    scrollObserver.disable();

    const clickHandlers = items.map((item) => {
      const fn = () => open(item);
      item.addEventListener("click", fn);
      return fn;
    });
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        navigate("next");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigate("prev");
      }
    };
    window.addEventListener("keydown", onKey);

    // Mouse wheel / trackpad: scroll down = next, scroll up = previous
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      if (!isOpen) return;
      e.preventDefault();
      const now = performance.now();
      if (isAnimating || now - lastWheel < 1100 || Math.abs(e.deltaY) < 8) return;
      lastWheel = now;
      navigate(e.deltaY > 0 ? "next" : "prev");
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // Touch: swipe up = next, swipe down = previous
    let touchY = 0;
    let touchOnText = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchOnText = !!(e.target as HTMLElement | null)?.closest?.(".proj-content__item--current");
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!isOpen || isAnimating || touchOnText) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) navigate(dy > 0 ? "next" : "prev");
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    const onBack = () => close();
    const onNext = () => navigate("next");
    const onPrev = () => navigate("prev");
    backCtrl.addEventListener("click", onBack);
    nextBtn.addEventListener("click", onNext);
    prevBtn.addEventListener("click", onPrev);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMoveThrottled);
      cancelAnimationFrame(moveRaf);
      items.forEach((item, i) => item.removeEventListener("click", clickHandlers[i]));
      backCtrl.removeEventListener("click", onBack);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      nextBtn.removeEventListener("click", onNext);
      prevBtn.removeEventListener("click", onPrev);
      scrollObserver.kill();
      gsap.killTweensOf([stack, ...mainTitleTexts, backCtrl, ...navArrows]);
      document.body.classList.remove(BODY_LOCK);
      // React owns the stack node, so it must be back in its wrapper before unmount.
      if (stack.parentElement !== stackWrap) stackWrap.appendChild(stack);
      stackWrap.style.height = "";
      section.classList.remove("projects--open");
    };
  }, []);

  return (
    <section className="projects" id="projects" ref={sectionRef}>
      <div className="proj-content" ref={contentRef}>
        {PROJECTS.map((p, i) => (
          <div className="proj-content__item" key={p.image}>
            <span className="proj-content__ghost" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="proj-content__eyebrow">
              <b>{String(i + 1).padStart(2, "0")}</b>
              <i />
              <span>{String(PROJECTS.length).padStart(2, "0")}</span>
              <em>Case study</em>
            </div>
            <h2 className="proj-content__item-title">
              <span className="proj-oh">
                <span className="proj-oh__inner">{p.title[0]}</span>
              </span>
              <span className="proj-oh">
                <span className="proj-oh__inner">{p.title[1]}</span>
              </span>
            </h2>
            <div className="proj-content__item-description">
              <p className="proj-oh">
                <strong className="proj-oh__inner">{p.meta}</strong>
              </p>
              <p className="proj-oh">
                <span className="proj-oh__inner">{p.text}</span>
              </p>
            </div>
            <ul className="proj-content__tags" aria-label="Technologies">
              {(TAGS[i] ?? []).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="proj-content__dots" aria-hidden="true">
              {PROJECTS.map((_, d) => (
                <i key={d} className={d === i ? "is-on" : d < i ? "is-past" : ""} />
              ))}
            </div>
          </div>
        ))}
        <button className="proj-content__back proj-unbutton" ref={backRef} type="button">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.4939 20.5644C11.1821 20.8372 10.7083 20.8056 10.4356 20.4939L3.43557 12.4939C3.18814 12.2111 3.18814 11.7889 3.43557 11.5061L10.4356 3.50613C10.7083 3.1944 11.1822 3.16281 11.4939 3.43557C11.8056 3.70834 11.8372 4.18216 11.5644 4.49388L5.65283 11.25L20 11.25C20.4142 11.25 20.75 11.5858 20.75 12C20.75 12.4142 20.4142 12.75 20 12.75L5.65283 12.75L11.5644 19.5061C11.8372 19.8179 11.8056 20.2917 11.4939 20.5644Z" />
          </svg>
          <span className="proj-oh__inner">Back</span>
        </button>
        <nav className="proj-content__nav-wrap">
          <button className="proj-content__nav proj-content__nav--prev proj-unbutton" ref={prevRef} type="button" aria-label="Previous project">
            <svg width="100" height="267" viewBox="0 0 100 267">
              <path d="M49.894 2.766v262.979" strokeLinecap="square" />
              <path fill="none" d="M99.75 76.596C73.902 76.596 52.62 43.07 49.895 0 47.168 43.07 25.886 76.596.036 76.596" />
            </svg>
          </button>
          <button className="proj-content__nav proj-content__nav--next proj-unbutton" ref={nextRef} type="button" aria-label="Next project">
            <svg width="100" height="267" viewBox="0 0 100 267">
              <path d="M49.894 2.766v262.979" strokeLinecap="square" />
              <path fill="none" d="M99.75 76.596C73.902 76.596 52.62 43.07 49.895 0 47.168 43.07 25.886 76.596.036 76.596" />
            </svg>
          </button>
        </nav>
      </div>

      <div className="proj-slides" ref={slidesRef} />

      <div className="proj-stack-wrap" ref={stackWrapRef}>
        <div className="proj-stack" ref={stackRef}>
          <div className="proj-stack__item proj-stack__item--empty" />
          {PROJECTS.map((p) => (
            <div className="proj-stack__item" key={p.image} style={{ backgroundImage: `url(${p.image})` }} />
          ))}
          <div className="proj-stack__item proj-stack__item--empty" />
        </div>
      </div>

            <div className="proj-title" ref={titleRef}>
        <svg className="proj-title__badge" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <path id="projBadgePath" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
          </defs>
          <text>
            <textPath href="#projBadgePath" textLength="284" lengthAdjust="spacing">
              SELECTED WORK • 2019 — PRESENT •
            </textPath>
          </text>
          <circle cx="60" cy="60" r="4" fill="#c87e4f" />
        </svg>

        <span className="proj-title__eyebrow proj-oh">
          <span className="proj-oh__inner">
            <b>{String(PROJECTS.length).padStart(2, "0")}</b> Selected work
          </span>
        </span>

        <h2 className="proj-title__main proj-oh">
          <span className="proj-oh__inner" data-text="Projects.">
            Projects<i className="proj-title__dot">.</i>
          </span>
        </h2>

        <span className="proj-title__sub proj-oh">
          <span className="proj-oh__inner">
            2019 &mdash; Present<i className="proj-title__pulse" />
          </span>
        </span>
      </div>
    </section>
  );
}