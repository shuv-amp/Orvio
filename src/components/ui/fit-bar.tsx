/**
 * One component of a team match score, exposed as a real `meter` so the value
 * is announced rather than inferred from the width of a coloured bar.
 */
export function FitBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="fit-bar">
      <span className="fit-bar-head">
        <span>{label}</span>
        <strong>{value}%</strong>
      </span>
      <div
        className="bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value} percent`}
      >
        <i style={{ inlineSize: `${value}%` }} />
      </div>
    </div>
  );
}
