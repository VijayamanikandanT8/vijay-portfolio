export function pauseOffscreenAnimations() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle("is-offscreen", !e.isIntersecting);
    },
    { rootMargin: "200px 0px" }
  );
  document.querySelectorAll("section").forEach((el) => io.observe(el));
  return () => io.disconnect();
}