import { useRef } from "react";
import type { SiteInfo } from "../types/site";
import { Icon } from "../content/icons";

export default function PortraitScene({ site }: { site: SiteInfo }) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
  };

  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  };

  return (
    <div className="hero-portrait" onPointerMove={onMove} onPointerLeave={onLeave}>
      <svg className="portrait-frame-svg" viewBox="0 0 400 480" aria-hidden="true">
        <polyline className="frame-blue" points="20,140 20,20 140,20" />
        <polyline className="frame-blue" points="60,180 60,60 180,60" opacity="0.5" />
        <polyline className="frame-red" points="380,340 380,460 260,460" />
        <polyline className="frame-red" points="340,300 340,420 220,420" opacity="0.5" />
        <line className="frame-violet" x1="0" y1="240" x2="90" y2="240" />
        <line className="frame-violet" x1="310" y1="240" x2="400" y2="240" />
      </svg>

      <div className="portrait-glow" />
      <div className="portrait-glow--blue" />

      <div className="portrait-tilt" ref={tiltRef}>
        <img
          src="/images/hero-photo.png"
          alt={`Portrait of ${site.name}, ${site.heroTag}`}
          className="portrait-img"
        />
      </div>

      <div className="stat-card">
        <span className="stat-card-icon">{Icon.code}</span>
        <span className="stat-card-lines">
          <span className="stat-card-top">{site.badgeStackLine}</span>
          <span className="stat-card-bottom">{site.badgeRoleLine}</span>
        </span>
      </div>

      <div className="cursive-text" aria-hidden="true">
        <span>Code</span>
        <span>Build</span>
        <span>Innovate</span>
        <span className="cursive-underline" />
      </div>

      <div className="dot-grid dot-grid--top" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="dot-grid dot-grid--bottom" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="hero-status-chip">
        <span className="status-dot" />
        <span>{site.buildingNote}</span>
        <span className="hero-status-bar">
          <span className="hero-status-bar-fill" />
        </span>
      </div>
    </div>
  );
}