import { useEffect, useLayoutEffect, useState } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { initSmoothScroll } from "./lib/smoothScroll";
import { pauseOffscreenAnimations } from "./lib/pauseOffscreen";
import { useSiteData } from "./hooks/useSiteData";
import { useNameFit } from "./hooks/useNameFit";
import IntroSequence from "./components/IntroSequence";
import HeroSection from "./components/HeroSection";
import ParallaxReveal from "./components/ParallaxReveal";
import AboutSection from "./components/Aboutsection";
import SkillsSection from "./components/SkillsSection";
import SkillsReveal from "./components/SkillsReveal";
import ProjectsSection from "./components/ProjectsSection";
import ExperienceSection from "./components/ExperienceSection";
import EducationSection from "./components/EducationSection";
import SectionTransition from "./components/SectionTransition";
import CertTransition from "./components/CertTransition";
import CertificationsSection from "./components/CertificationsSection";
import AchievementsSection from "./components/AchievementsSection";
import ServicesTransition from "./components/ServicesTransition";
import ServicesSection from "./components/ServicesSection";
import ContactSection from "./components/ContactSection";
import ScrollRail from "./components/ScrollRail";
import CustomCursor from "./components/CustomCursor";
import ResumePage from "./components/ResumePage";

export default function App() {
  // Pinned/GSAP sections measure the viewport once. Rebuild everything when the
  // viewport crosses the phone/desktop breakpoint (DevTools toggle, tablet rotate).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = () => window.location.reload();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const { data, error, loading } = useSiteData();
  // The resume is a page inside the app, opened with the link #/resume (works on any host)
  const [resumeOpen, setResumeOpen] = useState(() => window.location.hash === "#/resume");
  const [introDone, setIntroDone] = useState(() => window.location.hash === "#/resume");

  useEffect(() => {
    const onHash = () => setResumeOpen(window.location.hash === "#/resume");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Lock the page behind the resume. When it closes, always land on the Hero.
  useEffect(() => {
    if (!resumeOpen) return;
    document.body.classList.add("resume-lock");
    document.documentElement.classList.add("resume-lock");
    return () => {
      document.body.classList.remove("resume-lock");
      document.documentElement.classList.remove("resume-lock");
      window.__lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
      window.setTimeout(() => ScrollTrigger.refresh(), 100);
    };
  }, [resumeOpen]);

  const closeResume = () => {
    if (window.location.hash === "#/resume") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setResumeOpen(false);
  };

  // Lock scrolling for the whole intro, so nothing can move the page underneath it.
  useLayoutEffect(() => {
    if (introDone) return;
    const root = document.documentElement;
    root.classList.add("intro-lock");
    document.body.classList.add("intro-lock");
    window.scrollTo(0, 0);
    return () => {
      root.classList.remove("intro-lock");
      document.body.classList.remove("intro-lock");
    };
  }, [introDone]);

  // When the intro ends: always start from the Hero, then re-measure the pinned sections.
  useEffect(() => {
    if (!introDone) return;
    const toTop = () => {
      window.__lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    };
    toTop();
    ScrollTrigger.refresh();
    toTop();
    const t = window.setTimeout(() => {
      // safety net: if the layout shifted after the refresh, snap back (only if still near the top)
      if (window.scrollY < window.innerHeight * 1.5) toTop();
    }, 300);
    return () => window.clearTimeout(t);
  }, [introDone]);

    useEffect(() => initSmoothScroll(), []);

  useEffect(() => {
    if (loading || !data) return;
    return pauseOffscreenAnimations();
  }, [loading, data]);

  // keep the full name on one line in any big name heading
  useNameFit(data?.site.name);

  // Pinned sections (About, Certifications) shift the page layout whenever
  // ScrollTrigger refreshes. Tell scroll-linked components (Skills reveal)
  // to re-measure, so nothing is left stuck at a stale position.
  useEffect(() => {
    let last = 0;
    let raf = 0;
    const onRefresh = () => {
      const now = performance.now();
      if (now - last < 800) return; // guard against refresh loops
      if (/-lock\b/.test(document.body.className)) return; // never while a section is open
      last = now;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="boot-preload boot-preload--error" aria-busy="true">
        <p>Loading&hellip;<br />the server may take a few seconds to wake up.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="boot-preload boot-preload--error">
        <p>
          Couldn&rsquo;t reach the backend API{error ? `: ${error}` : ""}.
          <br />
          Make sure the Flask server is running (see backend/README.md).
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollRail />
      <CustomCursor />
      {!introDone && (
        <IntroSequence onComplete={() => setIntroDone(true)} />
      )}
      <HeroSection data={data} ready={introDone} />
      <ParallaxReveal name={data.site.name} />
      <AboutSection data={data} />
      <SkillsReveal>
        <SkillsSection />
      </SkillsReveal>
      <ProjectsSection />
      <ExperienceSection />
      <SectionTransition />
      <EducationSection />
      <CertTransition />
      <CertificationsSection />
      <AchievementsSection />
      <ServicesTransition />
      <ServicesSection email={data.site.email} />
      <ContactSection email={data.site.email} location={data.site.location} availability={data.site.availability} name={data.site.name} />
      {resumeOpen && (
        <ResumePage name={data.site.name} email={data.site.email} location={data.site.location} onBack={closeResume} />
      )}
    </>
  );
}
