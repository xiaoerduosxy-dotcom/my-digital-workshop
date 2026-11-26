export default function AskJerryDots({ compact = false, active = false }: { compact?: boolean; active?: boolean }) {
  return (
    <span aria-hidden="true" data-active={active} className="ask-jerry-dots">
      {Array.from({ length: compact ? 6 : 17 }, (_, index) => (
        <span key={index} style={{ animationDelay: `${index * 18}ms` }} />
      ))}
    </span>
  );
}
