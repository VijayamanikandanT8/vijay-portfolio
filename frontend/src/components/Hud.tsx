export default function Hud() {
  return (
    <div className="hud" aria-hidden="true">
      <svg className="hud-ring hud-ring--outer" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="270" />
        <circle cx="300" cy="300" r="240" strokeDasharray="4 10" />
      </svg>
      <svg className="hud-ring hud-ring--mid" viewBox="0 0 600 600">
        <path d="M300 40 A260 260 0 0 1 560 300" />
        <path d="M40 300 A260 260 0 0 1 130 108" />
        <path d="M470 492 A260 260 0 0 1 300 560" />
      </svg>
      <svg className="hud-ring hud-ring--inner" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="150" strokeDasharray="2 6" />
      </svg>

      <div className="hud-brackets">
        <span className="hud-bracket hud-bracket--tl" />
        <span className="hud-bracket hud-bracket--tr" />
        <span className="hud-bracket hud-bracket--bl" />
        <span className="hud-bracket hud-bracket--br" />
      </div>

      <div className="hud-scanbeam" />

      <div className="hud-coords">
        <span>34.7°N 61.2°E</span>
        <span>NODE::VJY-07</span>
      </div>
    </div>
  );
}
