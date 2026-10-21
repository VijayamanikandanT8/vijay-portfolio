interface Props {
  active: boolean;
}

export default function IntroPortrait({ active }: Props) {
  return (
    <div className={`intro-portrait ${active ? "intro-portrait--active" : ""}`} aria-hidden="true">
      <div className="intro-portrait-glow" />
      <img src="/images/hero-photo.png" alt="" className="intro-portrait-img" />
      <div className="intro-portrait-scan" />
    </div>
  );
}