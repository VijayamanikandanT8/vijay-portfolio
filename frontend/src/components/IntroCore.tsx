interface Props {
  active: boolean;
}

export default function IntroCore({ active }: Props) {
  return (
    <div className={`intro-core ${active ? "intro-core--active" : ""}`} aria-hidden="true">
      <div className="intro-core-halo" />
      <svg className="intro-core-rings" viewBox="0 0 400 400">
        <circle className="core-ring core-ring--a" cx="200" cy="200" r="150" />
        <circle className="core-ring core-ring--b" cx="200" cy="200" r="110" />
        <circle className="core-ring core-ring--c" cx="200" cy="200" r="70" />
        <polygon
          className="core-poly"
          points="200,90 292,150 292,250 200,310 108,250 108,150"
        />
      </svg>
      <div className="intro-core-glow" />
      <div className="intro-core-shards">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}