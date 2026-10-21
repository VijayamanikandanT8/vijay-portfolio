import { TechIcon } from "../content/icons";

interface OrbitCoreProps {
  monogram: string;
  labels: string[];
}

/**
 * An abstract, photo-free "avatar": a glowing monogram core with tech
 * icons orbiting it on independent rings. Pure CSS animation (rotate the
 * ring, counter-rotate the icon) so it keeps running at 60fps with no JS
 * per frame, and respects prefers-reduced-motion globally via index.css.
 */
export default function OrbitCore({ monogram, labels }: OrbitCoreProps) {
  const ring1 = labels.slice(0, 3);
  const ring2 = labels.slice(3);

  return (
    <div className="orbit-core">
      <div className="orbit-core-glow" />

      <div className="orbit-ring orbit-ring--1">
        {ring1.map((label, i) => (
          <div
            className="orbit-item"
            key={label}
            style={{ ["--angle" as string]: `${(360 / ring1.length) * i}deg` }}
          >
            <span className="orbit-icon" data-tech={label}>
              {TechIcon[label] ?? null}
            </span>
          </div>
        ))}
      </div>

      <div className="orbit-ring orbit-ring--2">
        {ring2.map((label, i) => (
          <div
            className="orbit-item"
            key={label}
            style={{ ["--angle" as string]: `${(360 / Math.max(ring2.length, 1)) * i + 40}deg` }}
          >
            <span className="orbit-icon" data-tech={label}>
              {TechIcon[label] ?? null}
            </span>
          </div>
        ))}
      </div>

      <div className="orbit-track orbit-track--1" />
      <div className="orbit-track orbit-track--2" />

      <div className="orbit-center">
        <span className="orbit-center-mono">{monogram}</span>
        <span className="orbit-center-ring" />
      </div>
    </div>
  );
}