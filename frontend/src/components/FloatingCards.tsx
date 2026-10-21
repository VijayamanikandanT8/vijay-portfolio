export default function FloatingCards({ cards }: { cards: string[] }) {
  return (
    <div className="floating-cards" aria-hidden="true">
      {cards.map((label, i) => (
        <span key={label} className={`floating-card floating-card--${i}`}>
          {label}
        </span>
      ))}
    </div>
  );
}
