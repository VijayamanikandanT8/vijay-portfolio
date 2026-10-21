interface Props {
  active: boolean;
}

const LETTER_IMAGES = [
  { char: "V", src: "/images/letters/v.png" },
  { char: "I", src: "/images/letters/i.png" },
  { char: "J", src: "/images/letters/j.png" },
  { char: "A", src: "/images/letters/a.png" },
  { char: "Y", src: "/images/letters/y.png" },
];

export default function AssembledLogo({ active }: Props) {
  return (
    <div className={`assembled-logo ${active ? "assembled-logo--active" : ""}`} aria-hidden="true">
      {LETTER_IMAGES.map((letter, i) => (
        <img
          key={letter.char}
          src={letter.src}
          alt=""
          className="assembled-logo-letter"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}